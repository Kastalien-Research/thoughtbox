You are implementing the “AgentOps Day‑0 Bootstrap” inside this repository.

Your job is to create a minimal but correct end-to-end pipeline that:
1) runs daily on a schedule to generate a Thoughtbox dev digest + 2–3 proposals,
2) opens a GitHub Issue with that content and an embedded machine-readable payload,
3) waits for human approval via label(s),
4) on approval label, runs an implementation/evaluation job (even if initially stubbed),
5) posts an evidence comment back to the issue (and optionally opens a PR),
6) emits durable artifacts + LangSmith trace links for every run.

Use the existing workflow style and gates from:
`.claude/commands/specifications/specification-suite.md`
as the reference pattern for:
- phase structure (detect state → design → validate → orchestrate)
- state persistence
- gates/checklists
- artifacts and audit logs

You MUST implement this in a way that can be completed today:
- prioritize correctness, determinism, and auditability
- OK to stub the “LLM intelligence” parts initially, but the workflow chain MUST work end-to-end
- keep everything isolated under `agentops/` and `.github/workflows/` unless there’s a clear reason otherwise

---

## Phase 0 — Session detection (like spec-suite)

1) Detect whether `agentops/` already exists and whether there are previous bootstrap artifacts:
   - if `.agentops-bootstrap/` exists, read `.agentops-bootstrap/state.json`
2) If bootstrap already partially exists:
   - produce a short “resume plan” and continue without duplicating files.

Write progress to:
`.agentops-bootstrap/state.json`
and produce human-readable logs in:
`.agentops-bootstrap/summary.md`

Gate:
- [ ] You can explain what already exists and what you will change.

---

## Phase 1 — Design (plan the implementation)

### Deliverables you must create (file-level checklist)

A) Templates & fixtures
- `agentops/templates/daily_thoughtbox_dev_brief_issue.md`
- `agentops/templates/implementation_evidence_comment.md`
- `agentops/fixtures/run_summary.example.json`
- `agentops/fixtures/proposals.example.json`

(Use the template/fixtures content provided to you by the human in this chat; do not invent incompatible schemas.)

B) Runner (CLI) that can run locally and in CI
Implement a small runner in the repo’s most natural language (prefer the repo’s existing stack).
It must support two commands:

1) `daily-dev-brief`
   - produces artifacts:
     - `artifacts/digest.md`
     - `artifacts/proposals.json`
     - `artifacts/issue_body.md` (rendered from the template)
     - `run_summary.json`
   - and then posts/opens a GitHub Issue using the rendered body

2) `implement-proposal --proposal-id proposal-1 --issue-number N`
   - fetches the issue body from GitHub
   - extracts embedded `proposals.json`
   - selects the proposal by id
   - performs an implementation step (can be stubbed Day‑0):
     - minimal acceptable behavior Day‑0:
       - create a branch name `agent/{proposal-id}/{run_id}`
       - write a placeholder patch or create a TODO file under `agentops/runs/...` (do NOT pollute product code)
       - run the repo tests (or a no-op if none exist) and capture logs
       - produce `implementation_report.md` and `eval_report.md` (can be stubbed)
   - posts a comment to the issue using the evidence template
   - optionally opens a draft PR (if safe and configured)

C) GitHub Actions workflows
- `.github/workflows/agentops_daily_thoughtbox_dev.yml`
  - schedule (cron) + workflow_dispatch
  - runs `daily-dev-brief`
  - uploads artifacts
- `.github/workflows/agentops_on_approval_label.yml`
  - triggers on issue labeled: `approved:proposal-1|2|3`
  - runs `implement-proposal` for that proposal
  - uploads artifacts
  - comments evidence back to the issue

D) Setup / docs
- `agentops/SETUP.md` documenting:
  - required GitHub secrets
  - required labels to create
  - how to run locally
  - how to run in GitHub Actions
  - governance/safety rules (no external messaging)

### Human input you must request (only what is actually blocking)

Before coding anything that depends on these, ask the human for:

1) Where should the workflows run?
   - GitHub-hosted runners (default)
   - or self-hosted runner (if we need local tools like Claude Code/Cursor)
2) Secrets availability:
   - `LANGSMITH_API_KEY` (yes/no; name to use)
   - at least one model API key if we implement real proposal generation:
     - `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY`
3) Should the implementation workflow open PRs automatically?
   - yes (requires `pull-requests: write`)
   - no (just attach patch + instructions)
4) Desired daily schedule time in America/Chicago (default: 06:30)

If the human doesn’t answer immediately, proceed with safe defaults:
- GitHub-hosted runners
- no PR auto-open (just comment evidence + attach artifacts)
- schedule at 06:30 America/Chicago
- proposal generation stubbed unless API keys exist

Gate:
- [ ] A written design plan exists in `.agentops-bootstrap/summary.md`
- [ ] File list and acceptance criteria are explicit

---

## Phase 2 — Validate (like spec-validator)

Implement lightweight validation checks:

- Validate that `proposals.json` conforms to the canonical schema:
  - has `run_id`
  - has `proposals` array length 2–3
  - each proposal has `proposal_id`, `title`, `test_plan`, `touch_points`, `rollback`
- Validate that issue body includes:
  - `AGENTOPS_META_BEGIN ... END`
  - `proposals.json` JSON block parseable
- Validate workflows YAML syntax (best-effort)
- Validate runner can execute in a clean environment

Add a small test script (or unit tests) under `agentops/tests/` that:
- loads fixtures
- renders the issue body template
- parses back the embedded JSON deterministically

Gate:
- [ ] `agentops/tests` pass locally (or via CI) with fixtures
- [ ] The “extract proposals from issue body” logic works

---

## Phase 3 — Orchestrate (implementation)

### Implementation details (constraints)

- Keep new dependencies minimal; prefer standard libs.
- All runs MUST emit:
  - `run_summary.json`
  - `logs.txt`
  - `artifacts/` folder
- For Day‑0, scanning the web and real LLM proposal generation can be stubbed,
  BUT the runner must be structured so it’s easy to plug in the real logic later.

### LangSmith tracing

If `LANGSMITH_API_KEY` is present:
- create a trace per run tagged with:
  - `run_id`, `job_name`, `proposal_id` (if applicable), `git_sha`
- record major steps as spans:
  - ingest/sense, synthesize, render issue, post issue
  - implement, test, eval, comment evidence

If not present:
- run without tracing but still include `trace: null` in run_summary.

### GitHub integration

Use GitHub API (or `gh` CLI if available) to:
- create issue (daily workflow)
- fetch issue body (implementation workflow)
- post comment back

Keep permissions minimal in workflow YAML.

### Labels

Ensure the repo has these labels (document in SETUP.md):
- `agentops`
- `dev-brief`
- `approved:proposal-1`
- `approved:proposal-2`
- `approved:proposal-3`
- `hold`
- `rejected`

(You may add a small script to create labels via API, but don’t block Day‑0 on it.)

Gate:
- [ ] Running the daily workflow produces an issue with embedded proposals JSON
- [ ] Applying `approved:proposal-1` triggers the second workflow and posts an evidence comment
- [ ] Artifacts are uploaded for both workflows
- [ ] No unsafe actions (no external comms, no prod changes)

---

## Final output requirements

At the end, provide:
1) a short “How to run it today” section,
2) a list of all files created/modified,
3) what human needs to set (secrets/labels),
4) known limitations and next steps for plugging in real proposal intelligence.