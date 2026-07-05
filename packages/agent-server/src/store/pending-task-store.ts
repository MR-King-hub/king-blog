/**
 * 📋 待办任务存储层
 *
 * 管理 Sub Agent 的异步审批任务（面试预约、内推请求等）。
 * 每个任务有独立的生命周期，不阻塞主对话。
 */

import { prisma } from "../lib/prisma.js";
import { emitTaskEvent } from "../lib/task-events.js";

export interface PendingTaskData {
  id: string;
  sessionId: string;
  type: string;
  visitorRequest: string;
  proposal: string;
  status: string;
  imMessageId: string | null;
  ownerReply: string | null;
  finalReply: string | null;
  deliveredVia: string | null;
  visitorEmail: string | null;
  conversationHistory: string;
  visitorMessages: string;
  pendingVisitorQuestion: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface CreatePendingTaskInput {
  sessionId: string;
  type: string;
  visitorRequest: string;
  proposal?: string;
}

function toData(task: {
  id: string;
  sessionId: string;
  type: string;
  visitorRequest: string;
  proposal: string;
  status: string;
  imMessageId: string | null;
  ownerReply: string | null;
  finalReply: string | null;
  deliveredVia: string | null;
  visitorEmail: string | null;
  conversationHistory: string;
  visitorMessages: string;
  pendingVisitorQuestion: string;
  createdAt: Date;
  resolvedAt: Date | null;
}): PendingTaskData {
  return {
    id: task.id,
    sessionId: task.sessionId,
    type: task.type,
    visitorRequest: task.visitorRequest,
    proposal: task.proposal,
    status: task.status,
    imMessageId: task.imMessageId,
    ownerReply: task.ownerReply,
    finalReply: task.finalReply,
    deliveredVia: task.deliveredVia,
    visitorEmail: task.visitorEmail,
    conversationHistory: task.conversationHistory,
    visitorMessages: task.visitorMessages,
    pendingVisitorQuestion: task.pendingVisitorQuestion,
    createdAt: task.createdAt.toISOString(),
    resolvedAt: task.resolvedAt?.toISOString() ?? null,
  };
}

class PendingTaskStore {
  /** 创建新任务 */
  async create(input: CreatePendingTaskInput): Promise<PendingTaskData> {
    const task = await prisma.pendingTask.create({
      data: {
        sessionId: input.sessionId,
        type: input.type,
        visitorRequest: input.visitorRequest,
        proposal: input.proposal ?? "",
      },
    });
    return toData(task);
  }

  /** 根据 ID 获取任务 */
  async getById(id: string): Promise<PendingTaskData | null> {
    const task = await prisma.pendingTask.findUnique({ where: { id } });
    return task ? toData(task) : null;
  }

  /** 根据 IM 消息 ID 查找待处理任务（用于 IM 回复路由） */
  async findByImMessageId(imMessageId: string): Promise<PendingTaskData | null> {
    const task = await prisma.pendingTask.findFirst({
      where: { imMessageId, status: "waiting_owner" },
    });
    return task ? toData(task) : null;
  }

