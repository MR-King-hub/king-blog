/**
 * 📋 Task Sub Agent — LangGraph StateGraph 实现
 *
 * 独立于主对话的任务处理 Agent，通过企微和 owner 多轮交互。
 *
 * 状态图：
 *
 *   [START] → [analyze] → [END]              创建任务时：分析请求 + 生成提案
 *
 *   [START] → [process_reply] → [decide]     收到 owner 回复时：
 *                                  │
 *                    ┌─ "resolved" ─┤─ "needs_info" ─┐
 *                    ▼              │                 ▼
 *                [compose]          │         [ask_more_info]
 *                    │              │                 │
 *                    ▼              │                 ▼
 *                 [END]             │              [END]
 *
 * 关键设计：
 *   - 每个 task 有独立的 conversationHistory（存 DB）
 *   - 上下文完全隔离，不受主会话影响
 *   - owner 30 分钟后回复也能精准理解
 *   - 访客追加的消息也会注入上下文
 */

import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { config, resolveModelName } from "../config.js";
import { agentConfigStore } from "../store/agent-config-store.js";

// ══════════════════════════════════════════════════════════════
// 类型定义
// ══════════════════════════════════════════════════════════════

export type TaskType =
  | "interview_schedule"
  | "referral_request"
  | "contact_request"
  | "collaboration"
  | "general_approval";

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  interview_schedule: "面试预约",
  referral_request: "内推请求",
  contact_request: "索要联系方式",
  collaboration: "商务合作",
  general_approval: "需要确认",
};

/** 对话历史中的一条消息 */
export interface TaskMessage {
  role: "system" | "owner" | "agent" | "visitor";
  content: string;
  timestamp: string;
}

export interface GenerateProposalInput {
  taskType: TaskType;
  visitorRequest: string;
}

export interface ProposalResult {
  summary: string;
  proposal: string;
  visitorAck: string;
  /** 需要向访客收集的信息（空字符串表示信息已足够） */
  missingInfoQuestion: string;
}

export interface HandleReplyInput {
  taskType: TaskType;
  visitorRequest: string;
  ownerReply: string;
  conversationHistory: TaskMessage[];
  visitorMessages: string[];
}

export interface HandleReplyResult {
  /** agent 的决策 */
  decision: "resolved" | "needs_info" | "ask_visitor";
  /** 给访客的最终回复（decision=resolved 时） */
  finalReply?: string;
  /** 给 owner 的追问（decision=needs_info 时） */
  followUpQuestion?: string;
  /** 给访客的追问（decision=ask_visitor 时） */
  visitorQuestion?: string;
  /** 更新后的对话历史 */
  updatedHistory: TaskMessage[];
}

// ══════════════════════════════════════════════════════════════
// 工具函数
// ══════════════════════════════════════════════════════════════

async function createModel(temperature = 0.3, maxTokens = 800) {
  const agentConfig = await agentConfigStore.get();
  return new ChatOpenAI({
    modelName: resolveModelName(agentConfig?.modelName),
    temperature,
    maxTokens,
    openAIApiKey: config.llmApiKey,
    configuration: { baseURL: config.llmBaseUrl },
  });
}

// ══════════════════════════════════════════════════════════════
// 提案生成（创建 task 时调用）
// ══════════════════════════════════════════════════════════════

