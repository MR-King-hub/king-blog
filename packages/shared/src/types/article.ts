// ============================================================
// 文章相关类型
// ============================================================

/** 文章状态 */
export type ArticleStatus = "draft" | "published" | "archived";

/** 文章元数据 */
export interface ArticleMeta {
  /** 唯一标识（slug） */
  slug: string;
  /** 标题 */
  title: string;
  /** 摘要 */
  summary: string;
  /** 封面图 URL */
  coverImage?: string;
  /** 标签 */
  tags: string[];
  /** 分类 */
  category?: string;
  /** 状态 */
  status: ArticleStatus;
  /** 创建时间 ISO string */
  createdAt: string;
  /** 更新时间 ISO string */
  updatedAt: string;
  /** 作者 */
  author?: string;
}

/** 完整文章（含正文） */
export interface Article extends ArticleMeta {
  /** Markdown 正文 */
  content: string;
}

/** 创建文章请求 */
export interface CreateArticleInput {
  title: string;
  content: string;
  summary?: string;
  coverImage?: string;
  tags?: string[];
  category?: string;
  status?: ArticleStatus;
}

/** 更新文章请求 */
export interface UpdateArticleInput {
  title?: string;
  content?: string;
  summary?: string;
  coverImage?: string;
  tags?: string[];
  category?: string;
  status?: ArticleStatus;
}

/** 文章列表查询参数 */
export interface ListArticlesParams {
  page?: number;
  pageSize?: number;
  status?: ArticleStatus;
  tag?: string;
  category?: string;
  search?: string;
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
