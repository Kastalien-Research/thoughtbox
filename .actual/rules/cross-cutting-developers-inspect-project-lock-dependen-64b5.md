---
version: 2
name: cross-cutting-developers-inspect-project-lock-dependen-64b5
description: "Internal Repositories Module Interface Adoption: Developers Inspect Project Lock Dependency Resolution"
metadata:
  actual:
    adr_id: 64b5cb59-e50b-4950-9821-c63b0a06e2e8
    status: accepted
    candidate_group_id: 22f497ff-d640-47c0-85aa-09cd403c0993
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/peer-notebook/**
---

# Internal Repositories Module Interface Adoption: Developers Inspect Project Lock Dependency Resolution

Scope: applies to `src/peer-notebook/**`.

These rules are ALWAYS ACTIVE for subsystem components performing data storage, peer lookup, broker dispatch, and proxy routing, and implementations of data persistence adapters and storage client wrappers.

### Rules

- **R-INT-001** MUST: Developers MUST inspect the project lock and dependency resolution artifacts to verify exact resolved versions of any underlying infrastructure SDKs before implementing or modifying repository adapters.

### Verify

```bash
# Discover and run the project type-checking script from the repository configuration
# Discover and execute the project automated test runner
# Inspect dependency manifests and imports to verify no forbidden direct database client imports exist within broker orchestration components
```

**Accept when:**
- The project type-checking validation completes with zero type errors across repository consumers and adapter implementations.
- All unit and contract tests verifying repository operations pass without failure.
- Architecture boundary verification confirms broker and proxy components access storage exclusively via the internal repositories module.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification of repository contract tests and static type checking is mandatory.
</enforcement>