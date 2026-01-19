# Self-Improvement Loop Specifications

> **Created**: 2026-01-19
> **Source**: PLAN-cost-effective-self-improvement-loop.md
> **Status**: Draft - Ready for Validation

## Overview

This spec suite implements a **cost-effective autonomous self-improvement loop** for Thoughtbox, based on Darwin Gödel Machine (DGM) principles. The goal is 99%+ cost reduction compared to SICA ($7,000 → $70-150 per iteration) while maintaining genuine improvement capability.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Autonomous Improvement Loop                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐         │
│  │Discovery│──▶│ Filter  │──▶│Experiment│──▶│ Evaluate│         │
│  │ (Haiku) │   │ (Haiku) │   │(Sonnet) │   │ (Tiered)│         │
│  └─────────┘   └─────────┘   └─────────┘   └────┬────┘         │
│       │             │             │              │              │
│       │             │             │              ▼              │
│       │             │             │        ┌─────────┐          │
│       │             │             │        │Integrate │          │
│       │             │             │        └─────────┘          │
│       │             │             │              │              │
│       └─────────────┴─────────────┴──────────────┘              │
│                          │                                       │
│                    Observatory                                   │
│                    (Tracking)                                    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                    Gaming Prevention                             │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐          │
│  │  Proctored  │  │  Held-Out   │  │ Contamination  │          │
│  │  Executor   │  │  Rotation   │  │   Detection    │          │
│  └─────────────┘  └─────────────┘  └────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Spec Index

### Pre-Flight (Week 0) - MUST COMPLETE FIRST

| Spec | Name | Priority | Dependencies |
|------|------|----------|--------------|
| [SIL-000](./SPEC-SIL-000-feedback-loop-validation.md) | Feedback Loop Validation | **CRITICAL** | None |

### Foundation (Week 1)

| Spec | Name | Priority | Dependencies |
|------|------|----------|--------------|
| [SIL-001](./SPEC-SIL-001-observatory-improvement-tracker.md) | Observatory Improvement Tracker | HIGH | SIL-000 |
| [SIL-002](./SPEC-SIL-002-benchmark-suite-config.md) | Benchmark Suite Config | HIGH | None |

### Benchmark Infrastructure (Week 2)

| Spec | Name | Priority | Dependencies |
|------|------|----------|--------------|
| [SIL-003](./SPEC-SIL-003-anchor-point-sampler.md) | Anchor Point Sampler | HIGH | SIL-002 |
| [SIL-004](./SPEC-SIL-004-tiered-evaluator.md) | Tiered Evaluation Pipeline | HIGH | SIL-002, SIL-001 |
| [SIL-005](./SPEC-SIL-005-issue-scraper.md) | Real-World Issue Scraper | MEDIUM | None |

### Thoughtbox Integration (Week 3)

| Spec | Name | Priority | Dependencies |
|------|------|----------|--------------|
| [SIL-006](./SPEC-SIL-006-improvement-reasoner.md) | Improvement Reasoner | HIGH | SIL-001 |

### Autonomous Loop (Week 4)

| Spec | Name | Priority | Dependencies |
|------|------|----------|--------------|
| [SIL-007](./SPEC-SIL-007-proctored-executor.md) | Proctored Execution | HIGH | SIL-002 |
| [SIL-008](./SPEC-SIL-008-held-out-manager.md) | Held-Out Test Set Manager | MEDIUM | SIL-003, SIL-005 |
| [SIL-009](./SPEC-SIL-009-contamination-detection.md) | Contamination Detection | HIGH | SIL-003 |
| [SIL-010](./SPEC-SIL-010-main-loop-orchestrator.md) | Main Loop Orchestrator | HIGH | All above |
| [SIL-011](./SPEC-SIL-011-github-actions-workflow.md) | GitHub Actions Workflow | MEDIUM | SIL-010 |
| [SIL-012](./SPEC-SIL-012-claude-md-updater.md) | CLAUDE.md Learning Updater | MEDIUM | SIL-010 |

## Dependency Graph

```
SIL-000 (Validation) ─────────────────────────────────┐
    │                                                  │
    ▼                                                  │
SIL-001 (Observatory) ────┐                           │
    │                     │                           │
    │                     ▼                           │
    │              SIL-006 (Reasoner)                 │
    │                     │                           │
    ▼                     │                           │
SIL-002 (Config) ─────────┼───────────────────────────┤
    │                     │                           │
    ├──────┬──────┬──────┼───────┐                   │
    ▼      ▼      ▼      │       ▼                   │
SIL-003  SIL-004  SIL-007│    SIL-005                │
(Sampler)(Evaluator)(Proctor)  (Scraper)            │
    │      │      │      │       │                   │
    │      │      │      │       │                   │
    └──────┼──────┼──────┼───────┴───────┐           │
           │      │      │               │           │
           ▼      ▼      ▼               ▼           │
        SIL-008    SIL-009          (combines)      │
        (Held-Out) (Contamination)      │           │
              │           │             │           │
              └─────┬─────┘             │           │
                    │                   │           │
                    ▼                   │           │
              SIL-010 (Main Loop) ◄─────┘           │
                    │                               │
                    ├──────────────┐                │
                    ▼              ▼                │
              SIL-011        SIL-012               │
              (Actions)      (CLAUDE.md)           │
                                                   │
              ◄─────────── All specs validate ─────┘
                           against SIL-000 first
```

