// ============================================================
// 企微 WeComChannel — WebSocket 长连接实现
// ============================================================
//
// 基于企微官方长连接协议实现：
//   1. 连接 wss://openws.work.weixin.qq.com
//   2. 发送 aibot_subscribe 订阅
//   3. 每 30 秒心跳 ping
//   4. 接收 aibot_msg_callback（用户消息）
//   5. 通过 aibot_send_msg 主动推送
//   6. 通过 aibot_respond_msg 回复消息
//
// 使用：
//   const channel = new WeComChannel({ botId, botSecret })
//   await channel.connect()
//   await channel.send("userid_or_chatid", { text: "你好" })
//   channel.onReply((reply) => { ... })
// ============================================================

import type {
  ApprovalChannel,
  ApprovalReply,
  ApprovalRequest,
  ApproverTarget,
  NotifyResult,
  OutboundMessage,
  SendResult,
} from "./core.js";
import { extractTaskId, formatApprovalBody, TASK_MARKER_RE } from "./task-routing.js";

/** 延迟加载 ws 模块（兼容 CJS 和 ESM 环境） */
let WS: new (url: string) => any;
async function ensureWS(): Promise<void> {
  if (WS) return;
  const mod: any = await import("ws");
  WS = mod.default || mod;
}

// ── 配置 ──────────────────────────────────────────

export interface WeComChannelOptions {
  botId: string;
  botSecret: string;
  /** 默认推送目标（owner userId 优先，groupChatId 兜底） */
  ownerUserId?: string;
  groupChatId?: string;
}

// ── 协议字段归一化（对齐企微 API 模式机器人长连接协议）──
// 文档：https://open.work.weixin.qq.com/help2/pc/21704
// 接收：chattype/chat_type（single|group 或 1|2）、chatid、from.userid
// 发送：chat_type（1 单聊 / 2 群聊）、chatid

type ChatTypeKind = "single" | "group";

function parseBody(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return (raw as Record<string, unknown>) || {};
}

/** 合并 body 与顶层可能重复的协议字段 */
function getCallbackPayload(msg: Record<string, unknown>): Record<string, unknown> {
  const body = parseBody(msg.body);
  return {
    ...body,
    chatid: body.chatid ?? body.chat_id ?? msg.chatid ?? msg.chat_id,
    chattype: body.chattype ?? body.chat_type ?? msg.chattype ?? msg.chat_type,
    chat_type: body.chat_type ?? body.chattype ?? msg.chat_type ?? msg.chattype,
    from: body.from ?? msg.from,
    aibotid: body.aibotid ?? msg.aibotid,
    msgid: body.msgid ?? msg.msgid,
    event: body.event ?? msg.event,
  };
}

function normalizeChatType(body: Record<string, unknown>): ChatTypeKind {
  const raw = body.chattype ?? body.chat_type;
  if (raw === "group" || raw === 2 || raw === "2") return "group";
  return "single";
}

function extractUserId(body: Record<string, unknown>): string | null {
  const from = body.from as Record<string, unknown> | undefined;
  if (from && typeof from === "object") {
    const uid = (from.userid ?? from.user_id ?? from.id) as string | undefined;
    if (uid) return uid;
  }
  return (
    (body.userid as string | undefined) ||
    (body.user_id as string | undefined) ||
    (body.from_userid as string | undefined) ||
    (body.sender_id as string | undefined) ||
    null
  );
}

function extractChatId(body: Record<string, unknown>): string | null {
  return (body.chatid as string) || (body.chat_id as string) || null;
}

// ── Channel 实现 ──────────────────────────────────

export class WeComChannel implements ApprovalChannel {
  readonly platform = "wecom" as const;

  private ws: any = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectBackoffMs = 1_000;
  private _connected = false;
  private _subscribed = false;
  private _shouldReconnect = true;
  private options: WeComChannelOptions;

  /** 自动发现的群聊 chatid */
  private discoveredGroupChatId: string | null = null;
  /** 自动发现的 owner userId */
  private discoveredOwnerUserId: string | null = null;

  /** 待回复的 req_id → 原始消息文本 */
  private callbackReqMap = new Map<string, string>();
  /** 追踪主动推送 → 是否等待 msgid 回传 */
  private pendingSendMap = new Map<string, string>();
  /** reqId → 任务 ID（用于把真实 msgId 回写） */
  private reqIdToTaskId = new Map<string, string>();

