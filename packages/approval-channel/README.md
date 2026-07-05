# @approval-channel/core

跨平台 **人工审批 IM 通道** — Agent 推送审批请求，人在 IM 里批复，结果回写业务系统。

设计参考 [cc-connect](https://github.com/chenhg5/cc-connect) 的 `core.Platform` 分层：传输适配与业务协议分离，便于接入企微、Telegram、Slack 等。

## 架构

```
┌─────────────────────────────────────────┐
│  业务层（agent-server）                    │
│  sendImNotification / handleOwnerReply  │
└──────────────────┬──────────────────────┘
                   │ ApprovalBot
┌──────────────────▼──────────────────────┐
│  域协议 ApprovalChannel                  │
│  notify(ApprovalRequest) → NotifyResult │
│  onReply(ApprovalReply)                 │
└──────────────────┬──────────────────────┘
                   │ createApprovalChannel({ type })
        ┌──────────┴──────────┐
        ▼                     ▼
   WeComChannel          (Telegram 规划中)
   aibot_* WebSocket
```

### 域类型（`core.ts`）

| 类型 | 说明 |
|------|------|
| `ApprovalRequest` | `{ taskId, body, title?, metadata? }` |
| `ApprovalReply` | 归一化后的审批人回复（含 `taskId`、`approverId`） |
| `ApproverTarget` | owner / 群 ID（配置或自动发现） |

### 任务路由（`task-routing.ts`）

默认在消息正文嵌入 `[TASK:uuid]`；各平台 adapter 可自行扩展（如 Telegram `callback_data`）。

## 快速开始（企微）

```ts
import { ApprovalBot, createApprovalChannel } from "@approval-channel/core";

const channel = createApprovalChannel({
  type: "wecom",
  botId: "xxx",
  botSecret: "xxx",
  ownerUserId: "T30490037A", // 可选，也可自动发现
});

const bot = new ApprovalBot(channel);
await bot.connect();

bot.onReply((taskId, text) => {
  if (taskId) console.log("审批回复", taskId, text);
});

await bot.push("task-uuid", "访客想约面试");
```

向后兼容：

```ts
import { WeComBot } from "@approval-channel/core";
const bot = new WeComBot("bot-id", "bot-secret");
```

## 扩展新平台

1. 在 `platforms/<name>/` 实现 `ApprovalChannel`
2. 在 `factory.ts` 的 `ApprovalChannelConfig` 联合类型中注册
3. 在 `task-routing.ts` 或平台内定义出站/入站 taskId 解析方式

```ts
// 规划示例
export type TelegramChannelConfig = {
  type: "telegram";
  botToken: string;
  ownerChatId?: string;
};
```

## 与 cc-connect 的关系

| | cc-connect | approval-channel |
|--|------------|------------------|
| 场景 | 手机遥控本机 Coding Agent | 访客请求 → 人审批 |
| 抽象 | `core.Platform` 双向对话 | `ApprovalChannel` 审批推送 |
| 企微 | Go `WSPlatform` | TS `WeComChannel`（同协议） |

两者可共存：cc-connect 做全功能 Agent 桥；approval-channel 做 HITL 审批库。

## 开发

```bash
pnpm test
pnpm test:manual
pnpm test:ui
```

## License

MIT
