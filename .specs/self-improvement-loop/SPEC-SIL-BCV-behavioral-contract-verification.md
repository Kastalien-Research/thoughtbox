# Behavioral Contract Verification (BCV)

> **Priority**: CRITICAL - Solves structural verification bias
> **Created**: 2026-01-21
> **Status**: Draft - Solution to fundamental SIL validation failure
> **Thoughtbox Session**: c9fae8b1-e5eb-4c84-b4d0-c8d74de0044b (85 thoughts)

## The Problem

The Self-Improvement Loop specs were "validated" by multiple Claude instances, yet the core `ImprovementReasoner` (SIL-006) doesn't actually reason - it returns **hardcoded values**:

```typescript
// src/improvement/reasoner.ts lines 467-494
const defaults: Record<string, ApproachBranch["assessment"]> = {
  "direct-integration": { feasibility: 8, risk: 6, estimatedCost: 30000 },
  "wrapper-pattern": { feasibility: 7, risk: 3, estimatedCost: 40000 },
  hybrid: { feasibility: 7, risk: 4, estimatedCost: 35000 },
};
return defaults[approach] || { feasibility: 5, risk: 5, estimatedCost: 35000 };
```

**Root Cause**: Specs defined STRUCTURAL contracts (return type, fields, interfaces) but not BEHAVIORAL contracts (must actually reason, must reference input, must vary with input). Tests verified "does output have correct fields?" not "did reasoning actually occur?"

This is **Structural Verification Bias**: the tendency to verify output structure while missing functional behavior.

---

## The Solution: Behavioral Contract Verification

### Core Principle

> **Verify REASONING OCCURRED, not just OUTPUT FORMED.**

Instead of testing "does ImprovementPlan have field `feasibility`?", test:
- Does `feasibility` differ for different discoveries?
- Does the output reference the specific discovery content?
- Do reasoning artifacts (traces, thoughts) exist?
- Does an LLM judge confirm semantic validity?

### Four Verification Layers

| Layer | Name | What It Catches | Implementation |
|-------|------|-----------------|----------------|
| 1 | **VARIANCE** | Hardcoded values | Metamorphic testing |
| 2 | **CONTENT_COUPLED** | Input-ignoring implementations | Keyword/ID matching |
| 3 | **TRACE_EXISTS** | Reasoning-free outputs | Trace inspection |
| 4 | **LLM_JUDGES** | Semantically invalid reasoning | LLM-as-judge evaluation |

**Why this works**: Hardcoded impl fails L1. Random impl fails L2,L3,L4. Only actual reasoning passes all four.

---

## Behavioral Contract Templates

Pre-validated templates ensure contracts actually test behavior:

```typescript
// behavioral-contracts.ts

/**
 * VARIANCE: Different inputs must produce different outputs
 * Catches: Hardcoded return values
 */
export async function VARIANCE<T, R>(
  fn: (input: T) => Promise<R>,
  input1: T,
  input2: T,
  extractField: (result: R) => unknown
): Promise<void> {
  const result1 = await fn(input1);
  const result2 = await fn(input2);
  const field1 = extractField(result1);
  const field2 = extractField(result2);

  if (JSON.stringify(field1) === JSON.stringify(field2)) {
    throw new Error(
      `VARIANCE FAILED: Different inputs produced identical outputs.\n` +
      `Input1: ${JSON.stringify(input1)}\n` +
      `Input2: ${JSON.stringify(input2)}\n` +
      `Output field: ${JSON.stringify(field1)}`
    );
  }
}

/**
 * CONTENT_COUPLED: Output must reference input-specific content
 * Catches: Implementations that ignore input
 */
export async function CONTENT_COUPLED<T, R>(
  fn: (input: T) => Promise<R>,
  input: T,
  inputMarker: string, // Unique identifier from input
  extractOutputText: (result: R) => string
): Promise<void> {
  const result = await fn(input);
  const outputText = extractOutputText(result);

  if (!outputText.includes(inputMarker)) {
    throw new Error(
      `CONTENT_COUPLED FAILED: Output does not reference input.\n` +
      `Expected marker: "${inputMarker}"\n` +
      `Output text: ${outputText.substring(0, 500)}...`
    );
  }
}

/**
 * TRACE_EXISTS: Reasoning artifacts must exist
 * Catches: Implementations that skip reasoning
 */
export async function TRACE_EXISTS<T, R>(
  fn: (input: T) => Promise<R>,
  input: T,
  getTrace: () => { length: number; thoughts: Array<{ content: string }> },
  minThoughts: number = 3
): Promise<void> {
  await fn(input);
  const trace = getTrace();

  if (trace.length < minThoughts) {
    throw new Error(
      `TRACE_EXISTS FAILED: Insufficient reasoning trace.\n` +
      `Expected >= ${minThoughts} thoughts, got ${trace.length}`
    );
  }

  // Verify thoughts show progression (reference each other)
  const lastThought = trace.thoughts[trace.thoughts.length - 1];
  const hasReferences = /S\d+|thought \d+|earlier|above|previous/i.test(lastThought.content);

  if (!hasReferences) {
    throw new Error(
      `TRACE_EXISTS FAILED: Final thought does not reference earlier reasoning.\n` +
      `Final thought: ${lastThought.content.substring(0, 200)}...`
    );
  }
}

/**
 * LLM_JUDGES: Semantic evaluation of reasoning quality
 * Catches: Outputs that look structural but aren't semantically valid
 */
export async function LLM_JUDGES<T, R>(
  fn: (input: T) => Promise<R>,
  input: T,
  judge: (prompt: string) => Promise<string>,
  minScore: number = 6
): Promise<void> {
  const result = await fn(input);

  const judgePrompt = `
