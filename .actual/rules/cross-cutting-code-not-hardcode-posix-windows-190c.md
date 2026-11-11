---
version: 2
name: cross-cutting-code-not-hardcode-posix-windows-190c
description: "Adoption of path Module for Filesystem Path Resolution: Code Not Hardcode Posix Windows Path"
metadata:
  actual:
    adr_id: 190c05e2-0062-4467-8e28-9de3609bfb80
    status: accepted
    candidate_group_id: 13d23bc2-0b7d-43e8-a315-9b3b53e51a75
    evidence:
      source: deep
  scope:
    root: apps/web
---

# Adoption of path Module for Filesystem Path Resolution: Code Not Hardcode Posix Windows Path

Scope: applies to `apps/web/**`.

These rules are ALWAYS ACTIVE for tooling and application configuration modules that calculate or resolve filesystem paths, and workspace scripts requiring path manipulation across host operating systems.

### Rules

- **R-PATH-001** MUST_NOT: Code MUST_NOT hardcode POSIX or Windows path separators in string literals when resolving directory or file locations across environments.

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