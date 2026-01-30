# /spec-designer

Design and produce implementation specifications through structured cognitive loops. This is the upstream companion to `/spec-orchestrator`—where the orchestrator *implements* specs, the designer *creates* them.

## Usage

```bash
/spec-designer <prompt_or_topic> [--output-folder=path] [--depth=shallow|standard|comprehensive] [--max-specs=N] [--plan-only]
```

## Variables

```
PROMPT: $ARGUMENTS (required)
OUTPUT_FOLDER: $ARGUMENTS (default: .specs/)
DEPTH: $ARGUMENTS (default: standard)
MAX_SPECS: $ARGUMENTS (default: 5)
PLAN_ONLY: $ARGUMENTS (default: false)
CONFIDENCE_THRESHOLD: $ARGUMENTS (default: 0.85)
```

## Loop Architecture

This workflow composes three OODA loop building blocks at different timescales:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           /spec-designer                                  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  @loops/exploration/problem-space.md                              │    │
│  │  Speed: SLOW (~2-5 min) | Scope: SESSION                          │    │
│  │                                                                    │    │
│  │  Understand problem space → Generate spec inventory                │    │
│  └───────────────────────────────┬──────────────────────────────────┘    │
│                                  │                                        │
│                                  ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  FOR each spec in inventory:                                      │    │
│  │  ┌────────────────────────────────────────────────────────────┐  │    │
│  │  │  @loops/authoring/spec-drafting.md                         │  │    │
│  │  │  Speed: MEDIUM (~1-2 min) | Scope: DOCUMENT                │  │    │
│  │  │                                                             │  │    │
│  │  │  Draft spec with appropriate structure and depth            │  │    │
│  │  │                                                             │  │    │
│  │  │  ┌──────────────────────────────────────────────────────┐  │  │    │
│  │  │  │  FOR each requirement:                               │  │  │    │
│  │  │  │  @loops/refinement/requirement-quality.md            │  │  │    │
│  │  │  │  Speed: FAST (~5-15s) | Scope: ITEM                  │  │  │    │
│  │  │  │                                                       │  │  │    │
│  │  │  │  Polish requirement for SMART criteria                │  │  │    │
│  │  │  └──────────────────────────────────────────────────────┘  │  │    │
│  │  └────────────────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                  │                                        │
│                                  ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  @loops/verification/acceptance-gate.md                           │    │
│  │  Speed: MEDIUM (~30s-2min) | Scope: DOCUMENT                      │    │
│  │                                                                    │    │
│  │  Validate all specs meet quality threshold                         │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                  │                                        │
│                                  ▼                                        │
│                          OUTPUT: .specs/                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

## Building Blocks Used

| Loop | Purpose | Reference |
|------|---------|-----------|
| Problem Space Exploration | Understand before committing | @loops/exploration/problem-space.md |
| Spec Drafting | Generate structured specs | @loops/authoring/spec-drafting.md |
| Requirement Quality | Refine individual requirements | @loops/refinement/requirement-quality.md |
| Acceptance Gate | Validate specs before output | @loops/verification/acceptance-gate.md |

See @loops/README.md for the full loop library.
See @loops/meta/composition-patterns.md for how loops combine.

## Protocol Phases

### Phase 0: Session Detection

```
Check for existing design session:

IF .spec-designer/ exists:
  DISPLAY session status
  OFFER: [R]esume | [S]tart fresh | [V]iew specs | [C]ancel
  
IF resuming:
  LOAD state.json
  SKIP to last active phase
```

### Phase 1: Exploration

```
Execute @loops/exploration/problem-space.md with:

  INPUT:
    prompt: PROMPT
    constraints: [MAX_SPECS limit]
  
  CONFIG:
    MAX_ITERATIONS: 3
    CONFIDENCE_THRESHOLD: CONFIDENCE_THRESHOLD
  
  SIGNAL HANDLERS:
    
    ON clarification_requested:
      PRESENT questions to user:
      """
      CLARIFICATION NEEDED:
      
      1. [HIGH] {question}
         Options: {options}
      
      2. [MEDIUM] {question}
         ...
      """
      WAIT for response
      FEED answers back to loop
    
    ON decomposition_started:
      LOG "Breaking into sub-problems..."
      RECURSE exploration for each sub-problem
    
    ON exploration_complete:
      spec_inventory = loop.outputs.spec_inventory
      PROCEED to Phase 2

  GATE:
    - [ ] All critical unknowns resolved
    - [ ] Scope boundaries explicit
    - [ ] Spec inventory created with dependencies
    - [ ] Stakeholder concerns documented
```

