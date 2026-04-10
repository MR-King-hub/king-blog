/**
 * 📝 文章 CRUD 路由（重构后）
 *
 * 对比重构前后：
 *
 *   重构前：Route → Store（路由里又校验又调 Store，又处理错误）
 *   重构后：Route → Service → Store
 *
 * 现在路由层变"瘦"了，只做三件事：
 *   1. 从请求中提取参数
 *   2. 调用 Service 方法
 *   3. 返回响应
 *
 * 所有业务逻辑（校验、错误处理）都在 Service 里。
 * 如果 Service 抛出 AppError，全局错误处理中间件会自动捕获并返回对应的错误响应。
 * 所以路由里不需要 try-catch！
 */

import { Hono } from "hono";
import { auth } from "../middleware/auth.js";
import { articleService } from "../services/article.service.js";
import type { AppEnv } from "../types.js";
import type {
  CreateArticleInput,
  UpdateArticleInput,
  ListArticlesParams,
} from "@blog/shared";

export const articleRoutes = new Hono<AppEnv>();

// ── GET / — 文章列表（公开，不需要登录）──────────────────────
articleRoutes.get("/", async (c) => {
  const params: ListArticlesParams = {
    page: parseInt(c.req.query("page") || "1"),
    pageSize: parseInt(c.req.query("pageSize") || "10"),
    status: c.req.query("status") as ListArticlesParams["status"],
    tag: c.req.query("tag") || undefined,
    category: c.req.query("category") || undefined,
    search: c.req.query("search") || undefined,
  };

  // 直接调 Service，不用处理错误
  const result = await articleService.list(params);
  return c.json({ success: true, data: result });
});

// ── GET /:slug — 文章详情（公开）─────────────────────────────
articleRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  // Service 找不到文章会自动抛 AppError(404)
  // 全局错误处理器会捕获并返回 404 响应
  // 所以路由里不需要 if (!article) 的判断了
  const article = await articleService.getBySlug(slug);
  return c.json({ success: true, data: article });
});

// ── POST / — 创建文章（需要登录）──────────────────────────────
articleRoutes.post("/", auth, async (c) => {
  const body = await c.req.json<CreateArticleInput>();

  // 校验也在 Service 里做了
  const article = await articleService.create(body);
  return c.json({ success: true, data: article }, 201);
});

// ── PUT /:slug — 更新文章（需要登录）────────────────────────
articleRoutes.put("/:slug", auth, async (c) => {
  const slug = c.req.param("slug");
  const body = await c.req.json<UpdateArticleInput>();

  const article = await articleService.update(slug, body);
  return c.json({ success: true, data: article });
});

// ── DELETE /:slug — 删除文章（需要登录）──────────────────────
articleRoutes.delete("/:slug", auth, async (c) => {
  const slug = c.req.param("slug");

  await articleService.remove(slug);
  return c.json({ success: true, data: { message: "已删除" } });
});