You are evaluating whether an AI system's output demonstrates actual reasoning about a given input.

INPUT (Discovery):
${JSON.stringify(input, null, 2)}

OUTPUT (Plan):
${JSON.stringify(result, null, 2)}

Score 1-10 on each dimension:
1. Does the output reference SPECIFIC details from the input? (not generic responses)
2. Does the reasoning show logical progression toward the output?
3. Would this output plausibly address the input's specific concerns?
4. Is the assessment tailored to this input or could it apply to any input?

Respond with ONLY four numbers separated by commas (e.g., "7,8,6,7")
`;

  const response = await judge(judgePrompt);
  const scores = response.split(',').map(s => parseInt(s.trim()));
  const minObserved = Math.min(...scores);

  if (minObserved < minScore) {
    throw new Error(
      `LLM_JUDGES FAILED: Semantic verification failed.\n` +
      `Scores: ${scores.join(', ')}\n` +
      `Minimum observed: ${minObserved}, required: ${minScore}`
    );
  }
}
```

---

## Example: Behavioral Tests for ImprovementReasoner

```typescript
// src/improvement/reasoner.behavioral.test.ts

import { VARIANCE, CONTENT_COUPLED, TRACE_EXISTS, LLM_JUDGES } from '../behavioral-contracts';
import { ImprovementReasoner } from './reasoner';

describe('ImprovementReasoner Behavioral Contracts', () => {
  let reasoner: ImprovementReasoner;

  beforeEach(() => {
    reasoner = new ImprovementReasoner();
  });

  test('VARIANCE: different discoveries produce different assessments', async () => {
    const perfDiscovery = {
      id: 'perf-001',
      type: 'performance',
      description: 'API endpoint /users takes 5 seconds to respond'
    };

    const secDiscovery = {
      id: 'sec-001',
      type: 'security',
      description: 'SQL injection vulnerability in login form'
    };

    await VARIANCE(
      (d) => reasoner.analyze(d),
      perfDiscovery,
      secDiscovery,
      (plan) => plan.assessment // Must differ
    );
  });

  test('CONTENT_COUPLED: output references discovery specifics', async () => {
    const uniqueId = `discovery-${Date.now()}-${Math.random().toString(36)}`;
    const discovery = {
      id: uniqueId,
      type: 'refactor',
      description: `Function ${uniqueId} in module xyz-handler needs cleanup`
    };

    await CONTENT_COUPLED(
      (d) => reasoner.analyze(d),
      discovery,
      uniqueId, // This unique ID MUST appear in output
      (plan) => JSON.stringify(plan) + (plan.rationale || '')
    );
  });

  test('TRACE_EXISTS: reasoning chain is substantive', async () => {
    const discovery = {
      id: 'trace-test',
      type: 'bug',
      description: 'Null pointer exception in payment handler'
    };

    await TRACE_EXISTS(
      (d) => reasoner.analyze(d),
      discovery,
      () => reasoner.getLastSession(), // Returns Thoughtbox session
      3 // Minimum 3 thoughts required
    );
  });

  test('LLM_JUDGES: semantic verification of reasoning', async () => {
    const discovery = {
      id: 'judge-test',
      type: 'performance',
      description: 'Database queries averaging 3 seconds in checkout flow'
    };

    await LLM_JUDGES(
      (d) => reasoner.analyze(d),
      discovery,
      async (prompt) => {
        // Use Haiku for cost-effective judging
        const response = await anthropic.messages.create({
          model: 'claude-3-5-haiku-latest',
          max_tokens: 50,
          messages: [{ role: 'user', content: prompt }]
        });
        return response.content[0].text;
      },
      6 // Minimum score on all dimensions
    );
  });
});
```