  /** 回复回调列表 */
  private replyHandlers: Array<(reply: ApprovalReply) => void> = [];
  /** 消息发送成功回调列表（reqId → real msgId） */
  private sentHandlers: Array<(taskId: string | null, msgId: string) => void> = [];
  /** 自动发现回调列表 */
  private discoverHandlers: Array<(info: { ownerUserId?: string; groupChatId?: string }) => void> = [];

  // ── 公共属性 ──

  get connected(): boolean {
    return this._connected;
  }

  constructor(options: WeComChannelOptions) {
    this.options = options;
  }

  // ── 连接管理 ──

  async connect(): Promise<void> {
    if (this.options.botId && this.options.botSecret) {
      await this.doConnect();
    }
  }

  disconnect(): void {
    this.close();
  }

  close(): void {
    this._shouldReconnect = false;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._connected = false;
    this._subscribed = false;
  }

  private async doConnect(): Promise<void> {
    this._shouldReconnect = true;
    this._subscribed = false;
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }

    console.log("[WeCom WS] 正在连接 wss://openws.work.weixin.qq.com ...");
    await ensureWS();
    this.ws = new WS("wss://openws.work.weixin.qq.com");

    // 先注册所有事件监听器（重要：message 必须在 open 之前注册，
    // 否则订阅响应到达时会丢失）
    this.ws.on("message", (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());
        this.handleMessage(msg);
      } catch (err) {
        console.error("[WeCom WS] 消息解析失败:", err);
      }
    });

    this.ws.on("close", (code: number, reason: Buffer) => {
      console.warn(`[WeCom WS] 连接关闭: code=${code} reason=${reason.toString()}`);
      this._connected = false;
      this.stopHeartbeat();
      this.scheduleReconnect();
    });

    this.ws.on("error", (err: Error) => {
      console.error("[WeCom WS] 连接错误:", err.message);
    });

    // 等待 WebSocket 连接 + 订阅响应
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("WebSocket 连接超时"));
      }, 10_000);

      this.ws.on("open", () => {
        clearTimeout(timeout);
        console.log("[WeCom WS] WebSocket 已连接，发送订阅...");
        this.reconnectBackoffMs = 1_000;
        this.subscribe();
        this.startHeartbeat();
        // 等 5 秒让订阅响应回来（handleMessage 会设 _connected = true）
        setTimeout(() => resolve(), 5_000);
      });

      // open 事件前的连接错误
      this.ws.on("error", (err: Error) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  private subscribe(): void {
    this.wsSend({
      cmd: "aibot_subscribe",
      headers: { req_id: this.genReqId() },
      body: {
        bot_id: this.options.botId,
        secret: this.options.botSecret,
      },
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.wsSend({ cmd: "ping", headers: { req_id: this.genReqId() } });
    }, 30_000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (!this._shouldReconnect || this.reconnectTimer) return;
    const delay = this.reconnectBackoffMs;
    this.reconnectBackoffMs = Math.min(this.reconnectBackoffMs * 2, 30_000);
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.doConnect();
      } catch {
        this.scheduleReconnect();
      }
    }, delay);
  }

  // ── 消息收发 ──

  async send(target: string, message: OutboundMessage): Promise<SendResult> {
    const reqId = this.genReqId();
    const taskId = (message.context?.taskId as string) || "";
    if (taskId) {
      this.reqIdToTaskId.set(reqId, taskId);
    }

    const chatType = target === this.getGroupChatId() ? 2 : 1;

    this.wsSend({
      cmd: "aibot_send_msg",
      headers: { req_id: reqId },
      body: {
        chatid: target,
        chat_type: chatType,
        msgtype: "markdown",
        markdown: { content: message.text },
      },
    });

    return { msgId: reqId, success: true };
  }

  async acknowledge(reqId: string, content: string): Promise<void> {
    if (!reqId) return;
    this.wsSend({
      cmd: "aibot_respond_msg",
      headers: { req_id: reqId },
      body: {
        msgtype: "markdown",
        markdown: { content },
      },
    });
  }

  onReply(handler: (reply: ApprovalReply) => void): void {
    this.replyHandlers.push(handler);
  }

  onApproverDiscovered(handler: (target: ApproverTarget) => void): void {
    this.discoverHandlers.push(handler);
  }

  /** @deprecated 使用 onApproverDiscovered */
  onDiscover(handler: (info: { ownerUserId?: string; groupChatId?: string }) => void): void {
    this.onApproverDiscovered((t) => handler(t));
  }

  /**
   * 注册"消息已发送"回调 — WeCom 确认消息后调用
   * 回调参数：taskId（notifyOwner 传入的）+ msgId（WeCom 真实消息 ID）
   * 用于把真实 msgId 回写到数据库，实现引用消息路由
   */
  onMessageSent(handler: (taskId: string | null, msgId: string) => void): void {
    this.sentHandlers.push(handler);
  }

  // ── 获取推送目标 ──

  /** 获取要推送到的目标（优先单聊，再群聊） */
  getPushTarget(): string | null {
    return this.getOwnerUserId() || this.getGroupChatId();
  }

  getOwnerUserId(): string | null {
    return this.options.ownerUserId || this.discoveredOwnerUserId || null;
  }

  getGroupChatId(): string | null {
    return this.options.groupChatId || this.discoveredGroupChatId || null;
  }

  private fireDiscover(): void {
    const info = {
      ownerUserId: this.discoveredOwnerUserId || undefined,
      groupChatId: this.discoveredGroupChatId || undefined,
    };
    for (const h of this.discoverHandlers) {
      try { h(info); } catch { /* ignore */ }
    }
  }

  getApproverTarget(): ApproverTarget | null {
    const owner = this.getOwnerUserId();
    const group = this.getGroupChatId();
    if (!owner && !group) return null;
    return {
      ownerUserId: owner || undefined,
      groupChatId: group || undefined,
      primaryTargetId: owner || group || undefined,
    };
  }

  async notify(request: ApprovalRequest): Promise<NotifyResult> {
    const text = formatApprovalBody(request.body, request.taskId);
    const target = this.getPushTarget();
    if (!target) {
      return {
        ok: false,
        error: `no push target (owner=${this.getOwnerUserId() ?? "null"})`,
      };
    }

    console.log(`[WeCom WS] 推送消息到: ${target} (taskId=${request.taskId})`);
    const result = await this.send(target, {
      text,
      context: { taskId: request.taskId, ...request.metadata },
    });
    return {
      ok: result.success,
      platformMessageId: result.msgId,
    };
  }

  /**
   * @deprecated 使用 notify(ApprovalRequest)
   */
  async notifyOwner(text: string, taskId?: string): Promise<SendResult | null> {
    const target = this.getPushTarget();
    if (!target) return null;
    if (!taskId) return this.send(target, { text });
    if (TASK_MARKER_RE.test(text)) {
      return this.send(target, { text, context: { taskId } });
    }
    const r = await this.notify({ taskId, body: text });
    if (!r.ok) return null;
    return { msgId: r.platformMessageId || "", success: true };
  }

  // ── WebSocket 工具 ──

  private wsSend(data: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== 1) { // WebSocket.OPEN === 1
      console.warn("[WeCom WS] Not connected, cannot send:", data.cmd);
      return;
    }
    this.ws.send(JSON.stringify(data));
  }

  private genReqId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private applyDiscovery(payload: Record<string, unknown>, debugLabel?: string): void {
    const chatType = normalizeChatType(payload);
    const chatId = extractChatId(payload);
    const userId = extractUserId(payload);

    if (chatType === "group" && chatId) {
      if (this.discoveredGroupChatId !== chatId) {
        this.discoveredGroupChatId = chatId;
        console.log(`[WeCom WS] 自动发现 group=${chatId}`);
        this.fireDiscover();
      }
      return;
    }

    // 单聊：from.userid 优先，否则 chatid（文档：单聊 chatid 即 userId）
    const ownerId = userId || chatId;
    if (ownerId && !this.discoveredOwnerUserId) {
      this.discoveredOwnerUserId = ownerId;
      console.log(`[WeCom WS] 自动发现 owner=${ownerId}`);
      this.fireDiscover();
      return;
    }

    if (debugLabel && !this.getPushTarget()) {
      console.log(
        `[WeCom WS] 未发现推送目标 (${debugLabel}):`,
        JSON.stringify({ chatType, chatId, userId, keys: Object.keys(payload) }).slice(0, 300),
      );
    }
  }

  // ── 消息分发 ──

  private handleMessage(msg: Record<string, unknown>): void {
    const cmd = msg.cmd as string;
    const errcode = (msg as { errcode?: number }).errcode;
    const errmsg = (msg as { errmsg?: string }).errmsg;

    // 心跳
    if (cmd === "ping" || cmd === "pong") return;

    // 错误响应
    if (errcode && errcode !== 0) {
      console.error(`[WeCom WS] 错误 (${errcode}): ${errmsg}`);
      return;
    }

    // errcode=0 的无 cmd 响应：订阅确认 / 推送回执 / 回复回执（非订阅，静默）
    if (!cmd && errcode === 0) {
      const headers = msg.headers as { req_id?: string };
      const body = parseBody(msg.body);
      const realMsgId = (msg as { msgid?: string }).msgid || (body.msgid as string | undefined);

      if (realMsgId) {
        const reqId = headers?.req_id;
        if (reqId) {
          const taskId = this.reqIdToTaskId.get(reqId) || null;
          this.reqIdToTaskId.delete(reqId);
          console.log(`[WeCom WS] 推送成功 msgid=${realMsgId} reqId=${reqId} taskId=${taskId || "无"}`);
          for (const h of this.sentHandlers) {
            try { h(taskId, realMsgId); } catch { /* ignore */ }
          }
        }
        return;
      }

      // 无 msgid 的 errcode=0 响应（订阅确认 / 回复回执等，仅首次打印）
      if (!this._subscribed) {
        console.log("[WeCom WS] 订阅成功");
        this._subscribed = true;
      }
      this._connected = true;
      return;
    }

    // 其他消息
    if (cmd) {
      console.log(`[WeCom WS] 收到 cmd: ${cmd}`);
    }

    switch (cmd) {
      case "aibot_msg_callback":
        this.handleUserMessage(msg);
        break;

      case "aibot_event_callback":
        this.handleEvent(msg);
        break;

      case "aibot_send_msg_response":
      case "aibot_msg_dispatch_response": {
        const reqId = (msg.headers as { req_id?: string })?.req_id;
        const msgId = (msg.body as { msgid?: string })?.msgid;
        if (reqId && msgId) {
          this.pendingSendMap.delete(reqId);
          const taskId = this.reqIdToTaskId.get(reqId) || null;
          this.reqIdToTaskId.delete(reqId);
          console.log(`[WeCom WS] 消息推送成功 reqId=${reqId} msgid=${msgId} taskId=${taskId || "无"}`);
          // 通知所有监听者（让应用层把 msgId 回写到数据库）
          for (const h of this.sentHandlers) {
            try { h(taskId, msgId); } catch { /* ignore */ }
          }
        }
        break;
      }

    default:
      // 其他 cmd 或无 cmd 的响应都 dump 出来看
      console.log(`[WeCom WS] 未知响应 cmd=${cmd}:`, JSON.stringify(msg).slice(0, 500));
      break;
    }
  }

  private handleUserMessage(msg: Record<string, unknown>): void {
    const payload = getCallbackPayload(msg);
    const headers = msg.headers as { req_id?: string };

    const textSnippet = ((payload.text as { content?: string } | undefined)?.content || "").slice(0, 40);
    const hasQuote = !!payload.quote;
    console.log(`[WeCom WS] 消息: "${textSnippet}"${hasQuote ? " (引用)" : ""}`);

    const text = ((payload.text as { content?: string } | undefined)?.content || "").trim();
    const userId = extractUserId(payload) || "unknown";
    const quotedMsgId = (payload.msgid as string) || "";
    const quotedText = ((payload.quote as { text?: { content?: string } } | undefined)?.text?.content) || "";
    const reqId = headers?.req_id || "";

    this.applyDiscovery(payload, "msg_callback");

    // 记录 reqId
    if (reqId) {
      this.callbackReqMap.set(reqId, text);
    }

    // 触发回复回调
    const reply: ApprovalReply = {
      taskId: extractTaskId(quotedText, text),
      text,
      approverId: userId,
      quotedText,
      platformMessageId: quotedMsgId || "",
      rawReqId: reqId,
      platform: "wecom",
      raw: payload,
    };

    for (const handler of this.replyHandlers) {
      handler(reply);
    }
  }

  private handleEvent(msg: Record<string, unknown>): void {
    const headers = msg.headers as { req_id?: string };
    const payload = getCallbackPayload(msg);
    const eventType = (payload.event as { eventtype?: string } | undefined)?.eventtype;

    if (eventType !== "disconnected_event") {
      this.applyDiscovery(payload, eventType || "event_callback");
    }

    if (eventType === "enter_chat") {
      this.wsSend({
        cmd: "aibot_respond_welcome_msg",
        headers: { req_id: headers?.req_id || this.genReqId() },
        body: {
          msgtype: "text",
          text: {
            content:
              "你好！我是博客通知机器人。当有访客发起面试/合作等请求时，我会通知你。直接回复消息即可处理。",
          },
        },
      });
    }
  }
}
