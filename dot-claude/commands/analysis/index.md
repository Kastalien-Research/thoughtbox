# Code Analysis Commands

Commands for analyzing code patterns, evolution, and relationships.

## Available Commands

### [context-aware-review](./context-aware-review.md)

Intelligent code review using memory of past patterns and team preferences.

### [evolution-tracker](./evolution-tracker.md)

Track how code patterns and architectural decisions evolve over time.

### [knowledge-graph](./knowledge-graph.md)

Build a semantic knowledge graph of the codebase with relationships and concepts.

### [time-machine](./time-machine.md)

Navigate through code history with context from mem0 entries to understand decisions.

## Use Cases

### Code Review

- Apply consistent standards based on team history
- Identify anti-patterns from past issues
- Suggest improvements based on successful patterns

### Architecture Analysis

- Understand why decisions were made
- Track technical debt accumulation
- Identify refactoring opportunities

### Knowledge Management

- Document implicit knowledge
- Find expertise gaps
- Create onboarding materials

### Historical Analysis

- Learn from past mistakes
- Recover lost solutions
- Understand evolution patterns

## Example Usage

```bash
# Review with historical context
/context-aware-review "src/**/*.ts"

# Track pattern evolution
/evolution-tracker "src/services/mcp" --time-range="6m"

# Build knowledge map
/knowledge-graph "packages/evals" --depth=3

# Time travel analysis
/time-machine "src/core" --point-in-time="2024-01-01"
```
