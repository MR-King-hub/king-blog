# @blog/mcp

MCP Server，通过 `agent-server` 的 REST API 管理博客内容。

与访客 Agent **完全无关**——这是给管理员在 Cursor 里直接改站点用的。

## 架构

```
Cursor（管理员）
    ↓ MCP stdio
packages/blog-mcp
    ↓ REST + JWT
agent-server /api/articles | /api/projects | /api/profile
```

## Tools

| 资源 | Tools |
|------|-------|
| 文章 | `list_articles` `get_article` `create_article` `update_article` `publish_article` `delete_article` |
| 项目 | `list_projects` `get_project` `create_project` `update_project` `delete_project` |
| 个人资料 | `get_profile` `update_profile` |

个人资料包括：首页 Hero、关于页简历、技能、时间线、社交链接等。

## 前置条件

1. `agent-server` 已启动（默认 `http://localhost:3001`）
2. 已执行 `pnpm db:migrate` 和 `pnpm db:seed`

## 安装与构建

```bash
# 在仓库根目录
pnpm install
pnpm --filter @blog/mcp build

# 配置环境变量
cp packages/blog-mcp/.env.example packages/blog-mcp/.env
# 编辑 .env，填入与 agent-server 一致的管理员账号
```

## Cursor 配置

复制示例配置到项目或全局 MCP 配置：

```bash
cp .cursor/mcp.json.example .cursor/mcp.json
# 编辑 .env 和管理员密码
```

或在 `~/.cursor/mcp.json` 中添加：

```json
{
  "mcpServers": {
    "blog": {
      "command": "pnpm",
      "args": ["--filter", "@blog/mcp", "start"],
      "cwd": "/path/to/new-blog",
      "env": {
        "BLOG_API_URL": "http://localhost:3001",
        "BLOG_ADMIN_EMAIL": "admin@example.com",
        "BLOG_ADMIN_PASSWORD": "your-password"
      }
    }
  }
}
```

开发调试可用 `pnpm --filter @blog/mcp dev` 代替 `start`。

也可以在浏览器管理：**登录 → 「资料」→ `/admin/profile`**，与 MCP 的 `update_profile` 写入同一份数据。

## 改生产环境

将 `BLOG_API_URL` 指向线上 API 地址（如 `https://yourdomain.com`），确保网络可达且管理员账号有效。

## 示例指令

- 「列出所有草稿文章」
- 「发布 slug 为 my-post 的文章」
- 「更新我的工作经历，加一条 2025 至今 Senior Engineer」
- 「把 GitHub 链接改成 https://github.com/me」
