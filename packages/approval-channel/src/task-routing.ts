/**
 * 跨平台任务路由 — 应用层约定
 *
 * 各 IM 平台实现应在出站消息中嵌入 taskId，入站时解析。
 * 企微：引用回复 + 正文/引用中的 [TASK:id] 标记
 * Telegram（规划）：reply_to_message_id + callback_data
 * Slack（规划）：thread_ts + metadata
 */

export const TASK_MARKER_RE = /\[TASK:([^\]]+)\]/i;

export function formatTaskMarker(taskId: string): string {
  return `[TASK:${taskId}]`;
}

/** 从引用正文或回复正文中提取 taskId */
export function extractTaskId(...parts: Array<string | undefined | null>): string | null {
  for (const part of parts) {
    if (!part) continue;
    const m = part.match(TASK_MARKER_RE);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

/** 默认出站格式（Markdown 文本内嵌标记，适合企微等） */
export function formatApprovalBody(content: string, taskId: string): string {
  return `${content}\n\n引用回复即可处理。\n${formatTaskMarker(taskId)}`;
}
