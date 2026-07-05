/**
 * 真实企微集成测试
 * 用法：cd packages/approval-channel && pnpm test:manual
 *
 * 流程：
 *   1. 先在企微里给机器人发任意消息（让它知道你是谁）
 *   2. 脚本自动推送测试消息
 *   3. 长按引用那条消息回复
 */
import "dotenv/config";
import { WeComChannel } from "../src/wecom.js";
import type { Reply } from "../src/core.js";

const BOT_ID = process.env.WECOM_BOT_ID || "";
const BOT_SECRET = process.env.WECOM_BOT_SECRET || "";

if (!BOT_ID || !BOT_SECRET) {
  console.error("缺少 WECOM_BOT_ID / WECOM_BOT_SECRET");
  process.exit(1);
}

async function main() {
  const ch = new WeComChannel({ botId: BOT_ID, botSecret: BOT_SECRET });

  let receivedFirst = false;

  ch.onReply((reply: Reply) => {
    // 第一次收到消息 = 自动发现 owner
    if (!receivedFirst) {
      receivedFirst = true;
      const taskId = `test-${Date.now().toString(36)}`;
      const content = `[集成测试]\n\n引用此消息回复任意文字即可。\n\n[TASK:${taskId}]`;
      console.log(`\n已发现 owner: ${ch.getOwnerUserId()}`);
      console.log(`推送测试消息 (task=${taskId})`);
      ch.notifyOwner(content, taskId).then((r) => {
        console.log(`   结果: ${r?.success ? "成功" : "失败"}`);
        if (!r?.success) {
          console.log("   提示：在企微后台确认机器人已启用");
        }
      });
      return;
    }

    // 后续收到的 = 引用回复
    console.log("\n收到引用回复:");
    console.log(`   text: "${reply.text}"`);
    console.log(`   quotedText: "${reply.quotedText.slice(0, 80)}"`);

    const match = (reply.quotedText + " " + reply.text).match(/\[TASK:([^\]]+)\]/i);
    if (match) {
      console.log(`   [TASK]: ${match[1].trim()} (匹配)`);
    } else {
      console.log("   [TASK]: 未找到");
    }

    if (reply.rawReqId) {
      ch.acknowledge(reply.rawReqId, `收到: "${reply.text}"`);
    }
  });

  console.log("连接企微...");
  await ch.connect();
  console.log(`   状态: ${ch.connected ? "已连接" : "未连接"}\n`);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("现在去企微给机器人发任意消息（如 'hi'）");
  console.log("   发完后机器人会发现你是谁，然后自动推送测试消息");
  console.log("   再长按引用那条消息回复即可");
  console.log("   Ctrl+C 退出");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  process.on("SIGINT", () => { ch.disconnect(); process.exit(0); });
}

main().catch((err) => { console.error(err.message); process.exit(1); });
