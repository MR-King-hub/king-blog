/**
 * RelayAgent MCP — stdio（本地 Cursor 子进程模式）
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createBlogApiClientFromEnv, isReadOnlyMode } from "./client.js";
import { loadMcpEnv } from "./env.js";
import { createRelayAgentMcpServer } from "./server.js";

loadMcpEnv();

async function main() {
  const readonly = isReadOnlyMode();
  const client = createBlogApiClientFromEnv();
  const server = createRelayAgentMcpServer(client);
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error(
    `relayagent-mcp server running (stdio${readonly ? ", readonly" : ""})`,
  );
}

main().catch((error) => {
  console.error("relayagent-mcp failed to start:", error);
  process.exit(1);
});
