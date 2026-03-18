---
name: hdd
description: >
  Hypothesis-Driven Development — treat ADRs as the source of truth, not code.
  Form testable hypotheses, stage ADRs, implement to test them, validate against
  predictions, then accept or reject based on evidence. Prevents repeated mistakes
  by documenting failures. Enables agent-to-agent collaboration through explicit
  architectural reasoning. This is the canonical HDD entry point — it replaces
  the thin router at .claude/commands/hdd/hdd.md.
argument-hint: <adr-number> "<title>" [--resume] [--phases=1-2]
user-invocable: true
---

Run Hypothesis-Driven Development for: $ARGUMENTS

## Core Principle

**Code is an implementation artifact. ADRs are the source of truth.**

Before writing any code, form testable hypotheses about what you expect to happen,
document them in a staging ADR, implement the minimum needed to test them, validate
whether reality matched predictions, then accept or reject based on evidence.

## Inputs

Parse `$ARGUMENTS` for:

- `adr_number` (required): The ADR number, e.g. `008`
- `title` (required): Brief title, e.g. `"Task Endpoint Implementation"`
- `--resume` (optional): Resume an existing HDD session instead of starting fresh
- `--phases=N-M` (optional): Run only phases N through M. Used by `/workflow` to invoke
  Phases 1-2 (research + stage docs) as its Stage 2, then take back control for its own
  planning/implementation/review stages. Default: `1-5` (full lifecycle).

## Phases

```
Research --> Stage Docs --> Implement --> Validate --> Decide
   |    checkpoint    |   checkpoint   |          |  checkpoint  |  checkpoint
   v                  v                v          v              v
hypotheses     spec + ADR       code + tests  evidence    accept/reject
```

Each phase has a user checkpoint. You do NOT skip checkpoints.

### Integration with /workflow

When `/workflow` dispatches to `/hdd` at Stage 2, it passes `--phases=1-2`. This produces
the spec and staging ADR, then returns control to `/workflow` for its own planning,
implementation, and review stages. When invoked standalone (the default), `/hdd` runs
all 5 phases as a self-contained lifecycle.

## Initialization

### New session (no --resume)

1. Check for existing HDD sessions:
   ```bash
   bd list --label=hdd --type=epic --json
   ```
   If an active session exists for this ADR number, warn and ask whether to resume or start fresh.

2. Create an epic and phase tasks in beads:
   ```bash
   EPIC_ID=$(bd create --title="ADR-${adr_number}: ${title}" \
     --description="HDD session — hypotheses to be defined during research" \
     --type=epic --priority=2 --json | jq -r '.id')
   ```

3. Create phase tasks with dependencies (Phase 2 depends on Phase 1, etc.):
   - Phase 1: Research and Hypothesis Formation
   - Phase 2: Stage Spec + ADR
   - Phase 3: Implementation
   - Phase 4: Validation
   - Phase 5: Decision (Accept/Reject)

   If `--phases=1-2`, only create tasks for Phases 1 and 2.

4. Write state to `.hdd/state.json`:
   ```json
   {
     "workflow": "hdd",
     "version": "2.1",
     "adr_number": "<number>",
     "title": "<title>",
     "phase": "research",
     "phases_requested": [1, 2, 3, 4, 5],
     "epicId": "<bead-id>",
     "phaseIds": {
       "research": "<id>",
       "stage": "<id>",
       "implement": "<id>",
       "validate": "<id>",
       "decide": "<id>"
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

5. Show the session dashboard and begin Phase 1.

### Resume (--resume)

1. Read `.hdd/state.json`
2. Verify the epic and phase tasks still exist in beads
3. Show the dashboard with current state
4. Resume from the current phase

## Phase 1: Research

**Goal**: Understand the problem space and form testable hypotheses.

### Delegation

Dispatch one Explore-type sub-agent using the Agent tool:

```
Agent tool call:
  subagent_type: Explore
  prompt: |
    You are the HDD Research agent for ADR-${adr_number}: ${title}.

    ## Task
    Build context and form testable hypotheses for this architectural decision.

    ## What to read
    - Accepted ADRs: .adr/accepted/ (constraints and patterns)
      Also check docs/adr/ — legacy ADRs predate the .adr/ convention
    - Rejected ADRs: .adr/rejected/ (prior failure modes)
      Also check docs/adr/rejected/ — legacy location
    - Active staging: .adr/staging/ (in-flight work)
    - Specs: specs/ (implementation contracts)

    ## ADR Reconciliation
    For each accepted ADR related to this domain, apply these 7 signals:
    1. Context mismatch — ADR describes codebase state that no longer matches
    2. Broken references — files/modules mentioned have moved or been deleted
    3. Dependency drift — major version change in a dependency the ADR relied on
    4. Contradicting direction — this new work conflicts with the ADR's decision
    5. Unrealized consequences — ADR predicted outcomes that never materialized
    6. Rejected alternative resurfacing — a rejected approach is being proposed again
    7. Orphaned dependency chain — ADR depends on a retired/rejected ADR

    If any signal fires, include it in your output with specific evidence.

    ## Hypotheses
    Form SOFT hypotheses — Specific, Observable, Falsifiable, Testable.
    Each hypothesis must name an exact behavior, metric, or outcome.

    ## Return format
    ```
    RESEARCH SUMMARY
    ================
    Domain: <what area of the codebase this touches>

    EXISTING CONSTRAINTS
    - <constraint from accepted ADR-NNN>: <what it means for this work>

    PRIOR FAILURES
    - <lesson from rejected ADR-NNN>: <what to avoid>

    RECONCILIATION FLAGS
    - ADR-NNN: <signal name> — <specific evidence>
      Recommended disposition: STILL VALID | NEEDS AMENDMENT | SUPERSEDED | INVALIDATED
    (or: No reconciliation flags.)

    HYPOTHESES
    H1: <specific testable claim>
      Prediction: <exact observable outcome>
      Validation: <how to test>
    H2: ...

    UNKNOWNS
    - <anything that blocks staging>

    OPEN RISKS
    - <anything that could derail implementation>
    ```
