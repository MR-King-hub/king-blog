#!/bin/bash
# 部署用 SSH 配置（被 deploy.sh 引用）

resolve_deploy_ssh() {
  DEPLOY_HOST="${SERVER#*@}"

  # 香港服务器默认密钥
  if [ -z "${DEPLOY_SSH_KEY:-}" ] && [ "$DEPLOY_HOST" = "43.161.237.30" ] && [ -f "$HOME/.ssh/hongkong.pem" ]; then
    DEPLOY_SSH_KEY="$HOME/.ssh/hongkong.pem"
  fi

  SSH_CMD=(ssh -o StrictHostKeyChecking=accept-new)
  RSYNC_SSH=()
  if [ -n "${DEPLOY_SSH_KEY:-}" ]; then
    SSH_CMD+=(-i "$DEPLOY_SSH_KEY")
    RSYNC_SSH=(-e "ssh -i $DEPLOY_SSH_KEY -o StrictHostKeyChecking=accept-new")
  fi
}
