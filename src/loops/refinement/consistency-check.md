---
type: refinement
speed: fast
scope: collection
interface_version: loop-interface@1.0
description: Validate cross-references and ensure consistency across documents and code.
---
# Consistency Check Loop

Validate cross-references and ensure consistency across documents/code.

**Version**: 1.0.0
**Interface**: loop-interface@1.0

## Classification

- **Type**: refinement
- **Speed**: fast (~5-20s per check)
- **Scope**: collection (multiple files/documents)

## Interface

### Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| artifacts | List<Artifact> | yes | Documents/code to check for consistency |
| check_types | List<CheckType> | no | Types of consistency to verify |
| reference_sources | List<Source> | no | Authoritative sources for verification |

### Outputs

| Name | Type | Description |
|------|------|-------------|
| consistent | Boolean | Whether all checks passed |
| inconsistencies | List<Inconsistency> | Found inconsistencies |
| resolutions | List<Resolution> | Suggested or applied fixes |
| cross_ref_map | CrossRefMap | Valid cross-references |
| terminology_report | TermReport | Term usage consistency |

### State

| Field | Type | Description |
|-------|------|-------------|
| terms_seen | Map<Term, List<Usage>> | Term occurrences |
| refs_validated | Set<RefId> | Validated references |

## Types

```typescript
type CheckType =
  | "cross_references"    // Links between documents
  | "terminology"         // Consistent term usage
  | "versioning"          // Version number consistency
  | "naming"              // Identifier naming
  | "schema"              // Data structure consistency
  | "api_contracts"       // API consistency
  | "dependencies"        // Dependency versions

type Inconsistency = {
  type: CheckType
  severity: "error" | "warning" | "info"
  locations: List<Location>
  description: string
  suggested_resolution: string
}

type Resolution = {
  inconsistency_id: string
  action: "auto_fixed" | "manual_required" | "acceptable"
  changes: List<Change>
}
```

## OODA Phases

### OBSERVE

Collect consistency signals across artifacts:

```
1. INDEX all artifacts:
   
   FOR artifact in artifacts:
     IF artifact.type == "spec":
       index_spec(artifact)
       # Extract: requirements, terms, references
     
     ELIF artifact.type == "code":
       index_code(artifact)
       # Extract: functions, types, imports
     
     ELIF artifact.type == "doc":
       index_doc(artifact)
       # Extract: sections, links, terms

2. EXTRACT cross-references:
   
   all_refs = []
   
   FOR artifact in artifacts:
     refs = extract_references(artifact)
     # @spec-name.md, FR-001, #section, import X
     
     FOR ref in refs:
       all_refs.append({
         from_artifact: artifact,
         from_location: ref.location,
         to_target: ref.target,
         ref_type: ref.type
       })

3. COLLECT terminology:
   
   FOR artifact in artifacts:
     terms = extract_terms(artifact)
     # Domain terms, identifiers, acronyms
     
     FOR term in terms:
       IF term in terms_seen:
         terms_seen[term].append({
           artifact: artifact,
           context: term.context,
           definition: term.definition if defined
         })
       ELSE:
         terms_seen[term] = [usage]

4. GATHER versioning info:
   
   versions = {}
   
   FOR artifact in artifacts:
     version_refs = extract_versions(artifact)
     # Package versions, spec versions, API versions
     
     FOR ref in version_refs:
       IF ref.package in versions:
         versions[ref.package].append({
           artifact: artifact,
           version: ref.version
         })
       ELSE:
         versions[ref.package] = [ref]

5. MAP schemas/contracts:
   
   schemas = {}
   
   FOR artifact in artifacts:
     IF has_schema(artifact):
       schema = extract_schema(artifact)
       schemas[schema.name] = {
         artifact: artifact,
         fields: schema.fields,
         types: schema.types
       }

SIGNALS:
  all_refs: cross-references to validate
  terms_seen: term usage map
  versions: version references
  schemas: schema definitions
```

### ORIENT

Analyze for inconsistencies:

```
1. VALIDATE cross-references:
   
   IF "cross_references" in check_types:
     FOR ref in all_refs:
       target = resolve_target(ref.to_target, artifacts)
       
       IF target is None:
         inconsistencies.append({
           type: "cross_references",
           severity: "error",
           locations: [ref.from_location],
           description: f"Broken reference to {ref.to_target}",
           suggested_resolution: find_similar_target(ref.to_target)
         })
       ELSE:
         cross_ref_map.add_valid(ref, target)
         refs_validated.add(ref.id)

2. CHECK terminology consistency:
   
   IF "terminology" in check_types:
     FOR term, usages in terms_seen.items():
       # Check for inconsistent definitions
       definitions = unique(u.definition for u in usages if u.definition)
       
       IF len(definitions) > 1:
         inconsistencies.append({
           type: "terminology",
           severity: "warning",
           locations: [u.artifact for u in usages],
           description: f"Term '{term}' has multiple definitions",
           suggested_resolution: "Consolidate to single definition"
         })
       
       # Check for inconsistent casing/spelling
       spellings = unique(u.surface_form for u in usages)
       IF len(spellings) > 1:
         canonical = most_common(spellings)
         inconsistencies.append({
           type: "terminology",
           severity: "info",
           locations: varied_locations,
           description: f"Inconsistent spelling: {spellings}",
           suggested_resolution: f"Standardize to '{canonical}'"
         })

3. VERIFY version consistency:
   
   IF "versioning" in check_types:
     FOR package, refs in versions.items():
       version_set = unique(r.version for r in refs)
       
       IF len(version_set) > 1:
         inconsistencies.append({
           type: "versioning",
           severity: "error",
           locations: [r.artifact for r in refs],
           description: f"{package} has multiple versions: {version_set}",
           suggested_resolution: f"Align to {max(version_set)}"
         })

4. CHECK schema consistency:
   
   IF "schema" in check_types:
     # Compare schema definitions across artifacts
     FOR schema_name, definitions in group_schemas_by_name(schemas):
       IF len(definitions) > 1:
         diffs = compare_schemas(definitions)
         IF diffs:
           inconsistencies.append({
             type: "schema",
             severity: "error",
             locations: [d.artifact for d in definitions],
             description: f"Schema '{schema_name}' has conflicting definitions",
             suggested_resolution: "Reconcile field differences"
           })

5. VERIFY API contracts:
   
   IF "api_contracts" in check_types:
     # Compare spec API with implementation
     FOR endpoint in spec_endpoints:
       impl = find_implementation(endpoint)
       IF impl:
         diff = compare_contract(endpoint, impl)
         IF diff:
           inconsistencies.append({
             type: "api_contracts",
             severity: "error",
             locations: [endpoint.location, impl.location],
             description: f"API mismatch: {diff}",
             suggested_resolution: "Update spec or implementation"
           })

6. CALCULATE consistency score:
   
   total_checks = len(all_refs) + len(terms_seen) + len(versions) + len(schemas)
   issues = len(inconsistencies)
   
   consistency_score = (total_checks - issues) / total_checks
```

### DECIDE

Determine resolution strategy:

```
1. CATEGORIZE inconsistencies:
   
   auto_resolvable = []
   manual_required = []
   
   FOR issue in inconsistencies:
     IF can_auto_resolve(issue):
       auto_resolvable.append({
         issue: issue,
         resolution: generate_resolution(issue),
         confidence: resolution_confidence(issue)
       })
     ELSE:
       manual_required.append(issue)

2. PRIORITIZE by severity:
   
   errors = filter(inconsistencies, severity == "error")
   warnings = filter(inconsistencies, severity == "warning")
   info = filter(inconsistencies, severity == "info")
   
   IF len(errors) > 0:
     priority = "must_resolve"
   ELIF len(warnings) > 0:
     priority = "should_resolve"
   ELSE:
     priority = "optional"

3. DECIDE on action:
   
   IF len(inconsistencies) == 0:
     decision = "CONSISTENT"
   ELIF len(errors) == 0 AND len(auto_resolvable) == len(inconsistencies):
     decision = "AUTO_FIX"
   ELIF len(errors) > 0:
     decision = "BLOCK"
   ELSE:
     decision = "PARTIAL_FIX"
```

### ACT

Apply resolutions:

