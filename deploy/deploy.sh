#!/bin/bash
# ═══════════════════════════════════════════════════════════
# 部署：本地构建镜像 → 上传 → 服务器只 load + 运行
#
# 用法:
#   bash deploy/deploy.sh
#   DEPLOY_ONLY=web bash deploy/deploy.sh      # 只更前端（快很多）
#   DEPLOY_ONLY=api bash deploy/deploy.sh      # 只更后端
#   DEPLOY_SKIP_BUILD=1 bash deploy/deploy.sh  # 跳过构建，只上传+重启
# ═══════════════════════════════════════════════════════════

set -euo pipefail

SERVER="${DEPLOY_SERVER:-root@43.161.237.30}"
REMOTE_DIR="${DEPLOY_REMOTE_DIR:-/opt/relayagent}"
DEPLOY_HOST="${SERVER#*@}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DEPLOY_ONLY="${DEPLOY_ONLY:-all}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_DIR="$REPO_ROOT/deploy"
IMAGES_TAR="/tmp/relayagent-images-${IMAGE_TAG}.tar.gz"

API_IMAGE="relayagent-api:${IMAGE_TAG}"
WEB_IMAGE="relayagent-web:${IMAGE_TAG}"

# shellcheck source=ssh-env.sh
source "$DEPLOY_DIR/ssh-env.sh"
resolve_deploy_ssh

if ! command -v docker &>/dev/null; then
  echo "❌ 未找到 docker CLI，请安装: brew install colima docker docker-compose"
  exit 1
fi

# shellcheck source=docker-env.sh
source "$DEPLOY_DIR/docker-env.sh"
ensure_local_docker

image_digest() {
  docker image inspect --format='{{.Id}}' "$1" 2>/dev/null || echo "missing"
}

echo "📁 仓库: $REPO_ROOT"
echo "🖥️  服务器: $SERVER:$REMOTE_DIR"
echo "🏷️  镜像: $API_IMAGE, $WEB_IMAGE"
echo "📦 范围: $DEPLOY_ONLY"
[ -n "${DEPLOY_SSH_KEY:-}" ] && echo "🔑 SSH 密钥: $DEPLOY_SSH_KEY"
echo ""

# ── 1. 本地构建 ──
if [ "${DEPLOY_SKIP_BUILD:-}" != "1" ]; then
  echo "🔨 第 1 步: 本地构建镜像..."
  IMAGE_TAG="$IMAGE_TAG" DEPLOY_ONLY="$DEPLOY_ONLY" bash "$DEPLOY_DIR/build-images.sh"
else
  echo "⏭️  跳过本地构建 (DEPLOY_SKIP_BUILD=1)"
fi

IMAGES_TO_UPLOAD=()
case "$DEPLOY_ONLY" in
  web) IMAGES_TO_UPLOAD=("$WEB_IMAGE") ;;
  api) IMAGES_TO_UPLOAD=("$API_IMAGE") ;;
  all) IMAGES_TO_UPLOAD=("$API_IMAGE" "$WEB_IMAGE") ;;
  *) echo "❌ DEPLOY_ONLY 只能是 web|api|all"; exit 1 ;;
esac

for img in "${IMAGES_TO_UPLOAD[@]}"; do
  if ! docker image inspect "$img" &>/dev/null; then
    echo "❌ 镜像不存在: $img，请先构建"
    exit 1
  fi
done

echo ""

# ── 2. 检查远程 digest，跳过未变更镜像 ──
echo "🔍 第 2 步: 检查镜像是否变更..."
REMOTE_DIGESTS=$("${SSH_CMD[@]}" "$SERVER" "cat $REMOTE_DIR/deploy/.image-digests 2>/dev/null || true")

IMAGES_CHANGED=()
for img in "${IMAGES_TO_UPLOAD[@]}"; do
  local_digest=$(image_digest "$img")
  remote_digest=$(echo "$REMOTE_DIGESTS" | grep "^${img}=" | cut -d= -f2- || true)
  if [ "$local_digest" = "$remote_digest" ] && [ "${DEPLOY_FORCE:-}" != "1" ]; then
    echo "  ⏭️  $img 未变更，跳过上传"
  else
    echo "  📤 $img 需要上传"
    IMAGES_CHANGED+=("$img")
  fi
done

echo ""

# ── 3. 导出并上传 ──
if [ ${#IMAGES_CHANGED[@]} -gt 0 ]; then
  echo "📦 第 3 步: 导出镜像..."
  # shellcheck disable=SC2068
  docker save ${IMAGES_CHANGED[@]} | gzip > "$IMAGES_TAR"
  echo "  → 大小: $(du -sh "$IMAGES_TAR" | cut -f1)"

  echo "📤 上传到服务器..."
  "${SSH_CMD[@]}" "$SERVER" "mkdir -p $REMOTE_DIR/deploy"
  rsync -avz \
    "${RSYNC_SSH[@]}" \
    --exclude .env \
    --exclude data \
    --exclude '*.tar.gz' \
    --exclude nginx/active.conf \
    "$DEPLOY_DIR/" "$SERVER:$REMOTE_DIR/deploy/"
  rsync -avz "${RSYNC_SSH[@]}" "$IMAGES_TAR" "$SERVER:$REMOTE_DIR/deploy/images.tar.gz"
  UPLOAD_IMAGES=1
else
  echo "⏭️  第 3 步: 镜像均未变更，跳过上传"
  UPLOAD_IMAGES=0
fi

echo ""

# ── 4. 远程加载并启动 ──
echo "🚀 第 4 步: 服务器加载镜像并启动..."

DIGEST_FILE=$(mktemp)
for img in "$API_IMAGE" "$WEB_IMAGE"; do
  d=$(image_digest "$img")
  [ "$d" != "missing" ] && echo "${img}=${d}" >> "$DIGEST_FILE"
done

"${SSH_CMD[@]}" "$SERVER" bash -s <<REMOTE_SCRIPT
set -euo pipefail

REMOTE_DIR="$REMOTE_DIR"
DEPLOY_HOST="$DEPLOY_HOST"
IMAGE_TAG="$IMAGE_TAG"
UPLOAD_IMAGES="$UPLOAD_IMAGES"
cd "\$REMOTE_DIR/deploy"

if [ "\$UPLOAD_IMAGES" = "1" ]; then
  echo "  → 加载镜像..."
  gunzip -c images.tar.gz | docker load
  rm -f images.tar.gz
fi

echo "  → 重启服务..."
IMAGE_TAG="\$IMAGE_TAG" docker compose up -d --no-build

echo ""
docker compose ps
echo ""
echo "✅ 部署完成"
echo "  → 站点: http://\$DEPLOY_HOST"
echo "  → 健康检查: http://\$DEPLOY_HOST/api/health"
REMOTE_SCRIPT

# 更新远程 digest 记录
if [ -s "$DIGEST_FILE" ]; then
  rsync -avz "${RSYNC_SSH[@]}" "$DIGEST_FILE" "$SERVER:$REMOTE_DIR/deploy/.image-digests"
fi
rm -f "$DIGEST_FILE"

rm -f "$IMAGES_TAR"

echo ""
echo "═══════════════════════════════════════════════"
echo "🎉 部署成功"
echo "  → http://${DEPLOY_HOST}"
echo "═══════════════════════════════════════════════"
