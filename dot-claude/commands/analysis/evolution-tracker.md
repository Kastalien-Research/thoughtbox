# Code Evolution Tracker

Track how code patterns and architectural decisions evolve over time.

## Variables

COMPONENT_PATH: $ARGUMENTS
TIME_RANGE: "30d" # or specific date range

## Execute

1. ANALYZE git history for the component
2. EXTRACT patterns at different time points
3. CORRELATE with mem0 entries about decisions
4. IDENTIFY pattern migrations and reasons
5. PREDICT next evolution steps

## Features

- **Pattern Evolution**: How has error handling evolved?
- **Decision Archaeology**: Why did we move from X to Y?
- **Tech Debt Mapping**: What temporary solutions became permanent?
- **Refactoring Opportunities**: Based on historical patterns
- **Learning Extraction**: What worked and what didn't?

## Output

```markdown
## Evolution Report: src/services/mcp/

### Pattern Timeline

- 2024-01: Callback-based async handling
- 2024-03: Migration to Promises (Reason: mem0 entry #45)
- 2024-05: Added async/await (PR #234)
- 2024-06: Introduced error boundaries

### Architectural Decisions

- Moved from singleton to dependency injection
- Reason: Testing difficulties documented in mem0

### Predicted Next Steps

- Consider adding circuit breaker pattern
- Standardize timeout handling across all services
```

## Advanced Usage

```
/evolution-tracker "src/core/*.ts" --analyze-imports --track-complexity
```
