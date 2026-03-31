# 04: Cross-Session Continuity

**Status**: Draft v0.2
**Updated**: 2026-02-11
**Context**: Thoughtbox Engineering System -- Kastalien Research
**Parent**: [00-overview.md](./00-overview.md) (Gap 4)
**Related Specs**: SPEC-SIL-103 (Session Continuity), SPEC-003 (Cross-Session References)

---

## Problem Statement

Every Claude Code session starts cold. The agent receives MEMORY.md (capped at ~200 lines) and a git status snapshot, then must reconstruct the reasoning context of the previous session from scratch. This creates four compounding costs:

1. **Reasoning chain loss**. A session spends 30 minutes building hypotheses through Thoughtbox thoughts, then ends. The next session has no direct access to that reasoning chain. Key decisions, eliminated alternatives, and partial conclusions vanish unless someone manually distills them into MEMORY.md -- which is itself constrained and optimized for structural knowledge, not reasoning state.

2. **Context rebuilding overhead**. Every session spends 2-5 minutes re-reading files, re-checking git status, re-loading MCP tools via ToolSearch, and re-orienting to the current work. Across 10 sessions per day, this is 20-50 minutes of pure waste -- time spent rediscovering what the previous session already knew.

3. **Partial work fragmentation**. Complex multi-step tasks (spec implementation, multi-file refactors, agent team coordination) get interrupted by session boundaries. The next session must reconstruct what was done, what remains, what approach was being taken, and what failed. This reconstruction is error-prone: agents frequently repeat failed approaches because there is no record that they were already tried.

4. **Observatory amnesia**. The Observatory's session store (`InMemorySessionStore` in `src/observatory/channels/reasoning.ts`) holds all session activity in Maps. On server restart, everything is lost. This is documented as hypothesis H9 in the Observatory Native Primitives work (workspace `5a4755ae`).

These problems interact. An agent cannot resume a reasoning chain (problem 1) because there is no handoff protocol. It cannot skip context rebuilding (problem 2) because there is no structured state to load. It cannot avoid repeating mistakes (problem 3) because failed approaches are not recorded in a machine-readable format. And it cannot query historical Observatory data (problem 4) because the store is volatile.

### Prior Art: File-Based External Memory

Two external projects demonstrate that file-based external memory is the critical enabler for cross-session continuity in agentic systems:

**Carlini C Compiler Project.** Nicholas Carlini's experiment building a C compiler with LLM agents used `progress.md` files and structured logs that agents read at startup. Each session wrote a structured state file describing what was done, what test cases passed, and what the next compilation target should be. The incoming agent read this file and resumed work without re-deriving context. The key insight: **the handoff file is a structured contract between the outgoing agent and the incoming one**, not a general-purpose note.

**Letta/MemGPT Trajectory Storage.** The Letta system stores skill trajectories as `.md` files -- not just what was decided, but the reasoning path that led there. This preserves the "why" alongside the "what," enabling future agents to evaluate whether a previous decision's premises still hold. When premises change, the agent can re-derive rather than blindly following stale conclusions.

Thoughtbox should adopt both patterns: a structured handoff file (Carlini) that includes reasoning trajectories (Letta), not just outcomes.

---

## Current State Analysis

### What Exists

| Mechanism | What It Provides | Cross-Session? | Reasoning-Level? |
|-----------|-----------------|---------------|------------------|
| **MEMORY.md** | Project structure, gotchas, behavioral rules, process violations | Yes (persistent file) | No (structural only, ~200-line cap) |
| **Beads** | Issue tracking, `bd ready` for available work, `bd prime` on session start | Yes (SQLite + JSONL) | No (task-level only) |
| **Thoughtbox** | Sessions, thoughts (reasoning chains), knowledge graph, session resume | Yes (file-backed via `FileSystemStorage`) | Yes, but no auto-resume protocol |
| **Observatory** | Hub events, session activity, real-time WebSocket channels | No (in-memory only) | Partially (captures thought events) |
| **Git** | Branches, stashes, uncommitted changes, commit history | Yes (persistent) | No (code-level only) |
| **Hooks** | SessionStart (`session_start.sh`), SessionEnd (`session_end_memory.sh`), PreCompact (`pre_compact.sh`), Stop (`stop.sh` for LangSmith) | Hooks fire automatically | No handoff data captured |
| **Knowledge Graph** | Entities, relations, observations via MCP | Yes (server-side persistence) | Partially (captured observations) |

### What Is Missing

1. **No structured handoff file.** When a session ends, no machine-readable record of its state is written. The `session_end_memory.sh` hook prompts the agent to reflect but does not capture state automatically.

2. **No session start recovery beyond Beads.** The `session_start.sh` hook loads git info and GitHub issues but has no awareness of Thoughtbox sessions, reasoning chains, or Observatory state.

3. **No automatic Thoughtbox session resume.** The `session { operation: "resume" }` MCP operation exists but is never invoked automatically. Agents must manually discover and resume previous sessions.

4. **No Observatory persistence.** The `InMemorySessionStore` singleton (`sessionStore` in `reasoning.ts`, line 164) uses `Map<string, Session>`, `Map<string, Thought[]>`, and `Map<string, Record<string, Branch>>` -- all volatile.

5. **No OODA loop state capture.** When a session is mid-loop (e.g., observed a problem, oriented on it, decided on an approach, but has not yet acted), the loop state is implicit in the conversation. It is not externalized anywhere.

6. **No failed-approach registry.** MEMORY.md records what works. It does not systematically record what was tried and failed, leading to repeated attempts at approaches already known to be dead ends.

7. **No hypothesis persistence.** HDD hypotheses (H1-H9 for Observatory work, for example) are recorded in Thoughtbox sessions and MEMORY.md manually. There is no structured hypothesis registry that tracks status, confidence, evidence, and counter-evidence across sessions.

### What Works Well (Preserve These)

