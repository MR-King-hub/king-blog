/**
 * 💾 文章存储层（Prisma + SQLite 版本）
 *
 * ═══ 对比改造前后 ═══
 *
 * 改造前（文件系统）：
 *   - 读写 JSON 文件 + Markdown 文件
 *   - 列表要读取所有文件再过滤，性能差
 *   - 没有事务支持
 *
 * 改造后（Prisma + SQLite）：
 *   - 用 SQL 查询，过滤、排序、分页都在数据库层完成，性能好
 *   - Prisma 提供完美的 TypeScript 类型推导
 *   - 支持关系查询（文章 ↔ 标签，文章 ↔ 作者）
 *   - 支持事务
 *
 * 注意：Service 层（article.service.ts）和路由层完全不用改！
 * 因为 Store 的公共接口（list、getBySlug、create...）没变，
 * 只是内部实现从"读文件"变成了"查数据库"。
 * 这就是分层架构的好处 — 换存储方案不影响上层。
 */

import { prisma } from "../lib/prisma.js";
import type {
  Article,
  ArticleMeta,
  CreateArticleInput,
  UpdateArticleInput,
  ListArticlesParams,
  PaginatedResponse,
} from "@blog/shared";

class ArticleStore {
  /**
   * 生成 slug（和之前一样的逻辑）
   */
  private slugify(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 80) +
      "-" +
      Date.now().toString(36)
    );
  }

  /**
   * 把 Prisma 返回的数据转换为我们定义的 ArticleMeta 类型
   * （Prisma 模型和 shared 里的类型结构可能有差异，这里做适配）
   */
  private toMeta(row: {
    slug: string;
    title: string;
    summary: string;
    coverImage: string | null;
    status: string;
    category: string | null;
    createdAt: Date;
    updatedAt: Date;
    tags: { name: string }[];
  }): ArticleMeta {
    return {
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      coverImage: row.coverImage ?? undefined,
      status: row.status as "draft" | "published",
      category: row.category ?? undefined,
      tags: row.tags.map((t) => t.name),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  // ══════════════════════════════════════════════════════════════
  // Public API（接口和之前完全一样，只是内部实现变了）
  // ══════════════════════════════════════════════════════════════

  async list(params: ListArticlesParams): Promise<PaginatedResponse<ArticleMeta>> {
    const { page = 1, pageSize = 10, status, tag, category, search } = params;

    /**
     * Prisma 的 where 条件构建
     *
     * 对比之前的文件系统方案：
     *   之前：读取所有文件 → JS 里 filter → 再 sort → 再 slice
     *   现在：直接告诉数据库"帮我过滤、排序、分页"，数据库高效执行
     *
     * Prisma 的 where 语法很直观：
     *   { status: "published" }           → WHERE status = 'published'
     *   { title: { contains: "React" } }  → WHERE title LIKE '%React%'
     *   { tags: { some: { name: "js" } }} → WHERE EXISTS (关联子查询)
     */
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (tag) {
      where.tags = { some: { name: tag } }; // 多对多关系查询
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { summary: { contains: search } },
      ];
    }

    // 并行执行查询和计数（两条 SQL 同时发出，节省时间）
    const [rows, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: { tags: true },         // 联表查询，同时拉出标签
        orderBy: { updatedAt: "desc" },   // 按更新时间倒序
        skip: (page - 1) * pageSize,      // 跳过前面的记录（分页偏移）
        take: pageSize,                   // 取多少条（分页大小）
      }),
      prisma.article.count({ where }),    // 总数（用于计算总页数）
    ]);

    return {
      items: rows.map((r) => this.toMeta(r)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getBySlug(slug: string): Promise<Article | null> {
    const row = await prisma.article.findUnique({
      where: { slug },
      include: { tags: true },
    });

    if (!row) return null;

    return {
      ...this.toMeta(row),
      content: row.content,
    };
  }

  async create(input: CreateArticleInput): Promise<Article> {
    const slug = this.slugify(input.title);

    /**
     * Prisma 的 connectOrCreate 语法：
     *   "如果这个标签已存在就关联上，不存在就先创建再关联"
     *   这样不用手动判断标签是否存在，Prisma 帮你处理
     */
    const row = await prisma.article.create({
      data: {
        slug,
        title: input.title,
        content: input.content,
        summary: input.summary || "",
        coverImage: input.coverImage,
        status: input.status || "draft",
        category: input.category,
        tags: {
          connectOrCreate: (input.tags || []).map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      },
      include: { tags: true },
    });

    return {
      ...this.toMeta(row),
      content: row.content,
    };
  }

  async update(slug: string, input: UpdateArticleInput): Promise<Article | null> {
    // 先检查文章是否存在
    const existing = await prisma.article.findUnique({ where: { slug } });
    if (!existing) return null;

    /**
     * 标签更新策略：先断开所有旧标签，再连接新标签
     *
     * set: [] 表示"清空所有关联"（多对多关系的操作）
     * connectOrCreate 表示"建立新关联"
     */
    const row = await prisma.article.update({
      where: { slug },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.content !== undefined && { content: input.content }),
        ...(input.summary !== undefined && { summary: input.summary }),
        ...(input.coverImage !== undefined && { coverImage: input.coverImage }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.tags && {
          tags: {
            set: [], // 先清空
            connectOrCreate: input.tags.map((name) => ({
              where: { name },
              create: { name },
            })),
          },
        }),
      },
      include: { tags: true },
    });

    return {
      ...this.toMeta(row),
      content: row.content,
    };
  }

  async remove(slug: string): Promise<boolean> {
    try {
      await prisma.article.delete({ where: { slug } });
      return true;
    } catch {
      // Prisma 删除不存在的记录会抛异常
      return false;
    }
  }
}

export const articleStore = new ArticleStore();
