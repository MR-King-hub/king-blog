/**
 * 🔖 请求 ID 中间件
 *
 * 作用：给每个请求分配一个唯一 ID
 *
 * 为什么需要？
 *   想象你的服务同时处理 100 个请求，控制台日志全混在一起，
 *   你根本分不清哪条日志属于哪个请求。
 *
 *   有了 Request ID，所有属于同一个请求的日志都带同一个 ID，
 *   排查问题时用这个 ID 一搜就能找到完整链路。
 *
 * 实现原理：
 *   1. 请求进来时，检查有没有带 X-Request-Id 请求头
 *      （上游服务如 Nginx/网关可能已经生成了）
 *   2. 没有的话，自己生成一个 UUID
 *   3. 把 ID 存到请求上下文中（c.set），后续中间件和 Handler 都能读取
 *   4. 在响应头中也加上这个 ID，方便前端调试时对照
 */

import type { MiddlewareHandler } from "hono";

export const requestId: MiddlewareHandler = async (c, next) => {
  // 优先使用上游传来的 ID，没有就自己生成
  const id = c.req.header("X-Request-Id") || crypto.randomUUID();

  // 存到 Hono 的上下文中，后续可以用 c.get("requestId") 获取
  c.set("requestId", id);

  // 在响应头中也加上，方便前端和日志系统关联
  c.header("X-Request-Id", id);

  // 放行 — 执行下一个中间件或 Handler
  await next();
};