- **MEMORY.md** as a human-curated, high-signal knowledge store. It should remain authoritative for structural knowledge. The handoff system complements it, does not replace it.
- **Beads** for task-level continuity. `bd ready` and `bd prime` already give sessions a work queue. The handoff system integrates with Beads, does not duplicate it.
- **Thoughtbox session resume** as an MCP operation. The mechanism exists; it just needs to be invoked automatically.
- **FileSystemStorage** for Thoughtbox persistence. Sessions and thoughts are already written to disk under `~/.thoughtbox/projects/<project>/sessions/`. The persistence infrastructure exists.
- **Hook infrastructure.** SessionStart and SessionEnd hooks already fire. The handoff system uses this existing machinery.

---

## Session End Protocol

### Trigger

The Session End Protocol activates in two scenarios:

1. **Stop hook** fires (normal session completion).
2. **PreCompact hook** fires (context window full, about to compact). This is important because compaction destroys reasoning state.

### Capture Steps

The hook script (`.claude/hooks/session_end_handoff.sh`) performs the following captures. Steps 1-3 are automatic and require no agent cooperation. Steps 4-7 are agent-cooperative and may be absent for interrupted sessions.

**Step 1: Git State (Automatic)**

```json
{
  "branch": "fix/observatory-workspace-events",
  "uncommittedFiles": 3,
  "stagedFiles": 1,
  "stashCount": 0,
  "lastCommit": {
    "sha": "e291586",
    "message": "fix(types): add workspace_created to HubEvent type",
    "timestamp": "2026-02-11T14:30:00Z"
  }
}
```

Collected via: `git branch --show-current`, `git status --porcelain`, `git stash list`, `git log -1 --format=json`.

**Step 2: Beads State (Automatic)**

```json
{
  "openIssues": [
    { "id": "thoughtbox-308", "title": "Profile priming on every thought call", "priority": "P1", "status": "open" }
  ],
  "inProgress": [],
  "recentlyClosed": []
}
```

Collected via: `bd list --json --status open`, `bd list --json --status in-progress`.

**Step 3: Thoughtbox Session State (Automatic)**

```json
{
  "activeSessionId": "621b47fb-...",
  "sessionTitle": "Observatory Native Primitives H1-H9",
  "thoughtCount": 14,
  "lastThoughtNumber": 14,
  "branches": ["alt-approach", "security-review"],
  "keyThoughtIds": [1, 3, 7, 14],
  "tags": ["observatory", "hypothesis-testing"]
}
```

Collected via: reading the most recent session manifest from `~/.thoughtbox/projects/<project>/sessions/`. The hook reads the filesystem directly (not via MCP) because MCP may not be available at session end. The `FileSystemStorage` directory structure (`sessions/<partition>/<uuid>/manifest.json`) is stable and documented in `src/persistence/filesystem-storage.ts`.

Fallback: if the filesystem read fails, fall back to MCP call to `session { operation: "get", args: { sessionId: "<active>" } }`.

**Step 4: OODA Loop State (Agent-Cooperative)**

This requires agent cooperation. The handoff hook outputs an `additionalContext` prompt asking the agent to provide:

```json
{
  "phase": "decide",
  "observation": "Observatory InMemorySessionStore loses data on restart",
  "orientation": "Need file-backed store. Three options: JSONL append, SQLite, or piggyback on Thoughtbox storage",
  "decision": "JSONL append -- simplest, aligns with Beads pattern",
  "pendingAction": "Implement FileBackedSessionStore in src/observatory/channels/reasoning.ts",
  "confidence": 0.7
}
```

If the agent does not provide this (session interrupted, PreCompact with no agent turn), the field is `null` and the next session must reconstruct OODA state from git diff and Thoughtbox thoughts.

**Step 5: Open Hypotheses (Agent-Cooperative)**

Agent-provided. The hook prompts for structured hypothesis state:

```json
{
  "hypotheses": [
    {
      "id": "H9",
      "statement": "Observatory session store can be made persistent with JSONL append",
      "status": "testing",
      "confidence": 0.7,
      "evidence": ["InMemorySessionStore already has queue-based updates", "Beads uses similar pattern"],
      "counterEvidence": [],
      "nextStep": "Implement FileBackedSessionStore",
      "originSession": "621b47fb-...",
      "originThought": 3
    }
  ]
}
```

**Step 6: Reasoning Trajectory (Agent-Cooperative)**

This is the Letta-inspired addition. The agent provides a compressed narrative of the reasoning path, not just the final decision:

```json
{
  "trajectory": "Started with H9: Observatory persistence needed. Considered three options: (1) SQLite -- rejected because Thoughtbox already uses InMemoryStorage and adding SQLite creates dependency divergence. (2) Piggyback on FileSystemStorage -- rejected because Observatory sessions have different lifecycle than Thoughtbox sessions and coupling them creates cleanup complexity. (3) JSONL append -- chosen because it matches the Beads pattern, is crash-recoverable, and requires no schema. The key insight was that the Observatory SessionStore interface is narrow enough (setSession, addThought, addBranchThought) that JSONL is sufficient.",
  "eliminatedAlternatives": [
    { "option": "SQLite for Observatory sessions", "reason": "Dependency divergence from Thoughtbox storage" },
    { "option": "Piggyback on FileSystemStorage", "reason": "Lifecycle coupling creates cleanup complexity" }
  ]
}
```

This trajectory is the highest-value field for long-running investigations. It preserves the reasoning structure that led to the current state, allowing the next session to evaluate whether the premises still hold rather than blindly continuing.

**Step 7: Failed Approaches (Agent-Cooperative)**

Agent-provided. This is the most important field for preventing repeated failures:

```json
{
  "failedApproaches": [
    {
      "what": "Tried emitting workspace_created from workspace manager instead of hub handler",
      "why": "Workspace manager does not have access to the event emitter",
      "lesson": "Event emission must happen at the handler level, not the manager level",
      "filesInvolved": ["src/hub/workspace.ts", "src/observatory/emitter.ts"]
    }
  ]
}
```

### Output

All captured state is written to `.claude/session-handoff.json`. This file is overwritten on each session end (only the most recent handoff matters; historical state is in Thoughtbox and git).

Additionally, the hypothesis registry (Step 5) is appended to `.claude/hypothesis-registry.jsonl` for cross-session accumulation. This JSONL file grows across sessions and is the persistent hypothesis store. More on this in the Hypothesis Registry section.

---

## Session Start Protocol

### Trigger

