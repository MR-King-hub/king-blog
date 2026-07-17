export {
  initTelemetry,
  shutdownTelemetry,
  isTelemetryEnabled,
  getActiveTelemetryConfig,
  resetTelemetryStateForTests,
} from "./init.js";
export { resolveTelemetryConfig } from "./config.js";
export type { TelemetryConfig } from "./config.js";
export {
  recordHttpRequest,
  recordChatRequest,
  recordLlmDuration,
  recordLlmTokens,
  recordLlmError,
} from "./metrics.js";
export {
  withSpan,
  getActiveTraceId,
  getTracer,
  runWithExtractedContext,
} from "./tracing.js";
export { createChatModel } from "./create-chat-model.js";
export type { CreateChatModelOptions } from "./create-chat-model.js";
export { OtelLlmCallbackHandler } from "./llm-callback.js";
