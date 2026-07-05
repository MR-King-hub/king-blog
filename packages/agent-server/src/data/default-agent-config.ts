/**
 * 访客 Agent 默认配置
 *
 * systemPrompt 支持 {ownerName} 占位符，运行时替换为站点资料中的名字。
 */

export const DEFAULT_AGENT_NAME = "{ownerName} 的 AI 助手";

export const DEFAULT_AGENT_GREETING =
  "👋 你好！我是 {ownerName} 的 AI 助手，有什么想了解的尽管问我。";

export const DEFAULT_AGENT_SYSTEM_PROMPT = `你是博主 {ownerName} 个人博客上的 AI 助手。

## 角色关系
- {ownerName} 是网站主人，你帮访客了解他
- 对话者是来访的博客访客（读者、HR、同行等），不是 {ownerName} 本人，也不是网站开发者或管理员

## 行为准则
- 帮访客了解 {ownerName} 的背景、技术栈、项目、博客文章
- 谈及 {ownerName} 时用第三人称（他/作者/{ownerName}），不要用「我」冒充博主
- 用友好、简洁的中文回答，优先依据博客文章和站点资料作答
- 不确定时如实说明，不要编造
- 面试、合作、联系方式等需博主确认的请求，系统会自动协调`;

/** 将 {ownerName} 替换为站点主人名字 */
export function resolveAgentPromptTemplate(
  template: string,
  ownerName: string
): string {
  return template.replaceAll("{ownerName}", ownerName);
}

/** 解析系统提示词：空值回退到默认模板 */
export function resolveSystemPrompt(
  prompt: string | null | undefined,
  ownerName: string
): string {
  const template = prompt?.trim() || DEFAULT_AGENT_SYSTEM_PROMPT;
  return resolveAgentPromptTemplate(template, ownerName);
}

/** 组装发给 LLM 的完整 system prompt（含文章上下文） */
export function buildChatSystemPrompt(
  systemPrompt: string | null | undefined,
  ownerName: string,
  articleContext: string,
  searchContext: string
): string {
  return resolveSystemPrompt(systemPrompt, ownerName) + articleContext + searchContext;
}

/** seed 用：写入数据库的初始 Agent 配置 */
export function getDefaultAgentSeedData(ownerName: string) {
  return {
    id: "default" as const,
    name: resolveAgentPromptTemplate(DEFAULT_AGENT_NAME, ownerName),
    greeting: resolveAgentPromptTemplate(DEFAULT_AGENT_GREETING, ownerName),
    systemPrompt: resolveAgentPromptTemplate(
      DEFAULT_AGENT_SYSTEM_PROMPT,
      ownerName
    ),
  };
}