```
1. IF decision == "CONSISTENT":
   
   EMIT consistency_verified {
     artifacts: len(artifacts),
     refs_validated: len(refs_validated),
     terms_checked: len(terms_seen)
   }
   
   RETURN {
     consistent: True,
     inconsistencies: [],
     resolutions: [],
     cross_ref_map: cross_ref_map,
     terminology_report: generate_term_report(terms_seen)
   }

2. IF decision == "AUTO_FIX":
   
   FOR resolution in auto_resolvable:
     IF resolution.confidence > confidence_threshold:
       apply_resolution(resolution)
       resolutions.append({
         inconsistency_id: resolution.issue.id,
         action: "auto_fixed",
         changes: resolution.changes
       })
   
   EMIT consistency_fixed {
     fixes_applied: len(resolutions),
     remaining: 0
   }
   
   RETURN {
     consistent: True,
     inconsistencies: [],
     resolutions: resolutions,
     cross_ref_map: cross_ref_map,
     terminology_report: generate_term_report(terms_seen)
   }

3. IF decision == "PARTIAL_FIX":
   
   FOR resolution in auto_resolvable:
     IF resolution.confidence > confidence_threshold:
       apply_resolution(resolution)
       resolutions.append({...})
   
   FOR issue in manual_required:
     resolutions.append({
       inconsistency_id: issue.id,
       action: "manual_required",
       suggestion: issue.suggested_resolution
     })
   
   EMIT consistency_partial {
     fixed: len(auto_fixed),
     manual_needed: len(manual_required)
   }
   
   RETURN {
     consistent: False,
     inconsistencies: manual_required,
     resolutions: resolutions,
     cross_ref_map: cross_ref_map,
     terminology_report: generate_term_report(terms_seen)
   }

4. IF decision == "BLOCK":
   
   EMIT consistency_blocked {
     error_count: len(errors),
     blocking_issues: errors
   }
   
   RETURN {
     consistent: False,
     inconsistencies: inconsistencies,
     resolutions: [],
     cross_ref_map: partial_map,
     terminology_report: generate_term_report(terms_seen)
   }
```

## Termination Conditions

- **Success**: All checks pass or only auto-fixable issues
- **Failure**: Blocking inconsistencies that require manual resolution
- **Timeout**: N/A (fast loop, no timeout)

## Composition

### Can contain (nested loops)
- None (atomic check loop)

### Can be contained by
- `verification/acceptance-gate` (as validation check)
- `authoring/spec-drafting` (post-draft validation)
- Workflow commands

### Parallelizable
- Conditional: Different check types can run in parallel
- No: Cross-artifact checks need full artifact set

## Signals Emitted

| Signal | When | Payload |
|--------|------|---------|
| `consistency_verified` | All checks pass | `{ artifacts, refs, terms }` |
| `consistency_fixed` | All issues auto-fixed | `{ fixes_applied }` |
| `consistency_partial` | Some manual fixes needed | `{ fixed, manual_needed }` |
| `consistency_blocked` | Blocking issues found | `{ error_count, issues }` |

## Check Patterns

### Cross-Reference Validation

```
Pattern: @[spec-name]#[section]
Example: @auth-spec.md#token-handling

Validation:
  1. File exists
  2. Section/anchor exists
  3. Content still relevant
```

### Terminology Consistency

```
Check: Same term, same definition
Example: "Access Token" defined consistently

Detection:
  1. Extract all term definitions
  2. Group by normalized term
  3. Compare definitions
  4. Flag differences
```

### Version Alignment

```
Check: Same package, same version
Example: "effect": "^3.0.0" in all package.json

Detection:
  1. Extract version declarations
  2. Group by package name
  3. Compare version strings
  4. Flag mismatches
```

## Example Usage

```markdown
## Integration Validation

Execute @loops/refinement/consistency-check.md with:
  INPUT:
    artifacts: [spec_a, spec_b, spec_c, implementation]
    check_types: ["cross_references", "terminology", "api_contracts"]
  
  ON consistency_verified:
    PROCEED to next phase
  
  ON consistency_partial:
    APPLY auto-fixes
    FLAG manual issues for review
  
  ON consistency_blocked:
    HALT workflow
    REPORT blocking issues
```
