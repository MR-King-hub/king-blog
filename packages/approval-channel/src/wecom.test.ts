import { describe, it, expect } from "vitest";
import { WeComChannel } from "./wecom.js";
import type { ApprovalReply } from "./core.js";

function createChannel() {
  return new WeComChannel({ botId: "test", botSecret: "test" });
}

function feed(ch: WeComChannel, msg: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ch as any).handleMessage(msg);
}

/** 收集所有 Reply */
function collectReplies(ch: WeComChannel): ApprovalReply[] {
  const replies: ApprovalReply[] = [];
  ch.onReply((r) => replies.push(r));
  return replies;
}

// ================================================================
describe("subscribe", () => {
  it("err=0 sets connected", () => {
    const ch = createChannel();
    expect(ch.connected).toBe(false);
    feed(ch, { headers: { req_id: "r1" }, errcode: 0, errmsg: "ok" });
    expect(ch.connected).toBe(true);
  });
});

// ================================================================
describe("quote reply (真实消息体)", () => {
  it("quotedText 包含 [TASK:UUID]", () => {
    const ch = createChannel();
    const replies = collectReplies(ch);

    feed(ch, {
      cmd: "aibot_msg_callback",
      body: {
        msgid: "m1",
        from: { userid: "T001" },
        msgtype: "text",
        text: { content: "可以" },
        quote: {
          text: { content: "面试邀约\n[TASK:ebc0ad7b-6901-4e14-8454-90162041b834]" },
        },
      },
    });

    expect(replies[0].text).toBe("可以");
    expect(replies[0].quotedText).toContain("[TASK:ebc0ad7b-6901-4e14-8454-90162041b834]");
    expect(replies[0].rawReqId).toBe("");
  });
});

describe("plain text", () => {
  it("无引用时 quotedText 为空", () => {
    const ch = createChannel();
    const replies = collectReplies(ch);

    feed(ch, {
      cmd: "aibot_msg_callback",
      body: {
        msgid: "m2",
        from: { userid: "T001" },
        msgtype: "text",
        text: { content: "你好" },
      },
    });

    expect(replies[0].text).toBe("你好");
    expect(replies[0].quotedText).toBe("");
  });
});

describe("auto discover", () => {
  it("chat_type=1 + chatid 可发现 owner（无 from.userid）", () => {
    const ch = createChannel();
    const discovered: Array<{ ownerUserId?: string }> = [];
    ch.onDiscover((info) => discovered.push(info));

    feed(ch, {
      cmd: "aibot_msg_callback",
      body: {
        chatid: "wmUser123",
        chat_type: 1,
        msgtype: "text",
        text: { content: "1" },
      },
    });

    expect(ch.getOwnerUserId()).toBe("wmUser123");
    expect(discovered[0]?.ownerUserId).toBe("wmUser123");
  });

  it("enter_chat 事件带 chatid 可发现 owner", () => {
    const ch = createChannel();
    feed(ch, {
      cmd: "aibot_event_callback",
      body: {
        chatid: "wmOwner456",
        chat_type: 1,
        event: { eventtype: "enter_chat" },
      },
    });

    expect(ch.getOwnerUserId()).toBe("wmOwner456");
  });

  it("chat_id + chat_type 可发现 owner", () => {
    const ch = createChannel();
    feed(ch, {
      cmd: "aibot_msg_callback",
      body: {
        chat_id: "wmUser789",
        chat_type: 1,
        msgtype: "text",
        text: { content: "hi" },
      },
    });
    expect(ch.getOwnerUserId()).toBe("wmUser789");
  });

  it("from.user_id 可发现 owner", () => {
    const ch = createChannel();
    feed(ch, {
      cmd: "aibot_msg_callback",
      body: {
        chattype: "single",
        from: { user_id: "wmUserABC" },
        msgtype: "text",
        text: { content: "hi" },
      },
    });
    expect(ch.getOwnerUserId()).toBe("wmUserABC");
  });
});

// ================================================================
import { TASK_MARKER_RE } from "./task-routing.js";

describe("[TASK:UUID] regex", () => {
  it("matches valid UUID", () => {
    const m = "面试邀约\n[TASK:ebc0ad7b-6901-4e14-8454-90162041b834]".match(TASK_MARKER_RE);
    expect(m![1]).toBe("ebc0ad7b-6901-4e14-8454-90162041b834");
    expect(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m![1])
    ).toBe(true);
  });

  it("rejects non-UUID", () => {
    const m = "[TASK:interview_schedule]".match(TASK_MARKER_RE);
    expect(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m![1])
    ).toBe(false);
  });
});
