---
name: hdd-implement-brief
intent: Implement only what is needed to test hypotheses
owner_subagent_type: generalPurpose
inputs_required: [task_goal, paths_to_inspect, acceptance_checks]
outputs_emitted: [status, summary, artifacts, open_risks]
state_reads: []
state_writes: []
max_iterations: 1
max_instructions: 30
---
# HDD Implement Module

## Inputs

- `task_goal`
- `paths_to_inspect`
- `acceptance_checks`
- `staging_adr_path`

## Steps

1. Extract implementation scope from ADR decision and validation plan.
2. Implement minimal changes required to exercise hypotheses.
3. Add or update tests tied to each hypothesis.
4. Track deviations from ADR scope and justify each deviation.
5. Prepare implementation artifact list for validation.

## Outputs

- `status`
- `summary`
- `artifacts`
- `open_risks`
- `test_targets`

## Stop Conditions

- Success: implementation and hypothesis-linked tests are ready.
- Failure: implementation diverges from ADR with no valid rationale.
- Escalation: blocked by external dependency or contradictory requirement.
