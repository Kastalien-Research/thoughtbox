---
name: knowledge
description: Unified cross-store knowledge query. Searches MEMORY.md, Thoughtbox knowledge graph, Beads issues, git history, and assumption registry in parallel, returning results with provenance.
argument-hint: <search query>
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, ToolSearch
---

Search all knowledge stores for: $ARGUMENTS

## Workflow

### Phase 1: Parallel Search (Observe)

Execute all searches in parallel:

1. **MEMORY.md**: Search the auto memory file at `.claude/projects/*/memory/MEMORY.md` for the query terms using Grep
2. **Thoughtbox Knowledge Graph**: Use ToolSearch to load `mcp__thoughtbox_gateway` tools, then search entities and observations matching the query
3. **Beads Issues**: Run `bd search "$ARGUMENTS"` to find matching issues
4. **Git History**: Run `git log --all --oneline --grep="$ARGUMENTS" -20` for commit history
5. **Assumption Registry**: Search `.assumptions/*.jsonl` for matching assumption records using Grep
6. **DGM Patterns**: Search `.dgm/fitness.json` for patterns matching the query using Grep
7. **Session Handoffs**: Search `.sessions/handoff-*.json` for relevant context using Grep

### Phase 2: Collate and Rank (Orient)

For each result found:
1. Note the **source store** (provenance)
2. Note the **freshness** (when was this last updated/verified)
3. Note the **relevance** (how closely does it match the query)
4. Check for **cross-references** (does this result reference other stores)

### Phase 3: Present Results (Act)

Present results grouped by relevance, with provenance:

```
## Knowledge Query: "{query}"

### High Relevance
- [MEMORY.md] {finding} (line {N}, updated {date})
- [Thoughtbox] Entity: {name} — {observation} (created {date})

### Medium Relevance
- [Beads] {issue-id}: {title} ({status})
- [Git] {commit-hash}: {message} ({date})

### Low Relevance
- [Assumptions] {assumption} (confidence: {N}%, last verified: {date})

### Cross-References
- MEMORY.md line {N} references Beads issue {id}
- Thoughtbox entity "{name}" relates to git commit {hash}

### Gaps
- No results found in: {store1}, {store2}
- Consider adding knowledge about "{query}" to {suggested_store}
```

## Notes

- If a store doesn't exist yet (e.g., `.dgm/fitness.json` not created), skip it silently
- If Thoughtbox MCP tools aren't available, skip the knowledge graph search
- Always show which stores were searched and which returned nothing — gaps are informative
- If the query is broad, suggest more specific sub-queries
