# Example: Complex Performance Analysis

This example demonstrates using all three Thoughtbox tools together to analyze and resolve a complex performance issue.

## Scenario

Users report that the checkout process is taking over 45 seconds. The target is under 10 seconds. We need to analyze, identify root causes, and propose solutions.

---

## Step 1: Ground with Mental Model

First, retrieve a relevant framework for root cause analysis:

```javascript
mental_models({
  operation: "get_model",
  args: { model: "five-whys" }
})
```

The five-whys model will guide our investigation from symptoms to root cause.

---

## Step 2: Begin Structured Analysis

Start a thoughtbox session with forward thinking:

```javascript
// Thought 1: Problem Statement
thoughtbox({
  thought: "Problem: Checkout process takes 45 seconds average, target is <10 seconds. Users abandon cart 60% of time. Revenue impact estimated at $50K/month.",
  thoughtNumber: 1,
  totalThoughts: 15,
  nextThoughtNeeded: true
})
```

```javascript
// Thought 2: Data Gathering
thoughtbox({
  thought: "Data: Analyzed 1000 checkout requests. Breakdown: Auth check 2s, Cart validation 3s, Inventory check 25s, Payment processing 10s, Order creation 5s. Inventory check is the bottleneck.",
  thoughtNumber: 2,
  totalThoughts: 15,
  nextThoughtNeeded: true
})
```

```javascript
// Thought 3: Apply Five Whys - Why 1
thoughtbox({
  thought: "WHY 1: Why does inventory check take 25s? → It makes 50 sequential database queries (one per cart item)",
  thoughtNumber: 3,
  totalThoughts: 15,
  nextThoughtNeeded: true
})
```

```javascript
// Thought 4: Apply Five Whys - Why 2
thoughtbox({
  thought: "WHY 2: Why 50 sequential queries? → Legacy code iterates items and checks each individually, no batching",
  thoughtNumber: 4,
  totalThoughts: 15,
  nextThoughtNeeded: true
})
```

```javascript
// Thought 5: Apply Five Whys - Why 3
thoughtbox({
  thought: "WHY 3: Why no batching? → Original implementation assumed 1-5 items per cart, never refactored when average grew to 50",
  thoughtNumber: 5,
  totalThoughts: 15,
  nextThoughtNeeded: true
})
```

---

## Step 3: Branch for Solution Exploration

Now explore multiple solution approaches:

```javascript
// Branch A: Query Optimization
thoughtbox({
  thought: "SOLUTION A - Batch Queries: Combine 50 queries into 1 batch query using IN clause. Estimated: 25s → 500ms. Implementation: 1 day.",
  thoughtNumber: 6,
  totalThoughts: 15,
  branchFromThought: 5,
  branchId: "batch-query",
  nextThoughtNeeded: true
})
```

```javascript
// Branch A: Deep dive
thoughtbox({
  thought: "SOLUTION A analysis: Low risk, addresses root cause directly, no new infrastructure. Need to ensure IN clause with 50 items doesn't hit query plan issues.",
  thoughtNumber: 7,
  totalThoughts: 15,
  branchFromThought: 5,
  branchId: "batch-query",
  nextThoughtNeeded: true
})
```

```javascript
// Branch B: Caching
thoughtbox({
  thought: "SOLUTION B - Redis Cache: Cache inventory levels with 1-min TTL. Estimated: 25s → 50ms for cache hits. Implementation: 3 days.",
  thoughtNumber: 6,
  totalThoughts: 15,
  branchFromThought: 5,
  branchId: "redis-cache",
  nextThoughtNeeded: true
})
```

```javascript
// Branch B: Deep dive
thoughtbox({
  thought: "SOLUTION B analysis: Higher impact but adds infrastructure complexity. Risk: stale inventory could cause overselling. Need cache invalidation on inventory changes.",
  thoughtNumber: 7,
  totalThoughts: 15,
  branchFromThought: 5,
  branchId: "redis-cache",
  nextThoughtNeeded: true
})
```

---

## Step 4: Create Validation Notebook

Validate our analysis with executable code:

```javascript
notebook({
  operation: "create",
  args: {
    title: "Checkout Performance Analysis",
    language: "typescript"
  }
})
```

```javascript
// Document the problem
notebook({
  operation: "add_cell",
  args: {
    notebookId: "...",
    cellType: "markdown",
    content: `# Checkout Performance Analysis

## Current State
- Average checkout: 45 seconds
- Target: <10 seconds
- Primary bottleneck: Inventory check (25s)

## Root Cause
Sequential database queries - one per cart item (average 50 items)`
  }
})
```

```javascript
// Simulate current approach
notebook({
  operation: "add_cell",
  args: {
    notebookId: "...",
    cellType: "code",
    content: `// Simulate sequential queries
