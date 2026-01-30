# Exploration Commands

Commands for exploring multiple solution paths and experimental development.

## Available Commands

### [parallel-explorer](./parallel-explorer.md)

Explore multiple solution paths simultaneously using git worktrees with different strategies.

### [exe-parallel](../exe-parallel.md)

Execute parallel task versions across multiple worktrees (original parallel execution command).

## Use Cases

### Solution Exploration

- Try conservative vs innovative approaches
- Test different architectures in isolation
- Compare performance characteristics
- Merge best aspects of each approach

### Parallel Development

- Implement same feature multiple ways
- A/B test different solutions
- Reduce risk through exploration
- Speed up experimentation

### Strategy Types

#### Conservative

- Proven patterns
- Minimal dependencies
- Focus on stability
- Lower risk

#### Innovative

- Cutting-edge approaches
- New libraries/frameworks
- Performance optimization
- Higher risk/reward

#### Hybrid

- Balance of both
- Gradual migration path
- Best practices with innovation
- Medium risk

## Example Usage

```bash
# Explore caching strategies
/parallel-explorer "Implement response caching"

# Run parallel implementations
/exe-parallel "specs/feature.md" 3

# Compare approaches
/parallel-explorer "Migrate to TypeScript" --strategies="incremental,full,hybrid"
```

## Workflow

1. Create isolated worktrees
2. Implement solution in each
3. Run tests and benchmarks
4. Compare results
5. Merge best solution
6. Document learnings

## Benefits

- Reduce decision paralysis
- Test ideas quickly
- Learn from failures safely
- Find optimal solutions
- Build confidence in choices
