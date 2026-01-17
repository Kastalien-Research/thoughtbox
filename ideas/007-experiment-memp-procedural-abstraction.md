# Experiment Design: Mem^p Procedural Abstraction

**Paper**: Mem^p: Exploring Agent Procedural Memory (arxiv.org/abs/2508.06433)
**Date**: 2026-01-16

---

## Mechanism Being Tested

**One sentence**: After a successful task completion, abstract the thought chain into a reusable "procedure" (how-to script), store it separately, and retrieve it when facing similar tasks.

This tests whether **procedural memory improves task performance** - agents completing similar tasks faster by reusing learned procedures rather than reasoning from scratch.

---

## Hypothesis

**If** we abstract successful thought chains into reusable procedures and retrieve them for similar tasks,
**Then** subsequent similar tasks will be completed with fewer steps and higher success rate,
**Because** the procedure captures the successful reasoning pattern without trial-and-error.

---

## Baseline Condition

### Setup
1. Agent completes Task A (e.g., "debug a null pointer exception")
2. Session stored as regular thought chain
3. Agent faces Task B (similar: "debug an undefined variable error")
4. Agent reasons from scratch, no procedural retrieval

### Measurement
- Steps to completion (number of thoughts)
- Success rate (did agent reach correct solution?)
- Time/tokens spent
- Quality of final solution (human rating 1-5)

### Expected Result
- Agent repeats similar reasoning patterns
- May make similar mistakes before finding solution
- No leverage from prior successful experience

---

## Test Condition

### Setup
1. Agent completes Task A
2. **Abstraction step**: LLM abstracts thought chain into procedure
3. Procedure stored in separate "procedural memory"
4. Agent faces Task B (similar task)
5. **Retrieval step**: Find matching procedure, inject into prompt
6. Agent reasons with procedure as guidance

### Implementation Sketch

```typescript
interface Procedure {
  id: string;
  taskType: string;           // "debugging", "api-design", "refactoring"
  trigger: string;            // When to use: "null/undefined errors"
  steps: string[];            // Abstract steps
  sourceSessionId: string;    // Where it came from
  successCount: number;       // Times successfully reused
  lastUsed: Date;
}

async function abstractToProcedure(session: Session): Promise<Procedure> {
  const thoughts = await session.getThoughts();

  const response = await llm.complete({
    prompt: `
      A reasoning session just completed successfully. Abstract it into
      a reusable procedure that could help with similar tasks.

      SESSION THOUGHTS:
      ${thoughts.map((t, i) => `${i+1}. ${t.content}`).join('\n')}

      Generate:
      1. TASK_TYPE: General category (debugging, design, implementation, etc.)
      2. TRIGGER: When should this procedure be retrieved? (1 sentence)
      3. STEPS: Abstract, reusable steps (not specific to this instance)

      Output as JSON.
    `
  });

  const parsed = JSON.parse(response);
  return {
    id: generateId(),
    taskType: parsed.taskType,
    trigger: parsed.trigger,
    steps: parsed.steps,
    sourceSessionId: session.id,
    successCount: 0,
    lastUsed: new Date()
  };
}

async function retrieveProcedure(
  taskDescription: string,
  procedures: Procedure[]
): Promise<Procedure | null> {
  // Embed task description
  const taskEmbedding = await embed(taskDescription);

  // Find best matching procedure by trigger similarity
  let bestMatch: Procedure | null = null;
  let bestScore = 0;

  for (const proc of procedures) {
    const triggerEmbedding = await embed(proc.trigger);
    const score = cosineSimilarity(taskEmbedding, triggerEmbedding);
    if (score > bestScore && score > 0.7) { // Threshold
      bestScore = score;
      bestMatch = proc;
    }
  }

  return bestMatch;
}

async function executeWithProcedure(
  task: string,
  procedure: Procedure | null
): Promise<Session> {
  const systemPrompt = procedure
    ? `You have a procedure from a similar past task that may help:

       PROCEDURE (${procedure.taskType}):
       ${procedure.steps.map((s, i) => `${i+1}. ${s}`).join('\n')}

       Use this as guidance, but adapt to the specific task.`
    : `Reason through this task step by step.`;

  // Execute task with procedure-augmented prompt
  return await agent.execute(task, { systemPrompt });
}
```

