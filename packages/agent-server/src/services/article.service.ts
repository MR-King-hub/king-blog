/**
 * 📋 文章业务逻辑层（Service Layer）
 *
 * ═══ 为什么要有 Service 层？ ═══
 *
 * 之前的代码：
 *   路由（Route）直接调用存储层（Store）
 *   Route → Store
 *
 * 现在的代码：
 *   路由 → Service → Store
 *
 * 看起来多了一层，好处是什么？
 *
 * 1. 业务逻辑复用
 *    比如"创建文章"这个操作，可能：
 *    - 路由里要调
 *    - Agent 里也要调（AI 帮你生成文章后自动保存）
 *    - 定时任务里也要调（批量导入）
 *    如果逻辑写在路由里，其他地方没法用。放到 Service 里，到处都能用。
 *
 * 2. 业务规则集中
 *    比如"创建文章时自动生成摘要"、"删除文章时检查权限"，
 *    这些规则应该放在 Service 里，而不是散落在各个路由中。
 *
 * 3. 方便测试
 *    测试 Service 不需要启动 HTTP 服务器，直接调函数就行。
 *
 * ═══ 各层职责 ═══
 *
 * Route 层：  只管"接收请求、提取参数、返回响应"
 * Service 层：管"业务逻辑"（校验、权限、编排）
 * Store 层：  只管"数据存取"
 */

import { articleStore } from "../store/article-store.js";
import { AppError } from "../middleware/error-handler.js";
import type {
  Article,
  ArticleMeta,
  CreateArticleInput,
  UpdateArticleInput,
  ListArticlesParams,
  PaginatedResponse,
} from "@blog/shared";

class ArticleService {
  /**
   * 获取文章列表
   * 目前逻辑简单，直接透传给 Store
   * 未来可以在这里加缓存、权限过滤等
   */
  async list(params: ListArticlesParams): Promise<PaginatedResponse<ArticleMeta>> {
    return articleStore.list(params);
  }

  /**
   * 获取文章详情
   * 加了"不存在就抛错"的逻辑，路由不用再自己判断 null
   */
  async getBySlug(slug: string): Promise<Article> {
    const article = await articleStore.getBySlug(slug);
    if (!article) {
      throw new AppError(404, "NOT_FOUND", `文章 "${slug}" 不存在`);
    }
    return article;
  }

  /**
   * 创建文章
   *
   * 业务规则：
   * 1. 标题和内容必填
   * 2. 自动截取摘要（如果没提供的话）
   */
  async create(input: CreateArticleInput): Promise<Article> {
    // 业务校验
    if (!input.title?.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "标题不能为空");
    }
    if (!input.content?.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "内容不能为空");
    }

    // 自动生成摘要（如果没提供）
    if (!input.summary) {
      input.summary = input.content
        .replace(/[#*`>\-\[\]()]/g, "") // 去掉 Markdown 标记
        .slice(0, 200)                  // 取前 200 个字符
        .trim();
    }

    return articleStore.create(input);
  }

  /**
   * 更新文章
   *
   * 业务规则：
   * 1. 文章必须存在
   * 2. 未来可加：只有作者或管理员能编辑
   */
  async update(slug: string, input: UpdateArticleInput): Promise<Article> {
    const article = await articleStore.update(slug, input);
    if (!article) {
      throw new AppError(404, "NOT_FOUND", `文章 "${slug}" 不存在`);
    }
    return article;
  }

  /**
   * 删除文章
   *
   * 业务规则：
   * 1. 文章必须存在
   * 2. 未来可加：只有作者或管理员能删除
   */
  async remove(slug: string): Promise<void> {
    const deleted = await articleStore.remove(slug);
    if (!deleted) {
      throw new AppError(404, "NOT_FOUND", `文章 "${slug}" 不存在`);
    }
  }
}

/** 导出单例 */
export const articleService = new ArticleService();
