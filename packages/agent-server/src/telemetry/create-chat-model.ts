/**
 * Shared ChatOpenAI factory — centralizes OpenAI-compatible config + OTel callbacks.
 */

import { ChatOpenAI } from "@langchain/openai";
import { config } from "../config.js";
import { OtelLlmCallbackHandler } from "./llm-callback.js";

export type CreateChatModelOptions = {
  /** Logical agent / component name for metrics & spans */
  agent: string;
  /** Model id sent to the API; defaults to config.llmModel */
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
  streaming?: boolean;
  /** Extra OpenAI-compatible kwargs (e.g. stream_options) */
  modelKwargs?: Record<string, unknown>;
};

export function createChatModel(opts: CreateChatModelOptions): ChatOpenAI {
  const modelName = opts.modelName?.trim() || config.llmModel;

  return new ChatOpenAI({
    modelName,
    temperature: opts.temperature,
    maxTokens: opts.maxTokens,
    maxRetries: opts.maxRetries,
    streaming: opts.streaming,
    openAIApiKey: config.llmApiKey,
    configuration: { baseURL: config.llmBaseUrl },
    modelKwargs: opts.modelKwargs,
    callbacks: [new OtelLlmCallbackHandler({ agent: opts.agent, model: modelName })],
  });
}
