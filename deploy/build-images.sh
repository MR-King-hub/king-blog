#!/bin/bash
# 本地构建：pnpm 编译 + Docker 打包运行时镜像
#
# DEPLOY_ONLY=web|api|mcp|all  只构建指定服务（默认 all）

set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$DEPLOY_DIR/.." && pwd)"
IMAGE_TAG="${IMAGE_TAG:-latest}"
BUILD_PLATFORM="${BUILD_PLATFORM:-linux/amd64}"
DEPLOY_ONLY="${DEPLOY_ONLY:-all}"

if ! command -v docker &>/dev/null; then
  echo "❌ 未找到 docker CLI，请安装: brew install colima docker docker-compose docker-buildx"
  exit 1
fi

# shellcheck source=docker-env.sh
source "$DEPLOY_DIR/docker-env.sh"
ensure_local_docker

build_web() {
  echo "  → 编译 web..."
  cd "$REPO_ROOT/packages/web"
  INTERNAL_API_URL= BUILD_API_URL= NEXT_PUBLIC_API_URL= pnpm build
  if [ ! -f "$REPO_ROOT/packages/web/.next/standalone/packages/web/server.js" ]; then
    echo "❌ 未找到 standalone 产物"
    exit 1
  fi
}

build_api() {
  echo "  → 编译 api..."
  cd "$REPO_ROOT"
  pnpm --filter @relayagent/agent-server build
}

build_mcp() {
  echo "  → 编译 mcp..."
  cd "$REPO_ROOT"
  pnpm --filter @relayagent/mcp build
}

echo "🔨 第 1 步: 本地 pnpm 编译 (DEPLOY_ONLY=$DEPLOY_ONLY)..."
cd "$REPO_ROOT"
# 依赖已装则跳过，节省 10～30s
if [ ! -d node_modules ]; then
  pnpm install --frozen-lockfile
fi

case "$DEPLOY_ONLY" in
  web) build_web ;;
  api) build_api ;;
  mcp) build_mcp ;;
  all) build_api; build_web; build_mcp ;;
  *) echo "❌ DEPLOY_ONLY 只能是 web|api|mcp|all"; exit 1 ;;
esac

echo ""
echo "🔨 第 2 步: 打包 Docker 镜像 (platform: $BUILD_PLATFORM)..."
cd "$DEPLOY_DIR"
case "$DEPLOY_ONLY" in
  web) DOCKER_DEFAULT_PLATFORM="$BUILD_PLATFORM" IMAGE_TAG="$IMAGE_TAG" docker compose build web ;;
  api) DOCKER_DEFAULT_PLATFORM="$BUILD_PLATFORM" IMAGE_TAG="$IMAGE_TAG" docker compose build api ;;
  mcp) DOCKER_DEFAULT_PLATFORM="$BUILD_PLATFORM" IMAGE_TAG="$IMAGE_TAG" docker compose build mcp ;;
  all) DOCKER_DEFAULT_PLATFORM="$BUILD_PLATFORM" IMAGE_TAG="$IMAGE_TAG" docker compose build ;;
esac

echo ""
echo "✅ 镜像已构建:"
docker images --format "  {{.Repository}}:{{.Tag}}  {{.Size}}" | grep -E '^relayagent-(api|web|mcp):' || true
