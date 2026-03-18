# Execution, Evaluation & Evolution

**Phases 4, 5, and 6 of the Unified Autonomous Loop**

## Purpose
Execution must be structurally safe, evaluations must be cost-effective yet game-proof, and learnings must compound back into the ecosystem so the system actually improves over time.

## 1. Execution & Sandboxing (The "How")
Execution utilizes the **Distbook** MCP peer architecture. 

- **Distbook**: Handles stateful, structured code cell execution, returning exact exits, `stdout`, and timing metrics.
- **Proctoring**: To prevent accidental local contamination or destruction, Distbook executes tasks inside a network-disabled Docker container (or gVisor sandbox) acting as the isolation boundary.
- **Action**: The agent steps through the Novel Workflow Plan generated in Phase 3. It interacts with the codebase to write code, design capabilities, or investigate paths.

## 2. Tiered Evaluation
To collapse iterative costs from ~$7,000 down to ~$100, the verification is highly tiered. Early termination occurs at the cheapest possible failure point.

- **Tier 1 (Smoke & Behavior)**: Cheap local checks (linting, baseline behavioral `.claude/scripts/agentic-test.ts`).
- **Tier 2 (Anchor Points)**: Instead of running the full SWE-Bench style test suite, tests are sampled (1%) using dynamically selected Anchor Points. Stratified sampling across difficulty levels acts as a proxy for the entire benchmark.
- **Tier 3 (Anti-Gaming / Contamination)**: Rigorous check to prevent Darwinian reward hacking:
  - *Suspiciously fast solve times* are flagged.
  - *Direct similarity* to known held-out solutions is treated as data contamination.
  - *Log consistency verification* to ensure tests were actually run, not hallucinated in `stdout`.

## 3. Integration & Evidence
If Tier 3 passes, the `agentops` component takes over the standard developer workflow:
- The changes are captured in a custom git branch.
- A Draft PR is opened automatically.
- A heavily detailed "Evidence Comment" summarizes the Tiered Evaluation results, metrics, and costs.

## 4. Evolutionary Compounding
This is the core of the Darwin Gödel Machine mechanism.

- **Library Update**: The composite fitness score from Tier 2 is recorded. If this Novel Workflow Plan outperformed the parent workflows in that specific 5D behavioral niche, the new Workflow displaces the old one in the MAP-Elites library.
- **Lineage Tracking**: The successful workflow's genes (steps) and history are logged to `.claude/rules/evolution/lineage.json`.
- **High-Water Mark**: The validation boundaries in `dgm-specs/validation/baseline.json` are ratcheted upwards. The system's new state formally becomes the baseline for the next cycle.
