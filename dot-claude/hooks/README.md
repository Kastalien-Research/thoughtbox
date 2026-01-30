# Claude Code Hooks for Git Protection

This directory contains Claude Code hooks that prevent destructive Git operations when using Claude Code or the Agent SDK.

## Overview

These hooks provide **defense in depth** protection against:
- Direct pushes to protected branches (`main`, `master`, `develop`, `production`)
- Force pushes that rewrite history
- Branch deletions
- Invalid commit messages
- Secret leaks in commits

## Hook Files

### `pre_tool_use.sh`
**Event:** `PreToolUse`  
**Purpose:** Validates Bash commands before execution, blocking dangerous Git operations.

**Blocks:**
- Direct push to protected branches
- Force push (`--force` or `-f`)
- Branch deletion
- Dangerous `rm -rf` commands
- `.env` file writes

**Warns:**
- Invalid commit message format (doesn't block, just warns)

**Exit Codes:**
- `0`: Allow command
- `2`: Block command (Claude Code will prevent execution)

### `post_tool_use.sh`
**Event:** `PostToolUse`  
**Purpose:** Logs Git operations for audit trail.

**Logs to:** `logs/git_operations.json`

### `git-validator.sh`
**Event:** `PermissionRequest`  
**Purpose:** Advanced validation using JSON output for fine-grained control.

**Output Format:**
```json
{
  "decision": "block|approve|prompt",
  "reason": "Human-readable explanation"
}
```

**Decisions:**
- `block`: Prevent command execution
- `approve`: Allow command (auto-approve)
- `prompt`: Ask user for confirmation

## Configuration

Hooks are configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/pre_tool_use.sh"
          }
        ]
      }
    ]
  }
}
```

## Protected Branches

The following branches are protected from direct pushes:
- `main`
- `master`
- `develop`
- `production`

All changes to these branches must go through Pull Requests.

## Conventional Commit Format

Commit messages must follow this format:
```
<type>(<scope>): <subject>
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `style`

**Example:**
```
feat(notebook): add cell execution timeout
fix(security): prevent shell injection in git commands
```

## Testing Hooks

### Test Direct Push Block
```bash
# This should be blocked
git push origin main
```

### Test Force Push Block
```bash
# This should be blocked
git push --force origin feat/my-feature
```

### Test Commit Message Validation
```bash
# This should be blocked by pre-commit hook
git commit -m "fix stuff"
# Should be: git commit -m "fix(scope): fix stuff"
```

## Integration with Git Hooks

These Claude Code hooks work alongside Git hooks in `.husky/`:
- **Claude Code hooks**: Prevent operations at the agent level
- **Git hooks**: Prevent operations at the Git level (cannot be bypassed)

Both layers provide defense in depth.

## Debugging

Enable verbose mode to see hook execution:
```bash
claude --debug
```

Check hook registration:
```bash
claude /hooks
```

## Security Considerations

⚠️ **USE AT YOUR OWN RISK**: These hooks execute shell commands automatically. Review all hook scripts before use.

**Best Practices:**
1. Always quote shell variables: `"$VAR"` not `$VAR`
2. Validate inputs before use
3. Use absolute paths with `$CLAUDE_PROJECT_DIR`
4. Test hooks in a safe environment first

## References

- [Claude Code Hooks Documentation](https://code.claude.com/docs/en/hooks)
- [Git Hooks Documentation](../.husky/README.md)
- [Version Control Vulnerabilities Analysis](../../VERSION_CONTROL_VULNERABILITIES.md)
