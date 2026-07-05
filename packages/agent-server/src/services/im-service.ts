import {
  ApprovalBot,
  createApprovalChannel,
  type ApproverTarget,
} from "@approval-channel/core";
import { handleOwnerReply } from "./task-manager.js";
import { agentConfigStore } from "../store/agent-config-store.js";

let bot: ApprovalBot | null = null;

async function loadConfig() {
  const db = await agentConfigStore.get();
  return {
    botId: db?.wecomBotId || "",
    botSecret: db?.wecomBotSecret || "",
    ownerUserId: db?.wecomOwnerUserId || "",
    groupChatId: db?.wecomGroupChatId || "",
  };
}

export async function initWeComBot(): Promise<void> {
  const cfg = await loadConfig();
  if (!cfg.botId || !cfg.botSecret) return;

  bot?.close();
  bot = new ApprovalBot(
    createApprovalChannel({
      type: "wecom",
      botId: cfg.botId,
      botSecret: cfg.botSecret,
      ownerUserId: cfg.ownerUserId || undefined,
      groupChatId: cfg.groupChatId || undefined,
    }),
  );
  bot.onReply((taskId, text) => {
    if (taskId) handleOwnerReply(taskId, text);
  });
  bot.onDiscover((info: ApproverTarget) => {
    agentConfigStore.update({
      wecomOwnerUserId: info.ownerUserId,
      wecomGroupChatId: info.groupChatId,
    }).catch(() => {});
  });
  await bot.connect();
}

async function ensureBot(): Promise<ApprovalBot | null> {
  const cfg = await loadConfig();
  if (!cfg.botId || !cfg.botSecret) return null;
  if (!bot) await initWeComBot();
  return bot;
}

export async function sendImNotification(content: string, taskId: string): Promise<string | null> {
  const activeBot = await ensureBot();
  if (!activeBot) return null;
  const ok = await activeBot.push(taskId, content);
  return ok ? `sent-${taskId}` : null;
}

export function closeWeComBot(): void {
  bot?.close();
  bot = null;
}

/** 供发现流程等需要底层 channel 的场景 */
export function getApprovalBot(): ApprovalBot | null {
  return bot;
}
