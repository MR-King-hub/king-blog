/**
 * 🔐 JWT 鉴权中间件
 *
 * ═══ JWT 完整工作流 ═══
 *
 * 第一步：用户登录
 *   POST /api/auth/login { email: "xxx", password: "yyy" }
 *     ↓ 服务端验证密码
 *   返回 { token: "eyJhbGciOiJIUzI1NiJ9..." }
 *     ↓ 前端保存 token（localStorage / Cookie）
 *
 * 第二步：后续请求带上 token
 *   GET /api/articles
 *   Headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9..." }
 *                                     ↑ "Bearer" 是固定前缀，表示这是一个 JWT
 *
 * 第三步：鉴权中间件验证 token
 *   1. 从请求头取出 token
 *   2. 用密钥解密，得到 { userId: "123", email: "xxx" }
 *   3. 验证是否过期
 *   4. 把用户信息挂到请求上下文中
 *   5. 放行（或拦截）
 *
 * ═══ JWT 的结构 ═══
 *
 *   一个 JWT 长这样：xxxxx.yyyyy.zzzzz（三段，用点分隔）
 *
 *   第一段 (Header):  加密算法信息（比如 HS256）
 *   第二段 (Payload): 你存的数据（userId、email、过期时间等）
 *   第三段 (Signature): 签名（用密钥对前两段加密，防篡改）
 *
 *   重要：Payload 只是 Base64 编码，不是加密！
 *   任何人都能解码看到里面的内容，所以不要放密码等敏感信息。
 *   签名的作用是防止有人篡改 Payload — 改了之后签名验证会失败。
 */

import jwt from "jsonwebtoken";
import type { MiddlewareHandler } from "hono";
import { AppError } from "./error-handler.js";
import { config } from "../config.js";

/** JWT Payload 中存储的用户信息 */
export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * 鉴权中间件 — 保护需要登录的接口
 *
 * 使用方式：
 *   // 保护单个路由
 *   app.post("/api/articles", auth, createArticleHandler)
 *
 *   // 保护一组路由
 *   app.use("/api/admin/*", auth)
 */
export const auth: MiddlewareHandler = async (c, next) => {
  // 第 1 步：从请求头取 token
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    // 没带 Authorization 头 → 未登录
    throw new AppError(401, "UNAUTHORIZED", "请先登录");
  }

  // 第 2 步：解析 "Bearer xxx" 格式
  if (!authHeader.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "Authorization 格式错误，应为: Bearer <token>");
  }

  const token = authHeader.slice(7); // 去掉 "Bearer " 前缀（7个字符）

  // 第 3 步：验证 token
  try {
    const payload = jwt.verify(token, config.jwtSecret) as JWTPayload;
    // jwt.verify() 做了两件事：
    //   1. 验证签名（有没有被篡改）
    //   2. 验证是否过期（expiresIn）

    // 第 4 步：把用户信息存到请求上下文中
    c.set("user", payload);
    // 后续的 Handler 可以通过 c.get("user") 获取当前登录用户

    // 第 5 步：放行
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

// ══════════════════════════════════════════════════════════════
// JWT 工具函数
// ══════════════════════════════════════════════════════════════

/**
 * 生成 JWT token
 *
 * @param payload 要编码到 token 中的数据
 * @returns JWT 字符串
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: "7d", // 7 天后过期（根据业务需求调整）
  });
}
