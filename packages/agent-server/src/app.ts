/**
 * 🏗️ 应用主文件 — 服务的"骨架"
 *
 * 这个文件做三件事：
 *   1. 创建 Hono 应用实例
 *   2. 注册中间件（请求进来先经过这些处理）
 *   3. 注册路由（把请求分发到对应的处理函数）
 *
 * ═══ 请求处理流程（更新后） ═══
 *
 *   客户端请求
 *     ↓
 *   [中间件1: 请求ID]   ← 给每个请求分配唯一标识
 *     ↓
 *   [中间件2: 日志]     ← 记录请求信息
 *     ↓
 *   [中间件3: CORS]    ← 处理跨域
 *     ↓
 *   [路由匹配] → Handler  ← 执行业务逻辑
 *     ↓
 *   如果出错 → [错误处理器]  ← 统一捕获和格式化错误
 *     ↓
 *   返回响应
 *
 *   注意中间件顺序：
 *   - requestId 放最前面，这样后续所有中间件都能使用这个 ID
 *   - logger 放第二个，这样日志里能包含 requestId
 *   - CORS 放在路由之前，这样 OPTIONS 预检请求也能正确响应
 *   - errorHandler 是全局的，兜底所有未捕获的异常
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// 类型
import type { AppEnv } from "./types.js";

// 自定义中间件
import { requestId, errorHandler } from "./middleware/index.js";

// 路由模块
import { articleRoutes } from "./routes/articles.js";
import { agentRoutes } from "./routes/agents.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";

// 创建 Hono 应用实例
export const app = new Hono<AppEnv>();

// ══════════════════════════════════════════════════════════════
// 全局错误处理器（兜底）
// ══════════════════════════════════════════════════════════════
/**
 * onError 是 Hono 的全局异常捕获。
 * 任何中间件或 Handler 抛出的未捕获异常都会走到这里。
 * 必须最先注册，才能捕获到所有错误。
 */
app.onError(errorHandler);

// ══════════════════════════════════════════════════════════════
// 中间件注册（按执行顺序排列）
// ══════════════════════════════════════════════════════════════

/**
 * 中间件 1: 请求 ID（自定义）
 * 给每个请求分配唯一标识，方便日志追踪
 */
app.use("*", requestId);

/**
 * 中间件 2: 日志（Hono 内置）
 * 打印请求和响应信息到终端
 */
app.use("*", logger());

/**
 * 中间件 3: CORS（Hono 内置）
 * 允许前端跨域访问后端 API
 */
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// ══════════════════════════════════════════════════════════════
// 路由注册
// ══════════════════════════════════════════════════════════════

app.route("/api/health", healthRoutes);    // 健康检查
app.route("/api/auth", authRoutes);        // 认证（登录/注册）
app.route("/api/articles", articleRoutes); // 文章 CRUD
app.route("/api/agents", agentRoutes);     // Agent 对话

// ══════════════════════════════════════════════════════════════
// 404 处理
// ══════════════════════════════════════════════════════════════
app.notFound((c) => {
  return c.json(
    { success: false, error: { code: "NOT_FOUND", message: "Not found" } },
    404
  );
});
