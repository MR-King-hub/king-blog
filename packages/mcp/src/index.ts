/**
 * Blog MCP Server
 *
 * 通过 agent-server REST API 管理站点内容。
 * 供 Cursor 等 MCP 客户端使用，与访客 Agent 无关。
 */

import { config as loadEnv } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  BlogApiClient,
  createBlogApiClientFromEnv,
  formatJson,
} from "./client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// 本地 .env 优先；未配置时回退 agent-server 的 ADMIN_*（便于 pnpm dev 一键启动）
loadEnv({ path: resolve(__dirname, "../../agent-server/.env") });
loadEnv({ path: resolve(__dirname, "../.env") });

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: formatJson(data) }] };
}

function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

const timelineItemSchema = z.object({
  year: z.string(),
  role: z.string(),
  company: z.string(),
  description: z.string(),
  color: z.string(),
});

const skillCategorySchema = z.object({
  category: z.string(),
  color: z.string(),
  skills: z.array(z.object({ name: z.string(), level: z.number() })),
});

const socialLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
  desc: z.string().optional(),
  icon: z.enum(["github", "twitter", "mail", "book", "linkedin"]),
});

const heroBentoSchema = z.object({
  id: z.string(),
  title: z.string(),
  desc: z.string(),
  icon: z.enum(["file-text", "folder-git", "bot", "briefcase"]),
  href: z.string(),
  span: z.string().optional(),
  gradient: z.string().optional(),
  iconColor: z.string().optional(),
  stat: z.string().optional(),
});

function registerArticleTools(server: McpServer, client: BlogApiClient) {
  server.tool(
    "list_articles",
    "列出博客文章（支持分页、状态筛选、搜索）",
    {
      page: z.number().int().min(1).optional(),
      pageSize: z.number().int().min(1).max(100).optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
      tag: z.string().optional(),
      category: z.string().optional(),
      search: z.string().optional(),
    },
    async (args) => {
      try {
        return textResult(await client.listArticles(args));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "get_article",
    "获取单篇文章完整内容（含 Markdown 正文）",
    { slug: z.string() },
    async ({ slug }) => {
      try {
        return textResult(await client.getArticle(slug));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "create_article",
    "创建新文章",
    {
      title: z.string(),
      content: z.string(),
      summary: z.string().optional(),
      coverImage: z.string().optional(),
      tags: z.array(z.string()).optional(),
      category: z.string().optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
    },
    async (args) => {
      try {
        return textResult(await client.createArticle(args));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "update_article",
    "更新已有文章（只传需要修改的字段）",
    {
      slug: z.string(),
      title: z.string().optional(),
      content: z.string().optional(),
      summary: z.string().optional(),
      coverImage: z.string().optional(),
      tags: z.array(z.string()).optional(),
      category: z.string().optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
    },
    async ({ slug, ...input }) => {
      try {
        return textResult(await client.updateArticle(slug, input));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "publish_article",
    "发布文章",
    { slug: z.string() },
    async ({ slug }) => {
      try {
        return textResult(await client.updateArticle(slug, { status: "published" }));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "delete_article",
    "删除文章",
    { slug: z.string() },
    async ({ slug }) => {
      try {
        await client.deleteArticle(slug);
        return textResult({ message: `文章 "${slug}" 已删除` });
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}

function registerProjectTools(server: McpServer, client: BlogApiClient) {
  server.tool(
    "list_projects",
    "列出项目作品",
    { status: z.enum(["draft", "published"]).optional() },
    async (args) => {
      try {
        return textResult(await client.listProjects(args.status));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "get_project",
    "获取单个项目详情",
    { id: z.string() },
    async ({ id }) => {
      try {
        return textResult(await client.getProject(id));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "create_project",
    "创建新项目作品",
    {
      title: z.string(),
      description: z.string(),
      techStack: z.array(z.string()).optional(),
      github: z.string().optional(),
      demo: z.string().optional(),
      stars: z.number().int().optional(),
      forks: z.number().int().optional(),
      featured: z.boolean().optional(),
      status: z.enum(["draft", "published"]).optional(),
      sortOrder: z.number().int().optional(),
    },
    async (args) => {
      try {
        return textResult(await client.createProject(args));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "update_project",
    "更新已有项目",
    {
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      techStack: z.array(z.string()).optional(),
      github: z.string().optional(),
      demo: z.string().optional(),
      stars: z.number().int().optional(),
      forks: z.number().int().optional(),
      featured: z.boolean().optional(),
      status: z.enum(["draft", "published"]).optional(),
      sortOrder: z.number().int().optional(),
    },
    async ({ id, ...input }) => {
      try {
        return textResult(await client.updateProject(id, input));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "delete_project",
    "删除项目",
    { id: z.string() },
    async ({ id }) => {
      try {
        await client.deleteProject(id);
        return textResult({ message: `项目 "${id}" 已删除` });
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}

function registerProfileTools(server: McpServer, client: BlogApiClient) {
  server.tool(
    "get_profile",
    "获取站点个人资料（简历/关于页/首页 Hero 内容）",
    {},
    async () => {
      try {
        return textResult(await client.getProfile());
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "update_profile",
    "更新站点个人资料（只传需要修改的字段）",
    {
      name: z.string().optional().describe("显示名称"),
      tagline: z.string().optional().describe("首页徽章标语"),
      headline: z.string().optional().describe("首页大标题前缀，如 Hi, 我是"),
      heroSubtitle: z.string().optional().describe("首页副标题"),
      location: z.string().optional(),
      role: z.string().optional().describe("职位"),
      experienceLabel: z.string().optional().describe("经验标签，如 6+ 年经验"),
      bioParagraphs: z.array(z.string()).optional().describe("关于页自我介绍段落"),
      timeline: z.array(timelineItemSchema).optional().describe("工作经历时间线"),
      skillCategories: z.array(skillCategorySchema).optional().describe("技能分类"),
      interests: z.array(z.string()).optional().describe("兴趣爱好"),
      socialLinks: z.array(socialLinkSchema).optional().describe("社交链接"),
      heroBento: z.array(heroBentoSchema).optional().describe("首页 Bento 卡片"),
    },
    async (input) => {
      try {
        return textResult(await client.updateProfile(input));
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}

async function main() {
  const client = createBlogApiClientFromEnv();

  const server = new McpServer({
    name: "relayagent-mcp",
    version: "0.1.0",
  });

  registerArticleTools(server, client);
  registerProjectTools(server, client);
  registerProfileTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("relayagent-mcp server running (stdio)");
}

main().catch((error) => {
  console.error("relayagent-mcp failed to start:", error);
  process.exit(1);
});