The SessionStart hook fires. The enhanced `session_start.sh` (or a new co-invoked `session_start_handoff.sh`) performs recovery.

### Recovery Steps

**Step 1: Load Handoff File**

Read `.claude/session-handoff.json`. If it does not exist or is older than 7 days, skip recovery (stale handoff is worse than no handoff).

**Step 2: Validate Handoff Currency**

Check that the handoff file's `lastCommit.sha` matches or is an ancestor of `HEAD`. If the branch has been rebased, merged, or force-pushed since the handoff was written, the handoff may be stale. Warn but do not skip -- partial information is better than none.

```bash
git merge-base --is-ancestor "$handoff_sha" HEAD 2>/dev/null
```

**Step 3: Construct Recovery Context**

Build an `additionalContext` string for the hook output that the agent sees at session start:

```
--- Session Continuity ---
Previous session: 2026-02-11 14:30 (45m) on branch fix/observatory-workspace-events
Last commit: e291586 fix(types): add workspace_created to HubEvent type

Work in progress:
- 3 uncommitted files
- Thoughtbox session 621b47fb (14 thoughts, "Observatory Native Primitives H1-H9")

Reasoning trajectory:
  Investigated Observatory persistence. Considered SQLite (rejected: dependency divergence),
  FileSystemStorage piggyback (rejected: lifecycle coupling), and JSONL append (chosen:
  matches Beads pattern, crash-recoverable). Key insight: SessionStore interface narrow
  enough for JSONL.

Open hypotheses:
- H9 (testing, 0.7 confidence): Observatory session store can be made persistent with JSONL append
  Next step: Implement FileBackedSessionStore

OODA state: DECIDE phase
- Observed: InMemorySessionStore loses data on restart
- Decision: Implement FileBackedSessionStore
- Action pending: Implementation not started

Failed approaches (do NOT retry):
- Emitting workspace_created from workspace manager -- workspace manager lacks event emitter access

Beads: 1 open issue (thoughtbox-308 P1: Profile priming on every thought call)

Recommended: Resume Thoughtbox session 621b47fb and implement FileBackedSessionStore
  session { operation: "resume", args: { sessionId: "621b47fb-..." } }
```

**Step 4: Load Hypothesis Registry**

If `.claude/hypothesis-registry.jsonl` exists, extract hypotheses with status `testing` or `proposed` and include them in the recovery context. This gives the incoming agent awareness of all open hypotheses, not just those from the most recent session.

```
Active hypotheses (from registry):
- H1 (confirmed): Tab renames in Observatory UI reflect workspace names
- H9 (testing, 0.7): Observatory session store can be made persistent with JSONL
  Evidence: InMemorySessionStore has queue-based updates; Beads uses similar pattern
  Next step: Implement FileBackedSessionStore
- H10 (proposed): Knowledge graph priming should filter by project scope
```

**Step 5: Pre-Load MCP Tool Hints**

If the handoff file records which MCP tools were used in the previous session, include ToolSearch hints:

```
Previous session used these MCP tools (load with ToolSearch if needed):
- mcp__github__pull_request_read
- mcp__github__add_issue_comment
```

---

## Handoff File Schema

### Location

`.claude/session-handoff.json`

