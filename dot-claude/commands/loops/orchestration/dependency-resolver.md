---
type: orchestration
speed: fast
scope: collection
interface_version: loop-interface@1.0
description: Analyze dependencies and determine optimal processing order.
---
# Dependency Resolver Loop

Analyze dependencies and determine optimal processing order.

**Version**: 1.0.0
**Interface**: loop-interface@1.0

## Classification

- **Type**: orchestration
- **Speed**: fast (~5-30s)
- **Scope**: collection

## Interface

### Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| items | List<Item> | yes | Items with potential dependencies |
| dependency_types | List<DepType> | no | Types of dependencies to analyze |
| resolution_strategy | Strategy | no | How to handle cycles/conflicts |

### Outputs

| Name | Type | Description |
|------|------|-------------|
| ordered_items | List<Item> | Topologically sorted items |
| dependency_graph | Graph | Full dependency graph |
| cycles | List<Cycle> | Detected circular dependencies |
| parallel_groups | List<Group> | Items that can run in parallel |
| critical_path | List<Item> | Longest dependency chain |
| resolutions | List<Resolution> | Applied cycle resolutions |

### State

| Field | Type | Description |
|-------|------|-------------|
| graph | Graph | Dependency graph being built |
| visited | Set<ItemId> | Items already processed |

## Types

```typescript
type DepType =
  | "explicit"    // Declared dependencies
  | "implicit"    // Inferred from content
  | "data_flow"   // Data dependencies
  | "temporal"    // Time-based ordering

type Strategy =
  | "fail_on_cycle"     // Error if cycles detected
  | "break_weakest"     // Break cycle at weakest link
  | "merge_cycle"       // Merge cyclic items
  | "user_resolution"   // Ask user to resolve

type Cycle = {
  items: List<ItemId>
  edges: List<Edge>
  strength: number  // How tightly coupled
}

type Graph = {
  nodes: Map<ItemId, Node>
  edges: List<Edge>
  
  add_node(item: Item): void
  add_edge(from: ItemId, to: ItemId, type: DepType): void
  get_dependencies(id: ItemId): List<ItemId>
  get_dependents(id: ItemId): List<ItemId>
}
```

## OODA Phases

### OBSERVE

Build dependency graph:

```
1. EXTRACT explicit dependencies:
   
   FOR item in items:
     graph.add_node(item)
     
     # Parse declared dependencies
     IF item.dependencies:
       FOR dep in item.dependencies:
         target = find_item(dep, items)
         IF target:
           graph.add_edge(
             from: item.id,
             to: target.id,
             type: "explicit",
             strength: 1.0
           )

2. INFER implicit dependencies:
   
   IF "implicit" in dependency_types:
     FOR item in items:
       # Analyze content for references
       references = extract_references(item.content)
       
       FOR ref in references:
         target = resolve_reference(ref, items)
         IF target AND target.id != item.id:
           # Check if edge already exists
           IF not graph.has_edge(item.id, target.id):
             graph.add_edge(
               from: item.id,
               to: target.id,
               type: "implicit",
               strength: 0.5  # Lower weight for inferred
             )

3. ANALYZE data flow:
   
   IF "data_flow" in dependency_types:
     FOR item in items:
       # What data does this item produce?
       outputs = extract_outputs(item)
       
       # What data does this item consume?
       inputs = extract_inputs(item)
       
       FOR input in inputs:
         # Find producer
         producer = find_producer(input, items)
         IF producer:
           graph.add_edge(
             from: item.id,
             to: producer.id,
             type: "data_flow",
             data: input
           )

4. CHECK temporal constraints:
   
   IF "temporal" in dependency_types:
     FOR item in items:
       # Parse temporal markers
       temporal = extract_temporal(item)
       # "after X", "before Y", "with Z"
       
       FOR constraint in temporal:
         target = find_item(constraint.reference, items)
         IF target:
           IF constraint.type == "after":
             graph.add_edge(item.id, target.id, type: "temporal")
           ELIF constraint.type == "before":
             graph.add_edge(target.id, item.id, type: "temporal")

SIGNALS:
  graph: complete dependency graph
  edge_count: number of dependencies found
  edge_types: breakdown by type
```