export async function generateTaskProposal(
  input: GenerateProposalInput
): Promise<ProposalResult> {
  const { taskType, visitorRequest } = input;
  const label = TASK_TYPE_LABELS[taskType] || taskType;

  const model = await createModel(0.3, 800);

  const messages = [
    new SystemMessage(
      `你是博主 Shizhe 的个人网站上的任务协调助手。

⚠️ 关键角色关系（绝对不能搞反）：
- 博主 Shizhe = 被面试者/候选人/被邀约的人
- 访客 = 面试官/HR/猎头/招聘方/合作方/来邀请博主的人
- 访客来到博主的网站，是来邀请/联系博主的

任务类型：${label}。请生成：

1. summary: 摘要（50字以内），给博主看
2. proposal: 建议方案（100字以内）
3. visitorAck: 给访客的即时回复（50字以内），态度是"感谢您的邀请/关注"
4. missingInfoQuestion: 只在最关键信息缺失时追问访客一个问题：
   - 面试类：如果访客没说公司名称，问"方便告知是哪家公司吗？"
   - 合作类：如果没说合作方向，问一下
   - 其他：一般不追问，设为 ""
   注意：追问语气是"请问您这边是哪家公司？"，不是"你想面试哪个部门"（那是问候选人的话）

JSON 格式输出：
{"summary":"...","proposal":"...","visitorAck":"...","missingInfoQuestion":"..."}`
    ),
    new HumanMessage(`访客请求：${visitorRequest}`),
  ];

  try {
    const result = await model.invoke(messages);
    const text = typeof result.content === "string" ? result.content : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || `[${label}] ${visitorRequest.slice(0, 50)}`,
        proposal: parsed.proposal || visitorRequest,
        visitorAck: parsed.visitorAck || "收到您的请求，正在处理~",
        missingInfoQuestion: parsed.missingInfoQuestion || "",
      };
    }
  } catch (err) {
    console.error("Task proposal generation error:", err);
  }

  return {
    summary: `[${label}] ${visitorRequest.slice(0, 50)}`,
    proposal: visitorRequest,
    visitorAck: "收到您的请求，正在处理~",
    missingInfoQuestion: "",
  };
}

// ══════════════════════════════════════════════════════════════
// 访客回复分析（信息收集阶段）
// ══════════════════════════════════════════════════════════════

/**
 * 分析访客补充的信息，判断是否还需要继续收集
 */
export async function analyzeVisitorReply(input: {
  taskType: TaskType;
  visitorRequest: string;
  visitorMessages: string[];
  latestReply: string;
}): Promise<{ sufficient: boolean; nextQuestion: string; summary: string }> {
  const { taskType, visitorRequest, visitorMessages, latestReply } = input;
  const label = TASK_TYPE_LABELS[taskType] || taskType;
  const model = await createModel(0.2, 500);
  const allInfo = [visitorRequest, ...visitorMessages, latestReply].join("\n");

  const messages = [
    new SystemMessage(
      `你是任务协调助手。博主是候选人，访客是面试官/HR/合作方。

任务类型：${label}
访客提供的所有信息：
${allInfo}

判断是否足够通知博主：
- 面试类：至少需要公司名称和岗位
- 合作类：至少需要合作方向
- 联系方式类：至少需要目的

JSON 格式回复：
{"sufficient": true/false, "nextQuestion": "不足时的追问", "summary": "已收集信息汇总（100字内）"}`
    ),
    new HumanMessage("请分析。"),
  ];

  try {
    const result = await model.invoke(messages);
    const text = typeof result.content === "string" ? result.content : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        sufficient: !!parsed.sufficient,
        nextQuestion: parsed.nextQuestion || "",
        summary: parsed.summary || allInfo.slice(0, 100),
      };
    }
  } catch (err) {
    console.error("[TaskAgent] analyzeVisitorReply error:", err);
  }

  return { sufficient: true, nextQuestion: "", summary: allInfo.slice(0, 100) };
}

// ══════════════════════════════════════════════════════════════
// Owner 回复处理 StateGraph
// ══════════════════════════════════════════════════════════════

