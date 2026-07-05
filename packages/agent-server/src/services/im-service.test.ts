/**
 * im-service.ts 单元测试
 *
 * 测试企微智能机器人 WebSocket 长连接服务的核心逻辑：
 *   - 连接管理（初始化、订阅、心跳、重连、关闭）
 *   - 消息处理（用户消息路由、事件回调）
 *   - 主动推送（sendImNotification 降级、未连接、正常推送）
 *   - 错误处理
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventEmitter } from "events";

// ── Mock WebSocket ──────────────────────────────────────

class MockWebSocket extends EventEmitter {
  static OPEN = 1;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  send = vi.fn();
  close = vi.fn();

  simulateOpen() {
    this.emit("open");
  }

  simulateMessage(data: Record<string, unknown>) {
    this.emit("message", Buffer.from(JSON.stringify(data)));
  }

  simulateClose(code = 1000, reason = "") {
    this.readyState = MockWebSocket.CLOSED;
    this.emit("close", code, Buffer.from(reason));
  }

  simulateError(message: string) {
    this.emit("error", new Error(message));
  }
}

let mockWsInstance: MockWebSocket;
let wsConstructorCalls = 0;

// ws 模块必须使用 class 形式的 mock，因为源码用 `new WebSocket(...)`
vi.mock("ws", () => {
  return {
    default: class FakeWebSocket {
      constructor() {
        mockWsInstance = new MockWebSocket();
        wsConstructorCalls++;
        return mockWsInstance;
      }

      static OPEN = 1;
      static CLOSED = 3;
    },
  };
});

// ── Mock 配置对象 ───────────────────────────────────────

const mockConfig = {
  wecomBotId: "",
  wecomBotSecret: "",
  wecomOwnerUserId: "",
  wecomGroupChatId: "",
};

vi.mock("../config.js", () => ({
  config: mockConfig,
}));

// ── Mock task-manager ───────────────────────────────────

const mockHandleOwnerReply = vi.fn();

vi.mock("./task-manager.js", () => ({
  handleOwnerReply: mockHandleOwnerReply,
}));

// ── Mock pending-task-store ─────────────────────────────

vi.mock("../store/pending-task-store.js", () => ({
  pendingTaskStore: {
    findByImMessageId: vi.fn(),
  },
}));

// ── Mock agent-config-store（loadWeComConfig 使用）──────

vi.mock("../store/agent-config-store.js", () => ({
  agentConfigStore: {
    get: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue({}),
  },
}));

// ── Mock prisma（findLatestWaitingTask 使用）─────────────

const mockPrismaFindFirst = vi.fn().mockResolvedValue(null);

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    pendingTask: {
      findFirst: mockPrismaFindFirst,
    },
  },
}));

// ── 测试 ────────────────────────────────────────────────

describe("im-service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    wsConstructorCalls = 0;

    // 重置 config
    mockConfig.wecomBotId = "";
    mockConfig.wecomBotSecret = "";
    mockConfig.wecomOwnerUserId = "";
    mockConfig.wecomGroupChatId = "";

    // 重置 prisma mock
    mockPrismaFindFirst.mockResolvedValue(null);
  });

  afterEach(async () => {
    const { closeWeComBot } = await import("./im-service.js");
    closeWeComBot();
    vi.useRealTimers();
  });

  // ════════════════════════════════════════════════════════
  // initWeComBot — 连接初始化
  // ════════════════════════════════════════════════════════

  describe("initWeComBot", () => {
    it("未配置 WECOM_BOT_ID 时不建立连接", async () => {
      const { initWeComBot } = await import("./im-service.js");
      await initWeComBot();

      expect(wsConstructorCalls).toBe(0);
    });

    it("配置齐全时应建立 WebSocket 连接", async () => {
      mockConfig.wecomBotId = "test-bot-id";
      mockConfig.wecomBotSecret = "test-bot-secret";

      const { initWeComBot } = await import("./im-service.js");
      await initWeComBot();

      expect(wsConstructorCalls).toBe(1);
      expect(mockWsInstance).toBeDefined();
    });

    it("连接成功后应发送 aibot_subscribe 订阅", async () => {
      mockConfig.wecomBotId = "test-bot-id";
      mockConfig.wecomBotSecret = "test-bot-secret";

      const { initWeComBot } = await import("./im-service.js");
      await initWeComBot();
      mockWsInstance.simulateOpen();

      expect(mockWsInstance.send).toHaveBeenCalledTimes(1);
      const sentData = JSON.parse(mockWsInstance.send.mock.calls[0][0]);
      expect(sentData.cmd).toBe("aibot_subscribe");
      expect(sentData.body.bot_id).toBe("test-bot-id");
      expect(sentData.body.secret).toBe("test-bot-secret");
      expect(sentData.headers.req_id).toMatch(/^req-/);
    });

    it("连接成功后应启动心跳（30s 间隔发送 ping）", async () => {
      mockConfig.wecomBotId = "test-bot-id";
      mockConfig.wecomBotSecret = "test-bot-secret";

      const { initWeComBot } = await import("./im-service.js");
      await initWeComBot();
      mockWsInstance.simulateOpen();

      // 初始：1 次 subscribe
      expect(mockWsInstance.send).toHaveBeenCalledTimes(1);

      // 30s 后应发送 ping
      vi.advanceTimersByTime(30_000);
      expect(mockWsInstance.send).toHaveBeenCalledTimes(2);
      const pingData = JSON.parse(mockWsInstance.send.mock.calls[1][0]);
      expect(pingData.cmd).toBe("ping");

      // 再 30s 又一次 ping
      vi.advanceTimersByTime(30_000);
      expect(mockWsInstance.send).toHaveBeenCalledTimes(3);
    });
  });

  // ════════════════════════════════════════════════════════
  // 重连机制
  // ════════════════════════════════════════════════════════

  describe("重连机制", () => {
    it("连接断开后 5s 应自动重连", async () => {
      mockConfig.wecomBotId = "test-bot-id";
      mockConfig.wecomBotSecret = "test-bot-secret";

      const { initWeComBot } = await import("./im-service.js");
      await initWeComBot();

      expect(wsConstructorCalls).toBe(1);

      // 触发连接关闭
      mockWsInstance.simulateClose(1006, "connection lost");

      // 5s 内不重连
      vi.advanceTimersByTime(4_999);
      expect(wsConstructorCalls).toBe(1);

      // 5s 后重连
      vi.advanceTimersByTime(1);
      expect(wsConstructorCalls).toBe(2);
    });
  });

  // ════════════════════════════════════════════════════════
  // 消息处理
  // ════════════════════════════════════════════════════════

  describe("消息处理", () => {
    /**
     * helper：建立连接并完成订阅
     */
    async function connectAndSubscribe() {
      mockConfig.wecomBotId = "test-bot-id";
      mockConfig.wecomBotSecret = "test-bot-secret";

      const mod = await import("./im-service.js");
      await mod.initWeComBot();
      mockWsInstance.simulateOpen();
      // 模拟订阅成功
      mockWsInstance.simulateMessage({ errcode: 0 });
      mockWsInstance.send.mockClear();
      return mod;
    }

    it("订阅成功后 isConnected 应为 true（sendImNotification 返回 wecom- 前缀）", async () => {
      mockConfig.wecomOwnerUserId = "owner-123";
      const { sendImNotification } = await connectAndSubscribe();

      const result = await sendImNotification("test", "task-1");
      expect(result).toBe("wecom-task-1");
    });

    it("收到用户消息且无匹配 task 时应回复提示", async () => {
      await connectAndSubscribe();

      mockWsInstance.simulateMessage({
        cmd: "aibot_msg_callback",
        headers: { req_id: "req-001" },
        body: {
          from: { userid: "user-1" },
          msgtype: "text",
          text: { content: "你好" },
        },
      });

      await vi.advanceTimersByTimeAsync(100);

      const respondCalls = mockWsInstance.send.mock.calls.filter((call) => {
        const data = JSON.parse(call[0]);
        return data.cmd === "aibot_respond_msg";
      });

      expect(respondCalls.length).toBe(1);
      const data = JSON.parse(respondCalls[0][0]);
      expect(data.headers.req_id).toBe("req-001");
      expect(data.body.markdown.content).toContain("没有找到待处理的任务");
    });

    it("消息包含 [TASK:xxx] 时应路由到对应任务并回复确认", async () => {
      mockHandleOwnerReply.mockResolvedValue({
        status: "resolved",
        sessionId: "session-1",
        finalReply: "好的，明天下午 3 点面试",
      });

      await connectAndSubscribe();

      mockWsInstance.simulateMessage({
        cmd: "aibot_msg_callback",
        headers: { req_id: "req-002" },
        body: {
          from: { userid: "owner-1" },
          msgtype: "text",
          text: { content: "[TASK:task-abc] 同意，明天下午3点" },
        },
      });

      await vi.advanceTimersByTimeAsync(100);

      expect(mockHandleOwnerReply).toHaveBeenCalledWith(
        "task-abc",
        "同意，明天下午3点"
      );

      const respondCalls = mockWsInstance.send.mock.calls.filter((call) => {
        const data = JSON.parse(call[0]);
        return data.cmd === "aibot_respond_msg";
      });

      expect(respondCalls.length).toBe(1);
      const data = JSON.parse(respondCalls[0][0]);
      expect(data.body.markdown.content).toContain("已回复访客");
    });

    it("[TASK:xxx] 标记应被正确剥离，只传递纯文本给 handleOwnerReply", async () => {
      mockHandleOwnerReply.mockResolvedValue({
        sessionId: "s1",
        finalReply: "ok",
      });

      await connectAndSubscribe();

      mockWsInstance.simulateMessage({
        cmd: "aibot_msg_callback",
        headers: { req_id: "req-strip" },
        body: {
          from: { userid: "owner-1" },
          msgtype: "text",
          text: { content: "[TASK:t-123] 同意" },
        },
      });

      await vi.advanceTimersByTimeAsync(100);

      expect(mockHandleOwnerReply).toHaveBeenCalledWith("t-123", "同意");
    });

    it("handleOwnerReply 返回 not_found 时应提示任务不存在", async () => {
      mockHandleOwnerReply.mockResolvedValue({ status: "not_found" });

      await connectAndSubscribe();

      mockWsInstance.simulateMessage({
        cmd: "aibot_msg_callback",
        headers: { req_id: "req-003" },
        body: {
          from: { userid: "owner-1" },
          msgtype: "text",
          text: { content: "[TASK:task-not-exist] 同意" },
        },
      });

      await vi.advanceTimersByTimeAsync(100);

      const respondCalls = mockWsInstance.send.mock.calls.filter((call) => {
        const data = JSON.parse(call[0]);
        return data.cmd === "aibot_respond_msg";
      });

      expect(respondCalls.length).toBe(1);
      const data = JSON.parse(respondCalls[0][0]);
      expect(data.body.markdown.content).toContain("任务不存在或已处理过");
    });

    it("没有 [TASK:xxx] 时应自动查找最近的 waiting_owner 任务", async () => {
      mockPrismaFindFirst.mockResolvedValue({
        id: "task-auto-match",
        status: "waiting_owner",
      });
      mockHandleOwnerReply.mockResolvedValue({
        sessionId: "session-2",
        finalReply: "已安排",
      });

      await connectAndSubscribe();

      mockWsInstance.simulateMessage({
        cmd: "aibot_msg_callback",
        headers: { req_id: "req-004" },
        body: {
          from: { userid: "owner-1" },
          msgtype: "text",
          text: { content: "可以的，安排" },
        },
      });

      await vi.advanceTimersByTimeAsync(100);

      expect(mockHandleOwnerReply).toHaveBeenCalledWith(
        "task-auto-match",
        "可以的，安排"
      );
    });

    it("空消息内容应被忽略", async () => {
      await connectAndSubscribe();

      mockWsInstance.simulateMessage({
        cmd: "aibot_msg_callback",
        headers: { req_id: "req-005" },
        body: {
          from: { userid: "user-1" },
          msgtype: "text",
          text: { content: "  " },
        },
      });

      await vi.advanceTimersByTimeAsync(100);

      const respondCalls = mockWsInstance.send.mock.calls.filter((call) => {
        const data = JSON.parse(call[0]);
        return data.cmd === "aibot_respond_msg";
      });
      expect(respondCalls.length).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════
  // 事件处理
  // ════════════════════════════════════════════════════════

  describe("事件处理", () => {
    async function connectAndSubscribe() {
      mockConfig.wecomBotId = "test-bot-id";
      mockConfig.wecomBotSecret = "test-bot-secret";

      const mod = await import("./im-service.js");
      await mod.initWeComBot();
      mockWsInstance.simulateOpen();
      mockWsInstance.simulateMessage({ errcode: 0 });
      mockWsInstance.send.mockClear();
      return mod;
    }

    it("enter_chat 事件应发送欢迎语", async () => {
      await connectAndSubscribe();

      mockWsInstance.simulateMessage({
        cmd: "aibot_event_callback",
        headers: { req_id: "req-event-1" },
        body: {
          event: { eventtype: "enter_chat" },
        },
      });

      const calls = mockWsInstance.send.mock.calls.filter((call) => {
        const data = JSON.parse(call[0]);
        return data.cmd === "aibot_respond_welcome_msg";
      });

      expect(calls.length).toBe(1);
      const data = JSON.parse(calls[0][0]);
      expect(data.body.text.content).toContain("博客通知机器人");
    });

    it("disconnected_event 应记录日志但不崩溃", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await connectAndSubscribe();

      mockWsInstance.simulateMessage({
        cmd: "aibot_event_callback",
        headers: { req_id: "req-event-2" },
        body: {
          event: { eventtype: "disconnected_event" },
        },
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("断连事件")
      );

      warnSpy.mockRestore();
    });

    it("未知 cmd 不应崩溃（静默忽略）", async () => {
      await connectAndSubscribe();

      expect(() => {
        mockWsInstance.simulateMessage({
          cmd: "unknown_command",
          headers: {},
          body: {},
        });
      }).not.toThrow();
    });
  });

  // ════════════════════════════════════════════════════════
  // sendImNotification
  // ════════════════════════════════════════════════════════

  describe("sendImNotification", () => {
    it("未配置企微时应降级为日志打印，返回 local- 前缀", async () => {
      const { sendImNotification } = await import("./im-service.js");
      const result = await sendImNotification("测试通知", "task-001");
      expect(result).toBe("local-task-001");
    });

    it("配置了企微但未连接时，返回 offline- 前缀", async () => {
      mockConfig.wecomBotId = "bot-id";
      mockConfig.wecomBotSecret = "bot-secret";

      // 不调用 initWeComBot，isConnected = false
      const { sendImNotification } = await import("./im-service.js");
      const result = await sendImNotification("测试通知", "task-002");
      expect(result).toBe("offline-task-002");
    });

    it("已连接且配置 ownerUserId 时应发送 aibot_send_msg", async () => {
      mockConfig.wecomBotId = "bot-id";
      mockConfig.wecomBotSecret = "bot-secret";
      mockConfig.wecomOwnerUserId = "owner-user-1";

      const { initWeComBot, sendImNotification } = await import("./im-service.js");
      await initWeComBot();
      mockWsInstance.simulateOpen();
      mockWsInstance.simulateMessage({ errcode: 0 });
      mockWsInstance.send.mockClear();

      const result = await sendImNotification("新的面试请求", "task-003");

      expect(result).toBe("wecom-task-003");
      expect(mockWsInstance.send).toHaveBeenCalledTimes(1);

      const sentData = JSON.parse(mockWsInstance.send.mock.calls[0][0]);
      expect(sentData.cmd).toBe("aibot_send_msg");
      expect(sentData.body.chatid).toBe("owner-user-1");
      expect(sentData.body.chat_type).toBe(1);
      expect(sentData.body.msgtype).toBe("markdown");
      expect(sentData.body.markdown.content).toContain("新的面试请求");
      expect(sentData.body.markdown.content).toContain("[TASK:task-003]");
    });

    it("已连接但未配置 ownerUserId 时不发送消息（降级为日志）", async () => {
      mockConfig.wecomBotId = "bot-id";
      mockConfig.wecomBotSecret = "bot-secret";
      mockConfig.wecomOwnerUserId = "";

      const { initWeComBot, sendImNotification } = await import("./im-service.js");
      await initWeComBot();
      mockWsInstance.simulateOpen();
      mockWsInstance.simulateMessage({ errcode: 0 });
      mockWsInstance.send.mockClear();

      const result = await sendImNotification("通知内容", "task-004");
      expect(result).toBe("wecom-task-004");
      // 不应发送 aibot_send_msg
      expect(mockWsInstance.send).toHaveBeenCalledTimes(0);
    });

    it("发送的消息末尾应包含 TASK 标记以便 owner 回复时路由", async () => {
      mockConfig.wecomBotId = "bot-id";
      mockConfig.wecomBotSecret = "bot-secret";
      mockConfig.wecomOwnerUserId = "owner-1";

      const { initWeComBot, sendImNotification } = await import("./im-service.js");
      await initWeComBot();
      mockWsInstance.simulateOpen();
      mockWsInstance.simulateMessage({ errcode: 0 });
      mockWsInstance.send.mockClear();

      await sendImNotification("面试请求", "task-route-test");

      const sentData = JSON.parse(mockWsInstance.send.mock.calls[0][0]);
      expect(sentData.body.markdown.content).toContain("**[TASK:task-route-test]**");
    });

    it("同时配置了 ownerUserId 和 groupChatId 时应优先单聊推送", async () => {
      mockConfig.wecomBotId = "bot-id";
      mockConfig.wecomBotSecret = "bot-secret";
      mockConfig.wecomOwnerUserId = "owner-1";
      mockConfig.wecomGroupChatId = "group-chat-001";

      const { initWeComBot, sendImNotification } = await import("./im-service.js");
      await initWeComBot();
      mockWsInstance.simulateOpen();
      mockWsInstance.simulateMessage({ errcode: 0 });
      mockWsInstance.send.mockClear();

      await sendImNotification("新的合作请求", "task-group-1");

      const sentData = JSON.parse(mockWsInstance.send.mock.calls[0][0]);
      expect(sentData.cmd).toBe("aibot_send_msg");
      expect(sentData.body.chatid).toBe("owner-1");
      expect(sentData.body.chat_type).toBe(1);
    });

    it("无 ownerUserId 时通过自动发现的群 chatid 推送到群聊", async () => {
      mockConfig.wecomBotId = "bot-id";
      mockConfig.wecomBotSecret = "bot-secret";
      mockConfig.wecomOwnerUserId = ""; // 没有配置单聊
      mockConfig.wecomGroupChatId = ""; // 也没手动配群聊

      const { initWeComBot, sendImNotification } = await import("./im-service.js");
      await initWeComBot();
      mockWsInstance.simulateOpen();
      mockWsInstance.simulateMessage({ errcode: 0 });

      // 模拟收到一条群消息（自动发现 chatid）
      mockWsInstance.simulateMessage({
        cmd: "aibot_msg_callback",
        headers: { req_id: "req-group-discover" },
        body: {
          chatid: "discovered-group-123",
          chattype: "group",
          from: { userid: "someone" },
          msgtype: "text",
          text: { content: "hello" },
        },
      });

      await vi.advanceTimersByTimeAsync(100);
      mockWsInstance.send.mockClear();

      // 无 ownerUserId，应走群聊
      await sendImNotification("自动发现群聊推送", "task-auto-group");

      const sentData = JSON.parse(mockWsInstance.send.mock.calls[0][0]);
      expect(sentData.body.chatid).toBe("discovered-group-123");
      expect(sentData.body.chat_type).toBe(2);
    });
  });

  // ════════════════════════════════════════════════════════
  // closeWeComBot
  // ════════════════════════════════════════════════════════

  describe("closeWeComBot", () => {
    it("应关闭 WebSocket 并停止心跳", async () => {
      mockConfig.wecomBotId = "bot-id";
      mockConfig.wecomBotSecret = "bot-secret";

      const { initWeComBot, closeWeComBot } = await import("./im-service.js");
      await initWeComBot();
      mockWsInstance.simulateOpen();

      const wsRef = mockWsInstance;
      closeWeComBot();

      expect(wsRef.close).toHaveBeenCalled();

      // 心跳不再触发
      wsRef.send.mockClear();
      vi.advanceTimersByTime(60_000);
      expect(wsRef.send).not.toHaveBeenCalled();
    });

    it("closeWeComBot 后 sendImNotification 应返回 offline-", async () => {
      mockConfig.wecomBotId = "bot-id";
      mockConfig.wecomBotSecret = "bot-secret";

      const { initWeComBot, closeWeComBot, sendImNotification } = await import("./im-service.js");
      await initWeComBot();
      mockWsInstance.simulateOpen();
      mockWsInstance.simulateMessage({ errcode: 0 });

      closeWeComBot();

      const result = await sendImNotification("test", "task-after-close");
      expect(result).toBe("offline-task-after-close");
    });
  });

  // ════════════════════════════════════════════════════════
  // 错误处理
  // ════════════════════════════════════════════════════════

  describe("错误处理", () => {
    async function connectAndSubscribe() {
      mockConfig.wecomBotId = "test-bot-id";
      mockConfig.wecomBotSecret = "test-bot-secret";

      const mod = await import("./im-service.js");
      await mod.initWeComBot();
      mockWsInstance.simulateOpen();
      mockWsInstance.simulateMessage({ errcode: 0 });
      mockWsInstance.send.mockClear();
      return mod;
    }

    it("handleOwnerReply 抛异常时应回复错误提示", async () => {
      mockHandleOwnerReply.mockRejectedValue(new Error("DB connection failed"));
      await connectAndSubscribe();

      mockWsInstance.simulateMessage({
        cmd: "aibot_msg_callback",
        headers: { req_id: "req-err-1" },
        body: {
          from: { userid: "owner-1" },
          msgtype: "text",
          text: { content: "[TASK:task-err] 同意" },
        },
      });

      await vi.advanceTimersByTimeAsync(100);

      const respondCalls = mockWsInstance.send.mock.calls.filter((call) => {
        const data = JSON.parse(call[0]);
        return data.cmd === "aibot_respond_msg";
      });

      expect(respondCalls.length).toBe(1);
      const data = JSON.parse(respondCalls[0][0]);
      expect(data.body.markdown.content).toContain("处理失败");
    });

    it("WebSocket 错误事件不应导致崩溃", async () => {
      mockConfig.wecomBotId = "test-bot-id";
      mockConfig.wecomBotSecret = "test-bot-secret";

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { initWeComBot } = await import("./im-service.js");
      await initWeComBot();

      expect(() => {
        mockWsInstance.simulateError("ECONNREFUSED");
      }).not.toThrow();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("连接错误"),
        "ECONNREFUSED"
      );

      errorSpy.mockRestore();
    });

    it("收到无法解析的 JSON 时不应崩溃", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      await connectAndSubscribe();

      expect(() => {
        mockWsInstance.emit("message", Buffer.from("not-json{{{"));
      }).not.toThrow();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("消息解析失败"),
        expect.any(SyntaxError)
      );

      errorSpy.mockRestore();
    });

    it("wsSend 在未连接时应 warn 但不崩溃", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // 不建立连接，直接调 sendImNotification → 内部 wsSend 会被调用但 ws 为 null
      // 这种场景已由 sendImNotification 的降级逻辑覆盖
      mockConfig.wecomBotId = "bot-id";
      mockConfig.wecomBotSecret = "bot-secret";
      mockConfig.wecomOwnerUserId = "owner";

      const { initWeComBot, closeWeComBot, sendImNotification } = await import("./im-service.js");
      await initWeComBot();
      mockWsInstance.simulateOpen();
      mockWsInstance.simulateMessage({ errcode: 0 });

      // 模拟 ws 变为 CLOSED
      mockWsInstance.readyState = MockWebSocket.CLOSED;
      mockWsInstance.send.mockClear();

      // sendProactiveMessage 内的 wsSend 应 warn
      await sendImNotification("test", "task-closed");

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Not connected"),
        expect.anything()
      );

      warnSpy.mockRestore();
    });
  });
});
