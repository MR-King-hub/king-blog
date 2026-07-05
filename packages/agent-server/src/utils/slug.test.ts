import { describe, expect, it } from "vitest";
import { isValidSlug, normalizeSlug, slugifyTitle } from "./slug.js";

describe("slugifyTitle", () => {
  it("converts mixed title to kebab-case ascii slug", () => {
    expect(slugifyTitle("RelayAgent 技术栈概览")).toBe(
      "relayagent-tech-stack-overview",
    );
  });

  it("strips punctuation and collapses dashes", () => {
    expect(slugifyTitle("Hello, World!")).toBe("hello-world");
  });
});

describe("normalizeSlug", () => {
  it("normalizes manual slug input", () => {
    expect(normalizeSlug(" RelayAgent-Tech-Stack ")).toBe(
      "relayagent-tech-stack",
    );
  });
});

describe("isValidSlug", () => {
  it("accepts valid slugs", () => {
    expect(isValidSlug("relayagent-tech-stack-overview")).toBe(true);
  });

  it("rejects invalid slugs", () => {
    expect(isValidSlug("bad_slug")).toBe(false);
    expect(isValidSlug("技术栈")).toBe(false);
  });
});
