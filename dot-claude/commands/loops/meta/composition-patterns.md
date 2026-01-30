---
type: meta
speed: reference
scope: meta
interface_version: 1.0
description: How OODA loops combine to form complex workflows.
---
# Loop Composition Patterns

How OODA loops combine to form complex workflows.

## Pattern Catalog

### 1. Sequential Composition

Loops execute in order, output of one feeds input of next.

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Loop A  │────▶│ Loop B  │────▶│ Loop C  │
└─────────┘     └─────────┘     └─────────┘
   output_a ═══▶ input_b
                   output_b ═══▶ input_c
```

**Use when:**
- Phases have clear handoff points
- Later phases depend on earlier outputs
- Order matters for correctness

**Example:**
```markdown
## Workflow: Spec Design

1. Execute @loops/exploration/problem-space.md
   OUTPUT → spec_inventory

2. For each spec in spec_inventory:
   Execute @loops/authoring/spec-drafting.md
   INPUT ← spec from inventory
   OUTPUT → draft_spec

3. For each requirement in draft_spec:
   Execute @loops/refinement/requirement-quality.md
   INPUT ← requirement
   OUTPUT → refined_requirement
```

---

### 2. Nested Composition

Inner loop executes within each iteration of outer loop.

```
┌─────────────────────────────────────────┐
│ Outer Loop                              │
│  ┌─────────────────────────────────┐   │
│  │         OBSERVE                  │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │         ORIENT                   │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │         DECIDE                   │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │         ACT                      │   │
│  │  ┌───────────────────────────┐  │   │
│  │  │      Inner Loop           │  │   │
│  │  │  O → O → D → A            │  │   │
│  │  │       ↺                   │  │   │
│  │  └───────────────────────────┘  │   │
│  └─────────────────────────────────┘   │
│              ↺                          │
└─────────────────────────────────────────┘
```

**Use when:**
- Each outer iteration needs detailed inner work
- Inner loop results affect outer loop state
- Different cycle speeds (slow outer, fast inner)

**Example:**
```markdown
## Workflow: Spec Authoring with Refinement

Execute @loops/authoring/spec-drafting.md:
  On each section draft:
    Execute @loops/refinement/requirement-quality.md
    Until section_quality_score >= 0.85
```

---

### 3. Parallel Composition

Multiple loops execute concurrently on independent items.

```
                    ┌─────────┐
               ┌───▶│ Loop A₁ │───┐
               │    └─────────┘   │
┌─────────┐    │    ┌─────────┐   │    ┌─────────┐
│ Splitter│────┼───▶│ Loop A₂ │───┼───▶│ Merger  │
└─────────┘    │    └─────────┘   │    └─────────┘
               │    ┌─────────┐   │
               └───▶│ Loop Aₙ │───┘
                    └─────────┘
```

**Use when:**
- Items are independent (no shared state)
- Order doesn't matter
- Throughput matters

**Example:**
```markdown
## Workflow: Multi-Spec Refinement

Split specs into independent set

For each spec IN PARALLEL:
  Execute @loops/refinement/requirement-quality.md
  
Merge refined specs into final output
```

**Constraints:**
- Loops must be marked `Parallelizable: yes`
- No shared mutable state
- Results must be mergeable

---

### 4. Conditional Composition

Loop selection based on context.

```
              ┌─────────┐
         ┌───▶│ Loop A  │
         │    └─────────┘
         │ condition_a
┌────────┴───────┐
│   Dispatcher   │
└────────┬───────┘
         │ condition_b
         │    ┌─────────┐
         └───▶│ Loop B  │
              └─────────┘
```

**Use when:**
- Different situations need different loops
- Optimization for specific cases
- Graceful degradation paths

**Example:**
```markdown
## Workflow: Adaptive Exploration

Assess prompt complexity:

IF complexity == "low":
  Execute @loops/exploration/codebase-discovery.md (fast path)
  
ELIF complexity == "high":
  Execute @loops/exploration/problem-space.md (thorough path)
  
