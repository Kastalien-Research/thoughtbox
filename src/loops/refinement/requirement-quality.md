---
type: refinement
speed: fast
scope: item
interface_version: loop-interface@1.0
description: Refine individual requirements for clarity, testability, and implementability.
---
# Requirement Quality Loop

Refine individual requirements for clarity, testability, and implementability.

**Version**: 1.0.0
**Interface**: loop-interface@1.0

## Classification

- **Type**: refinement
- **Speed**: fast (~5-15s per requirement)
- **Scope**: item

## Interface

### Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| requirement | Requirement | yes | The requirement to refine |
| context | SpecContext | no | Surrounding spec context |
| related_requirements | List<Requirement> | no | Other requirements to check consistency |
| threshold | Score | no | Minimum quality score (default: 0.85) |

### Outputs

| Name | Type | Description |
|------|------|-------------|
| refined_requirement | Requirement | Improved requirement |
| quality_score | Score | Final quality score |
| transformations | List<Transformation> | Changes applied |
| conflicts | List<Conflict> | Detected conflicts with related requirements |
| acceptance_criteria | List<Text> | Generated acceptance criteria |

### State

| Field | Type | Description |
|-------|------|-------------|
| iteration | Number | Refinement iteration |
| score_history | List<Score> | Score at each iteration |
| transformation_log | List<Transformation> | All transformations applied |

## OODA Phases

### OBSERVE

Assess requirement quality:

```
1. APPLY SMART criteria scoring:
   
   SPECIFIC (0-1):
     1.0: Precise values, no ambiguity
     0.7: Mostly precise, minor ambiguity
     0.4: General direction, significant ambiguity
     0.0: Completely vague
   
   MEASURABLE (0-1):
     1.0: Clear pass/fail criteria exist
     0.7: Criteria exist but need interpretation
     0.4: Partial criteria, some aspects unmeasurable
     0.0: No way to verify completion
   
   ACHIEVABLE (0-1):
     1.0: Clearly feasible with known techniques
     0.7: Feasible with some research/exploration
     0.4: Uncertain feasibility
     0.0: Appears impossible or contradictory
   
   RELEVANT (0-1):
     1.0: Directly serves spec objectives
     0.7: Indirectly serves objectives
     0.4: Tangentially related
     0.0: Unrelated to spec purpose
   
   TIME-BOUND (0-1):
     1.0: Clear phases/milestones
     0.7: Implicit timeline
     0.4: No timeline but not blocking
     0.0: Timeline needed but missing

2. DETECT anti-patterns:
   
   VAGUE:
     indicators = [
       "should handle ... appropriately",
       "should be user-friendly",
       "should be performant",
       "should be secure",
       "etc.", "and so on"
     ]
     detected = any(indicator in requirement.text)
   
   COMPOUND:
     indicators = [
       " and ",
       " also ",
       ", as well as",
       multiple_verbs > 1
     ]
     detected = contains_multiple_distinct_requirements
   
   ASSUMPTIVE:
     indicators = [
       references undefined terms,
       assumes prior implementation,
       implicit dependencies
     ]
     detected = has_unstated_dependencies
   
   UNTESTABLE:
     indicators = [
       no quantifiable criteria,
       subjective terms,
       no observable behavior
     ]
     detected = cannot_write_acceptance_test

3. CHECK consistency:
   
   For each related_requirement:
     → Do they contradict?
     → Do they overlap?
     → Do they have implicit dependencies?
   
   conflicts = detected contradictions/overlaps

OBSERVATION OUTPUTS:
  smart_scores = {S, M, A, R, T}
  composite_score = avg(smart_scores)
  anti_patterns = [detected patterns]
  conflicts = [detected conflicts]
```

### ORIENT

Identify improvement strategy:

```
1. CALCULATE priority areas:
   
   weak_dimensions = filter(smart_scores, score < 0.7)
   
   priority_order = [
     "SPECIFIC" if detected "VAGUE",
     "MEASURABLE" if detected "UNTESTABLE",
     dimensions in weak_dimensions by score ascending
   ]

2. SELECT transformation type:
   
   IF "VAGUE" in anti_patterns:
     transformation = "CLARIFY"
     strategy = add_specific_values_and_examples
   
   ELIF "COMPOUND" in anti_patterns:
     transformation = "SPLIT"
     strategy = decompose_into_atomic_requirements
   
   ELIF "UNTESTABLE" in anti_patterns:
     transformation = "REFRAME"
     strategy = convert_to_given_when_then
   
   ELIF "ASSUMPTIVE" in anti_patterns:
     transformation = "EXPLICIT"
     strategy = surface_hidden_dependencies
   
   ELIF conflicts.length > 0:
     transformation = "RECONCILE"
     strategy = resolve_conflicts
   
   ELIF composite_score < threshold:
     transformation = "STRENGTHEN"
     strategy = improve_weakest_dimension

3. ESTIMATE improvement potential:
   
   expected_improvement = estimate based on transformation type
   will_pass = (composite_score + expected_improvement) >= threshold
```

### DECIDE

Commit to transformation:

```
IF composite_score >= threshold:
  decision = "ACCEPT"
  rationale = "Requirement meets quality threshold"
  
ELIF iteration >= MAX_ITERATIONS:
  decision = "ACCEPT_WITH_CAVEATS"
  rationale = "Max iterations reached, best effort result"
  caveats = [weak_dimensions, remaining_anti_patterns]
  
ELIF transformation == "SPLIT" AND would_exceed_requirement_limit:
  decision = "FLAG_FOR_REVIEW"
  rationale = "Splitting would create too many requirements"
  
ELSE:
  decision = "TRANSFORM"
  rationale = f"Applying {transformation} to address {issues}"
```

### ACT

Apply the transformation:

```
IF decision == "ACCEPT":
  refined_requirement = requirement
  EMIT requirement_accepted

ELIF decision == "ACCEPT_WITH_CAVEATS":
  refined_requirement = requirement
  refined_requirement.caveats = caveats
  EMIT requirement_accepted_with_caveats

ELIF decision == "FLAG_FOR_REVIEW":
  refined_requirement = requirement
  refined_requirement.needs_review = True
  EMIT requirement_flagged

ELIF decision == "TRANSFORM":
  
  IF transformation == "CLARIFY":
    """
    BEFORE (vague):
      "The system should handle errors gracefully"
    
    AFTER (specific):
      "When API calls fail, the system shall:
       a) Log error with correlation ID to stderr
       b) Return HTTP 500 with JSON body: {error_code, message, correlation_id}
       c) Increment error_count metric with labels {endpoint, error_type}
       d) Trigger PagerDuty alert if error rate exceeds 1% over 5 minutes"
    """
    
    refined_text = add_specific_values(requirement.text)
    refined_text = add_examples(refined_text)
    refined_text = remove_vague_qualifiers(refined_text)
  
  ELIF transformation == "SPLIT":
    """
    BEFORE (compound):
      "Users can create, edit, and delete documents with version history"
    
    AFTER (atomic):
      FR-001: "Users can create new documents with title (required) and content (optional)"
      FR-002: "Users can edit the title and content of documents they own"
      FR-003: "Users can delete documents they own (soft delete, recoverable for 30 days)"
      FR-004: "The system maintains version history for all document changes"
      FR-005: "Users can view version history and restore previous versions"
    """
    
    atomic_requirements = decompose(requirement)
    refined_requirement = atomic_requirements  # Returns list
  
  ELIF transformation == "REFRAME":
    """
    BEFORE (untestable):
      "The UI should be responsive"
    
    AFTER (testable - Given/When/Then):
      "GIVEN a user on any viewport from 320px to 2560px width
       WHEN they interact with any UI element
       THEN the element shall respond within 100ms
       AND the layout shall not break or overflow"
    """
    
    refined_text = convert_to_given_when_then(requirement.text)
    acceptance_criteria = extract_test_cases(refined_text)
  
  ELIF transformation == "EXPLICIT":
    """
    BEFORE (assumptive):
      "Notifications should be sent when status changes"
    
    AFTER (explicit):
      "When document status changes from any state to 'published':
       - Dependency: Notification service must be available (see NFR-012)
       - Dependency: User has notification preferences set (see FR-023)
       The system shall:
       a) Queue notification within 1 second of status change
       b) Deliver via channels matching user preferences
       c) Include: document title, old status, new status, changed_by"
    """
    
    refined_text = surface_dependencies(requirement.text)
    refined_text = add_dependency_references(refined_text)
  
  ELIF transformation == "RECONCILE":
    """
    Resolve conflict between requirements
    """
    refined_text = merge_or_prioritize(requirement, conflicts)
    resolution_notes = document_resolution(conflicts)
  
  # Record transformation
  transformation_log.append({
    original: requirement.text,
    refined: refined_text,
    transformation: transformation,
    rationale: rationale
  })
  
  # Update requirement
  refined_requirement = Requirement(
    id: requirement.id,
    text: refined_text,
    priority: requirement.priority,
    acceptance_criteria: acceptance_criteria or generate_criteria(refined_text)
  )
  
  # Re-score
  new_score = assess_quality(refined_requirement)
  score_history.append(new_score)
  
  IF new_score >= threshold:
    EMIT requirement_refined {requirement_id, score_before, score_after, transformation}
  ELSE:
    iteration += 1
    RETURN to OBSERVE  # Continue refining
```

