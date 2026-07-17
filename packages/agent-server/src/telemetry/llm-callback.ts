import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { LLMResult } from "@langchain/core/outputs";
import { SpanStatusCode, trace, type Span } from "@opentelemetry/api";

import {
  recordLlmDuration,
  recordLlmError,
  recordLlmTokens,
} from "./metrics.js";

type UsageLike = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  input_tokens?: number;
  output_tokens?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
};

function extractUsage(output: LLMResult): {
  input?: number;
  output?: number;
} {
  const llmOutput = output.llmOutput as
    | { tokenUsage?: UsageLike; usage?: UsageLike }
    | undefined;
  const usage = llmOutput?.tokenUsage || llmOutput?.usage;
  if (!usage) return {};

  const input =
    usage.promptTokens ??
    usage.prompt_tokens ??
    usage.input_tokens;
  const out =
    usage.completionTokens ??
    usage.completion_tokens ??
    usage.output_tokens;

  return {
    input: typeof input === "number" ? input : undefined,
    output: typeof out === "number" ? out : undefined,
  };
}

/**
 * LangChain callback that records LLM spans + metrics without capturing prompts.
 */
export class OtelLlmCallbackHandler extends BaseCallbackHandler {
  name = "relayagent_otel_llm";

  private readonly agent: string;
  private readonly model: string;
  private readonly runs = new Map<
    string,
    { span: Span; startedAt: number }
  >();

  constructor(opts: { agent: string; model: string }) {
    super();
    this.agent = opts.agent;
    this.model = opts.model;
  }

  private startRun(runId: string): void {
    const tracer = trace.getTracer("relayagent");
    const span = tracer.startSpan("llm.chat", {
      attributes: {
        "gen_ai.system": "openai_compatible",
        "gen_ai.request.model": this.model,
        "relayagent.agent": this.agent,
      },
    });
    this.runs.set(runId, { span, startedAt: Date.now() });
  }

  async handleLLMStart(
    _llm: unknown,
    _prompts: string[],
    runId: string
  ): Promise<void> {
    this.startRun(runId);
  }

  async handleChatModelStart(
    _llm: unknown,
    _messages: unknown,
    runId: string
  ): Promise<void> {
    this.startRun(runId);
  }

  async handleLLMEnd(output: LLMResult, runId: string): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) return;
    this.runs.delete(runId);

    const durationMs = Date.now() - run.startedAt;
    const usage = extractUsage(output);

    recordLlmDuration({
      model: this.model,
      agent: this.agent,
      durationMs,
    });
    recordLlmTokens({
      model: this.model,
      agent: this.agent,
      input: usage.input,
      output: usage.output,
    });

    if (usage.input !== undefined) {
      run.span.setAttribute("gen_ai.usage.input_tokens", usage.input);
    }
    if (usage.output !== undefined) {
      run.span.setAttribute("gen_ai.usage.output_tokens", usage.output);
    }
    run.span.setStatus({ code: SpanStatusCode.OK });
    run.span.end();
  }

  async handleLLMError(err: unknown, runId: string): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) return;
    this.runs.delete(runId);

    recordLlmDuration({
      model: this.model,
      agent: this.agent,
      durationMs: Date.now() - run.startedAt,
    });
    recordLlmError({ model: this.model, agent: this.agent });

    run.span.setStatus({
      code: SpanStatusCode.ERROR,
      message: err instanceof Error ? err.message : String(err),
    });
    if (err instanceof Error) {
      run.span.recordException(err);
    }
    run.span.end();
  }
}
