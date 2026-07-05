/**
 * 🚀 服务入口文件
 */
import { serve } from "@hono/node-server";

import { app } from "./app.js";
import { config } from "./config.js";
import { initWeComBot } from "./services/im-service.js";

const port = config.port;

console.log(`🚀 Agent server starting on http://localhost:${port}`);

serve(
  { fetch: app.fetch, hostname: "0.0.0.0", port },
  (info) => {
    console.log(`✅ Agent server running on http://0.0.0.0:${info.port}`);
    void initWeComBot();
  }
);
