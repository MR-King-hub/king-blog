#!/bin/bash
# ═══════════════════════════════════════════════════════════
# 首次为 relayagent.cloud 申请 Let's Encrypt 证书并启用 HTTPS
#
# 在服务器上运行（需已部署 docker compose 且域名已解析到本机）：
#   cd /opt/relayagent/deploy
#   # 在 .env 中设置 SSL_EMAIL=your@email.com
#   bash scripts/setup-ssl.sh
# ═══════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$DEPLOY_DIR"

if [ -f .env ]; then
  # shellcheck disable=SC1091
  source .env
fi

DOMAIN="${DOMAIN:-relayagent.cloud}"
WWW_DOMAIN="${WWW_DOMAIN:-www.relayagent.cloud}"
SSL_EMAIL="${SSL_EMAIL:-}"

if [ -z "$SSL_EMAIL" ]; then
  echo "❌ 请在 deploy/.env 中设置 SSL_EMAIL（Let's Encrypt 注册邮箱）"
  exit 1
fi

CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
ACTIVE_CONF="$DEPLOY_DIR/nginx/active.conf"

echo "🔐 域名: ${DOMAIN}, ${WWW_DOMAIN}"
echo "📧 邮箱: ${SSL_EMAIL}"
echo ""

if [ -f "$CERT_DIR/fullchain.pem" ]; then
  echo "✅ 证书已存在，切换到 HTTPS 配置..."
  cp nginx/default.conf "$ACTIVE_CONF"
  docker compose up -d nginx
  echo ""
  echo "🎉 HTTPS 已启用: https://${WWW_DOMAIN}"
  exit 0
fi

echo "📋 第 1 步: 使用 HTTP 引导配置（用于 ACME 验证）..."
cp nginx/bootstrap.conf "$ACTIVE_CONF"
docker compose up -d nginx

echo ""
echo "📋 第 2 步: 申请 Let's Encrypt 证书..."
docker compose --profile certbot run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$SSL_EMAIL" \
  --agree-tos \
  --no-eff-email \
  --non-interactive \
  -d "$DOMAIN" \
  -d "$WWW_DOMAIN"

echo ""
echo "📋 第 3 步: 切换到 HTTPS 配置..."
cp nginx/default.conf "$ACTIVE_CONF"
docker compose up -d nginx
docker compose exec nginx nginx -s reload

echo ""
echo "═══════════════════════════════════════════════"
echo "🎉 HTTPS 配置完成"
echo "  → https://${WWW_DOMAIN}"
echo "  → http 会自动跳转到 https"
echo ""
echo "证书续期（建议加入 crontab，每月一次）："
echo "  cd $DEPLOY_DIR && bash scripts/renew-ssl.sh"
echo "═══════════════════════════════════════════════"
