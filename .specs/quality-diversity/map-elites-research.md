# Thoughtbox: Adaptive Research Workflow System

## Overview

This document describes a system for Thoughtbox that combines two complementary components:

1. **A Research Taste Agent** — a sub-agent that evaluates *what* to investigate, optimizing for high-information, low-cost paths through a problem space.
2. **A MAP-Elites Workflow Library** — an evolving population of research workflows that determines *how* to investigate, using quality-diversity optimization to maintain a diverse set of high-performing strategies.

The system is designed to minimize wasted effort by applying compression-based evaluation to both research direction selection and research methodology selection.

---

## Part 1: Research Taste Agent

### Role

The Taste Agent operates as a persistent evaluator that sits upstream of research execution. It is consulted, not executed sequentially. Its purpose is to prevent wasted effort by identifying the highest-information, lowest-cost path through a problem space.

### Core Operations

#### 1. Landscape Assessment

Determine what's currently possible, what's been tried, and what recently changed.

**Key questions:**
- What adjacent work exists in this space?
- What has been tried and abandoned? Why?
- What new capabilities (models, datasets, tools, infrastructure) recently became available that weren't before?
- What are people actively working on vs. quietly dropping?

**Required tools:**
- Academic search (arxiv, Semantic Scholar)
- Infrastructure tracking (GitHub trending, new releases)
- Neural/semantic web search (Exa)
- Community discourse (blog posts, forums, social media)

#### 2. Compression Test

Force the proposal into a single-sentence formulation:

> "We believe [X] because [Y], and if we're right, [Z] follows."

If the proposal cannot survive this compression without losing its core claim, it is not yet well-enough understood to pursue. Shelve it (it may be premature rather than bad), don't kill it.

**This step requires no external tools. It is a pure inference-time operation.**

#### 3. Prediction Query

Simulate two futures: the world where this works, and the world where it fails.

**Key questions:**
- If this succeeds, what does the world look like? Is that world interesting? Does it open doors or close them?
- If this fails, what do we learn? Is the failure informative or ambiguous?
- Have the predicted implications already been explored by someone else?

**Decision heuristic:** The best research directions are *informative under both outcomes*. If failure teaches you nothing, the experiment is poorly designed. If success teaches you nothing beyond "it worked," the direction is incremental.

#### 4. Dead-End Estimation

Estimate the cost of discovering whether this path is viable.

**Key questions:**
- What is the most likely failure mode?
- How expensive (time, compute, data) is it to reach the point where you'd *know* whether to continue?
- Is there a cheaper experiment that would give you a meaningful update on this direction's viability?

**Core metric: Time-to-signal.** Not time-to-completion — time to the point where you know whether to continue. Minimize this.

**Required tools:**
- Negative results / abandoned approaches index
- Cost estimation (compute pricing, dataset availability, engineering complexity)
- Analogical retrieval (has something structurally similar been tried elsewhere?)

#### 5. Simplicity Audit

**Key question:** Is there a simpler version of this that captures 80% of the value?

If yes, do that instead. Always.

This check should be applied recursively — the simplified version should itself be checked for further simplification.

#### 6. Cross-Pollination Check

Check the proposal against at least one other domain.

**Key questions:**
- Does this problem structure remind you of anything in another field?
- Has an analogous problem been solved elsewhere with techniques that could transfer?
- Is there a structural similarity that suggests a deeper principle at work?

**Decision heuristic:** Cross-domain resonance is a strong signal that you've found real structure rather than a domain-specific artifact.

**Required tools:**
- Semantic search across domains (Exa)
- Structural analogy matching (see Part 3: Future MCP Servers)

### Output Format

The Taste Agent does not produce binary yes/no decisions. For each evaluated proposal, it outputs:

