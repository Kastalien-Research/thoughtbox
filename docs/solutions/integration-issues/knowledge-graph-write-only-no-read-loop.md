---
title: "Knowledge Graph Write-Only: No Read Loop"
slug: "knowledge-graph-write-only-no-read-loop"
date: "2026-02-10"
category: "integration-issues"
tags: ["knowledge-graph", "read-path", "context-injection", "annotation-stripping", "progressive-disclosure"]
module: "knowledge-gateway-integration"
symptoms:
  - "Knowledge graph accumulates 65K+ entities but agents never receive context"
  - "GATEWAY_DESCRIPTION missing knowledge, read_thoughts, get_structure operations"
  - "Resource annotations (audience, priority, title) silently stripped in content transform"
  - "importance_score values all 0.5 with no sort tiebreaker"
  - "knowledge_prime missing from available_actions error guidance"
severity: "high"
time_to_fix: "~2.5 hours"
pr: "https://github.com/Kastalien-Research/thoughtbox/pull/115"
---

## Problem

The Thoughtbox knowledge graph was **write-only**. A claude-hook wrote Insight entities to `graph.jsonl` on every tool call (130K lines, 65K entities), but no agent ever read this data back. Knowledge accumulated without informing future sessions.

### Root Causes

Four compounding issues prevented the read loop from working:

1. **No `knowledge_prime` action** — The KnowledgeHandler had write operations (`create_entity`, `add_observation`, `create_relation`) and raw reads (`get_entity`, `list_entities`), but nothing that returned a compact, context-appropriate digest for agent priming.

2. **Annotation stripping in server-factory** — The gateway-to-MCP content transform at `server-factory.ts:404-418` only forwarded `uri`, `mimeType`, and `text` from resource blocks, silently dropping `title` and `annotations`. This broke `audience: ['assistant']` targeting for profile priming and would break knowledge priming.

3. **GATEWAY_DESCRIPTION discrepancy** — The tool description agents see (`tool-descriptions.ts`) listed only 7 of 10 operation groups. `knowledge`, `read_thoughts`, and `get_structure` were documented in `GATEWAY_TOOL.description` (dead code for discovery) but not in the authoritative `GATEWAY_DESCRIPTION`.

4. **Sort tiebreaker missing** — `listEntities` sorted by `importance_score DESC` only, but all scores are 0.5 (inert), producing arbitrary ordering. Priming needs most-recent-first.

### Why It Wasn't Caught

- No unit tests for the knowledge module
- Annotation stripping was silent — no errors, just dropped data
- GATEWAY_DESCRIPTION discrepancy never noticed because the tool still "worked"
- `importance_score` inertness never validated

## Solution

### Fix 1: Preserve resource title and annotations (server-factory.ts)

```typescript
} else if (block.type === "resource") {
  return {
    type: "resource" as const,
    resource: {
      uri: block.resource.uri,
      mimeType: block.resource.mimeType,
      text: block.resource.text,
      ...(block.resource.title ? { title: block.resource.title } : {}),
    },
    ...(block.resource.annotations
      ? { annotations: block.resource.annotations as {
            audience?: ("assistant" | "user")[];
            priority?: number
          } }
      : {}),
  };
}
```

### Fix 2: Add knowledge_prime action (knowledge/handler.ts)

Returns compact markdown suitable for context injection:

```typescript
private async handlePrime(args: any): Promise<{ content: Array<any> }> {
  const limit = args.limit ?? 15;
  const entities = await this.storage.listEntities({
    types: args.types, created_after: args.since ? new Date(args.since) : undefined, limit,
  });
  if (entities.length === 0) {
    return { content: [{ type: 'text', text: 'No knowledge graph entities found.' }] };
  }
  const lines = entities.map(e => `- **${e.name}** [${e.type}]: ${e.label}`);
  const stats = await this.storage.getStats();
  const header = `## Prior Knowledge (${entities.length} of ${totalEntities} entities)`;
  return { content: [{ type: 'text', text: [header, '', ...lines].join('\n') }] };
}
```

### Fix 3: Auto-inject into cipher response (gateway-handler.ts)

One-shot per session, gated by scoped key in `sessionsPrimed`. Key insight from review: only mark primed **after successful injection**, not on error or empty graph — otherwise a transient failure permanently suppresses retries for that session.

```typescript
if (operation === 'cipher' && this.knowledgeHandler) {
  const key = `${mcpSessionId ?? '__default__'}:knowledge`;
  if (!this.sessionsPrimed.has(key)) {
    try {
      const primeResult = await this.knowledgeHandler.processOperation({
        action: 'knowledge_prime', limit: 15,
      });
      if (!primeResult.isError && primeResult.content[0]?.text
          && !primeText.startsWith('No knowledge graph entities')) {
        result.content.push({
          type: 'resource',
          resource: {
            uri: 'thoughtbox://knowledge/priming',
            title: 'Knowledge Graph Context',
            mimeType: 'text/markdown',
            text: primeText,
            annotations: { audience: ['assistant'], priority: 0.6 },
          },
        });
        this.sessionsPrimed.add(key);  // Only after successful injection
      }
    } catch (err) {
      console.warn(`[Knowledge] Priming failed: ${(err as Error).message}`);
    }
  }
}
```

### Fix 4: Clean up scoped priming keys (gateway-handler.ts)

Greptile caught that `clearSession()` only deleted the base key, not the `:knowledge` suffix:

```typescript
clearSession(mcpSessionId: string): void {
  this.sessionAgentIds.delete(mcpSessionId);
  this.sessionAgentNames.delete(mcpSessionId);
  this.sessionsPrimed.delete(mcpSessionId);
  this.sessionsPrimed.delete(`${mcpSessionId}:knowledge`);  // <-- added
  this.sessionStages.delete(mcpSessionId);
}
```

### Fix 5: Sort tiebreaker (knowledge/storage.ts)

```sql
ORDER BY importance_score DESC, created_at DESC
```

### Fix 6: Validate date input in knowledge_prime (knowledge/handler.ts)

Invalid `since` dates would silently produce empty results (NaN bound into SQL). Now validates eagerly:

```typescript
if (args.since) {
  const parsed = new Date(args.since);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date for 'since': ${args.since}`);
  }
  since = parsed;
}
```

### Fix 7: Defensive stats shape (knowledge/handler.ts)

`getStats()` could return null-ish fields on partial init, crashing `Object.values().reduce()`:

```typescript
const entityCounts = stats.entity_counts ?? {};
const relationCounts = stats.relation_counts ?? {};
const totalEntities = Object.values(entityCounts).reduce((a: number, b: number) => a + b, 0);
const totalRelations = Object.values(relationCounts).reduce((a: number, b: number) => a + b, 0);
```

### Fix 8: GATEWAY_DESCRIPTION and available_actions alignment

- Added `knowledge`, `read_thoughts`, `get_structure` to `GATEWAY_DESCRIPTION` in `tool-descriptions.ts`
- Added `knowledge_prime` to the `available_actions` error guidance in `gateway-handler.ts`

## Files Changed

| File | Change |
|------|--------|
| `src/server-factory.ts` | Preserve resource.title and annotations in content transform |
| `src/gateway/gateway-handler.ts` | Auto-inject knowledge priming on cipher; clean up scoped keys; add knowledge_prime to available_actions |
| `src/knowledge/handler.ts` | New knowledge_prime action with handlePrime() |
| `src/knowledge/operations.ts` | knowledge_prime in operations catalog |
| `src/knowledge/storage.ts` | created_at DESC tiebreaker |
| `src/tool-descriptions.ts` | GATEWAY_DESCRIPTION alignment |
| `CLAUDE.md` | Bootstrap docs |
| `.claude/team-prompts/_thoughtbox-process.md` | Cipher annotation |

## Prevention Strategies

1. **Test resource block roundtrips** — Any content transform should have a test verifying ALL fields survive (uri, mimeType, text, title, annotations).

2. **Test description-implementation alignment** — Cross-check `GATEWAY_DESCRIPTION` against actual registered operations. When adding a new action, update ALL discovery surfaces (description, available_actions, operations catalog).

3. **Test read-write symmetry** — For every write operation, verify data is retrievable. Write-only accumulation is a code smell.

4. **Test one-shot gating cleanup** — When using scoped keys in a Set, verify `clearSession()` deletes all key variants.

5. **Test sort stability** — When a sort column has degenerate values (all identical), verify a tiebreaker produces deterministic ordering.

6. **Only mark one-shot gating after success** — When using a Set to gate one-shot behavior, add the key only after the gated action succeeds. Adding it unconditionally (in try, before catch) means a transient failure permanently suppresses retries.

7. **Validate external inputs at system boundary** — Date strings from agents are external input. Always validate `new Date()` results with `isNaN(getTime())` before passing to storage queries.

8. **Defensive defaults on aggregation** — When reducing over object values (`Object.values().reduce()`), guard against null/undefined shapes with `?? {}`.

## Related

- PR #115: https://github.com/Kastalien-Research/thoughtbox/pull/115
- Plan: `docs/plans/2026-02-10-feat-knowledge-graph-read-loop-plan.md`
- Spec: `dgm-specs/SPEC-KNOWLEDGE-MEMORY.md`
- Profile priming pattern: `src/hub/profile-primer.ts`
- Issue thoughtbox-308: Profile priming bloat (same sessionsPrimed pattern)