```

**Checkpoint**: Present the research summary and draft hypotheses to the user.
Wait for approval before advancing.

**Gate**: At least one SOFT hypothesis with evidence-backed context. User approved.

### Reconciliation Dispositions

When a reconciliation signal fires, the research agent recommends one of four outcomes.
The orchestrator presents these to the user during the checkpoint for a decision:

1. **STILL VALID**: False positive. The ADR's reasoning holds. Note the review date and move on.
2. **NEEDS AMENDMENT**: Core decision is correct but context/reasoning needs updating to
   reflect current codebase. Amend the ADR in place during Phase 5 (alongside the new ADR).
3. **SUPERSEDED**: The current work replaces this ADR's decision. Move to `.adr/retired/`
   with a forward reference during Phase 5.
4. **INVALIDATED**: Reasoning no longer holds, no replacement exists. Move to `.adr/retired/`
   with an explanation. If the domain still needs a decision, the current HDD session serves
   as that replacement.

Do NOT act on dispositions during Phase 1. Record them. Execute them in Phase 5 alongside
the primary ADR migration.

## Phase 2: Stage Spec + ADR

**Goal**: Document WHAT we're implementing (spec) and WHY (ADR) before writing code.

### Delegation

Dispatch one sub-agent:

```
Agent tool call:
  prompt: |
    You are the HDD Staging agent for ADR-${adr_number}: ${title}.

    ## Context
    Research summary (from Phase 1):
    <paste the full research output here>

    Approved hypotheses:
    <paste the user-approved hypotheses>

    ## Task
    Create two documents:

    ### 1. Spec (WHAT)
    Path: specs/${slug}.md

    The spec describes the implementation contract. It answers: what does the
    system look like after this work is done? Include:
    - Data structures / types being added or changed
    - API surface (new endpoints, tool operations, parameters)
    - Behavior descriptions (what happens when X)
    - Acceptance criteria (testable conditions for "done")

    Do NOT include reasoning about WHY — that belongs in the ADR.

    ### 2. Staging ADR (WHY)
    Path: .adr/staging/ADR-${adr_number}-${slug}.md

    Sections:
    - **Status**: Proposed
    - **Context**: Problem, current state, constraints from research
    - **Decision**: Chosen approach and why (reference alternatives considered)
    - **Consequences**: Positive outcomes, tradeoffs, follow-ups
    - **Hypotheses**: Each in SOFT format with validation plan (use format below)
    - **Spec**: Link to specs/${slug}.md
    - **Links**: Related ADRs, files, rejected approaches

    ### Hypothesis format in ADR
    ```markdown
    ### Hypothesis N: [Specific testable claim]
    **Prediction**: [Exact observable outcome]
    **Validation**: [Commands, observations, or measurements]
    **Outcome**: PENDING
    ```

    ### Dependency/conflict notes
    If any reconciliation flags were raised in Phase 1, note them in the ADR's
    Context section with planned dispositions.

    ## Return format
    ```
    STAGING SUMMARY
    ===============
    Spec path: specs/${slug}.md
    ADR path: .adr/staging/ADR-${adr_number}-${slug}.md
    Hypotheses staged: N
    Dependencies noted: [list or "none"]
    Conflicts noted: [list or "none"]
    ```