```
## Taste Evaluation: [Proposal Title]

**Verdict:** proceed | simplify | defer | kill

**One-sentence rationale:** [Why this verdict]

**Compression:** [Single-sentence formulation of the proposal]

**Landscape position:** [Where this sits relative to existing work]

**Prediction:** 
- If it works: [implications]
- If it fails: [what we learn]

**Time-to-signal estimate:** [How long before we know if this is viable]

**Simplification opportunity:** [Is there a cheaper version? If so, what?]

**Cross-domain resonance:** [Analogies from other fields, if any]
```

### Meta-Pruning Heuristics

The Taste Agent should not invoke all tools on every query. Use these heuristics to determine which operations to run:

- **Simple compression test only:** When evaluating a vague or early-stage idea that needs sharpening before deeper analysis.
- **Landscape + dead-end estimation:** When evaluating a specific technical proposal with clear implementation implications.
- **Full pipeline:** When making a significant resource allocation decision (what to build next, what direction to commit to for weeks/months).
- **Cross-pollination only:** When stuck on an existing problem and looking for fresh angles.
- **Prediction query only:** When deciding between multiple proposals that have already passed initial screening.

---

## Part 2: MAP-Elites Workflow Library

### Concept

A population of research workflows maintained using quality-diversity optimization. Each workflow occupies a cell in a behavior space defined by the type of research task it's suited for. When a new workflow outperforms the current occupant of its cell, it replaces it.

### How It Works

#### Step 1: Task Characterization

When a research task arrives, characterize it along the behavioral dimensions (see below). This determines which region of the behavior space is relevant.

#### Step 2: Workflow Retrieval

Pull the top 3-5 workflows from the relevant region of the behavior space. These don't need to be exact matches — adjacent cells are often valuable sources of transferable techniques.

#### Step 3: Compositional Planning

The agent examines the retrieved workflows and identifies sub-techniques worth recombining. It does NOT simply pick one workflow and execute it. Instead, it:

- Identifies which steps from which workflows are well-suited to the current task
- Notes the *rationale* behind each step (why it exists, what it optimizes for)
- Generates a novel workflow plan that recombines these elements
- Explicitly notes which elements were borrowed from which source workflows

#### Step 4: Execution

Execute the composed workflow using available tools.

#### Step 5: Evaluation

Score the output quality (see Fitness Function below).

#### Step 6: Library Update

If the new workflow's fitness score exceeds the current occupant of its behavioral cell, replace it. The replaced workflow is archived, not deleted — it may contain useful sub-techniques even if it's no longer the best overall performer in its niche.

### Behavioral Dimensions

These define the MAP-Elites behavior space. Each dimension is a spectrum, not a binary.

| Dimension | Low End | High End |
|-----------|---------|----------|
| **Scope** | Point question (single fact) | Frontier mapping (state of entire field) |
| **Domain structure** | Single field, established methods | Distant cross-domain analogy |
| **Evidence type** | Empirical data, measurements | Theoretical arguments, first-principles |
| **Time horizon** | What's true right now | What could become true (speculative) |
| **Fidelity requirement** | Ballpark / directional | Rigorous / publication-grade |

This gives a 5-dimensional behavior space. In practice, workflows will cluster in certain regions (most research tasks are not simultaneously cross-domain, speculative, AND rigorous), so the library will be sparse in some regions and dense in others. That's fine — MAP-Elites handles sparsity gracefully.

### Workflow Document Structure

Each workflow in the library should be a structured document with the following format:

```yaml
id: workflow-[uuid]
name: [Descriptive name]
created: [timestamp]
parent_workflows: [list of workflow IDs this was composed from]
behavioral_coordinates:
  scope: [1-5]
  domain_structure: [1-5]
  evidence_type: [1-5]
  time_horizon: [1-5]
  fidelity_requirement: [1-5]
fitness_score: [0-1]
fitness_method: [how it was evaluated]
times_used: [count]
times_selected_as_parent: [count]

steps:
  - name: [Step name]
    description: [What to do]
    rationale: [Why this step exists and what it optimizes for]
    tools_required: [List of MCP servers / tools needed]
    skip_condition: [When to skip this step]
    outputs: [What this step produces]
    
  - name: ...

notes: [Any additional context, known limitations, or tips]
```

