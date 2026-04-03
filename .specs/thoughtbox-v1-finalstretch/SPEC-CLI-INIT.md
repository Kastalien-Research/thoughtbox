# SPEC-CLI-INIT: The `thoughtbox init` Command

## Status: DRAFT

## Summary

A single CLI command — `npx thoughtbox init --key tbx_xxx` — that sets up a TypeScript project for Thoughtbox observation in one step. It parses the project structure, uploads the module graph to the Thoughtbox knowledge graph, and writes the `post_tool_use` hook configuration to `.claude/settings.json`. After running this command, the user's agent is observed automatically with zero further setup.

## Requirements

1. The command accepts one required argument: `--key <api_key>` (the user's Thoughtbox API key, obtained from the web app after creating a workspace).
2. On invocation, the CLI: (a) validates the API key against the Thoughtbox server (`GET /health` with auth header), (b) parses the TypeScript project in the current directory (per SPEC-PROJECT-MODEL), (c) uploads the module graph to the knowledge graph via the Thoughtbox API, (d) writes the hook configuration to `.claude/settings.json`.
3. The hook configuration written to `.claude/settings.json` adds a `post_tool_use` entry that runs the Thoughtbox hook script with the API key and server URL as environment variables. The hook script is bundled with the npm package.
4. If `.claude/settings.json` already exists, the CLI merges the new hook entry without overwriting existing hooks. If a Thoughtbox hook already exists, it is updated in place.
5. The CLI prints a summary: number of modules found, number of dependency edges, confirmation that the hook is configured, and a test command to verify (`claude "read package.json"` — should produce one event in the dashboard).
6. The CLI is distributed as an npm package (`thoughtbox`) so it can be run via `npx` without global installation.
7. The CLI stores the API key in `.claude/settings.json` hook environment config only — never in a separate dotfile, never in `package.json`, never committed to git. The `.claude/` directory should already be in `.gitignore`; the CLI warns if it is not.

## Acceptance Criteria

- [ ] `npx thoughtbox init --key tbx_xxx` completes successfully on a TypeScript project with tsconfig.json
- [ ] After running, `.claude/settings.json` contains a post_tool_use hook entry pointing to the bundled hook script
- [ ] The hook script is executable and sends a test event to the Thoughtbox server
- [ ] Module graph entities appear in the knowledge graph for the authenticated workspace
- [ ] Running `init` a second time updates rather than duplicates the module graph and hook config
- [ ] CLI warns if `.claude/` is not in `.gitignore` (to prevent API key leakage)
- [ ] CLI fails with a clear error if no `tsconfig.json` is found in the current directory
- [ ] CLI fails with a clear error if the API key is invalid

## Dependencies

- SPEC-PROJECT-MODEL for the TypeScript parser
- SPEC-HOOK-CAPTURE for the hook script that gets configured
- Thoughtbox API key validation endpoint (exists via auth pipeline)
- npm package infrastructure for distribution

## Open Questions

- Should `init` also configure the MCP server connection in `.claude/settings.json` (for reasoning tools), or is that a separate opt-in step?
- What happens for non-TypeScript projects? Should `init` still write the hook (for raw tool event capture) and skip the project model upload?
- Should the API key be stored as an environment variable reference (`$THOUGHTBOX_API_KEY`) rather than a literal value in settings.json?
