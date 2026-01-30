---
type: exploration
speed: medium
scope: session
interface_version: loop-interface@1.0
description: Map existing code patterns, architecture, and conventions before making changes.
---
# Codebase Discovery Loop

Map existing code patterns, architecture, and conventions before making changes.

**Version**: 1.0.0
**Interface**: loop-interface@1.0

## Classification

- **Type**: exploration
- **Speed**: medium (~1-3 minutes)
- **Scope**: session

## Interface

### Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| focus_area | Text | yes | Area of codebase to explore (e.g., "authentication", "data layer") |
| entry_points | List<FilePath> | no | Starting files/directories to explore from |
| depth | "shallow" \| "standard" \| "deep" | no | Exploration depth (default: standard) |
| pattern_types | List<PatternType> | no | Specific patterns to look for |

### Outputs

| Name | Type | Description |
|------|------|-------------|
| architecture_map | ArchitectureMap | High-level structure discovered |
| patterns | List<PatternMatch> | Patterns found with locations |
| conventions | List<Convention> | Coding conventions detected |
| dependencies | DependencyGraph | Internal/external dependency map |
| entry_points | List<EntryPoint> | Key files for the focus area |
| recommendations | List<Recommendation> | Suggested approaches based on findings |

### State

| Field | Type | Description |
|-------|------|-------------|
| explored_files | Set<FilePath> | Files already examined |
| pattern_cache | Map<Pattern, List<Location>> | Cached pattern matches |

## OODA Phases

### OBSERVE

Scan codebase for relevant structure:

```
1. IDENTIFY entry points:
   
   IF entry_points provided:
     start_from = entry_points
   ELSE:
     # Use semantic search to find relevant areas
     start_from = SemanticSearch(
       query: f"Where is {focus_area} implemented?",
       target_directories: []
     )

2. MAP directory structure:
   
   → Glob: find all source files in relevant directories
   → Build file tree with types (source, test, config, docs)
   → Identify module boundaries

3. SCAN for patterns:
   
   ARCHITECTURAL PATTERNS:
     → Grep: "class.*Controller|Handler|Service|Repository"
     → Grep: "export.*function|const.*=.*=>"
     → Detect: MVC, layered, hexagonal, event-driven
   
   DEPENDENCY PATTERNS:
     → Parse imports/requires
     → Build dependency graph
     → Identify circular dependencies
   
   NAMING CONVENTIONS:
     → File naming: kebab-case, camelCase, PascalCase
     → Function naming: verbs, prefixes (get, set, is, has)
     → Variable naming: constants, privates
   
   ERROR HANDLING:
     → Grep: "try|catch|throw|Error|Result|Either"
     → Detect: exceptions, result types, error codes

4. EXTRACT code samples:
   
   For each pattern found:
     → Read surrounding context (10-20 lines)
     → Note file path and line numbers
     → Classify as: core, utility, test, config

SIGNALS:
  file_tree: directory structure
  pattern_matches: [{pattern, location, snippet}]
  import_graph: dependency relationships
  naming_samples: examples of naming conventions
```

### ORIENT

Interpret findings into actionable insights:

```
1. BUILD architecture map:
   
   layers = detect_layers(file_tree, import_graph)
   # e.g., presentation → business → data → infrastructure
   
   modules = detect_modules(file_tree, import_graph)
   # e.g., auth, users, documents, notifications
   
   boundaries = detect_boundaries(modules, import_graph)
   # Where modules interact, API surfaces

2. CLASSIFY patterns:
   
   For each pattern_match:
     frequency = count occurrences
     consistency = how consistently applied (0-1)
     scope = where it applies (global, module, file)
     
     IF frequency > threshold AND consistency > 0.8:
       conventions.append(as_convention(pattern_match))
     ELSE:
       patterns.append(pattern_match)

3. ASSESS health indicators:
   
   coupling_score = analyze_coupling(import_graph)
   # High coupling = changes ripple widely
   
   cohesion_score = analyze_cohesion(modules)
   # Low cohesion = modules do too many things
   
   test_coverage = estimate_coverage(file_tree)
   # Ratio of test files to source files
   
   documentation = assess_documentation(file_tree)
   # README, comments, JSDoc presence

4. IDENTIFY entry points for focus_area:
   
   entry_points = []
   
   For each file related to focus_area:
     centrality = calculate_centrality(file, import_graph)
     relevance = semantic_similarity(file, focus_area)
     
     IF centrality > threshold OR relevance > 0.8:
       entry_points.append({
         file: file,
         reason: "high centrality" | "direct match",
         suggested_action: "start here" | "reference only"
       })
```

### DECIDE

Determine recommendations and completeness:

```
1. EVALUATE exploration completeness:
   
   coverage = len(explored_files) / estimated_relevant_files
   pattern_saturation = new_patterns_last_iteration / total_patterns
   
   IF coverage < 0.7 AND depth != "shallow":
     decision = "EXPAND"
     action = explore_adjacent_areas()
   
   ELIF pattern_saturation > 0.1 AND depth == "deep":
     decision = "CONTINUE"
     action = explore_edge_cases()
   
   ELSE:
     decision = "COMPLETE"
     action = generate_recommendations()

2. GENERATE recommendations:
   
   recommendations = []
   
   # Based on conventions found
   IF conventions.length > 0:
     recommendations.append({
       type: "follow_convention",
       convention: most_relevant_convention,
       rationale: "Maintains consistency with existing code"
     })
   
   # Based on architecture
   IF architecture_map.layers:
     recommendations.append({
       type: "layer_placement",
       suggested_layer: appropriate_layer_for(focus_area),
       rationale: "Follows existing layered architecture"
     })
   
   # Based on patterns
   IF similar_pattern_exists:
     recommendations.append({
       type: "extend_pattern",
       pattern: existing_pattern,
       rationale: "Similar functionality already implemented"
     })
   
   # Based on health
   IF coupling_score > 0.7:
     recommendations.append({
       type: "caution",
       warning: "High coupling detected",
       suggestion: "Consider interface abstraction"
     })
```

### ACT

Produce discovery outputs:

```
1. COMPILE architecture map:
   
   architecture_map = {
     layers: detected_layers,
     modules: detected_modules,
     boundaries: detected_boundaries,
     diagram: generate_mermaid_diagram()
   }

2. FORMAT pattern documentation:
   
   For each pattern in patterns:
     pattern.examples = top_3_examples
     pattern.usage_guide = how_to_apply

3. EMIT discovery complete:
   
   EMIT codebase_discovered {
     focus_area: focus_area,
     files_explored: len(explored_files),
     patterns_found: len(patterns),
     conventions_found: len(conventions),
     health_score: avg(coupling_score, cohesion_score, test_coverage)
   }

4. RETURN outputs:
   
   RETURN {
     architecture_map,
     patterns,
     conventions,
     dependencies,
     entry_points,
     recommendations
   }
```

## Termination Conditions

- **Success**: Sufficient coverage achieved with actionable recommendations
- **Failure**: Cannot access codebase or no relevant code found
- **Timeout**: Max exploration time reached (preserve partial results)

## Composition

### Can contain (nested loops)
- None (leaf exploration loop)

### Can be contained by
- `exploration/problem-space` (for code-related problems)
- `authoring/code-generation` (pre-implementation discovery)
- `refactoring/*` workflows

### Parallelizable
- Conditional: Different focus areas can explore in parallel

## Signals Emitted

| Signal | When | Payload |
|--------|------|---------|
| `area_explored` | Directory/module scanned | `{ area, files_count, patterns_found }` |
| `pattern_discovered` | New pattern identified | `{ pattern, frequency, examples }` |
| `convention_detected` | Consistent pattern promoted | `{ convention, consistency_score }` |
| `codebase_discovered` | Exploration complete | `{ summary_stats, health_scores }` |

## Pattern Types

```typescript
type PatternType =
  | "architectural"    // MVC, layered, hexagonal
  | "structural"       // Factory, singleton, adapter
  | "behavioral"       // Observer, strategy, command
  | "error_handling"   // Try/catch, Result, Either
  | "testing"          // Unit, integration, e2e patterns
  | "naming"           // Conventions for identifiers
  | "file_organization" // How files/folders are structured
```

## Example Usage

```markdown
## Pre-Implementation Discovery

Execute @loops/exploration/codebase-discovery.md with:
  INPUT:
    focus_area: "user authentication"
    depth: "standard"
    pattern_types: ["architectural", "error_handling"]
  
  ON pattern_discovered:
    LOG "Found pattern: {pattern.name}"
  
  ON codebase_discovered:
    USE architecture_map to inform design
    USE conventions to maintain consistency
    USE entry_points to locate integration points
```

## Output Example

```yaml
architecture_map:
  layers:
    - name: "API"
      path: "src/api/"
      responsibility: "HTTP handlers, routing"
    - name: "Services"
      path: "src/services/"
      responsibility: "Business logic"
    - name: "Data"
      path: "src/repositories/"
      responsibility: "Database access"

patterns:
  - name: "Repository Pattern"
    frequency: 8
    locations: ["src/repositories/*.ts"]
    example: |
      export class UserRepository {
        async findById(id: string): Promise<User | null>
        async save(user: User): Promise<User>
      }

conventions:
  - name: "Error Result Type"
    pattern: "Result<T, E> for fallible operations"
    consistency: 0.92
    example: "const result = await service.process()"

recommendations:
  - type: "follow_convention"
    convention: "Repository Pattern"
    rationale: "All data access uses repositories"
  - type: "extend_pattern"
    pattern: "UserRepository"
    rationale: "Similar to existing auth repositories"
```
