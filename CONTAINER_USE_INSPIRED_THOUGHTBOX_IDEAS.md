# Container-Use–Inspired Ideas for Thoughtbox (AgX + Capabilities)

Date: 2025-12-15

This document explores how the design patterns and capabilities of **container-use** (open-source, Dagger-backed “environments for agents”) could inspire improvements and extensions to **Thoughtbox**.

This is not a proposal to re-implement container-use inside Thoughtbox. Instead, it’s about importing the **interaction contracts** that make container-use feel like a great tool:

- **Quick assessment before deep dive** (`list` → `log` → `diff`)
- **Explicit decision triad** (accept / iterate / discard)
- **Auditable operational history** (commands and patches as first-class artifacts)
- **Importable configuration** (agent learns something → human promotes it)
- **Live monitoring + intervene** (watch → terminal)

---

## 1) What container-use provides (capability + pattern)

From container-use docs:

- **Environment as a first-class unit**
  - Git branch + container + history + configuration
  - Every change is committed; operational logs stored as git notes

- **Non-interactive review loop**
  - `container-use list`
  - `container-use log <id>` (optionally `--patch`)
  - `container-use diff <id>`

- **Interactive exploration**
  - `container-use terminal <id>` (intervene)
  - `container-use checkout <id>` (bring into IDE)

- **Decision triad**
  - **Accept**: `merge` (or `apply`)
  - **Iterate**: refine prompt, continue in same env
  - **Discard**: `delete`

- **Config promote path**
  - Agent modifies env config
  - Human can `config import <env>` to adopt improvements

These are not just features—they’re a *workflow grammar*.

---

## 2) Thoughtbox’s analogous primitives

Thoughtbox already has a lot of the underlying ingredients:

- **Reasoning sessions** (persistent identity, exportable)
- **Exports** (`~/.thoughtbox/exports`) as durable artifacts
- **Init flow** (`thoughtbox://init/...`) that is explicitly a CLI-like navigation UX
- **Observatory** (live UI + WS/REST streams)
- **Notebook toolhost** (isolated temp workspace + executable artifacts)

The “gap” is mostly in:

- turning operational history into a **first-class review object**
- turning the work lifecycle into an **explicit decision contract**
- making configuration/metadata **promotable**

---

## 3) Mapping table: container-use → Thoughtbox opportunities

| container-use pattern | what it achieves | Thoughtbox analog today | opportunity |
|---|---|---|---|
| `list/log/diff` quick assessment | fast trust-building, low friction | init flow shows session previews; exports exist | add “session list/log/diff” resources/tools |
| git notes for ops history | auditability, truth over claims | not captured (beyond thought text + notebook execution outputs) | add an “ops ledger” for tool invocations |
| accept / iterate / discard | reduces ambiguity, normalizes iteration | implicit (export on completion, or keep going) | make decision points explicit in UX/prompts |
| config show/import | promotes learning into defaults | minimal server config; notebook templates exist | add “config promote” mechanism (tags/templates/policies) |
| watch + terminal intervene | real-time visibility and escape hatch | Observatory exists; no first-class “watch” narrative | integrate “watch loop” into init and interleaved prompts |

---

## 4) MVP proposals (small, shippable)

### MVP A — Add a **Session Review Surface** (“quick assessment loop”)

**Goal:** Bring container-use’s `list/log/diff` review loop to Thoughtbox sessions.

**What to add**

- **New resources** (prefer resources first; tools second):
  - `thoughtbox://sessions` → list of known sessions (from exports index)
  - `thoughtbox://sessions/{id}` → session detail (render export)
  - `thoughtbox://sessions/{id}/diff/{otherId}` → markdown diff view (optional)
  - `thoughtbox://sessions/{id}/log` → structured summary of “what happened”

**Rationale**

- Your init flow already references `thoughtbox://sessions/{id}` but it’s not implemented.
- Adding it completes the “affordance loop” and enables a true “quick assessment.”

**Implementation sketch**

- Leverage the existing init index builder (`src/init/index-builder.ts`) and export format.
- For `sessions/{id}`:
  - locate latest export file for that session
  - render as markdown (like current export markdown) with branch/revision info

---

### MVP B — Add an **Ops Ledger** for Thoughtbox tool usage (“git notes inspiration”)