async function currentApproach(cartItems: string[]): Promise<number> {
  const queryTime = 500; // 500ms per query (simulated)
  let total = 0;

  for (const item of cartItems) {
    await new Promise(r => setTimeout(r, queryTime));
    total += queryTime;
  }

  return total;
}

// Simulate batch query
async function batchApproach(cartItems: string[]): Promise<number> {
  const baseTime = 200;
  const perItemTime = 5;
  await new Promise(r => setTimeout(r, baseTime + cartItems.length * perItemTime));
  return baseTime + cartItems.length * perItemTime;
}

// Test with 50 items
const items = Array(50).fill('item');

console.log('Testing with', items.length, 'items:');
console.log('Sequential (estimated):', items.length * 500, 'ms');
console.log('Batch (estimated):', 200 + items.length * 5, 'ms');
console.log('Improvement factor:', (items.length * 500) / (200 + items.length * 5), 'x');`,
    filename: "performance-comparison.ts"
  }
})
```

```javascript
// Run validation
notebook({
  operation: "run_cell",
  args: { notebookId: "...", cellId: "..." }
})
// Output:
// Testing with 50 items:
// Sequential (estimated): 25000 ms
// Batch (estimated): 450 ms
// Improvement factor: 55.56x
```

---

## Step 5: Apply Trade-off Matrix

Use another mental model for decision-making:

```javascript
mental_models({
  operation: "get_model",
  args: { model: "trade-off-matrix" }
})
```

```javascript
// Apply the framework
thoughtbox({
  thought: "TRADE-OFF ANALYSIS: Criteria weighted: Speed (40%), Risk (30%), Effort (20%), Maintainability (10%). Batch query: 95*0.4 + 90*0.3 + 90*0.2 + 85*0.1 = 91.5. Cache: 100*0.4 + 70*0.3 + 60*0.2 + 70*0.1 = 80.0",
  thoughtNumber: 8,
  totalThoughts: 15,
  nextThoughtNeeded: true
})
```

---

## Step 6: Synthesize and Recommend

```javascript
thoughtbox({
  thought: "SYNTHESIS: Batch query approach wins on trade-off matrix. Recommend: Phase 1 - Implement batch queries (1 day, 55x improvement). Phase 2 - Add Redis cache for further optimization if needed.",
  thoughtNumber: 9,
  totalThoughts: 15,
  nextThoughtNeeded: true
})
```

```javascript
thoughtbox({
  thought: "IMPLEMENTATION PLAN: 1) Refactor checkInventory() to accept array, 2) Build batch SQL query with IN clause, 3) Add monitoring for query performance, 4) Deploy behind feature flag, 5) A/B test 10% traffic",
  thoughtNumber: 10,
  totalThoughts: 15,
  nextThoughtNeeded: true
})
```

```javascript
thoughtbox({
  thought: "FINAL RECOMMENDATION: Execute batch query refactor. Expected outcome: Checkout time drops from 45s to ~10s. Revenue recovery estimated at $40-50K/month. Low risk with feature flag rollout.",
  thoughtNumber: 11,
  totalThoughts: 15,
  nextThoughtNeeded: false
})
```

---

## Step 7: Document in Notebook

```javascript
notebook({
  operation: "add_cell",
  args: {
    notebookId: "...",
    cellType: "markdown",
    content: `## Recommendation

**Primary Solution**: Batch Query Refactor
- Implementation time: 1 day
- Expected improvement: 55x (25s → 450ms)
- Risk: Low (feature flag deployment)

**Future Enhancement**: Redis Cache
- Only if batch query insufficient
- Adds infrastructure complexity
- Requires cache invalidation logic

## Implementation Steps
1. Refactor \`checkInventory()\` to accept array
2. Build batch SQL: \`SELECT * FROM inventory WHERE sku IN (...)\`
3. Add query performance monitoring
4. Deploy behind feature flag
5. A/B test with 10% traffic
6. Full rollout after validation`
  }
})
```

```javascript
// Export for future reference
notebook({
  operation: "export",
  args: {
    notebookId: "...",
    path: "./docs/checkout-performance-analysis.src.md"
  }
})
```

---

## Summary

This example demonstrated:

1. **Mental Model Selection**: Used five-whys for root cause, trade-off-matrix for decision
2. **Forward Thinking**: Progressive analysis from problem to data to causes
3. **Branching**: Parallel exploration of solution options
4. **Notebook Validation**: Executable code to verify analysis
5. **Synthesis**: Combining insights into actionable recommendation
6. **Documentation**: Preserved analysis for future reference

The three tools worked together:
- `mental_models`: Provided reasoning frameworks
- `thoughtbox`: Structured the analysis process
- `notebook`: Validated conclusions with code
