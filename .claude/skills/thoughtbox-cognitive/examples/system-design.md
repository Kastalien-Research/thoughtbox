# Example: Architecture Decision Record

This example demonstrates using backward thinking and branching to make a major architectural decision with proper risk analysis.

## Scenario

The team needs to choose a database strategy for a new real-time analytics service. Requirements: 100K writes/second, complex aggregation queries, 99.9% uptime.

---

## Step 1: Pre-mortem the Decision

Start by identifying potential failure modes:

```javascript
mental_models({
  operation: "get_model",
  args: { model: "pre-mortem" }
})
```

```javascript
// Time travel to failure
thoughtbox({
  thought: "PRE-MORTEM: It's 1 year from now. The analytics service has failed. Imagining failure scenarios...",
  thoughtNumber: 1,
  totalThoughts: 20,
  nextThoughtNeeded: true
})
```

```javascript
// Generate failure stories
thoughtbox({
  thought: "Failure 1: Chose wrong database - couldn't handle 100K writes/sec at peak, system fell over on Black Friday",
  thoughtNumber: 2,
  totalThoughts: 20,
  nextThoughtNeeded: true
})
```

```javascript
thoughtbox({
  thought: "Failure 2: Aggregation queries too slow - took 30 minutes instead of 30 seconds, dashboards unusable",
  thoughtNumber: 3,
  totalThoughts: 20,
  nextThoughtNeeded: true
})
```

```javascript
thoughtbox({
  thought: "Failure 3: Scaling too expensive - AWS bill hit $500K/month, project cancelled for cost overrun",
  thoughtNumber: 4,
  totalThoughts: 20,
  nextThoughtNeeded: true
})
```

```javascript
thoughtbox({
  thought: "Failure 4: Team couldn't operate it - too complex, incidents took hours to resolve, on-call burned out",
  thoughtNumber: 5,
  totalThoughts: 20,
  nextThoughtNeeded: true
})
```

---

## Step 2: Backward Thinking from Success

Define success state and work backward:

```javascript
thoughtbox({
  thought: "SUCCESS STATE: Analytics service handles 100K writes/sec, queries return in <30s, 99.9% uptime, team can operate it confidently, costs under $100K/month",
  thoughtNumber: 6,
  totalThoughts: 20,
  nextThoughtNeeded: true
})
```

```javascript
thoughtbox({
  thought: "REQUIRES: Proven horizontal scaling, pre-built aggregation capabilities, managed service for operational simplicity, predictable pricing",
  thoughtNumber: 7,
  totalThoughts: 20,
  nextThoughtNeeded: true
})
```

```javascript
thoughtbox({
  thought: "REQUIRES: Team training complete, runbooks written, dashboards for system health, automated failover",
  thoughtNumber: 8,
  totalThoughts: 20,
  nextThoughtNeeded: true
})
```

```javascript
thoughtbox({
  thought: "REQUIRES: Load testing validated 150K writes/sec (1.5x buffer), aggregation queries benchmarked, chaos testing passed",
  thoughtNumber: 9,
  totalThoughts: 20,
  nextThoughtNeeded: true
})
```

---

## Step 3: Branch for Database Options

Explore each option as a separate branch:

```javascript
// Branch A: TimescaleDB
thoughtbox({
  thought: "OPTION A - TimescaleDB: PostgreSQL extension for time-series. Pros: SQL familiarity, continuous aggregates, compression. Cons: Self-managed complexity, scaling requires expertise.",
  thoughtNumber: 10,
  totalThoughts: 20,
  branchFromThought: 9,
  branchId: "timescaledb",
  nextThoughtNeeded: true
})
```

```javascript
thoughtbox({
  thought: "TimescaleDB deep dive: Can handle 100K writes with proper partitioning. Continuous aggregates solve query speed. But team has no Postgres ops experience - failure mode 4 risk.",
  thoughtNumber: 11,
  totalThoughts: 20,
  branchFromThought: 9,
  branchId: "timescaledb",
  nextThoughtNeeded: true
})
```

```javascript
// Branch B: ClickHouse
thoughtbox({
  thought: "OPTION B - ClickHouse: Column-oriented OLAP database. Pros: Blazing fast aggregations, excellent compression, handles 1M writes/sec. Cons: Limited cloud offerings, complex replication.",
  thoughtNumber: 10,
  totalThoughts: 20,
  branchFromThought: 9,
  branchId: "clickhouse",
  nextThoughtNeeded: true
})
```

```javascript
thoughtbox({
  thought: "ClickHouse deep dive: ClickHouse Cloud now available (managed). Materialized views for real-time aggregates. But: learning curve is steep, failure mode 4 risk still present.",
  thoughtNumber: 11,
  totalThoughts: 20,
  branchFromThought: 9,
  branchId: "clickhouse",
  nextThoughtNeeded: true
})
```

