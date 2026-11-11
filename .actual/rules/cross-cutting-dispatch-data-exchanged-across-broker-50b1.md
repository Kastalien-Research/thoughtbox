---
version: 2
name: cross-cutting-dispatch-data-exchanged-across-broker-50b1
description: "Adoption of the broker-proxy Module for Peer Notebook Mediation: Dispatch Data Exchanged Across Broker Proxy"
metadata:
  actual:
    adr_id: 50b10df1-e53e-45a3-901d-1901a202ccff
    status: accepted
    candidate_group_id: 98235467-e9d2-476e-81fb-f5552d2809eb
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/peer-notebook/**
---

# Adoption of the broker-proxy Module for Peer Notebook Mediation: Dispatch Data Exchanged Across Broker Proxy

Scope: applies to `src/peer-notebook/**`.

These rules are ALWAYS ACTIVE for peer notebook runtime provider implementations, proxy target dispatch modules, and broker communication and coordination services.

### Rules

- **R-BRK-001** SHOULD: Dispatch data exchanged across the broker-proxy boundary SHOULD conform to normalized schema types and structured validation contracts.

### Verify

```bash
# Discover and run project static analysis, linting, and architecture boundary checker scripts
# Discover and execute repository unit and integration test suite
```

**Accept when:**
- Static analysis confirms zero direct coupling between runtime providers and proxy targets outside the broker-proxy interface.
- All unit and integration tests for broker dispatch and proxy target resolution complete without errors.
- Repository test and build suites succeed under clean execution.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated continuous integration pipeline execution checks module dependency boundaries, and pull requests introducing direct dependencies bypassing the broker-proxy module will be blocked.
</enforcement>