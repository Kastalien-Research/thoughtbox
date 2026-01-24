---
type: authoring
speed: medium
scope: document
interface_version: loop-interface@1.0
description: Generate implementation code from specifications with iterative refinement.
---
# Code Generation Loop

Generate implementation code from specifications with iterative refinement.

**Version**: 1.0.0
**Interface**: loop-interface@1.0

## Classification

- **Type**: authoring
- **Speed**: medium (~1-5 minutes per component)
- **Scope**: document (spec) → files (implementation)

## Interface

### Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| spec | SpecDocument | yes | Specification to implement |
| codebase_context | CodebaseContext | no | Existing code patterns and conventions |
| target_files | List<FilePath> | no | Files to create/modify |
| implementation_style | Style | no | Coding style preferences |

### Outputs

| Name | Type | Description |
|------|------|-------------|
| files_created | List<FileChange> | New files with content |
| files_modified | List<FileChange> | Modified files with diffs |
| tests_generated | List<FileChange> | Test files created |
| implementation_notes | List<Note> | Decisions and rationale |
| coverage_map | Map<Requirement, Implementation> | Traceability matrix |

### State

| Field | Type | Description |
|-------|------|-------------|
| iteration | Number | Current implementation iteration |
| requirements_implemented | Set<RequirementId> | Requirements addressed |
| files_touched | Set<FilePath> | All files modified across iterations |
| scope_baseline | Set<FilePath> | Files expected to be modified |

## OODA Phases

### OBSERVE

Analyze spec and gather implementation context:

```
1. PARSE specification:
   
   requirements = extract_requirements(spec)
   # FR-001, FR-002, NFR-001, etc.
   
   interfaces = extract_interfaces(spec)
   # API contracts, data models, signatures
   
   acceptance_criteria = extract_criteria(spec)
   # Testable conditions for each requirement
   
   dependencies = extract_dependencies(spec)
   # Other specs, external services, libraries

2. ANALYZE codebase context:
   
   IF codebase_context provided:
     patterns = codebase_context.patterns
     conventions = codebase_context.conventions
     architecture = codebase_context.architecture
   ELSE:
     # Quick discovery
     Execute @loops/exploration/codebase-discovery.md
       focus_area: spec.domain
       depth: "shallow"

3. DETERMINE scope:
   
   IF target_files provided:
     scope_baseline = Set(target_files)
   ELSE:
     # Infer from spec and architecture
     scope_baseline = infer_affected_files(
       spec: spec,
       architecture: architecture,
       interfaces: interfaces
     )

4. PLAN implementation order:
   
   # Topological sort by dependency
   implementation_order = topological_sort(requirements, by_dependency)
   
   # Group by file to minimize context switches
   file_groups = group_requirements_by_file(implementation_order, scope_baseline)

SIGNALS:
  requirements: parsed requirements with priorities
  scope_baseline: expected files to modify
  implementation_order: ordered list of work
```

### ORIENT

Design implementation approach for each component:

```
1. FOR each file_group in file_groups:
   
   file = file_group.file
   reqs = file_group.requirements
   
   # Assess current state
   IF file exists:
     current_content = Read(file)
     existing_code = parse_code(current_content)
     
     # Identify integration points
     integration_points = find_where_to_insert(
       existing_code,
       reqs
     )
   ELSE:
     existing_code = None
     integration_points = "new_file"
   
   # Select implementation pattern
   pattern = select_pattern(
     requirements: reqs,
     conventions: conventions,
     existing_patterns: patterns
   )
   
   # Design code structure
   design = {
     file: file,
     pattern: pattern,
     integration_points: integration_points,
     new_code_sections: plan_sections(reqs, pattern),
     tests_needed: derive_tests(reqs, acceptance_criteria)
   }
   
   implementation_designs.append(design)

2. VALIDATE design consistency:
   
   # Check for conflicts between designs
   FOR i, design_a in implementation_designs:
     FOR j, design_b in implementation_designs[i+1:]:
       conflicts = detect_conflicts(design_a, design_b)
       IF conflicts:
         resolve_conflicts(conflicts)
   
   # Check adherence to conventions
   FOR design in implementation_designs:
     violations = check_conventions(design, conventions)
     IF violations:
       adjust_design(design, violations)

3. ESTIMATE complexity:
   
   FOR design in implementation_designs:
     design.complexity = estimate_complexity(
       new_lines: design.estimated_lines,
       integration_difficulty: design.integration_points.difficulty,
       test_complexity: design.tests_needed.count
     )
```

### DECIDE

Commit to implementation strategy:

```
1. PRIORITIZE by requirement priority:
   
   must_have = filter(requirements, priority == "must")
   should_have = filter(requirements, priority == "should")
   could_have = filter(requirements, priority == "could")
   
   # Ensure must-haves are implementable
   FOR req in must_have:
     IF not has_design(req):
       ESCALATE "Cannot implement must-have requirement: {req.id}"

2. DECIDE on iteration scope:
   
   IF iteration == 1:
     # First iteration: core structure + must-haves
     this_iteration = must_have[:max_per_iteration]
     focus = "structure_and_core"
   
   ELIF iteration == 2:
     # Second iteration: remaining must + should
     this_iteration = remaining_must + should_have[:remaining_capacity]
     focus = "complete_and_enhance"
   
   ELSE:
     # Later iterations: polish and edge cases
     this_iteration = could_have + remaining
     focus = "polish"

3. PLAN test strategy:
   
   test_strategy = {
     unit_tests: for_each_function,
     integration_tests: for_each_interface,
     acceptance_tests: for_each_criterion
   }
```

