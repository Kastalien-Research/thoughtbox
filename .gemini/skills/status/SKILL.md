---
name: status
description: Generate a status report across all workstreams using the selected tracker issue tracking. Shows active work, blockers, and available tasks.
argument-hint: ''
user-invocable: true
allowed-tools: Bash
---

Generate a comprehensive status report by running these commands:

!the selected issue stats view

!the selected issue list

!the selected blocked-work view

!the selected tracker readiness view

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
