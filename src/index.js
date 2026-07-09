#!/usr/bin/env node
// init-book-mcp · MCP stdio server wrapping init-book-sdk · MIT · AI-Native Solutions
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server({ name: 'init-book-mcp', version: '1.0.0' }, { capabilities: { tools: {} } });

const TOOLS = [
  {
    name: 'init-book_open_d_b',
    description: 'openDB · from init-book-sdk',
    inputSchema: { type: 'object', properties: {} },
    handler: async (args) => {
      const { openDB } = await import('@ai-native-solutions/init-book-sdk');
      return typeof openDB === 'function' ? await openDB(args) : { error: 'openDB not callable' };
    }
  },
  {
    name: 'init-book_put',
    description: 'put · from init-book-sdk',
    inputSchema: { type: 'object', properties: {} },
    handler: async (args) => {
      const { put } = await import('@ai-native-solutions/init-book-sdk');
      return typeof put === 'function' ? await put(args) : { error: 'put not callable' };
    }
  },
  {
    name: 'init-book_get',
    description: 'get · from init-book-sdk',
    inputSchema: { type: 'object', properties: {} },
    handler: async (args) => {
      const { get } = await import('@ai-native-solutions/init-book-sdk');
      return typeof get === 'function' ? await get(args) : { error: 'get not callable' };
    }
  },
  {
    name: 'init-book_get_all',
    description: 'getAll · from init-book-sdk',
    inputSchema: { type: 'object', properties: {} },
    handler: async (args) => {
      const { getAll } = await import('@ai-native-solutions/init-book-sdk');
      return typeof getAll === 'function' ? await getAll(args) : { error: 'getAll not callable' };
    }
  },
  {
    name: 'init-book_clear_all',
    description: 'clearAll · from init-book-sdk',
    inputSchema: { type: 'object', properties: {} },
    handler: async (args) => {
      const { clearAll } = await import('@ai-native-solutions/init-book-sdk');
      return typeof clearAll === 'function' ? await clearAll(args) : { error: 'clearAll not callable' };
    }
  },
  {
    name: 'init-book_goto',
    description: 'goto · from init-book-sdk',
    inputSchema: { type: 'object', properties: {} },
    handler: async (args) => {
      const { goto } = await import('@ai-native-solutions/init-book-sdk');
      return typeof goto === 'function' ? await goto(args) : { error: 'goto not callable' };
    }
  }
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map(({ handler, ...rest }) => rest)
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const t = TOOLS.find(x => x.name === req.params.name);
  if (!t) throw new Error('unknown tool: ' + req.params.name);
  const result = await t.handler(req.params.arguments || {});
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

await server.connect(new StdioServerTransport());
console.error('init-book-mcp v1.0.0 · stdio ready');
