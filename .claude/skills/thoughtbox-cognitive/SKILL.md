---
name: thoughtbox-cognitive
description: Cognitive enhancement toolkit combining non-linear reasoning, mental models, and literate programming. Use for complex analysis, system design, debugging, and deep learning workflows.
---

# Thoughtbox Cognitive Enhancement Skill

This skill teaches you to use the Thoughtbox MCP server as a comprehensive cognitive enhancement toolkit. It combines three powerful tools for structured reasoning, mental frameworks, and executable documentation.

## When to Use This Skill

Invoke this skill when facing:
- **Complex multi-step problems** requiring structured reasoning
- **Architecture and design decisions** with competing trade-offs
- **Debugging sessions** where root cause is unclear
- **Deep learning workflows** requiring validated understanding
- **Research and analysis** needing synthesis across sources
- **Decision-making** under uncertainty with multiple options

## Available Tools

### 1. `thoughtbox` - Non-Linear Reasoning Engine

Step-by-step thinking with 7 core patterns. Not just sequential - supports branching, revision, and interleaved thinking.

**Core Parameters:**
```javascript
thoughtbox({
  thought: "Your reasoning step",
  thoughtNumber: 1,          // Logical position (not chronological)
  totalThoughts: 10,         // Estimated total (adjustable)
  nextThoughtNeeded: true,   // Continue or conclude
  // Optional extensions:
  isRevision: true,          // Updating previous thought
  revisesThought: 3,         // Which thought to revise
  branchFromThought: 5,      // Create alternative path
  branchId: "option-a",      // Branch identifier
  includeGuide: true         // Request patterns cookbook
})
```

### 2. `mental_models` - Structured Reasoning Frameworks

15 mental models providing process scaffolds for HOW to think, not WHAT to think.

**Operations:**
```javascript
// Discover relevant models
mental_models({ operation: "list_models", args: { tag: "debugging" } })

// Retrieve full framework
mental_models({ operation: "get_model", args: { model: "five-whys" } })

// List all tags
mental_models({ operation: "list_tags", args: {} })
```

### 3. `notebook` - Literate Programming Environment

Interactive notebooks with JavaScript/TypeScript execution for validated reasoning.

**Key Operations:**
```javascript
// Create notebook (optionally with template)
notebook({ operation: "create", args: {
  title: "Analysis",
  language: "typescript",
  template: "sequential-feynman"  // For deep learning workflows
}})

// Add and execute code
notebook({ operation: "add_cell", args: {
  notebookId: "...",
  cellType: "code",
  content: "console.log('validated!');",
  filename: "test.ts"
}})

notebook({ operation: "run_cell", args: { notebookId: "...", cellId: "..." }})
```

---

## Core Cognitive Workflows

### Workflow 1: Complex Problem Analysis

Use when: Problem is multi-faceted, unclear scope, needs structured decomposition.

**Process:**

1. **Ground with Mental Model**
   ```javascript
   mental_models({ operation: "get_model", args: { model: "decomposition" } })
   ```

2. **Initiate Thoughtbox Session**
   ```javascript
   thoughtbox({
     thought: "Problem statement: [clearly define what we're solving]",
     thoughtNumber: 1,
     totalThoughts: 15,
     nextThoughtNeeded: true
   })
   ```

3. **Decompose Using Framework**
   - Apply decomposition model to break into sub-problems
   - Use thoughts 2-5 for identifying natural seams
   - Each sub-problem becomes a branch opportunity

4. **Explore Branches for Alternatives**
   ```javascript
   thoughtbox({
     thought: "Approach A: [describe approach]",
     thoughtNumber: 6,
     totalThoughts: 15,
     branchFromThought: 5,
     branchId: "approach-a",
     nextThoughtNeeded: true
   })
   ```

5. **Synthesize in Final Thoughts**
   - Compare branches
   - Apply trade-off-matrix mental model if needed
   - Conclude with actionable recommendation

### Workflow 2: Debugging with Root Cause Analysis

Use when: Bug exists but cause unclear, symptoms misleading.

