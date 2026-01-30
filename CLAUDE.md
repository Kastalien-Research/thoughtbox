# Claude Code Instructions

@AGENTS.md

---

## CRITICAL: Always Verify

**NEVER say "probably", "maybe", "might be", "could be", or other conditional hedging.**

Before making ANY claim about:
- Whether a file exists
- Whether code is present
- Whether a feature works
- Whether something was done

You MUST verify it first using the appropriate tool (Read, Glob, Grep, Bash, etc.).

**Do NOT:**
- Assume something exists without checking
- Claim something works without testing
- Say "it should be there" without reading the file
- Trust previous agents' claims without verification

**DO:**
- Read files before claiming they contain something
- Run tests before claiming they pass
- Check directory contents before claiming files exist
- Verify configurations before claiming they're correct

## CRITICAL: Testing MCP Servers

**When testing ANY MCP server functionality, ALWAYS call the MCP server directly.**

**DO:**
- Use the MCP tools directly (e.g., `thoughtbox_gateway`, `observability_gateway`)
- Call the actual server operations to verify behavior
- Test with real tool invocations, not simulated code

**DO NOT:**
- Create test runner files or wrapper scripts
- Build elaborate test infrastructures
- Simulate or mock MCP responses
- Write TypeScript files that "call" the MCP tools
- **NEVER use curl to call MCP servers** - always use the MCP tools directly

**Example of correct approach:**
```
Test: Verify gateway returns stage
Action: Call thoughtbox_gateway({ operation: "get_state" })
Verify: Check response.stage is defined
```

**Why:** The MCP server IS the functionality. Testing it means calling it directly, not building layers on top of it. You have direct access to MCP tools - use them.

## MCP Documentation

**BEFORE making claims about MCP, read the actual docs:** `ai_docs/mcp-docs/`

**The 6 MCP primitives are:**
1. **Tools** - Functions the server exposes for agents to call
2. **Resources** - Data/documents the server provides (static or templated URIs)
3. **Prompts** - Templates for user interactions with argument substitution
4. **Sampling** - Server requests client to make AI completions
5. **Roots** - File system roots the server can access/operate on
6. **Elicitation** - Server requests information/clarification from user

**Thoughtbox Implementation:**
- **Tools**: ✅ `thoughtbox_gateway` (all operations), `observability_gateway`
- **Resources**: ✅ 26 resources (cipher, docs, mental-models, loops, etc.)
- **Prompts**: ✅ Prompt templates defined in server
- **Sampling**: ✅ Used by ThoughtHandler (requestCritique, RLM execution)
- **Roots**: ✅ `list_roots`, `bind_root` operations in gateway
- **Elicitation**: Check if implemented (server asking user for input during ops)

**Testing Notes:**
- **Tools, Resources, Roots**: Tested via direct calls/reads ✅
- **Prompts**: Must be tested via user invocation (agents can't call prompts/get)
- **Sampling, Elicitation**: Require client support, tested through production use

## CRITICAL: After Modifying Thoughtbox MCP Server Code

**When you modify ANY file in `src/**/*.ts` (the MCP server code):**

1. ✅ Run `npm run build` to compile
2. ✅ Commit the changes if appropriate
3. ✅ **ALWAYS rebuild Docker** - Run: `docker-compose down && docker-compose build && docker-compose up -d`
4. ⚠️ Tell user: "Docker rebuilt. Please run `/mcp` to reconnect to the MCP server."
5. Wait for user to confirm reconnection before testing

**NEVER:**
- Ask if you should rebuild - ALWAYS rebuild after modifying MCP code
- Commit Thoughtbox MCP code changes without rebuilding Docker
- Assume the running MCP server has your new code (it doesn't until rebuild)
- Try to test MCP operations before Docker rebuild (it's still running old code)

**WHY:** The MCP server runs in Docker. Local `npm run build` only compiles to `dist/`, but Docker container still has old code until rebuild.

## Commit Message Format (REQUIRED)

**This project uses [Conventional Commits](https://www.conventionalcommits.org/)**

When creating commits, you MUST use this format:

```
<type>[optional scope]: <description>

[optional body]
```

### Quick Reference

**Types** (use these exactly):
- `feat`: New feature → CHANGELOG Added section
- `fix`: Bug fix → CHANGELOG Fixed section
- `perf`: Performance improvement → CHANGELOG Changed section
- `refactor`: Code refactor → CHANGELOG Changed section
- `docs`: Documentation only → Omitted from CHANGELOG
- `test`: Tests only → Omitted from CHANGELOG
- `chore`: Maintenance/tooling → Omitted from CHANGELOG
- `security`: Security fix → CHANGELOG Security section
- `breaking` or add `!`: Breaking change → MAJOR version bump

### Examples

```bash
# New feature
feat(loops): Add OODA loops MCP integration

# Bug fix
fix(analytics): Resolve concurrent write issue in loop-usage.jsonl

# Breaking change (note the !)
feat!: Remove deprecated thoughtbox_v1 tool

# With scope
perf(catalog): Cache hot-loops.json for faster sorting

# Documentation (not in changelog)
docs: Update README with loops documentation
```

### Why This Matters

1. **Automated changelog**: Commits automatically populate CHANGELOG.md
2. **Semantic versioning**: Commit types determine version bumps
3. **Clear history**: Easy to see what changed and why
4. **PR quality**: GitHub Action validates format

**If you create a commit**, use conventional format. The changelog automation depends on it.

## Improvement Loop Learnings

> Auto-generated learnings from autonomous improvement cycles

### What Works

### What Doesn't Work

### Current Capability Gaps
