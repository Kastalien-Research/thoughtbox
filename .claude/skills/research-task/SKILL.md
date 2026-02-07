---
name: research-task
description: Execute a research task using compositional workflow planning. Characterizes the task, selects an approach from a library of research strategies, executes it, and self-evaluates output quality.
argument-hint: [research question or topic]
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, WebFetch, WebSearch
---

Research this topic: $ARGUMENTS

## Workflow

### Phase 1: Task Characterization

Rate the research task on each dimension (1-5):

| Dimension | 1 (Low) | 5 (High) |
|---|---|---|
| **Scope** | Point question (single fact) | Frontier mapping (state of entire field) |
| **Domain structure** | Single field, established methods | Distant cross-domain analogy |
| **Evidence type** | Empirical data, measurements | Theoretical arguments, first-principles |
| **Time horizon** | What's true right now | What could become true (speculative) |
| **Fidelity** | Ballpark / directional | Rigorous / publication-grade |

### Phase 1b: Workflow Library Query

Query the MAP-Elites workflow library for strategies matching this task's coordinates:

```bash
sqlite3 research-workflows/workflows.db "SELECT id, name, archetype, fitness_score FROM workflows WHERE status IN ('active', 'seed') ORDER BY fitness_score DESC LIMIT 10;"
```

For more targeted retrieval, filter by behavioral region:
```bash
sqlite3 research-workflows/workflows.db "SELECT w.id, w.name, ws.name as step_name, ws.description, ws.rationale FROM workflows w JOIN workflow_steps ws ON w.id = ws.workflow_id WHERE w.archetype = '<archetype>' AND w.status IN ('active', 'seed') ORDER BY w.fitness_score DESC, ws.step_order;"
```

Use retrieved workflows to inform Phase 2 strategy selection. Prefer workflows with high fitness scores and usage counts.

### Phase 2: Strategy Selection

Based on the characterization and library query, select the most appropriate research archetype:

**Exploratory** (high scope, moderate fidelity)
- Quick landscape scan — 15-minute overview of a new area
- Deep literature review — comprehensive survey of a mature field
- Trend detection — what's gaining momentum
- White space identification — what isn't being worked on that should be

**Confirmatory** (low scope, high fidelity)
- Fact-checking pipeline — verify specific claims with primary sources
- Consensus mapping — what do experts agree/disagree on
- Replication check — has this finding held up under scrutiny

**Analytical** (moderate scope, high evidence)
- Compare and contrast — systematic comparison of N approaches
- Root cause analysis — why did X happen / why doesn't X work
- Cost-benefit analysis — should we do X given tradeoffs
- Forecasting — given current trends, what's likely

**Generative** (high domain structure, moderate time horizon)
- Cross-domain transfer — find solutions from field B for problems in field A
- First-principles derivation — reason from fundamentals, not literature
- Synthesis — combine N existing ideas into a novel framework
- Adversarial stress-test — find the strongest objections to X

**Applied** (low time horizon, high fidelity)
- Technical feasibility assessment — can X be built with current tools
- Build-vs-buy analysis — build or use existing solution
- Implementation planning — how to execute X given constraints

### Phase 3: Compositional Planning

Don't just pick one strategy. Identify which *sub-techniques* from multiple strategies suit this specific task:

1. Select 2-3 relevant archetypes from Phase 2
2. For each, identify the steps that apply to this task
3. Note *why* each step exists (what it optimizes for)
4. Compose a novel workflow combining the best elements
5. Record which elements were borrowed from which archetype

### Phase 4: Execution

Execute the composed workflow using available tools:
- **WebSearch** — broad web queries
- **Exa** (`web_search_exa`, `web_search_advanced_exa`) — semantic/neural search, cross-domain retrieval
- **WebFetch** — deep read of specific URLs
- **Firecrawl** (`firecrawl_scrape`, `firecrawl_search`) — structured web scraping
- **GitHub** — repository search, code search, trending
- **Read/Glob/Grep** — local codebase and documentation

### Phase 5: Self-Evaluation

Score your output on each dimension (0-1):

1. **Coherence** — Does it tell a consistent story? Internal contradictions?
2. **Grounding** — Are claims supported by retrieved evidence?
3. **Compression** — Can key findings be stated concisely? (If not, thesis may be unclear)
4. **Surprise** — Did anything non-obvious surface? (Confirming the known has low value)
5. **Actionability** — Does the output enable a decision or next step?

Report the scores honestly. Low scores on surprise or actionability are useful signals — they indicate the research question may need reframing.

### Phase 5b: Library Update

Log this execution and update the workflow library:

```bash
# Log the execution
sqlite3 research-workflows/workflows.db "INSERT INTO executions (task_description, task_scope, task_domain_structure, task_evidence_type, task_time_horizon, task_fidelity, score_coherence, score_grounding, score_compression, score_surprise, score_actionability, score_composite) VALUES ('<description>', <scope>, <domain>, <evidence>, <horizon>, <fidelity>, <coherence>, <grounding>, <compression>, <surprise>, <actionability>, <composite>);"
```

If composite score exceeds the current occupant of this behavioral region, the composed workflow becomes a candidate for library insertion.

### Phase 6: Output

```
## Research: [Topic]

### Characterization
Scope: [1-5] | Domain: [1-5] | Evidence: [1-5] | Horizon: [1-5] | Fidelity: [1-5]

### Strategy
[Which archetypes were combined and why]

### Findings
[Structured findings — use headers, tables, or lists as appropriate]

### Quality Assessment
Coherence: [0-1] | Grounding: [0-1] | Compression: [0-1] | Surprise: [0-1] | Actionability: [0-1]

### Key Takeaway
[Single paragraph — the compressed thesis]

### Recommended Next Steps
[What to do with these findings]
```
