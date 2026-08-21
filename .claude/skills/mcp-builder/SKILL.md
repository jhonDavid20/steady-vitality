---
name: mcp-builder
description: Scaffold and implement an MCP (Model Context Protocol) server — tools, resources, and schemas. Use when building or extending an MCP server.
---

# mcp-builder

Guidance for building an MCP server (TypeScript SDK `@modelcontextprotocol/sdk`).

## Structure
- One server exposing **tools** (actions), **resources** (readable data), and optionally **prompts**.
- Each tool: a name, a clear description (this is what the model reads to decide when to call it),
  and a typed input schema (Zod / JSON Schema).

## Best practices
- **Descriptions are the API**: write tool/param descriptions for the model — say when to use it and what it returns.
- Validate all inputs; return structured, minimal outputs; paginate large results.
- Make actions idempotent where possible; never do destructive ops without an explicit flag.
- Return errors as typed results, not thrown exceptions the host can't read.
- Keep secrets in env; never echo them in tool output. Add tools rather than breaking existing ones.

## Deliver
- A runnable server, a README listing tools/resources with examples, and a host config snippet.

> Recreated from the skill name — paste your original `mcp-builder` to override.
