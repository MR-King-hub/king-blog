/**
 * 📡 Task 事件总线
 *
 * 基于 EventEmitter 实现的 SSE 推送机制。
 * 当 task 通道有新消息写入时，广播给订阅了该 sessionId 的 SSE 连接。
 */

import { EventEmitter } from "events";

// 提高默认监听器上限（多个 SSE 连接可能同时监听）
const emitter = new EventEmitter();
emitter.setMaxListeners(100);

export interface TaskEvent {
  type: "task_message" | "task_update";
  sessionId: string;
  data: unknown;
}

/**
 * 发布 task 事件（写入消息后调用）
 */
export function emitTaskEvent(sessionId: string, event: TaskEvent): void {
  emitter.emit(`task:${sessionId}`, event);
}

/**
 * 订阅某个 session 的 task 事件（SSE 路由调用）
 * 返回取消订阅函数
 */
export function subscribeTaskEvents(
  sessionId: string,
  handler: (event: TaskEvent) => void
): () => void {
  const key = `task:${sessionId}`;
  emitter.on(key, handler);
  return () => emitter.off(key, handler);
}