```javascript
// Branch C: AWS Timestream
thoughtbox({
  thought: "OPTION C - AWS Timestream: Fully managed time-series. Pros: Serverless, auto-scaling, pay-per-query. Cons: AWS lock-in, limited query flexibility, newer service.",
  thoughtNumber: 10,
  totalThoughts: 20,
  branchFromThought: 9,
  branchId: "timestream",
  nextThoughtNeeded: true
})
```

```javascript
thoughtbox({
  thought: "Timestream deep dive: Addresses failure mode 4 (managed). But query language is limited - may not support complex aggregations needed. Pricing unpredictable at 100K writes/sec.",
  thoughtNumber: 11,
  totalThoughts: 20,
  branchFromThought: 9,
  branchId: "timestream",
  nextThoughtNeeded: true
})
```

---

## Step 4: Create Comparison Notebook

Validate assumptions with benchmarks:

```javascript
notebook({
  operation: "create",
  args: {
    title: "Database Comparison Analysis",
    language: "typescript"
  }
})
```

```javascript
notebook({
  operation: "add_cell",
  args: {
    notebookId: "...",
    cellType: "markdown",
    content: `# Database Comparison for Analytics Service

## Requirements
- 100K writes/second sustained
- Complex aggregation queries <30 seconds
- 99.9% uptime
- Team operability
- Cost under $100K/month

## Options Under Consideration
1. TimescaleDB (self-managed on EC2)
2. ClickHouse Cloud (managed)
3. AWS Timestream (serverless)`
  }
})
```

```javascript
notebook({
  operation: "add_cell",
  args: {
    notebookId: "...",
    cellType: "code",
    content: `// Cost estimation model
interface DatabaseOption {
  name: string;
  monthlyBase: number;
  perWriteCost: number;  // Cost per 1K writes
  perQueryCost: number;  // Cost per query
  estimatedMonthlyCost: number;
}

function estimateCost(
  writesPerSecond: number,
  queriesPerDay: number
): (option: DatabaseOption) => number {
  const secondsPerMonth = 30 * 24 * 60 * 60;
  const totalWrites = writesPerSecond * secondsPerMonth;
  const totalQueries = queriesPerDay * 30;

  return (option) => {
    return option.monthlyBase +
           (totalWrites / 1000) * option.perWriteCost +
           totalQueries * option.perQueryCost;
  };
}

const options: DatabaseOption[] = [
  {
    name: "TimescaleDB (3x r6g.2xlarge)",
    monthlyBase: 3 * 400,  // $400/instance
    perWriteCost: 0,       // No per-write cost
    perQueryCost: 0,
    estimatedMonthlyCost: 0
  },
  {
    name: "ClickHouse Cloud",
    monthlyBase: 2000,
    perWriteCost: 0.0001,
    perQueryCost: 0.005,
    estimatedMonthlyCost: 0
  },
  {
    name: "AWS Timestream",
    monthlyBase: 0,
    perWriteCost: 0.50,    // $0.50 per million writes
    perQueryCost: 0.01,
    estimatedMonthlyCost: 0
  }
];

const calculate = estimateCost(100000, 10000);

