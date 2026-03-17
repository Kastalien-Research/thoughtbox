# ThoughtBox Installation Guide for AI Assistants

## Prerequisites

- Node.js 22+ must be installed on the system

## Installation Method

This server runs from a local source checkout.

Clone and build the repository first:

```bash
git clone https://github.com/Kastalien-Research/thoughtbox.git
cd thoughtbox
pnpm install
pnpm build
```

## Configuration by Client

### For Cline (VS Code Extension)

Add to `cline_mcp_settings.json` (access via MCP Servers icon → Configure → Configure MCP Servers):

```json
{
  "mcpServers": {
    "thoughtbox": {
      "command": "node",
      "args": ["/absolute/path/to/thoughtbox/dist/index.js"]
    }
  }
}
```

### For Claude Desktop

Add to `claude_desktop_config.json`:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "thoughtbox": {
      "command": "node",
      "args": ["/absolute/path/to/thoughtbox/dist/index.js"]
    }
  }
}
```

### For VS Code (GitHub Copilot)

Add to `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "thoughtbox": {
      "command": "node",
      "args": ["/absolute/path/to/thoughtbox/dist/index.js"]
    }
  }
}
```

## Deployed Mode (Optional)

For cloud deployment with Supabase-backed storage and authentication, set these environment variables in your MCP client config:

```json
{
  "mcpServers": {
    "thoughtbox": {
      "url": "https://your-deployed-thoughtbox.example.com/mcp",
      "headers": {
        "Authorization": "Bearer <your-supabase-jwt>"
      }
    }
  }
}
```

In deployed mode, all requests require a valid Supabase JWT token. The token can be provided via `Authorization: Bearer <token>` header or `?token=<token>` query parameter.

## Verification

After configuration, restart the MCP client. The following tools should be available:

- `thoughtbox_gateway` - Core reasoning with branching, revision, knowledge graph, and session management
- `thoughtbox_operations` - Discover available operations and their schemas
- `observability_gateway` - System monitoring and health checks
- `thoughtbox_hub` - Multi-agent collaboration (workspaces, problems, proposals)

## Troubleshooting

- If server fails to start, verify Node.js 22+ is installed: `node --version`
- Verify the `dist/index.js` path points to your local Thoughtbox checkout
- Restart the MCP client after configuration changes
