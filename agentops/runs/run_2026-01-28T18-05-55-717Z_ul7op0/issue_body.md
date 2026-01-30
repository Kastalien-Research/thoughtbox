<!--
    TEMPLATE: Daily Thoughtbox Dev Brief Issue
    This file is meant to be rendered by an automation job and posted as a GitHub Issue body.
    
    REQUIRED PLACEHOLDERS TO REPLACE:
    - 01/28/2026            e.g. 2026-01-28 (America/Chicago)
    - run_2026-01-28T18-05-55-717Z_ul7op0                unique id
    - thoughtbox_daily_proposals              e.g. thoughtbox_daily_proposals
    - 0.1.0           e.g. 0.1.0
    - dry-run-sha               repo SHA scanned
    - main              e.g. main
    - https://smith.langchain.com (tracing disabled)             LangSmith trace/experiment link (optional but recommended)
    - (dry run - no artifacts)    link to artifact listing (or “see workflow artifacts”)
    - max_cost=$10, max_minutes=30        “max_cost=$10, max_minutes=30”
    - Git log (last 7 days), open issues, open PRs, test failures, performance metrics       brief list of sources scanned
    - - RLM sampling implementation in progress (feature/rlm-sampling)
- Benchmarking context documents added for evaluation framework
- Harness implementation status tracking in dgm-specs/
- AgentOps specs and templates ready for Day-0 bootstrap
- Docker compose and CI workflow configurations updated
- Storage and persistence layer enhancements for loops
- Gateway and thought handler improvements ongoing
- Observatory integration with Prometheus metrics active        bullet list (8–12)
    - ### Proposal 1 — Add deterministic MCP client-simulation harness

**Category:** compatibility
**Effort:** M
**Risk:** low
**Approval label:** `approved:proposal-1`

**Why now**
- Improves confidence for unattended agent-driven PRs
- Catches regressions in stage/tool-list behaviors across clients

**Expected impact**
- **Users:** Claude Code, Cursor MCP clients, other MCP clients
- **Outcome:** Higher compatibility; fewer client-specific breakages; faster regressions detection

**Design sketch**
Add eval runner that replays scripted scenarios against server, capturing invariants + latency; store reports as artifacts.

**Touch points**
- `agentops/evals/*`
- `src/server/* (if needed for test hooks)`
- `docs/compatibility.md (optional)`

**Test plan**
- [ ] unit: scenario parser validates schema
- [ ] integration: run 10 scenario scripts against local server
- [ ] CI: ensure harness runs under GitHub Actions

**Rollback**
Delete harness folder and CI step; no runtime changes.

---

### Proposal 2 — Improve gateway stage error messages + add structured error codes

**Category:** reliability
**Effort:** S
**Risk:** medium
**Approval label:** `approved:proposal-2`

**Why now**
- Agent workflows benefit from machine-readable errors
- Reduces time-to-debug when clients call tools out-of-stage

**Expected impact**
- **Users:** Any MCP client, Your own orchestrators
- **Outcome:** More deterministic retries; clearer user guidance

**Design sketch**
Return {error_code, stage_required, stage_current} in errors; keep human-readable message.

**Touch points**
- `src/gateway/*`
- `src/stages/*`
- `docs/api-errors.md`

**Test plan**
- [ ] unit: error object schema
- [ ] integration: scenario scripts expecting error codes

**Rollback**
Remove extra fields if clients break.

---

### Proposal 3 — Observatory: add 'copy run bundle' export for debugging

**Category:** UX
**Effort:** M
**Risk:** low
**Approval label:** `approved:proposal-3`

**Why now**
- Shortens debugging cycles
- Provides portable evidence for agent-run changes

**Expected impact**
- **Users:** You, debuggers, future collaborators
- **Outcome:** Faster reproduction of bugs and regressions

**Design sketch**
Export a zip-like bundle (or directory) containing session JSON, recent logs, and scenario replay script.

**Touch points**
- `src/observatory/*`
- `src/storage/*`
- `docs/observatory.md`

**Test plan**
- [ ] unit: export includes required files
- [ ] integration: export then replay against server

**Rollback**
Remove export endpoint/UI control.

