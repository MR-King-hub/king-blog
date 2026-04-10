/**
 * ✍️ 写作助手 Agent
 *
 * 基于 LangGraph 实现的 AI 写作助手。
 *
 * ═══ LangGraph 核心概念 ═══
 *
 * LangGraph 把 AI 工作流建模为一个"图"（Graph）：
 *
 *   [START] → [generate 节点] → [END]
 *
 * 每个节点是一个函数，节点之间用"边"（Edge）连接，表示执行顺序。
 *
 * 为什么用 Graph 而不是直接调 API？
 *   当前这个 Agent 只有一个节点，看起来没必要。
 *   但当 Agent 变复杂时，比如：
 *
 *   [START] → [理解意图] → [搜索资料] → [生成初稿] → [自我审核] → [END]
 *                              ↓
 *                         [需要更多信息] → 回到 [搜索资料]
 *
 *   Graph 结构能清晰地表达这种带条件分支和循环的工作流。
 *
 * 三大核心：
 *   1. State（状态）— 在节点之间传递的数据
 *   2. Node（节点）— 每一步要做什么
 *   3. Edge（边）  — 节点之间的连接关系
 */

import { ChatOpenAI } from "@langchain/openai";
// ↑ LangChain 封装的 OpenAI 客户端，支持流式输出

import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
// ↑ LangGraph 的核心组件
//   StateGraph: 状态图构建器
//   Annotation: 定义状态结构的工具
//   START/END:  内置的起始/结束节点

import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";
// ↑ LangChain 的消息类型
//   SystemMessage: 系统提示词（定义 AI 的角色和行为）
//   HumanMessage:  用户的消息
//   AIMessage:     AI 的回复

import type { BaseAgent, AgentContext, AgentEvent } from "./base.js";
import { config } from "../config.js";
import { articleStore } from "../store/article-store.js";

// ══════════════════════════════════════════════════════════════
// State 定义 — Agent 执行过程中流转的数据
// ══════════════════════════════════════════════════════════════

/**
 * Annotation.Root 定义状态的"形状"
 *
 * reducer 是什么？
 *   当一个节点返回新值时，如何和旧值合并。
 *   - messages 用"追加"策略：新消息追加到列表末尾
 *   - output 用"替换"策略：直接用新值覆盖旧值
 */
const WritingState = Annotation.Root({
  /** 对话历史（系统提示 + 用户消息 + AI 回复） */
  messages: Annotation<(SystemMessage | HumanMessage | AIMessage)[]>({
    reducer: (prev, next) => [...prev, ...next], // 追加
    default: () => [],
  }),
  /** 关联的文章 slug（可选） */
  articleSlug: Annotation<string | undefined>,
  /** 最终输出文本 */
  output: Annotation<string>({
    reducer: (_prev, next) => next, // 替换
    default: () => "",
  }),
});

// ══════════════════════════════════════════════════════════════
// Agent 实现
// ══════════════════════════════════════════════════════════════

class WritingAssistantAgent implements BaseAgent {
  name = "writing-assistant";

  /**
   * 构建 LangGraph 工作流
   *
   * 当前是最简单的单节点图：START → generate → END
   * 后续可以扩展为多步骤工作流
   */
  private buildGraph() {
    // 创建 LLM（大语言模型）实例
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",     // 使用的模型
      temperature: 0.7,              // 创造性（0=严谨，1=天马行空），写作偏高
      streaming: true,               // 开启流式输出
      openAIApiKey: config.openaiApiKey,
    });

    // 系统提示词 — 定义 AI 的角色和行为边界
    const systemPrompt = `你是一个专业的中文博客写作助手。你的能力包括：
1. 根据主题帮用户撰写高质量的博客文章
2. 润色和优化已有的文章内容
3. 生成文章摘要和标签建议
4. 调整文章结构和段落

输出格式为 Markdown。保持专业、简洁、有深度的写作风格。`;

    // 定义 generate 节点 — 调用 LLM 生成内容
    const generate = async (state: typeof WritingState.State) => {
      // 把系统提示放在消息列表最前面
      const messages = [new SystemMessage(systemPrompt), ...state.messages];
      // 调用模型（这里会等待 AI 生成完整回复）
      const response = await model.invoke(messages);
      return {
        messages: [response],   // 把 AI 回复追加到消息历史
        output: typeof response.content === "string" ? response.content : "",
      };
    };

    // 构建并编译 Graph
    const graph = new StateGraph(WritingState)
      .addNode("generate", generate)      // 添加节点
      .addEdge(START, "generate")          // START → generate
      .addEdge("generate", END)            // generate → END
      .compile();                          // 编译成可执行的图

    return graph;
  }

  /**
   * 流式对话 — 实现 BaseAgent 接口
   */
  async stream(message: string, ctx: AgentContext): Promise<AsyncIterable<AgentEvent>> {
    const graph = this.buildGraph();

    // 如果上下文中有文章 slug，加载文章内容让 AI 参考
    let contextMessage = "";
    if (ctx.context?.articleSlug) {
      const article = await articleStore.getBySlug(
        ctx.context.articleSlug as string
      );
      if (article) {
        contextMessage = `\n\n[当前编辑的文章]\n标题: ${article.title}\n内容:\n${article.content}`;
      }
    }

    const fullMessage = contextMessage ? message + contextMessage : message;

    // 执行 Graph，使用 "updates" 模式获取每个节点的输出
    const eventStream = await graph.stream(
      {
        messages: [new HumanMessage(fullMessage)],
      },
      { streamMode: "updates" } // 每个节点执行完就返回一次，而不是等全部完成
    );

    /**
     * 生成器函数 — 把 LangGraph 的输出转换为我们定义的 AgentEvent 格式
     *
     * async function* 是"异步生成器"：
     *   - 每次 yield 一个值，调用方就收到一个值
     *   - 适合处理"边产生边消费"的流式数据
     */
    async function* toAgentEvents(): AsyncIterable<AgentEvent> {
      for await (const update of eventStream) {
        if (update.generate?.output) {
          yield {
            type: "token",
            data: update.generate.output,
          };
        }
      }
    }

    return toAgentEvents();
  }
}

export const writingAssistant = new WritingAssistantAgent();
