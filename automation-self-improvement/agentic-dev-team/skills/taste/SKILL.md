---
name: taste
description: Run a taste evaluation on a research proposal or technical direction. Determines whether to proceed, simplify, defer, or kill before committing research effort.
argument-hint: [proposal or question to evaluate]
user-invocable: true
---

Evaluate this research direction: $ARGUMENTS

## Process

### 1. Determine Evaluation Depth

Based on the proposal, select the appropriate depth:

| Situation | Operations |
|---|---|
| Vague idea, needs sharpening | Compression test only |
| Specific technical proposal | Landscape + Dead-end estimation |
| Major resource commitment | Full pipeline (all 6 operations) |
| Stuck, need fresh angles | Cross-pollination only |
| Choosing between options | Prediction query only |

### 2. Run Operations (in order, skip per above)

**Compression Test** — Force into: "We believe [X] because [Y], and if we're right, [Z] follows." If it can't survive compression, verdict is **defer**.

**Landscape Assessment** — Use WebSearch and Exa (`web_search_exa`) to find adjacent work, abandoned approaches, new capabilities. What exists? What changed recently?

**Prediction Query** — Simulate success and failure worlds. Is the direction informative under both outcomes?

**Dead-End Estimation** — What's the most likely failure mode? What's the time-to-signal (not time-to-completion)?

**Simplicity Audit** — Is there an 80%-value simpler version? Apply recursively.

**Cross-Pollination** — Check against other domains. Structural resonance = real signal.

### 3. Stop Early

If the verdict becomes clear at any step, stop. Don't run more operations just to fill out the report.

### 4. Output

```
## Taste Evaluation: [Title]

**Verdict:** proceed | simplify | defer | kill
**Rationale:** [One sentence]
**Compression:** [Single-sentence formulation]
**Landscape:** [Position relative to existing work]
**Prediction:** Success → [X] / Failure → [Y]
**Time-to-signal:** [Estimate]
**Simplification:** [Cheaper version, if any]
**Cross-domain:** [Analogies, if checked]
**Next step:** [Concrete action]
```

Omit unchecked sections.
