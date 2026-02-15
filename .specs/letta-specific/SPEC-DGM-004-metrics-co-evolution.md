# SPEC-DGM-004: Co-Evolving Performance Metrics System

**Status**: Draft  
**Priority**: P2 - Essential for DGM Scoring  
**Complexity**: High  
**Dependencies**: SPEC-DGM-002 (Archive)  
**Target Codebase**: `letta-code-thoughtbox/`

## Overview

Implement an open-ended, co-evolving metrics system where performance benchmarks adapt based on actual usage patterns rather than fixed criteria. Metrics are discovered, weighted, and evolved alongside the agent's capabilities, mirroring natural selection rather than artificial benchmarks.

## Motivation

**Fixed Benchmarks Problem**: Traditional benchmarks like SWE-bench are:
- Static and eventually gamed/overfit
- May not reflect real-world usage
- Can't capture emergent capabilities
- Require manual curation

**Natural Evolution Principle**: "There's no formal benchmark that the Antelope has to pass so the lion kills it." Performance emerges from:
- Actual task success/failure patterns
- User satisfaction indicators
- System health metrics
- Emergent capability utilization

**Co-Evolution**: As the agent develops new capabilities, metrics evolve to measure those capabilities' effectiveness.

## Requirements

### Functional Requirements

#### FR-001: Metric Definition Schema
**Priority**: MUST  
**Description**: Flexible schema for defining, weighting, and evolving metrics

**Schema**:
```typescript
interface Metric {
  // Identity
  id: string;                    // "task-success-rate"
  version: number;               // Metric can evolve
  name: string;
  description: string;
  
  // Evaluation
  evaluator: MetricEvaluator;    // How to compute this metric
  direction: 'maximize' | 'minimize' | 'optimize';
  targetRange?: [number, number]; // For 'optimize' direction
  
  // Weighting
  weight: number;                // 0.0 - 1.0, sum to 1.0 across all metrics
  enabled: boolean;
  
  // Data sources
  sources: ('thoughtbox' | 'letta-cloud' | 'local-logs' | 'user-feedback')[];
  query: string | QueryFunction;
  
  // Lifecycle
  addedAt: string;               // When this metric was introduced
  addedBy: 'initial' | 'agent' | 'user';
  lastEvaluated?: string;
  
  // Meta
  correlations?: Record<string, number>;  // Correlation with other metrics
  stability: number;             // How stable this metric is (low = noisy)
}

type MetricEvaluator = (variant: ArchiveVariant, context: EvaluationContext) => Promise<number>;
```

---

#### FR-002: Initial Metric Set
**Priority**: MUST  
**Description**: Bootstrap with foundational metrics based on discussion

**Initial Metrics**:

**1. Task Success Rate**:
```typescript
{
  id: "task-success-rate",
  name: "Task Completion Success Rate",
  description: "Percentage of user tasks completed successfully",
  evaluator: async (variant, ctx) => {
    const tasks = await loadTasks(variant, ctx.timeRange);
    const successful = tasks.filter(t => t.result === 'success').length;
    return successful / tasks.length;
  },
  direction: "maximize",
  weight: 0.40,
  sources: ["local-logs"],
  enabled: true
}
```

**2. Reasoning Depth** (from Thoughtbox):
```typescript
{
  id: "reasoning-depth",
  name: "Thoughtbox Reasoning Quality",
  description: "Quality and depth of reasoning chains",
  evaluator: async (variant, ctx) => {
    const sessions = await ctx.thoughtbox.call('session', 'list');
    const analyses = await Promise.all(
      sessions.map(s => ctx.thoughtbox.call('session', 'analyze', { sessionId: s }))
    );
    
    // Average reasoning quality score
    return analyses.reduce((sum, a) => sum + a.qualityScore, 0) / analyses.length;
  },
  direction: "optimize",
  targetRange: [0.7, 0.9],  // Too shallow or too deep both bad
  weight: 0.20,
  sources: ["thoughtbox"],
  enabled: true
}
```

