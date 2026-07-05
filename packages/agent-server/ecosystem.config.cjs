/**
 * PM2 进程管理配置
 *
 * PM2 是什么？
 *   一个 Node.js 进程管理工具，帮你：
 *   - 保持服务一直运行（崩溃了自动重启）
 *   - 开机自动启动
 *   - 查看日志和监控
 *
 * 使用方式：
 *   启动:   pm2 start ecosystem.config.cjs
 *   停止:   pm2 stop blog-server
 *   重启:   pm2 restart blog-server
 *   日志:   pm2 logs blog-server
 *   监控:   pm2 monit
 */
module.exports = {
  apps: [
    {
      name: "blog-server",          // 进程名称
      script: "dist/index.js",      // 入口文件（构建后的）
      cwd: "/opt/blog-server", // 工作目录
      
      // 环境变量
      env: {
        NODE_ENV: "production",
      },

      // 日志配置
      error_file: "/opt/blog-server/logs/error.log",
      out_file: "/opt/blog-server/logs/output.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      
      // 自动重启配置
      max_restarts: 10,             // 最多重启 10 次
      min_uptime: 5000,             // 启动后至少运行 5 秒才算正常
      restart_delay: 3000,          // 重启间隔 3 秒
      
      // 监听文件变化自动重启（生产环境关闭）
      watch: false,
      
      // 内存超过 500MB 自动重启（防止内存泄漏）
      max_memory_restart: "500M",
    },
  ],
};
