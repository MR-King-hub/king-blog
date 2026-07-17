/**
 * RelayAgent MCP — Streamable HTTP（部署到服务器，供 Cursor 等远程连接）
 */

import { randomUUID } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  createBlogApiClientFromEnv,
  isReadOnlyMode,
} from "./client.js";
import { loadMcpEnv } from "./env.js";
import { createRelayAgentMcpServer } from "./server.js";

loadMcpEnv();

const PORT = Number(process.env.MCP_PORT ?? 3002);
const MCP_PATH = "/mcp";

type Session = {
  server: ReturnType<typeof createRelayAgentMcpServer>;
  transport: StreamableHTTPServerTransport;
};

const sessions = new Map<string, Session>();

function isInitializeRequest(body: unknown): boolean {
  return (
    typeof body === "object" &&
    body !== null &&
    "method" in body &&
    (body as { method: string }).method === "initialize"
  );
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) {
    return undefined;
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function jsonRpcError(
  res: ServerResponse,
  status: number,
  message: string,
): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message },
      id: null,
    }),
  );
}

async function handleMcp(
  req: IncomingMessage,
  res: ServerResponse,
  body?: unknown,
): Promise<void> {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport | undefined;

  if (sessionId && sessions.has(sessionId)) {
    transport = sessions.get(sessionId)!.transport;
  } else if (!sessionId && isInitializeRequest(body)) {
    const client = createBlogApiClientFromEnv();
    const server = createRelayAgentMcpServer(client);
    const session: Session = {
      server,
      transport: undefined as unknown as StreamableHTTPServerTransport,
    };

    const newTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true,
      onsessioninitialized: (id) => {
        sessions.set(id, session);
      },
    });
    session.transport = newTransport;

    newTransport.onclose = () => {
      const id = newTransport.sessionId;
      if (id) {
        sessions.delete(id);
      }
    };

    await server.connect(newTransport);
    await newTransport.handleRequest(req, res, body);
    return;
  } else {
    jsonRpcError(res, 400, "Bad Request: missing or invalid MCP session");
    return;
  }

  await transport.handleRequest(req, res, body);
}

const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, readonly: isReadOnlyMode() }));
    return;
  }

  if (url.pathname !== MCP_PATH) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  try {
    const body =
      req.method === "POST" || req.method === "DELETE"
        ? await readJsonBody(req)
        : undefined;
    await handleMcp(req, res, body);
  } catch (error) {
    console.error("MCP request failed:", error);
    if (!res.headersSent) {
      jsonRpcError(res, 500, "Internal server error");
    }
  }
});

httpServer.listen(PORT, () => {
  console.log(
    `relayagent-mcp HTTP listening on :${PORT}${MCP_PATH} (readonly=${isReadOnlyMode()})`,
  );
});
