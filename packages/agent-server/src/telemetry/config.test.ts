import { describe, expect, it, afterEach } from "vitest";
import {
  resolveTelemetryConfig,
  resetTelemetryStateForTests,
  initTelemetry,
  shutdownTelemetry,
  isTelemetryEnabled,
} from "./index.js";
import {
  recordHttpRequest,
  recordChatRequest,
  recordLlmDuration,
  recordLlmTokens,
  recordLlmError,
  initMetrics,
} from "./metrics.js";

describe("resolveTelemetryConfig", () => {
  it("is disabled by default", () => {
    const cfg = resolveTelemetryConfig({});
    expect(cfg.enabled).toBe(false);
    expect(cfg.metricsEnabled).toBe(false);
    expect(cfg.tracesEnabled).toBe(false);
  });

  it("requires dual switch: master alone is not enough", () => {
    const cfg = resolveTelemetryConfig({
      RELAYAGENT_OTEL: "1",
      OTEL_METRICS_EXPORTER: "none",
      OTEL_TRACES_EXPORTER: "none",
    });
    expect(cfg.enabled).toBe(false);
  });

  it("enables metrics when master + otlp metrics exporter", () => {
    const cfg = resolveTelemetryConfig({
      RELAYAGENT_OTEL: "1",
      OTEL_METRICS_EXPORTER: "otlp",
      OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector:4318/",
      OTEL_SERVICE_NAME: "test-api",
    });
    expect(cfg.enabled).toBe(true);
    expect(cfg.metricsEnabled).toBe(true);
    expect(cfg.tracesEnabled).toBe(false);
    expect(cfg.serviceName).toBe("test-api");
    expect(cfg.otlpEndpoint).toBe("http://collector:4318");
  });

  it("enables traces when master + otlp traces exporter", () => {
    const cfg = resolveTelemetryConfig({
      RELAYAGENT_OTEL: "true",
      OTEL_TRACES_EXPORTER: "otlp",
    });
    expect(cfg.enabled).toBe(true);
    expect(cfg.tracesEnabled).toBe(true);
    expect(cfg.metricsEnabled).toBe(false);
  });

  it("parses OTLP headers", () => {
    const cfg = resolveTelemetryConfig({
      RELAYAGENT_OTEL: "1",
      OTEL_METRICS_EXPORTER: "otlp",
      OTEL_EXPORTER_OTLP_HEADERS: "Authorization=Bearer x,X-Scope-OrgID=1",
    });
    expect(cfg.otlpHeaders).toEqual({
      Authorization: "Bearer x",
      "X-Scope-OrgID": "1",
    });
  });
});

describe("initTelemetry", () => {
  afterEach(async () => {
    await shutdownTelemetry();
    resetTelemetryStateForTests();
  });

  it("no-ops when disabled", async () => {
    const cfg = await initTelemetry({
      RELAYAGENT_OTEL: "0",
      OTEL_METRICS_EXPORTER: "otlp",
    });
    expect(cfg.enabled).toBe(false);
    expect(isTelemetryEnabled()).toBe(false);
  });
});

describe("metrics helpers", () => {
  afterEach(() => {
    resetTelemetryStateForTests();
  });

  it("does not throw when meter is uninitialized", () => {
    expect(() =>
      recordHttpRequest({
        method: "GET",
        route: "/api/health",
        status: 200,
        durationMs: 1,
      })
    ).not.toThrow();
    expect(() =>
      recordChatRequest({ agent: "personal-agent", outcome: "success" })
    ).not.toThrow();
    expect(() =>
      recordLlmDuration({
        model: "m",
        agent: "a",
        durationMs: 10,
      })
    ).not.toThrow();
    expect(() =>
      recordLlmTokens({ model: "m", agent: "a", input: 1, output: 2 })
    ).not.toThrow();
    expect(() => recordLlmError({ model: "m", agent: "a" })).not.toThrow();
  });

  it("records after initMetrics without throwing", () => {
    initMetrics();
    expect(() =>
      recordHttpRequest({
        method: "POST",
        route: "/api/chat",
        status: 200,
        durationMs: 12,
      })
    ).not.toThrow();
  });
});