---
     human-readable proposal sections (2–3)
    - {
  "run_id": "run_2026-01-28T12-00-00Z_abcd1234",
  "repo_ref": "main",
  "git_sha": "9f3a0f4d0a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
  "generated_at": "2026-01-28T12:06:40Z",
  "proposals": [
    {
      "proposal_id": "proposal-1",
      "title": "Add deterministic MCP client-simulation harness",
      "category": "compatibility",
      "effort_estimate": "M",
      "risk": "low",
      "why_now": [
        "Improves confidence for unattended agent-driven PRs",
        "Catches regressions in stage/tool-list behaviors across clients"
      ],
      "expected_impact": {
        "users": [
          "Claude Code",
          "Cursor MCP clients",
          "other MCP clients"
        ],
        "outcome": "Higher compatibility; fewer client-specific breakages; faster regressions detection"
      },
      "design_sketch": "Add eval runner that replays scripted scenarios against server, capturing invariants + latency; store reports as artifacts.",
      "touch_points": [
        "agentops/evals/*",
        "src/server/* (if needed for test hooks)",
        "docs/compatibility.md (optional)"
      ],
      "test_plan": [
        "unit: scenario parser validates schema",
        "integration: run 10 scenario scripts against local server",
        "CI: ensure harness runs under GitHub Actions"
      ],
      "rollout": "Ship harness without changing runtime behavior; no prod impact.",
      "rollback": "Delete harness folder and CI step; no runtime changes.",
      "acceptance": [
        ">= 10 scenarios passing on baseline",
        "Harness produces eval_report.md with baseline vs candidate comparison"
      ]
    },
    {
      "proposal_id": "proposal-2",
      "title": "Improve gateway stage error messages + add structured error codes",
      "category": "reliability",
      "effort_estimate": "S",
      "risk": "medium",
      "why_now": [
        "Agent workflows benefit from machine-readable errors",
        "Reduces time-to-debug when clients call tools out-of-stage"
      ],
      "expected_impact": {
        "users": [
          "Any MCP client",
          "Your own orchestrators"
        ],
        "outcome": "More deterministic retries; clearer user guidance"
      },
      "design_sketch": "Return {error_code, stage_required, stage_current} in errors; keep human-readable message.",
      "touch_points": [
        "src/gateway/*",
        "src/stages/*",
        "docs/api-errors.md"
      ],
      "test_plan": [
        "unit: error object schema",
        "integration: scenario scripts expecting error codes"
      ],
      "rollout": "Backward-compatible: keep existing message string; add fields.",
      "rollback": "Remove extra fields if clients break.",
      "acceptance": [
        "Existing tests remain passing",
        "New tests validate error_code presence in out-of-stage calls"
      ]
    },
    {
      "proposal_id": "proposal-3",
      "title": "Observatory: add 'copy run bundle' export for debugging",
      "category": "UX",
      "effort_estimate": "M",
      "risk": "low",
      "why_now": [
        "Shortens debugging cycles",
        "Provides portable evidence for agent-run changes"
      ],
      "expected_impact": {
        "users": [
          "You",
          "debuggers",
          "future collaborators"
        ],
        "outcome": "Faster reproduction of bugs and regressions"
      },
      "design_sketch": "Export a zip-like bundle (or directory) containing session JSON, recent logs, and scenario replay script.",
      "touch_points": [
        "src/observatory/*",
        "src/storage/*",
        "docs/observatory.md"
      ],
      "test_plan": [
        "unit: export includes required files",
        "integration: export then replay against server"
      ],
      "rollout": "Feature flag if needed; dev-only initially.",
      "rollback": "Remove export endpoint/UI control.",
      "acceptance": [
        "Bundle contains session JSON + last N events + metadata",
        "Replay script runs and reproduces session invariants"
      ]
    }
  ]
}        machine-readable JSON payload (must be valid JSON)
    -->
    
    # 🧠 Thoughtbox Dev Brief — 01/28/2026
    
    **Run:** `run_2026-01-28T18-05-55-717Z_ul7op0`  
    **Job:** `thoughtbox_daily_proposals@0.1.0`  
    **Repo ref:** `main` @ `dry-run-sha`  
    **Budgets:** max_cost=$10, max_minutes=30  
    **Trace:** https://smith.langchain.com (tracing disabled)  
    **Artifacts:** (dry run - no artifacts)
    
    ---
    
    ## 1) Digest (ecosystem + signals)
    
    **Sources scanned (summary):**
    Git log (last 7 days), open issues, open PRs, test failures, performance metrics
    
    **Key items:**
    - RLM sampling implementation in progress (feature/rlm-sampling)
