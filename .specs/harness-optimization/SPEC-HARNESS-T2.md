# SPEC-HARNESS-T2: Server Defaults — Tier 2

## Summary

Tier 2 reduces per-call friction in the Thoughtbox MCP server by making two high-frequency fields optional with sensible defaults, adding automatic session resumption, and surfacing lightweight evolution signals in thought responses. All changes are backward compatible — existing clients that supply explicit values are unaffected.

Origin: 46-thought capability audit (session 184c3381).

## Changes

### 1. Default `thoughtType` to `"reasoning"`

**Problem:** `thoughtType` is required on every `tb.thought()` call. Agents use `"reasoning"` ~90% of the time.

**Solution:** Make `thoughtType` optional in the Zod schema. Default to `"reasoning"` when omitted. All structured types (`decision_frame`, `belief_snapshot`, etc.) still require explicit specification and their discriminated validation remains unchanged.

#### Schema change (src/thought/tool.ts)

Before:
```ts
thoughtType: z.enum([
  "reasoning", "decision_frame", "action_report",
  "belief_snapshot", "assumption_update", "context_snapshot", "progress"
]).describe("The structured type of this thought"),
```

After:
```ts
thoughtType: z.enum([
  "reasoning", "decision_frame", "action_report",
  "belief_snapshot", "assumption_update", "context_snapshot", "progress"
]).optional().default("reasoning")
  .describe("The structured type of this thought. Defaults to 'reasoning' when omitted"),
```

#### SDK types change (src/code-mode/sdk-types.ts)

Before:
```ts
thoughtType: "reasoning" | "decision_frame" | ...;
```

After:
```ts
thoughtType?: "reasoning" | "decision_frame" | ...;
```

#### Handler change (src/thought-handler.ts)

The handler already defaults `thoughtType` to `"reasoning"` at line 389:
```ts
const thoughtType = (data.thoughtType as ThoughtData['thoughtType']) ?? 'reasoning';
```

No handler logic change required — the existing default is already correct. The Zod schema change means the field no longer fails validation when omitted.

### 2. Default `nextThoughtNeeded` to `true`

**Problem:** `nextThoughtNeeded` is required on every call. Agents set it to `true` ~95% of the time.

**Solution:** Make `nextThoughtNeeded` optional with default `true`. Setting to `false` still closes the session (existing behavior preserved).

#### Schema change (src/thought/tool.ts)

Before:
```ts
nextThoughtNeeded: z.boolean().describe("Whether another thought is needed to complete the reasoning step"),
```

After:
```ts
nextThoughtNeeded: z.boolean().optional().default(true)
  .describe("Whether another thought is needed. Defaults to true. Set to false to close the session"),
```

#### Handler change (src/thought-handler.ts)

Line 349 — update validation to apply default:

Before:
```ts
if (typeof data.nextThoughtNeeded !== "boolean") {
  throw new Error("Invalid nextThoughtNeeded: must be a boolean");
}
```

After:
```ts
if (data.nextThoughtNeeded === undefined) {
  data.nextThoughtNeeded = true;
} else if (typeof data.nextThoughtNeeded !== "boolean") {
  throw new Error("Invalid nextThoughtNeeded: must be a boolean");
}
```

The `ThoughtData` interface (line 31) changes from `nextThoughtNeeded: boolean` to `nextThoughtNeeded?: boolean`. All downstream code that reads `nextThoughtNeeded` treats it as boolean after validation, so no further changes are needed.

#### SDK types change (src/code-mode/sdk-types.ts)

Before:
```ts
nextThoughtNeeded: boolean;
```

After:
```ts
nextThoughtNeeded?: boolean;
```

### 3. Auto-resume Most Recent Active Session

**Problem:** When an agent starts a new conversation, it must manually look up and resume its previous session. First `tb.thought()` call without `sessionTitle` creates a new session instead of continuing prior work.

**Solution:** When the first `tb.thought()` call arrives with no `sessionTitle` and no active session, attempt to find and resume the most recent active session for the current project before falling back to creating a new one.