**Process:**

1. **Apply Five-Whys Framework**
   ```javascript
   mental_models({ operation: "get_model", args: { model: "five-whys" } })
   ```

2. **Start with Backward Thinking**
   ```javascript
   thoughtbox({
     thought: "Failure state: [describe the symptom precisely]",
     thoughtNumber: 8,  // Start at end state
     totalThoughts: 8,
     nextThoughtNeeded: true
   })
   ```

3. **Work Backward Through Causal Chain**
   - Thought 7: "Why did this happen?" → immediate cause
   - Thought 6: "Why did THAT happen?" → deeper cause
   - Continue until reaching systemic root cause

4. **Apply Rubber Duck if Stuck**
   ```javascript
   mental_models({ operation: "get_model", args: { model: "rubber-duck" } })
   ```
   Then use thoughts to explain code line-by-line.

5. **Validate with Notebook**
   ```javascript
   notebook({ operation: "create", args: {
     title: "Bug Validation",
     language: "typescript"
   }})
   ```
   Write executable test case to confirm root cause.

### Workflow 3: Architecture Decision Record

Use when: Major technical decision with long-term implications.

**Process:**

1. **Pre-mortem the Decision**
   ```javascript
   mental_models({ operation: "get_model", args: { model: "pre-mortem" } })
   ```

2. **Use Backward Thinking from Success**
   ```javascript
   thoughtbox({
     thought: "Success state: System handles requirements with these properties...",
     thoughtNumber: 10,
     totalThoughts: 10,
     nextThoughtNeeded: true
   })
   ```

3. **Explore Options via Branching**
   Create branches for each architectural option:
   - Branch "option-sql": Relational database approach
   - Branch "option-nosql": Document store approach
   - Branch "option-hybrid": Combined approach

4. **Apply Trade-off Matrix**
   ```javascript
   mental_models({ operation: "get_model", args: { model: "trade-off-matrix" } })
   ```

5. **Document in Notebook**
   Create ADR notebook with:
   - Context and problem statement
   - Options considered (from branches)
   - Decision rationale
   - Consequences and trade-offs

### Workflow 4: Deep Learning (Sequential Feynman)

Use when: Need to deeply understand a complex topic with validated comprehension.

**Process:**

1. **Create Feynman Notebook**
   ```javascript
   notebook({ operation: "create", args: {
     title: "React Server Components",
     language: "typescript",
     template: "sequential-feynman"
   }})
   ```

2. **Follow Template Phases:**
   - **Phase 1**: Research & Synthesis - gather sources, identify gaps
   - **Phase 2**: Feynman Explanation - explain to intelligent novice
   - **Phase 3**: Refinement Cycles - use thoughtbox to analyze and improve
   - **Phase 4**: Expert Re-encoding - extract patterns for rapid application

3. **Use Thoughtbox for Refinement Analysis**
   ```javascript
   thoughtbox({
     thought: "Analyzing explanation for technical errors, gaps, and unclear sections",
     thoughtNumber: 1,
     totalThoughts: 5,
     nextThoughtNeeded: true
   })
   ```

4. **Validate Understanding with Executable Code**
   Add code cells to notebook demonstrating concepts.

### Workflow 5: Interleaved Reasoning (Research → Action Loops)

Use when: Task requires alternating between reasoning and tool execution.

**Process:**

1. **Inventory Available Tools** (Thought 1-2)
   List all MCP tools and their capabilities.

2. **Assess Sufficiency** (Thought 3)
   Determine if tools can complete the task.

3. **Strategize with Backward Planning** (Thoughts 4-8)
   Start from goal, work back to define strategy.

4. **Execute with Interleaved Loop:**
   ```
   WHILE task not complete:
     1. Use thoughtbox to reason about next step
     2. Execute appropriate tool action
     3. Use thoughtbox to integrate results
     4. Reassess and adjust strategy
   END WHILE
   ```

5. **Gate Checkpoints**
   Define milestones to validate progress before proceeding.

---

## Mental Model Selection Guide

### By Task Type

