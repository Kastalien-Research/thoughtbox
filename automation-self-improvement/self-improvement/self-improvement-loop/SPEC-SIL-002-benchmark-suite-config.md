# SPEC-SIL-002: Benchmark Suite Configuration

> **Status**: Draft
> **Priority**: HIGH
> **Week**: 1 (Foundation)
> **Phase**: Evaluation Infrastructure
> **Estimated Effort**: 3-4 hours

## Summary

Create the benchmark suite configuration (`benchmarks/suite.yaml`) that defines tiered evaluation gates, anchor point sampling parameters, and gaming prevention settings.

## Problem Statement

The improvement loop needs structured evaluation criteria:
- Which benchmarks to run at each tier
- Pass thresholds for each gate
- Sampling parameters for cost reduction
- Proctoring settings for gaming prevention

Without configuration:
- No consistent evaluation criteria
- Can't tune cost vs. thoroughness tradeoff
- Gaming prevention settings scattered

## Scope

### In Scope
- Create `benchmarks/suite.yaml` configuration file
- Define tier structure (smoke → regression → real-world)
- Define anchor point sampling parameters
- Define proctoring settings
- Create TypeScript loader for configuration

### Out of Scope
- Actual benchmark implementation (later specs)
- Proctored execution environment (SPEC-SIL-007)
- Contamination detection logic (SPEC-SIL-009)

## Requirements

### R1: Tier Configuration
```yaml
tiers:
  - name: smoke-test
    cost_estimate: $0.10
    pass_threshold: 0.8
    evaluations: [behavioral-tests]
    timeout_minutes: 5

  - name: regression
    cost_estimate: $1.00
    pass_threshold: 0.9
    evaluations: [full-test-suite]
    timeout_minutes: 30

  - name: real-world
    cost_estimate: $10.00
    pass_threshold: 0.7
    evaluations: [swe-bench-sample]
    timeout_minutes: 60
```

### R2: Anchor Point Configuration
```yaml
anchor_points:
  sample_rate: 0.01          # 1% of full benchmark
  selection: stratified      # across difficulty levels
  rotation: monthly          # refresh held-out set
  validation_correlation: 0.9 # minimum r² with full benchmark
```

### R3: Proctoring Configuration
```yaml
proctoring:
  enabled: true
  sandbox: docker
  network: disabled
  memory_limit_mb: 512
  cpu_limit_percent: 50
  log_verification: true
  contamination_check: true
```

### R4: TypeScript Configuration Loader
```typescript
interface BenchmarkConfig {
  name: string;
  version: string;
  tiers: TierConfig[];
  anchor_points: AnchorPointConfig;
  proctoring: ProctoringConfig;
}

export function loadBenchmarkConfig(path: string): BenchmarkConfig;
```

## Technical Approach

### Configuration Schema

```yaml
# benchmarks/suite.yaml

name: thoughtbox-improvement
version: "1.0"

# Tiered evaluation - cheap gates first, early termination on failure
tiers:
  - name: smoke-test
    description: Fast sanity check using existing behavioral tests
    cost_estimate: $0.10
    pass_threshold: 0.8
    evaluations:
      - type: behavioral-tests
        path: scripts/agentic-test.ts
    timeout_minutes: 5
    required: true  # Must pass to continue

  - name: regression
    description: Full test suite verification
    cost_estimate: $1.00
    pass_threshold: 0.9
    evaluations:
      - type: test-suite
        command: npm test
    timeout_minutes: 30
    required: true

  - name: real-world
    description: SWE-bench verified subset
    cost_estimate: $10.00
    pass_threshold: 0.7
    evaluations:
      - type: swe-bench
        sample_size: anchor_points  # Use anchor point sampling
    timeout_minutes: 60
    required: false  # Informational for MVP

# Cost reduction via representative sampling
anchor_points:
  sample_rate: 0.01
  selection: stratified
  stratification_key: difficulty
  rotation_period: monthly
  validation:
    enabled: true
    correlation_threshold: 0.9
    validation_runs: 3

# Gaming prevention
proctoring:
  enabled: true
  sandbox:
    type: docker
    image: thoughtbox-sandbox:latest
    network_disabled: true
    readonly_root: true
  resource_limits:
    memory_mb: 512
    cpu_percent: 50
    timeout_seconds: 300
  verification:
    log_consistency: true
    timing_analysis: true
    output_fingerprinting: true
  contamination:
    check_enabled: true
    similarity_threshold: 0.95
    fast_solve_threshold: 0.1  # 10% of expected time = suspicious

# Target repositories for real-world issues
target_repos:
  - owner: langchain-ai
    repo: langchain
    labels: [bug]
  - owner: langchain-ai
    repo: langgraph
    labels: [bug]
  - owner: All-Hands-AI
    repo: OpenHands
    labels: [bug]
  - owner: Aider-AI
    repo: aider
    labels: [bug]
```

