/**
 * 📱 IM Webhook 路由
 *
 * POST /api/im/webhook — 接收 IM 的回复消息
 *
 * 支持两种路由方式（优先级从高到低）：
 *   1. 引用消息路由：通过 quotedMessageId 找到对应 task（推荐）
 *   2. 直接 taskId 路由：IM 消息中携带 taskId（兜底）
 *
 * 安全验证：通过 IM_WEBHOOK_SECRET 环境变量配置密钥
 */

import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { pendingTaskStore } from "../store/pending-task-store.js";
import { handleOwnerReply } from "../services/task-manager.js";

export const imWebhookRoutes = new Hono<AppEnv>();

// ══════════════════════════════════════════════════════════════
// POST /api/im/webhook — 接收 IM 回复
// ══════════════════════════════════════════════════════════════
imWebhookRoutes.post("/", async (c) => {
  // ── 安全验证 ──────────────────────────────────
  const secret = process.env.IM_WEBHOOK_SECRET;
  if (secret) {
    const provided = c.req.header("x-webhook-secret");
    if (provided !== secret) {
      return c.json(
        { success: false, error: "Unauthorized" },
        401
      );
    }
  }

  // ── 解析请求体 ────────────────────────────────
  const body = await c.req.json<{
    /** IM 中引用消息的 ID（用于路由到对应 task） */
    quotedMessageId?: string;
    /** 直接指定 taskId（兜底方案） */
    taskId?: string;
    /** owner 回复的文本内容 */
    text?: string;
    content?: string;
  }>();

  const ownerReply = body.text || body.content;
  if (!ownerReply?.trim()) {
    return c.json(
      { success: false, error: "回复内容不能为空" },
      400
    );
  }

  // ── 路由到对应 task ───────────────────────────
  let taskId: string | undefined;

  // 方式 1：通过引用消息 ID 查找
  if (body.quotedMessageId) {
    const task = await pendingTaskStore.findByImMessageId(body.quotedMessageId);
    if (task) {
      taskId = task.id;
    }
  }

  // 方式 2：直接使用 taskId
  if (!taskId && body.taskId) {
    taskId = body.taskId;
  }

  if (!taskId) {
    return c.json(
      { success: false, error: "无法识别回复对应的任务，请引用原消息回复" },
      400
    );
  }

  // ── 处理 owner 回复（Sub Agent 组装 → 写入消息流）──
  const result = await handleOwnerReply(taskId, ownerReply.trim());

  if (result.status === "not_found") {
    return c.json(
      { success: false, error: "任务不存在或已处理" },
      404
    );
  }

  if (result.status === "needs_info") {
    return c.json({
      success: true,
      data: {
        taskId,
        status: "needs_info",
        followUpQuestion: result.followUpQuestion,
      },
    });
  }

  if (result.status === "ask_visitor") {
    return c.json({
      success: true,
      data: {
        taskId,
        status: "ask_visitor",
        visitorQuestion: result.visitorQuestion,
      },
    });
  }

  return c.json({
    success: true,
    data: {
      taskId,
      sessionId: result.sessionId,
      finalReply: result.finalReply,
    },
  });
});

// ══════════════════════════════════════════════════════════════
// GET /api/im/webhook — 用于 IM 平台验证 Webhook 可达性
// ══════════════════════════════════════════════════════════════
imWebhookRoutes.get("/", (c) => {
  return c.json({ success: true, message: "IM webhook is active" });
});
