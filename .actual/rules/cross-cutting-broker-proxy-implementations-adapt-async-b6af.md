---
version: 2
name: cross-cutting-broker-proxy-implementations-adapt-async-b6af
description: "Adoption of the broker-proxy Module for Peer Notebook Mediation: Broker Proxy Implementations Adapt Asynchronous Dispatch"
metadata:
  actual:
    adr_id: b6af8891-e369-40f9-bff3-51241b3ad1e9
    status: accepted
    candidate_group_id: 98235467-e9d2-476e-81fb-f5552d2809eb
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/peer-notebook/**
---

# Adoption of the broker-proxy Module for Peer Notebook Mediation: Broker Proxy Implementations Adapt Asynchronous Dispatch

Scope: applies to `src/peer-notebook/**`.

These rules are ALWAYS ACTIVE for peer notebook runtime provider implementations, proxy target dispatch modules, and broker communication and coordination services.

### Rules

- **R-ADR-001** MAY: Broker proxy implementations MAY adapt asynchronous dispatch streams to accommodate heterogeneous runtime provider execution models.
- **R-ADR-002** MANDATORY: New proxy target implementations MUST register their interfaces and dispatch contracts through the broker-proxy abstraction.
- **R-ADR-003** MANDATORY: Maintain shared data and message contracts in dedicated type definitions aligned with the broker-proxy module requirements.

### Verify

```bash
# Discover and run project static analysis and linting scripts to verify broker-proxy boundary constraints
# Discover and execute repository unit and integration test suite to validate broker-proxy dispatch and mediation behavior
# Discover and run architecture boundary checker script to detect unauthorized direct dependencies
```

**Accept when:**
- Static analysis confirms zero direct coupling between runtime providers and proxy targets outside the broker-proxy interface.
- All unit and integration tests for broker dispatch and proxy target resolution complete without errors.
- Repository test and build suites succeed under clean execution.

<enforcement>
Claude Code MUST NOT skip or defer verification. Continuous integration pipeline execution checks module dependency boundaries, and violations will block pull requests or require post-merge refactoring.
</enforcement>