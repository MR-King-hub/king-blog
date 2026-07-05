#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🚀 博客后端服务 — 一键部署脚本
#
# 使用方法：在服务器上运行
#   bash setup.sh
#
# 这个脚本会自动：
#   1. 安装 Node.js 20
#   2. 安装 pnpm
#   3. 安装 PM2（进程守护）
#   4. 安装 Nginx（反向代理）
#   5. 拉取代码并安装依赖
#   6. 初始化数据库
#   7. 构建并启动服务
#   8. 配置 Nginx 反向代理
# ═══════════════════════════════════════════════════════════════

set -e  # 遇到错误立即停止

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[✔]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; }

echo ""
echo "═══════════════════════════════════════════════"
echo "  🚀 博客后端服务 — 部署脚本"
echo "═══════════════════════════════════════════════"
echo ""

# ── 第 1 步：检查系统 ─────────────────────────────
log "检查操作系统..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    log "检测到系统: $PRETTY_NAME"
else
    err "无法识别操作系统，请确认是 Ubuntu/Debian/CentOS"
    exit 1
fi

# ── 第 2 步：安装 Node.js 20 ─────────────────────
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    log "Node.js 已安装: $NODE_VERSION"
else
    log "正在安装 Node.js 20..."
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "tencentos" ]; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo yum install -y nodejs
    fi
    log "Node.js 安装完成: $(node -v)"
fi

# ── 第 3 步：安装 pnpm ───────────────────────────
if command -v pnpm &> /dev/null; then
    log "pnpm 已安装: $(pnpm -v)"
else
    log "正在安装 pnpm..."
    npm install -g pnpm
    log "pnpm 安装完成: $(pnpm -v)"
fi

# ── 第 4 步：安装 PM2 ────────────────────────────
if command -v pm2 &> /dev/null; then
    log "PM2 已安装: $(pm2 -v)"
else
    log "正在安装 PM2..."
    npm install -g pm2
    log "PM2 安装完成"
fi

# ── 第 5 步：安装 Nginx ──────────────────────────
if command -v nginx &> /dev/null; then
    log "Nginx 已安装"
else
    log "正在安装 Nginx..."
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        sudo apt-get update
        sudo apt-get install -y nginx
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "tencentos" ]; then
        sudo yum install -y nginx
    fi
    log "Nginx 安装完成"
fi

# ── 第 6 步：创建项目目录并拉取代码 ──────────────
PROJECT_DIR="/opt/blog"

if [ -d "$PROJECT_DIR" ]; then
    warn "项目目录 $PROJECT_DIR 已存在"
    echo "  如果要重新部署，请先删除: sudo rm -rf $PROJECT_DIR"
    echo "  或者手动进入目录执行 git pull"
    echo ""
    read -p "是否继续在已有目录上部署？(y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
    cd "$PROJECT_DIR"
    git pull || true
else
    log "请输入你的 Git 仓库地址（HTTPS 或 SSH）："
    read -p "仓库地址: " GIT_REPO
    if [ -z "$GIT_REPO" ]; then
        err "仓库地址不能为空！"
        exit 1
    fi
    sudo mkdir -p "$PROJECT_DIR"
    sudo chown $(whoami):$(whoami) "$PROJECT_DIR"
    git clone "$GIT_REPO" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

log "代码已就绪: $PROJECT_DIR"

# ── 第 7 步：安装依赖 ────────────────────────────
log "正在安装项目依赖（这可能需要几分钟）..."
cd "$PROJECT_DIR"
pnpm install
log "依赖安装完成"

# ── 第 8 步：配置环境变量 ────────────────────────
ENV_FILE="$PROJECT_DIR/packages/agent-server/.env"
if [ ! -f "$ENV_FILE" ]; then
    log "创建环境变量配置文件..."
    
    # 自动生成 JWT 密钥
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    cat > "$ENV_FILE" << EOF
# 服务端口（Nginx 会代理到这个端口，不需要直接对外开放）
PORT=3001

# OpenAI API Key（用于 AI Agent 功能）
# ⚠️ 请替换为你的真实 API Key
OPENAI_API_KEY=sk-xxxx

# 数据存储目录
DATA_DIR=./data

# JWT 密钥（已自动生成，不要泄露！）
JWT_SECRET=$JWT_SECRET
EOF

    warn "⚠️  请编辑 .env 文件，填写你的 OpenAI API Key："
    warn "    nano $ENV_FILE"
    echo ""
else
    log ".env 文件已存在，跳过创建"
fi

# ── 第 9 步：初始化数据库 ────────────────────────
log "正在初始化数据库..."
cd "$PROJECT_DIR/packages/agent-server"
npx prisma generate
npx prisma migrate deploy 2>/dev/null || npx prisma migrate dev --name init --skip-generate
log "数据库初始化完成"

# ── 第 10 步：构建项目 ───────────────────────────
log "正在构建项目..."
cd "$PROJECT_DIR"
pnpm --filter @blog/shared build 2>/dev/null || true
pnpm --filter @blog/agent-server build
log "构建完成"

# ── 第 11 步：使用 PM2 启动服务 ──────────────────
log "正在启动服务..."
cd "$PROJECT_DIR/packages/agent-server"
pm2 delete blog-server 2>/dev/null || true
pm2 start dist/index.js --name blog-server
pm2 save
pm2 startup 2>/dev/null || true
log "服务已启动！"

# ── 第 12 步：配置 Nginx ─────────────────────────
log "正在配置 Nginx 反向代理..."

NGINX_CONF="/etc/nginx/conf.d/blog-api.conf"
# 如果是 Ubuntu/Debian，也可能在 sites-available
if [ -d "/etc/nginx/sites-available" ]; then
    NGINX_CONF="/etc/nginx/sites-available/blog-api.conf"
fi

sudo tee "$NGINX_CONF" > /dev/null << 'EOF'
# 博客后端 API — Nginx 反向代理配置
server {
    listen 80;
    server_name _;  # ← 后面可以改成你的域名，比如 api.yourdomain.com

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # SSE（Server-Sent Events）需要关闭缓冲
        proxy_buffering off;
        proxy_read_timeout 300s;
    }
}
EOF

# 如果是 Ubuntu/Debian，需要软链接到 sites-enabled
if [ -d "/etc/nginx/sites-enabled" ]; then
    sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/blog-api.conf
fi

# 测试 Nginx 配置
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    log "Nginx 配置完成并已重载"
else
    err "Nginx 配置有误，请检查"
fi

# ── 完成！──────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ 部署完成！"
echo "═══════════════════════════════════════════════"
echo ""
echo "  📍 服务地址："
echo "     内部: http://127.0.0.1:3001"
echo "     外部: http://$(curl -s ifconfig.me 2>/dev/null || echo '你的服务器IP')/api/health"
echo ""
echo "  🔧 常用命令："
echo "     查看日志:    pm2 logs blog-server"
echo "     重启服务:    pm2 restart blog-server"
echo "     停止服务:    pm2 stop blog-server"
echo "     查看状态:    pm2 status"
echo ""
echo "  ⚠️  别忘了："
echo "     1. 编辑 .env 填写 OPENAI_API_KEY"
echo "        nano /opt/blog/packages/agent-server/.env"
echo "     2. 填写后重启服务"
echo "        pm2 restart blog-server"
echo ""
echo "  🔒 安全提醒："
echo "     - 不需要在防火墙开放 3001 端口"
echo "     - Nginx 通过 80 端口的 /api/ 路径转发请求"
echo "     - 如果有域名，可以配置 HTTPS（见部署文档）"
echo ""
