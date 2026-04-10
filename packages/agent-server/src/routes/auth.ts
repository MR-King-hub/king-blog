/**
 * 🔑 认证路由 — 登录和注册
 *
 * POST /api/auth/register  → 注册
 * POST /api/auth/login     → 登录
 * GET  /api/auth/me        → 获取当前用户信息（需要登录）
 *
 * 注意：register 和 login 不需要鉴权（你总不能要求先登录才能注册吧？）
 * 但 /me 需要鉴权 — 所以它使用了 auth 中间件
 */

import { Hono } from "hono";
import { userStore } from "../store/user-store.js";
import { auth, generateToken } from "../middleware/auth.js";
import { AppError } from "../middleware/error-handler.js";
import type { AppEnv } from "../types.js";

export const authRoutes = new Hono<AppEnv>();

// ══════════════════════════════════════════════════════════════
// POST /api/auth/register — 注册
// ══════════════════════════════════════════════════════════════
/**
 * 请求体：
 * {
 *   "email": "user@example.com",
 *   "password": "mypassword",
 *   "nickname": "小明"
 * }
 *
 * 成功响应（201）：
 * {
 *   "success": true,
 *   "data": {
 *     "user": { "id": "xxx", "email": "...", "nickname": "..." },
 *     "token": "eyJhbGci..."
 *   }
 * }
 */
authRoutes.post("/register", async (c) => {
  const { email, password, nickname } = await c.req.json<{
    email: string;
    password: string;
    nickname: string;
  }>();

  // ── 参数校验 ─────────────────────────────
  if (!email || !password || !nickname) {
    throw new AppError(400, "VALIDATION_ERROR", "email、password、nickname 都是必填的");
  }

  // 简单的 email 格式校验
  if (!email.includes("@")) {
    throw new AppError(400, "VALIDATION_ERROR", "email 格式不正确");
  }

  // 密码长度校验
  if (password.length < 6) {
    throw new AppError(400, "VALIDATION_ERROR", "密码至少 6 个字符");
  }

  // ── 创建用户 ─────────────────────────────
  const user = await userStore.create(email, password, nickname);

  if (!user) {
    // email 已存在
    throw new AppError(409, "EMAIL_EXISTS", "该邮箱已注册");
    // 409 = Conflict（冲突）
  }

  // ── 生成 token 并返回 ─────────────────────
  const token = generateToken({ userId: user.id, email: user.email });

  return c.json(
    {
      success: true,
      data: { user, token },
    },
    201
  );
});

// ══════════════════════════════════════════════════════════════
// POST /api/auth/login — 登录
// ══════════════════════════════════════════════════════════════
/**
 * 请求体：
 * {
 *   "email": "user@example.com",
 *   "password": "mypassword"
 * }
 *
 * 成功响应（200）：
 * {
 *   "success": true,
 *   "data": {
 *     "user": { "id": "xxx", "email": "...", "nickname": "..." },
 *     "token": "eyJhbGci..."
 *   }
 * }
 */
authRoutes.post("/login", async (c) => {
  const { email, password } = await c.req.json<{
    email: string;
    password: string;
  }>();

  if (!email || !password) {
    throw new AppError(400, "VALIDATION_ERROR", "email 和 password 是必填的");
  }

  // ── 查找用户 ─────────────────────────────
  const user = await userStore.findByEmail(email);
  if (!user) {
    // 注意：不要告诉用户"邮箱不存在"，这会泄露信息
    // 统一返回"邮箱或密码错误"
    throw new AppError(401, "INVALID_CREDENTIALS", "邮箱或密码错误");
  }

  // ── 验证密码 ─────────────────────────────
  const valid = await userStore.verifyPassword(user, password);
  if (!valid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "邮箱或密码错误");
  }

  // ── 生成 token ──────────────────────────
  const token = generateToken({ userId: user.id, email: user.email });

  // 返回用户信息时去掉密码哈希
  const { passwordHash: _, ...safeUser } = user;

  return c.json({
    success: true,
    data: { user: safeUser, token },
  });
});

// ══════════════════════════════════════════════════════════════
// GET /api/auth/me — 获取当前登录用户信息
// ══════════════════════════════════════════════════════════════
/**
 * 注意这里用了 auth 中间件！
 *
 * authRoutes.get("/me", auth, handler)
 *                       ↑
 *                  路由级中间件
 *
 * 执行顺序：先走 auth 中间件验证 token → 通过后才执行 handler
 * 如果 token 无效，auth 中间件直接抛 401 错误，handler 不会执行
 */
authRoutes.get("/me", auth, async (c) => {
  // c.get("user") 是 auth 中间件解析 token 后存进去的
  const payload = c.get("user") as { userId: string; email: string };

  const user = await userStore.findById(payload.userId);
  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "用户不存在");
  }

  return c.json({ success: true, data: user });
});