### ORIENT

Analyze graph structure:

```
1. DETECT cycles:
   
   cycles = []
   
   # Tarjan's algorithm for strongly connected components
   sccs = tarjan_scc(graph)
   
   FOR scc in sccs:
     IF len(scc) > 1:
       # This is a cycle
       cycle_edges = get_internal_edges(scc, graph)
       cycle_strength = avg(e.strength for e in cycle_edges)
       
       cycles.append({
         items: scc,
         edges: cycle_edges,
         strength: cycle_strength
       })

2. CALCULATE critical path:
   
   IF len(cycles) == 0:
     # Standard critical path calculation
     critical_path = find_longest_path(graph)
   ELSE:
     # Approximate with cycles present
     critical_path = find_longest_path_with_cycles(graph, cycles)

3. IDENTIFY parallel groups:
   
   # Items with no dependencies between them
   parallel_groups = []
   
   # Get items at each depth level
   levels = calculate_depth_levels(graph)
   
   FOR level in levels:
     level_items = items_at_level(level)
     
     # Group items that can truly run in parallel
     independent = find_independent_subsets(level_items, graph)
     
     FOR group in independent:
       IF len(group) > 1:
         parallel_groups.append({
           items: group,
           level: level
         })

4. ASSESS graph health:
   
   metrics = {
     node_count: len(graph.nodes),
     edge_count: len(graph.edges),
     density: edge_count / (node_count * (node_count - 1)),
     max_depth: len(levels),
     parallelism_potential: sum(len(g.items) for g in parallel_groups),
     cycle_count: len(cycles)
   }
```

### DECIDE

Choose resolution strategy for cycles:

```
1. IF len(cycles) == 0:
   decision = "PROCEED"
   rationale = "No cycles detected"

2. ELIF resolution_strategy == "fail_on_cycle":
   decision = "FAIL"
   rationale = f"Detected {len(cycles)} cycles"

3. ELIF resolution_strategy == "break_weakest":
   decision = "BREAK_CYCLES"
   
   FOR cycle in cycles:
     # Find weakest edge to break
     weakest = min(cycle.edges, by=strength)
     cycle.resolution = {
       action: "remove_edge",
       edge: weakest,
       rationale: "Weakest link in cycle"
     }

4. ELIF resolution_strategy == "merge_cycle":
   decision = "MERGE_CYCLES"
   
   FOR cycle in cycles:
     cycle.resolution = {
       action: "merge",
       new_item: merge_items(cycle.items),
       rationale: "Tightly coupled items merged"
     }

5. ELIF resolution_strategy == "user_resolution":
   decision = "ESCALATE"
   
   FOR cycle in cycles:
     cycle.resolution = {
       action: "user_decision",
       options: [
         f"Break at {e.from} -> {e.to}" for e in cycle.edges
       ] + ["Merge all items"]
     }
```

### ACT

Apply resolutions and generate ordering:

```
1. APPLY cycle resolutions:
   
   IF decision in ["BREAK_CYCLES", "MERGE_CYCLES"]:
     FOR cycle in cycles:
       IF cycle.resolution.action == "remove_edge":
         graph.remove_edge(cycle.resolution.edge)
         resolutions.append({
           cycle: cycle.items,
           action: "edge_removed",
           edge: cycle.resolution.edge
         })
       
       ELIF cycle.resolution.action == "merge":
         merged = merge_items(cycle.items)
         
         # Replace cycle items with merged item
         FOR item in cycle.items:
           graph.remove_node(item)
         
         graph.add_node(merged)
         
         # Redirect edges
         FOR item in cycle.items:
           FOR dep in graph.get_dependencies(item):
             IF dep not in cycle.items:
               graph.add_edge(merged.id, dep)
           FOR dependent in graph.get_dependents(item):
             IF dependent not in cycle.items:
               graph.add_edge(dependent, merged.id)
         
         resolutions.append({
           cycle: cycle.items,
           action: "merged",
           result: merged.id
         })
         
         # Update items list
         items = [i for i in items if i.id not in cycle.items]
         items.append(merged)

2. ELIF decision == "ESCALATE":
   
   EMIT resolution_needed {
     cycles: cycles,
     options: [c.resolution.options for c in cycles]
   }
   
   # Wait for user decision
   user_decisions = WAIT_FOR user_input
   
   FOR cycle, user_decision in zip(cycles, user_decisions):
     apply_user_resolution(cycle, user_decision)

3. GENERATE topological order:
   
   IF decision == "FAIL":
     ordered_items = None
     
     EMIT resolution_failed {
       cycles: cycles,
       message: "Cannot order items with circular dependencies"
     }
   
   ELSE:
     # Kahn's algorithm for topological sort
     ordered_items = []
     in_degree = {node: len(graph.get_dependencies(node)) for node in graph.nodes}
     queue = [node for node, degree in in_degree.items() if degree == 0]
     
     WHILE queue:
       node = queue.pop(0)
       ordered_items.append(find_item(node, items))
       
       FOR dependent in graph.get_dependents(node):
         in_degree[dependent] -= 1
         IF in_degree[dependent] == 0:
           queue.append(dependent)

4. EMIT completion:
   
   IF ordered_items:
     EMIT dependencies_resolved {
       items: len(ordered_items),
       cycles_resolved: len(resolutions),
       parallel_opportunities: len(parallel_groups),
       critical_path_length: len(critical_path)
     }
   
5. RETURN:
   
   RETURN {
     ordered_items: ordered_items,
     dependency_graph: graph,
     cycles: cycles,
     parallel_groups: parallel_groups,
     critical_path: critical_path,
     resolutions: resolutions
   }
```

## Termination Conditions

- **Success**: All dependencies resolved, topological order produced
- **Failure**: Unresolvable cycles with `fail_on_cycle` strategy
- **Timeout**: N/A (fast algorithm)

## Composition

### Can contain (nested loops)
- None (computational loop)

### Can be contained by
- `orchestration/queue-processor` (before processing)
- Workflow commands

### Parallelizable
- No (graph algorithms are inherently sequential)

## Signals Emitted

| Signal | When | Payload |
|--------|------|---------|
| `cycle_detected` | Cycle found | `{ cycle_items, strength }` |
| `resolution_needed` | User input required | `{ cycles, options }` |
| `resolution_applied` | Cycle resolved | `{ cycle, action }` |
| `resolution_failed` | Cannot resolve | `{ cycles, message }` |
| `dependencies_resolved` | Complete | `{ items, parallel, critical_path }` |

## Graph Algorithms Used

| Algorithm | Purpose | Complexity |
|-----------|---------|------------|
| Tarjan's SCC | Cycle detection | O(V + E) |
| Kahn's Algorithm | Topological sort | O(V + E) |
| Longest Path | Critical path | O(V + E) |
| DFS | Dependency traversal | O(V + E) |

## Example Usage

```markdown
## Resolve Spec Dependencies

Execute @loops/orchestration/dependency-resolver.md with:
  INPUT:
    items: spec_inventory
    dependency_types: ["explicit", "implicit"]
    resolution_strategy: "break_weakest"
  
  ON cycle_detected:
    LOG "Found cycle: {cycle_items}"
  
  ON resolution_applied:
    LOG "Resolved by: {action}"
  
  ON dependencies_resolved:
    USE ordered_items as implementation_queue
    USE parallel_groups for concurrent execution
    MONITOR critical_path for bottlenecks
```

## Output Example

```yaml
ordered_items:
  - id: "spec-auth"
    order: 1
    can_start: immediately
  - id: "spec-users"
    order: 2
    depends_on: ["spec-auth"]
  - id: "spec-notifications"
    order: 2  # Same level, can parallel
    depends_on: ["spec-auth"]
  - id: "spec-dashboard"
    order: 3
    depends_on: ["spec-users", "spec-notifications"]

parallel_groups:
  - level: 2
    items: ["spec-users", "spec-notifications"]

critical_path:
  - "spec-auth" -> "spec-users" -> "spec-dashboard"
  length: 3

cycles: []  # None detected

resolutions: []  # None needed
```
