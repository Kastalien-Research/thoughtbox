# HDD Initialization: Create Session in Beads

**Purpose**: Initialize a new HDD session by creating the epic and phase structure in beads.

---

## Overview

Every HDD session is tracked as a beads epic with child tasks for each phase. This provides:
- Single source of truth for session state
- User checkpoint tracking via beads status
- Automatic sync via `bd sync --from-main`
- Dependency management between phases
- Built-in audit trail

---

## Command: `/hdd:init`

### Usage

```bash
/hdd:init [adr-number] [title]
```

### Arguments

- `adr-number`: ADR number (e.g., "008")
- `title`: Brief title for the ADR (e.g., "Task Endpoint Implementation")

### Example

```bash
/hdd:init 008 "Task Endpoint Implementation"
```

---

## Loop Building Blocks

This initialization phase uses:

| Loop | Purpose | Reference |
|------|---------|-----------|
| Problem Space Exploration | Initial problem scoping | @loops/exploration/problem-space.md |
| Dependency Resolver | Check for ADR dependencies | @loops/orchestration/dependency-resolver.md |

See @loops/README.md for the full loop library.

---

## What This Command Does

### Step 1: Create Epic for ADR Session

```bash
# Create the epic
EPIC_ID=$(bd create --type=epic \
  --title="ADR-008: Task Endpoint Implementation" \
  --description="[Problem statement will be added during research]" \
  --label=hdd \
  --label=adr-008 \
  --priority=2 \
  --format=id-only)

echo "Created HDD session epic: $EPIC_ID"
```

### Step 2: Create Phase Tasks (with Dependencies)

```bash
# Phase 1: Research
PHASE1_ID=$(bd create --type=task \
  --parent=$EPIC_ID \
  --title="Phase 1: Research and Hypothesis Formation" \
  --description="Read ADRs, specs, form testable hypotheses" \
  --acceptance="- Research findings documented
- Hypotheses are SOFT (Specific, Observable, Falsifiable, Testable)
- User has approved approach" \
  --label=hdd-phase \
  --label=phase:research \
  --status=in_progress \
  --format=id-only)

# Phase 2: Staging ADR Creation
PHASE2_ID=$(bd create --type=task \
  --parent=$EPIC_ID \
  --title="Phase 2: Staging ADR Creation" \
  --description="Create staging ADR with context, decision, hypotheses" \
  --acceptance="- Staging ADR created at staging/docs/adr/NNN-feature.md
- All sections complete
- User has approved ADR before implementation" \
  --label=hdd-phase \
  --label=phase:staging \
  --status=open \
  --format=id-only)

# Add dependency: Phase 2 blocked by Phase 1
bd dep add $PHASE2_ID $PHASE1_ID

# Phase 3: Implementation
PHASE3_ID=$(bd create --type=task \
  --parent=$EPIC_ID \
  --title="Phase 3: Implementation" \
  --description="Implement according to ADR, write tests" \
  --acceptance="- Code implements ADR decision
- Tests written for validation
- Build passes
- TypeScript compiles" \
  --label=hdd-phase \
  --label=phase:implementation \
  --status=open \
  --format=id-only)

bd dep add $PHASE3_ID $PHASE2_ID

# Phase 4: Validation
PHASE4_ID=$(bd create --type=task \
  --parent=$EPIC_ID \
  --title="Phase 4: Validation" \
  --description="Automated + manual testing of hypotheses" \
  --acceptance="- All hypotheses tested (automated)
- User completed manual testing for all hypotheses
- Validation results documented in ADR" \
  --label=hdd-phase \
  --label=phase:validation \
  --status=open \
  --format=id-only)

bd dep add $PHASE4_ID $PHASE3_ID

# Phase 5: Decision
PHASE5_ID=$(bd create --type=task \
  --parent=$EPIC_ID \
  --title="Phase 5: Decision (Accept/Reject)" \
  --description="User confirms accept or reject based on validation" \
  --acceptance="- Agent proposed decision
- User confirmed decision
- ADR moved to appropriate location
- Git commit created" \
  --label=hdd-phase \
  --label=phase:decision \
  --status=open \
  --format=id-only)

bd dep add $PHASE5_ID $PHASE4_ID
```

### Step 3: Store Session Metadata

```bash
# Update epic with phase IDs for easy reference
bd update $EPIC_ID --notes="HDD Session Metadata
Epic ID: $EPIC_ID
Phase 1 (Research): $PHASE1_ID
Phase 2 (Staging ADR): $PHASE2_ID
Phase 3 (Implementation): $PHASE3_ID
Phase 4 (Validation): $PHASE4_ID
Phase 5 (Decision): $PHASE5_ID

Current Phase: Phase 1 (Research)
Status: Agent working on research

Created: $(date -Iseconds)
"
```

