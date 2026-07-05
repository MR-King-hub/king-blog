/**
 * 企微 ID 自动发现 — 管理端配置页专用
 *
 * 临时建立长连接，等用户在企微里给机器人发消息后提取 owner / group ID。
 * 与生产 WeComBot 互斥（同一 Bot 只能有一个长连接）。
 */
import { WeComChannel } from "@approval-channel/core";
import { closeWeComBot, initWeComBot } from "./im-service.js";

export interface WeComDiscoveryStatus {
  listening: boolean;
  connected: boolean;
  ownerUserId: string | null;
  groupChatId: string | null;
  pushTarget: string | null;
}

let channel: WeComChannel | null = null;
const subscribers = new Set<(status: WeComDiscoveryStatus) => void>();

export function getWeComDiscoveryStatus(): WeComDiscoveryStatus {
  return {
    listening: !!channel,
    connected: channel?.connected ?? false,
    ownerUserId: channel?.getOwnerUserId() ?? null,
    groupChatId: channel?.getGroupChatId() ?? null,
    pushTarget: channel?.getPushTarget() ?? null,
  };
}

function notify(): void {
  const status = getWeComDiscoveryStatus();
  for (const fn of subscribers) {
    try { fn(status); } catch { /* ignore */ }
  }
}

export function subscribeWeComDiscovery(
  fn: (status: WeComDiscoveryStatus) => void,
): () => void {
  subscribers.add(fn);
  fn(getWeComDiscoveryStatus());
  return () => subscribers.delete(fn);
}

export async function startWeComDiscovery(botId: string, botSecret: string): Promise<void> {
  if (!botId?.trim() || !botSecret?.trim()) {
    throw new Error("缺少 Bot ID 或 Secret");
  }

  await stopWeComDiscovery(false);
  closeWeComBot();

  channel = new WeComChannel({
    botId: botId.trim(),
    botSecret: botSecret.trim(),
  });
  channel.onDiscover(() => notify());
  await channel.connect();
  notify();
}

export async function stopWeComDiscovery(reinitBot = true): Promise<void> {
  if (channel) {
    channel.disconnect();
    channel = null;
    notify();
  }
  if (reinitBot) {
    await initWeComBot();
  }
}
