---
name: status
description: Generate a status report across all workstreams using beads issue tracking. Shows active work, blockers, and available tasks.
argument-hint: [none]
user-invocable: true
allowed-tools: Bash(bd *)
---

Generate a comprehensive status report by running these commands:

!`bd stats 2>/dev/null || echo "No beads stats available"`

!`bd list --status=in_progress 2>/dev/null || echo "No in-progress issues"`

!`bd blocked 2>/dev/null || echo "No blocked issues"`

!`bd ready 2>/dev/null || echo "No ready issues"`

Summarize findings in this format:

## Status Report

### Active Work
[List in-progress issues with assignees]

### Blocked
[List blocked issues and what they're waiting on]

### Available
[List ready issues that can be picked up]

### Project Health
[Stats summary — open/closed/blocked counts]

### Recommendations
[Suggested next actions based on current state]
