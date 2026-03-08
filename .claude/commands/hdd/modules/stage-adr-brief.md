---
name: hdd-stage-adr-brief
intent: Create a concise staging ADR from validated research
owner_subagent_type: generalPurpose
inputs_required: [task_goal, paths_to_inspect, acceptance_checks]
outputs_emitted: [status, summary, artifacts, open_risks]
state_reads: []
state_writes: []
max_iterations: 1
max_instructions: 30
---
# HDD Stage ADR Module

## Inputs

- `task_goal`
- `paths_to_inspect`
- `acceptance_checks`
- `hypotheses`

## Steps

1. Select next ADR number and staging filename.
2. Draft ADR sections: context, decision, hypotheses, validation plan.
3. Ensure each hypothesis is SOFT and directly testable.
4. Record dependency and conflict notes.
5. Validate ADR completeness against acceptance checks.

## Outputs

- `status`
- `summary`
- `artifacts`
- `open_risks`
- `staging_adr_path`

## Stop Conditions

- Success: staging ADR exists and passes completeness checks.
- Failure: ADR missing testability or essential constraints.
- Escalation: numbering collision or unresolved dependency conflict.