### Measurement
- Steps to completion (expect fewer)
- Success rate (expect higher)
- Time/tokens spent (expect lower)
- Quality of final solution (expect same or better)

---

## Prediction

| Metric | Baseline | Test | Expected Δ |
|--------|----------|------|------------|
| Steps to completion | 8 | 5 | -37% |
| Success rate | 70% | 85% | +15% |
| Tokens spent | 4000 | 2500 | -37% |
| Solution quality | 3.5/5 | 3.8/5 | +0.3 |

**Key insight from paper**: Gains compound - after 5-10 similar tasks, procedural memory becomes very valuable.

**Falsification**: If procedures don't transfer (steps don't decrease, success doesn't improve), the abstraction is either too specific or too general.

---

## Confounds to Control

1. **Task similarity**: Tasks must be genuinely similar for fair comparison
2. **Procedure quality**: Bad abstractions won't help - need to validate procedure quality
3. **Agent capability**: Some agents may not follow procedures well
4. **Overfitting**: Procedure might be too specific to original task

---

## Token Cost Analysis

**One-time per successful session**:
- Procedure abstraction: ~500 tokens
- Storage: negligible

**Per task with retrieval**:
- Procedure retrieval: ~100 tokens (embedding lookup)
- Procedure injection: ~200 tokens added to prompt
- **Savings**: If procedure reduces steps by 3, saves ~1500 tokens

**Break-even**: After 2 similar tasks, procedural memory pays for itself.

---

## Quick Test Protocol (1 hour)

### Part 1: Generate Procedure
1. Have agent debug a specific bug (Task A)
2. Manually abstract into procedure using the prompt above
3. Store procedure

### Part 2: Test Retrieval
1. Present similar bug (Task B) - same category, different specifics
2. **Baseline run**: Agent debugs without procedure
3. **Test run**: Agent debugs with procedure injected
4. Compare: steps, success, quality

### Example Task Pair
- **Task A**: "Debug: API returns 500 error when user field is null"
- **Task B**: "Debug: API returns 500 error when email field is missing"
- **Expected procedure**: General null-field debugging pattern

---

## Variations to Test

### A. Abstraction Level
- **Concrete**: Keep specific details from source task
- **Abstract**: Generalize to pattern only
- **Hybrid**: Mix of concrete examples + abstract steps (paper says this wins)

### B. Reflection-Based Update
When procedure doesn't help:
1. Compare failed attempt with procedure
2. LLM revises procedure: "What was wrong? How should it be updated?"
3. Store revised procedure

```typescript
async function reflectAndUpdate(
  procedure: Procedure,
  failedSession: Session
): Promise<Procedure> {
  const response = await llm.complete({
    prompt: `
      This procedure was used but the task failed:

      PROCEDURE:
      ${procedure.steps.join('\n')}

      FAILED ATTEMPT:
      ${failedSession.thoughts.map(t => t.content).join('\n')}

      What went wrong? How should the procedure be revised?
      Output revised steps as JSON array.
    `
  });

  return {
    ...procedure,
    steps: JSON.parse(response)
  };
}
```

### C. Transfer Across Task Types
- Can a debugging procedure help with related design task?
- Test cross-category transfer (paper says limited but possible)

---

## Success Criteria

- [ ] Steps reduced by ≥25% on similar tasks
- [ ] Success rate improves by ≥10%
- [ ] Procedures are reusable (work on 2+ similar tasks)
- [ ] Reflection-based update improves failed procedures

---

## Integration with Other Experiments

**With A-Mem (005)**:
- Procedures could trigger retroactive updates to related thoughts
- "This thought matches procedure X" as evolved context

**With MemInsight (006)**:
- Mine attributes for procedures (task_type, trigger, domain)
- Use attribute matching for procedure retrieval

**With CoAT (004)**:
- Procedures as "External Brain" content
- Inject procedure as association during reasoning

---

## Next Steps if Successful

1. Add `session.complete({ abstract: true })` to auto-generate procedures
2. Build procedure registry: `procedures.find(taskDescription)`
3. Implement reflection loop for failed procedures
4. Test on real agent workflows (not just synthetic tasks)
5. Explore: Can multiple procedures compose for complex tasks?
