/**
 * 📋 Task Manager — 任务调度中心
 *
 * 整合 Task Sub Agent + PendingTaskStore + IM 推送 + 消息记录。
 * 提供完整的任务生命周期管理：
 *
 *   1. detectAndCreateTask  — 检测访客意图 + 创建任务 + 推 IM + 回 ACK
 *   2. handleOwnerReply     — 处理 owner 在 IM 的回复 → Sub Agent 组装 → 写入消息流
 *   3. detectTaskIntent     — 用 LLM 检测是否需要创建任务
 */

import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { config, resolveModelName } from "../config.js";
import { agentConfigStore } from "../store/agent-config-store.js";
import { pendingTaskStore } from "../store/pending-task-store.js";
import { chatLogStore } from "../store/chat-log-store.js";
import {
  generateTaskProposal,
  handleTaskReply,
  TASK_TYPE_LABELS,
  type TaskType,
  type TaskMessage,
} from "../agents/task-agent.js";
import { sendImNotification } from "./im-service.js";

/** 意图检测结果 */
export interface TaskIntentResult {
  /** 是否需要创建任务 */
  needsTask: boolean;
  /** 任务类型 */
  taskType?: TaskType;
  /** 提取的关键请求信息 */
  extractedRequest?: string;
}

/**
 * 关键词预过滤 — 快速判断消息是否可能需要 task
 * 只有命中关键词才走 LLM 意图检测，其余直接跳过（0 延迟）
 */
const TASK_KEYWORDS = [
  // 面试
  "面试", "面聊", "约个时间", "视频聊", "电话聊", "技术面",
  // 内推
  "内推", "推荐", "推一下", "帮忙推", "投简历",
  // 联系方式
  "微信", "手机号", "电话", "邮箱", "联系方式", "加个好友", "怎么联系",
  // 合作
  "合作", "商务", "广告", "赞助", "推广",
  // 通用
  "约一下", "能见面", "线下聊",
  // 转达/传话
  "帮我问", "问问他", "问一下", "转告", "转达", "告诉他", "告诉作者",
  "在不在", "上班", "有空", "方便", "能不能",
];

function mightNeedTask(message: string): boolean {
  const lower = message.toLowerCase();
  return TASK_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * 用 LLM 检测访客消息是否包含需要 owner 审批的意图
 * 前置关键词过滤，绝大多数普通消息 0ms 返回
 */
export async function detectTaskIntent(
  userMessage: string
): Promise<TaskIntentResult> {
  // 快速过滤：不含关键词 → 直接跳过
  if (!mightNeedTask(userMessage)) {
    return { needsTask: false };
  }

  const agentConfig = await agentConfigStore.get();
  const model = new ChatOpenAI({
    modelName: resolveModelName(agentConfig?.modelName),
    temperature: 0,
    maxTokens: 300,
    openAIApiKey: config.llmApiKey,
    configuration: { baseURL: config.llmBaseUrl },
  });

  const messages = [
    new SystemMessage(
      `你是一个意图检测器。判断访客的消息是否包含以下需要博主本人确认的意图：

1. interview_schedule — 面试预约、约时间聊、视频面试
2. referral_request — 内推、推荐工作
3. contact_request — 索要微信/手机/邮箱等联系方式
4. collaboration — 商务合作、广告合作、赞助
5. general_approval — 其他需要博主亲自确认的请求

如果是普通闲聊、技术问题、博客内容咨询，则不需要创建任务。

请严格以 JSON 格式输出：
{"needsTask": true/false, "taskType": "类型", "extractedRequest": "提取的关键请求"}

如果不需要任务：{"needsTask": false}`
    ),
    new HumanMessage(userMessage),
  ];

  try {
    const result = await model.invoke(messages);
    const text = typeof result.content === "string" ? result.content : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        needsTask: !!parsed.needsTask,
        taskType: parsed.taskType as TaskType | undefined,
        extractedRequest: parsed.extractedRequest,
      };
    }
  } catch (err) {
    console.error("Task intent detection error:", err);
  }

  return { needsTask: false };
}

/**
 * 检测意图 + 创建任务 + 推送 IM + 返回 ACK 消息
 *
 * 如果不需要创建任务，返回 null（主 Agent 正常回复）。
 * 如果需要，返回给访客的即时确认消息（"已通知作者..."）。
 */
