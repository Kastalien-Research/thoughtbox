<!--
AUTO-GENERATED — DO NOT EDIT MANUALLY.
Source: automation-self-improvement/control-plane/manifest.yaml
-->
# Unified Autonomy Control Plane

**Version:** 1.0.0
**Repo:** thoughtbox
**Branch:** main
**Planes:** decision / execution / learning

## Scope

ADR-017 establishes a declarative source of truth for unified autonomy, architecture, and test coverage truth.

## Canonical Surfaces

- [System map](./01-systems.md)
- [Workflows and states](./02-workflows-and-state.md)
- [Generation and drift gates](./03-generation-and-drift.md)
- [Test truth](./04-test-truth.md)

## Plane assignment

| Plane | Primary system |
| --- | --- |
| decision | Decision Plane |
| execution | Execution Plane |
| learning | Learning and Refinement Plane |
| governance | Governance and Drift Plane |

## Workflow Inventory

| Workflow ID | Plane | Trigger | States |
| --- | --- | --- | --- |
| daily_dev_brief | decision | scheduler/manual | discover, draft, validated, published |
| improvement_loop | execution | approved proposal | composing, implementing, evaluating, integrating |
| prompt_refinement_batch | learning | weekly cadence or explicit request | collect, analyze, propose, defer_or_apply |
| proposal_approval | decision | explicit proposal review plus human approval | queued, pre-validating, approved, rejected |
| tool_pedagogy_batch | learning | weekly cadence or explicit request | collect, analyze, propose, defer_or_apply |

