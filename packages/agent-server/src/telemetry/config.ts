/**
 * OTel dual-switch config (mirrors Grok's master switch + exporter selection).
 *
 * Enabled only when:
 *   RELAYAGENT_OTEL=1
 *   AND at least one of OTEL_METRICS_EXPORTER / OTEL_TRACES_EXPORTER is "otlp"
 */

export type TelemetryConfig = {
  enabled: boolean;
  metricsEnabled: boolean;
  tracesEnabled: boolean;
  serviceName: string;
  otlpEndpoint: string;
  otlpHeaders: Record<string, string>;
  metricExportIntervalMs: number;
};

function parseTruthy(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function parseExporter(value: string | undefined): boolean {
  return (value ?? "none").trim().toLowerCase() === "otlp";
}

function parseHeaders(raw: string | undefined): Record<string, string> {
  if (!raw?.trim()) return {};
  const out: Record<string, string> = {};
  for (const part of raw.split(",")) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = val;
  }
  return out;
}

export function resolveTelemetryConfig(
  env: NodeJS.ProcessEnv = process.env
): TelemetryConfig {
  const master = parseTruthy(env.RELAYAGENT_OTEL);
  const metricsEnabled = master && parseExporter(env.OTEL_METRICS_EXPORTER);
  const tracesEnabled = master && parseExporter(env.OTEL_TRACES_EXPORTER);
  const enabled = metricsEnabled || tracesEnabled;

  const endpoint =
    env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim() || "http://localhost:4318";

  return {
    enabled,
    metricsEnabled,
    tracesEnabled,
    serviceName: env.OTEL_SERVICE_NAME?.trim() || "relayagent-api",
    otlpEndpoint: endpoint.replace(/\/$/, ""),
    otlpHeaders: parseHeaders(env.OTEL_EXPORTER_OTLP_HEADERS),
    metricExportIntervalMs: Math.max(
      1000,
      parseInt(env.OTEL_METRIC_EXPORT_INTERVAL || "60000", 10) || 60000
    ),
  };
}
