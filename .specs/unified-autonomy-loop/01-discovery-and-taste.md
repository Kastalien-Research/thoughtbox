# Discovery & The Taste Agent

**Phase 1 of the Unified Autonomous Loop**

## Purpose
Before any compute is burned on implementation or deep research, the system must generate and rigorously filter proposals. This replaces the generic LLM "Haiku Relevance Scoring" mentioned in the `self-improvement` spec with the structured heuristics of the **Taste Agent**.

## 1. Information Gathering (Discovery)
Triggered daily via the `agentops` cron job, the system scans for signals indicating areas of improvement or highly valuable research topics.

**Sources**:
- `agentops` target repositories (e.g., langchain, aider, anthropic-cookbook).
- Open user issues in the Thoughtbox repository.
- ArXiv trends (via MCP).
- Emerging capabilities in the ecosystem (new models, new major tools).

## 2. The Taste Agent (Filtration)
The Taste Agent is a pure-inference mechanism. It does not iteratively browse the web or run code; it relies on internal deduction to prune bad ideas cheaply and effectively. The raw discoveries from Step 1 pass through these distinct checks.

### a. The Compression Test
Can the proposed improvement or research direction be formulated as a clean, single-sentence claim?
> *"We believe [X] because [Y], and if we're right, [Z] follows."*

If the proposal cannot be compressed without losing its meaning, it is either unformed or too vague to pursue. It is deferred, not killed.

### b. Prediction Query
Simulates the outcomes.
- If this succeeds, what changes?
- If this fails, what do we learn?

If failure teaches us nothing, the experiment is poorly designed. If success teaches us nothing beyond "it worked," it is too incremental. High-quality tasks must be informative under *both* outcomes.

### c. Dead-End Estimation (Time-to-Signal)
Calculates the shortest distance to a definitive "Stop / Keep going" signal. Time-to-signal is prioritized over time-to-completion. 

### d. Simplicity Audit
Is there an 80% version of this idea that takes 20% of the effort? If yes, mutate the proposal to that simpler version.

### e. Cross-Pollination Check
Check for resonance across domains (e.g., applying a robotics reinforcement pattern to code refactoring constraints).

## 3. Output Generation
Proposals that survive the Taste Agent filter are highly refined, clearly justified, and explicitly declare their implications and testable signals. These are formatted into the **Daily Dev Brief JSON** and handed off to `agentops` for human approval.
