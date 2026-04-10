# New Blog — Monorepo

个人博客系统，包含前端页面和带 AI Agent 的后端服务。

## 项目结构

```
new-blog/
├── packages/
│   ├── web/              ← Next.js 博客前端
│   ├── agent-server/     ← LangGraph Agent + CRUD 后端服务
│   └── shared/           ← 共享类型定义
├── pnpm-workspace.yaml
├── package.json          ← 根 workspace 脚本
└── tsconfig.json         ← 根 TypeScript 引用
```

## 技术栈

| 包 | 技术 |
|---|---|
| **web** | Next.js 16, React 19, Tailwind CSS 4, framer-motion |
| **agent-server** | Hono, LangGraph, LangChain, OpenAI |
| **shared** | TypeScript 类型定义 |

## 快速开始

### 前置要求

- Node.js 20+
- pnpm 9+

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

```bash
cp packages/agent-server/.env.example packages/agent-server/.env
# 编辑 .env 填入你的 OpenAI API Key
```

### 启动开发

```bash
# 同时启动前端和后端
pnpm dev

# 单独启动前端 (localhost:3000)
pnpm dev:web

# 单独启动后端 (localhost:3001)
pnpm dev:server
```

## Agent 说明

### 写作助手 (writing-assistant)
帮助撰写、润色和优化博客文章内容。

### 内容审核 (content-reviewer)
审核文章内容，提供结构、语法和 SEO 优化建议。

## API 端点

### 文章 CRUD
- `GET /api/articles` — 文章列表（支持分页、筛选）
- `GET /api/articles/:slug` — 文章详情
- `POST /api/articles` — 创建文章
- `PUT /api/articles/:slug` — 更新文章
- `DELETE /api/articles/:slug` — 删除文章

### Agent
- `POST /api/agents/chat` — 与 Agent 对话（SSE 流式）
- `GET /api/agents/types` — 获取可用 Agent 列表

### 健康检查
- `GET /api/health` — 服务状态
