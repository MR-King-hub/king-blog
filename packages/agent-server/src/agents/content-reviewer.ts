/**
 * 🔍 内容审核 Agent
 *
 * 和写作助手结构几乎一样，区别在于：
 *   - 系统提示词不同（审核 vs 写作）
 *   - temperature 更低（0.3）— 审核需要更严谨，不需要太多创造性
 *   - 节点名叫 "review" 而不是 "generate"
 *
 * 这就是接口（BaseAgent）的好处 — 外部调用方式完全一样，
 * 内部实现可以完全不同。
 */

import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";
import type { BaseAgent, AgentContext, AgentEvent } from "./base.js";
import { config } from "../config.js";
import { articleStore } from "../store/article-store.js";

// State 定义（和写作助手一样的结构）
const ReviewState = Annotation.Root({
  messages: Annotation<(SystemMessage | HumanMessage | AIMessage)[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  articleSlug: Annotation<string | undefined>,
  output: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
});

class ContentReviewerAgent implements BaseAgent {
  name = "content-reviewer";

  private buildGraph() {
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.3, // 审核要严谨，创造性调低
      streaming: true,
      openAIApiKey: config.openaiApiKey,
    });

    // 审核专用的系统提示词
    const systemPrompt = `你是一个专业的博客内容审核专家。你的职责包括：

1. **结构审查** — 检查文章结构是否合理（标题层级、段落划分、逻辑流）
2. **语法检查** — 发现错别字、语法错误、标点符号问题
3. **SEO 优化** — 提供标题、摘要、关键词方面的 SEO 建议
4. **可读性** — 评估文章的可读性，建议优化冗长或晦涩的段落
5. **Markdown 规范** — 检查 Markdown 格式是否正确

请以结构化的格式输出审核报告，包含：
- 📊 总体评分（1-10）
- ✅ 优点
- ⚠️ 需要改进的地方（按优先级排序）
- 💡 具体修改建议`;

    // review 节点 — 调用 LLM 进行审核
    const review = async (state: typeof ReviewState.State) => {
      const messages = [new SystemMessage(systemPrompt), ...state.messages];
      const response = await model.invoke(messages);
      return {
        messages: [response],
        output: typeof response.content === "string" ? response.content : "",
      };
    };

    const graph = new StateGraph(ReviewState)
      .addNode("review", review)
      .addEdge(START, "review")
      .addEdge("review", END)
      .compile();

    return graph;
  }

  async stream(
    message: string,
    ctx: AgentContext
  ): Promise<AsyncIterable<AgentEvent>> {
    const graph = this.buildGraph();

    // 自动加载待审核文章内容
    let contextMessage = "";
    if (ctx.context?.articleSlug) {
      const article = await articleStore.getBySlug(
        ctx.context.articleSlug as string
      );
      if (article) {
        contextMessage = `\n\n[待审核文章]\n标题: ${article.title}\n标签: ${article.tags.join(", ")}\n内容:\n${article.content}`;
      }
    }

    const fullMessage = contextMessage ? message + contextMessage : message;

    const eventStream = await graph.stream(
      {
        messages: [new HumanMessage(fullMessage)],
      },
      { streamMode: "updates" }
    );

    async function* toAgentEvents(): AsyncIterable<AgentEvent> {
      for await (const update of eventStream) {
        if (update.review?.output) {
          yield {
            type: "token",
            data: update.review.output,
          };
        }
      }
    }

    return toAgentEvents();
  }
}

export const contentReviewer = new ContentReviewerAgent();