### Step 4: Display Session Summary

```markdown
# HDD Session Initialized: ADR-008

Epic: {epic_id}

## Phases Created

✓ Phase 1: Research (in_progress) - {phase1_id}
○ Phase 2: Staging ADR (blocked by Phase 1) - {phase2_id}
○ Phase 3: Implementation (blocked by Phase 2) - {phase3_id}
○ Phase 4: Validation (blocked by Phase 3) - {phase4_id}
○ Phase 5: Decision (blocked by Phase 4) - {phase5_id}

## Next Steps

1. I'll begin Phase 1 (Research)
2. When complete, I'll request your approval via checkpoint
3. Use `/hdd:status` to check session state anytime

Starting research phase now...
```

---

## Session Structure in Beads

```
Epic: ADR-008 Task Endpoint Implementation
├── Labels: hdd, adr-008
├── Status: open
└── Children:
    ├── Phase 1: Research (in_progress)
    │   └── Status: awaiting_user_approval (when research complete)
    ├── Phase 2: Staging ADR (open, blocked by Phase 1)
    ├── Phase 3: Implementation (open, blocked by Phase 2)
    ├── Phase 4: Validation (open, blocked by Phase 3)
    │   └── (Hypotheses created as children during this phase)
    └── Phase 5: Decision (open, blocked by Phase 4)
```

---

## Querying Session State

```bash
# Show all HDD sessions
bd list --label=hdd --type=epic

# Show current session details
bd show {epic_id}

# Show current phase (ready to work)
bd ready --label=hdd-phase

# Show all phases for a session
bd children {epic_id}

# Show what's blocking
bd list --label=hdd-phase --status=open
```

---

## User Checkpoint Tracking

Each phase transitions through these statuses:

1. **open** - Not started yet, blocked by dependencies
2. **in_progress** - Agent is working on this phase
3. **awaiting_user_approval** - Agent finished, waiting for user
4. **completed** - User approved, phase done

When a phase is marked `completed`, the next phase automatically becomes unblocked (via dependency resolution).

---

## Metadata Fields Used

**Epic**:
- `title`: "ADR-NNN: [Title]"
- `type`: epic
- `description`: Problem statement (filled during research)
- `design`: Proposed approach (filled during staging)
- `acceptance`: Validation criteria (filled during staging)
- `notes`: Session metadata + phase IDs
- `labels`: ["hdd", "adr-NNN"]

**Phase Tasks**:
- `title`: "Phase N: [Name]"
- `type`: task
- `parent`: Epic ID
- `description`: What this phase does
- `acceptance`: Completion criteria
- `status`: Tracks checkpoint state
- `labels`: ["hdd-phase", "phase:[name]"]
- `notes`: Phase-specific data and results

---

## Benefits

1. ✅ **State persistence** - Survives session crashes
2. ✅ **Visibility** - `bd ready` shows what needs attention
3. ✅ **Sync** - `bd sync --from-main` keeps state current
4. ✅ **Dependencies** - Automatic blocking between phases
5. ✅ **Audit trail** - All changes timestamped
6. ✅ **Multi-agent safe** - Beads handles concurrent access

---

## Related Commands

- `/hdd:status` - Show current session state
- `/hdd:checkpoint` - Mark phase complete, request user approval
- `/hdd:approve` - User approves current phase
- `/hdd:research` - Begin Phase 1
- `/hdd:stage-adr` - Begin Phase 2

---

## Example Session Flow

```bash
# 1. Initialize session
/hdd:init 008 "Task Endpoint Implementation"

# 2. Agent works on research, then:
/hdd:checkpoint research "Research complete. Awaiting approval."

# 3. User reviews and approves
/hdd:approve research "Looks good, proceed to staging ADR"

# 4. Agent creates staging ADR, then:
/hdd:checkpoint staging "Staging ADR created. Awaiting approval."

# 5. User reviews and approves
/hdd:approve staging "Approved, begin implementation"

# ... and so on through phases 3, 4, 5
```

---

## Notes

- **One session per ADR**: Each ADR gets its own epic
- **Session reuse**: If session exists, can resume from any phase
- **Parallel sessions**: Multiple ADRs can be in progress (different epics)
- **Session cleanup**: Close epic when ADR is accepted/rejected

---

## See Also

- `state.md` - State management and transitions
- `overview.md` - HDD workflow overview
- `quick-reference.md` - Quick command reference
