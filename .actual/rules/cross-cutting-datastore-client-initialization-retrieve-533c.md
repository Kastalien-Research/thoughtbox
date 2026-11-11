---
version: 2
name: cross-cutting-datastore-client-initialization-retrieve-533c
description: "Stateless Client Configuration for @supabase/supabase-js Primary Datastore Access: Datastore Client Initialization Retrieve Connection Endpoints"
metadata:
  actual:
    adr_id: 533c8306-f2f8-4206-8d85-853f7e301e2c
    status: accepted
    candidate_group_id: 41eb9913-8fa1-452a-8799-65e21c795446
    evidence:
      source: deep
  scope:
    root: supabase
    paths:
      - functions/tb-branch/**
---

# Stateless Client Configuration for @supabase/supabase-js Primary Datastore Access: Datastore Client Initialization Retrieve Connection Endpoints

Scope: applies to `supabase/functions/tb-branch/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUP-001** MUST: Datastore client initialization MUST retrieve datastore connection endpoints and service credentials exclusively from runtime environment configuration rather than hardcoded literals or client-supplied parameters.

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