options.forEach(opt => {
  opt.estimatedMonthlyCost = calculate(opt);
  console.log(\`\${opt.name}: $\${opt.estimatedMonthlyCost.toLocaleString()}/month\`);
});`,
    filename: "cost-analysis.ts"
  }
})
```

```javascript
// Run cost analysis
notebook({
  operation: "run_cell",
  args: { notebookId: "...", cellId: "..." }
})
// Output:
// TimescaleDB (3x r6g.2xlarge): $1,200/month
// ClickHouse Cloud: $28,920/month
// AWS Timestream: $132,300/month
```

---

## Step 5: Apply Inversion

Use inversion to identify what to avoid:

```javascript
mental_models({
  operation: "get_model",
  args: { model: "inversion" }
})
```

```javascript
thoughtbox({
  thought: "INVERSION: How to guarantee failure? 1) Choose based on features alone, ignore ops. 2) Skip load testing. 3) Ignore team skills. 4) Choose cheapest without considering hidden costs.",
  thoughtNumber: 12,
  totalThoughts: 20,
  nextThoughtNeeded: true
})
```

```javascript
thoughtbox({
  thought: "INVERTED: Must do: 1) Heavily weight operational complexity. 2) Load test before deciding. 3) Factor in team training time. 4) Model total cost including ops overhead.",
  thoughtNumber: 13,
  totalThoughts: 20,
  nextThoughtNeeded: true
})
```

---

## Step 6: Apply Trade-off Matrix

```javascript
mental_models({
  operation: "get_model",
  args: { model: "trade-off-matrix" }
})
```

```javascript
// Document in notebook
notebook({
  operation: "add_cell",
  args: {
    notebookId: "...",
    cellType: "code",
    content: `// Trade-off Matrix
interface Score {
  database: string;
  performance: number;    // 0-100
  operability: number;    // 0-100
  cost: number;           // 0-100
  teamFit: number;        // 0-100
  weighted: number;
}

// Weights based on pre-mortem failure analysis
const weights = {
  performance: 0.30,    // Must meet requirements
  operability: 0.30,    // Failure mode 4 was major risk
  cost: 0.20,           // Under budget
  teamFit: 0.20         // Team can learn and operate
};

const scores: Score[] = [
  {
    database: "TimescaleDB",
    performance: 85,    // Meets requirements with tuning
    operability: 50,    // Self-managed, complex
    cost: 95,           // Cheapest
    teamFit: 70,        // SQL familiar
    weighted: 0
  },
  {
    database: "ClickHouse Cloud",
    performance: 98,    // Exceeds requirements
    operability: 75,    // Managed, but complex queries
    cost: 70,           // Mid-range
    teamFit: 40,        // New query language
    weighted: 0
  },
  {
    database: "AWS Timestream",
    performance: 75,    // Limited query flexibility
    operability: 95,    // Fully managed
    cost: 30,           // Most expensive
    teamFit: 80,        // AWS familiar
    weighted: 0
  }
];

scores.forEach(s => {
  s.weighted = s.performance * weights.performance +
               s.operability * weights.operability +
               s.cost * weights.cost +
               s.teamFit * weights.teamFit;
});

scores.sort((a, b) => b.weighted - a.weighted);

console.log("\\nTrade-off Matrix Results:");
scores.forEach((s, i) => {
  console.log(\`\${i + 1}. \${s.database}: \${s.weighted.toFixed(1)}\`);
  console.log(\`   Performance: \${s.performance}, Operability: \${s.operability}\`);
  console.log(\`   Cost: \${s.cost}, Team Fit: \${s.teamFit}\`);
});`,
    filename: "tradeoff-matrix.ts"
  }
})
```

---

## Step 7: Synthesize Decision

```javascript
thoughtbox({
  thought: "SYNTHESIS: Trade-off matrix shows TimescaleDB (74.5) and ClickHouse Cloud (72.8) are close. But TimescaleDB wins on cost and familiar SQL. Risk: ops complexity.",
  thoughtNumber: 14,
  totalThoughts: 20,
  nextThoughtNeeded: true
})
```

```javascript
thoughtbox({
  thought: "MITIGATION: Use Timescale Cloud (managed version) to address ops risk. Slightly higher cost but eliminates failure mode 4. Re-score: operability 80, cost 85, weighted: 79.0",
  thoughtNumber: 15,
  totalThoughts: 20,
  nextThoughtNeeded: true
})
```

```javascript
thoughtbox({
  thought: "DECISION: Timescale Cloud. Rationale: Best balance of performance, cost, and operability. SQL familiarity reduces training. Continuous aggregates solve query speed.",
  thoughtNumber: 16,
  totalThoughts: 20,
  nextThoughtNeeded: true
})
```

---

## Step 8: Document ADR

```javascript
notebook({
  operation: "add_cell",
  args: {
    notebookId: "...",
    cellType: "markdown",
    content: `# ADR: Database Selection for Analytics Service

## Status
**Accepted**

## Context
Building real-time analytics service with requirements:
- 100K writes/second
- Complex aggregations in <30 seconds
- 99.9% uptime
- Operable by current team
- Budget: <$100K/month

## Decision
**Use Timescale Cloud (managed TimescaleDB)**

## Options Considered
1. **TimescaleDB (self-managed)** - Rejected: ops complexity too high
2. **ClickHouse Cloud** - Rejected: steep learning curve, unfamiliar query language
3. **AWS Timestream** - Rejected: cost ($132K/month), limited query flexibility
4. **Timescale Cloud** - Selected: best balance of factors

## Consequences

### Positive
- SQL familiarity reduces training time
- Continuous aggregates solve query performance
- Managed service addresses operational concerns
- Cost-effective (~$3K/month estimated)

### Negative
- Vendor lock-in to Timescale
- Less raw performance than ClickHouse
- Need to design proper partitioning strategy

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Scaling limits | Load test to 150K writes/sec before launch |
| Query performance | Use continuous aggregates, pre-defined dashboards |
| Vendor issues | Keep schema portable, document migration path |

## Validation Plan
1. Proof of concept with production-like load
2. Benchmark aggregation queries
3. Chaos testing (network partition, node failure)
4. Team training and runbook development`
  }
})
```

```javascript
// Export ADR
notebook({
  operation: "export",
  args: {
    notebookId: "...",
    path: "./docs/adr/001-database-selection.src.md"
  }
})
```

---

## Summary

This example demonstrated:

1. **Pre-mortem**: Identified failure modes before choosing
2. **Backward Thinking**: Defined success and worked back to requirements
3. **Branching**: Explored each option independently
4. **Notebook Validation**: Quantitative cost analysis
5. **Inversion**: Identified what to avoid
6. **Trade-off Matrix**: Structured decision framework
7. **ADR Documentation**: Captured decision for future reference

Key insight: The pre-mortem revealed "operational complexity" as a major risk, which shifted the decision from cheapest (self-managed) to manageable (Timescale Cloud).
