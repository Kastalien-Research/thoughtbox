---
type: meta
speed: reference
scope: meta
interface_version: 1.0
description: Standard contract for OODA loop building blocks.
---
# Loop Interface Specification

Standard contract for OODA loop building blocks.

## Interface Contract

Every loop building block MUST define the following sections:

```markdown
# [Loop Name]

[One-line description of loop purpose]

## Classification

- **Type**: exploration | authoring | refinement | verification | orchestration
- **Speed**: slow (~minutes) | medium (~30s-2min) | fast (~5-15s)
- **Scope**: session | document | item | line

## Interface

### Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| input_name | type | yes/no | What this input provides |

### Outputs

| Name | Type | Description |
|------|------|-------------|
| output_name | type | What this output contains |

### State (if stateful)

| Field | Type | Description |
|-------|------|-------------|
| state_field | type | What this state tracks |

## OODA Phases

### OBSERVE
[What information is gathered]

### ORIENT  
[How information is interpreted/patterned]

### DECIDE
[Decision tree or logic for choosing action]

### ACT
[Actions taken and their effects]

## Termination Conditions

- **Success**: [When loop exits successfully]
- **Failure**: [When loop exits with failure]
- **Timeout**: [Maximum iterations or time]

## Composition

### Can contain (nested loops)
- [list of loop types this can contain]

### Can be contained by
- [list of loop types that can contain this]

### Parallelizable
- yes | no | conditional (explain)

## Signals Emitted

| Signal | When | Payload |
|--------|------|---------|
| signal_name | trigger condition | data structure |
```

## Interface Semantics

### Input/Output Types

Standard types for loop interfaces:

```typescript
// Primitives
type Text = string
type Number = number  
type Boolean = boolean
type Score = number  // 0.0 to 1.0

// Collections
type List<T> = T[]
type Map<K, V> = Record<K, V>
type Set<T> = T[]  // unique items

// Domain types
type Requirement = {
  id: string
  text: string
  priority: "must" | "should" | "could"
  acceptance_criteria: string[]
}

type Spec = {
  name: string
  path: string
  requirements: Requirement[]
  status: "draft" | "review" | "approved"
}

type Unknown = {
  question: string
  importance: "high" | "medium" | "low"
  resolved: boolean
  answer?: string
}

type PatternMatch = {
  pattern: string
  location: string
  fit_score: Score
  trade_offs: string[]
}

type StakeholderConcern = {
  stakeholder: "developer" | "user" | "operator" | "security"
  concern: string
  severity: "high" | "medium" | "low"
}
```

### State Management

Loops can be:

1. **Stateless**: Pure function from inputs to outputs
2. **Session-stateful**: State persists across iterations within a session
3. **Persistent-stateful**: State persists across sessions (via state files)

State storage convention:
```
.loop-state/
└── [workflow-name]/
    └── [loop-name]/
        ├── state.json      # Current state
        └── history.jsonl   # State history (append-only)
```

### Signal Protocol

Loops communicate via signals:

```typescript
type Signal = {
  source: string       // Loop that emitted
  type: string         // Signal type
  timestamp: string    // ISO8601
  payload: unknown     // Signal-specific data
}

// Standard signals
type IterationComplete = Signal & {
  type: "iteration_complete"
  payload: { iteration: number, progress: Score }
}

type DecisionMade = Signal & {
  type: "decision_made"
  payload: { decision: string, confidence: Score, rationale: string }
}

type Escalation = Signal & {
  type: "escalation"
  payload: { reason: string, context: unknown }
}

type LoopTerminated = Signal & {
  type: "loop_terminated"
  payload: { reason: "success" | "failure" | "timeout", outputs: unknown }
}
```

## Composition Rules

### Nesting Depth

Maximum recommended nesting: 3 levels

```
Outer Loop (orchestration)
└── Middle Loop (authoring)
    └── Inner Loop (refinement)
```

### Data Flow

Data flows DOWN (parent → child) via inputs
Data flows UP (child → parent) via outputs and signals

```
Parent Loop
    │
    ├── INPUT ──────► Child Loop
    │                      │
    │                      ▼
    ◄── OUTPUT/SIGNAL ────┘
```

### Lifecycle Hooks

Loops MAY implement lifecycle hooks:

```markdown
## Lifecycle Hooks

### on_enter
[Called when loop starts]

### on_iteration_start
[Called at start of each iteration]

### on_iteration_end  
[Called at end of each iteration]

### on_exit
[Called when loop terminates]

### on_error
[Called on unhandled error]
```

## Versioning

Loop interfaces are versioned using semver:

- **Major**: Breaking interface changes
- **Minor**: New optional inputs/outputs
- **Patch**: Documentation, bug fixes

Version declared in header:
```markdown
# Loop Name

**Version**: 1.2.0
**Interface**: loop-interface@1.0
```

## Validation

Workflows can validate loop usage:

```markdown
## Validation Rules

- All required inputs must be provided
- Output types must match declared types
- Nested loops must be in "can contain" list
- Termination conditions must be satisfiable
```
