/**
 * 🚀 服务入口文件
 *
 * 这是整个 agent-server 的启动文件。
 * 它做的事情非常简单：
 *   1. 导入 Hono 应用实例（app.ts 里创建的）
 *   2. 导入配置（端口号等）
 *   3. 用 @hono/node-server 把应用跑在指定端口上
 *
 * 类比：
 *   - app.ts 是"餐厅的菜单和厨房"（定义了能处理哪些请求）
 *   - index.ts 是"开门营业"（让餐厅开始接客）
 */

import { serve } from "@hono/node-server";
// ↑ Hono 的 Node.js 适配器，让 Hono 能跑在 Node.js 环境里
//   （Hono 本身是通用的，也能跑在 Cloudflare Workers、Deno 等环境）

import { app } from "./app.js";
// ↑ 我们的 Hono 应用实例，在 app.ts 里定义了所有中间件和路由

import { config } from "./config.js";
// ↑ 配置信息，包括端口号、API Key 等

const port = config.port; // 默认 3001

console.log(`🚀 Agent server starting on http://localhost:${port}`);

/**
 * serve() 做了什么？
 *   1. 创建一个 HTTP 服务器（底层是 Node.js 的 http.createServer）
 *   2. 把所有收到的 HTTP 请求转发给 app.fetch 处理
 *   3. 监听指定端口，等待请求进来
 *
 * 一旦执行，服务就一直运行着，直到你按 Ctrl+C 停止
 */
serve({
  fetch: app.fetch, // 把 Hono 的请求处理器传给底层 HTTP 服务器
  port,
});

console.log(`✅ Agent server running on http://localhost:${port}`);
