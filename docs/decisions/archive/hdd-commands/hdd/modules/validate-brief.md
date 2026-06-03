---
name: hdd-validate-brief
intent: Validate or falsify hypotheses with automated and manual checks
owner_subagent_type: verification-judge
inputs_required: [task_goal, paths_to_inspect, acceptance_checks]
outputs_emitted: [status, summary, artifacts, open_risks]
state_reads: []
state_writes: []
max_iterations: 1
max_instructions: 28
---
# HDD Validate Module

## Inputs

- `task_goal`
- `paths_to_inspect`
- `acceptance_checks`
- `test_targets`
- `staging_adr_path`

## Steps

1. Run automated checks relevant to hypothesis outcomes.
2. Capture pass/fail evidence per hypothesis.
3. Request manual verification checkpoints when required.
4. Classify each hypothesis: validated, falsified, or inconclusive.
5. Produce a validation report with evidence references.

## Outputs

- `status`
- `summary`
- `artifacts`
- `open_risks`
- `hypothesis_results`

## Stop Conditions

- Success: every hypothesis has an explicit outcome.
- Failure: insufficient evidence to classify outcomes.
- Escalation: manual test requirement cannot be completed.
