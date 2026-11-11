---
version: 2
name: cross-cutting-broker-services-service-proxies-persiste-f778
description: "Internal Repositories Module Interface Adoption: Broker Services Service Proxies Persistence Adapters"
metadata:
  actual:
    adr_id: f778182a-77e1-48a5-832a-0f010c192e39
    status: accepted
    candidate_group_id: 22f497ff-d640-47c0-85aa-09cd403c0993
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/peer-notebook/**
---

# Internal Repositories Module Interface Adoption: Broker Services Service Proxies Persistence Adapters

Scope: applies to `src/peer-notebook/**`.

These rules are ALWAYS ACTIVE for all subsystem components performing data storage, peer lookup, broker dispatch, and proxy routing, as well as implementations of data persistence adapters and storage client wrappers.

### Rules

- **R-REPO-001** MUST: All broker services, service proxies, and persistence adapters within the subsystem MUST interact through the internal repositories module contract interface rather than directly instantiating or querying concrete storage layers.

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
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated continuous integration pipeline executing repository contract tests and static type verification, and peer code review auditing module import boundaries.
</enforcement>