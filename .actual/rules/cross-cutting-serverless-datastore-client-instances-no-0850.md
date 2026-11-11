---
version: 2
name: cross-cutting-serverless-datastore-client-instances-no-0850
description: "Stateless Client Configuration for @supabase/supabase-js Primary Datastore Access: Serverless Datastore Client Instances Not Retain"
metadata:
  actual:
    adr_id: 0850eb21-edd6-4a25-ad15-d42c997c305a
    status: accepted
    candidate_group_id: 41eb9913-8fa1-452a-8799-65e21c795446
    evidence:
      source: deep
  scope:
    root: supabase
    paths:
      - functions/tb-branch/**
---

# Stateless Client Configuration for @supabase/supabase-js Primary Datastore Access: Serverless Datastore Client Instances Not Retain

Scope: applies to `supabase/functions/tb-branch/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUP-001** MUST_NOT: Serverless datastore client instances MUST NOT retain in-memory user session state or share mutable authentication context across concurrent or subsequent runtime invocations.

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