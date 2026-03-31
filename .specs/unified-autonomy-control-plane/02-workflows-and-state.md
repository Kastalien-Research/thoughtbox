<!--
AUTO-GENERATED — DO NOT EDIT MANUALLY.
Source: automation-self-improvement/control-plane/manifest.yaml
-->
# 02-workflows-and-state

| Workflow ID | Plane | Maturity | Trigger | Steps | States | Inputs | Outputs | Gates |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| daily_dev_brief | decision | partial | scheduler/manual | discover pending issues, signals, and coverage debt; prepare decision candidate record; update control-plane test-truth surfaces; publish draft package for review | discover; draft; published; validated | decision candidates; test coverage gaps | control-plane trace package; decision candidate bundle | data integrity; schema conformance |
| improvement_loop | execution | research-only | approved proposal | compose code changes from accepted proposal; execute declared local integrations; collect evidence in generated truth artifacts; gate integration readiness | composing; evaluating; implementing; integrating | approved proposal; execution constraints | evaluation summary; implementation evidence | check-control-plane pass; implementation complete |
| prompt_refinement_batch | learning | research-only | weekly cadence or explicit request | review session-level drift signals; draft prompt/rule adjustments; queue review packet; mark acceptance status | analyze; collect; defer_or_apply; propose | session summaries; test-truth coverage gaps | prompt refinement packet | policy alignment; quality bar |
| proposal_approval | decision | partial | explicit proposal review plus human approval | load proposal and linked evidence; run validation check on manifest links; apply approval record; hand off to execution backlog | approved; pre-validating; queued; rejected | decision candidate bundle; proposal payload | approved change request; rejection rationale | checklist complete; control-plane check |
| tool_pedagogy_batch | learning | research-only | weekly cadence or explicit request | analyze traces and friction; derive pedagogy improvements; write queue packet for decision plane; mark scope and confidence | analyze; collect; defer_or_apply; propose | agent telemetry; trace summaries | learning backlog update; tool-pedagogy proposal packet | evidence quality; reviewer signoff |

