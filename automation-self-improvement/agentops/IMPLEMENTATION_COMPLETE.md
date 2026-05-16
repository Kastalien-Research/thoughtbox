# AgentOps Daily Brief Current Status

**Updated:** 2026-05-16 UTC (2026-05-15 America/Chicago)
**Status:** local daily brief wiring implemented; broader AgentOps automation is
not complete.

## What Is Implemented

- `pnpm agentops:daily -- [options]` runs
  `automation-self-improvement/agentops/runner/cli.ts daily-dev-brief`.
- `pnpm agentops:daily:fixtures -- [options]` runs the same command in explicit
  fixture mode.
- Runner paths resolve from `automation-self-improvement/agentops/` through
  `runner/lib/paths.ts`.
- Real daily mode collects live signals, requires LLM configuration, synthesizes
  proposals through the configured LLM, and validates evidence provenance against
  collected signals.
- Real daily mode hard fails for missing LLM configuration, insufficient signals,
  synthesis/repair failure, and failed proposal/evidence validation.
- Fixture mode can load `fixtures/proposals.example.json`, reports zero LLM cost,
  and marks output as fixture/test-only.
- `run_summary.json` reports `execution_mode`, source successes, source failures,
  empty sources, status, artifacts, and LLM cost.

## What Is Not Implemented

- No AgentOps GitHub Actions workflows are wired in this slice.
- No non-dry-run GitHub issue creation was validated in this slice.
- No real approval-label implementation loop was wired in this slice.
- No broader `self-improvement` loop or benchmark repair was attempted.
- Historical root `agentops/` paths in older phase reports are not the current
  runner location.

## Current Validation

Fixture path validation:

```bash
pnpm agentops:daily:fixtures -- --output-dir /private/tmp/agentops-fixture-run
```

Expected result:

- exit `0`
- writes `digest.md`, `proposals.json`, `issue_body.md`, and `run_summary.json`
- `run_summary.json.execution_mode` is `fixture`
- `run_summary.json.metrics.llm_cost_usd` is `0`

Real dry-run validation:

```bash
pnpm agentops:daily -- --dry-run --output-dir /private/tmp/agentops-real-run
```

Expected result:

- exit `0` when an LLM key is exported
- writes `signals.json`
- `run_summary.json.metrics.llm_cost_usd` is greater than `0`
- at least one signal source succeeds
- `proposals.json` is not byte-identical to `fixtures/proposals.example.json`
- every proposal has evidence from collected signals
- `issue_body.md` does not contain `FIXTURE MODE`

Missing-key validation:

```bash
env -u ANTHROPIC_API_KEY -u OPENAI_API_KEY \
  pnpm agentops:daily -- --dry-run --output-dir /private/tmp/agentops-no-key
```

Expected result:

- exits nonzero
- error says real mode requires LLM configuration
- no successful proposal bundle is written

Targeted checks:

```bash
pnpm exec vitest run automation-self-improvement/agentops/tests
pnpm check:control-plane
```

## Remaining Gaps

- `implement.ts` still represents a separate approval/implementation workflow
  and was not converted into a real proposal implementation engine here.
- GitHub issue creation should be validated separately before enabling a
  scheduled or non-dry-run workflow.
- Excluded AgentOps tests remain follow-up work:
  - `automation-self-improvement/agentops/tests/integration.test.ts`
  - `automation-self-improvement/agentops/tests/phase1.2.test.ts`