### Schema (JSON Schema Draft 2020-12)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["version", "timestamp", "sessionId", "git"],
  "properties": {
    "version": {
      "type": "string",
      "const": "1.0.0",
      "description": "Schema version for forward compatibility"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "When the handoff was written"
    },
    "sessionId": {
      "type": "string",
      "description": "Claude Code session ID"
    },
    "duration": {
      "type": "string",
      "description": "Approximate session duration (e.g. '45m', '2h')"
    },
    "git": {
      "type": "object",
      "required": ["branch"],
      "properties": {
        "branch": { "type": "string" },
        "uncommittedFiles": { "type": "integer" },
        "stagedFiles": { "type": "integer" },
        "stashCount": { "type": "integer" },
        "lastCommit": {
          "type": "object",
          "properties": {
            "sha": { "type": "string" },
            "message": { "type": "string" },
            "timestamp": { "type": "string", "format": "date-time" }
          }
        }
      }
    },
    "beads": {
      "type": "object",
      "properties": {
        "openIssues": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "title": { "type": "string" },
              "priority": { "type": "string" },
              "status": { "type": "string" }
            }
          }
        },
        "inProgress": { "type": "array" },
        "recentlyClosed": { "type": "array" }
      }
    },
    "thoughtbox": {
      "type": "object",
      "properties": {
        "activeSessionId": { "type": ["string", "null"] },
        "sessionTitle": { "type": "string" },
        "thoughtCount": { "type": "integer" },
        "lastThoughtNumber": { "type": "integer" },
        "branches": {
          "type": "array",
          "items": { "type": "string" }
        },
        "keyThoughtIds": {
          "type": "array",
          "items": { "type": "integer" },
          "description": "Thought numbers the agent flagged as significant"
        },
        "tags": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    "ooda": {
      "type": ["object", "null"],
      "description": "Current OODA loop state. Null if agent did not provide or session was interrupted.",
      "properties": {
        "phase": {
          "type": "string",
          "enum": ["observe", "orient", "decide", "act"]
        },
        "observation": { "type": "string" },
        "orientation": { "type": "string" },
        "decision": { "type": "string" },
        "pendingAction": { "type": "string" },
        "confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        }
      }
    },
    "hypotheses": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/hypothesis"
      }
    },
    "trajectory": {
      "type": ["object", "null"],
      "description": "Compressed reasoning trajectory from the session (Letta-inspired).",
      "properties": {
        "narrative": {
          "type": "string",
          "description": "2-5 sentence summary of the reasoning path, including key decision points and their rationale"
        },
        "eliminatedAlternatives": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["option", "reason"],
            "properties": {
              "option": { "type": "string" },
              "reason": { "type": "string" }
            }
          }
        }
      }
    },
    "failedApproaches": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["what", "why"],
        "properties": {
          "what": { "type": "string", "description": "What was attempted" },
          "why": { "type": "string", "description": "Why it failed" },
          "lesson": { "type": "string", "description": "What to do instead" },
          "filesInvolved": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Files touched during the failed attempt"
          }
        }
      }
    },
    "summary": {
      "type": "string",
      "description": "Agent-provided or auto-generated session summary"
    },
    "filesChanged": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Files modified during the session"
    },
    "mcpToolsUsed": {
      "type": "array",
      "items": { "type": "string" },
      "description": "MCP tool names used via ToolSearch, for pre-loading hints"
    },
    "recommendedNextAction": {
      "type": "string",
      "description": "What the agent recommends the next session should do first"
    }
  },
  "$defs": {
    "hypothesis": {
      "type": "object",
      "required": ["id", "statement", "status"],
      "properties": {
        "id": { "type": "string" },
        "statement": { "type": "string" },
        "status": {
          "type": "string",
          "enum": ["proposed", "testing", "confirmed", "refuted", "abandoned"]
        },
        "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
        "evidence": { "type": "array", "items": { "type": "string" } },
        "counterEvidence": { "type": "array", "items": { "type": "string" } },
        "nextStep": { "type": "string" },
        "originSession": {
          "type": "string",
          "description": "Thoughtbox session ID where this hypothesis was first proposed"
        },
        "originThought": {
          "type": "integer",
          "description": "Thought number where this hypothesis was first proposed"
        },
        "lastUpdated": {
          "type": "string",
          "format": "date-time"
        }
      }
    }
  }
}
```

### Size Constraint

The handoff file MUST NOT exceed 50KB. At this limit, it represents roughly 30-50 lines of recovery context when rendered for the session start hook. This keeps it well within the additional context budget without competing with MEMORY.md for system prompt space.

### Relationship to MEMORY.md

MEMORY.md holds **durable structural knowledge** (project layout, gotchas, process rules). The handoff file holds **ephemeral session state** (what was in progress, current hypotheses, OODA phase). They are complementary:

- MEMORY.md: "The Observatory session store is in-memory only (InMemorySessionStore in reasoning.ts)"
- Handoff: "Last session was implementing FileBackedSessionStore, got to the DECIDE phase, JSONL append chosen, implementation not started"

When a hypothesis is confirmed or refuted across sessions, the learning should migrate from the handoff file to MEMORY.md (or the Thoughtbox knowledge graph). The handoff file is a transit buffer, not a permanent store.

---

## Hypothesis Registry

### Problem

Hypotheses are the currency of HDD (Hypothesis-Driven Development). Currently they exist only in Thoughtbox session thoughts and in MEMORY.md prose. There is no structured, persistent registry that tracks hypothesis lifecycle across sessions.

The Observatory Native Primitives work (H1-H9) demonstrated the need: hypotheses were recorded as thought #1 in session `621b47fb`, referenced in MEMORY.md, and coordinated through a Hub workspace. But the tracking was entirely manual. If an agent starts a new session, it must grep MEMORY.md and hope the hypothesis state is current.

### Solution: Persistent Hypothesis Registry

A JSONL file at `.claude/hypothesis-registry.jsonl` that accumulates hypothesis events over time.

**Why JSONL:**
- Append-only: each session writes events, never reads-modifies-writes
- Recoverable: partial writes lose only the last event
- Consistent with Beads and knowledge graph patterns
- Grepable for quick manual inspection

### Event Types

```json
{"event":"proposed","timestamp":"2026-02-09T10:00:00Z","hypothesis":{"id":"H9","statement":"Observatory session store can be made persistent with JSONL append","confidence":0.5,"originSession":"621b47fb","originThought":3}}
{"event":"evidence_added","timestamp":"2026-02-09T11:30:00Z","hypothesisId":"H9","evidence":"InMemorySessionStore already has queue-based updates","session":"621b47fb","thought":7}
{"event":"confidence_updated","timestamp":"2026-02-09T14:00:00Z","hypothesisId":"H9","confidence":0.7,"reason":"Beads uses identical JSONL pattern successfully"}
{"event":"status_changed","timestamp":"2026-02-10T09:00:00Z","hypothesisId":"H9","from":"proposed","to":"testing","reason":"Implementation started"}
{"event":"confirmed","timestamp":"2026-02-11T16:00:00Z","hypothesisId":"H9","finalConfidence":0.95,"evidence":["JSONL write-through working","Hydration on restart verified","REST API returns historical data"]}
{"event":"refuted","timestamp":"2026-02-12T10:00:00Z","hypothesisId":"H10","reason":"Project scope filtering already handled by cipher priming","steppingStone":"May be useful if multi-project support is added"}
```

### Querying the Registry

The session start hook reads the JSONL file and builds a current-state view by replaying events:

```bash
# Extract current hypothesis states (last event per hypothesis ID)
node -e "
  const fs = require('fs');
  const lines = fs.readFileSync('.claude/hypothesis-registry.jsonl', 'utf-8').trim().split('\n');
  const state = {};
  for (const line of lines) {
    const event = JSON.parse(line);
    const id = event.hypothesisId || event.hypothesis?.id;
    if (!state[id]) state[id] = {};
    Object.assign(state[id], event);
  }
  const active = Object.values(state).filter(h =>
    h.event !== 'confirmed' && h.event !== 'refuted' && h.event !== 'abandoned'
  );
  console.log(JSON.stringify(active, null, 2));