The `rationale` field on each step is critical. This is what enables intelligent recombination — without it, the composing agent can only do blind splicing. With it, the agent can reason about *why* a technique works and whether that reasoning applies to the current task.

### Fitness Function

Output quality is evaluated using a composite score:

1. **Coherence (0-1):** Does the output tell a consistent story? Are there internal contradictions?
2. **Grounding (0-1):** Are claims supported by retrieved evidence? Is the evidence real and correctly interpreted?
3. **Compression (0-1):** Can the key findings be stated concisely? A high-quality research output should be compressible without significant loss — if it can't be summarized, it may lack a clear thesis.
4. **Surprise (0-1):** Did the research surface anything non-obvious? A research output that only confirms what was already known has low value, even if it's rigorous.
5. **Actionability (0-1):** Does the output enable a decision or next step? Research that doesn't connect to action is incomplete.

**Composite fitness = weighted average.** Default weights are equal, but these can be adjusted per behavioral niche. For example, high-fidelity workflows should weight grounding more heavily; exploratory workflows should weight surprise more heavily.

**Evaluation methods (in order of preference):**
- User feedback (highest signal, sparsest)
- Downstream utility (did the research change a decision or produce a useful artifact?)
- LLM-as-judge on the composite rubric (cheapest, noisiest, but sufficient for relative ranking within a niche)

### Seed Library

The system should be initialized with 20-30 handcrafted workflows covering major research archetypes. Suggested seed categories:

