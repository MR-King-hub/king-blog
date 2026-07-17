/**
 * OpenTelemetry SDK lifecycle for agent-server.
 * Off by default; requires RELAYAGENT_OTEL=1 and an OTLP exporter selection.
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import {
  defaultResource,
  resourceFromAttributes,
} from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

import { resolveTelemetryConfig, type TelemetryConfig } from "./config.js";
import { initMetrics, resetMetricsForTests } from "./metrics.js";

let sdk: NodeSDK | null = null;
let activeConfig: TelemetryConfig | null = null;

export function getActiveTelemetryConfig(): TelemetryConfig | null {
  return activeConfig;
}

export function isTelemetryEnabled(): boolean {
  return activeConfig?.enabled === true;
}

export async function initTelemetry(
  env: NodeJS.ProcessEnv = process.env
): Promise<TelemetryConfig> {
  const cfg = resolveTelemetryConfig(env);
  activeConfig = cfg;

  if (!cfg.enabled) {
    return cfg;
  }

  if (sdk) {
    return cfg;
  }

  const resource = defaultResource().merge(
    resourceFromAttributes({
      [ATTR_SERVICE_NAME]: cfg.serviceName,
    })
  );

  const metricReaders = cfg.metricsEnabled
    ? [
        new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter({
            url: `${cfg.otlpEndpoint}/v1/metrics`,
            headers: cfg.otlpHeaders,
          }),
          exportIntervalMillis: cfg.metricExportIntervalMs,
        }),
      ]
    : [];

  const spanProcessors = cfg.tracesEnabled
    ? [
        new BatchSpanProcessor(
          new OTLPTraceExporter({
            url: `${cfg.otlpEndpoint}/v1/traces`,
            headers: cfg.otlpHeaders,
          })
        ),
      ]
    : [];

  sdk = new NodeSDK({
    resource,
    metricReaders,
    spanProcessors,
  });

  await sdk.start();
  if (cfg.metricsEnabled) {
    initMetrics();
  }

  console.log(
    `[telemetry] enabled service=${cfg.serviceName} metrics=${cfg.metricsEnabled} traces=${cfg.tracesEnabled} endpoint=${cfg.otlpEndpoint}`
  );

  return cfg;
}

export async function shutdownTelemetry(): Promise<void> {
  if (!sdk) {
    activeConfig = null;
    resetMetricsForTests();
    return;
  }
  try {
    await sdk.shutdown();
  } catch (err) {
    console.error("[telemetry] shutdown error:", err);
  } finally {
    sdk = null;
    activeConfig = null;
    resetMetricsForTests();
  }
}

/** Test helper: reset module state without calling SDK shutdown. */
export function resetTelemetryStateForTests(): void {
  sdk = null;
  activeConfig = null;
  resetMetricsForTests();
}
