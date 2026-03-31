# Evaluation Gates Specification

Status: Draft

---

## 1) Purpose

Define the deterministic and black-box evaluation gates that must pass before
an improvement can be integrated.

---

## 2) Gate Types

### 2.1 Tiered Evaluator (Deterministic)

**Source**
- `benchmarks/tiered-evaluator.ts`
- `benchmarks/suite.yaml`

**Requirements**
- Smoke tier pass rate = 1.0
- Regression tier pass rate >= 0.95
- Real-world tier pass rate >= 0.80
- Any failure blocks integration.

---

### 2.2 Behavioral Contracts (Black-Box)

**Source**
- `scripts/agents/behavioral-contracts.ts`
- `scripts/agents/test-behavioral-contracts.ts`

**Contracts**
- VARIANCE
- CONTENT_COUPLED
- TRACE_EXISTS
- LLM_JUDGES

**Requirements**
- All contracts must pass.
- Failure blocks integration.

---

## 3) Gate Enforcement Policy

1. Run tiered evaluator.
2. Run behavioral contracts.
3. If any gate fails, mark iteration as failed and stop integration.
4. Record gate outcomes in the improvement history store.

---

## 4) Required Outputs

- Per-gate results (pass/fail, score, threshold).
- Aggregated gate status for the iteration.

