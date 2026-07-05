/**
 * 💬 访客聊天路由
 *
 * POST /api/chat                                → 访客与个人 Agent 对话（Vercel AI SDK Data Stream 协议）
 * GET  /api/chat/config                        → 获取 Agent 公开配置
 * GET  /api/chat/history/:sid                  → 获取会话历史消息（刷新后恢复）
 * GET  /api/chat/notifications/:sid            → 获取 task 通道初始数据（首次加载）
 * GET  /api/chat/notifications/:sid/stream     → SSE 长连接，实时推送 task 事件
 * GET  /api/chat/tasks/:sid                    → 获取会话关联的所有任务
 *
 * 这些接口面向所有访客，不需要登录。
 * 频率限制通过 IP 地址控制。
 */

import { Hono } from "hono";
import { stream as honoStream } from "hono/streaming";
import type { AppEnv } from "../types.js";
import { agentConfigStore } from "../store/agent-config-store.js";
import { chatLogStore } from "../store/chat-log-store.js";
import { pendingTaskStore } from "../store/pending-task-store.js";
import { personalAgentStream } from "../agents/personal-agent.js";
import { AppError } from "../middleware/error-handler.js";
import { prisma } from "../lib/prisma.js";
import { subscribeTaskEvents } from "../lib/task-events.js";

export const chatRoutes = new Hono<AppEnv>();

// ══════════════════════════════════════════════════════════════
// GET /api/chat/config — 获取 Agent 公开配置（访客端用）
// ══════════════════════════════════════════════════════════════
chatRoutes.get("/config", async (c) => {
  const config = await agentConfigStore.get();

  if (!config) {
    return c.json({
      success: true,
      data: { enabled: false, name: "", greeting: "" },
    });
  }

  return c.json({
    success: true,
    data: {
      enabled: config.enabled,
      name: config.name,
      greeting: config.greeting,
    },
  });
});

// ══════════════════════════════════════════════════════════════
// GET /api/chat/history/:sessionId — 获取会话历史消息
// 前端刷新页面后用 localStorage 中的 sessionId 恢复对话
// ══════════════════════════════════════════════════════════════
chatRoutes.get("/history/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");

  // 返回全量消息（含 task 相关），前端用于恢复完整对话
  // 主 LLM 的上下文隔离在 personalAgentStream 里处理，不在这里
  const history = await chatLogStore.getSessionHistory(sessionId, 50, {
    includeTaskMessages: true,
  });
  const messages = history.filter((m) => m.role === "user" || m.role === "assistant");

  return c.json({ success: true, data: messages });
});

// ══════════════════════════════════════════════════════════════
// GET /api/chat/notifications/:sessionId — 轮询 task 通道
// 返回：1) task 通道的全部消息（对话历史）  2) 待回答追问
// ══════════════════════════════════════════════════════════════
chatRoutes.get("/notifications/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");

  // 1. task 通道的全部消息（system=追问, user=访客回复, assistant=作者回复）
  const allTaskLogs = await prisma.chatLog.findMany({
    where: { sessionId, taskId: { not: null } },
    orderBy: { createdAt: "asc" },
  });

  const messages = allTaskLogs.map((log) => ({
    id: log.id,
    role: log.role as "system" | "user" | "assistant",
    content: log.content,
    taskId: log.taskId,
    createdAt: log.createdAt.toISOString(),
  }));

  // 2. 检查是否有活跃 task 且有待回答的追问
  const activeTask = await pendingTaskStore.findActiveBySession(sessionId);
  const pendingQuestion = activeTask?.pendingVisitorQuestion
    ? {
        taskId: activeTask.id,
        question: activeTask.pendingVisitorQuestion,
        taskType: activeTask.type,
      }
    : null;

  return c.json({
    success: true,
    data: {
      messages,
      pendingQuestion,
    },
  });
});

