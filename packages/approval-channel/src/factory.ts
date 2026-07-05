/**
 * 审批通道工厂 — 按平台类型创建 adapter
 */

import type { ApprovalChannel } from "./core.js";
import { WeComChannel, type WeComChannelOptions } from "./wecom.js";

export type WeComChannelConfig = WeComChannelOptions & { type: "wecom" };

/** 后续扩展：| TelegramChannelConfig | SlackChannelConfig */
export type ApprovalChannelConfig = WeComChannelConfig;

export function createApprovalChannel(config: ApprovalChannelConfig): ApprovalChannel {
  switch (config.type) {
    case "wecom": {
      const { type: _type, ...options } = config;
      return new WeComChannel(options);
    }
    default: {
      const unknown = (config as { type: string }).type;
      throw new Error(`Unsupported approval channel platform: ${unknown}`);
    }
  }
}
