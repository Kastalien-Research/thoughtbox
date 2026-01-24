---
type: exploration
speed: slow
scope: session
interface_version: loop-interface@1.0
description: Understand the problem space before committing to solution boundaries.
---
# Problem Space Exploration Loop

Understand the problem space before committing to solution boundaries.

**Version**: 1.0.0
**Interface**: loop-interface@1.0

## Classification

- **Type**: exploration
- **Speed**: slow (~2-5 minutes)
- **Scope**: session

## Interface

### Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| prompt | Text | yes | User's request or problem statement |
| codebase_context | Text | no | Summary of relevant codebase areas |
| constraints | List<Text> | no | Known constraints or requirements |
| prior_unknowns | List<Unknown> | no | Previously identified unknowns (for resume) |

### Outputs

| Name | Type | Description |
|------|------|-------------|
| explicit_requirements | List<Text> | Requirements explicitly stated in prompt |
| implicit_requirements | List<Text> | Requirements implied but not stated |
| existing_patterns | List<PatternMatch> | Patterns found in codebase |
| domain_context | List<Text> | External context gathered |
| unknowns | List<Unknown> | Questions that need resolution |
| stakeholder_concerns | Map<Stakeholder, List<Concern>> | Concerns by stakeholder type |
| scope_estimate | ScopeEstimate | Estimated scope and complexity |
| spec_inventory | List<SpecSummary> | Specs needed (if proceeding) |
| decision | Decision | Loop outcome (clarify/decompose/research/proceed) |

### State

| Field | Type | Description |
|-------|------|-------------|
| iteration | Number | Current iteration count |
| confidence | Score | Confidence in current understanding |
| clarifications | List<QA> | User clarifications received |

## OODA Phases

### OBSERVE

Gather information about the problem space:

```
1. PARSE prompt for explicit signals:
   - Action verbs → what needs to happen (implement, add, refactor, fix)
   - Nouns → entities and concepts involved
   - Qualifiers → constraints (fast, secure, simple)
   - Scope markers → boundaries (only, all, except)

2. SEARCH codebase for implicit context:
   → SemanticSearch: "What is the existing architecture for [topic]?"
   → SemanticSearch: "How is [concept] currently implemented?"
   → Grep: patterns matching key terms
   → Glob: related file structures

3. SEARCH external sources (if domain_research enabled):
   → WebSearch: "[topic] best practices"
   → WebSearch: "[technology] architecture patterns"

4. CATALOG unknowns:
   → What decisions haven't been made?
   → What constraints aren't specified?
   → What edge cases aren't addressed?
   → What terminology is ambiguous?

5. RECORD all signals:
   explicit_requirements ← parsed requirements
   implicit_requirements ← inferred requirements
   existing_patterns ← code matches with fit scores
   domain_context ← external knowledge
   unknowns ← questions needing answers
```

### ORIENT

Interpret gathered information through multiple lenses:

```
1. PATTERN MATCHING:
   For each existing_pattern:
     → How well does it fit the requirements?
     → What are the trade-offs if we extend it?
     → What would we need to change?
   
   For each domain_context item:
     → Does this suggest an architecture?
     → Are there proven patterns we should use?

2. STAKEHOLDER MODELING:
   
   AS developer:
     → What will be hard to implement?
     → What will be hard to test?
     → What will be hard to maintain?
   
   AS user:
     → What could go wrong from their perspective?
     → What do they actually need (vs what they asked for)?
     → What would delight them?
   
   AS operator:
     → What could break in production?
     → How will this be monitored?
     → How will this be deployed?
   
   AS security:
     → What could be exploited?
     → Where are the trust boundaries?
     → What data is sensitive?

3. SCOPE ESTIMATION:
   
   Count requirements → requirement_count
   Assess complexity per requirement → complexity_scores
   Check for dependencies → dependency_graph
   
   scope_estimate = {
     spec_count: estimated number of specs needed,
     complexity: low | medium | high | very_high,
     confidence: how sure are we about this estimate
   }

4. UNKNOWN PRIORITIZATION:
   
   For each unknown:
     → HIGH: Blocks all progress, must resolve first
     → MEDIUM: Affects design but can proceed with assumptions
     → LOW: Nice to know, can defer
   
   critical_unknowns = filter(unknowns, importance == "high")
```

### DECIDE

Choose next action based on orientation:

