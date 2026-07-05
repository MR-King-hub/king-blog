/**
 * WeCom Bot 测试 Web UI
 * 用法：npx tsx scripts/test-server.ts
 * 浏览器打开 http://localhost:3030
 *
 * 首次使用：连接后需在企微里给机器人发一条消息，才能自动发现 owner / group。
 * 也可在 .env 中预设 WECOM_OWNER_USER_ID / WECOM_GROUP_CHAT_ID 跳过发现。
 */
import "dotenv/config";
import { createServer } from "http";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { WeComChannel } from "../src/wecom.js";
import type { Reply } from "../src/core.js";

let channel: WeComChannel | null = null;
let connecting: Promise<void> | null = null;
const sseClients = new Set<import("http").ServerResponse>();

function broadcast(event: string, data: unknown) {
  for (const res of sseClients) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
}

function getStatus() {
  return {
    connected: channel?.connected ?? false,
    ownerUserId: channel?.getOwnerUserId() ?? null,
    groupChatId: channel?.getGroupChatId() ?? null,
    pushTarget: channel?.getPushTarget() ?? null,
  };
}

function createChannel(botId: string, botSecret: string) {
  const ownerUserId = process.env.WECOM_OWNER_USER_ID || undefined;
  const groupChatId = process.env.WECOM_GROUP_CHAT_ID || undefined;

  channel?.disconnect();
  channel = new WeComChannel({ botId, botSecret, ownerUserId, groupChatId });

  channel.onReply((reply: Reply) => broadcast("reply", reply));
  channel.onDiscover((info) => {
    console.log(`[Test UI] 自动发现 owner=${info.ownerUserId ?? "null"} group=${info.groupChatId ?? "null"}`);
    broadcast("discover", getStatus());
  });

  return channel;
}

async function ensureConnected(botId: string, botSecret: string): Promise<WeComChannel> {
  if (channel?.connected) return channel;
  if (connecting) {
    await connecting;
    return channel!;
  }

  createChannel(botId, botSecret);
  connecting = channel!.connect().finally(() => {
    connecting = null;
  });
  await connecting;
  return channel!;
}

function badRequest(res: import("http").ServerResponse, msg: string) {
  res.writeHead(400);
  res.end(JSON.stringify({ ok: false, error: msg }));
}

const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Serve HTML
  if (req.method === "GET" && req.url === "/") {
    const html = readFileSync(resolve(dirname(new URL(import.meta.url).pathname), "test-ui.html"), "utf-8");
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  // SSE
  if (req.url === "/api/events") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    res.write("data: connected\n\n");
    sseClients.add(res);
    req.on("close", () => sseClients.delete(res));
    return;
  }

  const body = await readBody(req);

  // Connect
  if (req.url === "/api/connect" && req.method === "POST") {
    const { botId, botSecret } = JSON.parse(body || "{}");
    if (!botId || !botSecret) return badRequest(res, "缺少 botId / botSecret");
    await ensureConnected(botId, botSecret);
    const status = getStatus();
    broadcast("discover", status);
    res.writeHead(200);
    res.end(JSON.stringify({ ok: channel!.connected, ...status }));
    return;
  }

  // Status
  if (req.url === "/api/status" && req.method === "GET") {
    res.writeHead(200);
    res.end(JSON.stringify(getStatus()));
    return;
  }

  // Disconnect
  if (req.url === "/api/disconnect" && req.method === "POST") {
    channel?.disconnect();
    channel = null;
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // Push
  if (req.url === "/api/push" && req.method === "POST") {
    if (!channel) return badRequest(res, "未连接");
    const status = getStatus();
    if (!status.pushTarget) {
      return badRequest(res, "尚无推送目标，请先在企微里给机器人发一条消息");
    }
    const { taskId, content } = JSON.parse(body || "{}");
    if (!content) return badRequest(res, "缺少 content");
    const text = `${content}\n\n[TASK:${taskId}]`;
    const r = await channel.notifyOwner(text, taskId);
    res.writeHead(200);
    res.end(JSON.stringify({ ok: r?.success, target: r?.msgId, pushTarget: status.pushTarget }));
    return;
  }

  res.writeHead(404);
  res.end("not found");
});

function readBody(req: import("http").IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
  });
}

server.listen(3030, async () => {
  console.log("WeCom Bot Test UI → http://localhost:3030");

  const botId = process.env.WECOM_BOT_ID;
  const botSecret = process.env.WECOM_BOT_SECRET;
  if (botId && botSecret) {
    console.log("[Test UI] 从 .env 自动连接...");
    await ensureConnected(botId, botSecret);
    const status = getStatus();
    if (status.pushTarget) {
      console.log(`[Test UI] 推送目标已就绪: ${status.pushTarget}`);
    } else {
      console.log("[Test UI] 尚无推送目标 — 请在企微里给机器人发一条消息以自动发现 owner / group");
    }
  }
});