export async function detectAndCreateTask(
  sessionId: string,
  userMessage: string,
  ip: string
): Promise<{ taskId: string; ackMessage: string } | null> {
  // 0. 如果该 session 最近有任务（waiting_owner 或 5 分钟内 resolved），
  //    不重复创建 — 避免 owner 回复时串 id
  const recentTask = await pendingTaskStore.findRecentBySession(sessionId, 5);
  if (recentTask) {
    console.log(`[TaskManager] session ${sessionId.slice(0, 8)} 已有最近任务 ${recentTask.id} (${recentTask.status})，跳过创建`);
    return null;
  }

  // 1. 检测意图
  const intent = await detectTaskIntent(userMessage);
  if (!intent.needsTask || !intent.taskType) return null;

  // 2. 生成提案（Sub Agent 独立上下文）
  const proposal = await generateTaskProposal({
    taskType: intent.taskType,
    visitorRequest: intent.extractedRequest || userMessage,
  });

  // 3. 创建任务记录
  //    如果需要收集信息，初始状态为 collecting_info
  const needsCollection = !!proposal.missingInfoQuestion;
  const task = await pendingTaskStore.create({
    sessionId,
    type: intent.taskType,
    visitorRequest: intent.extractedRequest || userMessage,
    proposal: proposal.proposal,
  });

  if (needsCollection) {
    // 需要向访客收集信息 → 设置 pendingVisitorQuestion，不推企微
    await pendingTaskStore.setPendingVisitorQuestion(task.id, proposal.missingInfoQuestion);
    // 追问写入 chatLog（role=system + taskId，不会被 getTaskNotifications 捞出）
    await chatLogStore.log({
      sessionId,
      role: "system",
      content: proposal.missingInfoQuestion,
      ip,
      taskId: task.id,
    });
    console.log(`[TaskManager] Task ${task.id}: collecting info, asking visitor: ${proposal.missingInfoQuestion}`);
  } else {
    // 信息已足够 → 直接推企微
    const label = TASK_TYPE_LABELS[intent.taskType] || intent.taskType;
    const imMessage = `📋 [${label}]\n\n${proposal.summary}\n\n💡 建议：${proposal.proposal}\n\n🔗 任务 ID: ${task.id}\n\n请引用此消息回复来处理。`;

    let forwarded = false;
    try {
      const sendResult = await sendImNotification(imMessage, task.id);
      forwarded = !!sendResult;
    } catch (err) {
      console.error("IM notification failed:", err);
    }

    await chatLogStore.log({
      sessionId,
      role: "system",
      content: forwarded
        ? "已转达作者，等待回复中..."
        : "企微通知暂未发出（请确认机器人 owner 已配置），可在右侧协调助手里补充说明。",
      ip,
      taskId: task.id,
    });
  }

  // 5. 记录系统消息到对话历史（带 taskId 标记）
  await chatLogStore.log({
    sessionId,
    role: "system",
    content: proposal.visitorAck,
    ip,
    taskId: task.id,
  });

  return {
    taskId: task.id,
    ackMessage: proposal.visitorAck,
  };
}

/**
 * 处理 owner 在 IM 的回复（Sub Agent StateGraph 驱动）
 *
 * 流程：
 *   1. 查找任务 + 加载对话历史
 *   2. 调用 Task Sub Agent StateGraph（process_reply → decide → compose/ask_more_info）
 *   3. 根据决策：
 *      - resolved → 写 chatLog + resolve task + 返回最终回复
 *      - needs_info → 把追问发到企微 + 更新对话历史 + 返回 null（等下一轮）
 */
/** handleOwnerReply 的返回类型 */
export type OwnerReplyResult =
  | { status: "resolved"; sessionId: string; finalReply: string }
  | { status: "needs_info"; followUpQuestion: string }
  | { status: "ask_visitor"; sessionId: string; visitorQuestion: string }
  | { status: "not_found" };

export async function handleOwnerReply(
  taskId: string,
  ownerReply: string
): Promise<OwnerReplyResult> {
  console.log(`[HOR] 进入了 handleOwnerReply taskId=${taskId} reply="${ownerReply.slice(0, 30)}"`);

  // 1. 查找任务
  const task = await pendingTaskStore.getById(taskId);
  if (!task) {
    console.warn(`Task not found: ${taskId}`);
    return { status: "not_found" };
  }

  // 2. 加载对话历史和访客追加消息
  const conversationHistory: TaskMessage[] = JSON.parse(task.conversationHistory || "[]");
  const visitorMessages: string[] = JSON.parse(task.visitorMessages || "[]");

  // 3. 调用 Task Sub Agent StateGraph
  const result = await handleTaskReply({
    taskType: task.type as TaskType,
    visitorRequest: task.visitorRequest,
    ownerReply,
    conversationHistory,
    visitorMessages,
  });

  // 4. 持久化更新后的对话历史
  await pendingTaskStore.updateConversationHistory(taskId, result.updatedHistory);

  const finalReply = result.finalReply || ownerReply;

  // 5. 根据决策写入 task 通道（协调助手侧边栏），不污染主对话
  if (result.decision === "needs_info" && result.followUpQuestion) {
    console.log(`[TaskManager] Task ${taskId}: needs_info, asking owner...`);
    const followUpMsg = `🤔 **需要补充信息**\n\n${result.followUpQuestion}\n\n---\n回复时请包含标记：**[TASK:${taskId}]**`;
    await sendImNotification(followUpMsg, taskId);
    return { status: "needs_info", followUpQuestion: result.followUpQuestion };
  }

  if (result.decision === "ask_visitor" && result.visitorQuestion) {
    console.log(`[TaskManager] Task ${taskId}: ask_visitor, setting pending question...`);

    await pendingTaskStore.setPendingVisitorQuestion(taskId, result.visitorQuestion);
    await chatLogStore.log({
      sessionId: task.sessionId,
      role: "system",
      content: `作者想了解：${result.visitorQuestion}`,
      ip: "",
      taskId,
    });

    return { status: "ask_visitor", sessionId: task.sessionId, visitorQuestion: result.visitorQuestion };
  }

  // decision === "resolved" — 作者最终回复展示在协调助手
  await chatLogStore.log({
    sessionId: task.sessionId,
    role: "assistant",
    content: finalReply,
    ip: "",
    taskId,
  });

  await pendingTaskStore.resolve(task.id, {
    ownerReply,
    finalReply,
    deliveredVia: "chat",
  });
  await pendingTaskStore.clearVisitorMessages(task.id);

  return {
    status: "resolved",
    sessionId: task.sessionId,
    finalReply,
  };
}
