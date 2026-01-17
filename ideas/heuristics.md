# Heuristics Collection

A living document for meta-level insights, decision frameworks, and pattern-recognition heuristics.

---

## 2026-01-16: Identifying Agent-Applicable AI Research

**Question**: When reading AI research papers focused on model-level implementations, how do we identify which insights are applicable at the agent layer?

### Core Heuristics

#### 1. Information Flow vs Weight Updates

- **Weight updates** = model-level only (fine-tuning, architecture changes)
- **Information flow** = potentially agent-level

COCONUT modifies how hidden states flow back as inputs - that's weight-dependent. But the *principle* (compress reasoning, feed back summaries) can be done with agent scaffolding.

#### 2. Can You Simulate It With Multiple API Calls?

If the paper's mechanism could be approximated by:
- Calling the model multiple times
- Routing/filtering between calls
- Maintaining external state

Then it's agent-applicable. RLM is literally this - recursive API calls with external context management.

#### 3. Is the Magic in the Representation or the Process?

- **Representation magic** (learned embeddings, attention patterns, latent spaces) = model-level
- **Process magic** (decomposition strategy, query patterns, aggregation) = agent-level

Ask: "If I had a perfect oracle model, would this technique still help?" If yes, it's about process.

#### 4. Does It Reduce Tokens-In or Tokens-Out?

- **Tokens-in reduction** (compression, retrieval, filtering) = often agent-applicable
- **Tokens-out reduction** (latent reasoning, implicit CoT) = usually model-level

RLM reduces tokens-in to each call. COCONUT reduces tokens-out (no explicit reasoning tokens).

#### 5. Is There an External Loop?

Papers that describe:
- Iterative refinement
- Recursive decomposition
- Multi-pass processing
- Hierarchical aggregation

These almost always have agent-level implementations, even if the paper trains a model for it.

#### 6. What's the Minimal Trusted Primitive?

Ask: "What capability does this assume the base model has?"

- If it assumes "model can summarize" → agent-level (just call summarize)
- If it assumes "model learns compressed representations" → model-level

### Quick Filter Questions

| Question | Agent-applicable if... |
|----------|----------------------|
| Does it require training? | No, or training is optional optimization |
| Does it work with frozen models? | Yes |
| Is the technique in the scaffold/prompt? | Yes |
| Could you implement it with LangChain/DSPy? | Yes |
| Does the eval use API calls? | Yes |

### Red Flags (Model-Level Only)

- "We fine-tune..."
- "learned latent space"
- "attention mechanism modification"
- "new positional encoding"
- "continuous/differentiable"
- "end-to-end training"

### Green Flags (Agent-Applicable)

- "inference-time"
- "prompting strategy"
- "recursive calls"
- "external memory"
- "decomposition"
- "multi-agent"
- "works with black-box models"

### The Meta-Heuristic

**If you can draw the technique as a flowchart with "LLM API call" as a black box node, it's agent-level.**

---

## Template for New Entries

```markdown
## YYYY-MM-DD: [Topic/Question]

**Question**: [The question that prompted this heuristic]

### Heuristics

[The answer/framework]

### Examples

[Concrete examples where this applies]

### Related

[Links to related heuristics or resources]
```