"
```

### Lifecycle

1. **Proposed**: Agent formulates hypothesis during a session. Written to handoff file AND appended to registry.
2. **Evidence/Counter-Evidence**: As sessions gather data, evidence events are appended.
3. **Confidence Updates**: Confidence changes are tracked with reasons.
4. **Testing**: Agent begins implementation or experiment to validate.
5. **Terminal States**: `confirmed` (premise validated), `refuted` (premise invalidated with stepping stone recorded), or `abandoned` (no longer relevant).

Confirmed hypotheses should have their key learning migrated to MEMORY.md or the knowledge graph. Refuted hypotheses stay in the registry with `steppingStone` metadata for future reference (per the DGM Continual Calibration principle).

---

## Reasoning Chain Persistence

### Problem: Two Disconnected Stores

Thoughtbox has two systems that store reasoning sessions, and they are not coordinated:

1. **Thoughtbox persistence layer** (`src/persistence/filesystem-storage.ts`): Uses `FileSystemStorage` that writes `ThoughtNode` JSON files to `~/.thoughtbox/projects/<project>/sessions/<partition>/<uuid>/`. This is file-backed and survives restarts. It stores the full reasoning chain with linked list structure, revision metadata, and branch trees.

2. **Observatory session store** (`src/observatory/channels/reasoning.ts`): Uses `InMemorySessionStore` that holds `Session`, `Thought[]`, and `Branch` data in Maps. This is volatile and exists only for real-time WebSocket broadcasting to the Observatory UI. On server restart, all Observatory session data is lost.

The Thoughtbox persistence layer already has the data. The Observatory store is a second, lossy copy.

### Solution: File-Backed Observatory Session Store

Replace `InMemorySessionStore` with a `FileBackedSessionStore` that:

1. **Writes session data to disk on mutation** (setSession, addThought, addBranchThought).
2. **Loads session data from disk on startup** (hydrate from files).
3. **Maintains the in-memory Maps as a read cache** for WebSocket performance.
4. **Uses the existing `SessionStore` interface** -- no changes to the reasoning channel or consumers.

### Storage Format

JSONL (JSON Lines) append-only log, one file per session:

```
.thoughtbox/observatory/sessions/<sessionId>.jsonl
```

Each line is a timestamped event:

```json
{"type":"session:created","timestamp":"2026-02-11T14:30:00Z","data":{"id":"abc","title":"...","status":"active","createdAt":"..."}}
{"type":"thought:added","timestamp":"2026-02-11T14:30:05Z","data":{"thoughtNumber":1,"thought":"...","sessionId":"abc"}}
{"type":"thought:added","timestamp":"2026-02-11T14:30:10Z","data":{"thoughtNumber":2,"thought":"...","sessionId":"abc"}}
{"type":"session:completed","timestamp":"2026-02-11T15:15:00Z","data":{"id":"abc","completedAt":"..."}}
```

### Why JSONL

- **Append-only**: No read-modify-write race conditions. Each mutation is a single `fs.appendFile` call.
- **Recoverable**: If the process crashes mid-write, only the last incomplete line is lost. Previous events are intact.
- **Streamable**: Can be tailed for real-time debugging.
- **Consistent with Beads**: The Beads system uses JSONL (`loop-usage.jsonl`, `graph.jsonl`). Same tooling applies.
- **Bounded**: The 1000-session cleanup policy carries over. Completed sessions older than the limit get their JSONL files deleted.

### Implementation Sketch

```typescript
// src/observatory/channels/file-backed-session-store.ts

import * as fs from 'fs/promises';
import * as path from 'path';
import type { Session, Thought, Branch } from '../schemas/thought.js';

interface SessionStoreEvent {
  type: 'session:created' | 'session:updated' | 'thought:added' | 'thought:branched' | 'session:completed';
  timestamp: string;
  data: unknown;
}

