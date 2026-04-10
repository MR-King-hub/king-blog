// ============================================================
// Agent 相关类型
// ============================================================

/** Agent 类型 */
export type AgentType = "writing-assistant" | "content-reviewer";

/** Agent 会话消息角色 */
export type MessageRole = "user" | "assistant" | "system" | "tool";

/** Agent 会话消息 */
export interface AgentMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  /** 如果是 tool 消息，标记工具名称 */
  toolName?: string;
}

/** Agent 请求 */
export interface AgentRequest {
  /** Agent 类型 */
  agentType: AgentType;
  /** 用户输入 */
  message: string;
  /** 会话 ID（可选，不传则新建会话） */
  sessionId?: string;
  /** 上下文（如当前编辑的文章 slug） */
  context?: Record<string, unknown>;
}

/** Agent 流式响应事件 */
export interface AgentStreamEvent {
  /** 事件类型 */
  type: "token" | "tool_call" | "tool_result" | "done" | "error";
  /** 内容 */
  data: string;
  /** 会话 ID */
  sessionId: string;
}

/** Agent 会话信息 */
export interface AgentSession {
  sessionId: string;
  agentType: AgentType;
  messages: AgentMessage[];
  createdAt: string;
  updatedAt: string;
}
