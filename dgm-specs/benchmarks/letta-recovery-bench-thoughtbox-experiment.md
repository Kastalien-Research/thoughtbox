# Letta Recovery-Bench × Thoughtbox: experiment specification

## Purpose

Measure whether enabling **Thoughtbox** improves an agent’s ability to **recover from polluted / failed states** (context pollution + modified environment), using Letta’s **Recovery-Bench** methodology.

- **Benchmark reference**: Letta blog post ([`https://www.letta.com/blog/recovery-bench`](https://www.letta.com/blog/recovery-bench))
- **Benchmark code reference**: Letta repo ([`https://github.com/letta-ai/recovery-bench`](https://github.com/letta-ai/recovery-bench))

This document specifies a strict **A/B experiment**:

- **A (Treatment)**: agent has Thoughtbox available via MCP
- **B (Control)**: identical agent, but Thoughtbox is not available

The only allowed difference between A and B is **Thoughtbox tool availability**.

---

## What “Recovery-Bench” evaluates (summary)

Recovery-Bench evaluates agent performance when initialized from a prior failed trajectory and/or corrupted environment (“recovery states”), which may include:

- **Environment-only**: the environment is already in a post-failure state; no action history is shown to the agent.
- **Environment + action summary**: the agent receives a summary of the previous (failed) actions.
- **Environment + action history**: the agent receives the full failed action history (the most “polluted context” setting).

Per Letta’s description, providing full action history is often the hardest setting due to context pollution ([`https://www.letta.com/blog/recovery-bench`](https://www.letta.com/blog/recovery-bench)).

---

## Experimental design (pre-registered)

### Hypothesis (primary)

Enabling Thoughtbox increases Recovery-Bench success rate by improving:

- recovery planning in messy environments
- resistance to misleading prior action traces (“context pollution”)
- efficient correction of earlier errors

### Conditions

#### Condition A: Thoughtbox-enabled (treatment)

- Agent may call Thoughtbox via MCP throughout the run for:
  - structured scratchpad / notes
  - storing intermediate conclusions
  - “repair summaries” that override misleading histories
  - session-aware tracking (optional)

#### Condition B: Thoughtbox-disabled (control)

- Thoughtbox MCP server is not configured / accessible
- No “replacement memory tool” is added

### Hard parity requirements (must be identical across A/B)

- **Benchmark harness** (same exact version/commit)
- **Task set** and task ordering (unless randomized as described below)
- **Model** (same provider + model ID)
- **Sampling**: temperature/top_p/seed (fixed; seed where supported)
- **Budgets**: max steps/turns, max tool calls, wall-clock timeout
- **System prompt** and all non-Thoughtbox instructions
- **Tooling**: all tools except Thoughtbox are identical
- **Permissions** and sandboxing constraints

---

## Implementation choices

### Harness choice

For highest fidelity, run **Letta’s Recovery-Bench harness** against a Letta agent implementation. This avoids scoring drift from reimplementing:

- environment initialization
- replay of failed trajectories
- termination criteria
- grading functions

Thoughtbox is integrated as an **additional tool** for Condition A.

### Thoughtbox integration mechanism

Thoughtbox is exposed via **MCP over HTTP**.

This repo’s internal harness already uses MCP configuration patterns via the Claude Agent SDK:

- Control: `mcpServers: {}` (no MCP servers)
- Treatment: `mcpServers: { thoughtbox: { type: 'http', url: <mcpUrl> } }`

See:

- `dgm-specs/harness/reasoning-runner.ts`
- `dgm-specs/harness/benchmark-runner.ts`

---

## Protocol (exact)

### Unit of evaluation

One **episode** = one Recovery-Bench task instance executed end-to-end until:

- **success** (benchmark-defined)
- **failure** (benchmark-defined)
- **timeout / budget exhaustion**
- **runtime error**

### Pairing and randomization

Use a **paired A/B design** for variance reduction:

- For each task instance `i`, run both:
  - `A(i)` Thoughtbox-enabled
  - `B(i)` control

Run order is randomized per task to reduce order effects:

- with probability 0.5: A then B
- with probability 0.5: B then A

### Replicates

If runs are nondeterministic (temperature > 0 or no stable seed), run `K` replicates per task:

- recommended: `K = 3` minimum
- replicate pairing: `A(i,r)` vs `B(i,r)` using identical seeds where supported

If fully deterministic: `K = 1` is acceptable.

### Budgets (must be pre-registered)

Set explicit caps and keep identical across A/B:

- max reasoning turns / steps: `N_turns`
- max tool calls: `N_tools`
- wall-clock timeout: `T_minutes`

### Recovery-Bench strata

Treat the three recovery-state regimes as **separate strata** (report separately; optionally aggregate):

- RB-E (environment only)
- RB-E+S (environment + action summary)
- RB-E+H (environment + full action history)

**Primary stratum recommendation**: RB-E+H (hardest; most context pollution).

---

## Logging & artifacts (required)

### Per-episode JSONL record

Emit one JSON object per episode with (minimum):

- **IDs**
  - `benchmark`: `"recovery-bench"`
  - `benchmark_version` (commit/hash/tag)
  - `task_id`
  - `recovery_regime`: `"E" | "E+S" | "E+H"`
  - `condition`: `"thoughtbox" | "control"`
  - `replicate_id`
  - `run_order`: `"A-then-B" | "B-then-A"`

- **Runtime**
  - `model_id`
  - `temperature`, `top_p`, `seed` (if supported)
  - `start_time`, `end_time`, `wall_clock_seconds`
  - `termination_reason`: `"success"|"failure"|"timeout"|"budget_exhausted"|"error"`

- **Score**
  - `passed`: boolean
  - `benchmark_score`: number (if provided by harness)

- **Tool telemetry**
  - `tool_calls_total`
  - `tool_calls_by_name` (map)

- **Token/cost telemetry** (if available)
  - `prompt_tokens`, `completion_tokens`, `total_tokens`
  - `cost_usd` (if available)

- **Thoughtbox telemetry** (treatment only)
  - `thoughtbox_reads`
  - `thoughtbox_writes`
  - `thoughtbox_bytes_written` (or token estimate)

### Full traces (required)

Store full transcripts + tool traces for audit:

- raw model messages (system/user/assistant)
- tool call inputs/outputs
- environment logs if the harness provides them

Keyed by: `(benchmark_version, task_id, regime, condition, replicate_id)`.

---

## Metrics and analysis plan

### Primary metric

Per stratum, compute **pass rate**:
\[
  \Delta = \text{pass\_rate}(\text{Thoughtbox}) - \text{pass\_rate}(\text{Control})
\]

Primary reporting target: **RB-E+H** (unless overridden before running).

### Secondary metrics (mechanistic + efficiency)

- tool-call count distribution (median, p90)
- wall-clock time (median, p90)
- token usage / cost (median, p90)
- “error cascade” proxies (optional): number of new failures introduced before convergence, if measurable

### Statistical procedure

Use the paired structure for inference.

Recommended:

- compute per-task paired differences in pass outcome (or mean pass across replicates)
- compute a **paired bootstrap 95% CI** over tasks (resample task IDs with replacement)

Report:

- Δpass_rate + CI per stratum
- pooled Δpass_rate across strata (optional; report stratified results regardless)

---

## Acceptance criteria (pre-registered)

Choose thresholds before running; suggested defaults:

- **Primary stratum (RB-E+H)**:
  - Δpass_rate ≥ **+5 percentage points**, and
  - 95% bootstrap CI for Δpass_rate is **entirely > 0**

Also report cost/efficiency deltas; optionally set a non-blocking guardrail:

- median tokens or tool calls do not increase by more than **+25%**

---

## Threats to validity (and mitigations)

- **Harness drift**: use Letta’s harness unmodified; pin benchmark commit.
- **Tool confounds**: only Thoughtbox differs between A and B.
- **Prompt confounds**: identical system prompt except “Thoughtbox is available” line in treatment.
- **Order effects**: randomize A/B run order per task.
- **Non-determinism**: use replicates and seed pairing when possible.

---

## Operational checklist

### Before running

- Pin exact versions:
  - Recovery-Bench commit hash/tag
  - Letta agent SDK version
  - Thoughtbox server build/version
- Confirm Thoughtbox MCP endpoint: `http://<host>:<port>/mcp`
- Confirm A/B parity:
  - identical budgets, permissions, environment
  - control cannot reach Thoughtbox MCP

### During running

- Persist JSONL episode records and full traces as described above.

### After running

- Produce a short report with:
  - pass rates + Δ + CI per regime
  - cost/efficiency deltas
  - 5–10 qualitative case studies (wins/losses) grounded in traces
