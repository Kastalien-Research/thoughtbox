# DGM Specs - Thoughtbox Self-Improvement Infrastructure

This directory contains the **operational infrastructure** for Darwin Gödel Machine (DGM) self-improvement of Thoughtbox.

> **Note**: The SIL specs (Self-Improvement Loop) are in `.specs/self-improvement-loop/`. This folder contains the runtime infrastructure those specs depend on.

## Structure

```
dgm-specs/
├── README.md              # This file
├── config.yaml            # Runtime configuration
├── harness/               # Benchmark execution harness
│   ├── benchmark-runner.ts
│   ├── baseline.ts
│   ├── cli.ts
│   └── types.ts
├── validation/            # Validation run results
│   └── baseline.json      # Current baseline metrics
├── history/               # Historical run data
│   └── runs/              # Individual run JSONs
├── hypotheses/            # Improvement hypotheses
│   ├── active/
│   └── tested/
├── targets/               # Benchmark targets
├── benchmarks/            # Benchmark registry
│   └── registry.yaml
└── archive/               # Archived specs (not active)
    └── letta-integration-2026-01/  # Future Letta integration (deferred)
```

## Relationship to SIL Specs

| This Folder (dgm-specs/) | SIL Specs (.specs/self-improvement-loop/) |
|--------------------------|-------------------------------------------|
| Runtime infrastructure | Specification documents |
| Benchmark harness code | SIL-100: Benchmark Harness spec |
| Validation results | SIL-000: Feedback Loop Validation |
| Config files | SIL-002: Benchmark Suite Config |

## Quick Start

```bash
# Run benchmarks
npx ts-node dgm-specs/harness/cli.ts run

# Check validation baseline
cat dgm-specs/validation/baseline.json
```

## Archive

The `archive/letta-integration-2026-01/` folder contains specs for future Letta Code integration work. This is deferred - current focus is Thoughtbox-only self-improvement.

---

**See Also**: `.specs/self-improvement-loop/README.md` for the full SIL spec suite.
