# ThoughtBox Installation Guide for AI Assistants

## Prerequisites

- Node.js 22+ must be installed on the system

## Installation Method

This server runs via npx (no global installation required).

## Configuration by Client

### For Cline (VS Code Extension)

Add to `cline_mcp_settings.json` (access via MCP Servers icon → Configure → Configure MCP Servers):

```json
{
  "mcpServers": {
    "thoughtbox": {
      "command": "npx",
      "args": ["-y", "@kastalien-research/thoughtbox"]
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
      "command": "npx",
      "args": ["-y", "@kastalien-research/thoughtbox"]
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
      "command": "npx",
      "args": ["-y", "@kastalien-research/thoughtbox"]
    }
  }
}
```

## Verification

After configuration, restart the MCP client. The following tools should be available:

- `thoughtbox` - Step-by-step reasoning with branching and revision
- `notebook` - Literate programming with JS/TS execution
- `mental_models` - 15 structured reasoning frameworks

## Troubleshooting

- If server fails to start, verify Node.js 22+ is installed: `node --version`
- The `-y` flag is required for non-interactive npx execution
- Restart the MCP client after configuration changes
