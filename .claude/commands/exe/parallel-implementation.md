# Parallel Implementation

Initialize parallel git worktrees and execute concurrent implementations of a feature plan.

## Variables

FEATURE_NAME: $ARGUMENTS
IMPLEMENTATION_PLAN: $ARGUMENTS
NUMBER_OF_IMPLEMENTATIONS: $ARGUMENTS
COMMENTS: $ARGUMENTS

## Phase 1: Setup Worktrees

CREATE new directory 'trees/' if it doesn't exist

> Execute these steps in parallel for each implementation (1 to NUMBER_OF_IMPLEMENTATIONS)
> Use absolute paths for all commands
> Each worktree will be named FEATURE_NAME-N where N is the implementation number

FOR each implementation N from 1 to NUMBER_OF_IMPLEMENTATIONS:

- RUN `git worktree add -b FEATURE_NAME-N ./trees/FEATURE_NAME-N`
- COPY `.env` files if they exist in root to ./trees/FEATURE_NAME-N/
- RUN `cd ./trees/FEATURE_NAME-N && uv venv && source .venv/bin/activate && uv pip install -e .`
- VERIFY setup with `cd ./trees/FEATURE_NAME-N && python -c "import mem0; print('Setup complete')"`

## Phase 2: Execute Parallel Implementations

READ the IMPLEMENTATION_PLAN to understand the feature requirements

CREATE NUMBER_OF_IMPLEMENTATIONS parallel Task agents, each working in their respective worktree:

### For Agent 1 through Agent NUMBER_OF_IMPLEMENTATIONS:

**Working Directory**: trees/FEATURE_NAME-N/

**Task Instructions**:

1. You are implementing the feature described in IMPLEMENTATION_PLAN
2. Work independently in your assigned worktree directory
3. Make all code changes within your worktree
4. Do NOT start any servers - focus only on code implementation
5. Create different implementation approaches from other agents:
    - Agent 1: Focus on simplicity and minimal changes
    - Agent 2: Focus on performance and efficiency
    - Agent 3: Focus on extensibility and future-proofing
    - Additional agents: Try innovative or alternative approaches
6. When complete, create a comprehensive RESULTS.md file at the root of your worktree with:
    - Summary of your implementation approach
    - List of all files created/modified
    - Key design decisions and rationale
    - Any trade-offs made
    - Testing recommendations
    - Performance considerations

## Phase 3: Summary

After all agents complete their work:

1. LIST all RESULTS.md files: `find trees/FEATURE_NAME-* -name "RESULTS.md" -type f`
2. CREATE a comparison summary showing:
    - Key differences between implementations
    - Pros/cons of each approach
    - Recommendation for which implementation(s) to use
3. SAVE the comparison summary as `trees/IMPLEMENTATION_COMPARISON.md`

## Example Usage

```
FEATURE_NAME: enhanced-mem0-tools
IMPLEMENTATION_PLAN: "Implement the 7-tool architecture from specs/exe/implementation-plan.md"
NUMBER_OF_IMPLEMENTATIONS: 3
```

This will create three parallel implementations of the enhanced mem0 tools, each with different design priorities.
