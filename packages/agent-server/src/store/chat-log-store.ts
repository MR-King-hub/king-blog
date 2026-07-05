/**
 * 💬 对话日志存储层
 *
 * 记录访客和 AI 助手的对话内容，同时提供频率限制查询。
 */

import { prisma } from "../lib/prisma.js";
import { emitTaskEvent } from "../lib/task-events.js";

export interface ChatLogEntry {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  ip: string;
  taskId: string | null;
  createdAt: string;
}

class ChatLogStore {
  /** 记录一条对话消息 */
  async log(entry: {
    sessionId: string;
    role: "user" | "assistant" | "system";
    content: string;
    ip: string;
    taskId?: string;
  }): Promise<void> {
    const record = await prisma.chatLog.create({
      data: {
        sessionId: entry.sessionId,
        role: entry.role,
        content: entry.content,
        ip: entry.ip,
        taskId: entry.taskId ?? null,
      },
    });

    // task 相关消息写入后，广播 SSE 事件
    if (entry.taskId) {
      emitTaskEvent(entry.sessionId, {
        type: "task_message",
        sessionId: entry.sessionId,
        data: {
          id: record.id,
          role: entry.role,
          content: entry.content,
          taskId: entry.taskId,
          createdAt: record.createdAt.toISOString(),
        },
      });
    }
  }

  /**
   * 查询指定 IP 今日的对话次数（仅统计 user 消息）
   * 用于频率限制
   */
  async countTodayByIp(ip: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.chatLog.count({
      where: {
        ip,
        role: "user",
        createdAt: { gte: today },
      },
    });
  }

  /** 获取指定会话的历史消息（用于多轮对话） */
  async getSessionHistory(
    sessionId: string,
    limit = 20,
    options?: { includeTaskMessages?: boolean }
  ): Promise<ChatLogEntry[]> {
    const where: Record<string, unknown> = { sessionId };

    // 默认排除 task 相关消息，保持主 LLM 上下文干净
    if (!options?.includeTaskMessages) {
      where.taskId = null;
    }

    const logs = await prisma.chatLog.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    return logs.map((log) => ({
      id: log.id,
      sessionId: log.sessionId,
      role: log.role as "user" | "assistant" | "system",
      content: log.content,
      ip: log.ip,
      taskId: log.taskId ?? null,
      createdAt: log.createdAt.toISOString(),
    }));
  }

  /**
   * 获取某个会话中的 task 回复消息（owner 回复后 Sub Agent 组装的）
   * 用于前端轮询新通知，只返回 assistant 角色（排除 system ACK）
   */
  async getTaskNotifications(
    sessionId: string,
    since?: string
  ): Promise<ChatLogEntry[]> {
    const where: Record<string, unknown> = {
      sessionId,
      taskId: { not: null },
      role: "assistant", // 只返回真正的作者回复，不含 system ACK
    };
    if (since) {
      where.createdAt = { gt: new Date(since) };
    }

    const logs = await prisma.chatLog.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    return logs.map((log) => ({
      id: log.id,
      sessionId: log.sessionId,
      role: log.role as "user" | "assistant" | "system",
      content: log.content,
      ip: log.ip,
      taskId: log.taskId ?? null,
      createdAt: log.createdAt.toISOString(),
    }));
  }

  /** 获取指定 task 的对话历史（task 通道的独立上下文） */
  async getTaskHistory(
    sessionId: string,
    taskId: string,
    limit = 30
  ): Promise<ChatLogEntry[]> {
    const logs = await prisma.chatLog.findMany({
      where: { sessionId, taskId },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    return logs.map((log) => ({
      id: log.id,
      sessionId: log.sessionId,
      role: log.role as "user" | "assistant" | "system",
      content: log.content,
      ip: log.ip,
      taskId: log.taskId ?? null,
      createdAt: log.createdAt.toISOString(),
    }));
  }
}

export const chatLogStore = new ChatLogStore();
