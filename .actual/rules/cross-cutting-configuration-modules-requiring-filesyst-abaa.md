---
version: 2
name: cross-cutting-configuration-modules-requiring-filesyst-abaa
description: "Adoption of path Module for Filesystem Path Resolution: Configuration Modules Requiring Filesystem Path Resolution"
metadata:
  actual:
    adr_id: abaace97-d7d4-427b-868d-43acef0b3aa7
    status: accepted
    candidate_group_id: 13d23bc2-0b7d-43e8-a315-9b3b53e51a75
    evidence:
      source: deep
  scope:
    root: apps/web
---

# Adoption of path Module for Filesystem Path Resolution: Configuration Modules Requiring Filesystem Path Resolution

Scope: applies to `apps/web/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-PATH-001** MUST: Configuration modules requiring filesystem path resolution MUST import and utilize the path module rather than relying on manual string concatenation or platform-dependent path separators.

### Verify

```bash
sh -c '"${REPO_VERIFY_COMMAND:-echo Discover and execute the project configuration check script from the discovered repository manifest}"'
sh -c 'echo "Derive static analysis and test validation commands from the project manifest and execute them against configuration modules"'
```

**Accept when:**
- All configuration modules resolve filesystem locations using standardized path utility functions without hardcoded path delimiters.
- Discovered test and lint verification suites pass without path resolution or module import errors across host environments.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>