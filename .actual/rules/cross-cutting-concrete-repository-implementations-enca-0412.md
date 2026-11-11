---
version: 2
name: cross-cutting-concrete-repository-implementations-enca-0412
description: "Internal Repositories Module Interface Adoption: Concrete Repository Implementations Encapsulate Data Normalization"
metadata:
  actual:
    adr_id: 04124d47-d601-4e04-bc3a-4c8f5f75bc30
    status: accepted
    candidate_group_id: 22f497ff-d640-47c0-85aa-09cd403c0993
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/peer-notebook/**
---

# Internal Repositories Module Interface Adoption: Concrete Repository Implementations Encapsulate Data Normalization

Scope: applies to `src/peer-notebook/**`.

These rules are ALWAYS ACTIVE for subsystem components performing data storage, peer lookup, broker dispatch, and proxy routing, as well as implementations of data persistence adapters and storage client wrappers.

### Rules

- **R-IRE-001** SHOULD: Concrete repository implementations encapsulate data normalization, credential injection, session configuration, and storage-specific error handling behind the repositories module interfaces.

### Verify

```bash
# Discover and run the project type-checking script from the repository configuration
# Discover and execute the project automated test runner to validate contract compliance across all repository adapter implementations
# Inspect dependency manifests and imports to verify no forbidden direct database client imports exist within broker orchestration components
```

**Accept when:**
- The project type-checking validation completes with zero type errors across repository consumers and adapter implementations.
- All unit and contract tests verifying repository operations pass without failure.
- Architecture boundary verification confirms broker and proxy components access storage exclusively via the internal repositories module.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory and enforced by automated continuous integration pipelines, static type verification, peer code review, and build failure triggers.
</enforcement>