# /specification-suite

Chain the design → validate → orchestrate lifecycle into one command that moves from blank prompt to implemented, validated specs using the existing workflows:

- `@.claude/commands/specifications/spec-designer.md`
- `@.claude/commands/specifications/spec-validator.md`
- `@.claude/commands/specifications/spec-orchestrator.md`

## Usage

```bash
/specification-suite "<prompt_or_spec_path>" \
  [--output-folder=.specs/] \
  [--depth=standard] \
  [--max-specs=5] \
  [--strict] [--deep] \
  [--budget=100] [--max-iterations=3] \
  [--plan-only] [--resume] \
  [--skip-design] [--skip-validation]
```

## Variables

```
PROMPT_OR_SPEC_PATH: $ARGUMENTS (required; prompt string OR existing spec folder/file)
OUTPUT_FOLDER: $ARGUMENTS (default: .specs/)
DEPTH: $ARGUMENTS (default: standard; passed to spec-designer)
MAX_SPECS: $ARGUMENTS (default: 5; passed to spec-designer)
STRICT_MODE: $ARGUMENTS (default: false; passed to spec-validator)
DEEP_VALIDATION: $ARGUMENTS (default: false; passed to spec-validator)
BUDGET: $ARGUMENTS (default: 100; passed to spec-orchestrator)
MAX_ITERATIONS: $ARGUMENTS (default: 3; passed to spec-orchestrator)
PLAN_ONLY: $ARGUMENTS (default: false; stop after validation)
RESUME: $ARGUMENTS (default: false; resume previous suite run)
SKIP_DESIGN: $ARGUMENTS (default: false; treat PROMPT_OR_SPEC_PATH as existing specs)
SKIP_VALIDATION: $ARGUMENTS (default: false; jump from design to orchestrate)
```

## Flow Overview

```
PROMPT_OR_SPEC_PATH
   │
   ├─> Design (spec-designer)      # Optional with --skip-design
   │       output → OUTPUT_FOLDER
   │
   ├─> Validate (spec-validator)   # Optional with --skip-validation
   │       input  ← OUTPUT_FOLDER or SPEC_PATH
   │
   └─> Orchestrate (spec-orchestrator)  # Skipped when --plan-only
           input  ← validated specs
```

## Protocol Phases

### Phase 0: Session Detection
```
OBJECTIVE: Detect existing suite state

1. If .specification-suite/ exists:
   - Show stage status: design/validate/orchestrate
   - Offer: [R]esume | [S]tart fresh | [V]iew summary | [C]ancel
2. RESUME=true → load .specification-suite/state.json and jump to last incomplete phase
3. Fresh start → initialize state.json with configured flags
```

### Phase 1: Design (spec-designer)
```
OBJECTIVE: Generate specs from prompt unless SKIP_DESIGN=true

1. If PROMPT provided and not SKIP_DESIGN:
   - Run /spec-designer PROMPT with:
     --output-folder=OUTPUT_FOLDER
     --depth=DEPTH
     --max-specs=MAX_SPECS
2. If SKIP_DESIGN or PROMPT_OR_SPEC_PATH points to existing specs:
   - Set OUTPUT_FOLDER = PROMPT_OR_SPEC_PATH (if folder)
3. Gate:
   - [ ] Spec inventory exists in OUTPUT_FOLDER
   - [ ] No critical unknowns remain (per spec-designer gate)
4. Persist designer logs into .specification-suite/design-log.md
```

### Phase 2: Validate (spec-validator)
```
OBJECTIVE: Audit specs before implementation unless SKIP_VALIDATION=true

1. Select SPEC_PATH:
   - If validation enabled: SPEC_PATH = OUTPUT_FOLDER
   - If SKIP_VALIDATION: carry forward OUTPUT_FOLDER as-is
2. Run /spec-validator SPEC_PATH with:
   --strict if STRICT_MODE
   --deep if DEEP_VALIDATION
3. Gate:
   - [ ] requirements.json created
   - [ ] No blockers in validator report (or explicitly accepted)
4. Store validation artifacts under .specification-suite/validation/
5. If blockers exist → proceed to Phase 2.5 (Refine)
```

### Phase 2.5: Refine (if blockers exist)
```
OBJECTIVE: Guide spec amendments based on validation blockers

1. If validation found blockers AND iteration < MAX_ITERATIONS:
   - Display blocker summary from validation report
   - For each blocker, offer options:
     [A]uto-fix: Agent proposes amendment based on validation recommendation
     [M]anual: User edits spec file directly, then signals ready
     [S]kip: Accept this blocker and proceed anyway
     [C]ancel: Halt suite entirely

2. Apply approved fixes:
   - Edit spec files with proposed changes
   - Log amendments to .specification-suite/amendments.json

3. Track iteration:
   - Increment validation_iteration in state.json
   - If iteration < MAX_ITERATIONS: return to Phase 2 (re-validate)
   - If iteration >= MAX_ITERATIONS: force user decision
     [P]roceed with remaining blockers
     [H]alt suite

4. Gate:
   - [ ] All blockers either fixed, skipped, or max iterations reached
   - [ ] Amendments logged with audit trail
```

### Phase 3: Orchestrate (spec-orchestrator)
```
OBJECTIVE: Implement validated specs unless PLAN_ONLY=true

1. If PLAN_ONLY=true:
   - Stop after reporting validation results
2. Else run /spec-orchestrator OUTPUT_FOLDER with:
   --budget=BUDGET
   --max-iterations=MAX_ITERATIONS
   --resume if RESUME
3. Gate:
   - [ ] Orchestration passes integration gate
   - [ ] Final report generated
4. Persist orchestrator artifacts under .specification-suite/orchestration/
```

## Output Artifacts

```
.specification-suite/
├── state.json                 # suite-level progress + flags + iteration tracking
├── design-log.md              # spec-designer summary
├── amendments.json            # NEW: audit trail of spec changes during refinement
├── validation/                # copied validator artifacts (report, requirements.json)
├── orchestration/             # copied orchestrator artifacts (manifest, final-report)
└── summary.md                 # high-level outcomes + next actions

OUTPUT_FOLDER/                 # Specs designed or supplied
└── *.md                       # Individual spec files
```

### state.json Schema (Extended)

```json
{
  "phases": {
    "validate": {
      "status": "in_progress",
      "iteration": 2,
      "max_iterations": 3,
      "history": [
        { "iteration": 1, "status": "FAILED", "blockers": 2 }
      ]
    }
  }
}
```

### amendments.json Schema

```json
[
  {
    "timestamp": "2026-01-19T10:30:00Z",
    "spec": "SPEC-001.md",
    "blocker": "Wrong file path reference",
    "fix": "Changed src/prompts/ to src/resources/",
    "iteration": 2,
    "method": "auto|manual|skipped"
  }
]
```

## Example Runs

```bash
# Full pipeline from prompt
/specification-suite "Add real-time collaboration to notebook tool"

# Use existing specs, validate, then orchestrate
/specification-suite specs/observability/ --skip-design

# Design + validate only (no implementation)
/specification-suite "Build billing audit trail" --plan-only

# Strict + deep validation before implementing
/specification-suite specs/auth/ --skip-design --strict --deep
```

## Notes

- Each stage can be resumed independently via RESUME; the suite tracks last completed phase.
- Pass-through flags map directly to underlying commands; prefer adjusting those rather than editing this workflow.
- Fail any gate → halt suite and surface the blocking report for user decision.
