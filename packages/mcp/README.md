# @relayagent/mcp

MCP Server，通过 `agent-server` 的 REST API 管理博客内容。

与访客 Agent **完全无关**——这是给管理员在 Cursor 里直接改站点用的。

## 架构

两种运行方式：

| 模式 | 进程位置 | Cursor 配置 | 用途 |
|------|----------|-------------|------|
| **HTTP（线上）** | 服务器 `mcp` 容器 | `"url": "https://www.relayagent.cloud/mcp"` | 只读，远程连接，可分享 |
| **stdio（本地）** | 本机子进程 | `command` + `args` | 管理员写操作 |

```
线上：
Cursor → HTTPS /mcp → nginx → mcp:3002 (Streamable HTTP)
                              → api:3001 (只读公开 API)

本地管理员：
Cursor → stdio → packages/mcp → REST + JWT → agent-server
```

## Tools

| 模式 | 资源 | Tools |
|------|------|-------|
| 只读 | 文章 | `list_articles` `get_article` |
| 只读 | 项目 | `list_projects` `get_project` |
| 只读 | 个人资料 | `get_profile` |
| 管理员 | 文章 | 上述 + `create_article` `update_article` `publish_article` `delete_article` |
| 管理员 | 项目 | 上述 + `create_project` `update_project` `delete_project` |
| 管理员 | 个人资料 | 上述 + `update_profile` |

只读模式通过公开 API 读取，无需管理员账号；列表默认只返回 `published` 内容。

## 前置条件

**只读模式（推荐线上）**：设置 `RELAYAGENT_MCP_READONLY=true` 和 `RELAYAGENT_API_URL=https://www.relayagent.cloud` 即可。

**管理员模式**：

1. `agent-server` 已启动（默认 `http://localhost:3001`）
2. 已执行 `pnpm db:migrate` 和 `pnpm db:seed`

## 安装与构建

```bash
# 在仓库根目录
pnpm install
pnpm --filter @relayagent/mcp build

# 配置环境变量
cp packages/mcp/.env.example packages/mcp/.env
# 编辑 .env，填入与 agent-server 一致的管理员账号
```

## Cursor 配置

### 线上只读（推荐）

部署后，在 `~/.cursor/mcp.json` 写入：

```json
{
  "mcpServers": {
    "relayagent": {
      "url": "https://www.relayagent.cloud/mcp"
    }
  }
}
```

重启 Cursor，Customize → MCPs 里应能看到绿色连接。

### 本地管理员（stdio）

```bash
pnpm --filter @relayagent/mcp build
cp .cursor/mcp.json.example ~/.cursor/mcp.json
# 启用 relayagent-local 条目，改路径和密码
```

也可以在浏览器管理：**登录 → 「资料」→ `/admin/profile`**，与 MCP 的 `update_profile` 写入同一份数据。

## 改生产环境

**只读（安全，可分享配置）**：

```bash
RELAYAGENT_API_URL=https://www.relayagent.cloud
RELAYAGENT_MCP_READONLY=true
```

**管理员写操作**：去掉 `RELAYAGENT_MCP_READONLY`，填入 `RELAYAGENT_ADMIN_*`，确保网络可达且管理员账号有效。

## 部署到服务器

线上 MCP 作为独立 Docker 服务运行（`deploy/docker-compose.yml` 中的 `mcp`）：

```bash
pnpm deploy:build          # 含 mcp 镜像
pnpm deploy                # 推到 VPS 并启动
```

nginx 将 `https://www.relayagent.cloud/mcp` 反代到 `mcp:3002`。容器内通过 `http://api:3001` 读取公开 API，默认只读。

本地调试 HTTP 模式：

```bash
RELAYAGENT_API_URL=http://localhost:3001 RELAYAGENT_MCP_READONLY=true pnpm --filter @relayagent/mcp dev:http
# Cursor 临时改 url 为 http://localhost:3002/mcp
```

## 示例指令

- 「列出所有草稿文章」
- 「发布 slug 为 my-post 的文章」
- 「更新我的工作经历，加一条 2025 至今 Senior Engineer」
- 「把 GitHub 链接改成 https://github.com/me」