**3. Context Efficiency**:
```typescript
{
  id: "context-efficiency",
  name: "Context Window Usage Efficiency",
  description: "How efficiently the agent uses available context",
  evaluator: async (variant, ctx) => {
    const metrics = await ctx.lettaCloud?.getMetrics('context_usage');
    return 1.0 - (metrics.avgTokensUsed / metrics.maxTokens);
  },
  direction: "maximize",
  weight: 0.15,
  sources: ["letta-cloud", "local-logs"],
  enabled: true
}
```

**4. Tool Call Efficiency**:
```typescript
{
  id: "tool-call-efficiency",
  name: "Tool Call Success Rate",
  description: "Successful tool calls / total tool calls",
  evaluator: async (variant, ctx) => {
    const logs = await loadToolLogs(variant);
    const successful = logs.filter(l => !l.error).length;
    return successful / logs.length;
  },
  direction: "maximize",
  weight: 0.15,
  sources: ["local-logs"],
  enabled: true
}
```

**5. User Satisfaction** (placeholder):
```typescript
{
  id: "user-satisfaction",
  name: "User Satisfaction Score",
  description: "User thumbs up/down ratings",
  evaluator: async (variant, ctx) => {
    // Not implemented yet, returns neutral score
    return 0.5;
  },
  direction: "maximize",
  weight: 0.10,
  sources: ["user-feedback"],
  enabled: false  // Disabled until feedback system exists
}
```

---

#### FR-003: Composite Performance Score
**Priority**: MUST  
**Description**: Compute single performance score from multiple metrics

**Algorithm**:
```typescript
async function computePerformance(
  variant: ArchiveVariant,
  metrics: Metric[]
): Promise<number> {
  const enabledMetrics = metrics.filter(m => m.enabled);
  
  // Evaluate each metric
  const evaluations = await Promise.all(
    enabledMetrics.map(async (metric) => {
      const rawScore = await metric.evaluator(variant, evaluationContext);
      
      // Normalize based on direction
      let normalized: number;
      if (metric.direction === 'maximize') {
        normalized = rawScore;  // Already 0-1
      } else if (metric.direction === 'minimize') {
        normalized = 1.0 - rawScore;
      } else { // optimize
        const [min, max] = metric.targetRange!;
        if (rawScore < min) {
          normalized = rawScore / min;  // Penalty for too low
        } else if (rawScore > max) {
          normalized = 1.0 - ((rawScore - max) / (1.0 - max));  // Penalty for too high
        } else {
          normalized = 1.0;  // Perfect
        }
      }
      
      return { metric: metric.id, score: normalized, weight: metric.weight };
    })
  );
  
  // Weighted sum
  const totalWeight = evaluations.reduce((sum, e) => sum + e.weight, 0);
  const weightedScore = evaluations.reduce((sum, e) => sum + e.score * e.weight, 0);
  
  return weightedScore / totalWeight;
}
```

**Acceptance Criteria**:
- [ ] All enabled metrics evaluated
- [ ] Weights sum to 1.0 (validation)
- [ ] Direction handled correctly (maximize/minimize/optimize)
- [ ] Score between 0.0 and 1.0
- [ ] Failed metric evaluation doesn't crash (use fallback)
- [ ] Individual metric scores persisted for analysis

---

#### FR-004: Metric Discovery
**Priority**: SHOULD  
**Description**: Agent can discover new metrics during reflection

**Discovery Process**:
```typescript
async function discoverMetrics(reflectionData: ReflectionData): Promise<Metric[]> {
  const discovered = [];
  
  // Analyze failure patterns
  const failurePatterns = analyzeFailures(reflectionData.taskHistory.failures);
  
  // Example: High rate of "context overflow" errors
  if (failurePatterns.contextOverflow > 0.2) {
    discovered.push({
      id: "context-overflow-rate",
      name: "Context Overflow Frequency",
      description: "Frequency of hitting context limits",
      evaluator: async (variant, ctx) => {
        const errors = await loadErrors(variant);
        const overflows = errors.filter(e => e.type === 'context_overflow');
        return overflows.length / errors.length;
      },
      direction: "minimize",
      weight: 0.15,  // Proposed weight
      sources: ["local-logs"],
      addedAt: new Date().toISOString(),
      addedBy: "agent",
      enabled: false  // Requires user approval to enable
    });
  }
  
  return discovered;
}
```

