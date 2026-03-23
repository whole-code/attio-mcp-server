#!/usr/bin/env node
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  type CallToolRequest,
  CallToolRequestSchema,
  type CallToolResult,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

import {
  SERVER_NAME,
  SERVER_VERSION,
  attioTokenStore,
  toolDefinitionMap,
  securitySchemes,
  executeApiTool,
} from './index.js';
import { transformToolName } from './tool-name-transformer.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

interface SessionEntry {
  transport: StreamableHTTPServerTransport;
  server: Server;
  attioToken: string;
}

const sessions = new Map<string, SessionEntry>();

function createAttioServer(attioToken: string): Server {
  const mcpServer = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
  );

  const humanToOriginal = new Map<string, string>();
  for (const [originalName] of toolDefinitionMap.entries()) {
    const transformation = transformToolName(originalName);
    humanToOriginal.set(transformation.humanReadableName, originalName);
  }

  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    const toolsForClient: Tool[] = Array.from(toolDefinitionMap.values()).map((def) => {
      const transformation = transformToolName(def.name);
      return {
        name: transformation.humanReadableName,
        description: `[${transformation.category}] ${def.description}`,
        inputSchema: def.inputSchema,
      };
    });

    toolsForClient.sort((a, b) => {
      const categoryA = a.description?.match(/^\[([^\]]+)\]/)?.[1] || 'Other';
      const categoryB = b.description?.match(/^\[([^\]]+)\]/)?.[1] || 'Other';
      if (categoryA !== categoryB) return categoryA.localeCompare(categoryB);

      const methodOrder = ['list', 'get', 'create', 'update', 'delete', 'query'];
      const orderA = methodOrder.indexOf(a.name.split('_')[0]);
      const orderB = methodOrder.indexOf(b.name.split('_')[0]);
      if (orderA !== -1 && orderB !== -1 && orderA !== orderB) return orderA - orderB;
      if (orderA !== -1 && orderB === -1) return -1;
      if (orderA === -1 && orderB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    return { tools: toolsForClient };
  });

  mcpServer.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest): Promise<CallToolResult> => {
      const { name: toolName, arguments: toolArgs } = request.params;
      const originalName = humanToOriginal.get(toolName) || toolName;
      const definition = toolDefinitionMap.get(originalName);
      if (!definition) {
        return { content: [{ type: 'text', text: `Error: Unknown tool: ${toolName}` }] };
      }
      return attioTokenStore.run(attioToken, () =>
        executeApiTool(originalName, definition, toolArgs ?? {}, securitySchemes)
      );
    }
  );

  return mcpServer;
}

function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : undefined);
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function extractAttioToken(req: IncomingMessage): string | undefined {
  const header = req.headers['x-attio-token'];
  if (header) return Array.isArray(header) ? header[0] : header;

  const auth = req.headers['authorization'];
  if (auth?.startsWith('Bearer ')) return auth.slice(7);

  // Check URL query parameter
  if (req.url) {
    const url = new URL(req.url, 'http://localhost');
    const tokenParam = url.searchParams.get('x-attio-token') || url.searchParams.get('attio_token');
    if (tokenParam) return tokenParam;
  }

  return undefined;
}

function setCorsHeaders(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-attio-token, Authorization, mcp-session-id');
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');
}

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const httpServer = createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const pathname = new URL(req.url || '/', 'http://localhost').pathname;

  if (pathname === '/health') {
    sendJson(res, 200, { status: 'ok', server: SERVER_NAME, version: SERVER_VERSION });
    return;
  }

  if (pathname !== '/mcp' && pathname !== '/') {
    sendJson(res, 404, { error: 'Not found. MCP endpoint is at / or /mcp' });
    return;
  }

  try {
    if (req.method === 'POST') {
      const body = await parseBody(req);
      const sessionId = req.headers['mcp-session-id'] as string | undefined;

      if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
        await session.transport.handleRequest(req, res, body);
        return;
      }

      if (!sessionId && isInitializeRequest(body)) {
        const attioToken = extractAttioToken(req);
        if (!attioToken) {
          sendJson(res, 401, {
            jsonrpc: '2.0',
            error: {
              code: -32001,
              message: 'Missing Attio API key. Provide via x-attio-token header, Authorization: Bearer <token>, or ?attio_token=<token> query parameter',
            },
            id: null,
          });
          return;
        }

        const mcpServer = createAttioServer(attioToken);
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sid) => {
            sessions.set(sid, { transport, server: mcpServer, attioToken });
            console.error(`Session ${sid} initialized`);
          },
        });

        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && sessions.has(sid)) {
            sessions.delete(sid);
            console.error(`Session ${sid} closed`);
          }
        };

        await mcpServer.connect(transport);
        await transport.handleRequest(req, res, body);
        return;
      }

      sendJson(res, 400, {
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Bad Request: No valid session ID provided' },
        id: null,
      });
    } else if (req.method === 'GET') {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      if (!sessionId || !sessions.has(sessionId)) {
        sendJson(res, 400, { error: 'Invalid or missing session ID' });
        return;
      }
      const session = sessions.get(sessionId)!;
      await session.transport.handleRequest(req, res);
    } else if (req.method === 'DELETE') {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      if (!sessionId || !sessions.has(sessionId)) {
        sendJson(res, 400, { error: 'Invalid or missing session ID' });
        return;
      }
      const session = sessions.get(sessionId)!;
      await session.transport.handleRequest(req, res);
    } else {
      res.writeHead(405);
      res.end('Method not allowed');
    }
  } catch (error) {
    console.error('Error handling request:', error);
    if (!res.headersSent) {
      sendJson(res, 500, {
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
});

httpServer.listen(PORT, () => {
  console.error(`${SERVER_NAME} HTTP MCP Server (v${SERVER_VERSION}) listening on port ${PORT}`);
  console.error(`MCP endpoint: http://localhost:${PORT}/mcp`);
  console.error(`Health check: http://localhost:${PORT}/health`);
});

async function shutdown() {
  console.error('Shutting down HTTP MCP server...');
  for (const [sid, session] of sessions.entries()) {
    try {
      await session.transport.close();
      sessions.delete(sid);
    } catch (error) {
      console.error(`Error closing session ${sid}:`, error);
    }
  }
  httpServer.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