- Benchmarking context documents added for evaluation framework
- Harness implementation status tracking in dgm-specs/
- AgentOps specs and templates ready for Day-0 bootstrap
- Docker compose and CI workflow configurations updated
- Storage and persistence layer enhancements for loops
- Gateway and thought handler improvements ongoing
- Observatory integration with Prometheus metrics active
    
    ---
    
    ## 2) Proposals (choose 0–3)
    
    > Approval mechanism: apply label(s)  
    > - `approved:proposal-1`  
    > - `approved:proposal-2`  
    > - `approved:proposal-3`  
    >
    > To stop the pipeline: apply `hold` or `rejected`.
    
    ### Proposal 1 — Add deterministic MCP client-simulation harness

**Category:** compatibility
**Effort:** M
**Risk:** low
**Approval label:** `approved:proposal-1`

**Why now**
- Improves confidence for unattended agent-driven PRs
- Catches regressions in stage/tool-list behaviors across clients

**Expected impact**
- **Users:** Claude Code, Cursor MCP clients, other MCP clients
- **Outcome:** Higher compatibility; fewer client-specific breakages; faster regressions detection

**Design sketch**
Add eval runner that replays scripted scenarios against server, capturing invariants + latency; store reports as artifacts.

**Touch points**
- `agentops/evals/*`
- `src/server/* (if needed for test hooks)`
- `docs/compatibility.md (optional)`

**Test plan**
- [ ] unit: scenario parser validates schema
- [ ] integration: run 10 scenario scripts against local server
- [ ] CI: ensure harness runs under GitHub Actions

**Rollback**
Delete harness folder and CI step; no runtime changes.

---

### Proposal 2 — Improve gateway stage error messages + add structured error codes

**Category:** reliability
**Effort:** S
**Risk:** medium
**Approval label:** `approved:proposal-2`

**Why now**
- Agent workflows benefit from machine-readable errors
- Reduces time-to-debug when clients call tools out-of-stage

**Expected impact**
- **Users:** Any MCP client, Your own orchestrators
- **Outcome:** More deterministic retries; clearer user guidance

**Design sketch**
Return {error_code, stage_required, stage_current} in errors; keep human-readable message.

**Touch points**
- `src/gateway/*`
- `src/stages/*`
- `docs/api-errors.md`

**Test plan**
- [ ] unit: error object schema
- [ ] integration: scenario scripts expecting error codes

**Rollback**
Remove extra fields if clients break.

---

### Proposal 3 — Observatory: add 'copy run bundle' export for debugging

**Category:** UX
**Effort:** M
**Risk:** low
**Approval label:** `approved:proposal-3`

**Why now**
- Shortens debugging cycles
- Provides portable evidence for agent-run changes

**Expected impact**
- **Users:** You, debuggers, future collaborators
- **Outcome:** Faster reproduction of bugs and regressions

**Design sketch**
Export a zip-like bundle (or directory) containing session JSON, recent logs, and scenario replay script.

**Touch points**
- `src/observatory/*`
- `src/storage/*`
- `docs/observatory.md`

**Test plan**
- [ ] unit: export includes required files
- [ ] integration: export then replay against server

**Rollback**
Remove export endpoint/UI control.

