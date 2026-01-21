# DGM Integration Specifications

This directory contains specifications for integrating Darwin Gödel Machine (DGM) self-improvement capabilities into Letta Code + Thoughtbox.

## Quick Start

1. **Read**: [Inventory](./inventory.md) - Overview of all specs
2. **Understand**: [Dependency Graph](./inventory.md#dependency-graph) - Implementation order
3. **Begin**: [SPEC-DGM-001](./SPEC-DGM-001-mcp-client-local-mode.md) - First spec to implement

## Implementation Defaults & Decisions (2026-01-15)

- **DGM state location**: `.dgm/` lives inside the project being modified (the codebase the DGM loop edits), not in Letta Code. Letta Code should only keep a small config pointer to the active project’s `.dgm/` root.
- **Transport default**: Use HTTP/streamable HTTP as the primary MCP transport (matches production, works in Docker). STDIO is optional as a fallback adapter only if needed for in-process/local dev.
- **Docker entry**: Expose `/mcp` (streamable HTTP) and `/health`; provide env toggles for transport/logging; mount/volume `.dgm/` so archives survive rebuilds; clear CMD/ENTRYPOINT to start the server.
- **CI/CD gates**: Before accepting a DGM variant, gate on `lint + tests + dgm-validate` (archive consistency, metrics compute). For archive branches/tags, regenerate `ARCHIVE.md` and validate `.dgm/archive.json` schema. Optional: build image and run health check for Thoughtbox in the pipeline.

## What is This?

This spec suite documents the **end-state architecture** after implementing a self-improving agent system where:

- **Letta Code agent** can modify its own codebase
- **Thoughtbox** can modify its own codebase
- **Reflection sessions** identify improvement opportunities
- **DGM loop** implements, tests, and validates improvements
- **Git archive** tracks all variants and their performance
- **CI/CD** provides safety guarantees

## Architecture Vision

```
┌─────────────────────────────────────────────────────────┐
│              DGM Self-Improvement System                 │
│                                                          │
│  ┌──────────────┐  MCP    ┌──────────────┐            │
│  │ Letta Code   │◄────────►│ Thoughtbox   │            │
│  │              │ Sampling │  (Docker)    │            │
│  └──────┬───────┘          └──────┬───────┘            │
│         │                         │                     │
│         │    ┌────────────────────┘                     │
│         │    │                                          │
│         ▼    ▼                                          │
│  ┌──────────────────────────────┐                      │
│  │  Reflection Session          │                      │
│  │  - Analyze traces            │                      │
│  │  - Identify gaps             │                      │
│  │  - Propose improvements      │                      │
│  └──────────┬───────────────────┘                      │
│             │                                           │
│             ▼                                           │
│  ┌──────────────────────────────┐                      │
│  │  DGM Improvement Loop        │                      │
│  │  1. Select parent (archive)  │                      │
│  │  2. Implement modification   │                      │
│  │  3. Generate tests           │                      │
│  │  4. Validate                 │                      │
│  │  5. Accept or reject         │                      │
│  └──────────┬───────────────────┘                      │
│             │                                           │
│             ▼                                           │
│  ┌──────────────────────────────┐                      │
│  │  Git Archive                 │                      │
│  │  - Variants as branches      │                      │
│  │  - Performance metrics       │                      │
│  │  - Lineage tracking          │                      │
│  └──────────────────────────────┘                      │
│                                                         │
│  Safety Layer: CI/CD + Version Control                 │
└─────────────────────────────────────────────────────────┘
```

## Key Concepts

### Darwin Gödel Machine (DGM)

A self-improving system that:
1. **Maintains an archive** of code variants (Git branches)
2. **Selects parents** based on performance + novelty
3. **Self-modifies** by editing its own code
4. **Validates empirically** via tests and benchmarks
5. **Accepts or rejects** based on results
6. **Iterates continuously** to evolve capabilities

Inspired by [Sakana AI's Darwin Gödel Machine paper](https://arxiv.org/pdf/2505.22954).

### Reflection-Driven Evolution

Unlike traditional DGM (continuous iteration), this system uses:
- **Reflection sessions**: Dedicated time for meta-analysis
- **Pattern identification**: Learn from actual task history
- **Thoughtbox meta-reasoning**: Use reasoning tools to reason about reasoning
- **Deliberate improvement**: Targeted capability additions

### Co-Evolving Benchmarks

No fixed benchmark like SWE-bench. Instead:
- **Metrics discovered** based on usage patterns
- **Weights adjusted** as priorities change
- **New metrics added** as capabilities emerge
- **Natural selection**: What matters emerges from real use

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- ✅ MCP client with STDIO/HTTP transports
- ✅ Git-based archive system
- ✅ Test generator skill

### Phase 2: Integration (Week 3-4)
- ✅ Bidirectional sampling (Thoughtbox ↔ Letta)
- ✅ Reflection session framework
- ✅ Co-evolving metrics

### Phase 3: DGM Loop (Week 5-6)
- ✅ Complete improvement loop
- ✅ Validation and acceptance logic

### Phase 4: Safety (Week 7-8)
- ✅ CI/CD workflows
- ✅ Docker automation
- ✅ Monitoring and rollback

**Total**: ~8 weeks for complete implementation

---

## File Organization

```
.specs/dgm-integration/
├── README.md                    # This file
├── inventory.md                 # Spec list and dependencies
├── SPEC-DGM-001-*.md           # Individual specifications
├── SPEC-DGM-002-*.md
├── ...
└── SPEC-DGM-009-*.md

Implementation will create:
letta-code-thoughtbox/src/
├── mcp-client/                 # SPEC-DGM-001
├── dgm/                        # SPEC-DGM-002, DGM-006
├── reflection/                 # SPEC-DGM-003
└── metrics/                    # SPEC-DGM-004

.dgm/                          # Archive data (SPEC-DGM-002)
├── archive.json
├── metrics/
└── config.json

.github/workflows/             # SPEC-DGM-008
├── dgm-validation.yml
└── dgm-monitor.yml
```

---

## Questions?

- **What is DGM?** See [inventory.md](./inventory.md#overview)
- **Where to start?** Begin with [SPEC-DGM-001](./SPEC-DGM-001-mcp-client-local-mode.md)
- **Implementation order?** Follow [dependency graph](./inventory.md#dependency-graph)
- **How long?** Estimated 8 weeks (see [roadmap](./inventory.md#implementation-sequence))

---

## Related Documents

- [DGM Paper (Sakana AI)](https://arxiv.org/pdf/2505.22954)
- [MCP Specification](../../ai_docs/mcp-docs-20251125/)
- [Letta Docs](../../ai_docs/letta-docs/)
- [Thoughtbox Architecture](../../thoughtbox/README.md)
- [Alignment Roadmap](../../ALIGNMENT-ROADMAP.md)

---

**Generated by**: `/spec-designer` workflow  
**Date**: 2026-01-15  
**Session**: dgm-integration-2026-01-15
