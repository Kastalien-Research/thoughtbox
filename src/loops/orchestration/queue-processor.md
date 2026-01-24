---
type: orchestration
speed: varies
scope: session
interface_version: loop-interface@1.0
description: Process work items in priority order with resource management and spiral prevention.
---
# Queue Processor Loop

Process work items in priority order with resource management and spiral prevention.

**Version**: 1.0.0
**Interface**: loop-interface@1.0

## Classification

- **Type**: orchestration
- **Speed**: varies (supervises child loops)
- **Scope**: session (manages queue across time)

## Interface

### Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| queue | List<WorkItem> | yes | Work items to process |
| budget | Budget | no | Resource constraints |
| child_loop | LoopRef | yes | Loop to execute for each item |
| child_config | Config | no | Configuration for child loop |

### Outputs

| Name | Type | Description |
|------|------|-------------|
| completed | List<WorkItem> | Successfully processed items |
| partial | List<WorkItem> | Partially completed items |
| skipped | List<WorkItem> | Items skipped due to constraints |
| failed | List<WorkItem> | Items that failed |
| budget_used | Budget | Resources consumed |
| final_report | Report | Summary of processing |

### State

| Field | Type | Description |
|-------|------|-------------|
| current_item | WorkItem | Item being processed |
| commitment_level | Number | Constraint escalation (0-5) |
| iteration_history | List<IterationRecord> | Per-item iteration history |
| budget_remaining | Budget | Remaining resources |

## Types

```typescript
type WorkItem = {
  id: string
  name: string
  priority: number
  dependencies: List<string>  // IDs of items this depends on
  status: "pending" | "ready" | "in_progress" | "completed" | "partial" | "failed" | "skipped"
  allocated_budget: number
  metadata: any
}

type Budget = {
  total_units: number
  time_limit_ms?: number
  max_iterations_per_item: number
}

type Report = {
  items_processed: number
  success_rate: number
  budget_efficiency: number
  bottlenecks: List<string>
  recommendations: List<string>
}
```

## OODA Phases

### OBSERVE

Monitor queue and resource state:

```
1. ASSESS queue status:
   
   pending = filter(queue, status == "pending")
   ready = filter(queue, status == "ready")
   blocked = filter(queue, 
     status == "pending" AND 
     has_unmet_dependencies
   )
   in_progress = filter(queue, status == "in_progress")

2. CHECK resource constraints:
   
   budget_remaining = budget.total_units - sum(
     item.budget_used for item in queue
     if item.status in ["completed", "partial", "failed"]
   )
   
   time_remaining = budget.time_limit_ms - elapsed_time()

3. UPDATE dependency status:
   
   FOR item in blocked:
     deps = get_dependencies(item, queue)
     unmet = filter(deps, status not in ["completed"])
     
     IF len(unmet) == 0:
       item.status = "ready"
       ready.append(item)

4. COLLECT signals from current processing:
   
   IF current_item:
     current_signals = {
       progress: current_item.progress,
       iterations: current_item.iteration_count,
       budget_used: current_item.budget_used,
       issues: current_item.issues
     }

SIGNALS:
  queue_status: {pending, ready, blocked, in_progress}
  resources: {budget_remaining, time_remaining}
  current_progress: signals from active item
```

### ORIENT

Analyze queue dynamics and constraints:

```
1. PRIORITIZE ready items:
   
   # Sort by priority, then by dependency count (items that unblock others)
   ready.sort(by=[
     priority descending,
     unblocks_count descending,
     allocated_budget ascending  # Smaller items first when equal
   ])

2. DETECT bottlenecks:
   
   bottlenecks = []
   
   # Circular dependencies
   cycles = detect_cycles(queue)
   IF cycles:
     bottlenecks.append({
       type: "circular_dependency",
       items: cycles
     })
   
   # Resource bottlenecks
   IF budget_remaining < min(item.allocated_budget for item in ready):
     bottlenecks.append({
       type: "budget_exhausted",
       remaining: budget_remaining,
       needed: min_budget_needed
     })
   
   # Single item blocking many
   FOR item in blocked:
     blockers = get_blockers(item)
     IF len(blocks_many(blockers)) > 3:
       bottlenecks.append({
         type: "critical_path",
         blocker: blockers[0],
         blocked_count: len(get_blocked_by(blockers[0]))
       })

3. ASSESS commitment level triggers:
   
   # Budget depletion warnings
   IF budget_remaining < budget.total_units * 0.5:
     commitment_level = max(commitment_level, 1)
   IF budget_remaining < budget.total_units * 0.25:
     commitment_level = max(commitment_level, 2)
   
   # Time pressure
   IF time_remaining < time_limit * 0.25:
     commitment_level = max(commitment_level, 3)
   
   # Spiral detection from history
   IF detect_queue_spiral(iteration_history):
     commitment_level = max(commitment_level, 4)

4. DETERMINE queue health:
   
   health_score = calculate_health(
     completion_rate: len(completed) / len(queue),
     resource_efficiency: budget_used_effectively / budget_used_total,
     throughput: items_per_hour,
     spiral_risk: spiral_indicators
   )
```

### DECIDE

Choose next action:

```
1. SELECT next item:
   
   IF commitment_level >= 5:
     decision = "FORCE_COMPLETE_ALL"
     rationale = "Maximum commitment reached"
   
   ELIF len(ready) == 0 AND len(blocked) > 0:
     IF has_resolvable_blocks:
       decision = "RESOLVE_BLOCKS"
       rationale = "Unblock dependent items"
     ELSE:
       decision = "ESCALATE"
       rationale = "Unresolvable dependencies"
   
   ELIF len(ready) == 0 AND len(pending) == 0:
     decision = "COMPLETE"
     rationale = "Queue empty"
   
   ELIF budget_remaining <= 0:
     decision = "BUDGET_EXHAUSTED"
     rationale = "No budget remaining"
   
   ELSE:
     decision = "PROCESS_NEXT"
     next_item = ready[0]

2. APPLY commitment constraints:
   
   IF commitment_level >= 2:
     # Hard budget constraint
     IF next_item.allocated_budget > budget_remaining:
       next_item.allocated_budget = budget_remaining
   
   IF commitment_level >= 3:
     # Only incomplete items, reduced iterations
     child_config.max_iterations = 1
   
   IF commitment_level >= 4:
     # Bug fixes only mode
     child_config.mode = "minimal"
```

### ACT

Execute processing:

```
1. IF decision == "PROCESS_NEXT":
   
   current_item = next_item
   current_item.status = "in_progress"
   
   EMIT item_started {
     item: current_item.name,
     priority: current_item.priority,
     budget_allocated: current_item.allocated_budget
   }
   
   # Execute child loop for this item
   result = Execute child_loop with:
     INPUT: current_item.metadata
     CONFIG: child_config
     
     ON iteration_complete:
       iteration_history.append({
         item: current_item.id,
         iteration: result.iteration,
         progress: result.progress,
         budget_used: result.budget_used
       })
       
       # Check for spirals
       spiral_check = Execute @loops/orchestration/spiral-detector.md with:
         iteration_history: item_iterations
         current_iteration: latest
       
       IF spiral_check.severity == "critical":
         EMIT spiral_detected { item: current_item.name }
         IF commitment_level < 5:
           commitment_level += spiral_check.commitment_delta
   
   # Process result
   IF result.success:
     current_item.status = "completed"
     completed.append(current_item)
     
     EMIT item_completed {
       item: current_item.name,
       budget_used: result.budget_used
     }
   
   ELIF result.partial:
     current_item.status = "partial"
     partial.append(current_item)
     
     EMIT item_partial {
       item: current_item.name,
       completion: result.completion_percentage
     }
   
   ELSE:
     current_item.status = "failed"
     failed.append(current_item)
     
     EMIT item_failed {
       item: current_item.name,
       error: result.error
     }
   
   # Update budget
   budget_remaining -= result.budget_used
   current_item = None
   
   # Continue to next item
   RETURN to OBSERVE

2. IF decision == "RESOLVE_BLOCKS":
   
   # Try to resolve circular dependencies
   FOR cycle in bottlenecks.circular_dependencies:
     resolution = attempt_cycle_resolution(cycle)
     IF resolution:
       apply_resolution(resolution)
   
   RETURN to OBSERVE

3. IF decision == "FORCE_COMPLETE_ALL":
   
   # Accept current state of all items
   FOR item in queue:
     IF item.status == "in_progress":
       item.status = "partial"
       partial.append(item)
     ELIF item.status in ["pending", "ready"]:
       item.status = "skipped"
       skipped.append(item)
   
   EMIT force_complete {
     reason: "commitment_level_5",
     partial: len(partial),
     skipped: len(skipped)
   }
   
   PROCEED to finalization

4. IF decision == "BUDGET_EXHAUSTED":
   
   # Mark remaining as skipped
   FOR item in ready + pending:
     item.status = "skipped"
     skipped.append(item)
   
   EMIT budget_exhausted {
     completed: len(completed),
     skipped: len(skipped)
   }
   
   PROCEED to finalization

5. IF decision == "COMPLETE":
   
   # All items processed
   PROCEED to finalization

6. FINALIZATION:
   
   final_report = {
     items_processed: len(completed) + len(partial),
     success_rate: len(completed) / len(queue),
     budget_efficiency: value_delivered / budget_used,
     bottlenecks: [b.type for b in bottlenecks],
     recommendations: generate_recommendations(
       bottlenecks,
       failed,
       iteration_history
     )
   }
   
   EMIT queue_complete {
     completed: len(completed),
     partial: len(partial),
     failed: len(failed),
     skipped: len(skipped)
   }
   
   RETURN {
     completed, partial, skipped, failed,
     budget_used: budget.total_units - budget_remaining,
     final_report
   }
```

## Termination Conditions

- **Success**: All items completed or acceptable partial completion
- **Failure**: Critical items failed with no recovery
- **Timeout**: `commitment_level >= 5` triggers force complete

## Composition

### Can contain (nested loops)
- Any child loop specified in `child_loop` input
- `orchestration/spiral-detector` (inline monitoring)

### Can be contained by
- Workflow commands (`/spec-orchestrator`)
- Meta-orchestration loops

### Parallelizable
- Conditional: Independent items can be processed in parallel
- No: Items with dependencies must be sequential

## Signals Emitted

| Signal | When | Payload |
|--------|------|---------|
| `item_started` | Processing begins | `{ item, priority, budget }` |
| `item_completed` | Item succeeds | `{ item, budget_used }` |
| `item_partial` | Partial completion | `{ item, completion }` |
| `item_failed` | Item fails | `{ item, error }` |
| `spiral_detected` | Spiral in item | `{ item, pattern }` |
| `budget_warning` | Budget threshold | `{ remaining, threshold }` |
| `budget_exhausted` | No budget left | `{ completed, skipped }` |
| `force_complete` | Level 5 triggered | `{ reason, partial, skipped }` |
| `queue_complete` | All done | `{ summary_stats }` |

## Commitment Levels

| Level | Trigger | Effect |
|-------|---------|--------|
| 0 | Default | Full flexibility |
| 1 | 50% budget used | Soft warnings |
| 2 | 75% budget used | Hard budget constraint |
| 3 | 75% time used | Reduced iterations |
| 4 | Spiral detected | Minimal mode |
| 5 | Multiple triggers | Force complete all |

## Example Usage

```markdown
## Spec Implementation Queue

Execute @loops/orchestration/queue-processor.md with:
  INPUT:
    queue: spec_inventory (from spec-designer)
    budget: { total_units: 100, max_iterations_per_item: 3 }
    child_loop: @loops/authoring/code-generation.md
    child_config: { depth: "standard" }
  
  ON item_started:
    LOG "Starting: {item}"
  
  ON item_completed:
    UNBLOCK dependent items
    RUN integration tests
  
  ON spiral_detected:
    LOG "Spiral in {item}, constraining..."
  
  ON budget_warning:
    NOTIFY user of budget status
  
  ON queue_complete:
    GENERATE final report
    PROCEED to integration phase
```