## Termination Conditions

- **Success**: `quality_score >= threshold`
- **Failure**: Transformation would violate constraints (too many requirements, etc.)
- **Timeout**: `iteration >= MAX_ITERATIONS` (default 3)

## Composition

### Can contain (nested loops)
- None (atomic loop)

### Can be contained by
- `authoring/spec-drafting` (inline refinement)
- `orchestration/queue-processor` (batch refinement)
- `verification/acceptance-gate` (pre-acceptance polish)

### Parallelizable
- Yes: Independent requirements can be refined in parallel
- Conditional: Requirements with potential conflicts should be sequential

## Signals Emitted

| Signal | When | Payload |
|--------|------|---------|
| `requirement_accepted` | Meets threshold | `{ id, score }` |
| `requirement_refined` | Successfully transformed | `{ id, score_before, score_after, transformation }` |
| `requirement_split` | Decomposed into multiple | `{ original_id, new_ids: List }` |
| `requirement_flagged` | Needs manual review | `{ id, reason, caveats }` |
| `conflict_detected` | Inconsistency found | `{ requirement_ids, conflict_type }` |

## Transformation Examples

### VAGUE → SPECIFIC

| Before | After |
|--------|-------|
| "fast response times" | "95th percentile response time ≤ 200ms" |
| "handle high load" | "sustain 10,000 concurrent connections" |
| "secure authentication" | "OAuth 2.0 with PKCE, tokens expire in 1 hour" |
| "user-friendly error messages" | "error messages include: error code, human-readable description, suggested action, support link" |

### COMPOUND → ATOMIC

| Before | After |
|--------|-------|
| "Users can search, filter, and sort results" | FR-1: "Users can search by keyword" <br> FR-2: "Users can filter by category, date, status" <br> FR-3: "Users can sort by relevance, date, title" |

### UNTESTABLE → TESTABLE

| Before | After |
|--------|-------|
| "The system should be reliable" | "GIVEN normal operation <br> WHEN the system runs for 24 hours <br> THEN uptime shall be ≥ 99.9% <br> AND no data loss shall occur" |

## Example Usage

```markdown
## Phase 3: Refinement

For each requirement in spec.requirements:
  
  Execute @loops/refinement/requirement-quality.md with:
    INPUT:
      requirement: requirement
      context: spec_context
      related_requirements: spec.requirements
      threshold: 0.85
    
    CONFIG:
      MAX_ITERATIONS: 3
    
    ON requirement_refined:
      UPDATE requirement in spec
    
    ON requirement_split:
      REPLACE requirement with new atomic requirements
      RE-INDEX requirement IDs
    
    ON requirement_flagged:
      ADD to manual_review_queue
    
    ON conflict_detected:
      ESCALATE to user for resolution
```

## Quality Checklist

Before accepting a requirement:

- [ ] No vague qualifiers remain (appropriately, properly, etc.)
- [ ] All values are specific and measurable
- [ ] Acceptance criteria are testable (can write automated test)
- [ ] Dependencies are explicit and referenced
- [ ] Scope is clear (what's NOT included)
- [ ] No conflicts with other requirements
