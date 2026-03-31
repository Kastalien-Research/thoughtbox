# Current State (Verified)

Status: Draft

---

## 1) Improvement Tracking (Event Emission Only)

**What exists**
- `src/observatory/improvement-tracker.ts` emits improvement phase events
  via `ThoughtEmitter`.
- Event types include discovery, filter, experiment, evaluate, integrate,
  cycle_start, cycle_end.

**What this means**
- Improvement events are emitted but are not persisted by default.
- Emission is fire-and-forget and cannot block or enforce any gate.

---

## 2) Self-Improvement Loop Orchestration (Scripted)

**What exists**
- `scripts/agents/sil-010-main-loop-orchestrator.ts` implements the SIL phases.
- `scripts/agents/run-improvement-loop.ts` runs the loop and writes results
  to a JSON file (`--output`, default `./improvement-results.json`).

**What this means**
- The loop is manual and batch-oriented.
- It is not wired into the observatory or improvement tracker.

---

## 3) Evaluation and Tests

**What exists**
- Tiered evaluator: `benchmarks/tiered-evaluator.ts`
  - Threshold checks by tier
  - Cost tracking
  - Emits evaluation events via `ImprovementTracker`
- Benchmark suite definition: `benchmarks/suite.yaml`
  - Smoke / regression / real-world tiers
- Behavioral contracts: `scripts/agents/behavioral-contracts.ts`
- Behavioral contract test runner: `scripts/agents/test-behavioral-contracts.ts`
- Agentic black-box tests: `scripts/agentic-test.ts`

**What this means**
- Deterministic and black-box eval mechanisms exist.
- They are not enforced as mandatory gates for integration.

---

## 4) Observability

**What exists**
- `src/observatory/server.ts` provides HTTP + WebSocket server.
- Channels: `src/observatory/channels/reasoning.ts`,
  `src/observatory/channels/observatory.ts`.
- Session store is explicitly in-memory (`sessionStore`).
- MCP protocol metrics in sidecar:
  `observability/mcp-sidecar-observability/src/instrumentation.ts`.

**What this means**
- Real-time observability exists, but no persistence of improvements or
  improvement events.
- Protocol health is tracked, not improvement quality.

---

## 5) Existing Specs and Research Docs

**What exists**
- `self-improvement/PLAN-cost-effective-self-improvement-loop.md`
- `self-improvement/self-improving-codebase-arch.md`
- Observatory architecture docs in `architecture/observatory/`.

**What this means**
- Design intent is documented.
- Implementation is partial and not wired into a continuous loop.

