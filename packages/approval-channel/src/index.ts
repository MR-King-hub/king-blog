export type {
  PlatformKind,
  ApprovalRequest,
  ApprovalReply,
  NotifyResult,
  ApproverTarget,
  ApprovalChannel,
  OutboundMessage,
  SendResult,
  Reply,
} from "./core.js";

export {
  TASK_MARKER_RE,
  formatTaskMarker,
  extractTaskId,
  formatApprovalBody,
} from "./task-routing.js";

export { ApprovalBot } from "./approval-bot.js";

export {
  createApprovalChannel,
  type ApprovalChannelConfig,
  type WeComChannelConfig,
} from "./factory.js";

export { WeComChannel, type WeComChannelOptions } from "./wecom.js";
export { WeComBot, type WeComBotOptions } from "./bot.js";
