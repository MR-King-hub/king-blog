/**
 * 🤖 Agent 配置存储层
 *
 * AgentConfig 是单例表（只有一条记录，id 固定为 "default"）。
 * 管理员通过后台页面修改系统提示词、模型参数等配置。
 */

import { prisma } from "../lib/prisma.js";

/** Agent 配置（返回给前端的类型） */
export interface AgentConfigData {
  name: string;
  greeting: string;
  systemPrompt: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  rateLimit: number;
  // 企微通知
  wecomBotId: string;
  wecomBotSecret: string;
  wecomOwnerUserId: string;
  wecomGroupChatId: string;
  updatedAt: string;
}

/** 更新 Agent 配置的输入 */
export interface UpdateAgentConfigInput {
  name?: string;
  greeting?: string;
  systemPrompt?: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  enabled?: boolean;
  rateLimit?: number;
  wecomBotId?: string;
  wecomBotSecret?: string;
  wecomOwnerUserId?: string;
  wecomGroupChatId?: string;
}

class AgentConfigStore {
  /** 获取 Agent 配置（如果不存在则返回 null） */
  async get(): Promise<AgentConfigData | null> {
    const config = await prisma.agentConfig.findUnique({
      where: { id: "default" },
    });

    if (!config) return null;

    return {
      name: config.name,
      greeting: config.greeting,
      systemPrompt: config.systemPrompt,
      modelName: config.modelName,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      enabled: config.enabled,
      rateLimit: config.rateLimit,
      wecomBotId: config.wecomBotId,
      wecomBotSecret: config.wecomBotSecret,
      wecomOwnerUserId: config.wecomOwnerUserId,
      wecomGroupChatId: config.wecomGroupChatId,
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  /** 更新 Agent 配置（upsert，不存在就创建） */
  async update(input: UpdateAgentConfigInput): Promise<AgentConfigData> {
    const config = await prisma.agentConfig.upsert({
      where: { id: "default" },
      update: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.greeting !== undefined && { greeting: input.greeting }),
        ...(input.systemPrompt !== undefined && {
          systemPrompt: input.systemPrompt,
        }),
        ...(input.modelName !== undefined && { modelName: input.modelName }),
        ...(input.temperature !== undefined && {
          temperature: input.temperature,
        }),
        ...(input.maxTokens !== undefined && { maxTokens: input.maxTokens }),
        ...(input.enabled !== undefined && { enabled: input.enabled }),
        ...(input.rateLimit !== undefined && { rateLimit: input.rateLimit }),
        ...(input.wecomBotId !== undefined && { wecomBotId: input.wecomBotId }),
        ...(input.wecomBotSecret !== undefined && { wecomBotSecret: input.wecomBotSecret }),
        ...(input.wecomOwnerUserId !== undefined && { wecomOwnerUserId: input.wecomOwnerUserId }),
        ...(input.wecomGroupChatId !== undefined && { wecomGroupChatId: input.wecomGroupChatId }),
      },
      create: {
        id: "default",
        ...input,
      },
    });

    return {
      name: config.name,
      greeting: config.greeting,
      systemPrompt: config.systemPrompt,
      modelName: config.modelName,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      enabled: config.enabled,
      rateLimit: config.rateLimit,
      wecomBotId: config.wecomBotId,
      wecomBotSecret: config.wecomBotSecret,
      wecomOwnerUserId: config.wecomOwnerUserId,
      wecomGroupChatId: config.wecomGroupChatId,
      updatedAt: config.updatedAt.toISOString(),
    };
  }
}

export const agentConfigStore = new AgentConfigStore();
