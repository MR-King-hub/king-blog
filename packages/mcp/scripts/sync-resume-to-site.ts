/**
 * 将 resume.md 核心信息同步到站点 profile / RelayAgent 项目
 * 用法：RELAYAGENT_API_URL=... RELAYAGENT_ADMIN_*=... pnpm exec tsx scripts/sync-resume-to-site.ts
 */

import { BlogApiClient } from "../src/client.js";
import { loadMcpEnv } from "../src/env.js";

loadMcpEnv();

const baseUrl =
  process.env.RELAYAGENT_API_URL ||
  process.env.BLOG_API_URL ||
  "http://localhost:3001";
const email =
  process.env.RELAYAGENT_ADMIN_EMAIL ||
  process.env.ADMIN_EMAIL ||
  "";
const password =
  process.env.RELAYAGENT_ADMIN_PASSWORD ||
  process.env.ADMIN_PASSWORD ||
  "";

if (!email || !password) {
  throw new Error("缺少 RELAYAGENT_ADMIN_EMAIL / RELAYAGENT_ADMIN_PASSWORD");
}

const client = new BlogApiClient(baseUrl, email, password);

const RELAYAGENT_PROJECT_ID = "8621778e-6bc1-46fe-bb0f-0e47d60036dd";

async function main() {
  const profile = await client.updateProfile({
    name: "金世哲",
    tagline: "Frontend · AI Agent · MCP",
    headline: "Hi, 我是",
    heroSubtitle:
      "腾讯前端工程师 · CloudBase Builder · WorkBuddy · MCP & CLI · RelayAgent 作者",
    location: "中国",
    role: "前端工程师",
    experienceLabel: "2+ 年",
    bioParagraphs: [
      "西安电子科技大学软件工程硕士，2024 年加入腾讯。专注 AI 应用前端与 Agent 产品化：对话界面、流式交互、Human-in-the-Loop 审批链路均有落地经验。",
      "在腾讯负责 CloudBase Builder 控制台前端，参与 WorkBuddy 聊天主链路、CloudBase MCP & AI CLI、Skills/Rules 建设。个人开源 RelayAgent——访客 Agent、Task 子任务协调、公网 Streamable HTTP 简历 MCP。",
    ],
    timeline: [
      {
        year: "2024 — 至今",
        role: "前端工程师",
        company: "腾讯",
        description:
          "CloudBase Builder 控制台与 Agent UI；WorkBuddy 聊天/语音/Teams 商业化；CloudBase MCP & CLI、Skills/Rules。",
        color: "#C9A87C",
      },
      {
        year: "2026.4 — 至今",
        role: "独立开发者",
        company: "RelayAgent",
        description:
          "AI 原生个人站：LangGraph 访客 Agent、Task 子任务 HITL、Streamable HTTP 公网 MCP。",
        color: "#9B7E9B",
      },
      {
        year: "2022 — 2023",
        role: "前端开发实习生",
        company: "小米",
        description: "小部件编辑器与官网；折叠屏自适应引擎。",
        color: "#B07A5B",
      },
      {
        year: "2021 — 2024",
        role: "硕士研究生",
        company: "西安电子科技大学",
        description: "软件工程。",
        color: "#6B9B97",
      },
    ],
    skillCategories: [
      {
        category: "前端",
        color: "#6B9B97",
        skills: [
          { name: "React / Next.js", level: 95 },
          { name: "TypeScript", level: 92 },
          { name: "Taro 小程序", level: 88 },
          { name: "Tailwind / shadcn", level: 88 },
          { name: "SSE / 流式 UI", level: 90 },
          { name: "低代码 DSL", level: 85 },
        ],
      },
      {
        category: "AI 应用",
        color: "#B07A5B",
        skills: [
          { name: "LangGraph / LangChain", level: 85 },
          { name: "MCP（stdio + HTTP）", level: 90 },
          { name: "ACP / AG-UI", level: 78 },
          { name: "HITL / Task 协调", level: 88 },
          { name: "Rules / Skills", level: 85 },
          { name: "轻量 RAG", level: 82 },
        ],
      },
      {
        category: "工程",
        color: "#C9A87C",
        skills: [
          { name: "Node.js / Hono", level: 85 },
          { name: "Docker / Nginx", level: 82 },
          { name: "Monorepo / pnpm", level: 85 },
          { name: "Git / CI/CD", level: 90 },
        ],
      },
    ],
    socialLinks: [
      {
        icon: "github",
        label: "GitHub",
        href: "https://github.com/MR-King-hub/relayagent",
        desc: "MR-King-hub/relayagent",
      },
      {
        icon: "mail",
        label: "邮箱",
        href: "mailto:943778313@qq.com",
        desc: "943778313@qq.com",
      },
      {
        icon: "book",
        label: "简历 MCP",
        href: "https://www.relayagent.cloud/mcp",
        desc: "Cursor 只读连接",
      },
      {
        icon: "book",
        label: "博客",
        href: "/blog",
        desc: "技术文章",
      },
    ],
    heroBento: [
      {
        id: "blog",
        title: "技术博客",
        desc: "分享前端、AI 和全栈开发的思考与实践",
        icon: "file-text",
        href: "/blog",
        span: "md:col-span-2",
        gradient:
          "linear-gradient(135deg, rgba(107,155,151,0.06) 0%, rgba(201,168,124,0.04) 100%)",
        iconColor: "#6B9B97",
        stat: "4 篇文章",
      },
      {
        id: "projects",
        title: "项目作品",
        desc: "开源项目与个人作品集",
        icon: "folder-git",
        href: "/projects",
        span: "md:col-span-1",
        gradient:
          "linear-gradient(135deg, rgba(201,168,124,0.06) 0%, rgba(176,122,91,0.04) 100%)",
        iconColor: "#C9A87C",
        stat: "1 个项目",
      },
      {
        id: "ai",
        title: "简历 MCP",
        desc: "招聘方 Cursor 直连，查询经历与文章",
        icon: "bot",
        href: "https://www.relayagent.cloud/mcp",
        span: "md:col-span-1",
        gradient:
          "linear-gradient(135deg, rgba(176,122,91,0.06) 0%, rgba(155,126,155,0.04) 100%)",
        iconColor: "#B07A5B",
        stat: "只读",
      },
      {
        id: "about",
        title: "关于我",
        desc: "个人经历、技术栈与联系方式",
        icon: "briefcase",
        href: "/about",
        span: "md:col-span-2",
        gradient:
          "linear-gradient(135deg, rgba(155,126,155,0.06) 0%, rgba(107,155,151,0.04) 100%)",
        iconColor: "#9B7E9B",
        stat: "了解更多 →",
      },
    ],
  });

  const project = await client.updateProject(RELAYAGENT_PROJECT_ID, {
    description:
      "AI 原生个人站：访客 LangGraph Agent + 轻量 RAG；敏感诉求唤起子任务，Task Sub Agent 在独立上下文中协调访客与 Owner（已落地面试场景）。Streamable HTTP 公网 MCP 供招聘方 Cursor 只读查询。",
    techStack: [
      "LangGraph",
      "LangChain",
      "MCP SDK",
      "Streamable HTTP",
      "HITL",
      "Lightweight RAG",
      "Next.js",
      "Hono",
      "SQLite",
      "Docker",
    ],
  });

  console.log("✅ profile updated:", profile.name, profile.updatedAt);
  console.log("✅ project updated:", project.title);
}

main().catch((error) => {
  console.error("❌ sync failed:", error);
  process.exit(1);
});