// ══════════════════════════════════════════════════════════════
// GET /api/chat/notifications/:sessionId/stream — SSE 长连接
// 替代轮询，实时推送 task 通道的增量事件
// ══════════════════════════════════════════════════════════════
chatRoutes.get("/notifications/:sessionId/stream", async (c) => {
  const sessionId = c.req.param("sessionId");

  c.header("Content-Type", "text/event-stream; charset=utf-8");
  c.header("Cache-Control", "no-cache");
  c.header("Connection", "keep-alive");
  c.header("X-Accel-Buffering", "no"); // nginx 不缓冲

  return honoStream(c, async (stream) => {
    // 1. 先发送当前全量数据作为初始状态
    const allTaskLogs = await prisma.chatLog.findMany({
      where: { sessionId, taskId: { not: null } },
      orderBy: { createdAt: "asc" },
    });
    const messages = allTaskLogs.map((log) => ({
      id: log.id,
      role: log.role as "system" | "user" | "assistant",
      content: log.content,
      taskId: log.taskId,
      createdAt: log.createdAt.toISOString(),
    }));
    const activeTask = await pendingTaskStore.findActiveBySession(sessionId);
    const pendingQuestion = activeTask?.pendingVisitorQuestion
      ? {
          taskId: activeTask.id,
          question: activeTask.pendingVisitorQuestion,
          taskType: activeTask.type,
        }
      : null;

    await stream.write(
      `event: init\ndata: ${JSON.stringify({ messages, pendingQuestion })}\n\n`
    );

    // 2. 订阅增量事件
    const unsubscribe = subscribeTaskEvents(sessionId, async (event) => {
      try {
        console.log(`[SSE] 推送事件 ${event.type} to session ${sessionId}`);
        await stream.write(
          `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`
        );
      } catch {
        console.log(`[SSE] 写入失败（连接关闭） session ${sessionId}`);
      }
    });

    // 3. 心跳保活（每 30 秒）
    const heartbeat = setInterval(async () => {
      try {
        await stream.write(": heartbeat\n\n");
      } catch {
        clearInterval(heartbeat);
      }
    }, 30_000);

    // 4. 等待连接关闭
    try {
      await new Promise<void>((resolve) => {
        stream.onAbort(() => resolve());
      });
    } finally {
      clearInterval(heartbeat);
      unsubscribe();
    }
  });
});

// ══════════════════════════════════════════════════════════════
// POST /api/chat/task/:taskId/message — Task Coordinator 对话
// 侧边栏的独立 Agent，有 LLM + notifyOwner tool
// ══════════════════════════════════════════════════════════════
chatRoutes.post("/task/:taskId/message", async (c) => {
  const taskId = c.req.param("taskId");
  const body = await c.req.json();
  const message = (body.message as string)?.trim();
  const sessionId = body.sessionId as string;

  if (!message) {
    return c.json({ success: false, error: "消息不能为空" }, 400);
  }

  const task = await pendingTaskStore.getById(taskId);
  if (!task) {
    return c.json({ success: false, error: "任务不存在" }, 404);
  }

  const { taskCoordinatorStream } = await import("../agents/task-coordinator.js");

  // Data Stream Protocol 格式输出（和主对话保持一致）
  return honoStream(c, async (stream) => {
    c.header("Content-Type", "text/plain; charset=utf-8");
    c.header("X-Vercel-AI-Data-Stream", "v1");

    try {
      for await (const token of taskCoordinatorStream({
        taskId,
        taskType: task.type,
        visitorRequest: task.visitorRequest,
        sessionId: sessionId || task.sessionId,
        message,
      })) {
        if (token.type === "text") {
          await stream.write(`0:${JSON.stringify(token.content)}\n`);
        }
      }

      // 结束标记
      await stream.write(
        `d:${JSON.stringify({ finishReason: "stop" })}\n`
      );
    } catch (err) {
      console.error("[TaskCoordinator] Stream error:", err);
      const errMsg = "抱歉，处理失败，请稍后再试。";
      await stream.write(`0:${JSON.stringify(errMsg)}\n`);
      await stream.write(
        `d:${JSON.stringify({ finishReason: "error" })}\n`
      );
    }
  });
});

