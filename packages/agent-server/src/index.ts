/**
 * 🚀 服务入口文件
 */
import { serve } from "@hono/node-server";

import { app } from "./app.js";
import { config } from "./config.js";
import { initWeComBot } from "./services/im-service.js";
import { initTelemetry, shutdownTelemetry } from "./telemetry/index.js";

const port = config.port;

async function main() {
  await initTelemetry();

  console.log(`🚀 Agent server starting on http://localhost:${port}`);

  serve(
    { fetch: app.fetch, hostname: "0.0.0.0", port },
    (info) => {
      console.log(`✅ Agent server running on http://0.0.0.0:${info.port}`);
      void initWeComBot();
    }
  );

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down…`);
    await shutdownTelemetry();
    process.exit(0);
  };
  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch(async (err) => {
  console.error("Failed to start agent server:", err);
  await shutdownTelemetry();
  process.exit(1);
});
