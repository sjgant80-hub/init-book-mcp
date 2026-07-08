#!/usr/bin/env node
// init-book-mcp · Model Context Protocol server for INIT · the framework book
// Tools:
//   initbook_get_chapter { index }       → { title, content, next, prev, callout, blurb }
//   initbook_progress    { chapter, position? } → { saved }
//   initbook_toc                         → { chapters }
//   initbook_diagram     { name, bloom?, label? } → { svg }
// Resources:
//   init-book://chapters   — full TOC
//   init-book://diagrams   — list of diagram names

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import {
  tableOfContents,
  getChapter,
  diagram,
  DIAGRAM_NAMES,
  CHAPTERS
} from '@ai-native-solutions/init-book-sdk';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';

// ---------------------------------------------------------------------------
// Simple JSON progress persistence (Node runtime; no IDB here).
// ---------------------------------------------------------------------------

const STATE_DIR = join(homedir(), '.init-book-mcp');
const STATE_FILE = join(STATE_DIR, 'progress.json');

async function loadState() {
  try {
    const raw = await readFile(STATE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { read: {}, positions: {} };
  }
}

async function saveState(state) {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = new Server(
  { name: 'init-book-mcp', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } }
);

const TOOLS = [
  {
    name: 'initbook_get_chapter',
    description: 'Fetch a chapter of INIT (1-9) by index. Returns title, HTML content, callout, prev/next indices.',
    inputSchema: {
      type: 'object',
      properties: { index: { type: 'number', minimum: 1, maximum: 9 } },
      required: ['index']
    }
  },
  {
    name: 'initbook_progress',
    description: 'Mark a chapter as read (and optionally save a scroll/word position). Persists to ~/.init-book-mcp/progress.json.',
    inputSchema: {
      type: 'object',
      properties: {
        chapter: { type: 'number', minimum: 1, maximum: 9 },
        position: { type: 'number', description: 'optional scroll or word offset' }
      },
      required: ['chapter']
    }
  },
  {
    name: 'initbook_toc',
    description: 'Return the full 9-chapter table of contents plus a progress summary.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'initbook_diagram',
    description: `Return an inline SVG for one of: ${DIAGRAM_NAMES.join(', ')}. bloom-radial accepts optional bloom (7 numbers) + label.`,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', enum: DIAGRAM_NAMES },
        bloom: { type: 'array', items: { type: 'number' }, minItems: 7, maxItems: 7 },
        label: { type: 'string' }
      },
      required: ['name']
    }
  }
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;

  if (name === 'initbook_get_chapter') {
    const c = getChapter(args.index);
    if (!c) throw new Error(`Chapter ${args.index} not found (must be 1..9)`);
    return { content: [{ type: 'text', text: JSON.stringify(c, null, 2) }] };
  }

  if (name === 'initbook_progress') {
    const state = await loadState();
    state.read[args.chapter] = true;
    if (typeof args.position === 'number') state.positions[args.chapter] = args.position;
    await saveState(state);
    const read = Object.keys(state.read).length;
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ saved: true, chapter: args.chapter, position: args.position ?? null, read, total: 9, percent: (read / 9) * 100 }, null, 2)
      }]
    };
  }

  if (name === 'initbook_toc') {
    const state = await loadState();
    const chapters = tableOfContents().map(c => ({ ...c, read: !!state.read[c.index] }));
    const read = chapters.filter(c => c.read).length;
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ chapters, read, total: 9, percent: (read / 9) * 100 }, null, 2)
      }]
    };
  }

  if (name === 'initbook_diagram') {
    const svg = diagram(args.name, { bloom: args.bloom, label: args.label });
    if (!svg) throw new Error(`Unknown diagram "${args.name}". Valid: ${DIAGRAM_NAMES.join(', ')}`);
    return { content: [{ type: 'text', text: JSON.stringify({ name: args.name, svg }, null, 2) }] };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

const RESOURCES = [
  {
    uri: 'init-book://chapters',
    name: 'INIT · full table of contents',
    description: 'All 9 chapters (index, id, title, blurb).',
    mimeType: 'application/json'
  },
  {
    uri: 'init-book://diagrams',
    name: 'INIT · available diagrams',
    description: 'List of diagram names + a description each.',
    mimeType: 'application/json'
  }
];

server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: RESOURCES }));

server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
  const { uri } = req.params;
  if (uri === 'init-book://chapters') {
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(CHAPTERS, null, 2) }] };
  }
  if (uri === 'init-book://diagrams') {
    const items = DIAGRAM_NAMES.map(name => ({ name, sample: diagram(name).slice(0, 120) + '…' }));
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(items, null, 2) }] };
  }
  throw new Error(`Unknown resource: ${uri}`);
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('◊ init-book-mcp · v1.0.0 · ready on stdio');