// ══════════════════════════════════════════════════════════════
// GET /api/chat/tasks/:sessionId — 获取会话的所有任务
// ══════════════════════════════════════════════════════════════
chatRoutes.get("/tasks/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");
  const tasks = await pendingTaskStore.listBySession(sessionId);
  return c.json({ success: true, data: tasks });
});

// ══════════════════════════════════════════════════════════════
// POST /api/chat — 访客与个人 Agent 对话
// 输出：Vercel AI SDK Data Stream Protocol
// ══════════════════════════════════════════════════════════════
chatRoutes.post("/", async (c) => {
  const body = await c.req.json<{
    messages?: Array<{
      role: string;
      content?: string;
      parts?: Array<{ type: string; text?: string }>;
    }>;
    message?: string;
    sessionId?: string;
  }>();

  const lastUserMsg = body.messages?.filter((m) => m.role === "user").pop();
  const userMessage =
    lastUserMsg?.parts
      ?.filter((p) => p.type === "text" && p.text)
      .map((p) => p.text)
      .join("") ||
    lastUserMsg?.content ||
    body.message;

  if (!userMessage?.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "message 不能为空");
  }

  if (userMessage.length > 2000) {
    throw new AppError(400, "VALIDATION_ERROR", "消息太长了，请控制在 2000 字以内");
  }

  const agentConfig = await agentConfigStore.get();
  if (!agentConfig?.enabled) {
    throw new AppError(503, "AGENT_DISABLED", "AI 助手当前未启用");
  }

  const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim()
    || c.req.header("x-real-ip")
    || "unknown";

  const isDev = process.env.NODE_ENV !== "production";
  if (!isDev) {
    const todayCount = await chatLogStore.countTodayByIp(ip);
    if (todayCount >= agentConfig.rateLimit) {
      throw new AppError(
        429,
        "RATE_LIMIT_EXCEEDED",
        `今日对话次数已达上限（${agentConfig.rateLimit} 次），明天再来吧 🙂`
      );
    }
  }

  const sessionId = body.sessionId || crypto.randomUUID();
  const messageId = `msg-${crypto.randomUUID()}`;
  const textPartId = `text-${crypto.randomUUID()}`;

  c.header("Content-Type", "text/event-stream; charset=utf-8");
  c.header("Cache-Control", "no-cache");
  c.header("Connection", "keep-alive");
  c.header("x-vercel-ai-ui-message-stream", "v1");
  c.header("x-chat-session-id", sessionId);

  return honoStream(c, async (stream) => {
    const writeLine = async (data: unknown) => {
      const line = `data:${JSON.stringify(data)}\n\n`;
      await stream.write(line);
    };

    try {
      await writeLine({ type: "start", messageId });
      await writeLine({ type: "start-step" });
      await writeLine({ type: "text-start", id: textPartId });

      const tokenStream = personalAgentStream({
        message: userMessage,
        sessionId,
        ip,
      });

      let hasContent = false;
      for await (const token of tokenStream) {
        hasContent = true;

        if (token.type === "task_created") {
          // 任务创建通知 — 发送 ACK 文本 + 附带 taskId 元数据
          await writeLine({ type: "text-delta", id: textPartId, delta: token.content });
          // 额外发送一个自定义事件，前端用于识别 task 创建
          await writeLine({
            type: "text-delta",
            id: textPartId,
            delta: "",
            // 通过 metadata annotation 传递 taskId
          });
        } else {
          await writeLine({ type: "text-delta", id: textPartId, delta: token.content });
        }
      }

      if (!hasContent) {
        await writeLine({
          type: "text-delta",
          id: textPartId,
          delta: "抱歉，AI 暂时无法响应，请稍后重试 🙏",
        });
      }

      await writeLine({ type: "text-end", id: textPartId });
      await writeLine({ type: "finish-step" });
      await writeLine({ type: "finish" });
      await stream.write("data:[DONE]\n\n");
    } catch (err) {
      console.error("Chat stream error:", err);
      await writeLine({
        type: "error",
        errorText: err instanceof Error ? err.message : "Unknown error",
      });
      await stream.write("data:[DONE]\n\n");
    }
  });
});
