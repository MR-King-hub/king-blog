#!/bin/bash
# 续期 Let's Encrypt 证书（证书有效期 90 天，建议每月执行）
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$(cd "$SCRIPT_DIR/.." && pwd)"

docker compose --profile certbot run --rm certbot renew --quiet
docker compose exec nginx nginx -s reload
echo "✅ 证书续期检查完成"