---

## Spec Format Update

All specs for AI-invoking components must include:

```markdown
## Behavioral Contracts

### Variance Tests
```typescript
// EXECUTABLE CODE - copy to test file
test('variance', async () => {
  await VARIANCE(fn, input1, input2, extractField);
});
```

### Content Coupling Tests
```typescript
test('content coupling', async () => {
  await CONTENT_COUPLED(fn, inputWithMarker, marker, extractText);
});
```

### Trace Verification
```typescript
test('trace exists', async () => {
  await TRACE_EXISTS(fn, input, getTrace, minThoughts);
});
```

### Semantic Verification
```typescript
test('llm judges', async () => {
  await LLM_JUDGES(fn, input, judge, minScore);
});
```
```

**Spec review gate**: Specs without behavioral contracts section are REJECTED.

---

## CLAUDE.md Update

Add to CLAUDE.md:

```markdown
## Behavioral Contract Verification (BCV)

When implementing or testing AI-invoking components (anything that calls an LLM or performs reasoning):

**Tests MUST include behavioral contracts, not just structural assertions.**

### Required Behavioral Tests

1. **VARIANCE**: Different inputs produce different outputs
   - `expect(fn(input1).field).not.toEqual(fn(input2).field)`

2. **CONTENT_COUPLED**: Output references input specifics
   - `expect(output).toContain(input.uniqueIdentifier)`

3. **TRACE_EXISTS**: Reasoning artifacts exist
   - `expect(getTrace().length).toBeGreaterThanOrEqual(3)`

4. **LLM_JUDGES**: Semantic verification passes
   - `expect(judgeScore).toBeGreaterThanOrEqual(6)`

### Why This Matters

Structural-only tests (checking output has correct fields) can pass even when implementation is hardcoded or doesn't actually reason. Behavioral tests verify reasoning OCCURRED.

### Red Flag: Hardcoded Values

If you see code like:
```typescript
return { feasibility: 8, risk: 6 }; // HARDCODED - fails VARIANCE
```

This MUST be replaced with actual reasoning that produces values based on input.
```

---

## Held-Out Verification for Autonomous Systems

For autonomous improvement loops, add held-out behavioral tests:

```typescript
// held-out-behavioral-tests.ts (encrypted/obfuscated, rotated monthly)

export const HELD_OUT_INPUTS = [
  // These inputs are NEVER shown to implementation agent
  { id: 'held-out-001', type: 'memory-leak', description: '...' },
  { id: 'held-out-002', type: 'race-condition', description: '...' },
  // ... rotated monthly
];

export async function runHeldOutVerification(reasoner: ImprovementReasoner) {
  for (const input of HELD_OUT_INPUTS) {
    await VARIANCE(reasoner.analyze, input, getRandomOtherInput(), extractAssessment);
    await CONTENT_COUPLED(reasoner.analyze, input, input.id, extractText);
    // ... all four verification layers
  }
}
```

---

## Research Foundations

BCV synthesizes insights from:

1. **Metamorphic Testing** - Solves oracle problem by testing input-output relationships
2. **Self-Consistency Verification** - Multiple runs should converge but not be identical
3. **Design by Contract** - Semantic postconditions, not just type contracts
4. **Behavior-Driven Development** - Executable specifications
5. **LLM-as-Judge** - Semantic evaluation using LLMs
6. **Property-Based Testing** - Invariant verification

---

## Implementation Priority

| Phase | Action | Effort |
|-------|--------|--------|
| **1 (Immediate)** | Add behavioral tests to SIL-006, reimplement reasoner | 4-6 hours |
| **2 (Systemic)** | Create contract template library, update spec template | 2-4 hours |
| **3 (Autonomous)** | Add held-out rotation to SIL-008 | 4-6 hours |

---

## Success Criteria

After BCV implementation:

- [ ] SIL-006 ImprovementReasoner passes all 4 behavioral contract types
- [ ] All AI-invoking specs have behavioral contracts section
- [ ] Spec review gate rejects specs without behavioral contracts
- [ ] CLAUDE.md includes BCV rules
- [ ] Held-out behavioral tests exist for autonomous verification

---

*Generated from 85-thought Thoughtbox session exploring solutions to structural verification bias*
