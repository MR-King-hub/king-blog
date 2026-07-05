#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# NekoBox 代理服务端 — sing-box + Shadowsocks
# 在香港 VPS 上运行: bash proxy-setup.sh
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

PROXY_PORT="${PROXY_PORT:-8443}"
CONFIG_DIR="/etc/sing-box"
CONFIG_FILE="${CONFIG_DIR}/config.json"
CREDS_FILE="/root/neko-proxy-credentials.txt"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
log() { echo -e "${GREEN}[✔]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }

if [[ $EUID -ne 0 ]]; then
  echo "请用 root 运行"
  exit 1
fi

# ── 安装 sing-box ─────────────────────────────────
if ! command -v sing-box &>/dev/null; then
  log "安装 sing-box..."
  curl -fsSL https://sing-box.app/install.sh | bash
else
  log "sing-box 已安装: $(sing-box version | head -1)"
fi

# ── 生成密码 ──────────────────────────────────────
PASSWORD=$(openssl rand -base64 18 | tr -d '/+=' | head -c 24)
SERVER_IP=$(curl -fsSL --max-time 5 https://api.ipify.org 2>/dev/null || curl -fsSL --max-time 5 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
METHOD="aes-256-gcm"

mkdir -p "$CONFIG_DIR"

log "写入配置 (端口 ${PROXY_PORT})..."
cat > "$CONFIG_FILE" << EOF
{
  "log": {
    "level": "warn",
    "timestamp": true
  },
  "inbounds": [
    {
      "type": "shadowsocks",
      "tag": "ss-in",
      "listen": "::",
      "listen_port": ${PROXY_PORT},
      "method": "${METHOD}",
      "password": "${PASSWORD}"
    }
  ],
  "outbounds": [
    {
      "type": "direct",
      "tag": "direct"
    }
  ]
}
EOF

# ── 校验配置 ──────────────────────────────────────
sing-box check -c "$CONFIG_FILE"

# ── 启动服务 ──────────────────────────────────────
log "启动 sing-box 服务..."
systemctl enable sing-box 2>/dev/null || true
systemctl restart sing-box
systemctl is-active --quiet sing-box

# ── 本机防火墙（如有）──────────────────────────────
if systemctl is-active --quiet firewalld 2>/dev/null; then
  firewall-cmd --permanent --add-port="${PROXY_PORT}/tcp" || true
  firewall-cmd --reload || true
  log "firewalld 已放行 ${PROXY_PORT}/tcp"
fi

# ── SS 分享链接 (NekoBox 可导入) ──────────────────
USERINFO=$(printf '%s:%s' "$METHOD" "$PASSWORD" | base64 -w0 2>/dev/null || printf '%s:%s' "$METHOD" "$PASSWORD" | base64)
SS_LINK="ss://${USERINFO}@${SERVER_IP}:${PROXY_PORT}#HK-Blog"

cat > "$CREDS_FILE" << EOF
═══════════════════════════════════════
  NekoBox 代理节点信息
═══════════════════════════════════════

服务器 IP:  ${SERVER_IP}
端口:       ${PROXY_PORT}
加密:       ${METHOD}
密码:       ${PASSWORD}

导入链接 (复制到 NekoBox):
${SS_LINK}

手动填写:
  类型: Shadowsocks
  地址: ${SERVER_IP}
  端口: ${PROXY_PORT}
  加密: ${METHOD}
  密码: ${PASSWORD}

管理命令:
  查看状态: systemctl status sing-box
  重启:     systemctl restart sing-box
  查看日志: journalctl -u sing-box -f
═══════════════════════════════════════
EOF

echo ""
cat "$CREDS_FILE"
echo ""
warn "请到腾讯云控制台 → 防火墙 → 放行 TCP ${PROXY_PORT}"
warn "凭证已保存: ${CREDS_FILE}"
