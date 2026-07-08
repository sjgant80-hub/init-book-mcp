# @ai-native-solutions/init-book-mcp

Model Context Protocol server for **INIT — the framework book**. Exposes the 9-chapter reader, progress tracker, and diagram generators as MCP tools + resources any Claude Code / Claude Desktop / MCP-aware client can call.

## Install

```bash
npm install -g @ai-native-solutions/init-book-mcp
```

Then wire it into your MCP client:

```json
{
  "mcpServers": {
    "init-book": {
      "command": "init-book-mcp"
    }
  }
}
```

## Tools

| tool | args | returns |
| --- | --- | --- |
| `initbook_get_chapter` | `{ index: 1..9 }` | `{ title, content, callout, next, prev, ... }` |
| `initbook_progress` | `{ chapter, position? }` | `{ saved, chapter, position, read, total, percent }` |
| `initbook_toc` | `{}` | `{ chapters: [...], read, total, percent }` |
| `initbook_diagram` | `{ name, bloom?, label? }` | `{ name, svg }` |

Valid diagram names: `bloom-spine`, `torus`, `bloom-radial`, `kappa-gradient`, `twin-primes`, `mesh-graph`.

## Resources

- `init-book://chapters` — full 9-chapter TOC (JSON)
- `init-book://diagrams` — list of diagram names + samples

## Persistence

Reading progress lives in `~/.init-book-mcp/progress.json`. Delete the file to reset.

## The nine chapters

1. The Beginning · what this is
2. The Seven Primes · Konomi spine
3. The Nine Axes · adding θ and ◊
4. Your Profile · finding your bloom
5. The Silent Witness · five stages
6. Origami Mathematics · 紙·折·言
7. The Mesh · you are not alone
8. The Six Operations · the assembly language
9. Next Steps · the estate

## Companion packages

- **init-book-sdk** — the JS engine (chapters + progress + diagrams)
- **init-book-api** — HTTP proxy for the same

## License

MIT · © 2026 AI-Native Solutions
