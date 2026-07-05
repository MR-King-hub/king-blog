#!/bin/bash
# 本地 Docker 运行时：Colima + docker CLI（无需 Docker Desktop）

ensure_local_docker() {
  if ! command -v docker &>/dev/null; then
    echo "❌ 未找到 docker CLI"
    echo "   安装: brew install colima docker docker-compose"
    exit 1
  fi

  if ! command -v colima &>/dev/null; then
    echo "❌ 未找到 colima"
    echo "   安装: brew install colima docker docker-compose"
    exit 1
  fi

  if ! colima status &>/dev/null; then
    echo "🐳 启动 Colima..."
    # 构建镜像需要较多内存；可按机器调整
    colima start \
      --cpu "${COLIMA_CPU:-4}" \
      --memory "${COLIMA_MEMORY:-6}" \
      --disk "${COLIMA_DISK:-60}"
  fi

  # 使用 Colima 的 Docker socket
  local colima_socket="${HOME}/.colima/default/docker.sock"
  if [ -S "$colima_socket" ]; then
    export DOCKER_HOST="unix://${colima_socket}"
  fi

  if ! docker info &>/dev/null; then
    echo "❌ Docker 不可用，请检查: colima status"
    exit 1
  fi

  # Homebrew docker 插件 + 移除 Docker Desktop 凭证助手
  export DOCKER_CONFIG="${DOCKER_CONFIG:-$HOME/.docker}"
  mkdir -p "$DOCKER_CONFIG"
  python3 - <<'PY'
import json, os
p = os.path.expanduser("~/.docker/config.json")
cfg = json.load(open(p)) if os.path.exists(p) else {}
for k in ("credsStore", "credHelpers"):
    cfg.pop(k, None)
dirs = cfg.setdefault("cliPluginsExtraDirs", [])
for d in ("/opt/homebrew/lib/docker/cli-plugins",):
    if d not in dirs:
        dirs.append(d)
json.dump(cfg, open(p, "w"), indent=2)
PY

  if ! docker compose version &>/dev/null; then
    echo "❌ docker compose 不可用，请安装: brew install docker-compose"
    exit 1
  fi
}
