/**
 * 🤖 Agent 基础接口定义
 *
 * 这个文件定义了所有 Agent 必须遵守的"契约"（接口）。
 *
 * 为什么要定义接口？
 *   类似于插头标准 — 不管是什么品牌的电器（Agent），
 *   只要符合这个插头标准，就能插到我们的系统里工作。
 *
 *   这样做的好处：
 *   - 路由层不需要知道具体用了哪个 Agent，调 agent.stream() 就行
 *   - 新增 Agent 只需要实现这个接口，不用改路由代码
 *   - 测试时可以用一个假的 Agent（Mock）替代真实的
 */

import type { AgentStreamEvent } from "@blog/shared";

/** Agent 调用时的上下文信息 */
export interface AgentContext {
  /** 会话 ID — 用于多轮对话时识别是同一个会话 */
  sessionId: string;
  /** 额外上下文 — 比如当前正在编辑的文章 slug */
  context?: Record<string, unknown>;
}

/** Agent 产出的单个事件（不含 sessionId，sessionId 在路由层加上） */
export type AgentEvent = Omit<AgentStreamEvent, "sessionId">;

/**
 * Agent 基础接口 — 所有 Agent 都必须实现这个接口
 *
 * 接口只有两个要求：
 *   1. 有一个 name 属性
 *   2. 有一个 stream() 方法，接收消息并返回异步事件流
 */
export interface BaseAgent {
  /** Agent 名称 */
  name: string;

  /**
   * 流式对话
   *
   * @param message  用户发送的消息
   * @param ctx      上下文信息（会话ID、附加上下文）
   * @returns        异步可迭代对象 — 每次 yield 一个事件，前端收到一个 SSE 消息
   *
   * AsyncIterable 是什么？
   *   可以用 for-await-of 遍历的异步数据源。
   *   Agent 每"想出"一小段内容，就 yield 一个事件，
   *   路由层收到后立即推送给前端 — 这就是流式输出的原理。
   */
  stream(message: string, ctx: AgentContext): Promise<AsyncIterable<AgentEvent>>;
}