#### Logic (src/thought-handler.ts, in `_processThoughtImpl`)

Current flow at the "Auto-create session" block (line 693):
```
if (!this.currentSessionId) {
  // Always creates a new session
}
```

New flow:
```ts
if (!this.currentSessionId) {
  // T2: Auto-resume if no sessionTitle provided
  if (!validatedInput.sessionTitle) {
    const activeSessions = await this.storage.listSessions({
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      limit: 1,
    });
    const candidate = activeSessions.find(s => s.status === 'active');
    if (candidate) {
      await this.loadSession(candidate.id);
      // loadSession sets this.currentSessionId, restores thoughtHistory
    }
  }

  // If still no session (no active found, or sessionTitle provided), create new
  if (!this.currentSessionId) {
    const session = await this.storage.createSession({
      title:
        validatedInput.sessionTitle ||
        this.generateSessionTitle(validatedInput.thought),
      tags: validatedInput.sessionTags || [],
    });
    this.currentSessionId = session.id;
    this.thoughtHistory = [];
    this.branches = {};
    // ... existing observatory + event emitter code ...
  }
}
```

#### Constraints

- Only auto-resume if ALL conditions are met:
  1. No `sessionTitle` provided (explicit title signals "new session")
  2. No session currently active (`this.currentSessionId === null`)
  3. An active session exists in storage for this project
- If multiple active sessions exist, the `listSessions` sort by `updatedAt` desc picks the most recent
- If no active sessions exist, falls through to create a new session
- Resumed session's `thoughtNumber` continues from where it left off (auto-assignment via SIL-102 handles this after `loadSession` restores `thoughtHistory`)
- The response includes the resumed `sessionId` so the agent knows which session was picked

#### Filter behavior

The `listSessions` call uses `sortBy: 'updatedAt'` but does NOT filter by `status: 'active'` because `SessionFilter` does not currently support status filtering. The result is filtered in-memory with `.find(s => s.status === 'active')`. If `SessionFilter` gains a `status` field later, the filter can move to the query.

### 4. Evolution Signal in Thought Response

**Problem:** Agents don't know when a new thought relates to a prior thought in the same session. Connecting ideas requires manually reviewing the full session history.

**Solution:** After saving a thought, run lightweight deterministic candidate detection against prior thoughts in the session. Include results in the response when candidates exist.

#### New file: src/thought/evolution.ts

```ts
export interface EvolutionCandidate {
  thoughtNumber: number;
  reason: string;
  overlap: number;
}

export interface EvolutionSignal {
  candidates: EvolutionCandidate[];
}

const MIN_WORD_LENGTH = 7;
const MIN_OVERLAP = 0.15;
const MAX_CANDIDATES = 5;
const MIN_THOUGHTS_FOR_EVOLUTION = 3;

/**
 * Extract significant words from text (length > 6 chars, lowercased, deduplicated).
 */
function extractSignificantWords(text: string): Set<string> {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  return new Set(words.filter(w => w.length >= MIN_WORD_LENGTH));
}

/**
 * Compute word overlap ratio between two word sets.
 * Ratio = |intersection| / |smaller set|
 */
function computeOverlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  const smaller = a.size <= b.size ? a : b;
  const larger = a.size <= b.size ? b : a;
  for (const word of smaller) {
    if (larger.has(word)) intersection++;
  }
  return intersection / smaller.size;
}

/**
 * Detect evolution candidates for a new thought against prior session thoughts.
 *
 * Returns null (not empty signal) when no candidates found or when
 * there are fewer than MIN_THOUGHTS_FOR_EVOLUTION prior thoughts.
 *
 * Completes in O(n * m) where n = prior thoughts, m = avg word count.
 * For typical sessions (<200 thoughts), this is well under 100ms.
 */
export function detectEvolutionCandidates(
  newThoughtText: string,
  priorThoughts: Array<{ thoughtNumber: number; thought: string }>,
): EvolutionSignal | null {
  if (priorThoughts.length < MIN_THOUGHTS_FOR_EVOLUTION) return null;

  const newWords = extractSignificantWords(newThoughtText);
  if (newWords.size === 0) return null;

  const candidates: EvolutionCandidate[] = [];

  for (const prior of priorThoughts) {
    const priorWords = extractSignificantWords(prior.thought);
    const overlap = computeOverlap(newWords, priorWords);
    if (overlap > MIN_OVERLAP) {
      candidates.push({
        thoughtNumber: prior.thoughtNumber,
        reason: "high topic overlap",
        overlap: Math.round(overlap * 100) / 100,
      });
    }
  }

  if (candidates.length === 0) return null;

  // Sort by overlap descending, cap at MAX_CANDIDATES
  candidates.sort((a, b) => b.overlap - a.overlap);
  return {
    candidates: candidates.slice(0, MAX_CANDIDATES),
  };
}
```

