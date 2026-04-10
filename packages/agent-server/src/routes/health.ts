/**
 * ❤️ 健康检查路由
 *
 * 什么是健康检查？
 *   一个最简单的接口，用来判断"服务还活着吗？"
 *
 * 谁会调用它？
 *   - 负载均衡器（Nginx、云服务）定期检查服务是否正常
 *   - 监控系统（Prometheus、Grafana）采集服务状态
 *   - 你自己 Debug 时快速验证服务是否启动成功
 *
 * 通常不需要鉴权，因为它不返回任何敏感数据
 */

import { Hono } from "hono";
import type { AppEnv } from "../types.js";

export const healthRoutes = new Hono<AppEnv>();

// GET /api/health
healthRoutes.get("/", (c) => {
  return c.json({
    success: true,
    data: {
      status: "ok",                        // 服务状态
      timestamp: new Date().toISOString(), // 当前时间
      version: "0.1.0",                   // 服务版本号
    },
  });
});
