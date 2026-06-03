---
name: hdd-decide-brief
intent: Finalize accept/reject outcome and migrate ADR accordingly
owner_subagent_type: generalPurpose
inputs_required: [task_goal, paths_to_inspect, acceptance_checks]
outputs_emitted: [status, summary, artifacts, open_risks]
state_reads: []
state_writes: []
max_iterations: 1
max_instructions: 25
---
# HDD Decide Module

## Inputs

- `task_goal`
- `paths_to_inspect`
- `acceptance_checks`
- `staging_adr_path`
- `hypothesis_results`

## Steps

1. Evaluate validation outcomes against acceptance criteria.
2. Determine decision: accept or reject.
3. If accept, migrate ADR to accepted path and summarize impact.
4. If reject, migrate ADR to rejected path with failure learnings.
5. Emit final workflow decision record.

## Outputs

- `status`
- `summary`
- `artifacts`
- `open_risks`
- `decision`

## Stop Conditions

- Success: ADR migrated to accepted or rejected with rationale.
- Failure: decision cannot be made due to incomplete validation.
- Escalation: user checkpoint required but unavailable.