**Acceptance Criteria**:
- [ ] Agent analyzes data for performance patterns
- [ ] New metrics proposed with justification
- [ ] User approval required to add metric
- [ ] Metric weights re-normalized when new metric added
- [ ] Discovery logged in reflection session

---

#### FR-005: Metric Evolution
**Priority**: SHOULD  
**Description**: Existing metrics can evolve (change evaluator, weight, direction)

**Evolution Triggers**:
1. Metric becomes redundant (high correlation with another)
2. Metric is noisy (low stability)
3. Metric no longer discriminates (all variants score similarly)
4. Better evaluator discovered

**Example**:
```typescript
// Original metric
{
  id: "task-success-rate-v1",
  evaluator: (variant) => successCount / totalCount,
  weight: 0.4
}

// Evolved metric (distinguishes types of success)
{
  id: "task-success-rate-v2",
  evaluator: (variant) => {
    const simpleSuccess = simpleTaskSuccesses / simpleTasks;
    const complexSuccess = complexTaskSuccesses / complexTasks;
    return 0.3 * simpleSuccess + 0.7 * complexSuccess;  // Weight complex higher
  },
  weight: 0.4,
  supersedes: "task-success-rate-v1"
}
```

**Acceptance Criteria**:
- [ ] Metric versioning tracked
- [ ] Old version disabled when new version added
- [ ] Historical scores comparable (conversion function)
- [ ] Evolution justification documented
- [ ] User approval for major changes

---

#### FR-006: Hybrid Storage (per user choice 2C)
**Priority**: MUST  
**Description**: Metrics stored locally with optional cloud sync

**Storage Architecture**:
```
Local (Primary):
.dgm/metrics/
  ├── gen-1-variant-a.json     # Detailed metrics per variant
  │   {
  │     "variantId": "gen-1-variant-a",
  │     "evaluatedAt": "2026-01-15T10:00:00Z",
  │     "composite": 0.75,
  │     "individual": {
  │       "task-success-rate": 0.80,
  │       "reasoning-depth": 0.72,
  │       "context-efficiency": 0.68,
  │       "tool-call-efficiency": 0.85
  │     },
  │     "rawData": { /* source data */ }
  │   }
  └── aggregates.json          # Summary statistics

Cloud Sync (Optional):
→ POST to Letta Cloud API (if configured)
→ Enables cross-machine analysis
→ Powers dashboard/analytics
```

**Sync Strategy**:
```typescript
class MetricsManager {
  async recordMetrics(variant: ArchiveVariant, scores: MetricScores) {
    // 1. Write to local cache immediately
    await this.local.write(`metrics/${variant.id}.json`, scores);
    
    // 2. Sync to cloud (async, non-blocking)
    if (this.config.cloudSync.enabled) {
      this.cloudSync.enqueue({
        variantId: variant.id,
        metrics: scores,
        timestamp: new Date()
      });
    }
  }
  
  async queryMetrics(query: MetricsQuery): Promise<MetricScores[]> {
    // Try cloud first (if available), fallback to local
    if (this.config.cloudSync.enabled) {
      try {
        return await this.cloud.query(query);
      } catch {
        // Fallback to local
      }
    }
    
    return await this.local.query(query);
  }
}
```

