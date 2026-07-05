/**
 * 🔐 认证与授权中间件
 *
 * 提供两个中间件：
 *   1. auth        — 验证 JWT token（登录检查）
 *   2. requireAdmin — 验证用户是管理员（权限检查）
 *
 * 使用方式：
 *   // 需要登录
 *   app.get("/api/some", auth, handler)
 *
 *   // 需要管理员权限（auth + requireAdmin 组合使用）
 *   app.post("/api/articles", auth, requireAdmin, handler)
 */

import jwt from "jsonwebtoken";
import type { MiddlewareHandler } from "hono";
import { AppError } from "./error-handler.js";
import { config } from "../config.js";
import type { UserRole } from "../store/user-store.js";

/** JWT Payload 中存储的用户信息 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * 鉴权中间件 — 验证 JWT token
 *
 * 验证通过后，把用户信息存到 c.get("user") 中。
 */
export const auth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    throw new AppError(401, "UNAUTHORIZED", "请先登录");
  }

  if (!authHeader.startsWith("Bearer ")) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authorization 格式错误，应为: Bearer <token>"
    );
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JWTPayload;
    c.set("user", payload);
    await next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(401, "TOKEN_EXPIRED", "登录已过期，请重新登录");
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, "INVALID_TOKEN", "无效的 token");
    }
    throw err;
  }
};

/**
 * 管理员权限守卫 — 必须在 auth 之后使用
 *
 * 检查 JWT 中的 role 字段是否为 "admin"。
 * 个人博客只有管理员能写文章、管理 Agent 等。
 */
export const requireAdmin: MiddlewareHandler = async (c, next) => {
  const user = c.get("user") as JWTPayload;

  if (user.role !== "admin") {
    throw new AppError(403, "FORBIDDEN", "需要管理员权限");
  }

  await next();
};

/**
 * 生成 JWT token
 *
 * @param payload 要编码到 token 中的数据
 * @returns JWT 字符串
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: "7d",
  });
}
