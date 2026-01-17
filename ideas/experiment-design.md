# Experiment Design Processes

A living document for designing experiments to validate ideas from research papers.

---

## 2026-01-16: From Paper to Prototype

**Question**: Once we've identified an agent-applicable idea from a research paper, how do we design an experiment to test it?

### Core Process

#### 1. Isolate the Mechanism

Strip away paper-specific details to find the **minimal mechanism**:

- What is the paper actually doing that produces the result?
- Can you describe it in one sentence without jargon?
- What's the smallest version that would still demonstrate the effect?

**Example (CoAT)**: "Inject relevant associations after each reasoning step, not just at the start."

**Example (RLM)**: "Process context in a sub-agent so only the summary enters the main conversation."

#### 2. Define the Baseline

What's the current behavior without the mechanism?

- Measure it concretely (tokens, accuracy, time, quality score)
- Document the exact steps to reproduce
- Keep it simple enough to run multiple times

**Example (Task Tool Experiment)**:
- Baseline: Direct MCP call to retrieve session → ~800 tokens in context
- Measured by: Counting tokens in conversation after retrieval

#### 3. Design the Minimal Test

The smallest change that implements the mechanism:

- One variable changed from baseline
- Same task/query for both conditions
- Measurable outcome

**Good minimal test**:
```
Baseline: Call thoughtbox.session directly
Test: Spawn sub-agent to call thoughtbox.session, return summary
Measure: Token count in parent conversation
```

**Bad minimal test**:
```
Baseline: Current system
Test: Completely new architecture with 5 changes
Measure: "It feels better"
```

#### 4. Predict the Outcome

Before running, write down:

- What do you expect to happen?
- What would confirm the mechanism works?
- What would falsify it?
- What's the minimum effect size that matters?

This prevents post-hoc rationalization.

#### 5. Run and Document

Execute both conditions and record:

- Exact commands/steps used
- Raw measurements
- Any unexpected observations
- Screenshots or logs if relevant

#### 6. Interpret Honestly

- Did the mechanism produce the expected effect?
- Was the effect size meaningful?
- What confounds might explain the result?
- What's the next question?

### Quick Checklist

Before running an experiment:

- [ ] Can I explain the mechanism in one sentence?
- [ ] Do I have a concrete baseline measurement?
- [ ] Is only one variable changing between conditions?
- [ ] Did I write down my prediction before running?
- [ ] Do I know what would falsify the hypothesis?
- [ ] Is the measurement objective (not "feels better")?

### Experiment Documentation Template

```markdown
## Experiment: [Name]

**Date**: YYYY-MM-DD
**Paper/Idea Source**: [Link or reference]

### Mechanism Being Tested
[One sentence description]

### Hypothesis
If [mechanism], then [expected outcome] because [reasoning].

### Baseline Condition
- Setup: [How to set up baseline]
- Measurement: [What to measure]
- Result: [Actual measurement]

### Test Condition
- Setup: [How to set up test]
- Measurement: [Same metric]
- Result: [Actual measurement]

### Analysis
- Effect size: [Difference between conditions]
- Interpretation: [What this means]
- Confounds: [What else could explain this]

### Conclusion
[Did the mechanism work? What's next?]
```

---

## 2026-01-16: Scaling Experiments

**Question**: When should we run quick tests vs. thorough experiments?

### Quick Test (< 30 min)

**When to use**:
- Initial feasibility check
- "Does this even work at all?"
- Exploring a new idea

**Characteristics**:
- Single run per condition
- Qualitative observation OK
- Manual measurement

**Example**: Run one Task tool query, eyeball the token difference

### Validation Experiment (1-2 hours)

**When to use**:
- Mechanism shows promise in quick test
- Want to quantify the effect
- Deciding whether to build a feature

**Characteristics**:
- 3-5 runs per condition
- Quantitative measurements
- Control for obvious confounds

**Example**: Run 5 different queries through both direct and sub-agent paths, average token counts

### Rigorous Experiment (1+ days)

**When to use**:
- Building a core feature based on mechanism
- Writing about results publicly
- High stakes decision

**Characteristics**:
- Statistical power analysis
- Multiple metrics
- Ablation studies
- Document everything

**Example**: Full benchmark suite comparing RAG vs association-on-demand across task types

### Scaling Decision Tree

```
Start with Quick Test
        │
        ▼
    Works at all?
    ├── No → Abandon or revise hypothesis
    │
    └── Yes → Effect seems meaningful?
              ├── No → Abandon or revise
              │
              └── Yes → Run Validation Experiment
                        │
                        ▼
                    Effect holds up?
                    ├── No → Debug or abandon
                    │
                    └── Yes → Worth building?
                              ├── No → Document and shelve
                              │
                              └── Yes → Rigorous Experiment
                                        (if high stakes)
                                        OR just build it
```

---

## Common Pitfalls

### 1. Testing Too Many Things at Once

**Bad**: "Let's add MCTS + associations + quality scoring + external brain"
**Good**: "Let's just test if associations after each step help"

### 2. No Baseline

**Bad**: "The new system works great!"
**Good**: "The new system produces X, baseline produces Y, difference is Z"

### 3. Subjective Measurement

**Bad**: "Responses feel more coherent"
**Good**: "Token count reduced by 40%" or "Accuracy improved from 72% to 81%"

### 4. Confirmation Bias

**Bad**: Running until you get the result you want
**Good**: Pre-registering predictions, running fixed number of trials

### 5. Premature Optimization

**Bad**: Building production system before validating mechanism
**Good**: Ugly prototype that tests the core idea

---

## Cross-References

- `heuristics.md` - For evaluating which ideas to experiment with
- `003-task-tool-isolation-experiment.md` - Example of this process applied
- `004-coat-associative-memory.md` - Next candidate for experimentation
