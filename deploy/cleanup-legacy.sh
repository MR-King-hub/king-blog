#!/bin/bash
# 清理香港服务器上的旧 PM2 部署残留和失败的 Docker 构建缓存
# 用法: DEPLOY_SERVER=root@43.161.237.30 bash deploy/cleanup-legacy.sh

set -euo pipefail

SERVER="${DEPLOY_SERVER:-root@43.161.237.30}"
REMOTE_DIR="${DEPLOY_REMOTE_DIR:-/opt/relayagent}"

DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=ssh-env.sh
source "$DEPLOY_DIR/ssh-env.sh"
resolve_deploy_ssh

echo "🧹 清理 $SERVER 上的遗留部署..."

"${SSH_CMD[@]}" "$SERVER" bash -s <<REMOTE_SCRIPT
set -euo pipefail
REMOTE_DIR="$REMOTE_DIR"

echo "  → 停止 PM2 进程..."
if command -v pm2 &>/dev/null; then
  pm2 delete all 2>/dev/null || true
  pm2 save 2>/dev/null || true
fi

echo "  → 停止宿主机 Nginx..."
systemctl stop nginx 2>/dev/null || true
systemctl disable nginx 2>/dev/null || true

echo "  → 清理 Docker 构建缓存（保留已加载镜像）..."
if command -v docker &>/dev/null; then
  docker compose -f "\$REMOTE_DIR/deploy/docker-compose.yml" down 2>/dev/null || true
  docker builder prune -af 2>/dev/null || true
  docker image prune -af 2>/dev/null || true
fi

echo "  → 删除误同步的完整仓库（保留 deploy/ 配置和数据）..."
if [ -d "\$REMOTE_DIR/packages" ]; then
  rm -rf "\$REMOTE_DIR/packages" "\$REMOTE_DIR/node_modules" \
    "\$REMOTE_DIR/pnpm-lock.yaml" "\$REMOTE_DIR/package.json" \
    "\$REMOTE_DIR/pnpm-workspace.yaml" 2>/dev/null || true
fi

echo "  → 确保 deploy 数据目录存在..."
mkdir -p "\$REMOTE_DIR/deploy/data"
if [ ! -f "\$REMOTE_DIR/deploy/data/relayagent.db" ]; then
  for legacy in \
    "\$REMOTE_DIR/deploy/data/blog.db" \
    /opt/blog/deploy/data/blog.db \
    /opt/relayagent-server/data/relayagent.db \
    /opt/blog-server/data/blog.db \
    /opt/relayagent-server/prod.db \
    /opt/relayagent-server/dev.db; do
    if [ -f "\$legacy" ]; then
      cp "\$legacy" "\$REMOTE_DIR/deploy/data/relayagent.db"
      echo "    已复制数据库: \$legacy → relayagent.db"
      break
    fi
  done
fi

echo ""
echo "=== 清理后状态 ==="
echo "内存: \$(free -h | awk '/Mem:/{print \$3\"/\"\$2}')"
ss -tlnp | grep -E ':80 |:3000 |:3001 ' || echo "端口 80/3000/3001: 均未监听 ✓"
command -v pm2 &>/dev/null && pm2 list 2>/dev/null || true
docker ps -a 2>/dev/null || true
du -sh /var/lib/docker "\$REMOTE_DIR" /opt/relayagent-server /opt/relayagent-web-next 2>/dev/null
echo ""
echo "✅ 清理完成。旧目录 /opt/relayagent-server /opt/relayagent-web-next 暂保留，Docker 部署成功后可手动删除。"
REMOTE_SCRIPT
