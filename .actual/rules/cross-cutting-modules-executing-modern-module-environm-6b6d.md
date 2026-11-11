---
version: 2
name: cross-cutting-modules-executing-modern-module-environm-6b6d
description: "Adoption of path Module for Filesystem Path Resolution: Modules Executing Modern Module Environments Derive"
metadata:
  actual:
    adr_id: 6b6d04be-adcb-4d7a-8415-ab0f292dfb95
    status: accepted
    candidate_group_id: 13d23bc2-0b7d-43e8-a315-9b3b53e51a75
    evidence:
      source: deep
  scope:
    root: apps/web
---

# Adoption of path Module for Filesystem Path Resolution: Modules Executing Modern Module Environments Derive

Scope: applies to `apps/web/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-PATH-001** SHOULD: Modules executing in modern module environments SHOULD derive module directory references through standard location resolution utilities prior to passing them into path resolution functions.
- **R-PATH-002** MANDATORY: The consumer MUST discover tool names, file names, commands, package managers, and version numbers from the project repository.
- **R-PATH-003** MANDATORY (LOCK-VERSION GROUNDING): Before writing code that uses a versioned library, execute in order:
  1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
  2. Identify the build tool from the manifest.
  3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
  4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
  5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
  6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- **R-PATH-004** MANDATORY: Standardize on `resolve` when absolute path anchoring to the workspace or module root is necessary, and `join` for combining relative path segments.
- **R-PATH-005** MANDATORY: When working within modern module systems, convert file URLs to filesystem paths prior to invoking path normalization routines.

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