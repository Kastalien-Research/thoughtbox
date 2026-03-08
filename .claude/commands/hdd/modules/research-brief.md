---
name: hdd-research-brief
intent: Build ADR-relevant context and testable hypotheses
owner_subagent_type: explore
inputs_required: [task_goal, paths_to_inspect, acceptance_checks]
outputs_emitted: [status, summary, artifacts, open_risks]
state_reads: []
state_writes: []
max_iterations: 1
max_instructions: 25
---
# HDD Research Module

## Inputs

- `task_goal`
- `paths_to_inspect`
- `acceptance_checks`

## Steps

1. Inspect accepted ADRs, rejected ADRs, and active staging ADRs in scoped paths.
2. Identify existing patterns and prior failure modes relevant to the task.
3. Extract explicit constraints from specs or ADR references.
4. Produce SOFT hypotheses (specific, observable, falsifiable, testable).
5. Flag unknowns that block staging.

## Outputs

- `status`
- `summary`
- `artifacts`
- `open_risks`
- `hypotheses`
- `unknowns`

## Stop Conditions

- Success: at least one SOFT hypothesis with evidence-backed context.
- Failure: missing critical context or unresolved blocking unknowns.
- Escalation: conflicting ADR constraints with no safe resolution.