#### Handler integration (src/thought-handler.ts)

After the thought is saved and in-memory state is updated, before building the response:

```ts
import { detectEvolutionCandidates, type EvolutionSignal } from "./thought/evolution.js";

// In _processThoughtImpl, after thought persistence and before response building:

// T2: Evolution signal detection
let evolution: EvolutionSignal | null = null;
if (this.currentSessionId) {
  const priorThoughts = this.thoughtHistory
    .filter(t => !t.branchId && t !== validatedInput)
    .map(t => ({
      thoughtNumber: t.thoughtNumber ?? 0,
      thought: t.thought,
    }));
  evolution = detectEvolutionCandidates(validatedInput.thought, priorThoughts);
}
```

#### Response shape

**Minimal response** (default, `verbose: false`):

When evolution candidates exist:
```json
{
  "thoughtNumber": 55,
  "sessionId": "abc-123",
  "evolution": {
    "candidates": [
      { "thoughtNumber": 5, "reason": "high topic overlap", "overlap": 0.18 }
    ]
  }
}
```

When no candidates: the `evolution` field is absent (not present with an empty array).

**Verbose response** (`verbose: true`):

Same — `evolution` is added to the verbose payload when present, absent when not.

**Session-closing response** (`nextThoughtNeeded: false`):

Same — `evolution` is added to the closing response payload when present.

#### Performance

- Word extraction: single regex pass, O(n) on text length
- Set intersection: O(min(|A|, |B|)) per comparison
- Total: O(prior_count * avg_word_count)
- For a 200-thought session with 50-word thoughts: ~10,000 set lookups, well under 1ms
- The `MIN_THOUGHTS_FOR_EVOLUTION = 3` guard skips the first 3 thoughts entirely

## Files Modified

| File | Changes |
|------|---------|
| `src/thought/tool.ts` | `thoughtType` and `nextThoughtNeeded` become `.optional().default(...)` |
| `src/thought-handler.ts` | Default `nextThoughtNeeded` in validation, auto-resume logic, evolution signal detection + response integration |
| `src/code-mode/sdk-types.ts` | `thoughtType` and `nextThoughtNeeded` become optional in `TB` interface |
| `src/thought/evolution.ts` | **New file** — deterministic evolution candidate detection |

## Testing Plan

### 1. Default `thoughtType`

- **T2-1a**: Call `tb.thought({ thought: "test", nextThoughtNeeded: true })` without `thoughtType`. Verify thought is saved with `thoughtType: "reasoning"`.
- **T2-1b**: Call with explicit `thoughtType: "decision_frame"` plus required metadata. Verify it works unchanged.
- **T2-1c**: Call with explicit `thoughtType: "reasoning"`. Verify no regression.
- **T2-1d**: Call with invalid `thoughtType: "invalid_type"`. Verify Zod validation rejects it.

### 2. Default `nextThoughtNeeded`

- **T2-2a**: Call `tb.thought({ thought: "test" })` omitting `nextThoughtNeeded`. Verify defaults to `true`, session stays open.
- **T2-2b**: Call with `nextThoughtNeeded: false`. Verify session closes (existing behavior).
- **T2-2c**: Call with `nextThoughtNeeded: true`. Verify no regression.
- **T2-2d**: Call with `nextThoughtNeeded: "not_a_boolean"`. Verify validation rejects it.

