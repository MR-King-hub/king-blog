/**
 * 🏷️ 类型声明
 *
 * 这个文件定义了 Hono 上下文（Context）中自定义变量的类型。
 *
 * 为什么需要这个？
 *   我们在中间件中用 c.set("requestId", id) 和 c.set("user", payload)
 *   存储了自定义数据。但 Hono 默认不知道这些变量的类型，
 *   所以 c.get("user") 会报类型错误。
 *
 *   通过定义 Env 类型，告诉 Hono "我的上下文中有哪些自定义变量"
 */

import type { JWTPayload } from "./middleware/auth.js";

/**
 * Hono 环境类型
 *
 * Variables 中定义的变量可以通过 c.set() 和 c.get() 存取
 */
export type AppEnv = {
  Variables: {
    /** 请求唯一标识（由 requestId 中间件设置） */
    requestId: string;
    /** 当前登录用户信息（由 auth 中间件设置） */
    user: JWTPayload;
  };
};
