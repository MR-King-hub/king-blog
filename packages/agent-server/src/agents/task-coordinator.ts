/**
 * 📋 Task Coordinator Agent
 *
 * 侧边栏协调通道：每条访客消息先推企微通知作者，再用 LLM 生成简短回复。
 * 转发不依赖 LLM，避免限流或 tool calling 失败导致无法联系作者。
 */

import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import { resolveModelName } from "../config.js";
import { createChatModel } from "../telemetry/index.js";
import { agentConfigStore } from "../store/agent-config-store.js";
import { chatLogStore } from "../store/chat-log-store.js";
import { sendImNotification } from "../services/im-service.js";
import { TASK_TYPE_LABELS, type TaskType } from "./task-agent.js";

// ══════════════════════════════════════════════════════════════
// 对话接口
// ══════════════════════════════════════════════════════════════

export interface TaskCoordinatorStreamOptions {
  taskId: string;
  taskType: string;
  visitorRequest: string;
  sessionId: string;
  message: string;
}

function buildForwardSummary(
  taskType: string,
  visitorRequest: string,
  message: string,
): string {
  const label = TASK_TYPE_LABELS[taskType as TaskType] || taskType;
  return `📋 [${label}] 访客新消息\n\n${message}\n\n── 原始请求 ──\n${visitorRequest}`;
}

function defaultReply(forwarded: boolean): string {
  return forwarded
    ? "已转达给作者，请稍等回复。"
    : "企微通知暂未发出，请稍后再试或刷新页面后重试。";
}

/**
 * Task Coordinator 流式对话
 */
export async function* taskCoordinatorStream(
  options: TaskCoordinatorStreamOptions
): AsyncGenerator<{ type: string; content: string }> {
  const { taskId, taskType, visitorRequest, sessionId, message } = options;

  await chatLogStore.log({
    sessionId,
    role: "user",
    content: message,
    ip: "",
    taskId,
  });

  // 1. 先推企微（核心动作，不依赖 LLM）
  const forwardSummary = buildForwardSummary(taskType, visitorRequest, message);
  const sent = await sendImNotification(forwardSummary, taskId);
  let fullResponse = defaultReply(!!sent);

  // 2. LLM 生成更自然的回复（失败则用默认文案）
  const agentConfig = await agentConfigStore.get();
  const model = createChatModel({
    agent: "task-coordinator",
    modelName: resolveModelName(agentConfig?.modelName),
    temperature: 0.5,
    maxTokens: 150,
    maxRetries: 1,
  });

  const history = await chatLogStore.getTaskHistory(sessionId, taskId);
  const llmMessages: BaseMessage[] = [
    new SystemMessage(
      `你是博主 Shizhe 的协调助手，正在与博客访客对话。
⚠️ 对话者是来访的访客，不是博主本人，也不是网站开发者。
访客消息${sent ? "已" : "未能"}转达给作者。
请用一句话友好回复访客（不超过 60 字）。${sent ? "告知已转达、请稍等。" : "致歉并建议稍后再试。"}
不要编造作者的回复。`,
    ),
  ];

  for (const log of history) {
    if (log.role === "user") llmMessages.push(new HumanMessage(log.content));
    else if (log.role === "assistant") llmMessages.push(new AIMessage(log.content));
  }
  llmMessages.push(new HumanMessage(message));

  try {
    const response = await model.invoke(llmMessages);
    const text = typeof response.content === "string" ? response.content.trim() : "";
    if (text) fullResponse = text;
  } catch (err) {
    console.error("[TaskCoordinator] LLM reply error (forward ok=" + !!sent + "):", err);
  }

  yield { type: "text", content: fullResponse };

  await chatLogStore.log({
    sessionId,
    role: "assistant",
    content: fullResponse,
    ip: "",
    taskId,
  });
}