### 3. Auto-resume session

- **T2-3a**: Start fresh (no active sessions). Call `tb.thought()` without `sessionTitle`. Verify a new session is created.
- **T2-3b**: Leave a session active (don't close it). Start new handler instance. Call `tb.thought()` without `sessionTitle`. Verify the active session is resumed and `thoughtNumber` continues correctly.
- **T2-3c**: Leave a session active. Call `tb.thought({ sessionTitle: "New Topic" })`. Verify a NEW session is created (not resumed).
- **T2-3d**: Have multiple active sessions. Call `tb.thought()` without `sessionTitle`. Verify the most recently updated one is resumed.
- **T2-3e**: All sessions are completed. Call `tb.thought()` without `sessionTitle`. Verify a new session is created.

### 4. Evolution signal

- **T2-4a**: Submit 5 thoughts on the same topic. Verify the 4th and 5th thought responses include `evolution.candidates` with overlap values > 0.15.
- **T2-4b**: Submit 2 thoughts. Verify no `evolution` field in response (below MIN_THOUGHTS_FOR_EVOLUTION).
- **T2-4c**: Submit thoughts on completely different topics (no word overlap). Verify no `evolution` field.
- **T2-4d**: Verify `evolution.candidates` are sorted by overlap descending.
- **T2-4e**: Submit 20 related thoughts. Verify `evolution.candidates` is capped at 5 entries.
- **T2-4f**: Performance: submit 200 thoughts in a session. Verify the 200th thought response completes in <100ms.
- **T2-4g**: Branch thoughts are excluded from evolution comparison (only main-chain thoughts compared).

### Combined

- **T2-5a**: Call `tb.thought({ thought: "analyzing the problem" })` — no `thoughtType`, no `nextThoughtNeeded`, no `sessionTitle`. Verify: `thoughtType` defaults to `"reasoning"`, `nextThoughtNeeded` defaults to `true`, session is auto-resumed (if active exists) or created.

## Migration/Compatibility

All changes are **fully backward compatible**:

1. **Existing clients that pass `thoughtType` explicitly** — no change in behavior. The Zod `.optional().default("reasoning")` means the field is populated before reaching the handler.
2. **Existing clients that pass `nextThoughtNeeded` explicitly** — no change in behavior.
3. **Existing clients that pass `sessionTitle`** — always creates a new session (auto-resume is bypassed).
4. **Evolution signal** — the `evolution` field is a new optional response field. Clients that don't read it are unaffected. Clients that parse the JSON strictly should accept unknown fields (standard MCP practice).
5. **Persistence format** — no schema changes to stored data. `ThoughtData` in `src/persistence/types.ts` already has `thoughtType` as required (post-validation), so stored thoughts always have an explicit value.
6. **`action_receipt` type** — Note: The Zod schema in `tool.ts` (line 75-78) does not include `"action_receipt"` in the enum, but the handler validates it (line 459). This is a pre-existing gap. Tier 2 does not fix it (out of scope) but does not make it worse. The `.optional().default("reasoning")` change applies only to the existing enum values.

## Rollback Plan

Each change is independently revertible:

1. **Default `thoughtType`**: Remove `.optional().default("reasoning")` from Zod schema, restore `.describe()`. Handler already has the `?? 'reasoning'` fallback so the handler change is zero.
2. **Default `nextThoughtNeeded`**: Remove `.optional().default(true)` from Zod schema. Restore strict `typeof` check in handler validation. Change `ThoughtData.nextThoughtNeeded` back to required.
3. **Auto-resume**: Remove the `listSessions` + `loadSession` block from `_processThoughtImpl`. The create-new-session fallback remains.
4. **Evolution signal**: Delete `src/thought/evolution.ts`. Remove the `detectEvolutionCandidates` call and `evolution` field from response payloads.

All rollbacks are single-commit operations with no data migration required.