```

After receiving the sub-agent output, update `.hdd/state.json` with `staging_adr_path`
and `spec_path`.

**Checkpoint**: Present both the spec and the staging ADR to the user. Wait for approval
before implementation.

**Gate**: Spec exists in `specs/`. Staging ADR exists in `.adr/staging/`. All sections
complete. Each hypothesis is SOFT. User approved both documents.

**If `--phases=1-2`**: Stop here. Return the spec path, ADR path, and hypotheses to the
calling workflow. Update state to `phase: "stage-complete"`.

## Phase 3: Implementation

**Goal**: Build the minimum code needed to test hypotheses.

### Delegation

Dispatch one or more sub-agents depending on implementation scope. For each sub-agent:

```
Agent tool call:
  prompt: |
    You are an HDD Implementation agent.

    ## Scope
    ADR: <paste staging ADR path and content>
    Spec: <paste spec path and content>

    ## Task
    Implement the minimum changes required to exercise the hypotheses in the ADR.

    Rules:
    1. Read the spec for WHAT to build. Read the ADR for WHY.
    2. Write tests tied to each hypothesis — tests validate the PREDICTION,
       not just that code exists.
    3. Run build and type checks after implementation.
    4. Track any deviation from spec with justification.
    5. Do NOT commit. Changes stay uncommitted until after validation.

    ## Return format
    ```
    IMPLEMENTATION SUMMARY
    ======================
    Files modified: [list with paths]
    Files created: [list with paths]
    Tests written: N
    Tests passing: N/N
    Build: pass | fail
    Type check: pass | fail

    HYPOTHESIS COVERAGE
    H1: covered by test <test name>
    H2: covered by test <test name>
    ...

    DEVIATIONS FROM SPEC
    - <deviation>: <justification>
    (or: None.)

    TEST TARGETS
    Command: <exact test command>
    Files: <test file paths>
    ```
```

After receiving summaries, update `.hdd/state.json` with artifacts and test targets.

**No user checkpoint** — advance directly to validation.

**Gate**: Implementation and hypothesis-linked tests exist. Build passes. Type checks pass.

## Phase 4: Validation

**Goal**: Test whether predictions match reality.

### Delegation

Dispatch one sub-agent:

```
Agent tool call:
  prompt: |
    You are an HDD Validation agent.

    ## Context
    ADR: <staging ADR path and content>
    Test targets: <from implementation summary>

    ## Task
    For each hypothesis in the ADR:
    1. Run the specific validation described in the hypothesis
    2. Capture concrete evidence (test output, command output, observations)
    3. Classify: VALIDATED | INVALIDATED | INCONCLUSIVE

    Also run full quality checks:
    - Build: npm run build (or equivalent)
    - Tests: npm test (or equivalent)
    - Linter: if configured
    - Type checker: tsc --noEmit (or equivalent)

    ## Return format
    ```
    VALIDATION REPORT
    =================
    Quality checks: build [pass|fail], tests [pass|fail], types [pass|fail]

    HYPOTHESIS RESULTS
    H1: "<claim>"
      Prediction: <what we expected>
      Evidence: <what actually happened — include command output>
      Classification: VALIDATED | INVALIDATED | INCONCLUSIVE
      Notes: <analysis of match/mismatch>

    H2: ...

    MANUAL VERIFICATION NEEDED
    - <hypothesis or aspect that requires human testing>
    (or: None — all hypotheses verified automatically.)

    OVERALL: ALL VALIDATED | SOME INVALIDATED | MIXED
    ```
```

**Checkpoint**: Present the validation report to the user. For each hypothesis, show
prediction vs. evidence. Ask the user to:
1. Confirm automated results
2. Perform any manual testing listed
3. Approve the classification of each hypothesis

**Gate**: Every hypothesis has an explicit outcome. User confirmed results.

## Phase 5: Decision

**Goal**: Accept or reject the ADR based on validation evidence.

### Path A: All Hypotheses Validated

1. Update ADR status to "Accepted"
2. Migrate ADR: `mv .adr/staging/ADR-NNN-*.md .adr/accepted/`
3. Execute any reconciliation dispositions recorded in Phase 1:
   - NEEDS AMENDMENT: Edit the flagged accepted ADR in place
   - SUPERSEDED: Move flagged ADR to `.adr/retired/` with forward reference
   - INVALIDATED: Move flagged ADR to `.adr/retired/` with explanation
4. Move spec from staging if needed (spec should already be in `specs/`)
5. Create the commit (ADR + spec + implementation + tests in one atomic commit):
   ```
   feat(<scope>): <description>

   ADR-NNN accepted — all hypotheses validated.
   ```
6. Close all phase tasks and the epic in beads
7. Clean up `.hdd/state.json`

### Path B: Hypotheses Invalidated

1. **Do NOT commit implementation code**
2. Document failure analysis in the ADR:
   - Which hypotheses failed and why
   - What we learned
   - What alternative approaches exist
3. Update ADR status to "Rejected (Reason: [which hypothesis])"

**Checkpoint**: Present the rejection analysis. The user MUST approve the rejection.

4. Migrate ADR: `mv .adr/staging/ADR-NNN-*.md .adr/rejected/`
5. Remove the staged spec: `trash specs/${slug}.md` (it describes something we didn't build)
6. Rollback implementation: `git checkout -- <files>`
7. Commit only the rejected ADR:
   ```
   docs(adr): reject ADR-NNN — [hypothesis] invalidated

   [Brief explanation of what was learned]
   ```
8. Close all phase tasks and the epic in beads
9. Clean up `.hdd/state.json`

### Path C: Mixed Results

If some hypotheses validated and others didn't:

1. Present the mixed results to the user
2. Options:
   a. **Accept with amendments**: Update ADR and spec to reflect narrowed scope, accept
   b. **Reject and re-scope**: Reject this ADR, create a new one with revised hypotheses
   c. **Continue validation**: If inconclusive results can be resolved with more testing
3. The user decides which path. Do NOT decide for them.

## Dashboard

Render after every phase transition:

```
HDD SESSION: ADR-<number> — <title>
Epic: <epicId> | Branch: <branch>
Phases: <1-5 or 1-2>

