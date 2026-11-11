---
version: 2
name: cross-cutting-consumers-implementing-dependencies-runt-7e6b
description: "Node Core Runtime Service Definition via URLSearchParams and File System Promises: Consumers Implementing Dependencies Runtime Platform Capabilities"
metadata:
  actual:
    adr_id: 7e6bc2cb-f7ba-4f35-b83b-126af5497346
    status: accepted
    candidate_group_id: 198555bc-f767-46e9-85f3-c718ac37fa95
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/cli/**
---

# Node Core Runtime Service Definition via URLSearchParams and File System Promises: Consumers Implementing Dependencies Runtime Platform Capabilities

Scope: applies to `plugins/thoughtbox-claude-code/src/cli/**`.

These rules are ALWAYS ACTIVE for configuration modules responsible for resolving service endpoints, boundary parameters, and CLI configuration routines interacting with asynchronous local configuration files and URL parameters.

### Rules

- **R-NODE-001** MUST: Consumers implementing dependencies or runtime platform capabilities MUST inspect the authoritative project dependency lock artifact to verify exact resolution before invoking APIs.

### Verify

```bash
# Discover the repository test runner script from the package configuration and run the unit test suite covering configuration boundary parsing.
npm test

# Discover the repository static analysis and linting script to verify compliance of asynchronous filesystem calls and URL parameter handling.
npm run lint
```

**Accept when:**
- All unit tests exercising configuration retrieval and URL parameter parsing execute and pass with zero failures.
- Static analysis checks pass without errors concerning unhandled promise rejections or unsafe deserialization.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>