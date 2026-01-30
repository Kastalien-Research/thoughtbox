# Project Rules

## Active Specifications

**Location**: `.specs/` directory (NOT `specs/`)
**Tracking**: `dgm-specs/implementation-status.json`

Before asking about spec locations:
1. Read `.specs/README.md` for structure
2. Check `dgm-specs/implementation-status.json` for implementation status
3. Query Thoughtbox for prior sessions: `list_sessions(tags=["spec-validation"])`

The `specs/` directory in project root is **outdated** (3 draft specs from Jan 17).

## After Implementing Any SIL Spec

Update `dgm-specs/implementation-status.json`:
- Set status to "implemented"
- Add implementationFiles array
- Update summary counts
- Update lastUpdated

Verify: `cat dgm-specs/implementation-status.json | jq '.summary'`

## After Docker Rebuild

MCP tools will fail with "Server not initialized". Ask user: "Please run `/mcp` to reconnect."

## Thoughtbox Branching

`branchId` requires `branchFromThought`. Server enforces this - you'll get an error if you try to use branchId alone.

## Commits

Use conventional commits: `feat:`, `fix:`, `chore:`, etc.
