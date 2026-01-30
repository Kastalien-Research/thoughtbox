# Post-Edit Workflow

This document outlines the standardized workflow to be performed after every edit or small cluster of related edits to the codebase.

## Overview

The workflow integrates git operations with memory storage to maintain context about changes and enable better code understanding over time.

## Workflow Steps

### 1. Review Changes
```bash
git status
git diff
```
- Check what files have been modified
- Review the specific changes made
- Understand the scope and impact of modifications

### 2. Stage Changes
```bash
git add .
# or for specific files:
git add path/to/modified/file.ext
```
- Add all relevant changes to the staging area
- Be selective about what gets committed together

### 3. Commit Changes
```bash
git commit -m "descriptive commit message"
```
- Write clear, concise commit messages
- Follow conventional commit format if applicable
- Include context about why the change was made

### 4. Create Memory Record
Use `mcp__mem0-memory-mcp__add-memory` to store contextual information about the changes:

**Memory Content Should Include:**
- Summary of what was changed
- Why the change was necessary
- Files affected
- Any notable implementation decisions
- Potential impact on other parts of the system

**Example Memory Format:**
```
Modified authentication system in src/auth/: 
- Added JWT token validation middleware
- Updated user session handling
- Fixed security vulnerability in login endpoint
- Files: src/auth/middleware.ts, src/auth/session.ts, src/routes/login.ts
- Impact: Improved security, may affect existing API consumers
```

### 5. Optional: Structured Analysis
For complex changes, use `mcp__clear-thought__*` tools for deeper analysis:
- `mcp__clear-thought__systemsthinking` - Analyze system-wide impacts
- `mcp__clear-thought__debuggingapproach` - Document debugging process
- `mcp__clear-thought__decisionframework` - Record decision rationale

## MCP Tools Reference

### Git Operations
- `Bash` tool for all git commands
- `Read` tool to examine files before committing
- `Edit`/`MultiEdit` tools for any last-minute adjustments

### Memory Management
- `mcp__mem0-memory-mcp__add-memory` - Store change context
- `mcp__mem0-memory-mcp__search-memories` - Query previous changes

### Analysis Tools
- `mcp__clear-thought` - this server provides a wide array of reasoning operations for structured analysis: you can and should mix and match these in long sequences, just document your tool calls after the fact.

## Best Practices

1. **Atomic Commits**: Keep commits focused on single logical changes
2. **Descriptive Messages**: Write commit messages that explain the "why" not just the "what"
3. **Memory Context**: Include enough detail in memories to be useful weeks/months later
4. **Regular Execution**: Run this workflow consistently after every meaningful edit
5. **Review Before Commit**: Always review changes with `git diff` before committing

## Usage

Execute this workflow immediately after:
- Bug fixes
- Feature implementations
- Refactoring operations
- Configuration changes
- Documentation updates

The goal is to maintain a comprehensive history of not just what changed, but why it changed and how it fits into the broader system context.