// ============================================================
// approval-channel — 人工审批通道域协议
//
// 分层（参考 cc-connect Platform / Bridge 思路）：
//   1. ApprovalChannel — 平台无关的审批 IM 接口（本文件）
//   2. platforms/*   — 各 IM 传输适配（wecom、telegram…）
//   3. ApprovalBot   — 应用侧薄封装（push / onReply）
// ============================================================

/** 已支持或规划中的平台 */
export type PlatformKind = "wecom" | "telegram" | "slack" | "webhook";

/** 推送给审批人的请求 */
export interface ApprovalRequest {
  taskId: string;
  /** 可选标题（部分平台用于卡片标题） */
  title?: string;
  /** 正文，Markdown */
  body: string;
  metadata?: Record<string, unknown>;
}

/** 审批人回复（各 adapter 归一化后） */
export interface ApprovalReply {
  taskId: string | null;
  text: string;
  approverId: string;
  quotedText: string;
  platformMessageId: string;
  rawReqId: string;
  platform: PlatformKind;
  raw?: unknown;
}

/** 推送结果 */
export interface NotifyResult {
  ok: boolean;
  platformMessageId?: string;
  error?: string;
}

/** 审批人推送目标（自动发现或配置） */
export interface ApproverTarget {
  ownerUserId?: string;
  groupChatId?: string;
  /** 其他平台的通用主目标 ID */
  primaryTargetId?: string;
}

/**
 * 审批通道 — 所有 IM 适配器必须实现
 *
 * 对标 cc-connect 的 core.Platform，但面向「Agent 推审批 → 人批复」，
 * 而非双向 Agent 对话。
 */
export interface ApprovalChannel {
  readonly platform: PlatformKind;

  connect(): Promise<void>;
  close(): void;
  readonly connected: boolean;

  /** 推送审批请求给 owner */
  notify(request: ApprovalRequest): Promise<NotifyResult>;

  /** 审批人回复（引用回复、thread 回复等） */
  onReply(handler: (reply: ApprovalReply) => void): void;

  /** owner / 群 自动发现 */
  onApproverDiscovered(handler: (target: ApproverTarget) => void): void;

  /** 平台确认消息已发出（可用于 msgId ↔ taskId 持久化） */
  onMessageSent?(handler: (taskId: string | null, platformMessageId: string) => void): void;

  getApproverTarget(): ApproverTarget | null;
}

// ── 传输层辅助类型（adapter 内部可用）──

export interface OutboundMessage {
  text: string;
  context?: Record<string, unknown>;
}

export interface SendResult {
  msgId: string;
  success: boolean;
}

/** @deprecated 使用 ApprovalReply */
export type Reply = ApprovalReply;
