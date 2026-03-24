Thoughtbox Issues (this repo)
These require changes to the MCP server, schema, or backend:

Clear-cut (Tier A):

Required fields friction — thoughtType not defaulting to 'reasoning' and nextThoughtNeeded not defaulting to true are validation schema issues in thought-handler.ts
extractLearnings() returning raw JSON — the learnings output is serialized JSON blobs, not human-readable prose. Bug in the persistence/knowledge layer
Branching thought number collision — "both branches got thoughtNumber 26" is a numbering logic bug in Thoughtbox, not a display bug
Observability tools exposed to agents — operator-facing tools (Prometheus, Grafana health checks) in the agent-facing namespace. Architecture issue in observability/ or operations-tool/
Full-text search missing — Supabase index gap; backend issue
Code Mode partial execution (no rollback) — code-mode/ execution atomicity issue
Design questions (need deliberation, but live in Thoughtbox):

Knowledge graph extraction barrier — createEntity + addRelation call overhead; tb.insight() shorthand would be a Thoughtbox API change
Session continuity across context windows — tb.session.resume() requiring the agent to already know the session ID; needs harness-level integration
Thought field as unstructured string shaping cognition — schema design choice with behavioral consequences
Thoughtbox narrative/tool description — what the tool says it is in the MCP prompt