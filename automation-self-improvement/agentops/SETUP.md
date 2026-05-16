# AgentOps Daily Brief Setup

This document describes the current local daily-brief runner under
`automation-self-improvement/agentops/`.

The active daily command is `agentops:daily`. It collects live signals, calls a
configured LLM, validates proposal evidence against collected signals, and
writes a daily brief artifact bundle. Fixture output is available only through
`agentops:daily:fixtures`.

## Current Scope

Implemented in this slice:

- Real local daily brief command: `pnpm agentops:daily -- [options]`
- Explicit fixture command: `pnpm agentops:daily:fixtures -- [options]`
- Artifact output under `automation-self-improvement/agentops/runs/` by default
- Real-mode hard failures for missing LLM config, insufficient signals, synthesis
  failure, and failed proposal/evidence validation
- Source degradation reporting in `run_summary.json`

Not implemented in this slice:

- GitHub Actions scheduling for AgentOps
- GitHub issue creation validation without `--dry-run`
- Real proposal implementation after approval labels
- Self-improvement loop repair outside the daily brief runner

## Prerequisites

- Node.js and pnpm matching the repository lockfile
- Dependencies installed with `pnpm install --frozen-lockfile`
- One LLM key exported in the shell for real mode:
  - `ANTHROPIC_API_KEY`
  - `OPENAI_API_KEY`

Optional LLM selectors:

```bash
export AGENTOPS_LLM_PROVIDER=anthropic
export AGENTOPS_LLM_MODEL=claude-sonnet-4-5-20250929
```

Do not commit `.env` files or copy secrets into this directory. For local real
validation, source an untracked `.env` in the shell before running the command.

## Commands

### Real Daily Brief

```bash
pnpm agentops:daily -- --dry-run --output-dir /private/tmp/agentops-real-run
```

Expected artifacts:

- `digest.md`
- `proposals.json`
- `issue_body.md`
- `run_summary.json`
- `signals.json`

Expected real-mode properties:

- `run_summary.json.execution_mode` is `real`
- `run_summary.json.metrics.llm_cost_usd` is greater than `0`
- at least one signal source succeeds
- every proposal evidence URL comes from collected signals
- `issue_body.md` does not contain `FIXTURE MODE`

Real mode fails instead of falling back to fixtures when required LLM config or
proposal validation is unavailable.

### Fixture Path Validation

```bash
pnpm agentops:daily:fixtures -- --output-dir /private/tmp/agentops-fixture-run
```

Expected fixture properties:

- exits `0`
- writes `digest.md`, `proposals.json`, `issue_body.md`, and `run_summary.json`
- `run_summary.json.execution_mode` is `fixture`
- `run_summary.json.metrics.llm_cost_usd` is `0`
- issue and digest output visibly state fixture/test-only mode

Fixture mode is only for path and template wiring checks.

### Missing LLM Config Check

```bash
env -u ANTHROPIC_API_KEY -u OPENAI_API_KEY \
  pnpm agentops:daily -- --dry-run --output-dir /private/tmp/agentops-no-key
```

Expected:

- exits nonzero
- does not write a successful proposal bundle
- error says real mode requires LLM configuration

## Source Degradation

`run_summary.json.signal_collection` records:

- `sources_succeeded`
- `sources_failed`
- `sources_empty`
- `total_signals`
- `signals_by_source`

`PARTIAL` is allowed only when source collection partially degrades but enough
signals remain for validated real synthesis. Failed LLM calls, failed repair, or
failed proposal/evidence validation are hard failures.

## Targeted Checks

```bash
pnpm exec vitest run automation-self-improvement/agentops/tests
pnpm check:control-plane
```

`automation-self-improvement/agentops/tests/integration.test.ts` and
`automation-self-improvement/agentops/tests/phase1.2.test.ts` are intentionally
excluded from the current Vitest include surface and remain separate follow-up
work.

## Relevant Files

- `automation-self-improvement/agentops/runner/cli.ts`
- `automation-self-improvement/agentops/runner/daily-dev-brief.ts`
- `automation-self-improvement/agentops/runner/lib/paths.ts`
- `automation-self-improvement/agentops/runner/lib/sources/collect.ts`
- `automation-self-improvement/agentops/runner/lib/synthesis.ts`
- `automation-self-improvement/agentops/templates/daily_thoughtbox_dev_brief_issue.md`
- `automation-self-improvement/agentops/fixtures/proposals.example.json`
