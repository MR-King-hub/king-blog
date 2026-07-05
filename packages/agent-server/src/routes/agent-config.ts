/**
 * ⚙️ Agent 配置管理路由（管理端）
 *
 * GET  /api/admin/agent-config  → 获取完整 Agent 配置
 * PUT  /api/admin/agent-config  → 更新 Agent 配置
 *
 * 所有接口都需要管理员权限（auth + requireAdmin）
 */

import { Hono } from "hono";
import { stream as honoStream } from "hono/streaming";
import { auth, requireAdmin } from "../middleware/auth.js";
import { agentConfigStore } from "../store/agent-config-store.js";
import { AppError } from "../middleware/error-handler.js";
import type { AppEnv } from "../types.js";
import {
  getWeComDiscoveryStatus,
  startWeComDiscovery,
  stopWeComDiscovery,
  subscribeWeComDiscovery,
} from "../services/wecom-discovery.js";

export const agentConfigRoutes = new Hono<AppEnv>();

// ══════════════════════════════════════════════════════════════
// GET /api/admin/agent-config — 获取完整 Agent 配置
// ══════════════════════════════════════════════════════════════
agentConfigRoutes.get("/", auth, requireAdmin, async (c) => {
  const config = await agentConfigStore.get();

  if (!config) {
    throw new AppError(404, "NOT_FOUND", "Agent 配置不存在，请先运行 pnpm db:seed");
  }

  return c.json({ success: true, data: config });
});

// ══════════════════════════════════════════════════════════════
// PUT /api/admin/agent-config — 更新 Agent 配置
// ══════════════════════════════════════════════════════════════
agentConfigRoutes.put("/", auth, requireAdmin, async (c) => {
  const body = await c.req.json();

  // 基本校验
  if (body.temperature !== undefined) {
    const t = Number(body.temperature);
    if (isNaN(t) || t < 0 || t > 2) {
      throw new AppError(400, "VALIDATION_ERROR", "temperature 必须在 0-2 之间");
    }
  }

  if (body.maxTokens !== undefined) {
    const m = Number(body.maxTokens);
    if (isNaN(m) || m < 100 || m > 8000) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "maxTokens 必须在 100-8000 之间"
      );
    }
  }

  if (body.rateLimit !== undefined) {
    const r = Number(body.rateLimit);
    if (isNaN(r) || r < 1 || r > 1000) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "rateLimit 必须在 1-1000 之间"
      );
    }
  }

  const config = await agentConfigStore.update(body);
  return c.json({ success: true, data: config });
});

// ══════════════════════════════════════════════════════════════
// POST /api/admin/agent-config/wecom/discover — 开始监听并 SSE 推送发现结果
// ══════════════════════════════════════════════════════════════
agentConfigRoutes.post("/wecom/discover", auth, requireAdmin, async (c) => {
  const body = await c.req.json();
  const botId = String(body.botId || "");
  const botSecret = String(body.botSecret || "");

  if (!botId || !botSecret) {
    throw new AppError(400, "VALIDATION_ERROR", "缺少 botId / botSecret");
  }

  await startWeComDiscovery(botId, botSecret);

  c.header("Content-Type", "text/event-stream; charset=utf-8");
  c.header("Cache-Control", "no-cache");
  c.header("Connection", "keep-alive");
  c.header("X-Accel-Buffering", "no");

  return honoStream(c, async (stream) => {
    const writeStatus = async () => {
      await stream.write(
        `event: status\ndata: ${JSON.stringify(getWeComDiscoveryStatus())}\n\n`,
      );
    };

    await writeStatus();

    const unsubscribe = subscribeWeComDiscovery(() => {
      writeStatus().catch(() => {});
    });

    const cleanup = async () => {
      unsubscribe();
      await stopWeComDiscovery(true);
    };

    c.req.raw.signal.addEventListener("abort", () => {
      cleanup().catch(() => {});
    });

    await new Promise<void>((resolve) => {
      c.req.raw.signal.addEventListener("abort", () => resolve());
    });
  });
});

// ══════════════════════════════════════════════════════════════
// DELETE /api/admin/agent-config/wecom/discover — 停止监听
// ══════════════════════════════════════════════════════════════
agentConfigRoutes.delete("/wecom/discover", auth, requireAdmin, async (c) => {
  await stopWeComDiscovery(true);
  return c.json({ success: true, data: getWeComDiscoveryStatus() });
});
