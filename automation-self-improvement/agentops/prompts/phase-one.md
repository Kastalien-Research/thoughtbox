# Phase 1: Real Proposal Generation

You are implementing **AgentOps Phase 1: Real Proposal Generation**.

Context:

- Day‑0 is already implemented (CLI, templates, extraction, workflows, SMOKE/REAL labels, LangSmith optional).
- Day‑0 currently uses fixtures/hardcoded bullets for digest + proposals.
- Phase 1 goal: The **daily dev brief** should be generated from real inputs (repo + external signals) and produce **2–3 actionable proposals** with evidence, test plan, touch points, risk/rollback — conforming to the existing proposals schema.

Hard requirements:

- Keep the existing issue templates and embedded payload format stable.
- Preserve the “graceful degradation” behavior:
  - If no LLM API key is present → fall back to fixtures (Day‑0 behavior) with an explicit note: “FIXTURE MODE”.
- No slop:
  - Every digest item must include a URL.
  - Every proposal must include evidence links (at least 1, ideally 2–3).
  - Proposals must be actionable (touch points and test plan are mandatory).
  - If the LLM output fails schema validation, attempt one repair pass; if still invalid → fall back to fixtures.

Deliverables (files + behavior):

A) Config for sources + budgets

- Add: `agentops/config/dev_sources.yaml` (sources + limits + enable/disable)
- Add: `agentops/config/dev_brief_policy.yaml` (budgets + min evidence + max proposals)

B) Signal collection (“sensing”)

- Implement `agentops/runner/lib/sources/collect.ts` that returns a normalized list:

  ```ts
  type SignalItem = {
    source: string;          // "arxiv", "openai_news", "anthropic_news", "repo_commits", ...
    title: string;
    url: string;
    published_at?: string;   // ISO date if available
    summary?: string;        // short snippet/abstract if available
    tags?: string[];
  }
  ```

Implement at minimum:

- Repo signals:
  - recent commits (last 24h or last N)
  - recently updated issues w/ labels (bug/compat/perf if present)
  - (optional) failing CI info is nice-to-have, not required
- External signals:
  - arXiv via API (abstracts are the key)
  - 1–3 “lab/company updates” sources (can be RSS OR HTML listing parser)
  - must return (title, url, date if possible)

Notes:

- Prefer “title + url + abstract/snippet” over full-page scraping.
- Keep token footprint small: cap total signal items, e.g. 20–35.

C) LLM synthesis (digest + proposals)

- Add: agentops/runner/lib/llm/provider.ts with a provider-agnostic interface:
  - supports ANTHROPIC_API_KEY and/or OPENAI_API_KEY
  - allow selection via env:
    - AGENTOPS_LLM_PROVIDER=anthropic|openai
    - AGENTOPS_LLM_MODEL=... (default to something sensible if unset)
- Add prompts under agentops/prompts/ (provided by human below):
  - agentops/prompts/dev_brief_synthesizer.md
  - agentops/prompts/dev_brief_repair.md
- The synthesizer must output JSON that matches the existing proposals schema (the same shape as your fixtures).
- Enforce:
  - proposals count must be 2–3
  - each proposal has: proposal_id, title, category, effort_estimate, risk, why_now, expected_impact, design_sketch, touch_points, test_plan, rollout, rollback, acceptance
  - each proposal has evidence: string[] URLs (new field OK if your schema allows; if schema doesn’t allow, embed evidence links into why_now or design_sketch, but prefer a real field + update schema + tests accordingly)

D) Wire into daily-dev-brief command

- Replace fixture generation in agentops/runner/daily-dev-brief.ts:
  - collect signals
  - build a compact context pack
  - call LLM to synthesize digest + proposals
  - validate output
  - render issue body using existing template placeholders
  - write artifacts: digest.md, proposals.json, issue_body.md, run_summary.json

E) Tests

- Add tests that do NOT require network:
  - prompt output schema validation using a saved example JSON
  - ensure template rendering still passes
  - ensure “embedded proposals.json” extraction still works

F) Tracing (LangSmith)

- If LANGSMITH_API_KEY exists:
  - trace the phases: collect_signals, synthesize, validate, render_issue
  - tag runs with run_id, job_name, git_sha
- If not set: work normally.

Human input required (only if blocking):

1. Provide at least one API key for Phase 1 real synthesis:
   - ANTHROPIC_API_KEY and/or OPENAI_API_KEY
2. Choose provider/model defaults:
   - AGENTOPS_LLM_PROVIDER default to anthropic (or openai) if key exists
   - AGENTOPS_LLM_MODEL (string)
If the human does not provide these, implement fallback-to-fixtures behavior and keep Phase 1 codepaths behind “if key exists”.

Acceptance criteria:

- Local run with key:
  - npm run agentops:daily -- --dry-run produces digest + proposals based on real signals (arxiv + repo + at least one lab source)
  - issue_body.md includes valid embedded proposals.json
- Local run without key:
  - clearly enters FIXTURE MODE (no ambiguity)
  - JSON schema is enforced; invalid LLM output triggers repair once, else fixture fallback
  - Artifacts contain enough evidence to review without guessing

At the end:

- Output a concise “How to run Phase 1 today” and list environment variables.

---

## 2) Materials Pack (Files to Add)

These are designed to make the Phase‑1 implementation deterministic and hard to “slop”.

## 2.1 `agentops/config/dev_brief_policy.yaml`

```yaml
# AgentOps Phase 1 policy knobs
max_proposals: 3
min_proposals: 2

# Total signals passed to the model (cap token usage + reduce noise)
max_signal_items: 30

# Evidence quality controls
min_evidence_links_per_proposal: 1
prefer_evidence_links_per_proposal: 3

# Guardrails
require_touch_points: true
require_test_plan: true
require_rollback: true
require_acceptance: true

# Budgets (soft / for reporting; enforce in code if you want)
max_llm_cost_usd: 10.0
max_wall_clock_minutes: 30
```
