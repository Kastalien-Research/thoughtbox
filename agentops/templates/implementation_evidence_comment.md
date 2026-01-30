Use this as:
- a comment on the daily issue after implementation/eval, and/or
- the PR body if you open a PR automatically.

<!--
TEMPLATE: Implementation Evidence Comment
Rendered by automation and posted as a GitHub comment or PR body.

REQUIRED PLACEHOLDERS TO REPLACE:
  - {{RUN_ID}} / {{UPSTREAM_RUN_ID}}
  - {{PROPOSAL_ID}} / {{PROPOSAL_TITLE}}
  - {{BRANCH_NAME}}
  - {{BASE_REF}} / {{BASE_SHA}}
  - {{TRACE_URL}}
  - {{ARTIFACT_INDEX_URL}}
  - {{DIFFSTAT}}
  - {{FILES_CHANGED_LIST}}
  - {{COMMANDS_EXECUTED}}
  - {{TEST_RESULTS_SUMMARY}}
  - {{EVAL_RESULTS_SUMMARY}}
  - {{RISKS_AND_LIMITATIONS}}
  - {{ROLLBACK_PLAN}}
  - {{RECOMMENDATION}} (MERGE / DO NOT MERGE / NEEDS HUMAN DECISION)
OPTIONAL:
  - {{PR_URL}}
-->

# ✅ Implementation Evidence — {{PROPOSAL_ID}}: {{PROPOSAL_TITLE}}

**Implementation run:** `{{RUN_ID}}`  
**Upstream daily run:** `{{UPSTREAM_RUN_ID}}`  
**Branch:** `{{BRANCH_NAME}}` → base `{{BASE_REF}}` @ `{{BASE_SHA}}`  
**Trace:** {{TRACE_URL}}  
**Artifacts:** {{ARTIFACT_INDEX_URL}}  
**PR (if opened):** {{PR_URL}}

---

## 1) Summary of changes

- **What changed:** {{CHANGE_SUMMARY}}
- **Why:** {{CHANGE_RATIONALE}}
- **Scope control:** {{SCOPE_NOTES}} (e.g., behind flag, no API changes)

---

## 2) Diff overview

**Diffstat:** {{DIFFSTAT}}

**Files changed**  
{{FILES_CHANGED_LIST}}

---

## 3) Commands executed (reproducibility)

```bash
{{COMMANDS_EXECUTED}}
```

**Test summary:** {{TEST_RESULTS_SUMMARY}}  
**Eval summary:** {{EVAL_RESULTS_SUMMARY}}

---

## 4) Risks and limitations

{{RISKS_AND_LIMITATIONS}}

---

## 5) Rollback plan

{{ROLLBACK_PLAN}}

**Recommendation:** {{RECOMMENDATION}}

- If MERGE: proceed with PR review checklist.  
- If DO NOT MERGE: close with reason + optionally open a follow-up issue.  
- If NEEDS HUMAN DECISION: list the specific decision(s) required.

<!-- AGENTOPS_IMPL_META_BEGIN
{
  "run_id": "{{RUN_ID}}",
  "upstream_run_id": "{{UPSTREAM_RUN_ID}}",
  "proposal_id": "{{PROPOSAL_ID}}",
  "branch": "{{BRANCH_NAME}}",
  "base_sha": "{{BASE_SHA}}",
  "status": "{{STATUS}}",
  "recommendation": "{{RECOMMENDATION}}"
}
AGENTOPS_IMPL_META_END -->

---

# Canonical JSON Fixtures

These are meant to be committed as canonical examples and used in tests.

## `agentops/fixtures/run_summary.example.json`

```json
{
  "run_id": "run_2026-01-28T12-00-00Z_abcd1234",
  "job_name": "thoughtbox_daily_proposals",
  "job_version": "0.1.0",
  "status": "SUCCEEDED",
  "trigger": {
    "type": "schedule",
    "source": "github_actions",
    "event": "cron"
  },
  "repo": {
    "url": "https://github.com/{org}/thoughtbox",
    "ref": "main",
    "git_sha": "9f3a0f4d0a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"
  },
  "started_at": "2026-01-28T12:00:02Z",
  "ended_at": "2026-01-28T12:07:31Z",
  "budgets": {
    "max_llm_cost_usd": 10.0,
    "max_wall_clock_minutes": 30,
    "max_tool_calls": 200
  },
  "metrics": {
    "llm_cost_usd": 2.41,
    "wall_clock_seconds": 449,
    "sources_scanned": 37,
    "items_shortlisted": 11,
    "proposals_emitted": 3
  },
  "artifact_index": [
    {
      "name": "digest_md",
      "path": "artifacts/digest.md",
      "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    },
    {
      "name": "proposals_json",
      "path": "artifacts/proposals.json",
      "sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    },
    {
      "name": "issue_body_md",
      "path": "artifacts/issue_body.md",
      "sha256": "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
    }
  ],
  "links": {
    "trace": "https://smith.langchain.com/o/{org}/projects/p/agentops-thoughtbox-dev/r/{run_id}",
    "issue": "https://github.com/{org}/thoughtbox/issues/123",
    "workflow_run": "https://github.com/{org}/thoughtbox/actions/runs/9999999999"
  },
  "errors": []
}
```
