import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadMcpEnv(): void {
  loadEnv({ path: resolve(__dirname, "../../agent-server/.env") });
  loadEnv({ path: resolve(__dirname, "../.env") });
}