**Exploratory**
- Quick landscape scan (15-minute overview of a new field)
- Deep literature review (comprehensive survey of a mature field)
- Trend detection (what's gaining momentum in X domain)
- White space identification (what *isn't* being worked on that should be)

**Confirmatory**
- Fact-checking pipeline (verify specific claims with primary sources)
- Consensus mapping (what do experts agree/disagree on)
- Replication check (has this finding held up under scrutiny)

**Analytical**
- Compare and contrast (systematic comparison of N approaches)
- Root cause analysis (why did X happen / why does X not work)
- Cost-benefit analysis (should we do X given tradeoffs)
- Forecasting (given current trends, what's likely to happen)

**Generative**
- Cross-domain transfer (find solutions in field B for problems in field A)
- First-principles derivation (reason about X from fundamentals, not literature)
- Synthesis (combine N existing ideas into a novel framework)
- Adversarial stress-test (find the strongest objections to X)

**Applied**
- Technical feasibility assessment (can X be built with current tools)
- Build-vs-buy analysis (should we build X or use existing solution)
- Implementation planning (how to execute X given constraints)

### Mutation and Diversity Maintenance

To prevent the library from converging to local optima:

1. **Forced novelty injection (5% of runs):** Occasionally force the agent to include a technique from a distant behavioral cell — one it wouldn't have chosen. This is the equivalent of random mutation in evolutionary systems.

2. **Periodic diversity audit:** Every N runs, check the behavior space coverage. If large regions are empty, attempt to generate workflows that target those regions, even if no task has demanded it yet.

3. **Archive mining:** Periodically review the archive of replaced workflows. Sub-techniques from displaced workflows may still be valuable — they were just combined suboptimally.

---

## Part 3: Tool Requirements

### Currently Available MCP Servers

| Server | Role | Used By |
|--------|------|---------|
| **Exa** | Neural/semantic web search, cross-domain retrieval | Landscape assessment, cross-pollination |
| **Arxiv** | Preprint search, academic literature | Landscape assessment |
| **Semantic Scholar** | Citation graphs, influence scores, related papers | Landscape assessment, dead-end estimation |
| **GitHub** | Repository search, trending projects, releases | Infrastructure/capability tracking |
| **Brave Search / Web Search** | General web search, community discourse | Community signal, blog posts |
| **Zotero** | Personal/curated knowledge base management | Persistent memory, "have I seen this before" |
| **Filesystem** | Read/write workflow documents, archives | Workflow library storage |

### MCP Servers To Build

#### Research Graveyard Server
**Purpose:** Index abandoned approaches, negative results, stale projects.
**Data sources:** Papers With Code (stale projects), arxiv papers with low/no citations after N years, blog posts explaining abandoned directions, retracted papers.
**Key queries:** "What has been tried and failed in [domain]?" / "Why was [approach] abandoned?"

#### Cost Estimator Server
**Purpose:** Estimate time-to-signal for a proposed research or engineering direction.
**Data sources:** Cloud compute pricing APIs, model benchmarking data (HF Open LLM Leaderboard, etc.), dataset registries, historical project timelines.
**Key output:** Not a dollar figure — an estimated time-to-meaningful-signal.

#### Structural Analogy Server
**Purpose:** Match problem *structures* (not topics) across domains.
**Approach:** Maintain a curated ontology of problem structures (sparse reward, delayed feedback, combinatorial explosion, phase transition, etc.) and index research by structural tags. Alternatively, use embeddings from a multi-domain corpus with prompting that emphasizes structural rather than topical similarity.
**Key queries:** "What problems in other fields share the structure of [this problem]?"

---

## Part 4: Integration Architecture

```
┌─────────────────────────────────────┐
│          User / Upstream Agent       │
│   (provides research task or query)  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         Research Taste Agent         │
│                                     │
│  Evaluates: Should we pursue this?  │
│  Operations: Landscape, Compress,   │
│    Predict, Dead-End, Simplify,     │
│    Cross-Pollinate                  │
│                                     │
│  Output: proceed / simplify /       │
│          defer / kill               │
└──────────────┬──────────────────────┘
               │ (if proceed)
               ▼
┌─────────────────────────────────────┐
│       Task Characterizer             │
│                                     │
│  Maps the task to behavioral        │
│  coordinates in the 5D space        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       Workflow Composer              │
│                                     │
│  1. Retrieve top workflows from     │
│     relevant behavioral region      │
│  2. Identify reusable sub-          │
│     techniques across workflows     │
│  3. Generate novel composed plan    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       Research Executor              │
│                                     │
│  Executes the composed workflow     │
│  using MCP tools (Exa, Semantic     │
│  Scholar, arxiv, GitHub, etc.)      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       Output Evaluator               │
│                                     │
│  Scores: Coherence, Grounding,      │
│    Compression, Surprise,           │
│    Actionability                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       Library Updater                │
│                                     │
│  If fitness > current cell          │
│  occupant → replace                 │
│  Archive displaced workflow         │
│  Log lineage (parent workflows)     │
└─────────────────────────────────────┘
```

---

## Part 5: Implementation Notes

### Starting Small

The full system described above is the target architecture. For an MVP:

1. **Start with the seed library and the composition step.** This alone — giving an agent a library of research strategies to draw from instead of a single hardcoded approach — is a significant improvement over current deep research implementations.

2. **Add the Taste Agent as a pre-filter.** Even without all the MCP tools, the compression test and simplicity audit are pure inference-time operations that cost nothing to run.

3. **Add fitness evaluation and library updates once you have enough usage data.** You need at least ~50 executed workflows before the evolutionary dynamics become meaningful.

4. **Build the custom MCP servers (graveyard, cost estimator, structural analogy) as the system matures** and you can identify which tool gaps are actually bottlenecking quality.

### Persistence

- The workflow library should be stored as a directory of YAML/Markdown files, one per workflow.
- The archive of displaced workflows should be maintained indefinitely.
- Lineage tracking (which parent workflows contributed to a new one) enables post-hoc analysis of which sub-techniques are most frequently recombined — these are the "genes" that confer general fitness.

### Observability

Log the following for every research run:
- Task characterization (behavioral coordinates)
- Which workflows were retrieved
- Which sub-techniques were selected and why
- The composed plan
- Execution trace (which tools called, what was retrieved)
- Output quality scores
- Whether the workflow replaced an existing library entry

This log is itself a valuable dataset for understanding what makes research workflows effective.