**Goal:** Make “what the agent did” inspectable, without relying on narrative.

**What to record**

- For each tool call handled by Thoughtbox (at least `thoughtbox`, `notebook`, `mental_models`, `export_reasoning_chain`):
  - timestamp
  - tool name
  - operation name (if toolhost)
  - a redacted/normalized args summary
  - success/failure + error

**Where to store**

- Minimum viable: append-only JSONL at `~/.thoughtbox/ops/{sessionId}.jsonl`
- Or store inside the export artifact as `ops[]` (requires export version bump)

**How it shows up**

- Resource: `thoughtbox://sessions/{id}/ops` → list
- Resource: `thoughtbox://sessions/{id}/ops/last` → last action

**AgX win**

This creates the container-use vibe of:

- “I can see exactly what happened.”
- “I can debug the process, not only the result.”

---

### MVP C — Make the **decision triad** explicit at session completion

**Goal:** Normalize iteration and reduce ambiguity at the end of a reasoning chain.

When `nextThoughtNeeded=false`, Thoughtbox currently attempts auto-export and closes the session.

**Inspired by container-use**:

- **Accept**: export + close (current behavior)
- **Iterate**: keep session open and continue (today possible but not framed)
- **Discard**: delete session (not currently exposed as a tool)

**Proposal**

- Add a `session_decision` concept to the completion response and/or embed a resource:
  - `thoughtbox://sessions/decision` containing 3 recommended next actions

Optionally add a tool:

- `session_delete` (safe by default; requires explicit sessionId)

---

### MVP D — “Config import” analog for Thoughtbox conventions

**Goal:** Let agents discover better defaults and let humans promote them.

Container-use supports `config show/import` because agents will learn which packages and setup commands make them effective.

Thoughtbox analogs:

- **Init flow tagging conventions** (`project:`, `task:`, `aspect:`)
- **Notebook templates** (`sequential-feynman` today; could expand)
- **Interleaved workflow prompt** structure

**Proposal**

- Add a lightweight, file-based “project policy” file:
  - `.thoughtbox/policy.json` (checked into repo)
  - describes preferred tag conventions, session title patterns, default `totalThoughts`, preferred aspects, etc.

Then add resources:

- `thoughtbox://policy` (show effective policy)
- `thoughtbox://policy/diff` (show changes an agent proposed)

And a tool:

- `policy_propose_update` (writes a patch file in-repo)

This mirrors “agent adapts; human imports.”

---

## 5) Medium-term ideas (bigger moves)

### 1) “Workspaces” as first-class entities

Container-use’s environment is a *container + code + history*.

Thoughtbox could define a “workspace” as:

- a notebook execution directory
- plus a reasoning session
- plus ops ledger

This would enable:

- `workspace list`
- `workspace open`
- `workspace export`
- `workspace checkpoint`

(Conceptually similar to environment branches.)

### 2) Observatory as “watch”

Container-use has `watch` and logs.

Thoughtbox already has WS channels + UI. The opportunity is to formalize a **watch workflow**:

- Provide a resource/prompt: `thoughtbox://watch` or `prompt://watch-thoughtbox`
- Encourage a “monitor loop”:
  - watch active sessions
  - drill into one session
  - decide accept/iterate/discard

---

## 6) Concrete next steps

1) Implement missing `thoughtbox://sessions/{id}` resource (unblocks lots of this)
2) Add `thoughtbox://sessions` list resource
3) Add ops ledger recording (JSONL) + resource views
4) Update init flow’s “quick assessment” view to emphasize:
   - list sessions
   - view ops log
   - view export contents

---

## 7) Open questions

- Should Thoughtbox’s canonical durability be:
  - “export-on-complete” (current) or
  - “always durable” (requires persistent storage, not just export)?

- Should notebook workspaces become durable artifacts by default?

- Do you want a “human review loop” embedded as a prompt/workflow (like container-use docs), or purely as resources?

---

## References

- container-use OSS README: https://github.com/dagger/container-use
- Environment architecture notes: https://github.com/dagger/container-use/blob/main/environment/README.md
- CLI reference: https://container-use.com/cli-reference
- Workflow docs: https://container-use.com/environment-workflow
- Agent rules: https://raw.githubusercontent.com/dagger/container-use/main/rules/agent.md