ELIF has_external_dependencies:
  Execute @loops/exploration/domain-research.md (research path)
```

---

### 5. Recursive Composition

Loop spawns child instances of itself.

```
┌───────────────────────────────────────────────┐
│ Loop A (depth=0)                              │
│                                               │
│   DECIDE: decompose?                          │
│     │                                         │
│     ├─ yes ──▶ spawn Loop A (depth=1)         │
│     │           │                             │
│     │           ├─ spawn Loop A (depth=2)     │
│     │           │                             │
│     │           └─ spawn Loop A (depth=2)     │
│     │                                         │
│     └─ no ───▶ process directly               │
│                                               │
└───────────────────────────────────────────────┘
```

**Use when:**
- Problem naturally decomposes into sub-problems
- Divide-and-conquer strategies
- Hierarchical structures

**Example:**
```markdown
## Workflow: Recursive Problem Decomposition

Execute @loops/exploration/problem-space.md:
  
  DECIDE phase:
    IF scope_estimate.complexity == "very_high":
      FOR each sub_problem in decomposition:
        RECURSE with sub_problem as input
      MERGE sub_problem outputs
    ELSE:
      PROCEED with direct processing
      
  MAX_DEPTH: 3
```

**Constraints:**
- Must have termination condition (max depth, base case)
- Results must be mergeable across levels
- Guard against infinite recursion

---

### 6. Pipeline with Feedback

Sequential with backward signals for correction.

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Loop A  │────▶│ Loop B  │────▶│ Loop C  │
└────▲────┘     └────▲────┘     └─────────┘
     │               │
     │ feedback      │ feedback
     │               │
     └───────────────┴──────────────────────
```

**Use when:**
- Later stages discover issues in earlier work
- Iterative refinement across phases
- Quality gates that may reject

**Example:**
```markdown
## Workflow: Spec Design with Feedback

1. Execute @loops/exploration/problem-space.md
   OUTPUT → spec_inventory

2. Execute @loops/authoring/spec-drafting.md
   INPUT ← spec_inventory
   OUTPUT → draft_specs
   
   ON_SIGNAL inconsistency_detected:
     FEEDBACK to exploration loop
     RE-EXECUTE exploration with new context

3. Execute @loops/verification/integration-test.md
   INPUT ← draft_specs
   
   ON_SIGNAL verification_failed:
     FEEDBACK to authoring loop
     RE-EXECUTE authoring for failed specs
```

---

### 7. Supervisor Pattern

Meta-loop monitors and controls child loops.

```
┌─────────────────────────────────────────────────┐
│              Supervisor Loop                     │
│                                                  │
│   OBSERVE: monitor child loop signals            │
│   ORIENT: assess progress, detect spirals        │
│   DECIDE: continue, intervene, terminate         │
│   ACT: adjust child loop parameters              │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Child A  │  │ Child B  │  │ Child C  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │             │              │
│       └─────────────┼─────────────┘              │
│                     │                            │
│              signals/heartbeats                  │
└─────────────────────────────────────────────────┘
```

**Use when:**
- Need global coordination
- Resource/budget management
- Spiral/deadlock detection

**Example:**
```markdown
## Workflow: Orchestrated Spec Implementation

Execute @loops/orchestration/queue-processor.md as SUPERVISOR:
  
  MANAGE child loops:
    - @loops/authoring/code-generation.md (per spec)
    - @loops/verification/integration-test.md (per milestone)
  
  CONSTRAINTS:
    - budget_remaining > 0
    - commitment_level < 5
    - no spiral_detected
    
  ON spiral_detected:
    INCREMENT commitment_level
    CONSTRAIN child loop options
```

---

## Composition Visualization

### Spec Designer Composition

