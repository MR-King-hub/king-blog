/**
 * ApprovalBot — 平台无关的应用侧 API
 *
 * 对标业务层使用的 WeComBot，内部持有任意 ApprovalChannel 实现。
 */

import type {
  ApprovalChannel,
  ApprovalReply,
  ApproverTarget,
} from "./core.js";

export class ApprovalBot {
  private readonly channel: ApprovalChannel;
  private readonly replyHandlers: Array<(taskId: string | null, text: string) => void> = [];

  constructor(channel: ApprovalChannel) {
    this.channel = channel;
    this.channel.onReply((reply: ApprovalReply) => {
      const taskId = reply.taskId;
      for (const h of this.replyHandlers) {
        try { h(taskId, reply.text); } catch { /* ignore */ }
      }
    });
  }

  get platform(): ApprovalChannel["platform"] {
    return this.channel.platform;
  }

  get connected(): boolean {
    return this.channel.connected;
  }

  async connect(): Promise<void> {
    await this.channel.connect();
  }

  close(): void {
    this.channel.close();
  }

  /** 推送审批通知 */
  async push(taskId: string, content: string): Promise<boolean> {
    const result = await this.channel.notify({ taskId, body: content });
    if (!result.ok) {
      console.warn(
        `[ApprovalBot/${this.channel.platform}] 推送失败 taskId=${taskId}`,
        result.error || "",
      );
    }
    return result.ok;
  }

  onReply(handler: (taskId: string | null, text: string) => void): void {
    this.replyHandlers.push(handler);
  }

  onDiscover(handler: (target: ApproverTarget) => void): void {
    this.channel.onApproverDiscovered(handler);
  }

  onMessageSent(handler: (taskId: string | null, msgId: string) => void): void {
    this.channel.onMessageSent?.(handler);
  }

  getApproverTarget(): ApproverTarget | null {
    return this.channel.getApproverTarget();
  }

  /** 访问底层 channel（发现流程等高级场景） */
  get rawChannel(): ApprovalChannel {
    return this.channel;
  }
}
