---
name: synthesize
description: Fuse insights from multiple knowledge sources (code, docs, memory, research, web) into coherent understanding. Use when you have scattered information that needs integration.
argument-hint: [topic to synthesize]
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, WebFetch, WebSearch
---

Synthesize knowledge on this topic: $ARGUMENTS

## Process

### 1. Source Inventory

Identify relevant knowledge sources across these categories:

| Source Type | Where to Look |
|---|---|
| **Code** | Current codebase (Glob/Grep), implementation patterns, tests, comments |
| **Documentation** | Specs, READMEs, ADRs, API docs in the repo |
| **Memory** | `.claude/` project memory, agent memory, previous learnings |
| **External research** | WebSearch, Exa for papers, blog posts, community discussion |
| **Issue history** | `bd list`, closed issues, decision rationale |

Scan at least 3 source types. Don't rely on a single category.

### 2. Extract & Classify

For each source, extract:
- **Claims** — specific assertions about the topic
- **Patterns** — recurring approaches or structures
- **Conflicts** — where sources disagree
- **Gaps** — what no source addresses

### 3. Integration

Three integration strategies, used as appropriate:

**Convergent** — Multiple sources agree. High confidence. Extract the common principle.

**Divergent** — Sources disagree. Analyze *why* (different contexts? different values? different data?). Don't force resolution — document the conditions under which each view applies.

**Complementary** — Sources cover different facets. Weave into a complete picture, noting which source contributed which piece.

### 4. Output

```
## Synthesis: [Topic]

### Sources Consulted
- [Source type]: [what was found]

### Convergent Findings (high confidence)
- [Finding]: supported by [sources]

### Divergent Findings (context-dependent)
- [Claim A] (applies when [X]) vs. [Claim B] (applies when [Y])

### Gaps
- [What no source addressed]

### Integrated Understanding
[Coherent narrative combining all sources — the actual synthesis]

### Confidence Assessment
[Overall confidence and what would increase it]

### Actionable Next Steps
[What to do with this understanding]
```