```
┌──────────────────────────────────────────────────────────────────┐
│                     /spec-designer                                │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ @loops/exploration/problem-space.md                        │  │
│  │                                                             │  │
│  │   OBSERVE → ORIENT → DECIDE → ACT                          │  │
│  │                         │                                   │  │
│  │            ┌────────────┼────────────┐                      │  │
│  │            ▼            ▼            ▼                      │  │
│  │         CLARIFY     DECOMPOSE    PROCEED                    │  │
│  │            │            │            │                      │  │
│  │            ▼            ▼            ▼                      │  │
│  │         [user]      [recurse]    [continue]                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ FOR each spec IN spec_inventory:                           │  │
│  │                                                             │  │
│  │   ┌──────────────────────────────────────────────────────┐ │  │
│  │   │ @loops/authoring/spec-drafting.md                    │ │  │
│  │   │                                                       │ │  │
│  │   │   OBSERVE → ORIENT → DECIDE → ACT                    │ │  │
│  │   │                                │                      │ │  │
│  │   │                                ▼                      │ │  │
│  │   │   ┌──────────────────────────────────────────────┐   │ │  │
│  │   │   │ FOR each requirement:                        │   │ │  │
│  │   │   │                                              │   │ │  │
│  │   │   │   @loops/refinement/requirement-quality.md   │   │ │  │
│  │   │   │                                              │   │ │  │
│  │   │   │   OBSERVE → ORIENT → DECIDE → ACT            │   │ │  │
│  │   │   │              ↺                               │   │ │  │
│  │   │   └──────────────────────────────────────────────┘   │ │  │
│  │   └──────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ @loops/verification/acceptance-gate.md                     │  │
│  │                                                             │  │
│  │   Validate all specs meet quality threshold                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│                        [OUTPUT: .specs/]                          │
└──────────────────────────────────────────────────────────────────┘
```

### Spec Orchestrator Composition

```
┌──────────────────────────────────────────────────────────────────┐
│                     /spec-orchestrator                            │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ SUPERVISOR: @loops/orchestration/queue-processor.md        │  │
│  │                                                             │  │
│  │   Monitors: budget, commitment_level, spiral_detection     │  │
│  │                                                             │  │
│  │   ┌──────────────────────────────────────────────────────┐ │  │
│  │   │ @loops/orchestration/dependency-resolver.md          │ │  │
│  │   │                                                       │ │  │
│  │   │   Topological sort → implementation_queue            │ │  │
│  │   └──────────────────────────────────────────────────────┘ │  │
│  │                          │                                  │  │
│  │                          ▼                                  │  │
│  │   ┌──────────────────────────────────────────────────────┐ │  │
│  │   │ FOR each spec IN implementation_queue:               │ │  │
│  │   │                                                       │ │  │
│  │   │   ┌────────────────────────────────────────────────┐ │ │  │
│  │   │   │ @loops/authoring/code-generation.md            │ │ │  │
│  │   │   │                                                 │ │ │  │
│  │   │   │   NESTED: @loops/orchestration/spiral-detector │ │ │  │
│  │   │   │                                                 │ │ │  │
│  │   │   │   ON spiral_detected → escalate to supervisor  │ │ │  │
│  │   │   └────────────────────────────────────────────────┘ │ │  │
│  │   │                          │                            │ │  │
│  │   │                          ▼                            │ │  │
│  │   │   ┌────────────────────────────────────────────────┐ │ │  │
│  │   │   │ @loops/verification/integration-test.md        │ │ │  │
│  │   │   │                                                 │ │ │  │
│  │   │   │   ON failure → feedback to code-generation     │ │ │  │
│  │   │   └────────────────────────────────────────────────┘ │ │  │
│  │   └──────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Anti-Patterns

### ❌ Circular Dependencies
```
Loop A → Loop B → Loop A  (infinite loop risk)
```
**Fix:** Use feedback signals instead of direct calls

### ❌ State Leakage
```
Loop A modifies global state → Loop B reads unexpectedly
```
**Fix:** Explicit input/output contracts only

### ❌ Unbounded Recursion
```
Loop A spawns Loop A without depth limit
```
**Fix:** Always include MAX_DEPTH constraint

### ❌ Parallel State Mutation
```
Loop A₁ and Loop A₂ both write to shared state
```
**Fix:** Use merge function, not shared state