### ACT

Generate code and tests:

```
1. FOR each design in this_iteration_designs:
   
   file = design.file
   
   IF design.integration_points == "new_file":
     # Generate new file
     content = generate_file(
       template: get_file_template(file.type),
       sections: design.new_code_sections,
       pattern: design.pattern,
       conventions: conventions
     )
     
     files_created.append({
       path: file,
       content: content,
       requirements_covered: design.requirements
     })
   
   ELSE:
     # Modify existing file
     current_content = Read(file)
     
     FOR section in design.new_code_sections:
       insertion_point = design.integration_points[section.id]
       
       new_code = generate_code_section(
         section: section,
         context: surrounding_code(current_content, insertion_point),
         pattern: design.pattern,
         conventions: conventions
       )
       
       current_content = insert_at(
         content: current_content,
         position: insertion_point,
         code: new_code
       )
     
     files_modified.append({
       path: file,
       original: Read(file),
       modified: current_content,
       requirements_covered: design.requirements
     })
   
   files_touched.add(file)

2. GENERATE tests:
   
   FOR design in this_iteration_designs:
     FOR test_spec in design.tests_needed:
       test_content = generate_test(
         spec: test_spec,
         implementation: get_implementation(design),
         pattern: test_pattern_for(file.type)
       )
       
       test_file = derive_test_path(design.file)
       
       tests_generated.append({
         path: test_file,
         content: test_content,
         tests_requirement: test_spec.requirement_id
       })

3. WRITE files:
   
   FOR file_change in files_created + files_modified:
     Write(file_change.path, file_change.content)
   
   FOR test_file in tests_generated:
     Write(test_file.path, test_file.content)

4. UPDATE coverage map:
   
   FOR req in requirements:
     implementation = find_implementation(req, files_touched)
     IF implementation:
       coverage_map[req.id] = {
         files: implementation.files,
         lines: implementation.line_ranges,
         tests: find_tests(req.id, tests_generated)
       }
       requirements_implemented.add(req.id)

5. CHECK for spiral:
   
   Execute @loops/orchestration/spiral-detector.md with:
     iteration_history: previous_iterations
     current_iteration: {
       files_modified: files_touched,
       checklist_score: len(requirements_implemented) / len(requirements),
       scope_baseline: scope_baseline
     }
   
   IF spiral_detected:
     EMIT spiral_warning
     IF severity == "critical":
       BREAK loop

6. EMIT progress:
   
   EMIT code_generated {
     iteration: iteration,
     files_created: len(files_created),
     files_modified: len(files_modified),
     requirements_covered: len(requirements_implemented),
     coverage_percent: len(requirements_implemented) / len(requirements)
   }

7. CHECK completion:
   
   IF all(req.id in requirements_implemented for req in must_have):
     IF iteration >= max_iterations OR all requirements implemented:
       RETURN outputs
     ELSE:
       iteration += 1
       RETURN to OBSERVE for next iteration
```

## Termination Conditions

- **Success**: All must-have requirements implemented with passing tests
- **Failure**: Cannot implement must-have requirement or spiral detected
- **Timeout**: `iteration >= MAX_ITERATIONS` (default 3)

## Composition

### Can contain (nested loops)
- `orchestration/spiral-detector` (inline monitoring)
- `refinement/code-quality` (post-generation polish)

### Can be contained by
- `orchestration/queue-processor` (batch implementation)
- Workflow commands (`/spec-orchestrator`)

### Parallelizable
- Conditional: Independent files can be generated in parallel
- No: Files with dependencies must be sequential

## Signals Emitted

| Signal | When | Payload |
|--------|------|---------|
| `file_created` | New file written | `{ path, lines, requirements }` |
| `file_modified` | Existing file changed | `{ path, additions, deletions }` |
| `test_generated` | Test file created | `{ path, test_count, coverage }` |
| `code_generated` | Iteration complete | `{ iteration, coverage_percent }` |
| `spiral_warning` | Spiral detected | `{ pattern, severity }` |
| `implementation_complete` | All done | `{ files, tests, coverage_map }` |

## Code Generation Templates

### Function Template

```typescript
/**
 * {description from requirement}
 * 
 * @implements {requirement_id}
 * @param {params from spec}
 * @returns {return type from spec}
 * @throws {error conditions from spec}
 */
{visibility} {async?} function {name}({params}): {return_type} {
  // Implementation
}
```

### Class Template

```typescript
/**
 * {description from spec}
 * 
 * @implements {requirement_ids}
 */
{export?} class {ClassName} {implements/extends} {
  // Dependencies
  constructor({dependencies}) {}
  
  // Public methods from interface
  
  // Private helpers
}
```

## Example Usage

```markdown
## Implementation Phase

FOR each spec in implementation_queue:
  
  Execute @loops/authoring/code-generation.md with:
    INPUT:
      spec: spec
      codebase_context: discovered_context
    
    CONFIG:
      MAX_ITERATIONS: 3
    
    ON code_generated:
      LOG "Iteration {iteration}: {coverage_percent}% coverage"
    
    ON spiral_warning:
      IF severity == "critical":
        ESCALATE to user
      ELSE:
        CONTINUE with constraints
    
    ON implementation_complete:
      RUN tests
      IF tests pass:
        PROCEED to next spec
      ELSE:
        ITERATE with test feedback
```
