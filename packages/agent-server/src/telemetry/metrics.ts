/**
 * Business metrics for RelayAgent (no-op until initTelemetry enables the meter).
 */

import {
  metrics,
  type Counter,
  type Histogram,
  type Meter,
} from "@opentelemetry/api";

let meter: Meter | null = null;
let httpRequests: Counter | null = null;
let httpDuration: Histogram | null = null;
let chatRequests: Counter | null = null;
let llmDuration: Histogram | null = null;
let llmTokens: Counter | null = null;
let llmErrors: Counter | null = null;

export function initMetrics(): void {
  meter = metrics.getMeter("relayagent");
  httpRequests = meter.createCounter("relayagent.http.requests", {
    description: "HTTP requests handled by agent-server",
  });
  httpDuration = meter.createHistogram("relayagent.http.duration", {
    description: "HTTP request duration in milliseconds",
    unit: "ms",
  });
  chatRequests = meter.createCounter("relayagent.chat.requests", {
    description: "Chat / agent conversation requests",
  });
  llmDuration = meter.createHistogram("relayagent.llm.duration", {
    description: "LLM call duration in milliseconds",
    unit: "ms",
  });
  llmTokens = meter.createCounter("relayagent.llm.tokens", {
    description: "LLM tokens consumed",
  });
  llmErrors = meter.createCounter("relayagent.llm.errors", {
    description: "LLM call errors",
  });
}

export function resetMetricsForTests(): void {
  meter = null;
  httpRequests = null;
  httpDuration = null;
  chatRequests = null;
  llmDuration = null;
  llmTokens = null;
  llmErrors = null;
}

export function recordHttpRequest(attrs: {
  method: string;
  route: string;
  status: number;
  durationMs: number;
}): void {
  const labels = {
    "http.method": attrs.method,
    "http.route": attrs.route,
    "http.status_code": String(attrs.status),
  };
  httpRequests?.add(1, labels);
  httpDuration?.record(attrs.durationMs, labels);
}

export function recordChatRequest(attrs: {
  agent: string;
  outcome: "success" | "error";
}): void {
  chatRequests?.add(1, {
    agent: attrs.agent,
    outcome: attrs.outcome,
  });
}

export function recordLlmDuration(attrs: {
  model: string;
  agent: string;
  durationMs: number;
}): void {
  llmDuration?.record(attrs.durationMs, {
    model: attrs.model,
    agent: attrs.agent,
  });
}

export function recordLlmTokens(attrs: {
  model: string;
  agent: string;
  input?: number;
  output?: number;
}): void {
  if (attrs.input && attrs.input > 0) {
    llmTokens?.add(attrs.input, {
      model: attrs.model,
      agent: attrs.agent,
      direction: "input",
    });
  }
  if (attrs.output && attrs.output > 0) {
    llmTokens?.add(attrs.output, {
      model: attrs.model,
      agent: attrs.agent,
      direction: "output",
    });
  }
}

export function recordLlmError(attrs: {
  model: string;
  agent: string;
}): void {
  llmErrors?.add(1, {
    model: attrs.model,
    agent: attrs.agent,
  });
}
