---
type: orchestration
speed: fast
scope: session
interface_version: loop-interface@1.0
description: Detect and prevent implementation spirals through pattern recognition.
---
# Spiral Detection Loop

Detect and prevent implementation spirals through pattern recognition.

**Version**: 1.0.0
**Interface**: loop-interface@1.0

## Classification

- **Type**: orchestration
- **Speed**: fast (~1-5s per check)
- **Scope**: session (monitors across iterations)

## Interface

### Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| iteration_history | List<IterationRecord> | yes | History of past iterations |
| current_iteration | IterationRecord | yes | Current iteration data |
| thresholds | SpiralThresholds | no | Detection thresholds |

### Outputs

| Name | Type | Description |
|------|------|-------------|
| spirals_detected | List<SpiralPattern> | Detected spiral patterns |
| severity | "none" \| "warning" \| "critical" | Overall severity |
| recommendation | Recommendation | Suggested action |
| commitment_delta | Number | Suggested commitment level change |

### State

| Field | Type | Description |
|-------|------|-------------|
| pattern_counts | Map<Pattern, Count> | How many times each pattern seen |
| warning_count | Number | Cumulative warnings issued |

## Types

```typescript
type IterationRecord = {
  iteration: number
  files_modified: Set<string>
  checklist_score: number  // 0-1
  time_spent_ms: number
  scope_baseline: Set<string>  // files that SHOULD be modified
}

type SpiralPattern = 
  | "OSCILLATION"       // Same files touched repeatedly
  | "SCOPE_CREEP"       // Modifying files outside scope
  | "DIMINISHING_RETURNS"  // Low progress per iteration
  | "THRASHING"         // High effort, zero/negative progress
  | "GOLD_PLATING"      // Perfecting already-complete work

type SpiralThresholds = {
  oscillation_file_count: number     // default: 3
  oscillation_iteration_span: number // default: 3
  scope_creep_tolerance: number      // default: 0 extra files
  diminishing_returns_delta: number  // default: 0.1 (10%)
  diminishing_returns_span: number   // default: 2 iterations
  thrashing_time_multiplier: number  // default: 2x
}

type Recommendation = {
  action: "continue" | "constrain" | "escalate" | "force_complete"
  rationale: string
  constraints?: string[]
}
```

## OODA Phases

### OBSERVE

Collect signals from iteration history:

```
GIVEN: iteration_history, current_iteration

1. EXTRACT file modification patterns:
   
   files_per_iteration = [
     iter.files_modified for iter in iteration_history + [current_iteration]
   ]
   
   file_frequency = count occurrences of each file across iterations

2. EXTRACT progress patterns:
   
   progress_deltas = [
     iteration_history[i+1].checklist_score - iteration_history[i].checklist_score
     for i in range(len(iteration_history) - 1)
   ]
   
   current_delta = current_iteration.checklist_score - iteration_history[-1].checklist_score

3. EXTRACT time patterns:
   
   time_per_iteration = [iter.time_spent_ms for iter in iteration_history]
   avg_time = mean(time_per_iteration)
   current_time = current_iteration.time_spent_ms

4. EXTRACT scope patterns:
   
   scope_baseline = current_iteration.scope_baseline
   actual_files = current_iteration.files_modified
   out_of_scope = actual_files - scope_baseline

SIGNALS:
  file_frequency: Map<file, count>
  progress_deltas: List<number>
  current_delta: number
  avg_time: number
  current_time: number
  out_of_scope_files: Set<string>
```

### ORIENT

Apply pattern detection heuristics:

```
spirals_detected = []

1. OSCILLATION detection:
   """
   Trigger: Same 3+ files modified in iterations N, N-1, N-2
   Meaning: Flip-flopping between states, not converging
   """
   
   IF len(iteration_history) >= thresholds.oscillation_iteration_span:
     recent_iterations = last N iterations
     
     common_files = intersection(
       iter.files_modified for iter in recent_iterations
     )
     
     IF len(common_files) >= thresholds.oscillation_file_count:
       spirals_detected.append({
         pattern: "OSCILLATION",
         evidence: {files: common_files, iterations: recent_iterations},
         severity: "warning" if first_time else "critical"
       })

2. SCOPE_CREEP detection:
   """
   Trigger: Modifying files not in scope_baseline
   Meaning: Expanding beyond intended changes
   """
   
   IF len(out_of_scope_files) > thresholds.scope_creep_tolerance:
     spirals_detected.append({
       pattern: "SCOPE_CREEP",
       evidence: {files: out_of_scope_files},
       severity: "warning"
     })

3. DIMINISHING_RETURNS detection:
   """
   Trigger: <10% progress in each of last 2 iterations
   Meaning: Stuck, not making meaningful progress
   """
   
   IF len(progress_deltas) >= thresholds.diminishing_returns_span:
     recent_deltas = progress_deltas[-thresholds.diminishing_returns_span:]
     
     IF all(delta < thresholds.diminishing_returns_delta for delta in recent_deltas):
       spirals_detected.append({
         pattern: "DIMINISHING_RETURNS",
         evidence: {deltas: recent_deltas, threshold: thresholds.diminishing_returns_delta},
         severity: "warning" if checklist_score < 0.8 else "critical"
       })

4. THRASHING detection:
   """
   Trigger: 2x time spent with zero/negative progress
   Meaning: Spinning wheels, making things worse
   """
   
   IF current_time > (avg_time * thresholds.thrashing_time_multiplier):
     IF current_delta <= 0:
       spirals_detected.append({
         pattern: "THRASHING",
         evidence: {
           current_time: current_time,
           avg_time: avg_time,
           progress: current_delta
         },
         severity: "critical"
       })

5. GOLD_PLATING detection:
   """
   Trigger: Checklist at 100% but still making changes
   Meaning: Over-engineering, perfectionism
   """
   
   IF current_iteration.checklist_score >= 1.0:
     IF len(current_iteration.files_modified) > 0:
       spirals_detected.append({
         pattern: "GOLD_PLATING",
         evidence: {
           score: current_iteration.checklist_score,
           files_touched: current_iteration.files_modified
         },
         severity: "warning"
       })

6. CALCULATE overall severity:
   
   IF any(s.severity == "critical" for s in spirals_detected):
     severity = "critical"
   ELIF len(spirals_detected) > 0:
     severity = "warning"
   ELSE:
     severity = "none"
```

