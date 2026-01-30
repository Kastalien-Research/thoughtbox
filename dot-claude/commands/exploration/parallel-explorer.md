# Parallel Explorer

Explore multiple solution paths simultaneously using git worktrees.

## Variables

PROBLEM_STATEMENT: $ARGUMENTS
EXPLORATION_STRATEGIES: ["conservative", "innovative", "hybrid"]

## Execute

1. CREATE worktrees for each strategy
2. IMPLEMENT solution using different approaches in parallel
3. RUN tests in each worktree
4. COMPARE metrics (performance, complexity, maintainability)
5. MERGE best aspects into final solution

## Strategies

### Conservative

- Use existing patterns from mem0
- Minimal dependencies
- Proven solutions
- Focus on stability

### Innovative

- Research cutting-edge approaches
- Try new libraries/patterns
- Optimize for performance
- Accept some risk

### Hybrid

- Balance both approaches
- Start conservative, optimize later
- Gradual migration path
- Best of both worlds

## Parallel Execution

```bash
# Each strategy runs in its own worktree
trees/explorer-conservative/
trees/explorer-innovative/
trees/explorer-hybrid/
```

## Comparison Matrix

| Aspect            | Conservative | Innovative | Hybrid    |
| ----------------- | ------------ | ---------- | --------- |
| Risk              | Low          | High       | Medium    |
| Performance       | Good         | Excellent  | Very Good |
| Maintainability   | High         | Medium     | High      |
| Time to implement | Fast         | Slow       | Medium    |

## Example

```
/parallel-explorer "Implement caching for MCP responses"

Creates three implementations:
1. Simple in-memory Map
2. Redis with cache warming
3. Layered cache with TTL
```
