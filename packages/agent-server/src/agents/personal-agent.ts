/**
 * 🧑‍💼 个人 Agent — LangGraph StateGraph 实现
 *
 * 架构：Supervisor Graph（条件路由 + 多节点）
 *
 *   [START] → [router] ──条件路由──→ [chat]          普通对话（主 LLM）
 *                                 → [task_create]   创建审批任务 + 推企微
 *                                 → [task_forward]  转发追加消息到企微
 *             ↓
 *           [END]
 *
 * 每个节点独立可测、上下文隔离：
 *   - chat 节点的历史只含 taskId=null 的消息
 *   - task_create / task_forward 的消息都带 taskId，不污染主对话
 *   - owner 回复走独立的 composeTaskReply（不在此图中）
 */

import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { resolveModelName } from "../config.js";
import { createChatModel } from "../telemetry/index.js";
import { agentConfigStore } from "../store/agent-config-store.js";
import type { AgentConfigData } from "../store/agent-config-store.js";
import { chatLogStore } from "../store/chat-log-store.js";
import { pendingTaskStore } from "../store/pending-task-store.js";
import { profileStore } from "../store/profile-store.js";
import { buildChatSystemPrompt } from "../data/default-agent-config.js";
import { detectAndCreateTask } from "../services/task-manager.js";
import { extractMessageText } from "../utils/llm-text.js";
import {
  visitorSiteTools,
  visitorSiteToolsByName,
} from "./site-tools.js";

/** 单轮对话最多工具调用轮数，防止死循环 */
const MAX_TOOL_ROUNDS = 6;

// ══════════════════════════════════════════════════════════════
// State 定义
// ══════════════════════════════════════════════════════════════

