/**
 * Tracing helpers (no-op when traces are disabled / no active provider).
 */

import {
  context,
  propagation,
  SpanStatusCode,
  trace,
  type Span,
  type Tracer,
} from "@opentelemetry/api";

const TRACER_NAME = "relayagent";

export function getTracer(): Tracer {
  return trace.getTracer(TRACER_NAME);
}

export function getActiveTraceId(): string | undefined {
  const span = trace.getActiveSpan();
  if (!span) return undefined;
  const id = span.spanContext().traceId;
  return id && id !== "00000000000000000000000000000000" ? id : undefined;
}

export async function withSpan<T>(
  name: string,
  attrs: Record<string, string | number | boolean | undefined>,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const tracer = getTracer();
  const cleaned: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined) cleaned[k] = v;
  }

  return tracer.startActiveSpan(name, { attributes: cleaned }, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : String(err),
      });
      if (err instanceof Error) {
        span.recordException(err);
      }
      throw err;
    } finally {
      span.end();
    }
  });
}

/** Extract W3C trace context from incoming HTTP headers into the active context. */
export function extractTraceContext(
  getter: (key: string) => string | undefined
): void {
  const carrier: Record<string, string> = {};
  const traceparent = getter("traceparent");
  const tracestate = getter("tracestate");
  if (traceparent) carrier.traceparent = traceparent;
  if (tracestate) carrier.tracestate = tracestate;
  const extracted = propagation.extract(context.active(), carrier);
  // Store for middleware to use via context.with — callers wrap next() themselves.
  void extracted;
}

export function runWithExtractedContext<T>(
  getter: (key: string) => string | undefined,
  fn: () => Promise<T>
): Promise<T> {
  const carrier: Record<string, string> = {};
  const traceparent = getter("traceparent");
  const tracestate = getter("tracestate");
  if (traceparent) carrier.traceparent = traceparent;
  if (tracestate) carrier.tracestate = tracestate;
  const extracted = propagation.extract(context.active(), carrier);
  return context.with(extracted, fn);
}
