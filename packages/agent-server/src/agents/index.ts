/**
 * 🏭 Agent 工厂（Factory Pattern）
 *
 * 什么是工厂模式？
 *   路由层说"给我一个 writing-assistant"，
 *   工厂就把对应的 Agent 实例返回给它。
 *   路由层不需要知道 Agent 是怎么创建的、用了什么库。
 *
 * 新增 Agent 只需要：
 *   1. 创建一个新的 Agent 类（实现 BaseAgent 接口）
 *   2. 在这里的 agentMap 里注册一下
 *   路由代码一行都不用改
 */

import type { AgentType } from "@blog/shared";
import { writingAssistant } from "./writing-assistant.js";
import { contentReviewer } from "./content-reviewer.js";
import type { BaseAgent } from "./base.js";

/**
 * Agent 注册表
 * key = agent 类型标识（和前端约定好的）
 * value = Agent 实例
 */
const agentMap: Record<AgentType, BaseAgent> = {
  "writing-assistant": writingAssistant,
  "content-reviewer": contentReviewer,
};

/**
 * 根据类型获取 Agent 实例
 * 找不到就返回 null（路由层会返回 400 错误）
 */
export function getAgent(type: AgentType): BaseAgent | null {
  return agentMap[type] || null;
}