Phase                     Status          Artifact
-----                     ------          --------
1. Research               [status]        hypotheses: N, flags: N
2. Stage Docs             [status]        spec: specs/<slug>.md
                                          adr: .adr/staging/ADR-NNN-*.md
3. Implementation         [status]        files: N, tests: N
4. Validation             [status]        validated: N, invalidated: N
5. Decision               [status]        accepted | rejected | pending

Open risks: <count>
Reconciliation: <count> flags, <count> pending dispositions
```

Status symbols: `[ ]` pending, `[~]` in progress, `[x]` complete, `[!]` blocked

## Hypothesis Quality Gate

Before leaving Phase 1, every hypothesis MUST pass the SOFT check:

- **Specific**: Names exact behavior, metric, or outcome — not "works correctly"
- **Observable**: Can be verified through running code, reading output, or measuring
- **Falsifiable**: There exists a concrete result that would prove it wrong
- **Testable**: A test or command can exercise it within the current environment

Reject hypotheses that are vague ("performance is good"), implementation-focused
("we will use class X"), or unfalsifiable ("code will be maintainable").

## Operational Rules

1. **Orchestrator delegates**: You dispatch sub-agents for each phase. You do NOT read every implementation file or write production code yourself.
2. **Persist state after every phase**: Update `.hdd/state.json` and beads after each phase completes. Crashes should be recoverable.
3. **One ADR per session**: Each HDD session produces exactly one ADR (accepted or rejected), plus one spec.
4. **Atomic commits**: Code changes + ADR + spec in one commit, made after validation — not during implementation.
5. **Document failures**: Rejected ADRs are as valuable as accepted ones. They prevent repeated mistakes. Rejected specs are removed (they describe unbuilt things).
6. **Never skip checkpoints**: User approval is required at Phases 1, 2, 4, and 5 (rejection only). The agent proposes; the user decides.
7. **Conventional commits**: All commits follow the format in CLAUDE.md.
8. **Canonical entry point**: This skill is THE way to run HDD. The old `/hdd` command router at `.claude/commands/hdd/hdd.md` is deprecated. The module briefs in `.claude/commands/hdd/modules/` remain as reference material for sub-agent context.

## Anti-Patterns

- Do NOT jump to implementation without forming hypotheses first
- Do NOT commit code before validation completes
- Do NOT write vague hypotheses to get through the gate faster
- Do NOT silently advance past a failed checkpoint
- Do NOT "fix" invalidated code — reject the ADR, learn from it, form new hypotheses
- Do NOT treat HDD as overhead — it IS the development process for architectural decisions
- Do NOT create a spec without an ADR or an ADR without a spec — they are a pair

## When to Use HDD

**Always use for**: New features, architectural changes, protocol implementations,
refactoring that changes behavior, performance optimizations with measurable goals.

**Skip for**: Trivial bug fixes, documentation-only changes, test-only additions,
formatting/linting fixes.

## Directory Structure

```
.adr/
  staging/          # Work in progress — under validation
  accepted/         # Validated — source of truth
  rejected/         # Failed — documented lessons
  retired/          # Superseded — historical reference
.hdd/
  state.json        # Current session state (gitignored)
specs/              # Implementation specs (WHAT — paired with ADRs)
```

## Reference

- Process rationale: `docs/WORKFLOW-MASTER-DESCRIPTION.md`
- Module briefs: `.claude/commands/hdd/modules/` (sub-agent reference material)
- State contract: `.claude/commands/hdd/state.md`
- ADR template: `docs/adr/000-template.md` (if it exists)