  /** 获取某个会话的所有任务 */
  async listBySession(sessionId: string): Promise<PendingTaskData[]> {
    const tasks = await prisma.pendingTask.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
    });
    return tasks.map(toData);
  }

  /** 查找某个会话中正在等待 owner 回复的任务 */
  async findWaitingBySession(sessionId: string): Promise<PendingTaskData | null> {
    const task = await prisma.pendingTask.findFirst({
      where: { sessionId, status: "waiting_owner" },
      orderBy: { createdAt: "desc" },
    });
    return task ? toData(task) : null;
  }

  /**
   * 查找某个会话中"活跃"的 task
   *
   * 只有 waiting_owner 状态才算活跃——owner 还没回复，访客的后续消息应该转发。
   * resolved 的 task 不拦截，访客可以正常和 AI 闲聊。
   * 如果访客又提到面试/合作等话题，会重新触发意图检测创建新 task。
   */
  async findActiveBySession(sessionId: string): Promise<PendingTaskData | null> {
    const task = await prisma.pendingTask.findFirst({
      where: { sessionId, status: "waiting_owner" },
      orderBy: { createdAt: "desc" },
    });
    return task ? toData(task) : null;
  }

  /**
   * 查找 session 中最近的任务（包括 waiting_owner + 最近 resolved）
   * 用于防止短时间内重复创建任务导致 id 串扰
   * @param withinMinutes 时间窗口（分钟），仅查找此时间内的任务
   */
  async findRecentBySession(
    sessionId: string,
    withinMinutes = 5
  ): Promise<PendingTaskData | null> {
    const since = new Date(Date.now() - withinMinutes * 60 * 1000);
    const task = await prisma.pendingTask.findFirst({
      where: {
        sessionId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
    });
    return task ? toData(task) : null;
  }

  /** 更新任务的 IM 消息 ID */
  async setImMessageId(taskId: string, imMessageId: string): Promise<void> {
    await prisma.pendingTask.update({
      where: { id: taskId },
      data: { imMessageId },
    });
  }

  /** 标记任务已解决（owner 回复后） */
  async resolve(
    taskId: string,
    data: {
      ownerReply: string;
      finalReply: string;
      deliveredVia?: string;
    }
  ): Promise<PendingTaskData> {
    const task = await prisma.pendingTask.update({
      where: { id: taskId },
      data: {
        status: "resolved",
        ownerReply: data.ownerReply,
        finalReply: data.finalReply,
        deliveredVia: data.deliveredVia ?? "chat",
        resolvedAt: new Date(),
      },
    });
    emitTaskEvent(task.sessionId, {
      type: "task_update",
      sessionId: task.sessionId,
      data: { taskId, status: "resolved" },
    });
    console.log(`[PendingTask] task ${taskId} resolved, 广播 task_update 到 session ${task.sessionId}`);
    return toData(task);
  }

  /** 更新访客邮箱 */
  async setVisitorEmail(taskId: string, email: string): Promise<void> {
    await prisma.pendingTask.update({
      where: { id: taskId },
      data: { visitorEmail: email },
    });
  }

  /** 更新任务提案 */
  async setProposal(taskId: string, proposal: string): Promise<void> {
    await prisma.pendingTask.update({
      where: { id: taskId },
      data: { proposal },
    });
  }

  /** 更新 Sub Agent 对话历史（JSON 字符串） */
  async updateConversationHistory(taskId: string, history: unknown[]): Promise<void> {
    await prisma.pendingTask.update({
      where: { id: taskId },
      data: { conversationHistory: JSON.stringify(history) },
    });
  }

  /** 追加访客消息到 task */
  async appendVisitorMessage(taskId: string, message: string): Promise<void> {
    const task = await prisma.pendingTask.findUnique({ where: { id: taskId } });
    if (!task) return;
    const messages: string[] = JSON.parse(task.visitorMessages || "[]");
    messages.push(message);
    await prisma.pendingTask.update({
      where: { id: taskId },
      data: { visitorMessages: JSON.stringify(messages) },
    });
  }

  /** 清空访客追加消息（owner 已处理完毕） */
  async clearVisitorMessages(taskId: string): Promise<void> {
    await prisma.pendingTask.update({
      where: { id: taskId },
      data: { visitorMessages: "[]" },
    });
  }

  /** 设置待回答的访客追问 */
  async setPendingVisitorQuestion(taskId: string, question: string): Promise<void> {
    const task = await prisma.pendingTask.update({
      where: { id: taskId },
      data: { pendingVisitorQuestion: question },
    });
    emitTaskEvent(task.sessionId, {
      type: "task_update",
      sessionId: task.sessionId,
      data: { taskId, pendingQuestion: { taskId, question, taskType: task.type } },
    });
  }

  /** 清空待回答的访客追问（访客已回答） */
  async clearPendingVisitorQuestion(taskId: string): Promise<void> {
    await prisma.pendingTask.update({
      where: { id: taskId },
      data: { pendingVisitorQuestion: "" },
    });
  }
}

export const pendingTaskStore = new PendingTaskStore();
