# Workflow Commands

Commands for orchestrating complex, multi-phase tasks with state management and progress tracking.

## OODA Loop Building Blocks

Workflows in this folder compose reusable OODA loops from the **@loops/** library:

- See @loops/README.md for the full loop library
- See @loops/meta/loop-interface.md for the standard loop contract
- See @loops/meta/composition-patterns.md for how loops combine

## Available Commands

### [mcp-workflow](./mcp-workflow.md)

Execute YAML-based workflows with structured steps and error handling.

### [mcp-chain](./mcp-chain.md)

Simple linear tool chains with basic variable passing between steps.

### [mcp-orchestrate](./mcp-orchestrate.md)

Advanced DSL with parallel execution, conditionals, loops, and complex logic.

### [mcp-recipe](./mcp-recipe.md)

Pre-defined common patterns and custom recipe support for reusable workflows.

### [spec-designer](./spec-designer.md)

Design and produce implementation specifications through structured cognitive loops. Upstream companion to spec-orchestrator—where the orchestrator *implements* specs, the designer *creates* them.

**Composes loops:**
- @loops/exploration/problem-space.md
- @loops/authoring/spec-drafting.md
- @loops/refinement/requirement-quality.md
- @loops/verification/acceptance-gate.md

### [spec-orchestrator](./spec-orchestrator.md)

Coordinate implementation of multiple specification documents from a folder with dependency management, progress tracking, and spiral prevention through OR-informed constraints.

**Composes loops:**
- @loops/orchestration/spiral-detector.md
- @loops/orchestration/queue-processor.md (planned)
- @loops/verification/integration-test.md (planned)

### [fact-check-docs](./fact-check-docs.md)

Systematically verify claims in documentation against sources of truth (codebase, web data, or research). Uses the fact-checking-agent subagent to track verification progress across sessions and automatically correct mismatches.

### [fact-check-standalone](./fact-check-standalone.md)

Self-contained version of fact-check-docs that performs all verification operations directly without requiring the fact-checking-agent subagent. Ideal for environments without custom agents or when you want direct control over the verification process.

### [mcp-battle-orchestrator](./mcp-battle-orchestrator.md)

Advanced workflow orchestration for competitive analysis and parallel MCP tool evaluation.

### [claude-code-native-workflow](./claude-code-native-workflow.md)

Native Claude Code workflow patterns and best practices.

## Common Patterns

### MCP Orchestration
- **Research & Save**: Search → Scrape → Store to memory
- **Multi-source Aggregation**: Parallel searches → Merge results → Analyze
- **Progressive Enhancement**: Basic search → Deep dive → Extract patterns
- **Cross-reference**: GitHub + Web + Docs → Correlate findings

### Implementation & Verification
- **Spec Implementation**: Discovery → Dependencies → Planning → Implementation → Integration
- **Fact-Checking**: Claim extraction → Source discovery → Verification → Correction → Validation
- **Quality Gates**: Phase-based progress with checkpoints and validation

## Example Usage

### MCP Workflows
```bash
# Simple chain
/mcp-chain mcp__exa__web_search_exa | query="OpenTelemetry", numResults=5

# Complex orchestration
/mcp-orchestrate .claude/workflows/research-plan.md

# Quick recipe
/mcp-recipe research-and-save query="React patterns"
```

### Implementation Workflows
```bash
# Implement multiple specs with dependency management
/spec-orchestrator specs/observability/ --budget=100 --max-iterations=3

# Verify documentation accuracy against codebase
/fact-check-docs docs/api/ --confidence=0.85 --sources=codebase

# Resume previous fact-checking session
/fact-check-docs docs/api/ --resume
```

## Workflow + Agent Integration

Workflows can be designed with different levels of agent integration:

### Agent-Integrated Workflows
These delegate specialized work to subagents:
- **fact-check-docs**: Uses `fact-checking-agent` for claim verification and correction

### Standalone Workflows
These perform all operations directly:
- **spec-orchestrator**: Self-contained implementation workflow
- **fact-check-standalone**: Complete fact-checking without requiring subagents

The agent-integrated approach provides better separation of concerns and reusability, while standalone workflows offer more direct control and fewer dependencies.
