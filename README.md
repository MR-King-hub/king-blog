# RelayAgent

个人博客 + AI Agent 系统（Monorepo）。GitHub 仓库名：**relayagent**。

**定位**：单租户、自托管的个人站模板——适合 fork 后部署自己的博客，不是多用户 SaaS 平台。

## 项目结构

```
relayagent/
├── packages/
│   ├── web/              ← Next.js 博客前端
│   ├── agent-server/     ← LangGraph Agent + CRUD 后端服务
│   ├── mcp/              ← Cursor MCP（管理员改内容）
│   └── shared/           ← 共享类型定义
├── pnpm-workspace.yaml
├── package.json          ← 根 workspace 脚本
└── tsconfig.json         ← 根 TypeScript 引用
```

## 技术栈

| 包 | 技术 |
|---|---|
| **web** | Next.js 16, React 19, Tailwind CSS 4, framer-motion |
| **agent-server** | Hono, LangGraph, LangChain, Prisma, SQLite |
| **mcp** | MCP Server（Cursor 管理文章/项目/个人资料） |
| **shared** | TypeScript 类型定义 |

## 数据库

后端使用 **SQLite**（通过 Prisma ORM），默认数据库文件：

| 环境 | 路径 | 说明 |
|------|------|------|
| 本地开发 | `packages/agent-server/dev.db` | 由 `DATABASE_URL` 指定 |
| Docker 生产 | `deploy/data/relayagent.db` | 挂载到容器内 `./data/relayagent.db` |

**为什么用 SQLite？** 零依赖、部署简单，对个人博客的读写量完全够用。

**使用约束（重要）**：

- 仅支持 **单实例** 部署——不要水平扩展多个 `api` 容器共享同一数据库文件，否则可能损坏数据
- 备份 = 复制 `.db` 文件（生产环境建议先停服或使用 SQLite 备份命令，见 [deploy/README.md](./deploy/README.md)）
- 若未来需要多实例 / 高并发 / 多租户，需迁移到 PostgreSQL 等服务器级数据库（当前 schema 未做多库适配）

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
# 编辑 .env 填入 LLM API Key、JWT_SECRET、管理员账号等
```

### 初始化数据库

```bash
cd packages/agent-server
pnpm db:migrate    # 执行迁移，创建 SQLite 文件
pnpm db:seed       # 写入默认管理员、站点资料等（可选）
cd ../..
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

## Cursor MCP（管理员改内容）

在 Cursor 里通过 MCP 直接管理文章、项目和个人资料，无需手动调 API。

```bash
pnpm --filter @relayagent/mcp build
cp packages/mcp/.env.example packages/mcp/.env
cp .cursor/mcp.json.example .cursor/mcp.json   # 按需修改路径和账号
```

也可以在浏览器里管理：**登录 → 导航栏「资料」→ `/admin/profile`**（改简历/Hero/关于页），与 MCP 改的是同一份数据。

配置好后重启 Cursor，即可用自然语言操作，例如「列出草稿」「发布某篇文章」「更新简历时间线」。

详见 [packages/mcp/README.md](./packages/mcp/README.md)。

## 部署

生产环境使用 Docker Compose（`api` + `web` + `nginx`），详见 [deploy/README.md](./deploy/README.md)。

```bash
bash deploy/deploy.sh
```
