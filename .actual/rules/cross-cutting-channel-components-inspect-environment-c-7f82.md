---
version: 2
name: cross-cutting-channel-components-inspect-environment-c-7f82
description: "@modelcontextprotocol/sdk Stdio Transport Diagnostic Logging: Channel Components Inspect Environment Configuration Sources"
metadata:
  actual:
    adr_id: 7f821e3a-1918-4371-b057-890908e7bddb
    status: accepted
    candidate_group_id: 13e3836e-c533-4bcb-ad41-d53b76e25871
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# @modelcontextprotocol/sdk Stdio Transport Diagnostic Logging: Channel Components Inspect Environment Configuration Sources

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CHNL-001** MAY: Channel components MAY inspect environment configuration sources at initialization to determine whether to emit verbose diagnostic details to standard error.

### Verify

```bash
# Discover the static analysis validation script from the project manifest and execute it
# Example discovery and execution pattern:
PACKAGE_JSON="package.json"
if [ -f "$PACKAGE_JSON" ]; then
  LINT_SCRIPT=$(node -p "try { pkg = require('./$PACKAGE_JSON'); Object.keys(pkg.scripts || {}).find(s => s.includes('lint') || s.includes('static')) } catch(e) {}")
  if [ -n "$LINT_SCRIPT" ] && [ "$LINT_SCRIPT" != "undefined" ]; then
    npm run "$LINT_SCRIPT"
  fi
fi

# Run the test suite to confirm stdio transport integrity
TEST_SCRIPT=$(node -p "try { pkg = require('./$PACKAGE_JSON'); Object.keys(pkg.scripts || {}).find(s => s.includes('test')) } catch(e) {}")
if [ -n "$TEST_SCRIPT" ] && [ "$TEST_SCRIPT" != "undefined" ]; then
  npm test
fi
```

**Accept when:**
- Static analysis validates zero standard output logging calls within modules communicating over @modelcontextprotocol/sdk stdio transport.
- Test execution passes with all diagnostic, warning, and error outputs successfully directed to standard error.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory.
</enforcement>