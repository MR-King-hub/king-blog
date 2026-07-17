import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  BlogApiClient,
  type BlogApiClientLike,
  formatJson,
  isReadOnlyMode,
} from "./client.js";

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

function registerArticleTools(server: McpServer, client: BlogApiClientLike) {
  server.registerTool(
    "list_articles",
    {
      description: "列出博客文章（支持分页、状态筛选、搜索）",
      inputSchema: {
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        tag: z.string().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
      },
    },
    async (args) => {
      try {
        return textResult(await client.listArticles(args));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "get_article",
    {
      description: "获取单篇文章完整内容（含 Markdown 正文）",
      inputSchema: { slug: z.string() },
    },
    async ({ slug }) => {
      try {
        return textResult(await client.getArticle(slug));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  if (isReadOnlyMode()) {
    return;
  }

  const writeClient = client as BlogApiClient;

  server.registerTool(
    "create_article",
    {
      description: "创建新文章",
      inputSchema: {
        title: z.string(),
        content: z.string(),
        summary: z.string().optional(),
        coverImage: z.string().optional(),
        tags: z.array(z.string()).optional(),
        category: z.string().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
      },
    },
    async (args) => {
      try {
        return textResult(await writeClient.createArticle(args));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "update_article",
    {
      description: "更新已有文章（只传需要修改的字段）",
      inputSchema: {
        slug: z.string(),
        title: z.string().optional(),
        content: z.string().optional(),
        summary: z.string().optional(),
        coverImage: z.string().optional(),
        tags: z.array(z.string()).optional(),
        category: z.string().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
      },
    },
    async ({ slug, ...input }) => {
      try {
        return textResult(await writeClient.updateArticle(slug, input));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "publish_article",
    {
      description: "发布文章",
      inputSchema: { slug: z.string() },
    },
    async ({ slug }) => {
      try {
        return textResult(
          await writeClient.updateArticle(slug, { status: "published" }),
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "delete_article",
    {
      description: "删除文章",
      inputSchema: { slug: z.string() },
    },
    async ({ slug }) => {
      try {
        await writeClient.deleteArticle(slug);
        return textResult({ message: `文章 "${slug}" 已删除` });
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}

function registerProjectTools(server: McpServer, client: BlogApiClientLike) {
  server.registerTool(
    "list_projects",
    {
      description: "列出项目作品",
      inputSchema: {
        status: z.enum(["draft", "published"]).optional(),
      },
    },
    async (args) => {
      try {
        return textResult(await client.listProjects(args.status));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "get_project",
    {
      description: "获取单个项目详情",
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      try {
        return textResult(await client.getProject(id));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  if (isReadOnlyMode()) {
    return;
  }

  const writeClient = client as BlogApiClient;

  server.registerTool(
    "create_project",
    {
      description: "创建新项目作品",
      inputSchema: {
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
    },
    async (args) => {
      try {
        return textResult(await writeClient.createProject(args));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "update_project",
    {
      description: "更新已有项目",
      inputSchema: {
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
    },
    async ({ id, ...input }) => {
      try {
        return textResult(await writeClient.updateProject(id, input));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "delete_project",
    {
      description: "删除项目",
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      try {
        await writeClient.deleteProject(id);
        return textResult({ message: `项目 "${id}" 已删除` });
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}

function registerProfileTools(server: McpServer, client: BlogApiClientLike) {
  server.registerTool(
    "get_profile",
    {
      description: "获取站点个人资料（简历/关于页/首页 Hero 内容）",
      inputSchema: {},
    },
    async () => {
      try {
        return textResult(await client.getProfile());
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  if (isReadOnlyMode()) {
    return;
  }

  const writeClient = client as BlogApiClient;

  server.registerTool(
    "update_profile",
    {
      description: "更新站点个人资料（只传需要修改的字段）",
      inputSchema: {
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
    },
    async (input) => {
      try {
        return textResult(await writeClient.updateProfile(input));
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}

export function registerRelayAgentTools(
  server: McpServer,
  client: BlogApiClientLike,
): void {
  registerArticleTools(server, client);
  registerProjectTools(server, client);
  registerProfileTools(server, client);
}