class FileBackedSessionStore implements SessionStore {
  private sessions: Map<string, Session> = new Map();
  private thoughts: Map<string, Thought[]> = new Map();
  private branches: Map<string, Record<string, Branch>> = new Map();
  private updateQueue: Promise<void> = Promise.resolve();
  private readonly MAX_SESSIONS = 1000;
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  /**
   * Hydrate in-memory state from JSONL files on disk.
   * Called once at server startup before WebSocket connections are accepted.
   */
  async hydrate(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });

    const files = await fs.readdir(this.baseDir);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));

    for (const file of jsonlFiles) {
      const filePath = path.join(this.baseDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const event: SessionStoreEvent = JSON.parse(line);
          this.replayEvent(event);
        } catch {
          // Skip malformed lines (crash recovery: last line may be partial)
          continue;
        }
      }
    }

    console.log(`[Observatory] Hydrated ${this.sessions.size} sessions from disk`);
  }

  private replayEvent(event: SessionStoreEvent): void {
    switch (event.type) {
      case 'session:created':
      case 'session:updated': {
        const session = event.data as Session;
        this.sessions.set(session.id, session);
        if (!this.thoughts.has(session.id)) this.thoughts.set(session.id, []);
        if (!this.branches.has(session.id)) this.branches.set(session.id, {});
        break;
      }
      case 'thought:added': {
        const { sessionId, thought } = event.data as { sessionId: string; thought: Thought };
        const thoughts = this.thoughts.get(sessionId) || [];
        thoughts.push(thought);
        this.thoughts.set(sessionId, thoughts);
        break;
      }
      case 'thought:branched': {
        const { sessionId, branchId, thought } = event.data as {
          sessionId: string; branchId: string; thought: Thought;
        };
        const branches = this.branches.get(sessionId) || {};
        if (!branches[branchId]) {
          branches[branchId] = {
            id: branchId,
            fromThoughtNumber: thought.branchFromThought || 0,
            thoughts: [],
          };
        }
        branches[branchId].thoughts.push(thought);
        this.branches.set(sessionId, branches);
        break;
      }
      case 'session:completed': {
        const { id } = event.data as { id: string };
        const session = this.sessions.get(id);
        if (session) {
          session.status = 'completed';
          session.completedAt = event.timestamp;
        }
        break;
      }
    }
  }

  private async appendEvent(sessionId: string, event: SessionStoreEvent): Promise<void> {
    const filePath = path.join(this.baseDir, `${sessionId}.jsonl`);
    const line = JSON.stringify(event) + '\n';
    await fs.appendFile(filePath, line, 'utf-8');
  }

  async setSession(session: Session): Promise<void> {
    this.sessions.set(session.id, session);
    if (!this.thoughts.has(session.id)) this.thoughts.set(session.id, []);
    if (!this.branches.has(session.id)) this.branches.set(session.id, {});
    await this.appendEvent(session.id, {
      type: this.sessions.has(session.id) ? 'session:updated' : 'session:created',
      timestamp: new Date().toISOString(),
      data: session,
    });
    if (this.sessions.size > this.MAX_SESSIONS) this.cleanupOldSessions();
  }

  async addThought(sessionId: string, thought: Thought): Promise<void> {
    const thoughts = this.thoughts.get(sessionId) || [];
    thoughts.push(thought);
    this.thoughts.set(sessionId, thoughts);
    await this.appendEvent(sessionId, {
      type: 'thought:added',
      timestamp: new Date().toISOString(),
      data: { sessionId, thought },
    });
  }

  async addBranchThought(sessionId: string, branchId: string, thought: Thought): Promise<void> {
    const branches = this.branches.get(sessionId) || {};
    if (!branches[branchId]) {
      branches[branchId] = {
        id: branchId,
        fromThoughtNumber: thought.branchFromThought || 0,
        thoughts: [],
      };
    }
    branches[branchId].thoughts.push(thought);
    this.branches.set(sessionId, branches);
    await this.appendEvent(sessionId, {
      type: 'thought:branched',
      timestamp: new Date().toISOString(),
      data: { sessionId, branchId, thought },
    });
  }

  async getSession(sessionId: string): Promise<Session | null> {
    return this.sessions.get(sessionId) || null;
  }

  async getThoughts(sessionId: string): Promise<Thought[]> {
    return this.thoughts.get(sessionId) || [];
  }

  async getBranches(sessionId: string): Promise<Record<string, Branch>> {
    return this.branches.get(sessionId) || {};
  }

  // ... (getActiveSessions, getAllSessions, cleanupOldSessions same as InMemorySessionStore)
  // cleanupOldSessions also deletes the .jsonl files for removed sessions
}
```

### Migration Path

1. `FileBackedSessionStore` implements the same `SessionStore` interface as `InMemorySessionStore`.
2. Replace the singleton: `export const sessionStore = new FileBackedSessionStore(baseDir)`.
3. Call `await sessionStore.hydrate()` during server startup (before WebSocket server starts accepting connections).
4. No changes to `createReasoningChannel` or any event handlers.

### Deduplication with Thoughtbox Persistence

Both the Thoughtbox `FileSystemStorage` and the Observatory `FileBackedSessionStore` persist thought data. This is intentional duplication:

- **Thoughtbox persistence** stores the canonical reasoning chain with full `ThoughtNode` linked structure, revision metadata, content hashes, and Merkle chains. It is the source of truth for reasoning sessions.
- **Observatory persistence** stores a lightweight event log for real-time UI replay and historical queries. It is optimized for streaming, not querying.

The two stores use different formats (JSON files vs JSONL events) and serve different consumers (MCP tool handlers vs WebSocket channels). Unifying them is possible but would couple their lifecycles unnecessarily. The duplication is bounded (thought text is short, sessions are bounded) and the benefit of independent evolution outweighs the cost of redundant storage.

### REST API Impact

The existing Observatory REST API endpoints (port 1729) read from `sessionStore`. Because `FileBackedSessionStore` maintains the same in-memory cache, all 8 endpoints continue working with zero changes. The only behavioral difference: data survives restarts.

---

## Thoughtbox Session Resume Enhancements

### Current State

The `session { operation: "resume", args: { sessionId: "..." } }` MCP operation already exists. It loads a previous session into the active ThoughtHandler, allowing continuation of reasoning from where it left off.

### Enhancement 1: `latest` Operation

Add a new MCP operation that returns the most recent session for the current project:

```typescript
{
  name: "latest",
  title: "Get Latest Session",
  description: "Returns the most recent Thoughtbox session. Use at session start to discover which session to resume.",
  category: "session-retrieval",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "Filter to sessions from a specific project (optional)"
      },
      status: {
        type: "string",
        enum: ["active", "completed", "any"],
        default: "any",
        description: "Filter by session status"
      }
    }
  }
}
```

### Enhancement 2: Context Injection on Resume

When a session is resumed, the response includes a compressed context summary:

```json
{
  "success": true,
  "sessionId": "621b47fb-...",
  "resumed": {
    "thoughtCount": 14,
    "currentThoughtNumber": 14,
    "branchCount": 2,
    "lastThoughtSummary": "Decided on JSONL append for Observatory persistence. Need to implement FileBackedSessionStore.",
    "keyDecisions": [
      "H1-H9 hypotheses locked (thought #1)",
      "JSONL chosen over SQLite for Observatory persistence (thought #12)"
    ]
  }
}
```

The `keyDecisions` field is populated from thoughts tagged with the `decision` type or containing decision markers in cipher notation.

### Enhancement 3: Cross-Session Thought Reference

When an agent resumes a session and creates new thoughts, those thoughts include a `resumedFrom` field:

```json
{
  "thoughtNumber": 15,
  "thought": "Resuming from previous session. Implementing FileBackedSessionStore.",
  "resumedFrom": {
    "previousSessionEnd": "2026-02-11T15:15:00Z",
    "gapDuration": "2h 30m",
    "previousThought": 14
  }
}
```

This creates an auditable chain across session boundaries.

---

## Partial Work Tracking: Beads Integration

### Current State

Beads provides `bd ready` (list available work) and `bd prime` (load context for current issue). The `session_start.sh` hook runs basic git + GitHub checks. There is no integration between the handoff system and Beads.

### Enhancement: Handoff-Beads Bridge

When the session end handoff captures git state showing uncommitted changes, it cross-references with Beads:

1. Check if any open Beads issue mentions the current branch name.
2. If found, the handoff file includes the issue ID and its dependencies.
3. At session start, the recovery context includes: "Continuing work on thoughtbox-308 (P1). Dependencies: none. Blocks: thoughtbox-4fm."

This bridges the gap between the reasoning-level handoff (what was being thought about) and the task-level tracking (what issue is being worked on).

### Implementation

The `session_end_handoff.sh` hook queries Beads:

```bash
# Cross-reference branch with Beads issues
branch=$(git branch --show-current)
if command -v bd &>/dev/null; then
  matching_issue=$(bd list --json | jq -r --arg branch "$branch" \
    '.[] | select(.metadata.branch == $branch or (.title | ascii_downcase | contains($branch | ascii_downcase))) | .id' \
    | head -1)
  if [[ -n "$matching_issue" ]]; then
    beads_context=$(bd show "$matching_issue" --json 2>/dev/null)
  fi
