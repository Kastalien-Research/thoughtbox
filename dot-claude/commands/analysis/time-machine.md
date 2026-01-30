# Code Time Machine

Navigate through code history with context from mem0 entries.

## Variables

COMPONENT: $ARGUMENTS
POINT_IN_TIME: "2024-01-01" or "3 months ago"

## Execute

1. CHECKOUT code at specified time
2. RETRIEVE mem0 entries from that period
3. RECONSTRUCT context and decisions
4. COMPARE with current state
5. IDENTIFY lost knowledge

## Features

### Historical Context

- What were we thinking then?
- What constraints existed?
- What problems were we solving?
- Who made key decisions?

### Evolution Analysis

- What changed and why?
- What got better/worse?
- What assumptions proved wrong?
- What patterns emerged?

### Knowledge Recovery

- Find lost documentation
- Recover deleted useful code
- Understand abandoned approaches
- Learn from past mistakes

## Outputs

```markdown
## Time Machine Report: 2024-01-15

### Code State

- 45 files, 3,200 LOC
- Main patterns: Callbacks, Singleton
- No TypeScript yet

### Context (from mem0)

- "Team decided against TypeScript due to learning curve"
- "Performance was main concern"
- "Only 2 developers on project"

### What Changed

- +150 files, +12,000 LOC
- Migrated to TypeScript (2024-03)
- Added 5 new team members
- Performance improved 3x despite abstractions

### Lost Gems

- Simple retry utility (deleted 2024-02)
- Elegant error handler (overengineered in 2024-04)

### Lessons Learned

- Premature optimization hurt us
- TypeScript paid off quickly
- Simple solutions often best
```

## Advanced Usage

```
/time-machine . --blame --show-deleted --include-branches
```
