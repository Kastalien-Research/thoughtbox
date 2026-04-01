# SIL Specs Dependency Graph

**Version**: 1.0
**Generated**: 2026-01-21

## Visual Dependency Graph

```mermaid
graph TD
    subgraph "Week 0: Pre-Flight"
        SIL000[SIL-000<br/>Feedback Loop Validation<br/>CRITICAL]
    end

    subgraph "Week 1: Foundation"
        SIL001[SIL-001<br/>Observatory<br/>HIGH]
        SIL002[SIL-002<br/>Benchmark Config<br/>HIGH]
    end

    subgraph "Week 2: Benchmarks"
        SIL003[SIL-003<br/>Anchor Sampler<br/>HIGH]
        SIL004[SIL-004<br/>Tiered Evaluator<br/>HIGH]
        SIL005[SIL-005<br/>Issue Scraper<br/>MEDIUM]
    end

    subgraph "Week 3: Reasoning"
        SIL006[SIL-006<br/>Improvement Reasoner<br/>HIGH]
    end

    subgraph "Week 4: Autonomous Loop"
        SIL007[SIL-007<br/>Proctored Executor<br/>HIGH]
        SIL008[SIL-008<br/>Held-Out Manager<br/>MEDIUM]
        SIL009[SIL-009<br/>Contamination Detection<br/>HIGH]
        SIL010[SIL-010<br/>Main Loop Orchestrator<br/>HIGH]
    end

    subgraph "Week 4+: Integration"
        SIL011[SIL-011<br/>GitHub Actions<br/>MEDIUM]
        SIL012[SIL-012<br/>CLAUDE.md Updater<br/>MEDIUM]
    end

    subgraph "Foundational (100-series)"
        SIL100[SIL-100<br/>Benchmark Harness<br/>✅ DONE]
        SIL101[SIL-101<br/>Minimal Response<br/>✅ DONE]
        SIL102[SIL-102<br/>Server Thought Numbers<br/>✅ DONE]
        SIL103[SIL-103<br/>Session Continuity<br/>✅ DONE]
        SIL104[SIL-104<br/>Event Stream<br/>✅ DONE]
    end

    %% Foundational dependencies
    SIL100 --> SIL000
    SIL101 --> SIL100
    SIL102 --> SIL100
    SIL103 --> SIL100
    SIL103 --> SIL102
    SIL104 --> SIL100

    %% Main spec dependencies
    SIL000 --> SIL001
    SIL000 --> SIL002

    SIL001 --> SIL004
    SIL001 --> SIL006

    SIL002 --> SIL003
    SIL002 --> SIL004
    SIL002 --> SIL007

    SIL003 --> SIL008
    SIL003 --> SIL009

    SIL005 --> SIL008

    SIL001 --> SIL010
    SIL003 --> SIL010
    SIL004 --> SIL010
    SIL006 --> SIL010
    SIL007 --> SIL010
    SIL009 --> SIL010

    SIL010 --> SIL011
    SIL010 --> SIL012

    style SIL000 fill:#4ecdc4,stroke:#0b7285,stroke-width:3px
    style SIL010 fill:#ff6b6b,stroke:#c92a2a,stroke-width:3px
    style SIL100 fill:#95e1d3,stroke:#099268
    style SIL101 fill:#95e1d3,stroke:#099268
    style SIL102 fill:#95e1d3,stroke:#099268
    style SIL103 fill:#95e1d3,stroke:#099268
    style SIL104 fill:#95e1d3,stroke:#099268
```

---

## Dependency Matrix

| Spec | Depends On | Blocks | Can Parallel With |
|------|------------|--------|-------------------|
| **SIL-000** | Foundational (100-104) | SIL-001, SIL-002 | - |
| **SIL-001** | SIL-000 | SIL-004, SIL-006, SIL-010 | SIL-002 |
| **SIL-002** | SIL-000 | SIL-003, SIL-004, SIL-007 | SIL-001 |
| **SIL-003** | SIL-002 | SIL-008, SIL-009, SIL-010 | SIL-004, SIL-005 |
| **SIL-004** | SIL-001, SIL-002 | SIL-010 | SIL-003, SIL-005 |
| **SIL-005** | - | SIL-008 | SIL-001 through SIL-004 |
| **SIL-006** | SIL-001 | SIL-010 | SIL-003, SIL-004, SIL-005 |
| **SIL-007** | SIL-002 | SIL-010 | SIL-003, SIL-004, SIL-005, SIL-006 |
| **SIL-008** | SIL-003, SIL-005 | - | SIL-009 |
| **SIL-009** | SIL-003 | SIL-010 | SIL-008 |
| **SIL-010** | SIL-001, SIL-003, SIL-004, SIL-006, SIL-007, SIL-009 | SIL-011, SIL-012 | - |
| **SIL-011** | SIL-010 | - | SIL-012 |
| **SIL-012** | SIL-010 | - | SIL-011 |

