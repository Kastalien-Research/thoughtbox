---
name: status
description: Generate a status report across all workstreams. Shows active work and recent changes.
argument-hint: [none]
user-invocable: true
allowed-tools: Bash(git *)
---

Generate a status report by reviewing recent git activity:

!`git log --oneline -20 2>/dev/null || echo "No recent commits"`

!`git branch -a 2>/dev/null || echo "No branches"`

!`gh pr list --state open 2>/dev/null || echo "No open PRs"`

Summarize findings in this format:

## Status Report

### Active Work
[List open PRs and active branches]

### Recent Changes
[List recent commits with context]

### Recommendations
[Suggested next actions based on current state]
