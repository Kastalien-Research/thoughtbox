# Implement Spec

Converts a specification document into actionable TODOs and checklist, implements it in a parallel git worktree, and provides merge guidance.

## Usage

```bash
/implement-spec <path-to-spec-file>
```

## Workflow

### Phase 1: Planning

1. **READ** the specification file provided as argument
2. **EXTRACT** requirements and create:
    - `TODOS.md`: Actionable implementation tasks
    - `CHECKLIST.md`: Completion verification criteria
3. **SAVE** both files in the worktree root for reference

### Phase 2: Worktree Setup

1. **CREATE** new git worktree:
    ```bash
    git worktree add -b implement-spec-$(date +%s) ./trees/implement-spec-$(date +%s)
    ```
2. **COPY** necessary environment files (`.env`, `.env.local`, etc.) to worktree
3. **SETUP** development environment in worktree if needed

### Phase 3: Implementation

1. **WORK** exclusively within the worktree directory
2. **FOLLOW** the TODO list systematically
3. **IMPLEMENT** all requirements from the specification
4. **TEST** implementation if testing is specified
5. **DOCUMENT** any deviations or additional considerations

### Phase 4: Verification

1. **REVIEW** the CHECKLIST.md against completed work
2. **MARK** each checklist item as complete/incomplete
3. **IDENTIFY** any gaps or missing requirements
4. **COMPLETE** any remaining work until checklist is 100% satisfied

### Phase 5: Merge Decision

1. **PRESENT** completion summary to user:
    - Files created/modified
    - Checklist completion status
    - Any notable implementation decisions
2. **ASK** user: "Implementation complete. Merge changes to main branch? (Y/n): "
3. **IF** user confirms:
    - Switch to main branch
    - Merge the implementation branch
    - Clean up worktree
4. **IF** user declines:
    - Leave worktree for manual review
    - Provide instructions for manual merge

## Example

```bash
/implement-spec packages/evals/specs/docker-prioritization/cleanup-plan.md
```

This will:

1. Read the cleanup plan specification
2. Create TODOs for documentation cleanup tasks
3. Create checklist for verification
4. Set up parallel worktree
5. Execute all cleanup tasks
6. Verify completion against checklist
7. Prompt user for merge approval

## Output Files

In the worktree root:

- `TODOS.md`: Step-by-step implementation tasks
- `CHECKLIST.md`: Verification criteria
- `IMPLEMENTATION_NOTES.md`: Any deviations or additional context

## Safety Features

- All work happens in isolated git worktree
- User approval required before merging
- Main branch remains untouched until user confirms
- Worktree preserved if user declines merge for manual review