### TypeScript Loader

```typescript
// benchmarks/config-loader.ts

import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { z } from 'zod';

const TierSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  cost_estimate: z.string(),
  pass_threshold: z.number().min(0).max(1),
  evaluations: z.array(z.object({
    type: z.string(),
    path: z.string().optional(),
    command: z.string().optional(),
    sample_size: z.string().optional()
  })),
  timeout_minutes: z.number(),
  required: z.boolean().default(true)
});

const ConfigSchema = z.object({
  name: z.string(),
  version: z.string(),
  tiers: z.array(TierSchema),
  anchor_points: z.object({
    sample_rate: z.number(),
    selection: z.enum(['stratified', 'random']),
    stratification_key: z.string().optional(),
    rotation_period: z.enum(['weekly', 'monthly']),
    validation: z.object({
      enabled: z.boolean(),
      correlation_threshold: z.number(),
      validation_runs: z.number()
    })
  }),
  proctoring: z.object({
    enabled: z.boolean(),
    sandbox: z.object({
      type: z.string(),
      image: z.string(),
      network_disabled: z.boolean(),
      readonly_root: z.boolean()
    }),
    resource_limits: z.object({
      memory_mb: z.number(),
      cpu_percent: z.number(),
      timeout_seconds: z.number()
    }),
    verification: z.object({
      log_consistency: z.boolean(),
      timing_analysis: z.boolean(),
      output_fingerprinting: z.boolean()
    }),
    contamination: z.object({
      check_enabled: z.boolean(),
      similarity_threshold: z.number(),
      fast_solve_threshold: z.number()
    })
  }),
  target_repos: z.array(z.object({
    owner: z.string(),
    repo: z.string(),
    labels: z.array(z.string())
  }))
});

export type BenchmarkConfig = z.infer<typeof ConfigSchema>;

export function loadBenchmarkConfig(path: string = 'benchmarks/suite.yaml'): BenchmarkConfig {
  const content = readFileSync(path, 'utf-8');
  const raw = parse(content);
  return ConfigSchema.parse(raw);
}
```

## Files

### New Files
| File | Purpose |
|------|---------|
| `benchmarks/suite.yaml` | Main configuration |
| `benchmarks/config-loader.ts` | TypeScript loader |
| `benchmarks/config-loader.test.ts` | Unit tests |

### New Directory
| Directory | Purpose |
|-----------|---------|
| `benchmarks/` | Benchmark infrastructure |

## Acceptance Criteria

- [ ] `suite.yaml` created with all sections
- [ ] TypeScript loader parses and validates config
- [ ] Zod schema catches invalid configurations
- [ ] Default values work correctly
- [ ] Unit tests cover validation edge cases

## Gates

### Entry Gate
- None

### Exit Gate
- `loadBenchmarkConfig()` returns valid configuration
- Config values are accessible and typed

## Dependencies

- Zod for schema validation
- yaml package for parsing

## Blocked By

- None

## Blocks

- SPEC-SIL-003 (Anchor Point Sampler)
- SPEC-SIL-004 (Tiered Evaluator)
- SPEC-SIL-007 (Proctored Executor)

---

**Created**: 2026-01-19
**Source**: PLAN Week 1, Section 1.2