fi
```

---

## Implementation Plan

### Phase 1: Handoff File Infrastructure (Day 1-2)

**Estimated effort**: 3-4 hours

1. **Create `session_end_handoff.sh`** hook script that captures git state, Beads state, and Thoughtbox session state by reading the filesystem directly. Writes `.claude/session-handoff.json` with the automatically-captured fields (Steps 1-3 of Session End Protocol).

2. **Enhance `session_start.sh`** to read `.claude/session-handoff.json` and include recovery context in `additionalContext`. Validate handoff currency. Format as the human-readable recovery summary.

3. **Register hooks in `.claude/settings.json`**. The session end handoff hook fires on `Stop` event (alongside the existing `session_end_memory.sh`). Note: hook files in `.claude/hooks/` must be created by the user (known write-protection constraint).

4. **Add `.claude/session-handoff.json` to `.gitignore`**. The handoff file is machine-local, ephemeral, and should not be committed.

### Phase 2: Agent-Cooperative Handoff + Hypothesis Registry (Day 3-4)

**Estimated effort**: 3-4 hours

1. **Add OODA/trajectory/hypothesis capture prompt to `session_end_handoff.sh`**. When the hook fires, output a structured prompt (via `additionalContext`) asking the agent to provide OODA phase, reasoning trajectory, open hypotheses, failed approaches, and a session summary. Parse the agent's structured response and merge into the handoff file.

2. **Create `.claude/hypothesis-registry.jsonl`** and the append logic. Each session end that includes hypotheses appends events. Each session start that reads the registry replays events to build current state.

3. **Add CLAUDE.md rule for session handoff**. Add a rule in `.claude/rules/` requiring agents to provide handoff data when prompted by the session end hook.

4. **Add failed-approaches capture**. The handoff prompt specifically asks "What did you try that did not work?"

### Phase 3: Observatory Persistence (Day 5-7)

**Estimated effort**: 5-6 hours

1. **Implement `FileBackedSessionStore`** in `src/observatory/channels/file-backed-session-store.ts`. Implements the existing `SessionStore` interface. Uses JSONL append-only storage.

2. **Add `hydrate()` method** that reads all `.jsonl` files from the session directory and replays events to populate in-memory Maps.

3. **Replace singleton** in `reasoning.ts`. Change `export const sessionStore = new InMemorySessionStore()` to `export const sessionStore = new FileBackedSessionStore(baseDir)`. Call `hydrate()` during server startup.

4. **Add cleanup logic**. Port the existing `MAX_SESSIONS` cleanup from `InMemorySessionStore` to also delete old JSONL files.

5. **Write tests**. Test hydration from disk, append correctness, crash recovery (partial last line), and cleanup behavior.

### Phase 4: Thoughtbox Session Resume Enhancements (Day 8-10)

**Estimated effort**: 4-5 hours

1. **Implement `latest` session operation** in the session handler. Query storage for most recent session, return metadata.

2. **Enhance `resume` response** to include `keyDecisions` and `lastThoughtSummary`. Extract from stored thoughts.

3. **Add `resumedFrom` metadata** to new thoughts created after a `resume` operation. Track the gap duration and link to the previous thought.

4. **Wire session start hook to suggest `latest` + `resume`** when a handoff file references a Thoughtbox session.

### Phase 5: Integration Testing (Day 11-12)

**Estimated effort**: 3-4 hours

1. **End-to-end test**: Start session, record thoughts, end session, verify handoff file written, start new session, verify recovery context displayed, resume Thoughtbox session, verify thought chain continues.

2. **Observatory persistence test**: Start server, create sessions via emitter, restart server, verify sessions survive via REST API.

3. **Hypothesis registry test**: Write hypotheses across two sessions, verify third session sees accumulated state.

4. **Stale handoff test**: Modify handoff file to reference a different branch, start session, verify staleness warning.

5. **Interrupted session test**: Simulate PreCompact (no agent cooperation), verify automatic-only handoff data is captured.

---

## Success Criteria

### Quantitative

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Context rebuild time | 2-5 min/session | < 30 sec/session | Time from session start to first productive action |
| Reasoning chain continuity | 0% (manual only) | > 80% of sessions resume from handoff | Handoff file present AND read at start |
| Observatory data survival | 0% (lost on restart) | 100% (survives restart) | REST API returns historical sessions after restart |
| Failed approach repetition | Unknown (no tracking) | 0 per handoff cycle | Agent attempts approach listed in `failedApproaches` |
| Hypothesis tracking | Manual (MEMORY.md grep) | Structured registry with lifecycle events | `.claude/hypothesis-registry.jsonl` exists and is read at start |

### Qualitative

1. **An agent starting a new session can answer "what was the previous session doing?" within 10 seconds** by reading the recovery context, without needing to read files or check git history.

2. **A Thoughtbox reasoning chain can span 3+ sessions** without gaps in thought numbering or lost context.

3. **The handoff file is small enough to skim** (< 50 lines of rendered context) but complete enough that no critical state is lost.

4. **Observatory data persists through Docker rebuilds** (the most common server restart scenario).

5. **Open hypotheses are discoverable without grepping MEMORY.md.** The hypothesis registry provides a structured, queryable view of all hypothesis states.

6. **Reasoning trajectories enable premise-checking.** When an agent resumes work, it can read the previous session's trajectory and evaluate whether the premises of past decisions still hold, rather than blindly continuing.

---

## Risks

### Risk 1: Hook Execution Reliability

**Risk**: Session end hooks may not fire if the session is killed (Ctrl+C, terminal close, SSH disconnect). The handoff file would not be written.

**Likelihood**: Medium.

**Mitigation**: The handoff system degrades gracefully. If no handoff file exists, the session start protocol skips recovery and falls back to the current behavior (MEMORY.md + git status). The system is strictly additive -- it never makes things worse than today. The PreCompact hook also writes handoff data, catching the most common mid-session boundary.

### Risk 2: Stale Handoff Data

**Risk**: If another process (manual git operations, another Claude Code session, CI) modifies state between sessions, the handoff is stale.

**Likelihood**: Medium.

**Mitigation**: The session start protocol validates handoff currency by checking `lastCommit.sha` against `HEAD`. Critical state (git branch, uncommitted files) is re-checked live regardless of the handoff file. Recovery context is labeled "as of [timestamp]."

### Risk 3: Agent Non-Cooperation

**Risk**: Agent-cooperative fields (OODA state, trajectory, hypotheses, failed approaches) require the agent to respond to the hook prompt. If the agent ignores the prompt or the session ends before response, these fields are empty.

**Likelihood**: High for interrupted sessions. Medium for normal sessions.

**Mitigation**: The handoff file distinguishes between automatically captured data (always present) and agent-provided data (best-effort). A `.claude/rules/` rule makes handoff participation a behavioral contract. Over time, compliance can be tracked via the `session_end_memory.sh` log.

### Risk 4: Observatory JSONL Growth

**Risk**: Active sessions generate hundreds of thoughts. JSONL files grow.

**Likelihood**: Low-medium.

**Mitigation**: Individual JSONL files are bounded by session lifetime. A 200-thought session is ~500KB. The cleanup policy deletes completed sessions beyond the 1000-session limit (including their JSONL files). Completed session files can be gzipped after completion.

### Risk 5: Hypothesis Registry Staleness

**Risk**: The hypothesis registry accumulates events but hypotheses are never resolved. The registry becomes a graveyard of abandoned hypotheses.

**Likelihood**: Medium.

**Mitigation**: The session start hook only surfaces hypotheses with status `proposed` or `testing`. Hypotheses not updated in 30 days are demoted to `abandoned` by the daily aggregation workflow (from spec 01). The display format always shows `lastUpdated` so agents can see staleness.

### Risk 6: Handoff File as Attack Surface

**Risk**: The handoff file is JSON read by a hook and injected into agent context. A malicious handoff file could inject prompt instructions.

**Likelihood**: Low. The file is machine-local, written by trusted hooks, not committed to git.

**Mitigation**: The session start hook sanitizes content before injection: truncate all string fields to maximum lengths, validate against JSON schema, cap total rendered context at 2000 characters.

---

## Appendix A: Hook Integration Points

### Existing Hooks (Preserve)

| Hook | File | Event | Current Purpose |
|------|------|-------|----------------|
| `session_start.sh` | `.claude/hooks/session_start.sh` | SessionStart | Log session, load git/GitHub context |
| `session_end_memory.sh` | `.claude/hooks/session_end_memory.sh` | Stop | Prompt for memory capture |
| `pre_compact.sh` | `.claude/hooks/pre_compact.sh` | PreCompact | Log compaction, optionally backup transcript |
| `stop.sh` | `.claude/hooks/stop.sh` | Stop | LangSmith trace upload |

### New Hooks

| Hook | File | Event | Purpose |
|------|------|-------|---------|
| `session_end_handoff.sh` | `.claude/hooks/session_end_handoff.sh` | Stop | Write `.claude/session-handoff.json` and append to `.claude/hypothesis-registry.jsonl` |

### Modified Hooks

| Hook | Modification |
|------|-------------|
| `session_start.sh` | Add handoff file reading, hypothesis registry loading, recovery context generation |
| `pre_compact.sh` | Add handoff file writing (same logic as session_end_handoff.sh) |

### Hook Execution Order (Stop Event)

1. `session_end_handoff.sh` -- write handoff file (must run before memory capture so agent can reference it)
2. `session_end_memory.sh` -- prompt for memory capture
3. `stop.sh` -- upload LangSmith traces

### Settings.json Registration

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/session_end_handoff.sh"
          }
        ]
      }
    ]
  }
}
```