```
DECISION TREE:

IF critical_unknowns.length > 0:
  decision = "clarify"
  action = generate_clarifying_questions(critical_unknowns)
  
ELIF scope_estimate.complexity == "very_high" AND scope_estimate.spec_count > MAX_SPECS:
  decision = "decompose"
  action = split_into_subproblems()
  
ELIF max(pattern.fit_score for pattern in existing_patterns) < 0.6:
  decision = "research"
  action = expand_search_scope()
  
ELIF confidence < CONFIDENCE_THRESHOLD AND iteration < MAX_ITERATIONS:
  decision = "iterate"
  action = refine_understanding()
  
ELSE:
  decision = "proceed"
  action = generate_spec_inventory()

CONFIDENCE FACTORS:
  + 0.1 for each clarified unknown
  + 0.1 for each high-fit pattern found
  + 0.1 for comprehensive stakeholder analysis
  - 0.1 for each remaining critical unknown
  - 0.1 for scope_estimate.complexity == "very_high"
```

### ACT

Execute the decided action:

```
IF decision == "clarify":
  FORMAT clarifying questions:
  
  """
  CLARIFICATION NEEDED:
  
  Before proceeding, please clarify:
  
  1. [HIGH] {unknown.question}
     Options: {generated_options}
  
  2. [MEDIUM] {unknown.question}
     ...
  """
  
  WAIT for user response
  UPDATE unknowns with answers
  RETURN to OBSERVE

IF decision == "decompose":
  SPLIT problem into sub-problems:
  
  For each sub_problem:
    SPAWN child exploration loop
    child_input = {
      prompt: sub_problem.description,
      constraints: sub_problem.constraints,
      prior_unknowns: relevant unknowns
    }
  
  MERGE child outputs into unified spec_inventory
  RETURN merged results

IF decision == "research":
  EXPAND search scope:
  
  → Search for related specifications in docs/
  → Search for similar open source projects
  → Search for architectural patterns by name
  
  ADD new context to domain_context
  RETURN to OBSERVE

IF decision == "proceed":
  GENERATE spec inventory:
  
  spec_inventory = []
  
  For each logical unit identified:
    spec = {
      name: descriptive_name,
      scope_summary: what this spec covers,
      requirements: assigned requirements,
      dependencies: other specs this depends on,
      complexity: estimated complexity,
      status: "pending"
    }
    spec_inventory.append(spec)
  
  ORDER specs by dependency (topological sort)
  
  EMIT signal: exploration_complete
  RETURN spec_inventory
```

## Termination Conditions

- **Success**: `decision == "proceed"` with `confidence >= CONFIDENCE_THRESHOLD`
- **Failure**: User cancels during clarification, or decomposition fails
- **Timeout**: `iteration >= MAX_ITERATIONS` (default 3) → force proceed with caveats

## Composition

### Can contain (nested loops)
- `exploration/problem-space` (for recursive decomposition)
- `exploration/domain-research` (for expanded context)

### Can be contained by
- Workflow commands (`/spec-designer`, `/implement-spec`)
- Orchestration loops (`orchestration/queue-processor`)

### Parallelizable
- Conditional: Yes for decomposed sub-problems, No for single problem

## Signals Emitted

| Signal | When | Payload |
|--------|------|---------|
| `clarification_requested` | Need user input | `{ questions: List<Question> }` |
| `decomposition_started` | Splitting into sub-problems | `{ sub_problems: List<SubProblem> }` |
| `research_expanded` | Expanding search scope | `{ new_queries: List<Query> }` |
| `exploration_complete` | Ready to proceed | `{ spec_inventory, confidence, unknowns }` |
| `exploration_timeout` | Max iterations reached | `{ partial_results, caveats }` |

## Example Usage

```markdown
## Phase 1: Exploration

Execute @loops/exploration/problem-space.md with:
  INPUT:
    prompt: "Add real-time collaboration to document editor"
    codebase_context: (gathered from initial scan)
  
  CONFIG:
    MAX_ITERATIONS: 3
    CONFIDENCE_THRESHOLD: 0.8
    MAX_SPECS: 5
  
  ON clarification_requested:
    PRESENT questions to user
    FEED answers back to loop
  
  ON exploration_complete:
    PROCEED to authoring phase with spec_inventory
```

## Quality Checklist

Before transitioning to next phase, verify:

- [ ] All HIGH-priority unknowns resolved (or documented as assumptions)
- [ ] Stakeholder concerns captured for each perspective
- [ ] Scope boundaries explicitly stated (what's IN and OUT)
- [ ] Spec inventory has clear dependencies
- [ ] Complexity estimates are justified
- [ ] No circular dependencies in spec inventory
