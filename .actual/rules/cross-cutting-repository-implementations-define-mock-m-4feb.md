---
version: 2
name: cross-cutting-repository-implementations-define-mock-m-4feb
description: "Internal Repositories Module Interface Adoption: Repository Implementations Define Mock Memory Adapters"
metadata:
  actual:
    adr_id: 4feb0b76-8698-484c-a737-04be6e727dda
    status: accepted
    candidate_group_id: 22f497ff-d640-47c0-85aa-09cd403c0993
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/peer-notebook/**
---

# Internal Repositories Module Interface Adoption: Repository Implementations Define Mock Memory Adapters

Scope: applies to `src/peer-notebook/**`.

These rules are ALWAYS ACTIVE for subsystem components performing data storage, peer lookup, broker dispatch, and proxy routing, as well as implementations of data persistence adapters and storage client wrappers.

### Rules

- **R-REPO-001** MAY: Repository implementations MAY define mock or in-memory adapters conforming to the internal repositories module contract for local validation and testing environments.

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
Claude Code MUST NOT skip or defer verification. Automated continuous integration pipelines execute repository contract tests and static type verification, and peer code review audits module import boundaries.
</enforcement>