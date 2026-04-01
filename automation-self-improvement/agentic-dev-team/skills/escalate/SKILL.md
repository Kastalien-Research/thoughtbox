---
name: escalate
description: Format a structured escalation to the human decision-maker (Chief Agentic). Use when hitting an escalation threshold.
argument-hint: [situation summary]
user-invocable: true
---

Format an escalation for the following situation: $ARGUMENTS

Use this structure (based on the EscalationToChiefAgentic schema):

**Escalation Type**: [prioritization_decision | scope_change | external_dependency_failure | timeline_impact | irreversible_action_approval | budget_exceeded | repeated_failure | shippability_assessment]

**Situation**
- Summary: [What happened, 1-2 sentences]
- Impact: [What this means for the current plan]
- Root cause: [Why this happened, if known]
- What has been tried: [What the system already attempted]

**Options** (minimum 2):

| Option | Description | Tradeoff | Time | Risk |
|--------|-------------|----------|------|------|
| A: [label] | [what it entails] | [gain vs. lose] | [estimate] | low/medium/high |
| B: [label] | [what it entails] | [gain vs. lose] | [estimate] | low/medium/high |

**Recommendation**: [Which option and why, if applicable]

**Decision deadline**: [How long before this blocks progress]
