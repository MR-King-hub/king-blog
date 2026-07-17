/**
 * 🏷️ 类型声明
 *
 * 定义 Hono 上下文（Context）中自定义变量的类型。
 */

import type { JWTPayload } from "./middleware/auth.js";

/**
 * Hono 环境类型
 */
export type AppEnv = {
  Variables: {
    /** 请求唯一标识（由 requestId 中间件设置） */
    requestId: string;
    /** OTel trace id（由 httpTelemetry 中间件设置，未开启时可为空） */
    traceId?: string;
    /** 当前登录用户信息（由 auth 中间件设置） */
    user: JWTPayload;
  };
};