| Task | Recommended Models |
|------|-------------------|
| Debugging | rubber-duck, five-whys, inversion |
| Planning | decomposition, pre-mortem, time-horizon-shifting |
| Decision-making | trade-off-matrix, opportunity-cost, steelmanning |
| Risk analysis | pre-mortem, adversarial-thinking, inversion |
| Estimation | fermi-estimation |
| Prioritization | impact-effort-grid, trade-off-matrix |
| Communication | rubber-duck, abstraction-laddering |
| Architecture | decomposition, constraint-relaxation, abstraction-laddering |
| Validation | assumption-surfacing, steelmanning, adversarial-thinking |

### Quick Access by Tag

```javascript
// Find debugging models
mental_models({ operation: "list_models", args: { tag: "debugging" } })

// Find decision models
mental_models({ operation: "list_models", args: { tag: "decision-making" } })
```

---

## Thinking Pattern Selection

### Forward Thinking (1→N)
**Use for:** Exploration, discovery, brainstorming, open-ended analysis

### Backward Thinking (N→1)
**Use for:** Goal-driven planning, system design, working from known end states

### Branching
**Use for:** Comparing alternatives, A/B scenarios, exploring multiple approaches

### Revision
**Use for:** Updating when new information emerges, correcting earlier reasoning

### Interleaved
**Use for:** Tool-coordinated reasoning, research tasks, adaptive execution

### First Principles
**Use for:** Innovation, challenging assumptions, deep understanding

---

## Integration Patterns

### Mental Model → Thoughtbox
1. Retrieve mental model framework
2. Use thoughtbox to apply framework step-by-step
3. Framework provides structure; thoughtbox tracks reasoning

### Thoughtbox → Notebook
1. Use thoughtbox to reason about approach
2. Create notebook to validate reasoning with code
3. Execute cells to confirm understanding

### Full Integration
1. Start with mental model for framework
2. Use thoughtbox for structured reasoning
3. Create notebook for executable validation
4. Iterate between all three as needed

---

## Anti-Patterns to Avoid

1. **Sequential rigidity** - Don't force 1→2→3 if jumping makes sense
2. **Over-branching** - Keep branches under 5 for synthesize-ability
3. **Revision abuse** - Don't constantly revise without forward progress
4. **Premature convergence** - Explore alternatives before deciding
5. **Under-estimation** - Better to set higher totalThoughts and finish early
6. **Tool fixation** - Use the right tool for each phase, not one tool for everything

---

## Quick Start Examples

### Example 1: Quick Analysis
```javascript
// Start reasoning session
thoughtbox({
  thought: "Analyzing the performance issue: symptoms are...",
  thoughtNumber: 1,
  totalThoughts: 8,
  nextThoughtNeeded: true
})
```

### Example 2: With Mental Model
```javascript
// Get framework
mental_models({ operation: "get_model", args: { model: "five-whys" } })

// Apply it
thoughtbox({
  thought: "Why 1: The API is slow because...",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

### Example 3: Validated Understanding
```javascript
// Create executable notebook
notebook({ operation: "create", args: {
  title: "Concept Validation",
  language: "typescript"
}})

// Add verification code
notebook({ operation: "add_cell", args: {
  notebookId: "...",
  cellType: "code",
  content: "// Code that demonstrates understanding",
  filename: "validate.ts"
}})

// Execute to confirm
notebook({ operation: "run_cell", args: {
  notebookId: "...",
  cellId: "..."
}})
```

---

## Resources

For detailed reference material, see:
- **REFERENCE.md** - Complete mental models catalog with all 15 frameworks
- **PATTERNS.md** - Thinking patterns cookbook with examples
- **NOTEBOOK-WORKFLOWS.md** - Literate programming patterns and templates
- **examples/** - Complete workflow examples for common scenarios

## Key Insight

The Thoughtbox toolkit provides **infrastructure for cognition**, not intelligence. These tools tell you HOW to think, not WHAT to think. Use them as scaffolding for your reasoning process, adapting and combining as the problem demands.
