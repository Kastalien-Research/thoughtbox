---
type: verification
speed: medium
scope: document
interface_version: loop-interface@1.0
description: Validate work against acceptance criteria before proceeding.
---
# Acceptance Gate Loop

Validate work against acceptance criteria before proceeding.

**Version**: 1.0.0
**Interface**: loop-interface@1.0

## Classification

- **Type**: verification
- **Speed**: medium (~30s-2min per gate)
- **Scope**: document or milestone

## Interface

### Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| artifact | Artifact | yes | The artifact to validate (spec, code, etc.) |
| acceptance_criteria | List<Criterion> | yes | Criteria that must pass |
| validation_type | ValidationType | no | How to validate (default: "automated") |
| threshold | Score | no | Minimum pass score (default: 1.0 for all must pass) |

### Outputs

| Name | Type | Description |
|------|------|-------------|
| passed | Boolean | Whether gate passed |
| results | List<CriterionResult> | Result for each criterion |
| score | Score | Overall pass percentage |
| blockers | List<Criterion> | Failed criteria blocking progress |
| warnings | List<Criterion> | Failed non-blocking criteria |
| remediation | List<Action> | Suggested fixes for failures |

## OODA Phases

### OBSERVE

Gather validation evidence for each criterion:

```
FOR each criterion in acceptance_criteria:
  
  IF criterion.validation.type == "automated":
    # Run automated validation (tests, lint, type check)
    result = run_validation(artifact, criterion.test_spec)
    evidence = { type: "automated", output, exit_code, duration }
  
  ELIF criterion.validation.type == "manual":
    # Agent evaluates checklist items
    FOR each item in criterion.checklist:
      item_result = evaluate_checklist_item(artifact, item)
    evidence = { type: "manual", checklist_results }
  
  observations.append({ criterion, evidence })
```

### ORIENT

Assess validation results:

```
results = []
blockers = []
warnings = []

FOR each observation:
  # Determine pass/fail
  passed = evaluate_evidence(observation.evidence)
  confidence = calculate_confidence(observation.evidence)
  
  result = CriterionResult(criterion_id, passed, evidence, confidence)
  results.append(result)
  
  # Categorize failures
  IF NOT passed:
    IF criterion.priority == "must":
      blockers.append(criterion)
    ELSE:
      warnings.append(criterion)

# Calculate overall score
score = passed_count / total_count

# Determine if gate passes
all_musts_passed = all must-priority criteria passed
gate_passed = all_musts_passed AND score >= threshold
```

### DECIDE

Determine gate outcome:

```
IF gate_passed:
  decision = "PASS"
  
ELIF attempt >= MAX_ATTEMPTS:
  decision = "FAIL_FINAL"
  
ELIF can_auto_remediate(blockers):
  decision = "REMEDIATE"
  remediation = generate_remediation_actions(blockers)
  
ELIF len(blockers) > 0:
  decision = "FAIL_BLOCKING"
  remediation = generate_remediation_suggestions(blockers)
  
ELSE:  # Only warnings
  decision = "PASS_WITH_WARNINGS"
```

### ACT

Execute decision:

```
IF decision == "PASS":
  EMIT gate_passed { artifact, score, results }
  RETURN { passed: True, ... }

ELIF decision == "PASS_WITH_WARNINGS":
  EMIT gate_passed_with_warnings { artifact, score, warnings }
  RETURN { passed: True, warnings, ... }

ELIF decision == "REMEDIATE":
  FOR each action in remediation:
    execute_remediation(action)
  attempt += 1
  RETURN to OBSERVE

ELIF decision == "FAIL_BLOCKING":
  EMIT gate_failed { artifact, blockers, remediation }
  RETURN { passed: False, blockers, ... }

ELIF decision == "FAIL_FINAL":
  EMIT gate_failed_final { artifact, attempts, blockers }
  RETURN { passed: False, blockers, remediation: [] }
```

## Termination Conditions

- **Success**: `decision == "PASS"` or `decision == "PASS_WITH_WARNINGS"`
- **Failure**: `decision == "FAIL_BLOCKING"` or `decision == "FAIL_FINAL"`
- **Timeout**: `attempt >= MAX_ATTEMPTS` (default 3)

## Composition

### Can contain (nested loops)
- `refinement/requirement-quality` (inline fixes)
- `refinement/code-quality` (inline fixes)

### Can be contained by
- `orchestration/queue-processor` (milestone gates)
- `authoring/spec-drafting` (post-draft validation)
- `authoring/code-generation` (post-implementation validation)

### Parallelizable
- Conditional: Independent criteria can validate in parallel

## Signals Emitted

| Signal | When | Payload |
|--------|------|---------|
| `gate_passed` | All must criteria pass | `{ artifact, score, results }` |
| `gate_passed_with_warnings` | Musts pass, shoulds fail | `{ artifact, score, warnings }` |
| `gate_failed` | Must criteria failed | `{ artifact, blockers, remediation }` |
| `gate_failed_final` | Max attempts exhausted | `{ artifact, attempts, blockers }` |

## Validation Patterns

### Spec Validation Criteria

```yaml
acceptance_criteria:
  - id: SPEC-001
    description: "All required sections present"
    priority: must
    validation:
      type: automated
      test: { check: sections_present, required: [Summary, Requirements] }
  
  - id: SPEC-002
    description: "All requirements have acceptance criteria"
    priority: must
    validation:
      type: automated
      test: { check: requirements_have_criteria }
  
  - id: SPEC-003
    description: "No TBD markers in must-have sections"
    priority: must
    validation:
      type: automated
      test: { check: no_tbd_in_sections, sections: [Requirements, Design] }
```

### Code Validation Criteria

```yaml
acceptance_criteria:
  - id: CODE-001
    description: "All tests pass"
    priority: must
    validation:
      type: automated
      test: { command: "npm test", expect_exit: 0 }
  
  - id: CODE-002
    description: "Type check passes"
    priority: must
    validation:
      type: automated
      test: { command: "npm run typecheck", expect_exit: 0 }
```

## Example Usage

```markdown
Execute @loops/verification/acceptance-gate.md with:
  INPUT:
    artifact: { type: "spec", document: drafted_spec }
    acceptance_criteria: spec_validation_criteria
    threshold: 1.0
  
  ON gate_passed:
    PROCEED to next phase
  
  ON gate_failed:
    IF has remediation:
      EXECUTE remediation
      RE-RUN gate
    ELSE:
      ESCALATE to user
```
