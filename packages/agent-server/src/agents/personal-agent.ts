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
import { ChatOpenAI } from "@langchain/openai";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";
import { config, resolveModelName } from "../config.js";
import { agentConfigStore } from "../store/agent-config-store.js";
import type { AgentConfigData } from "../store/agent-config-store.js";
import { chatLogStore } from "../store/chat-log-store.js";
import { articleStore } from "../store/article-store.js";
import { pendingTaskStore } from "../store/pending-task-store.js";
import { detectAndCreateTask } from "../services/task-manager.js";

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

// ══════════════════════════════════════════════════════════════
// 工具函数
// ══════════════════════════════════════════════════════════════

async function buildArticleContext(): Promise<string> {
  const { items } = await articleStore.list({
    status: "published",
    page: 1,
    pageSize: 20,
  });

  if (items.length === 0) return "";

  const lines = items.map(
    (a, i) =>
      `${i + 1}. 「${a.title}」${a.category ? `[${a.category}]` : ""} — ${a.summary || "暂无摘要"}`
  );

  return `\n\n以下是博客中已发布的文章列表，你可以根据这些信息回答访客的问题：\n${lines.join("\n")}`;
}

/**
 * 搜索文章正文并构建上下文
 * 根据用户消息中的关键词检索文章全文
 */
async function searchArticlesForContext(query: string): Promise<string> {
  // 提取关键词（去掉常见的提问词）
  const keywords = query
    .replace(/[?？!！。，、\n]/g, " ")
    .replace(/(你好|请问|帮我|告诉我|什么是|如何|怎么|有没有|关于|介绍|详细|讲讲|说说)/g, " ")
    .trim();

  if (!keywords) return "";

  // 用每个关键词片段搜索
  const searchTerms = keywords.split(/\s+/).filter((t) => t.length >= 2);
  if (searchTerms.length === 0) return "";

  // 搜索多个词，合并结果并去重
  const allResults = new Map<string, { slug: string; title: string; summary: string; content: string; category: string | null; tags: string[] }>();

  for (const term of searchTerms.slice(0, 3)) {
    const results = await articleStore.search(term, 2);
    for (const r of results) {
      if (!allResults.has(r.slug)) {
        allResults.set(r.slug, r);
      }
    }
  }

  if (allResults.size === 0) return "";

  // 构建文章上下文（截取相关段落，避免超长）
  const articles = Array.from(allResults.values()).slice(0, 3);
  const contextParts = articles.map((a) => {
    // 截取包含关键词的段落（前后各200字）
    let relevantContent = "";
    const lowerContent = a.content.toLowerCase();
    for (const term of searchTerms) {
      const idx = lowerContent.indexOf(term.toLowerCase());
      if (idx !== -1) {
        const start = Math.max(0, idx - 200);
        const end = Math.min(a.content.length, idx + term.length + 400);
        relevantContent += (start > 0 ? "..." : "") + a.content.slice(start, end) + (end < a.content.length ? "..." : "") + "\n\n";
        break; // 每篇文章只取第一段匹配
      }
    }
    // 如果没找到匹配段落，取摘要和前500字
    if (!relevantContent) {
      relevantContent = a.content.slice(0, 500) + (a.content.length > 500 ? "..." : "");
    }

    return `### 「${a.title}」${a.category ? ` [${a.category}]` : ""}
${a.summary ? `摘要：${a.summary}\n` : ""}相关内容：
${relevantContent}`;
  });

  return `\n\n──── 以下是与访客问题相关的博客文章内容 ────\n\n${contextParts.join("\n---\n\n")}\n\n请基于上述文章内容回答问题。如果文章中有相关信息，请引用并说明出自哪篇文章。`;
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

  // 3. chat 路由 — 直接流式调用 LLM（不走 StateGraph 的 chatNode）
  const agentConfig = result.agentConfig;
  if (!agentConfig) return;

  // 并行获取文章列表上下文和搜索匹配上下文
  const [articleContext, searchContext] = await Promise.all([
    buildArticleContext(),
    searchArticlesForContext(message),
  ]);
  const fullSystemPrompt = agentConfig.systemPrompt + articleContext + searchContext;

  const history = await chatLogStore.getSessionHistory(sessionId, 16);
  const llmMessages: (SystemMessage | HumanMessage | AIMessage)[] = [
    new SystemMessage(fullSystemPrompt),
  ];
  for (const log of history) {
    if (log.role === "user") llmMessages.push(new HumanMessage(log.content));
    else if (log.role === "assistant") llmMessages.push(new AIMessage(log.content));
  }
  llmMessages.push(new HumanMessage(message));

  // 记录用户消息
  await chatLogStore.log({ sessionId, role: "user", content: message, ip });

  const modelName = resolveModelName(agentConfig.modelName);
  const model = new ChatOpenAI({
    modelName,
    temperature: agentConfig.temperature,
    maxTokens: agentConfig.maxTokens,
    openAIApiKey: config.llmApiKey,
    configuration: { baseURL: config.llmBaseUrl },
    streaming: true,
  });

  let fullResponse = "";

  try {
    const stream = await model.stream(llmMessages);
    for await (const chunk of stream) {
      const text = typeof chunk.content === "string" ? chunk.content : "";
      if (text) {
        fullResponse += text;
        yield { type: "text", content: text };
      }
    }
  } catch (err) {
    console.error(`[PersonalAgent] Chat LLM error (model=${modelName}):`, err);
    if (!fullResponse) {
      const fallback = "抱歉，AI 暂时无法响应，请稍后重试。";
      fullResponse = fallback;
      yield { type: "text", content: fallback };
    }
  }

  // 记录 AI 回复
  if (fullResponse) {
    await chatLogStore.log({ sessionId, role: "assistant", content: fullResponse, ip });
  }
}