**Acceptance Criteria**:
- [ ] Metrics always saved locally (never lost)
- [ ] Cloud sync is best-effort (failures don't block)
- [ ] Conflict resolution for cloud sync
- [ ] Can query local cache when offline
- [ ] Cloud provides richer analytics (if available)

---

### Non-Functional Requirements

#### NFR-001: Performance
- Metric evaluation: <10s for full suite
- Composite score computation: <1s
- Local cache queries: <100ms
- Cloud sync: async, non-blocking

#### NFR-002: Extensibility
- Easy to add new metrics (just add to config)
- Pluggable evaluators (custom functions)
- Metric dependencies (one metric can use another)
- Grouped metrics (e.g., "code-quality" group)

#### NFR-003: Reliability
- Missing data doesn't crash evaluation (use defaults)
- Transient failures don't affect scores (cache previous)
- Metric versioning for historical comparison

---

## Configuration

```json
// .dgm/metrics-config.json
{
  "version": "1.0",
  "metrics": [
    {
      "id": "task-success-rate",
      "enabled": true,
      "weight": 0.40,
      "direction": "maximize",
      "evaluator": {
        "type": "builtin",
        "name": "taskSuccessRate"
      },
      "sources": ["local-logs"],
      "cache": {
        "ttl": 3600,
        "staleWhileRevalidate": true
      }
    }
  ],
  "discovery": {
    "enabled": true,
    "requireApproval": true,
    "maxNewMetricsPerReflection": 2
  },
  "evolution": {
    "autoRetire": {
      "enabled": true,
      "ifCorrelation": 0.95,      // Retire if >95% correlated with another
      "ifStability": 0.3           // Retire if stability <0.3
    },
    "autoReweight": {
      "enabled": false,            // Manual reweighting for now
      "algorithm": "optimization"  // Could use optimization to find best weights
    }
  },
  "storage": {
    "local": {
      "path": ".dgm/metrics/",
      "retention": "forever"
    },
    "cloud": {
      "enabled": false,           // TODO: Enable when API available
      "endpoint": "https://api.letta.com/metrics",
      "syncInterval": 300,        // Every 5 minutes
      "apiKey": "${LETTA_API_KEY}"
    }
  }
}
```

---

#### FR-007: Metric Visualization
**Priority**: SHOULD  
**Description**: Display metrics and trends in CLI

**Commands**:
```bash
# Current metrics
letta /dgm metrics

# Output
📊 Current Performance Metrics
════════════════════════════════════════

Composite Score: 0.82 ⭐

Individual Metrics:
  task-success-rate (40%):     0.85 ↑ (+0.05 vs last week)
  reasoning-depth (20%):       0.78 → (stable)
  context-efficiency (15%):    0.84 ↑ (+0.12 vs last week)
  tool-call-efficiency (15%):  0.92 ↑ (+0.03 vs last week)
  user-satisfaction (10%):     N/A (disabled)

Trends (last 30 days):
  [ASCII graph showing composite score over time]
  
Best variant: gen-3-variant-a (0.85)
Current variant: gen-3-variant-b (0.82)

# Show metric history for a variant
letta /dgm metrics gen-2-variant-a

# Compare two variants
letta /dgm metrics compare gen-1-a gen-3-b
```

**Acceptance Criteria**:
- [ ] Current scores displayed
- [ ] Trends shown (up/down/stable)
- [ ] Historical comparison available
- [ ] Export to JSON/CSV for external analysis

---

#### FR-008: Benchmarking Tasks (Optional)
**Priority**: MAY  
**Description**: Curated benchmark tasks for consistent evaluation

**Structure**:
```
.dgm/benchmarks/
  ├── refactoring/
  │   ├── task-001-legacy-to-modern.json
  │   └── task-002-monolith-to-modules.json
  ├── debugging/
  │   └── task-001-null-pointer.json
  ├── architecture/
  │   └── task-001-scalability-decision.json
  └── synthesis/
      └── task-001-multi-source-integration.json

Each task:
{
  "id": "refactor-001",
  "description": "Refactor legacy callback code to async/await",
  "input": {
    "codebase": "path/to/fixture",
    "instruction": "..."
  },
  "evaluation": {
    "criteria": ["tests pass", "no regressions", "code quality improved"],
    "automated": true,
    "humanReview": false
  }
}
```

**Acceptance Criteria**:
- [ ] At least 5 benchmark tasks per category
- [ ] Tasks represent real usage patterns
- [ ] Automated evaluation where possible
- [ ] Tasks updated as agent evolves
- [ ] Can run variant against benchmark suite

---

### Non-Functional Requirements

#### NFR-001: Metric Stability
- Metrics should be reproducible (same input → same score)
- Stochastic metrics have confidence intervals
- Noise filtered (moving averages, outlier removal)

#### NFR-002: Privacy
- User data anonymized before cloud sync
- Sensitive info redacted from metric data
- Opt-out mechanism for cloud sync

#### NFR-003: Performance
- Metric evaluation parallelized
- Cached results reused (with TTL)
- Incremental updates (don't re-evaluate everything)

---

## Evolution Example

### Iteration 1: Initial Metrics
```json
{
  "metrics": [
    { "id": "task-success-rate", "weight": 0.60 },
    { "id": "tool-call-efficiency", "weight": 0.40 }
  ]
}
```

### Iteration 10: After Discovering Context Issues
```json
{
  "metrics": [
    { "id": "task-success-rate", "weight": 0.40 },  // Reduced weight
    { "id": "tool-call-efficiency", "weight": 0.30 }, // Reduced weight
    { "id": "context-efficiency", "weight": 0.30 }  // NEW - discovered
  ]
}
```

### Iteration 50: After User Feedback System Added
```json
{
  "metrics": [
    { "id": "task-success-rate", "weight": 0.30 },
    { "id": "context-efficiency", "weight": 0.20 },
    { "id": "tool-call-efficiency", "weight": 0.20 },
    { "id": "reasoning-depth", "weight": 0.15 },  // NEW
    { "id": "user-satisfaction", "weight": 0.15, "enabled": true }  // ACTIVATED
  ]
}
```

---

## Integration with Archive

```typescript
// After DGM improvement validated
async function acceptVariant(variant: ArchiveVariant) {
  // 1. Evaluate on all metrics
  const scores = await metricsManager.evaluate(variant);
  
  // 2. Compute composite
  const composite = await metricsManager.computeComposite(scores);
  
  // 3. Store in variant metadata
  variant.performance = composite;
  variant.metrics = scores.individual;
  
  // 4. Add to archive
  await archiveManager.add(variant);
  
  // 5. Persist metrics
  await metricsManager.record(variant, scores);
  
  // 6. Sync to cloud (async)
  metricsManager.syncToCloud(variant.id, scores);
}
```

---

## Testing Strategy

### Unit Tests
```typescript
test('computeComposite calculates weighted average', async () => {
  const metrics = [
    { id: 'm1', score: 0.8, weight: 0.5 },
    { id: 'm2', score: 0.6, weight: 0.5 }
  ];
  
  const composite = computeComposite(metrics);
  expect(composite).toBe(0.7);  // (0.8*0.5 + 0.6*0.5)
});

test('optimize direction penalizes out-of-range scores', () => {
  const metric = { direction: 'optimize', targetRange: [0.7, 0.9] };
  
  expect(normalize(0.5, metric)).toBeLessThan(1.0);  // Too low
  expect(normalize(0.8, metric)).toBe(1.0);          // Perfect
  expect(normalize(1.0, metric)).toBeLessThan(1.0);  // Too high
});
```

### Integration Tests
```typescript
test('Metrics evaluate against real variant', async () => {
  const variant = await archiveManager.load('gen-1-variant-a');
  
  const scores = await metricsManager.evaluate(variant);
  
  expect(scores.composite).toBeGreaterThan(0);
  expect(scores.individual['task-success-rate']).toBeDefined();
});
```

---

## Success Criteria

- [ ] Composite score computed for all variants
- [ ] Individual metric scores persisted
- [ ] Metrics configurable via JSON
- [ ] New metrics discoverable by agent
- [ ] Metric evolution tracked over time
- [ ] Local storage always works
- [ ] Cloud sync works when enabled
- [ ] Visualization in CLI
- [ ] Historical comparison available

---

## References

- [DGM Paper - Evaluation Strategy](https://arxiv.org/pdf/2505.22954) - Section 4.2
- [Open-Endedness Research](https://arxiv.org/abs/1905.10985) - Emergence of metrics

---

**Previous**: [SPEC-DGM-003: Reflection Sessions](./SPEC-DGM-003-reflection-session-system.md)  
**Next**: [SPEC-DGM-006: DGM Improvement Loop](./SPEC-DGM-006-dgm-improvement-loop.md)
