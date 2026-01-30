# Knowledge Graph Builder

Build a knowledge graph of the codebase with semantic connections.

## Variables

ROOT_PATH: $ARGUMENTS
DEPTH: 3

## Execute

1. SCAN codebase structure
2. EXTRACT semantic relationships
3. CORRELATE with mem0 knowledge
4. BUILD interactive graph
5. IDENTIFY knowledge gaps

## Graph Nodes

- **Modules**: Files and their purposes
- **Patterns**: Recurring code patterns
- **Decisions**: Architectural choices from mem0
- **Dependencies**: Both code and conceptual
- **Owners**: Who knows what (from git history)
- **Concepts**: Business logic and domain knowledge

## Relationships

- "implements pattern"
- "depends on"
- "similar to"
- "evolved from"
- "contradicts"
- "validates"

## Outputs

1. **Mermaid Diagram**: Visual representation
2. **Knowledge Gaps**: What's not documented
3. **Expertise Map**: Who to ask about what
4. **Coupling Analysis**: Hidden dependencies
5. **Pattern Catalog**: Reusable solutions

## Example

```
/knowledge-graph "packages/evals"

Discovers:
- "McpBenchmarkProcessor implements Observer pattern"
- "OpenTelemetry integration similar to Logger pattern"
- "Task system evolved from simple Promise chain"
- "Knowledge gap: No documentation for retry logic"
```

## Advanced Features

```
/knowledge-graph . --include-tests --track-todos --analyze-comments
```
