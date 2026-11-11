---
version: 2
name: cross-cutting-before-introducing-modifying-code-that-98c7
description: "Adoption of path Module for Filesystem Path Resolution: Before Introducing Modifying Code That References"
metadata:
  actual:
    adr_id: 98c74f3f-0948-4170-913a-8a5e72a6be75
    status: accepted
    candidate_group_id: 13d23bc2-0b7d-43e8-a315-9b3b53e51a75
    evidence:
      source: deep
  scope:
    root: apps/web
---

# Adoption of path Module for Filesystem Path Resolution: Before Introducing Modifying Code That References

Scope: applies to `apps/web/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-PATH-001** MUST: Before introducing or modifying code that references external or runtime-provided modules, engineers MUST inspect the repository lock artifact to verify the exact resolved version and adhere to its published interface documentation.

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