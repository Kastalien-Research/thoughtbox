# HDD Initialization: Create Session State

**Purpose**: Initialize a new HDD session without relying on any external task tracker.

---

## Overview

Every HDD session must have durable local state before research or implementation begins. The source of truth for HDD progress is `.hdd/state.json`, plus the staging ADR and spec artifacts created during the workflow.

Task tracking is optional and must use only the tracker explicitly selected by the user for the current work. Do not use an unverified tracker CLI or legacy issue-storage remotes.

---

## Command: `/hdd:init`

### Usage

```bash
/hdd:init [adr-number] [title]
```

### What This Command Does

1. Confirm the current branch matches the unit of work.
2. Check whether `.hdd/state.json` already exists for this ADR.
3. If a user-selected tracker is in scope, record its issue/reference ID in the state file. If tracker writes are unavailable, continue with local HDD state and note that in the handoff.
4. Create `.hdd/state.json` with the requested phases and artifact paths.
5. Show the session dashboard and begin Phase 1.

### State Shape

```json
{
  "workflow": "hdd",
  "version": "2.1",
  "adr_number": "<number>",
  "title": "<title>",
  "phase": "research",
  "phases_requested": [1, 2, 3, 4, 5],
  "tracker": {
    "provider": "<selected-tracker-or-none>",
    "issueId": "<optional>"
  },
  "status": "in_progress",
  "artifacts": [],
  "hypotheses": [],
  "staging_adr_path": null,
  "spec_path": null,
  "open_risks": [],
  "reconciliation_flags": [],
  "updated_at": "<ISO timestamp>"
}
```

### Session Dashboard

```markdown
# HDD Session Initialized: ADR-<number>

Tracker: <selected tracker or none>
State: .hdd/state.json

## Phases

- Phase 1: Research
- Phase 2: Stage Spec + ADR
- Phase 3: Implementation
- Phase 4: Validation
- Phase 5: Decision

Starting research phase now...
```

---

## Related Commands

- `/hdd:status` - Show current session state
- `/hdd:checkpoint` - Mark phase complete, request user approval
- `/hdd:approve` - User approves current phase
- `/hdd:research` - Begin Phase 1
- `/hdd:stage-adr` - Begin Phase 2

---

## Notes

- One session per ADR.
- Session reuse is allowed through `.hdd/state.json`.
- Parallel sessions must use separate branches and separate state artifacts.
- Session cleanup happens when the ADR is accepted or rejected.
