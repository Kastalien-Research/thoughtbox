---
version: 2
name: cross-cutting-downstream-domain-consumers-not-invoke-c5cb
description: "Polling Event Client Integration with event-types Module: Downstream Domain Consumers Not Invoke External"
metadata:
  actual:
    adr_id: c5cb2638-966c-4aa3-a460-520d0b9842a2
    status: accepted
    candidate_group_id: d6b817ed-9fc0-4473-a594-c5e736f863a4
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# Polling Event Client Integration with event-types Module: Downstream Domain Consumers Not Invoke External

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-POLL-001** MUST_NOT: Downstream domain consumers MUST NOT invoke external HTTP polling endpoints directly; all integration data MUST be received through emitted events.

### Verify

```bash
# Discover and execute the project integration test suite targeting the polling event adapter to verify cursor progression and event emission.
# Discover and execute the static type checking and linting tasks defined in the workspace scripts to validate contract compliance with the event-types module.
```

**Accept when:**
- Integration tests confirm that external fetch invocations correctly update cursor query parameters and trigger expected event emissions.
- Static analysis and test suites pass with zero errors across all boundary adapters.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>