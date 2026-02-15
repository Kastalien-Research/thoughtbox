# SPEC: OODA Loops as MCP Prompts/Resources

## Overview

Expose the `.claude/commands/loops/` directory structure as MCP prompts and/or resources in the Thoughtbox server, enabling agents to discover and compose OODA loop building blocks programmatically.

## Context

The `.claude/commands/loops/` folder contains composable OODA loop building blocks organized by category:
- `exploration/` - Problem space, codebase discovery, domain research
- `authoring/` - Code generation, documentation, spec drafting
- `refinement/` - Code quality, consistency check, requirement quality
- `verification/` - Acceptance gate, fact checking, integration test
- `orchestration/` - Dependency resolver, queue processor, spiral detector
- `meta/` - Loop interface specification, composition patterns

These loops follow a standard interface (defined in `loops/meta/loop-interface.md`) and can be composed into workflows like the specification suite commands we just implemented.

## Problem Statement

Currently, these loops are only accessible as slash commands when working within Claude Code's .claude/commands/ directory. To unlock their full potential, we need to:

1. **Discoverability**: Agents connected to Thoughtbox should be able to list available loops
2. **Composition**: Agents should be able to reference loops by URI (e.g., `thoughtbox://loops/exploration/problem-space`)
3. **Execution**: Agents should be able to retrieve loop content with variable substitution
4. **Metadata**: Agents should understand loop classification (speed, scope, type) and composition rules

## Requirements

### REQ-1: Loop Discovery via MCP Resources

**Priority**: MUST

Expose a resource template that allows listing all available loops:
- `thoughtbox://loops/index` - Returns complete loop catalog with metadata
- `thoughtbox://loops/{category}` - Returns loops in specific category
- `thoughtbox://loops/{category}/{loop-name}` - Returns specific loop content

Each loop resource should include:
- Classification (type, speed, scope)
- Interface definition (inputs, outputs, signals)
- Composition rules (can contain, can be contained by, parallelizable)
- Full loop content with OODA phases

### REQ-2: Loop Content as Prompts

**Priority**: SHOULD

Register frequently-used loops as MCP prompts for direct execution:
- `problem-space-exploration` - The session-level exploration loop
- `spec-drafting` - Document-level spec authoring
- `requirement-quality` - Item-level requirement refinement
- Others as needed based on usage patterns

Prompts should support variable substitution for loop-specific parameters.

### REQ-3: Loop Metadata API

**Priority**: MUST

Provide structured access to loop metadata:
- Classification taxonomy
- Composition rules validation
- Interface compatibility checking

This enables agents to programmatically compose valid workflows.

### REQ-4: Resource Templates for Dynamic Access

**Priority**: MUST

Implement resource templates in server-factory.ts similar to the interleaved-thinking pattern:
```typescript
{
  uriTemplate: "thoughtbox://loops/{category}/{name}",
  name: "thoughtbox-loops",
  title: "OODA Loop Building Blocks",
  description: "Composable OODA loops for workflow construction",
  mimeType: "text/markdown"
}
```

### REQ-5: File System Integration

**Priority**: MUST

Read loop content from `.claude/commands/loops/` directory at runtime:
- Parse frontmatter for metadata
- Extract OODA phases
- Build dynamic catalog

Alternative: Embed loops as TypeScript constants (like existing resources) for performance.

## Design Considerations

### Approach A: File System Reading (Dynamic)

**Pros**:
- Loops can be updated without rebuilding server
- Easy to add new loops
- Single source of truth (files in .claude/commands/)

**Cons**:
- Runtime file I/O overhead
- Need path resolution logic
- Deployment complexity (must include .claude/ directory)

### Approach B: Embedded Resources (Static)

**Pros**:
- Fast (no file I/O)
- Simple deployment (everything in dist/)
- Type-safe imports

**Cons**:
- Requires rebuild when loops change
- Duplication between .claude/commands/ and src/resources/
- Build step to generate TypeScript from markdown

### Recommendation: Hybrid Approach

1. **Build-time embedding**: Script to read `.claude/commands/loops/` and generate `src/resources/loops-content.ts`
2. **Runtime serving**: Register resource templates that serve embedded content
3. **Development mode**: Option to read directly from filesystem for rapid iteration

## Implementation Plan

### Phase 1: Loop Content Embedding

1. Create `scripts/embed-loops.ts` similar to `embed-templates.ts`
2. Read all `.md` files in `.claude/commands/loops/`
3. Parse frontmatter and content
4. Generate `src/resources/loops-content.ts`:
```typescript
export const LOOPS_CATALOG = {
  exploration: {
    "problem-space": {
      content: "...",
      metadata: { type: "exploration", speed: "slow", scope: "session" }
    },
    // ...
  },
  // ...
};
```

### Phase 2: Resource Registration

1. Add resource templates to `server-factory.ts`
2. Implement URI resolution for `thoughtbox://loops/{category}/{name}`
3. Return loop content with metadata

### Phase 3: Prompt Registration (Optional)

1. Identify most commonly used loops
2. Register as prompts with argument schemas
3. Support variable substitution

### Phase 4: Metadata API

1. Add `thoughtbox://loops/meta/catalog` resource
2. Return structured JSON with full taxonomy
3. Include composition rules and interface definitions

## Success Criteria

- [ ] Agent can call `thoughtbox://loops/index` to list all loops
- [ ] Agent can retrieve specific loop via `thoughtbox://loops/exploration/problem-space`
- [ ] Loop content includes full OODA phases and metadata
- [ ] Build process generates loops-content.ts from .claude/commands/loops/
- [ ] At least 3 high-use loops registered as prompts

## Open Questions

1. **Should loops be prompts or resources?**
   - Prompts: Direct execution with variable substitution
   - Resources: Reference material for agent to interpret
   - **Answer**: Both - resources for discovery/composition, prompts for execution

2. **How to handle loop versioning?**
   - Include version in URI? (`thoughtbox://loops/v1/exploration/problem-space`)
   - Semantic versioning in metadata?
   - **Proposal**: Start without versioning, add if needed

3. **Should we support loop composition syntax?**
   - Allow agents to request "composed" workflows?
   - E.g., `thoughtbox://workflows/spec-designer` returns pre-composed workflow
   - **Proposal**: Phase 2 feature after basic loops work

## Dependencies

- Existing: `scripts/embed-templates.ts` as reference
- Existing: Loop interface specification in `.claude/commands/loops/meta/loop-interface.md`
- New: Build step integration

## Non-Goals (Out of Scope)

- Execution engine for loops (agents interpret and execute)
- Automatic workflow composition (agents compose manually)
- Loop state management (stateless resource serving)
- WYSIWYG loop editor UI

## Related Specifications

- Specification suite commands (spec-designer, spec-validator, spec-orchestrator)
- Interleaved thinking resource pattern
- MCP resource templates specification

---

**Status**: DRAFT
**Created**: 2026-01-19
**Last Updated**: 2026-01-19
