# Parallel Executor

Unified command for parallel development workflows including initialization, execution, recovery, and management of multiple implementation approaches.

## Command Structure

```bash
/parallel-executor "<action>" [--feature=<name>] [--plan=<path>] [--count=<number>] [--strategy=<type>] [--context=<info>]
```

## Parameters

- `action`: Action to perform (init, execute, resume, recover, status, compare, cleanup)
- `feature`: Feature name for branch/worktree naming
- `plan`: Path to implementation plan file
- `count`: Number of parallel implementations (default: 3)
- `strategy`: Implementation strategy (simple, performance, extensible, innovative)
- `context`: Additional context for resume/recovery operations

## Actions

### Init - Initialize Parallel Worktrees

```bash
/parallel-executor init --feature="auth-system" --count=3
```

**Creates:**
- `trees/auth-system-1/` - Simple, minimal approach
- `trees/auth-system-2/` - Performance-focused approach  
- `trees/auth-system-3/` - Extensible, future-proof approach

**Setup for each worktree:**
- Git worktree creation with unique branch
- Dependency installation (npm/pnpm/uv)
- Environment configuration
- Port configuration for servers (if needed)
- Build verification

### Execute - Run Parallel Implementations

```bash
/parallel-executor execute --feature="auth-system" --plan="specs/auth-plan.md" --count=3
```

**Process:**
1. Reads implementation plan
2. Launches parallel Task agents
3. Each agent works in isolated worktree
4. Agents follow different implementation strategies
5. Generates RESULTS.md in each worktree

**Agent Strategies:**
- **Agent 1**: Simplicity and minimal changes
- **Agent 2**: Performance and efficiency focus
- **Agent 3**: Extensibility and future-proofing
- **Agent N**: Innovative or alternative approaches

### Resume - Continue Interrupted Work

```bash
/parallel-executor resume --plan="specs/auth-plan.md" --context="crashed during validation"
```

**Process:**
1. Scans for existing worktrees
2. Analyzes git status and progress
3. Generates/updates PROGRESS.md files
4. Launches agents to continue work
5. Preserves original implementation approach

### Recover - Quick Recovery Analysis

```bash
/parallel-executor recover --plan="specs/auth-plan.md"
```

**Process:**
1. Discovers all worktrees
2. Analyzes current state
3. Generates recovery reports
4. Provides resume recommendations

### Status - Check Progress

```bash
/parallel-executor status --feature="auth-system"
```

**Shows:**
- Worktree status and progress
- Git changes summary
- Completion percentage
- Agent status

### Compare - Compare Implementations

```bash
/parallel-executor compare --feature="auth-system"
```

**Generates:**
- Implementation comparison report
- Pros/cons analysis
- Performance considerations
- Recommendation summary

### Cleanup - Remove Worktrees

```bash
/parallel-executor cleanup --feature="auth-system"
```

**Process:**
- Safely removes worktrees
- Cleans up git branches
- Preserves RESULTS.md files
- Archives implementation reports

## Implementation Strategies

### Simple Strategy
- Minimal code changes
- Proven patterns only
- Focus on reliability
- Quick implementation

### Performance Strategy
- Optimization focused
- Efficient algorithms
- Resource optimization
- Benchmarking included

### Extensible Strategy
- Future-proof design
- Modular architecture
- Plugin capabilities
- Comprehensive interfaces

### Innovative Strategy
- Cutting-edge approaches
- New libraries/frameworks
- Experimental techniques
- Higher risk/reward

## Integration with Other Commands

```bash
# Use with analysis commands
/knowledge-graph "src/auth" --depth=2
/parallel-executor init --feature="auth-refactor" --count=3

# Use with synthesis commands
/pattern-synthesizer "authentication patterns"
/parallel-executor execute --plan="synthesized-patterns.md"

# Use with debugging commands
/systematic-debug "auth failures"
/parallel-executor resume --context="debug findings"
```

## Output Artifacts

### PROGRESS.md (per worktree)
```markdown
# Progress Report - auth-system-1

## Completed ✅
- User model implementation
- Basic authentication flow
- Unit tests for core functions

## In Progress 🚧
- JWT token validation
- Session management

## Remaining TODOs 📋
- Password reset flow
- OAuth integration
- Integration tests

## Resume Instructions
Continue with JWT implementation, focus on security best practices

## Context
Simple strategy: prioritize reliability over features
```

### RESULTS.md (per worktree)
```markdown
# Implementation Results - auth-system-1

## Approach Summary
Simple, reliable authentication system using proven patterns

## Files Created/Modified
- src/auth/user.ts (new)
- src/auth/session.ts (new)
- src/auth/middleware.ts (modified)
- tests/auth.test.ts (new)

## Key Design Decisions
- Used bcrypt for password hashing
- Simple session-based authentication
- Minimal external dependencies

## Trade-offs Made
- Chose simplicity over advanced features
- Session storage over JWT for simplicity
- Basic validation over complex rules

## Performance Considerations
- Session lookup optimized with indexing
- Password hashing with appropriate cost
- Minimal middleware overhead

## Testing Strategy
- Unit tests for all auth functions
- Integration tests for middleware
- Security testing for common attacks
```

### IMPLEMENTATION_COMPARISON.md
```markdown
# Implementation Comparison - auth-system

## Summary
Three different approaches to authentication system implementation

## Approach 1: Simple (auth-system-1)
**Pros:**
- Easy to understand and maintain
- Reliable, proven patterns
- Quick to implement

**Cons:**
- Limited scalability
- Fewer features
- Basic security measures

## Approach 2: Performance (auth-system-2)
**Pros:**
- Highly optimized
- Scales well
- Comprehensive caching

**Cons:**
- More complex
- Higher memory usage
- Harder to debug

## Approach 3: Extensible (auth-system-3)
**Pros:**
- Future-proof design
- Plugin architecture
- Comprehensive features

**Cons:**
- Over-engineered for current needs
- Longer implementation time
- More dependencies

## Recommendation
Use Approach 1 as base, incorporate caching from Approach 2, and adopt the plugin interface from Approach 3 for future extensions.
```

## Best Practices

1. **Clear Feature Naming**: Use descriptive, consistent feature names
2. **Comprehensive Plans**: Provide detailed implementation plans
3. **Strategy Diversity**: Use different approaches for better exploration
4. **Progress Tracking**: Regularly check progress and update status
5. **Result Preservation**: Always save results before cleanup

## Example Workflows

### Full Development Cycle
```bash
# Initialize parallel development
/parallel-executor init --feature="payment-system" --count=3

# Execute implementations
/parallel-executor execute --feature="payment-system" --plan="specs/payment-plan.md"

# Check progress
/parallel-executor status --feature="payment-system"

# Compare results
/parallel-executor compare --feature="payment-system"

# Cleanup after decision
/parallel-executor cleanup --feature="payment-system"
```

### Recovery Workflow
```bash
# Resume interrupted work
/parallel-executor resume --plan="specs/payment-plan.md" --context="power outage during testing"

# Check recovery status
/parallel-executor status

# Continue with comparison
/parallel-executor compare --feature="payment-system"
```

## Success Metrics

- Implementation completion rate
- Code quality across approaches
- Performance comparison results
- Feature coverage analysis
- Development time efficiency

## Learning Integration

The parallel-executor command learns from each execution:
- Successful implementation patterns
- Effective strategy combinations
- Common failure points
- Optimal worktree configurations
- Best practice evolution

This creates a continuously improving parallel development capability that gets better at generating diverse, high-quality implementations over time.