const PersonalAgentState = Annotation.Root({
  /** 访客消息 */
  message: Annotation<string>,
  /** 会话 ID */
  sessionId: Annotation<string>,
  /** 访客 IP */
  ip: Annotation<string>,
  /** Agent 配置（router 节点加载） */
  agentConfig: Annotation<AgentConfigData | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  /** 路由决策 */
  route: Annotation<"chat" | "task_create" | "disabled">({
    reducer: (_prev, next) => next,
    default: () => "chat",
  }),
  /** 输出 token 列表（每个元素是一个 StreamToken） */
  outputTokens: Annotation<StreamToken[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
});

// ══════════════════════════════════════════════════════════════
// 类型导出
// ══════════════════════════════════════════════════════════════

export interface PersonalAgentStreamOptions {
  message: string;
  sessionId: string;
  ip: string;
}

export interface StreamToken {
  type: "text" | "task_created";
  content: string;
  taskId?: string;
}

async function executeToolCall(name: string, args: unknown): Promise<string> {
  const selected = visitorSiteToolsByName[name];
  if (!selected) {
    return JSON.stringify({ error: `未知工具: ${name}` });
  }
  try {
    const result = await selected.invoke(
      (args ?? {}) as Record<string, unknown>
    );
    return typeof result === "string" ? result : JSON.stringify(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[PersonalAgent] Tool ${name} failed:`, err);
    return JSON.stringify({ error: message });
  }
}

// ══════════════════════════════════════════════════════════════
// 节点定义
// ══════════════════════════════════════════════════════════════

/**
 * Router 节点 — 加载配置 + 意图检测 + 决定路由
 *
 * 访客和 task 的交互通过独立的追问卡片 + 专用接口完成，
 * 不经过主 Agent。主 Agent 只负责：
 *   1. 创建新 task（意图检测命中时）
 *   2. 普通对话
 */
async function routerNode(
  state: typeof PersonalAgentState.State
): Promise<Partial<typeof PersonalAgentState.State>> {
  const { sessionId, message } = state;

  // 1. 加载 Agent 配置
  const agentConfig = await agentConfigStore.get();
  if (!agentConfig || !agentConfig.enabled) {
    return {
      agentConfig,
      route: "disabled",
      outputTokens: [{ type: "text", content: "抱歉，AI 助手当前未启用。" }],
    };
  }

  // 2. 意图检测 — 没有活跃 task 时才可能创建新 task
  const activeTask = await pendingTaskStore.findActiveBySession(sessionId);
  if (!activeTask) {
    try {
      const taskResult = await detectAndCreateTask(sessionId, message, state.ip);
      if (taskResult) {
        return {
          agentConfig,
          route: "task_create",
          outputTokens: [{
            type: "task_created",
            content: taskResult.ackMessage,
            taskId: taskResult.taskId,
          }],
        };
      }
    } catch (err) {
      console.error("[PersonalAgent] Task intent detection failed:", err);
    }
  }

  // 4. 普通对话
  return { agentConfig, route: "chat" };
}

/**
 * Task Create 节点 — 任务已在 router 中创建，这里只记录日志
 */
async function taskCreateNode(
  state: typeof PersonalAgentState.State
): Promise<Partial<typeof PersonalAgentState.State>> {
  const { message, sessionId, ip, outputTokens } = state;

  const taskToken = outputTokens.find((t) => t.type === "task_created");

  // 写主对话记录（taskId=null，刷新后能恢复）
  await chatLogStore.log({ sessionId, role: "user", content: message, ip });
  if (taskToken?.content) {
    await chatLogStore.log({ sessionId, role: "assistant", content: taskToken.content, ip });
  }

  return {};
}

// ══════════════════════════════════════════════════════════════
// 构建 StateGraph
// ══════════════════════════════════════════════════════════════

function buildPersonalAgentGraph() {
  const graph = new StateGraph(PersonalAgentState)
    .addNode("router", routerNode)
    .addNode("task_create", taskCreateNode)

    .addEdge(START, "router")

    .addConditionalEdges("router", (state) => {
      switch (state.route) {
        case "task_create":
          return "task_create";
        default:
          // chat 和 disabled 都直接结束（chat 由 personalAgentStream 处理流式）
          return END;
      }
    })

    .addEdge("task_create", END)

    .compile();

  return graph;
}

// ══════════════════════════════════════════════════════════════
// 对外接口（流式输出）
// ══════════════════════════════════════════════════════════════

/**
 * 个人 Agent 流式对话
 *
 * 路由决策由 StateGraph 驱动，LLM 对话直接流式调用。
 */
export async function* personalAgentStream(
  options: PersonalAgentStreamOptions
): AsyncGenerator<StreamToken> {
  const { message, sessionId, ip } = options;

  // 1. 用 StateGraph 做路由决策
  const graph = buildPersonalAgentGraph();
  const result = await graph.invoke({ message, sessionId, ip });

  // 2. 如果是 task_create 或 disabled，直接 yield 结果
  if (result.route !== "chat") {
    const tokens = result.outputTokens || [];
    for (const token of tokens) {
      yield token;
    }
    return;
  }

  // 3. chat 路由 — 工具调用轮 + 最终流式回答
  const agentConfig = result.agentConfig;
  if (!agentConfig) return;

  const profile = await profileStore.ensureDefault();
  const fullSystemPrompt = buildChatSystemPrompt(
    agentConfig.systemPrompt,
    profile.name
  );

  const history = await chatLogStore.getSessionHistory(sessionId, 16);
  const llmMessages: (SystemMessage | HumanMessage | AIMessage | ToolMessage)[] =
    [new SystemMessage(fullSystemPrompt)];
  for (const log of history) {
    if (log.role === "user") llmMessages.push(new HumanMessage(log.content));
    else if (log.role === "assistant")
      llmMessages.push(new AIMessage(log.content));
  }
  llmMessages.push(new HumanMessage(message));

  // 记录用户消息
  await chatLogStore.log({ sessionId, role: "user", content: message, ip });

  const modelName = resolveModelName(agentConfig.modelName);
  const model = createChatModel({
    agent: "personal-agent",
    modelName,
    temperature: agentConfig.temperature,
    maxTokens: agentConfig.maxTokens,
    streaming: true,
    modelKwargs: { stream_options: { include_usage: false } },
  });
  const modelWithTools = model.bindTools(visitorSiteTools);

  let fullResponse = "";

  try {
    // 工具轮：非流式，按需读站点资料；有最终文本后再流式输出体验更好，
    // 这里对「无 tool_calls」的一轮直接 stream，避免整段蹦字。
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      // 先探测是否还要调工具（短 invoke）；若要调则执行后继续
      const probe = await modelWithTools.invoke(llmMessages);
      const toolCalls = probe.tool_calls ?? [];

      if (toolCalls.length > 0) {
        llmMessages.push(probe);
        for (const call of toolCalls) {
          const observation = await executeToolCall(call.name, call.args);
          llmMessages.push(
            new ToolMessage({
              content: observation,
              tool_call_id: call.id ?? call.name,
            })
          );
        }
        continue;
      }

      // 无工具调用：用 probe 的文本作为回答（再 stream 会多打一枪）
      const text = extractMessageText(probe.content);
      if (text) {
        fullResponse = text;
        yield { type: "text", content: text };
      }
      break;
    }

    // 工具轮用尽仍无文本时，再 stream / invoke 兜底
    if (!fullResponse) {
      const stream = await modelWithTools.stream(llmMessages);
      for await (const chunk of stream) {
        const text = extractMessageText(chunk.content);
        if (text) {
          fullResponse += text;
          yield { type: "text", content: text };
        }
      }
    }

    if (!fullResponse) {
      const fallbackMsg = await modelWithTools.invoke(llmMessages);
      const text = extractMessageText(fallbackMsg.content);
      if (text) {
        fullResponse = text;
        yield { type: "text", content: text };
      }
    }
  } catch (err) {
    console.error(`[PersonalAgent] Chat LLM error (model=${modelName}):`, err);
    if (!fullResponse) {
      try {
        const fallbackMsg = await modelWithTools.invoke(llmMessages);
        const text = extractMessageText(fallbackMsg.content);
        if (text) {
          fullResponse = text;
          yield { type: "text", content: text };
        }
      } catch (invokeErr) {
        console.error(
          `[PersonalAgent] Chat LLM invoke fallback failed:`,
          invokeErr
        );
      }
    }
    if (!fullResponse) {
      const fallback = "抱歉，AI 暂时无法响应，请稍后重试。";
      fullResponse = fallback;
      yield { type: "text", content: fallback };
    }
  }

  // 记录 AI 回复
  if (fullResponse) {
    await chatLogStore.log({
      sessionId,
      role: "assistant",
      content: fullResponse,
      ip,
    });
  }
}
