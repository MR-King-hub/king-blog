/**
 * HTTP request tracing + metrics middleware.
 * Correlates with requestId and optionally W3C traceparent.
 */

import type { MiddlewareHandler } from "hono";
import { SpanStatusCode } from "@opentelemetry/api";

import { recordHttpRequest } from "../telemetry/metrics.js";
import {
  getActiveTraceId,
  getTracer,
  runWithExtractedContext,
} from "../telemetry/tracing.js";

export const httpTelemetry: MiddlewareHandler = async (c, next) => {
  const started = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await runWithExtractedContext(
    (key) => c.req.header(key),
    async () => {
      const tracer = getTracer();
      await tracer.startActiveSpan(
        `HTTP ${method} ${path}`,
        {
          attributes: {
            "http.method": method,
            "http.route": path,
            "http.request_id": c.get("requestId") || "",
          },
        },
        async (span) => {
          const traceId = getActiveTraceId();
          if (traceId) {
            c.set("traceId", traceId);
            c.header("X-Trace-Id", traceId);
          }

          try {
            await next();
            const status = c.res.status;
            span.setAttribute("http.status_code", status);
            if (status >= 500) {
              span.setStatus({ code: SpanStatusCode.ERROR });
            } else {
              span.setStatus({ code: SpanStatusCode.OK });
            }
            recordHttpRequest({
              method,
              route: path,
              status,
              durationMs: Date.now() - started,
            });
          } catch (err) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: err instanceof Error ? err.message : String(err),
            });
            if (err instanceof Error) span.recordException(err);
            recordHttpRequest({
              method,
              route: path,
              status: 500,
              durationMs: Date.now() - started,
            });
            throw err;
          } finally {
            span.end();
          }
        }
      );
    }
  );
};
