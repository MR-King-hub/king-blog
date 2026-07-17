/**
 * 访客 Agent 站点只读工具 — 对齐访客 MCP（list/get articles、projects、profile）
 *
 * 直接读本地 store，不绕 HTTP/MCP；行为与 RELAYAGENT_MCP_READONLY 一致：只暴露已发布内容。
 */

import { tool } from "@langchain/core/tools";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { z } from "zod";
import { articleStore } from "../store/article-store.js";
import { projectStore } from "../store/project-store.js";
import { profileStore } from "../store/profile-store.js";

function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

const listArticles = tool(
  async ({ page, pageSize, tag, category, search }) => {
    const result = await articleStore.list({
      status: "published",
      page: page ?? 1,
      pageSize: pageSize ?? 20,
      tag,
      category,
      search,
    });
    return formatJson(result);
  },
  {
    name: "list_articles",
    description:
      "列出已发布的博客文章（支持分页、分类、标签、关键词搜索）。返回标题、摘要、slug 等元数据，不含正文。",
    schema: z.object({
      page: z.number().int().min(1).optional().describe("页码，默认 1"),
      pageSize: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe("每页条数，默认 20"),
      tag: z.string().optional().describe("按标签筛选"),
      category: z.string().optional().describe("按分类筛选"),
      search: z.string().optional().describe("搜索标题/摘要"),
    }),
  },
);

const getArticle = tool(
  async ({ slug }) => {
    const article = await articleStore.getBySlug(slug);
    if (!article || article.status !== "published") {
      return formatJson({ error: `未找到已发布文章: ${slug}` });
    }
    return formatJson(article);
  },
  {
    name: "get_article",
    description:
      "按 slug 获取单篇已发布文章的完整内容（含 Markdown 正文）。先用 list_articles 找到 slug，再调用本工具。",
    schema: z.object({
      slug: z.string().describe("文章 slug"),
    }),
  },
);

const listProjects = tool(
  async () => {
    const projects = await projectStore.list("published");
    return formatJson(projects);
  },
  {
    name: "list_projects",
    description: "列出已发布的项目作品（标题、简介、技术栈、链接等）",
    schema: z.object({}),
  },
);

const getProject = tool(
  async ({ id }) => {
    const project = await projectStore.getById(id);
    if (!project || project.status !== "published") {
      return formatJson({ error: `未找到已发布项目: ${id}` });
    }
    return formatJson(project);
  },
  {
    name: "get_project",
    description: "按 id 获取单个已发布项目详情",
    schema: z.object({
      id: z.string().describe("项目 id"),
    }),
  },
);

const getProfile = tool(
  async () => {
    const profile = await profileStore.ensureDefault();
    return formatJson(profile);
  },
  {
    name: "get_profile",
    description:
      "获取站点个人资料（姓名、简介、经历时间线、技能、兴趣、社交链接等）",
    schema: z.object({}),
  },
);

/** 访客 Agent 可用的站点只读工具（与访客 MCP 工具集对齐） */
export const visitorSiteTools: StructuredToolInterface[] = [
  listArticles,
  getArticle,
  listProjects,
  getProject,
  getProfile,
];

export const visitorSiteToolsByName: Record<string, StructuredToolInterface> =
  Object.fromEntries(visitorSiteTools.map((t) => [t.name, t]));