### Phase 2: Authoring

```
FOR each spec in spec_inventory (dependency order):

  Execute @loops/authoring/spec-drafting.md with:
  
    INPUT:
      spec_summary: spec
      requirements: spec.requirements
      dependencies: spec.dependencies
      depth: DEPTH
    
    NESTED LOOP:
      FOR each drafted requirement:
        Execute @loops/refinement/requirement-quality.md with:
          INPUT:
            requirement: requirement
            context: spec_context
            threshold: CONFIDENCE_THRESHOLD
          
          ON requirement_split:
            REPLACE single requirement with atomic list
            RE-INDEX requirement IDs
          
          ON requirement_flagged:
            ADD to manual_review_queue
    
    ON spec_drafted:
      SAVE to OUTPUT_FOLDER/{spec.name}.md
      UPDATE state.json

  GATE (per spec):
    - [ ] All Required sections populated
    - [ ] Requirements score >= CONFIDENCE_THRESHOLD
    - [ ] No unresolved TBDs in critical sections
    - [ ] Cross-references valid
```

### Phase 3: Integration

```
Execute @loops/verification/acceptance-gate.md with:

  INPUT:
    artifact: { type: "spec_set", specs: drafted_specs }
    acceptance_criteria: [
      { id: "INT-001", description: "Cross-references valid", priority: "must" },
      { id: "INT-002", description: "No terminology conflicts", priority: "must" },
      { id: "INT-003", description: "Dependencies acyclic", priority: "must" },
      { id: "INT-004", description: "All specs score >= threshold", priority: "must" },
      { id: "INT-005", description: "No orphaned concepts", priority: "should" }
    ]
  
  ON gate_passed:
    GENERATE final artifacts
    PROCEED to output
  
  ON gate_failed:
    FOR each blocker:
      IF remediation available:
        APPLY remediation
      ELSE:
        ESCALATE to user
    RE-RUN gate

  GATE:
    - [ ] Cross-spec consistency verified
    - [ ] All specs pass quality threshold
    - [ ] Readiness report generated
```

### Phase 4: Output

```
GENERATE final artifacts:

  OUTPUT_FOLDER/
  ├── inventory.md           # Spec listing with dependencies
  ├── dependency-graph.md    # Mermaid visualization
  ├── readiness-report.md    # Quality assessment
  └── [spec-name].md         # Individual specs

  .spec-designer/
  ├── state.json             # Session state for resume
  ├── exploration-log.md     # Loop 1 decision history
  ├── clarifications.md      # Q&A with user
  └── refinement-log.md      # Transformation history

PRESENT summary:

  📋 SPEC DESIGNER COMPLETE
  ==========================
  
  Specs created: N
  Quality scores: avg X.XX
  Requirements: N total (N refined)
  
  Ready for implementation?
  → /spec-orchestrator {OUTPUT_FOLDER}
```

## Example Usage

```bash
# Basic: Design spec for a feature
/spec-designer "Add real-time collaboration to the document editor"

# With output folder
/spec-designer "Implement OAuth2 authentication" --output-folder=.specs/auth/

# Comprehensive depth for critical system
/spec-designer "Redesign the payment processing pipeline" --depth=comprehensive

# Multiple related specs
/spec-designer "Add observability (logging, metrics, tracing)" --max-specs=3

# Plan only (exploration phase, no spec generation)
/spec-designer "Migrate from PostgreSQL to CockroachDB" --plan-only
```

## Integration with Other Commands

```bash
# After designing specs, implement them
/spec-orchestrator .specs/ --budget=100

# Review generated specs
/context-aware-review .specs/

# Use for complex design decisions before running
# (when DEPTH=comprehensive isn't enough)
/think-decide "Which architecture pattern for collaborative editing?"
```

## Extending the Workflow

### Adding Custom Loops

Create new loops following @loops/meta/loop-interface.md and reference them:

```markdown
# In your custom workflow

Execute @loops/your-category/your-loop.md with:
  INPUT: ...
  ON signal: ...
```

### Composing with Other Patterns

See @loops/meta/composition-patterns.md for:
- Sequential composition (this workflow)
- Nested composition (used for refinement)
- Parallel composition (for independent specs)
- Conditional composition (for adaptive workflows)
- Recursive composition (used for decomposition)

---

*This workflow composes OODA loop building blocks from the @loops/ library to produce implementation-ready specifications. The modular architecture enables reuse of loops across different workflows.*
