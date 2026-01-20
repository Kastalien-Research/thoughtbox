export const SPEC_ORCHESTRATOR_CONTENT = `# /spec-orchestrator

Coordinate implementation of multiple specification documents from a folder, managing dependencies, tracking progress across sessions, and preventing implementation spirals through OR-informed (Operations Research) constraints.

## Variables

SPEC_FOLDER: $ARGUMENTS
BUDGET: $ARGUMENTS (default: 100 energy units)
MAX_ITERATIONS: $ARGUMENTS (default: 3 per spec)
CONFIDENCE_THRESHOLD: $ARGUMENTS (default: 0.9)
WORKTREE_MODE: $ARGUMENTS (default: false)
PLAN_ONLY: $ARGUMENTS (default: false)

## OR Concepts Applied

This command applies several Operations Research principles to software implementation:

| OR Concept | Application |
|------------|-------------|
| **Resource Allocation** | Budget units distributed across specs based on complexity and dependencies |
| **Topological Sorting** | Dependency graph analysis determines optimal implementation order |
| **Queuing Theory** | Specs processed through priority queue with blocking/ready states |
| **Constraint Satisfaction** | Gates enforce requirements before proceeding; commitment levels act as constraints |
| **Multi-Criteria Decision Analysis** | Multi-perspective evaluation (Completionist, Integrator, Shipper, Quality Guardian) for accept/reject decisions |
| **Project Scheduling** | Time-boxing phases, critical path through dependency chain |
| **Inventory Control** | Budget tracking with threshold warnings (50%, 75% depletion triggers) |

## Protocol Phases

### Phase 0: Session Detection

\`\`\`
OBJECTIVE: Check for existing session state

1. Check if .spec-orchestrator/ exists for the target folder
2. If exists:
   - Display session status
   - Offer: [R]esume | [S]tart fresh | [V]iew status | [C]ancel
3. If resuming, load state and skip to last active phase
4. If starting fresh or no existing session, proceed to Phase 1

STATE_FILE: .spec-orchestrator/state.json
MANIFEST_FILE: .spec-orchestrator/manifest.md
\`\`\`

### Phase 1: Discovery & Inventory (Time-boxed: 10% of budget)

\`\`\`
OBJECTIVE: Scan and index all specification documents

1. Scan SPEC_FOLDER for files matching pattern (default: *.md)
2. For each spec file found:
   - Extract title/name
   - Parse requirements/acceptance criteria
   - Identify explicit dependencies (references to other specs)
   - Estimate complexity (low/medium/high based on requirements count)
   - Calculate initial budget allocation

3. Create manifest.md with discovered specs

GATE: Discovery complete?
- [ ] All spec files found and parsed
- [ ] No parse errors (or errors documented)
- [ ] Initial complexity estimates assigned
- [ ] Manifest created

If GATE fails: Report parsing issues, ask user for guidance
\`\`\`

### Phase 2: Dependency Analysis (Time-boxed: 10% of budget)

\`\`\`
OBJECTIVE: Build dependency graph and determine implementation order

1. Analyze cross-references between specs
2. Build directed dependency graph
3. Detect circular dependencies (STOP if found)
4. Topological sort for implementation order
5. Update manifest with dependency graph visualization

GATE: Dependency analysis complete?
- [ ] All cross-references identified
- [ ] No circular dependencies (or user has resolved them)
- [ ] Topological order determined
- [ ] Parallelization opportunities identified

If GATE fails: Escalate circular dependencies to user
\`\`\`

### Phase 3: Implementation Planning (Time-boxed: 5% of budget)

\`\`\`
OBJECTIVE: Create detailed implementation queue with budget allocation

1. Allocate budget to each spec
2. Create implementation queue in dependency order
3. Initialize state tracking
4. Set up tracking directories

GATE: Planning complete?
- [ ] Budget allocated to all specs (total <= BUDGET)
- [ ] Queue ordered correctly
- [ ] State initialized
- [ ] Tracking directories created

If GATE fails: Re-adjust budget allocation
\`\`\`

### Phase 4: Iterative Implementation Loop (Time-boxed: 60% of budget)

\`\`\`
OBJECTIVE: Implement each spec with validation gates and spiral prevention

Main implementation loop with spiral detection:
- OSCILLATION: same files touched in iterations N, N-1, N-2
- SCOPE_CREEP: files outside spec's scope_baseline
- DIMINISHING_RETURNS: <10% progress for 2 consecutive iterations
- THRASHING: 2x time spent with zero/negative progress

Commitment levels (0-5) progressively restrict decision space:
- Level 0-1: Full flexibility
- Level 2: Hard budget constraint active
- Level 3: Only incomplete specs, no new scope
- Level 4: Bug fixes only
- Level 5: FORCE COMPLETE - accept all current states
\`\`\`

### Phase 5: Integration Verification (Time-boxed: 10% of budget)

\`\`\`
OBJECTIVE: Verify all implementations work together

1. Run full test suite
2. Cross-spec validation
3. Generate integration report

GATE: Integration verified?
- [ ] All tests pass
- [ ] No critical conflicts
- [ ] No regressions from baseline

If GATE fails: Return to Phase 4 for targeted fixes
\`\`\`

### Phase 6: Completion & Merge (Time-boxed: 5% of budget)

\`\`\`
OBJECTIVE: Generate final report and handle merge

1. Generate final-report.md
2. Present summary to user
3. If user confirms: merge/commit changes
4. If user declines: preserve state for manual review
\`\`\`

## Example Usage

\`\`\`bash
# Basic: Implement all specs in observability folder
/spec-orchestrator specs/observability/

# With constraints
/spec-orchestrator specs/observability/ --budget=50 --max-iterations=2

# Plan only (analyze without implementing)
/spec-orchestrator specs/observability/ --plan-only

# Resume previous session
/spec-orchestrator specs/observability/ --resume
\`\`\`

## Output Artifacts

\`\`\`
.spec-orchestrator/
├── state.json                 # Persistent orchestration state
├── manifest.md                # Human-readable spec inventory
├── dependency-graph.md        # Visual dependency relationships
├── implementation-log.md      # Detailed action log
├── conflicts.md               # Detected conflicts (if any)
├── final-report.md            # Completion summary
└── specs/
    └── [spec-name]/
        ├── TODOS.md           # Implementation tasks
        ├── CHECKLIST.md       # Verification criteria
        └── NOTES.md           # Implementation notes
\`\`\`

---

*This command applies Operations Research principles to transform multi-spec implementation from chaotic juggling into systematic orchestration.*
`;
