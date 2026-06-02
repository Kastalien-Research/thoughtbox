---
name: status
description: Generate a status report across all workstreams using git history and GitHub issues. Shows active work, recent changes, and open PRs.
argument-hint: ''
user-invocable: true
allowed-tools: Bash
---

Generate a comprehensive status report by running these checks:

!`git log --oneline -10 2>/dev/null || echo "No recent commits"`

!`git branch -a --sort=-committerdate | head -10 2>/dev/null || echo "No branches"`

!`gh issue list --limit 10 2>/dev/null || echo "No GitHub issues available"`

!`gh pr list --limit 10 2>/dev/null || echo "No open PRs"`

Summarize findings in this format:

## Status Report

### Recent Activity
[List recent commits and active branches]

### Open PRs
[List open pull requests and their status]

### Open Issues
[List open GitHub issues]

### Project Health
[Summary of activity level, branch hygiene, PR backlog]

### Recommendations
[Suggested next actions based on current state]
