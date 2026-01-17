# Contributing to Thoughtbox

Thank you for your interest in contributing to Thoughtbox! This guide covers our development workflow, commit conventions, and testing approach.

## Client Compatibility Note

Thoughtbox is currently optimized for use with **Claude Code**. The MCP ecosystem includes many clients with varying levels of support for protocol capabilities — server features (prompts, resources, tools), client features (roots, sampling, elicitation), and behaviors like `listChanged` notifications. We're actively working on broader client compatibility, but this requires custom adaptations for different clients.

**Areas where we especially welcome contributions:**
- Client-specific adapters or compatibility layers
- Documentation of client behavior differences
- Bug reports from non-Claude Code clients (please include client name and version)
- Testing across different MCP clients

If you're interested in helping with client compatibility, see the `gateway/` directory for an example of how we handle clients that don't respond to `notifications/tools/list_changed` mid-turn.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/Kastalien-Research/thoughtbox.git
cd thoughtbox

# Install dependencies
npm install

# Build the project
npm run build

# Development with hot reload
npm run dev
```

## Commit Conventions

We use structured commit messages optimized for code comprehension tools like `thick_read`. Good commit history is documentation.

### Format

```
<type>(<scope>): <subject>

<body - explain WHY, not just what>

<footer - references, co-authors>
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `fix(security)` | Security-related fix |
| `refactor` | Code restructuring without behavior change |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `chore` | Build, tooling, dependency updates |

### Scope (Optional)

The component or area being changed: `thoughtbox`, `notebook`, `observatory`, `mental-models`, `thick-read`, `persistence`, etc.

### Writing Good Commit Bodies

The commit body should explain **WHY** the change was made. Think of future readers using `thick_read` or `git blame` who need to understand the reasoning behind the code.

**Good:**
```
fix(security): prevent shell injection in git commands

The previous implementation used exec() with template strings,
allowing filenames containing shell metacharacters to execute
arbitrary commands. Changed to execFile() with argument arrays
which passes arguments directly without shell interpretation.

Addresses reviewer feedback from security audit.
```

**Bad:**
```
fix: update thick-read.ts

Changed exec to execFile in git commands.
```

### Ticket References

Include references to issues, PRs, or external tickets:

```
Fixes #123
Addresses review feedback from #456
Related to PROJ-789
```

### Co-Authored-By

When collaborating with AI tools or pair programming:

```
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## Testing

### Agentic Tests

We use the Claude Agent SDK for behavioral testing. These tests spawn fresh agents with MCP client connections to verify tool behavior semantically.

```bash
# Run all behavioral tests
npm test

# Test a specific tool
npm run test:tool -- thick_read

# Quick test (skip rebuild)
npm run test:quick -- thoughtbox
```

### Test Structure

Tests are defined in `scripts/agentic-test.ts` using natural language specifications:

```typescript
const TOOL_TESTS: Record<string, string> = {
  thick_read: `
    Behavioral tests for thick_read tool:
    1. Basic file reading - read a known file, verify content returned
    2. Git context - read a tracked file, verify recentCommits populated
    3. Depth levels - test shallow, standard, deep modes
    ...
  `,
};
```

### Writing New Tests

1. Add test specifications to `TOOL_TESTS` in `scripts/agentic-test.ts`
2. Focus on behavioral outcomes, not implementation details
3. Let the agent determine pass/fail semantically

## Pull Request Process

1. **Branch from main**: Create a feature branch with a descriptive name
   - `feat/thick-read` - new feature
   - `fix/shell-injection` - bug fix
   - `refactor/storage-layer` - refactoring

2. **Make focused commits**: Each commit should be atomic and self-explanatory

3. **Run tests**: Ensure `npm test` passes before pushing

4. **Create PR with context**: Include:
   - Summary of changes
   - Why the change is needed
   - Test plan or verification steps

5. **Address review feedback**: Commit fixes separately (don't squash), so reviewers can see what changed

## Architecture Overview

```
src/
├── index.ts              # Entry point (stdio/HTTP transport selection)
├── server-factory.ts     # MCP server factory with tool registration
├── tool-registry.ts      # Progressive disclosure (stage-based tool enabling)
├── tool-descriptions.ts  # Stage-specific tool descriptions
├── thought-handler.ts    # Thoughtbox tool logic with critique support
├── gateway/              # Always-on routing tool for streaming HTTP clients
│   ├── gateway-handler.ts  # Routes to handlers with stage enforcement
│   └── index.ts          # Module exports
├── init/                 # Init workflow and state management
│   ├── tool-handler.ts   # Init tool operations
│   └── state-manager.ts  # Session state persistence
├── sessions/             # Session tool handler
├── persistence/          # Storage layer
├── observatory/          # Real-time visualization UI
├── mental-models/        # 15 reasoning frameworks
├── notebook/             # Literate programming engine
└── resources/            # Documentation and patterns
```

Key principles:
- **Tools are stateless handlers** that receive input and return results
- **State lives in persistence layer** with session isolation
- **Observatory is event-driven** via WebSocket for real-time updates
- **Progressive disclosure** stages tools based on workflow progress
- **Gateway pattern** provides always-on routing for clients that don't refresh tool lists

## Code Style

- TypeScript with strict mode
- ES modules (`.js` extensions in imports)
- Zod for schema validation (v4 syntax)
- No external runtime dependencies beyond Node.js built-ins and MCP SDK

## Questions?

Open an issue or discussion on GitHub. We're happy to help!