## Cost Model

### Per-Iteration Costs (Target)

| Phase | Model | Tokens | Cost/1M | Phase Cost |
|-------|-------|--------|---------|------------|
| Discovery | Haiku | 50K | $0.25 | $0.01 |
| Filter | Haiku | 100K | $0.25 | $0.03 |
| Experiment | Sonnet (Batch) | 500K | $1.50 | $0.75 |
| Evaluate T1 | Haiku | 50K | $0.25 | $0.01 |
| Evaluate T2 | Sonnet | 200K | $3.00 | $0.60 |
| Evaluate T3 | Sonnet (1%) | 1M | $3.00 | $0.30 |
| **Total** | | | | **~$1.70** |

With 50% early termination: **~$0.85-1.20 per iteration**

Compare to SICA: **$467 per iteration** → **99.7% savings**

## Key Principles

### From DGM (Darwin Gödel Machine)
- **Empirical validation** over formal proofs
- The deer that survives the lion didn't prove it was faster - it just was
- Fitness through real-world performance, not theoretical guarantees

### From Anchor Point Sampling
- **1% representative sample** predicts full benchmark with >0.9 correlation
- 99% cost reduction while maintaining signal quality
- Monthly rotation prevents memorization

### From Tiered Evaluation
- **Cheap gates first**, early termination on failure
- smoke-test ($0.10) → regression ($1.00) → real-world ($10.00)
- 80-90% of evaluations terminate at cheap tiers

### Gaming Prevention
- **Proctored execution**: Docker sandbox, no network, resource limits
- **Held-out rotation**: Monthly fresh test sets
- **Contamination detection**: Solution similarity, timing analysis, reasoning chain analysis

## Validation Requirements (SIL-000)

Before ANY other spec work:

1. **Baseline Reproducibility**: <5% variance across 3 identical runs
2. **Sensitivity (Known-Good)**: Detect when improvements exist
3. **Sensitivity (Known-Bad)**: Detect when regressions occur
4. **Signal > Noise**: Delta must exceed baseline variance

## File Index

### New Files to Create

| Path | Spec | Purpose |
|------|------|---------|
| `src/observatory/improvement-tracker.ts` | SIL-001 | Event tracking |
| `benchmarks/suite.yaml` | SIL-002 | Configuration |
| `benchmarks/config-loader.ts` | SIL-002 | TypeScript loader |
| `benchmarks/sampler.ts` | SIL-003 | Anchor point sampling |
| `benchmarks/tiered-evaluator.ts` | SIL-004 | Evaluation pipeline |
| `benchmarks/issue-scraper.ts` | SIL-005 | GitHub issue scraping |
| `src/improvement/reasoner.ts` | SIL-006 | Thoughtbox-based reasoning |
| `benchmarks/proctor.ts` | SIL-007 | Docker sandbox |
| `benchmarks/held-out-manager.ts` | SIL-008 | Rotation management |
| `benchmarks/contamination.ts` | SIL-009 | Detection algorithms |
| `src/improvement/loop.ts` | SIL-010 | Main orchestrator |
| `.github/workflows/improvement-loop.yml` | SIL-011 | Automation |
| `src/improvement/claude-md-updater.ts` | SIL-012 | Learning capture |

## Implementation Timeline

```
Week 0: SIL-000 (Validation) ─────────────────▶ GATE: Can we trust measurements?
                                                │
Week 1: SIL-001 + SIL-002 ────────────────────▶ GATE: Infrastructure ready?
                                                │
Week 2: SIL-003 + SIL-004 + SIL-005 ──────────▶ GATE: Benchmarks working?
                                                │
Week 3: SIL-006 ──────────────────────────────▶ GATE: Reasoning integrated?
                                                │
Week 4: SIL-007 through SIL-012 ──────────────▶ GATE: Full loop operational?
                                                │
Week 5+: First autonomous run ────────────────▶ Iterate and refine
```

## Fallback Strategy

If Distbook (execution environment) proves too far from ready:

**Fallback**: Run benchmarks directly via `npm test` in Thoughtbox repo
- Less elegant but zero additional infrastructure
- SIL-000 Task 5 will assess and recommend

## References

- [Master Plan](../../self-improvement/PLAN-cost-effective-self-improvement-loop.md)
- [Original Research](../../self-improvement/self-improving-codebase-arch.md)
- [DGM Paper](https://arxiv.org/abs/2505.22954)
- [Letta-evals](https://github.com/letta-ai/letta-evals)
- [SWE-bench](https://www.swebench.com/)

---

*Generated by specification-suite workflow*
