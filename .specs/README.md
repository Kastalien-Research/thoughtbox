# Thoughtbox MCP Specifications

## Overview

This directory contains specifications for exposing Thoughtbox's cognitive affordances via MCP (Model Context Protocol).

## Core Philosophy

**Thoughtbox is a reasoning server, not a memory server.**

- **Learning substrate**: The codebase (`.claude/` folder)
- **Measurement instrument**: Thoughtbox server
- **Stateless consumer**: Agent (Claude Code, optimized first)

The codebase learns and improves. Thoughtbox provides structured thinking tools. Agents benefit from both but remain stateless.

## Specifications

### 1. OODA Loops as MCP Prompts/Resources

**Files**:
- [loops-mcp-composition-system.md](loops-mcp-composition-system.md) - Main specification
- [loops-mcp-implementation-details.md](loops-mcp-implementation-details.md) - Implementation details
- [loops-mcp-validation-report.md](loops-mcp-validation-report.md) - Validation analysis

**Status**: Validated (85/100) - Ready for implementation

**Summary**: Expose the `.claude/commands/loops/` OODA loop building blocks as MCP resources and prompts, enabling agents to discover and compose structured thinking patterns.

**Key Requirements**:
- REQ-1: Loop discovery via resource templates
- REQ-2: High-use loops as prompts
- REQ-3: Metadata API for composition
- REQ-4: Resource templates for dynamic access
- REQ-5: Build-time embedding (hybrid approach)
- REQ-6: Error handling
- REQ-7: **Codebase learning via usage analytics** (`.claude/thoughtbox/`)

**Implementation Approach**:
- Build-time: `scripts/embed-loops.ts` reads `.claude/commands/loops/` → generates `src/resources/loops-content.ts`
- Runtime: Resource templates serve embedded content
- Analytics: Record loop access to `.claude/thoughtbox/loop-usage.jsonl`
- Evolution: Hot loops promoted to prompts, integrated with DGM system

**Token Economics**:
- Workflow prompts (Tier 1): 3-5K tokens - **Recommended for execution**
- Loop metadata (Tier 2): 500 tokens per loop - For discovery
- Full loop content (Tier 3): 5K tokens per loop - For deep understanding only

## Architectural Principles

### 1. Codebase as Learning Substrate

Learning accumulates in version-controlled files:
```
.claude/
├── rules/           # Patterns learned from past work
├── commands/        # Workflows that proved effective
├── thoughtbox/      # Loop usage analytics, workflow captures
└── hooks/           # Guardrails learned from mistakes
```

Future agents read these files and benefit from prior sessions without any server-side memory.

### 2. Thoughtbox as Cognitive Affordance Provider

Thoughtbox provides tools for structured thinking:
- Thought chains (linked lists)
- Branch exploration (parallel paths)
- Cipher notation (compression)
- Session export (reasoning artifacts)
- Loop usage recording (topology shaping)

It does NOT learn, remember, or improve itself. It helps agents shape the information topology of their workspace.

### 3. Graceful Degradation

All features degrade gracefully when `.claude/` folder doesn't exist:
- No usage recording → uses default loop ordering
- No custom loops → uses embedded loops only
- No workflow traces → no session continuity metadata
- Server remains fully functional

### 4. Complementary with Memory Servers

Thoughtbox + Letta (or other memory servers) = powerful combination:
- Letta: Long-term memory, entity tracking, preference learning
- Thoughtbox: Structured reasoning, OODA loops, session export

Not competitive - complementary. We optimize for Claude Code (stateless) first, then expand.

## Implementation Status

| Component | Status | Files |
|-----------|--------|-------|
| Specification prompts | ✅ Implemented | `src/prompts/contents/spec-*.ts` |
| Prompt registration | ✅ Implemented | `src/server-factory.ts:587-722` |
| Loop embedding | ⏳ Specified | `loops-mcp-*.md` |
| Usage analytics | ⏳ Specified | REQ-7 in implementation-details.md |

## Next Steps

1. **Phase 1**: Implement loop embedding
   - Create `scripts/embed-loops.ts`
   - Generate `src/resources/loops-content.ts`
   - Register resource templates

2. **Phase 2**: Add usage analytics
   - Create `.claude/thoughtbox/` integration
   - Record loop access to `loop-usage.jsonl`
   - Build aggregation for `hot-loops.json`

3. **Phase 3**: Dynamic prompt registration
   - Read `hot-loops.json` at server startup
   - Register top 5 as prompts
   - Update on rebuild

4. **Phase 4**: DGM integration
   - Bridge to `.claude/rules/evolution/`
   - Loop usage → fitness signals
   - Experimental loop variants

## Design Decisions

### Why Hybrid Embedding?

**Build-time embedding** (not runtime file I/O):
- Fast resource resolution (no I/O)
- Simple deployment (everything in dist/)
- Type-safe TypeScript imports

**But read `.claude/` at runtime for analytics**:
- Usage metrics persist across deployments
- Codebase learns from actual usage
- No server-side state required

### Why `.claude/thoughtbox/` Not `/data/thoughtbox/`?

**`.claude/`**:
- Version-controlled (learning persists)
- Workspace-scoped (per-project patterns)
- Human-readable (inspectable, editable)
- Survives server restarts/redeployments

**`/data/thoughtbox/`**:
- Session records only (not learning)
- Server-managed (not user-visible)
- Ephem eral across deployments

## References

- [MCP Prompts Documentation](https://code.claude.com/docs/en/mcp#use-mcp-prompts-as-slash-commands)
- [MCP Resources Documentation](https://code.claude.com/docs/en/mcp#execute-mcp-prompts)
- [Claude Code as MCP Server](https://code.claude.com/docs/en/mcp#use-claude-code-as-an-mcp-server)

---

**Last Updated**: 2026-01-19
**Specification Suite**: loops-mcp-composition-system
