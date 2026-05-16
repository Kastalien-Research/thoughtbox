# What Was Actually Tested

**Test date:** 2026-05-16 UTC (2026-05-15 America/Chicago)

This file records the current AgentOps daily brief validation. It does not claim
that GitHub Actions, issue creation, or proposal implementation were exercised.

## Fixture Path Validation

Command:

```bash
pnpm agentops:daily:fixtures -- --output-dir /private/tmp/agentops-fixture-run
```

Result:

- exited `0`
- wrote `digest.md`, `proposals.json`, `issue_body.md`, and `run_summary.json`
- `run_summary.json.execution_mode` was `fixture`
- `run_summary.json.status` was `SUCCEEDED`
- `run_summary.json.metrics.llm_cost_usd` was `0`
- no `signals.json` artifact was required in fixture mode

What this proves:

- package script wiring works
- runner paths resolve under `automation-self-improvement/agentops/`
- fixture mode is explicit and zero-cost
- fixture artifacts are marked as fixture/test-only

## Real Dry-Run Validation

Command:

```bash
pnpm agentops:daily -- --dry-run --output-dir /private/tmp/agentops-real-run
```

The shell had `ANTHROPIC_API_KEY` exported from an untracked local `.env`.

Result:

- exited `0`
- wrote `digest.md`, `proposals.json`, `issue_body.md`, `run_summary.json`, and
  `signals.json`
- collected 16 signals
- successful sources: `rss`, `html`
- failed sources: `arxiv` with `Too Many Requests`
- empty sources: `repo`, `assumptions`, `session_handoff`
- status was `PARTIAL`, reflecting allowed source degradation only
- LLM provider/model: `anthropic/claude-sonnet-4-5-20250929`
- `run_summary.json.metrics.llm_cost_usd` was about `0.062`
- `proposals.json` was not byte-identical to
  `automation-self-improvement/agentops/fixtures/proposals.example.json`
- each proposal evidence URL was present in collected signals
- `issue_body.md` did not contain `FIXTURE MODE`

What this proves:

- real mode does not fall back to fixtures
- real mode can tolerate partial source degradation when enough usable signals
  remain
- LLM synthesis produced non-fixture proposals
- final proposal validation consumed collected signal evidence
- source failures and empty sources are visible in `run_summary.json`

## Missing-Key Validation

Command:

```bash
env -u ANTHROPIC_API_KEY -u OPENAI_API_KEY \
  pnpm agentops:daily -- --dry-run --output-dir /private/tmp/agentops-no-key
```

Result:

- exited nonzero
- error stated that real AgentOps daily brief requires LLM configuration
- no successful proposal bundle was written

What this proves:

- real mode hard fails without LLM configuration
- missing LLM configuration no longer silently falls back to fixture output

## Automated Checks

Commands:

```bash
pnpm exec vitest run automation-self-improvement/agentops/tests
pnpm check:control-plane
```

Result:

- AgentOps Vitest surface passed
- control-plane manifest/generated truth check passed
- the current Vitest configuration excludes:
  - `automation-self-improvement/agentops/tests/integration.test.ts`
  - `automation-self-improvement/agentops/tests/phase1.2.test.ts`

## Not Tested

- non-dry-run GitHub issue creation
- GitHub Actions scheduling or label-triggered workflows
- real proposal implementation from approval labels
- LangSmith cloud trace upload
- broader `self-improvement` loop behavior
- benchmark repair
