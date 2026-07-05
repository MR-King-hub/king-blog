/**
 * 🔑 认证路由
 *
 * POST /api/auth/login  → 登录（返回 JWT token）
 * GET  /api/auth/me     → 获取当前用户信息（需要登录）
 *
 * 注意：个人博客不开放注册。
 * 管理员账号通过 `pnpm db:seed` 初始化，配置在 .env 中。
 */

import { Hono } from "hono";
import { userStore } from "../store/user-store.js";
import { auth, generateToken } from "../middleware/auth.js";
import { AppError } from "../middleware/error-handler.js";
import type { AppEnv } from "../types.js";
import type { JWTPayload } from "../middleware/auth.js";

export const authRoutes = new Hono<AppEnv>();

// ══════════════════════════════════════════════════════════════
// POST /api/auth/login — 登录
// ══════════════════════════════════════════════════════════════
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
    // 不泄露用户是否存在
    throw new AppError(401, "INVALID_CREDENTIALS", "邮箱或密码错误");
  }

  // ── 验证密码 ─────────────────────────────
  const valid = await userStore.verifyPassword(user, password);
  if (!valid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "邮箱或密码错误");
  }

  // ── 生成 token（包含 role）──────────────
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role as JWTPayload["role"],
  });

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
authRoutes.get("/me", auth, async (c) => {
  const payload = c.get("user") as JWTPayload;

  const user = await userStore.findById(payload.userId);
  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "用户不存在");
  }

  return c.json({ success: true, data: user });
});
