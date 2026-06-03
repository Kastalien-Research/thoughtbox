# HDD State Contract

Canonical state structure for the modular HDD workflow.

## State Path

- `.hdd/state.json`

## Required Fields

```json
{
  "workflow": "hdd",
  "version": "2.0",
  "adr_number": "",
  "title": "",
  "phase": "research|stage|implement|validate|decide|complete",
  "current_task": "",
  "status": "idle|in_progress|blocked|complete|failed",
  "artifacts": [],
  "errors": [],
  "handoff": {
    "module_path": "",
    "task_goal": "",
    "paths_to_inspect": [],
    "acceptance_checks": []
  },
  "open_risks": [],
  "updated_at": ""
}
```

## Phase Transition Rules

Each transition requires **on-disk verification** — read the state file back after writing
and confirm the required data is present. Conversation memory is not an artifact.

1. `research -> stage` requires `hypotheses` array in state.json with length > 0. Each entry must have `id`, `claim`, `prediction`, `validation` fields.
2. `stage -> implement` requires `staging_adr_path` and `spec_path` non-null in state.json AND both files exist on disk (verified by reading them).
3. `implement -> validate` requires `artifacts` array with implementation files and test targets recorded in state.json.
4. `validate -> decide` requires hypothesis outcomes written to state.json (each hypothesis has an `outcome` field: VALIDATED | INVALIDATED | INCONCLUSIVE).
5. `decide -> complete` requires accepted/rejected migration artifact on disk.

**Enforcement**: The orchestrator MUST read `.hdd/state.json` after every write and verify
the transition prerequisite before starting the next phase. If verification fails, fix the
write — do not advance.

## Resume Rules

1. Load state and verify phase prerequisites using the transition rules above.
2. Re-run current phase module if output artifacts are missing from disk.
3. Preserve prior artifacts and append new events.