---

## Appendix B: New Files Created by This Spec

| File | Type | Committed? | Purpose |
|------|------|-----------|---------|
| `.claude/session-handoff.json` | JSON | No (.gitignore) | Ephemeral session state for handoff |
| `.claude/hypothesis-registry.jsonl` | JSONL | Yes | Persistent hypothesis lifecycle events |
| `.claude/hooks/session_end_handoff.sh` | Shell script | Yes | Session end handoff capture |
| `src/observatory/channels/file-backed-session-store.ts` | TypeScript | Yes | Observatory persistence |
| `.claude/rules/session-handoff.md` | Markdown | Yes | Behavioral rule requiring handoff participation |

---

## Appendix C: Relationship to Related Specs

### SPEC-SIL-103 (Session Continuity)

SPEC-SIL-103 addresses a narrower problem: MCP reconnection within a single Claude Code session splitting the thought chain. It proposes `restoreFromSession()` in ThoughtHandler. This spec builds on that foundation -- once MCP session continuity works, cross-session continuity (this spec) ensures the handoff file references the correct session for resumption.

**Dependency**: SPEC-SIL-103 should be implemented first. Without it, resuming a session may still produce thought number gaps.

### SPEC-003 (Cross-Session References)

SPEC-003 introduces semantic anchors (`@keyword:SN`) for referencing thoughts across sessions. This spec complements that work by ensuring sessions are discoverable and resumable, so the anchors have targets to resolve against. The `latest` session operation also supports SPEC-003's search-based anchor resolution.

**No dependency**: These specs can be implemented independently.

### Observatory Native Primitives (H9)

Hypothesis H9 states: "Observatory session store should persist across server restarts." Phase 3 of this spec directly implements H9. Once implemented, H9 should be marked as `confirmed` in both the Hub workspace (`5a4755ae`) and the hypothesis registry.

**No dependency**: Phase 3 can be implemented standalone.

### Spec 01 (Unified Loop Controller)

The ULC's session end signal emission hook (`session_end_signals.sh`) runs alongside this spec's `session_end_handoff.sh`. They are complementary: the handoff hook captures state for the next session; the signal hook emits learnings for the daily/weekly loops. They should share the git/Beads state capture logic to avoid redundant shell commands.

### Spec 02 (Knowledge Accumulation Layer)

When a hypothesis is confirmed, the learning should be written to the Knowledge Accumulation Layer (not just MEMORY.md). The hypothesis registry's `confirmed` event should trigger a write to the unified knowledge store once KAL is implemented.

### Spec 03 (Automated Pattern Evolution)

Failed approaches captured in the handoff file are stepping stones in the DGM sense. The pattern evolution system should read `failedApproaches` from the handoff file and archive them with resurrection conditions, per the Continual Calibration principle.