---

## Foundational Specs (100-series)

All complete as of 2026-01-21:

| Spec | Status | Implementation |
|------|--------|----------------|
| SIL-100 | ✅ DONE | `dgm-specs/harness/` |
| SIL-101 | ✅ DONE | `verbose` option in thought-handler |
| SIL-102 | ✅ DONE | `thoughtNumber` optional in schema |
| SIL-103 | ✅ DONE | `restoreFromSession()` method |
| SIL-104 | ✅ DONE | `emitThoughtAdded()` events |

---

## Critical Path Analysis

### Path 1 (Longest - through Reasoner)
```
SIL-000 (done) → SIL-001 (2d) → SIL-006 (3d) → SIL-010 (3d) → SIL-011 (2d)
Total: 10 days
```

### Path 2 (through Benchmarks)
```
SIL-000 (done) → SIL-002 (2d) → SIL-003 (2d) → SIL-009 (2d) → SIL-010 (3d)
Total: 9 days
```

### Path 3 (through Evaluator)
```
SIL-000 (done) → SIL-002 (2d) → SIL-004 (3d) → SIL-010 (3d)
Total: 8 days
```

**Critical Path**: Path 1 (10 days through SIL-006)

---

## Implementation Waves

### Wave 1: Foundation (Can Parallelize)
**Duration**: 2-3 days

```
SIL-001 (Observatory)     ─┬─ Parallel
SIL-002 (Benchmark Config) ─┘
```

### Wave 2: Benchmarks (Partially Parallel)
**Duration**: 3-4 days

```
SIL-003 (Sampler)    ─┬─ Parallel (after SIL-002)
SIL-004 (Evaluator)  ─┤
SIL-005 (Scraper)    ─┤  (independent)
SIL-006 (Reasoner)   ─┘  (after SIL-001)
SIL-007 (Proctor)    ─── (after SIL-002)
```

### Wave 3: Gaming Prevention (Can Parallelize)
**Duration**: 2-3 days

```
SIL-008 (Held-Out)       ─┬─ Parallel
SIL-009 (Contamination)  ─┘
```

### Wave 4: Integration (Sequential)
**Duration**: 3-4 days

```
SIL-010 (Main Loop) ─── Must wait for all above
    │
    ├── SIL-011 (GitHub Actions) ─┬─ Parallel
    └── SIL-012 (CLAUDE.md)       ─┘
```

**Total with parallelization**: ~12-14 days

---

## Current Status

> **Source of Truth**: `dgm-specs/implementation-status.json`
> **Last Synced**: 2026-01-21

| Spec | Status | Notes |
|------|--------|-------|
| SIL-000 | ✅ DONE | 3 validation runs, baseline established |
| SIL-001 | ✅ DONE | `improvement-tracker.ts` + tests |
| SIL-002 | ✅ DONE | `suite.yaml` + `config-loader.ts` + tests |
| SIL-003 | 🔴 NOT STARTED | UNBLOCKED - ready to implement |
| SIL-004 | 🔴 NOT STARTED | UNBLOCKED - ready to implement |
| SIL-005 | 🔴 NOT STARTED | UNBLOCKED - no dependencies |
| SIL-006 | 🔴 NOT STARTED | UNBLOCKED - ready to implement |
| SIL-007 | 🔴 NOT STARTED | UNBLOCKED - ready to implement |
| SIL-008 | 🔴 BLOCKED | Waiting on SIL-003, SIL-005 |
| SIL-009 | 🔴 BLOCKED | Waiting on SIL-003 |
| SIL-010 | 🔴 BLOCKED | Waiting on 003, 004, 006, 007, 009 |
| SIL-011 | 🔴 BLOCKED | Waiting on 010 |
| SIL-012 | ✅ DONE | `claude-md-updater.ts` + tests |

---

## Next Actions

1. **SIL-001** (Observatory) - Add improvement-tracker to existing observatory
2. **SIL-002** (Config) - Expand config.yaml with benchmark registry
3. **SIL-006** (Reasoner) - Thoughtbox-based improvement reasoning

These three unblock the critical path to SIL-010.

---

**See Also**:
- `.specs/self-improvement-loop/README.md` - Full spec index
- `dgm-specs/README.md` - Runtime infrastructure
- `dgm-specs/validation/baseline.json` - Current validation baseline
