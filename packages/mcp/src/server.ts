import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BlogApiClientLike } from "./client.js";
import { isReadOnlyMode } from "./client.js";
import { registerRelayAgentTools } from "./tools.js";

export function createRelayAgentMcpServer(client: BlogApiClientLike): McpServer {
  const readonly = isReadOnlyMode();
  const server = new McpServer({
    name: readonly ? "relayagent-mcp-readonly" : "relayagent-mcp",
    version: "0.1.0",
  });

  registerRelayAgentTools(server, client);
  return server;
}
