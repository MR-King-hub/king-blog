// ============================================================
// WeComBot — 企微审批通道便捷入口（向后兼容）
// ============================================================

import { ApprovalBot } from "./approval-bot.js";
import { createApprovalChannel } from "./factory.js";

export interface WeComBotOptions {
  ownerUserId?: string;
  groupChatId?: string;
}

/**
 * 企微 Bot 薄封装。
 * 新代码推荐：`createApprovalChannel({ type: 'wecom', ... })` + `ApprovalBot`。
 */
export class WeComBot extends ApprovalBot {
  constructor(botId: string, botSecret: string, options: WeComBotOptions = {}) {
    super(
      createApprovalChannel({
        type: "wecom",
        botId,
        botSecret,
        ...options,
      }),
    );
    this.rawChannel.connect().catch((err) => {
      console.error("[WeComBot] connect failed:", err);
    });
  }

  get ownerUserId(): string | null {
    const t = this.getApproverTarget();
    return t?.ownerUserId ?? t?.primaryTargetId ?? null;
  }
}
