<!--
TEMPLATE: Daily Company Ops Brief Issue
Posted by automation as a GitHub Issue body.

REQUIRED PLACEHOLDERS:
- {{DATE_LOCAL}}            e.g. 2026-01-28 (America/Chicago)
- {{RUN_ID}}
- {{JOB_NAME}}              e.g. company_ops_daily_brief
- {{JOB_VERSION}}           e.g. 0.1.0
- {{TRACE_URL}}
- {{ARTIFACT_INDEX_URL}}
- {{BUDGET_SUMMARY}}

- {{STATE_SUMMARY}}         short human-readable snapshot
- {{METRICS_TABLE}}         markdown table (optional)
- {{CHANGES_SINCE_YESTERDAY}} bullets (optional)
- {{ACTIONS_SUMMARY}}       3–5 actions, each has an approval label
- {{HUMAN_QUESTIONS_OR_NONE}}

- {{OPS_ACTIONS_JSON}}      valid JSON payload
- {{COMPANY_STATE_JSON}}    valid JSON payload (may be small; if large, store as artifact and include link)
-->

# 🧭 Company Ops Brief — {{DATE_LOCAL}}

**Run:** `{{RUN_ID}}`  
**Job:** `{{JOB_NAME}}@{{JOB_VERSION}}`  
**Budgets:** {{BUDGET_SUMMARY}}  
**Trace:** {{TRACE_URL}}  
**Artifacts:** {{ARTIFACT_INDEX_URL}}

---

## 1) Current snapshot

{{STATE_SUMMARY}}

{{METRICS_TABLE}}

---

## 2) Changes since yesterday

{{CHANGES_SINCE_YESTERDAY}}

---

## 3) Recommended actions (choose 0–5)

> Approval mechanism: apply label(s)
> - `approved:ops-1`
> - `approved:ops-2`
> - `approved:ops-3`
> - `approved:ops-4`
> - `approved:ops-5`
>
> Optional smoke-test labels (no external actions, no production changes):
> - `smoke:ops-1` … `smoke:ops-5`
>
> To stop: apply `hold` or `rejected`.

{{ACTIONS_SUMMARY}}

---

## 4) Notes / Questions for Human (only if needed)

- {{HUMAN_QUESTIONS_OR_NONE}}

---

## 5) Machine-readable payload (do not edit manually)

<!-- AGENTOPS_META_BEGIN
{
  "run_id": "{{RUN_ID}}",
  "job_name": "{{JOB_NAME}}",
  "job_version": "{{JOB_VERSION}}",
  "date_local": "{{DATE_LOCAL}}"
}
AGENTOPS_META_END -->

<details>
  <summary><strong>ops_actions.json</strong> (for automation)</summary>

```json
{{OPS_ACTIONS_JSON}}
```
</details>

<details>
  <summary><strong>company_state_snapshot.json</strong> (for automation)</summary>

```json
{{COMPANY_STATE_JSON}}
```
</details>

Your future ops runner can standardize on something like:

```json
{
  "run_id": "...",
  "generated_at": "...",
  "actions": [
    {
      "action_id": "ops-1",
      "title": "Tighten onboarding: add 'Quickstart: 5-minute success path'",
      "category": "activation|docs|growth|product|ops",
      "risk": "low|medium|high",
      "effort_estimate": "S|M|L",
      "expected_impact": "…",
      "success_criteria": ["…", "…"],
      "execution_policy": "draft_only|safe_auto|human_required",
      "evidence": ["link-to-artifact-or-metric", "link-to-user-feedback"]
    }
  ]
}
```