### DECIDE

Determine recommended action:

```
DECISION MATRIX:

severity == "none":
  recommendation = {
    action: "continue",
    rationale: "No spiral patterns detected"
  }
  commitment_delta = 0

severity == "warning" AND warning_count < 2:
  recommendation = {
    action: "constrain",
    rationale: f"Detected: {[s.pattern for s in spirals_detected]}",
    constraints: generate_constraints(spirals_detected)
  }
  commitment_delta = +1
  warning_count += 1

severity == "warning" AND warning_count >= 2:
  recommendation = {
    action: "escalate",
    rationale: "Multiple warnings, user decision needed"
  }
  commitment_delta = +1

severity == "critical":
  recommendation = {
    action: "escalate",
    rationale: f"Critical spiral: {[s.pattern for s in spirals_detected]}"
  }
  commitment_delta = +2

CONSTRAINT GENERATION:

IF "OSCILLATION" detected:
  constraints.append("Lock files that have oscillated; no further changes allowed")

IF "SCOPE_CREEP" detected:
  constraints.append(f"Revert changes to: {out_of_scope_files}")
  constraints.append("Only modify files in scope_baseline")

IF "DIMINISHING_RETURNS" detected:
  constraints.append("Accept current state as complete")
  constraints.append("Move to next item in queue")

IF "THRASHING" detected:
  constraints.append("Stop current approach")
  constraints.append("Request alternative strategy")

IF "GOLD_PLATING" detected:
  constraints.append("Checklist complete; no further refinement")
```

### ACT

Execute recommendation:

```
1. EMIT signals based on severity:
   
   IF severity == "none":
     EMIT spiral_check_passed {iteration: current_iteration.iteration}
   
   ELIF severity == "warning":
     EMIT spiral_warning {
       patterns: spirals_detected,
       recommendation: recommendation,
       commitment_level: current_commitment + commitment_delta
     }
   
   ELIF severity == "critical":
     EMIT spiral_critical {
       patterns: spirals_detected,
       recommendation: recommendation,
       commitment_level: current_commitment + commitment_delta
     }

2. UPDATE state:
   
   For each pattern in spirals_detected:
     pattern_counts[pattern] += 1

3. RETURN outputs:
   
   RETURN {
     spirals_detected,
     severity,
     recommendation,
     commitment_delta
   }
```

## Termination Conditions

- **Success**: Check complete, outputs returned
- **Failure**: N/A (always produces a result)
- **Timeout**: N/A (fast enough to not need timeout)

## Composition

### Can contain (nested loops)
- None (monitoring loop)

### Can be contained by
- `orchestration/queue-processor` (per-iteration monitoring)
- `authoring/code-generation` (inline spiral check)

### Parallelizable
- No (sequential by nature, monitors iteration sequence)

## Signals Emitted

| Signal | When | Payload |
|--------|------|---------|
| `spiral_check_passed` | No patterns detected | `{ iteration }` |
| `spiral_warning` | Warning-level patterns | `{ patterns, recommendation, commitment_level }` |
| `spiral_critical` | Critical patterns | `{ patterns, recommendation, commitment_level }` |

## Commitment Level Effects

The spiral detector's `commitment_delta` affects the containing orchestrator:

| Level | Effect on Work |
|-------|----------------|
| 0-1 | Full flexibility |
| 2 | Hard budget constraint active |
| 3 | Only incomplete items, no new scope |
| 4 | Bug fixes only |
| 5 | **FORCE COMPLETE** - accept current state |

## Example Usage

```markdown
## In Queue Processor

For each iteration:
  
  ... do work ...
  
  Execute @loops/orchestration/spiral-detector.md with:
    INPUT:
      iteration_history: previous_iterations
      current_iteration: this_iteration
    
    ON spiral_warning:
      APPLY constraints to next iteration
      INCREMENT commitment_level
    
    ON spiral_critical:
      IF commitment_level >= 4:
        FORCE_COMPLETE current item
      ELSE:
        ESCALATE to user with options:
          [C]ontinue with constraints
          [A]ccept current state
          [S]kip item
          [H]alt orchestration
```

## Tuning Guidelines

| Situation | Adjust |
|-----------|--------|
| Too many false positives | Increase thresholds |
| Missing real spirals | Decrease thresholds |
| Complex refactors flagging | Increase oscillation_file_count |
| Slow work flagging thrashing | Increase thrashing_time_multiplier |