const TaskReplyState = Annotation.Root({
  /** 任务类型 */
  taskType: Annotation<string>,
  /** 访客原始请求 */
  visitorRequest: Annotation<string>,
  /** AI 之前的提案 */
  proposal: Annotation<string>,
  /** owner 本次回复 */
  ownerReply: Annotation<string>,
  /** 之前的对话历史 */
  conversationHistory: Annotation<TaskMessage[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  /** 访客追加消息 */
  visitorMessages: Annotation<string[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  /** Agent 的决策 */
  decision: Annotation<"resolved" | "needs_info" | "ask_visitor">({
    reducer: (_prev, next) => next,
    default: () => "resolved",
  }),
  /** 给访客的最终回复 */
  finalReply: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  /** 给 owner 的追问 */
  followUpQuestion: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  /** 给访客的追问（owner 要求向访客询问信息） */
  visitorQuestion: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
});

/**
 * process_reply 节点 — 分析 owner 的回复，决定下一步
 *
 * 将 owner 的回复加入对话历史，然后让 LLM 判断：
 *   - 信息是否足够给访客一个明确答复？
 *   - 还是需要向 owner 追问更多信息？
 */
async function processReplyNode(
  state: typeof TaskReplyState.State
): Promise<Partial<typeof TaskReplyState.State>> {
  const { taskType, visitorRequest, proposal, ownerReply,
          conversationHistory, visitorMessages } = state;
  const label = TASK_TYPE_LABELS[taskType as TaskType] || taskType;

  // 把 owner 回复加入历史
  const updatedHistory: TaskMessage[] = [
    ...conversationHistory,
    { role: "owner", content: ownerReply, timestamp: new Date().toISOString() },
  ];

  // 构建上下文给 LLM
  const model = await createModel(0.2, 500);

  const contextParts = [
    `任务类型：${label}`,
    `访客原始请求：${visitorRequest}`,
    `AI 提案：${proposal}`,
  ];

  if (visitorMessages.length > 0) {
    contextParts.push(`访客追加消息：\n${visitorMessages.map((m, i) => `  ${i + 1}. ${m}`).join("\n")}`);
  }

  if (conversationHistory.length > 0) {
    const historyText = conversationHistory
      .map((m) => `[${m.role}] ${m.content}`)
      .join("\n");
    contextParts.push(`之前的对话：\n${historyText}`);
  }

  contextParts.push(`博主最新回复：${ownerReply}`);

  const messages = [
    new SystemMessage(
      `你是一个任务协调助手，帮博主处理访客请求。

${contextParts.join("\n\n")}

请判断博主的回复属于以下哪种情况：

1. **resolved** — 博主明确同意/拒绝/给出了具体安排，可以直接回复访客
2. **ask_visitor** — 博主要求你去问访客某些信息（如"问问他哪个公司的"、"让他发简历"等）
3. **needs_info** — 博主自身的回复不够明确，需要追问博主补充细节

请以 JSON 格式回复：
{"decision": "resolved" 或 "ask_visitor" 或 "needs_info", "reason": "简要说明"}`
    ),
    new HumanMessage("请分析并决策。"),
  ];

  try {
    const result = await model.invoke(messages);
    const text = typeof result.content === "string" ? result.content : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const decision = ["resolved", "needs_info", "ask_visitor"].includes(parsed.decision)
        ? parsed.decision
        : "resolved";
      return {
        decision,
        conversationHistory: updatedHistory,
      };
    }
  } catch (err) {
    console.error("[TaskAgent] process_reply error:", err);
  }

  // 兜底：默认 resolved
  return { decision: "resolved", conversationHistory: updatedHistory };
}

/**
 * compose 节点 — 组装给访客的最终回复
 *
 * 使用完整的对话历史（独立上下文），生成友好的通知。
 */
async function composeNode(
  state: typeof TaskReplyState.State
): Promise<Partial<typeof TaskReplyState.State>> {
  const { taskType, visitorRequest, proposal, conversationHistory, visitorMessages } = state;
  const label = TASK_TYPE_LABELS[taskType as TaskType] || taskType;

  // 从历史中拿 owner 的所有回复
  const ownerReplies = conversationHistory
    .filter((m) => m.role === "owner")
    .map((m) => m.content);

  const model = await createModel(0.5, 500);

  const contextParts = [`任务类型：${label}`, `访客原始请求：${visitorRequest}`];
  if (visitorMessages.length > 0) {
    contextParts.push(`访客补充信息：${visitorMessages.join("；")}`);
  }
  contextParts.push(`AI 提案：${proposal}`);
  contextParts.push(`博主回复：${ownerReplies.join(" → ")}`);

  const messages = [
    new SystemMessage(
      `你是博主 Shizhe 的 AI 助手。博主是候选人/被邀约方，访客是面试官/HR/合作方。
根据以下信息，生成一条给访客的友好通知。

${contextParts.join("\n")}

要求：
- 语气是感谢对方邀请/关注的态度
- 把博主的回复转化为清晰的通知
- 不要编造博主没说过的内容
- 150 字以内
- 直接输出文本`
    ),
    new HumanMessage("请生成给访客的回复。"),
  ];

  try {
    const result = await model.invoke(messages);
    const text = typeof result.content === "string" ? result.content : "";
    if (text.trim()) {
      const updatedHistory: TaskMessage[] = [
        ...state.conversationHistory,
        { role: "agent", content: `[给访客] ${text.trim()}`, timestamp: new Date().toISOString() },
      ];
      return { finalReply: text.trim(), conversationHistory: updatedHistory };
    }
  } catch (err) {
    console.error("[TaskAgent] compose error:", err);
  }

  const fallback = `作者回复：${ownerReplies[ownerReplies.length - 1] || "已确认"}`;
  return { finalReply: fallback };
}

/**
 * ask_more_info 节点 — 生成给 owner 的追问
 *
 * 当 owner 的回复不够明确时，生成一个追问发到企微。
 */
async function askMoreInfoNode(
  state: typeof TaskReplyState.State
): Promise<Partial<typeof TaskReplyState.State>> {
  const { taskType, visitorRequest, proposal, conversationHistory, visitorMessages } = state;
  const label = TASK_TYPE_LABELS[taskType as TaskType] || taskType;

  const ownerReplies = conversationHistory
    .filter((m) => m.role === "owner")
    .map((m) => m.content);

  const model = await createModel(0.3, 300);

  const contextParts = [
    `任务类型：${label}`,
    `访客请求：${visitorRequest}`,
  ];
  if (visitorMessages.length > 0) {
    contextParts.push(`访客补充：${visitorMessages.join("；")}`);
  }
  contextParts.push(`博主已回复：${ownerReplies.join(" → ")}`);

  const messages = [
    new SystemMessage(
      `你是博主的任务助手。博主的回复不够明确，需要追问更多细节才能回复访客。

${contextParts.join("\n")}

请生成一条简短的追问（50字以内），直接问博主需要补充的关键信息。
语气像同事对话，简洁直接。
直接输出追问文本。`
    ),
    new HumanMessage("请生成追问。"),
  ];

  try {
    const result = await model.invoke(messages);
    const text = typeof result.content === "string" ? result.content : "";
    if (text.trim()) {
      const updatedHistory: TaskMessage[] = [
        ...state.conversationHistory,
        { role: "agent", content: text.trim(), timestamp: new Date().toISOString() },
      ];
      return { followUpQuestion: text.trim(), conversationHistory: updatedHistory };
    }
  } catch (err) {
    console.error("[TaskAgent] ask_more_info error:", err);
  }

  return { followUpQuestion: "能再补充一下具体细节吗？", decision: "resolved" };
}

/**
 * ask_visitor 节点 — 生成给访客的追问
 *
 * 当 owner 要求向访客收集信息时（如"问问他哪个公司的"），
 * 生成一条友好的追问，通过主对话发给访客。
 */
async function askVisitorNode(
  state: typeof TaskReplyState.State
): Promise<Partial<typeof TaskReplyState.State>> {
  const { taskType, visitorRequest, conversationHistory, visitorMessages } = state;
  const label = TASK_TYPE_LABELS[taskType as TaskType] || taskType;

  const ownerReplies = conversationHistory
    .filter((m) => m.role === "owner")
    .map((m) => m.content);

  const model = await createModel(0.5, 300);

  const contextParts = [
    `任务类型：${label}`,
    `访客请求：${visitorRequest}`,
  ];
  if (visitorMessages.length > 0) {
    contextParts.push(`访客已补充：${visitorMessages.join("；")}`);
  }
  contextParts.push(`博主指示：${ownerReplies[ownerReplies.length - 1] || ""}`);

  const messages = [
    new SystemMessage(
      `你是博主的 AI 助手。博主希望你向访客询问一些信息。

${contextParts.join("\n")}

请生成一条友好的追问（80字以内），自然地向访客索取博主需要的信息。
语气亲切，像客服一样。
直接输出追问文本。`
    ),
    new HumanMessage("请生成给访客的追问。"),
  ];

  try {
    const result = await model.invoke(messages);
    const text = typeof result.content === "string" ? result.content : "";
    if (text.trim()) {
      const updatedHistory: TaskMessage[] = [
        ...state.conversationHistory,
        { role: "agent", content: `[问访客] ${text.trim()}`, timestamp: new Date().toISOString() },
      ];
      return { visitorQuestion: text.trim(), conversationHistory: updatedHistory };
    }
  } catch (err) {
    console.error("[TaskAgent] ask_visitor error:", err);
  }

  return { visitorQuestion: "作者想了解一些更多细节，方便补充一下吗？" };
}

// ══════════════════════════════════════════════════════════════
// 构建 StateGraph
// ══════════════════════════════════════════════════════════════

function buildTaskReplyGraph() {
  return new StateGraph(TaskReplyState)
    .addNode("process_reply", processReplyNode)
    .addNode("compose", composeNode)
    .addNode("ask_more_info", askMoreInfoNode)
    .addNode("ask_visitor", askVisitorNode)

    .addEdge(START, "process_reply")

    // 条件路由：根据 decision 走不同路径
    .addConditionalEdges("process_reply", (state) => {
      if (state.decision === "needs_info") return "ask_more_info";
      if (state.decision === "ask_visitor") return "ask_visitor";
      return "compose";
    })

    .addEdge("compose", END)
    .addEdge("ask_more_info", END)
    .addEdge("ask_visitor", END)

    .compile();
}

// ══════════════════════════════════════════════════════════════
// 对外接口
// ══════════════════════════════════════════════════════════════

/**
 * 处理 owner 的回复（StateGraph 驱动）
 *
 * 返回决策结果 + 更新后的对话历史。
 * 调用方（task-manager）根据 decision 决定：
 *   - resolved → 写 chatLog + resolve task
 *   - needs_info → 把追问发到企微，等 owner 下一轮回复
 */
export async function handleTaskReply(
  input: HandleReplyInput
): Promise<HandleReplyResult> {
  const graph = buildTaskReplyGraph();

  const result = await graph.invoke({
    taskType: input.taskType,
    visitorRequest: input.visitorRequest,
    proposal: "",
    ownerReply: input.ownerReply,
    conversationHistory: input.conversationHistory,
    visitorMessages: input.visitorMessages,
  });

  return {
    decision: result.decision,
    finalReply: result.finalReply || undefined,
    followUpQuestion: result.followUpQuestion || undefined,
    visitorQuestion: result.visitorQuestion || undefined,
    updatedHistory: result.conversationHistory,
  };
}

/**
 * 兼容旧接口（composeTaskReply）
 * 直接走 compose 节点，不做 decision 判断
 */
export async function composeTaskReply(input: {
  taskType: TaskType;
  visitorRequest: string;
  proposal: string;
  ownerReply: string;
}): Promise<string> {
  const result = await handleTaskReply({
    taskType: input.taskType,
    visitorRequest: input.visitorRequest,
    ownerReply: input.ownerReply,
    conversationHistory: [],
    visitorMessages: [],
  });

  return result.finalReply || `作者回复：${input.ownerReply}`;
}
