#!/bin/bash
# 已迁移到仓库根目录 deploy/deploy.sh
exec bash "$(cd "$(dirname "$0")/../../.." && pwd)/deploy/deploy.sh" "$@"
