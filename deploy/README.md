# 部署

博客生产环境使用 **Docker Compose**：`api` + `web` + `nginx`。

**镜像在本地（或 CI）构建，服务器只加载运行**，不在 VPS 上编译，避免小机器 OOM。

## 架构

```
本地 Mac / CI                    香港 VPS
─────────────                    ────────
docker compose build      →      docker load（导入镜像）
docker save | scp         →      docker compose up --no-build
                                 nginx 从 Docker Hub 拉取（很小）
```

```
Nginx :80
  ├─ /      → web:3000   (Next.js)
  └─ /api/* → api:3001   (Hono + SQLite)
```

## 数据库（SQLite）

生产数据保存在 **`deploy/data/blog.db`**，通过 volume 挂载进 `api` 容器：

```yaml
volumes:
  - ./data:/app/packages/agent-server/data
environment:
  DATABASE_URL: file:./data/blog.db
```

### 设计约束

- **单实例**：只运行一个 `api` 容器。SQLite 是单写者模型，多个副本同时写同一文件会导致锁冲突或数据损坏。
- **适用场景**：个人博客、低并发自托管。不适合多租户 SaaS 或 K8s 水平扩展。
- **首次部署**：容器启动后执行迁移（见下方「服务器运维」）；需要初始数据时再跑 seed。

### 备份

推荐在维护窗口内备份（停服后复制最稳妥）：

```bash
cd /opt/blog/deploy

# 方式一：停服后备份（推荐）
docker compose stop api
cp data/blog.db "data/blog.db.$(date +%Y%m%d-%H%M%S).bak"
docker compose start api

# 方式二：在线备份（SQLite 内置命令，需容器内 sqlite3）
docker compose exec api sh -c 'sqlite3 data/blog.db ".backup /tmp/blog-backup.db"'
docker cp "$(docker compose ps -q api):/tmp/blog-backup.db" "./data/blog.db.$(date +%Y%m%d).bak"
```

定期把 `.bak` 文件同步到对象存储或另一台机器。

### 恢复

```bash
cd /opt/blog/deploy

docker compose stop api
cp data/blog.db data/blog.db.before-restore   # 可选：保留当前损坏库
cp /path/to/your-backup.db data/blog.db
docker compose start api
```

恢复后若 schema 版本落后，再执行 `docker compose exec api npx prisma migrate deploy`。

## 前置条件

本地用 **Colima** 替代 Docker Desktop（轻量、免费）：

```bash
brew install colima docker docker-compose docker-buildx
colima start --cpu 4 --memory 6
```

部署脚本会自动检测并启动 Colima。首次 `colima start` 需下载 VM 镜像，约 1～2 分钟。

## 部署

```bash
# 香港服务器（默认）
bash deploy/deploy.sh

# 或显式指定
DEPLOY_SERVER=root@43.161.237.30 bash deploy/deploy.sh
```

流程：

1. 本地 `docker compose build`（api + web）
2. `docker save` 导出镜像，scp 到服务器
3. 同步 `deploy/` 配置（nginx、compose、.env.example）
4. 服务器 `docker load` → `docker compose up -d --no-build`

首次构建本地约 5～15 分钟；上传镜像约 300～600MB（视压缩而定）。服务器侧只需加载，内存占用低。

## 日常更新

```bash
bash deploy/deploy.sh
```

### 加速技巧

| 场景 | 命令 | 预计耗时 |
|------|------|----------|
| 只改了前端 | `DEPLOY_ONLY=web bash deploy/deploy.sh` | ~2～4 分钟 |
| 只改了后端 | `DEPLOY_ONLY=api bash deploy/deploy.sh` | ~3～5 分钟 |
| 只改 nginx/.env | `DEPLOY_SKIP_BUILD=1 bash deploy/deploy.sh` | ~10 秒 |
| 完整部署 | `bash deploy/deploy.sh` | ~8～12 分钟 |

**首次慢的原因：** Next.js 全量构建 + api 容器内编译 better-sqlite3 + 上传 ~280MB 镜像。

**之后会快：** Docker 层缓存（改代码不改依赖时跳过 pnpm install）、digest 检测（镜像未变跳过上传）、Colima 保持运行。

## 环境变量

| 变量 | 说明 |
|------|------|
| `DEPLOY_SERVER` | SSH 目标，默认 `root@43.161.237.30` |
| `DEPLOY_SSH_KEY` | SSH 私钥；香港自动用 `~/.ssh/hongkong.pem` |
| `DEPLOY_REMOTE_DIR` | 远程目录，默认 `/opt/blog` |
| `DEPLOY_ONLY` | `web` / `api` / `all`（默认），只构建上传指定服务 |
| `DEPLOY_SKIP_BUILD` | `1` = 跳过本地构建，只上传配置并重启 |
| `DEPLOY_FORCE` | `1` = 强制上传，忽略 digest 检测 |
| `IMAGE_TAG` | 镜像标签，默认 `latest` |
| `HTTP_PORT` | 在服务器 `deploy/.env` 中设置，默认 80 |

生产密钥写在服务器 **`/opt/blog/deploy/.env`**，不要提交到 git。

## 仅本地构建镜像

```bash
bash deploy/build-images.sh
```

## 本地 Docker 调试

```bash
cd deploy
cp .env.example .env
docker compose up --build
```

## 服务器运维

```bash
cd /opt/blog/deploy

docker compose ps
docker compose logs -f api
docker compose logs -f web
docker compose restart

docker compose exec api npx prisma migrate deploy
docker compose exec api npx tsx prisma/seed.ts
```

## 以后接 CI

在 GitHub Actions 中运行 `deploy/build-images.sh`，推送到镜像仓库（GHCR/Docker Hub），服务器改为 `docker pull` 即可，无需 scp tar。
