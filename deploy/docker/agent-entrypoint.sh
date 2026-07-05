#!/bin/sh
set -e
cd /app/packages/agent-server

echo "→ 执行数据库迁移..."
npx prisma migrate deploy

echo "→ 初始化默认数据..."
npx tsx prisma/seed.ts || true

echo "→ 启动 agent-server..."
exec node dist/index.js
