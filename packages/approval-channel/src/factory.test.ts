import { describe, it, expect } from "vitest";
import { createApprovalChannel } from "./factory.js";
import { extractTaskId, formatApprovalBody } from "./task-routing.js";

describe("task-routing", () => {
  it("formatApprovalBody embeds task marker", () => {
    const body = formatApprovalBody("约面试", "abc-123");
    expect(body).toContain("约面试");
    expect(extractTaskId(body)).toBe("abc-123");
  });
});

describe("createApprovalChannel", () => {
  it("creates wecom channel", () => {
    const ch = createApprovalChannel({
      type: "wecom",
      botId: "b",
      botSecret: "s",
    });
    expect(ch.platform).toBe("wecom");
  });

  it("rejects unknown platform", () => {
    expect(() =>
      createApprovalChannel({ type: "matrix" } as never),
    ).toThrow(/Unsupported/);
  });
});
