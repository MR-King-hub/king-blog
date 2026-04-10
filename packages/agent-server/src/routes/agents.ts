/**
 * 🤖 Agent 路由
 *
 * 这个文件处理 AI Agent 相关的请求。
 * 核心是 /chat 接口 — 用 SSE（Server-Sent Events）流式返回 Agent 的回复。
 *
 * 什么是 SSE？
 *   普通 HTTP 请求：客户端发一个请求 → 服务端返回一个完整响应 → 连接关闭
 *   SSE 请求：    客户端发一个请求 → 服务端持续推送数据 → 推送完毕后关闭
 *
 *   就像 ChatGPT 打字一样，文字是一个一个"流"出来的，不是一次性全给你。
 *   好处：用户不用等 AI 完全生成完，边生成边看，体验好。
 *
 * SSE 的数据格式（纯文本）：
 *   event: token
 *   data: {"type":"token","data":"你好"}
 *
 *   event: done
 *   data: {"sessionId":"abc-123"}
 */

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
// ↑ Hono 内置的 SSE 流式工具，帮你处理好 HTTP 头和格式
import type { AgentRequest } from "@blog/shared";
import { getAgent } from "../agents/index.js";
import { auth } from "../middleware/auth.js";
import type { AppEnv } from "../types.js";

export const agentRoutes = new Hono<AppEnv>();

// ══════════════════════════════════════════════════════════════
// POST /api/agents/chat — 与 Agent 对话（流式 SSE）
// ══════════════════════════════════════════════════════════════
/**
 * 请求体格式：
 * {
 *   "agentType": "writing-assistant",    ← 用哪个 Agent
 *   "message": "帮我写一篇关于 React 的文章", ← 用户的消息
 *   "sessionId": "可选，会话ID",           ← 用于多轮对话
 *   "context": { "articleSlug": "..." }   ← 可选，上下文信息
 * }
 */
// 调用 Agent 需要登录（消耗 AI 算力和费用）
agentRoutes.post("/chat", auth, async (c) => {
  const body = await c.req.json<AgentRequest>();

  // ── 参数校验 ─────────────────────────────────
  if (!body.agentType || !body.message) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "agentType and message are required",
        },
      },
      400
    );
  }

  // ── 获取对应的 Agent 实例 ─────────────────────
  const agent = getAgent(body.agentType);
  if (!agent) {
    return c.json(
      {
        success: false,
        error: {
          code: "UNKNOWN_AGENT",
          message: `Unknown agent type: ${body.agentType}`,
        },
      },
      400
    );
  }

  // ── 开始 SSE 流式响应 ────────────────────────
  /**
   * streamSSE(c, callback) 做了什么？
   *   1. 设置响应头 Content-Type: text/event-stream
   *   2. 告诉浏览器"别缓存，别关连接，我要持续给你发数据"
   *   3. 提供 stream.writeSSE() 方法，每调一次就发一条 SSE 消息
   */
  return streamSSE(c, async (stream) => {
    try {
      // 生成或复用会话 ID（支持多轮对话）
      const sessionId = body.sessionId || crypto.randomUUID();

      // 先发一条 session 事件，告诉前端这次会话的 ID
      await stream.writeSSE({
        event: "session",
        data: JSON.stringify({ sessionId }),
      });

      // 调用 Agent，获取流式事件迭代器
      const eventStream = await agent.stream(body.message, {
        sessionId,
        context: body.context,
      });

      // 遍历 Agent 产生的每一个事件，逐个推送给前端
      // 这里用了 for-await-of，因为 Agent 的输出是异步的（边生成边返回）
      for await (const event of eventStream) {
        await stream.writeSSE({
          event: event.type,  // 事件类型，比如 "token"
          data: JSON.stringify({ ...event, sessionId }),
        });
      }

      // Agent 输出完毕，发一个 done 事件
      await stream.writeSSE({
        event: "done",
        data: JSON.stringify({ sessionId }),
      });
    } catch (err) {
      // Agent 执行出错，发一个 error 事件
      console.error("Agent stream error:", err);
      await stream.writeSSE({
        event: "error",
        data: JSON.stringify({
          error: err instanceof Error ? err.message : "Unknown error",
        }),
      });
    }
  });
});

// ══════════════════════════════════════════════════════════════
// GET /api/agents/types — 获取可用的 Agent 列表
// ══════════════════════════════════════════════════════════════
/**
 * 前端用这个接口展示"有哪些 AI 助手可以选"
 * 目前是硬编码的列表，未来可以改成从配置或数据库读取
 */
agentRoutes.get("/types", (c) => {
  return c.json({
    success: true,
    data: [
      {
        type: "writing-assistant",
        name: "写作助手",
        description: "帮助你撰写、润色和优化文章内容",
      },
      {
        type: "content-reviewer",
        name: "内容审核",
        description: "审核文章内容，提供结构、语法和 SEO 优化建议",
      },
    ],
  });
});
