---
version: 2
name: cross-cutting-stateless-datastore-access-endpoints-val-b839
description: "Stateless Client Configuration for @supabase/supabase-js Primary Datastore Access: Stateless Datastore Access Endpoints Validate Incoming"
metadata:
  actual:
    adr_id: b839df08-84bf-4260-8be4-1a3a4ce3d5d6
    status: accepted
    candidate_group_id: 41eb9913-8fa1-452a-8799-65e21c795446
    evidence:
      source: deep
  scope:
    root: supabase
    paths:
      - functions/tb-branch/**
---

# Stateless Client Configuration for @supabase/supabase-js Primary Datastore Access: Stateless Datastore Access Endpoints Validate Incoming

Scope: applies to `supabase/functions/tb-branch/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-28-001** SHOULD: Stateless datastore access endpoints SHOULD validate incoming request authorization tokens and branch payloads through strict schema parsing prior to executing datastore operations.

### Verify

```bash
echo "Discover and run the project test verification script defined in repository configuration"
echo "Discover and execute project static analysis and linting scripts to verify datastore client instantiation patterns"
```

**Accept when:**
- Project verification test suite passes with zero errors.
- Static analysis confirms all primary datastore client initializations explicitly set session persistence and auto-refresh to false.
- No client instances persist authentication state across request lifecycles.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>