---

    
    ---
    
    ## 3) Notes / Questions for Human (only if needed)
    
    - _If none, write “None.”_
    - None
    
    ---
    
    ## 4) Machine-readable payload (do not edit manually)
    
    This section is used by the label-trigger workflow to locate proposal specs deterministically.
    
    <!-- AGENTOPS_META_BEGIN
    {
      "run_id": "run_2026-01-28T18-05-55-717Z_ul7op0",
      "job_name": "thoughtbox_daily_proposals",
      "job_version": "0.1.0",
      "repo_ref": "main",
      "git_sha": "dry-run-sha",
      "date_local": "01/28/2026"
    }
    AGENTOPS_META_END -->
    
    <details>
      <summary><strong>proposals.json</strong> (for automation)</summary>

    ```json
{
  "run_id": "run_2026-01-28T12-00-00Z_abcd1234",
  "repo_ref": "main",
  "git_sha": "9f3a0f4d0a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
  "generated_at": "2026-01-28T12:06:40Z",
  "proposals": [
    {
      "proposal_id": "proposal-1",
      "title": "Add deterministic MCP client-simulation harness",
      "category": "compatibility",
      "effort_estimate": "M",
      "risk": "low",
      "why_now": [
        "Improves confidence for unattended agent-driven PRs",
        "Catches regressions in stage/tool-list behaviors across clients"
      ],
      "expected_impact": {
        "users": [
          "Claude Code",
          "Cursor MCP clients",
          "other MCP clients"
        ],
        "outcome": "Higher compatibility; fewer client-specific breakages; faster regressions detection"
      },
      "design_sketch": "Add eval runner that replays scripted scenarios against server, capturing invariants + latency; store reports as artifacts.",
      "touch_points": [
        "agentops/evals/*",
        "src/server/* (if needed for test hooks)",
        "docs/compatibility.md (optional)"
      ],
      "test_plan": [
        "unit: scenario parser validates schema",
        "integration: run 10 scenario scripts against local server",
        "CI: ensure harness runs under GitHub Actions"
      ],
      "rollout": "Ship harness without changing runtime behavior; no prod impact.",
      "rollback": "Delete harness folder and CI step; no runtime changes.",
      "acceptance": [
        ">= 10 scenarios passing on baseline",
        "Harness produces eval_report.md with baseline vs candidate comparison"
      ]
    },
    {
      "proposal_id": "proposal-2",
      "title": "Improve gateway stage error messages + add structured error codes",
      "category": "reliability",
      "effort_estimate": "S",
      "risk": "medium",
      "why_now": [
        "Agent workflows benefit from machine-readable errors",
        "Reduces time-to-debug when clients call tools out-of-stage"
      ],
      "expected_impact": {
        "users": [
          "Any MCP client",
          "Your own orchestrators"
        ],
        "outcome": "More deterministic retries; clearer user guidance"
      },
      "design_sketch": "Return {error_code, stage_required, stage_current} in errors; keep human-readable message.",
      "touch_points": [
        "src/gateway/*",
        "src/stages/*",
        "docs/api-errors.md"
      ],
      "test_plan": [
        "unit: error object schema",
        "integration: scenario scripts expecting error codes"
      ],
      "rollout": "Backward-compatible: keep existing message string; add fields.",
      "rollback": "Remove extra fields if clients break.",
      "acceptance": [
        "Existing tests remain passing",
        "New tests validate error_code presence in out-of-stage calls"
      ]
    },
    {
      "proposal_id": "proposal-3",
      "title": "Observatory: add 'copy run bundle' export for debugging",
      "category": "UX",
      "effort_estimate": "M",
      "risk": "low",
      "why_now": [
        "Shortens debugging cycles",
        "Provides portable evidence for agent-run changes"
      ],
      "expected_impact": {
        "users": [
          "You",
          "debuggers",
          "future collaborators"
        ],
        "outcome": "Faster reproduction of bugs and regressions"
      },
      "design_sketch": "Export a zip-like bundle (or directory) containing session JSON, recent logs, and scenario replay script.",
      "touch_points": [
        "src/observatory/*",
        "src/storage/*",
        "docs/observatory.md"
      ],
      "test_plan": [
        "unit: export includes required files",
        "integration: export then replay against server"
      ],
      "rollout": "Feature flag if needed; dev-only initially.",
      "rollback": "Remove export endpoint/UI control.",
      "acceptance": [
        "Bundle contains session JSON + last N events + metadata",
        "Replay script runs and reproduces session invariants"
      ]
    }
  ]
}
    ```
    </details>