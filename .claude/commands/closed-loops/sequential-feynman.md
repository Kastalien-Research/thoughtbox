---
description: Use Feynman Technique + Sequential Thinking to deeply validate understanding before creating skills or documentation
---

# Feynman + Sequential Thinking Refinement Workflow

**Topic**: $ARGUMENTS

**Usage**:
- `/sequential-feynman distributed tracing systems`
- `/sequential-feynman React Server Components`
- `/sequential-feynman MCP client architecture`
- `/sequential-feynman` (will ask for topic if not provided)

---

## Task

Create a deeply validated skill for: **$ARGUMENTS**

If `$ARGUMENTS` is empty, ask the user: "What topic should I create a skill for?"

Once topic is determined, set these variables:
```
TOPIC="$ARGUMENTS"
SKILL_NAME=$(echo "$TOPIC" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
NOTEBOOK_PATH="notebooks/feynman-${SKILL_NAME}.ipynb"
SKILL_PATH=".claude/skills/${SKILL_NAME}/"
```

Then execute the following workflow:

## Execution Plan

**Use TodoWrite to track progress through these phases:**

```
Phase 1: Research & Synthesis (Low Friction)
  ↓
Phase 2: Feynman Explanation (High Friction - forces gaps to surface)
  → Create Jupyter notebook at $NOTEBOOK_PATH
  ↓
Phase 3: Sequential Thinking Analysis (3 Cycles)
  → Cycle 1: Find errors, major omissions → Refine notebook
  → Cycle 2: Add depth, polish → Refine notebook
  → Cycle 3: Final validation → Refine notebook
  ↓
Phase 4: Re-encode for Expert Use (Low Friction, High Signal)
  → Create skill at $SKILL_PATH in pattern-dense format
```

**Todo List Example:**
```
[in_progress] Research $TOPIC documentation and implementations
[pending] Create Feynman notebook for $TOPIC
[pending] Sequential thinking analysis - Cycle 1
[pending] Refine notebook - Cycle 1
[pending] Sequential thinking analysis - Cycle 2
[pending] Refine notebook - Cycle 2
[pending] Sequential thinking analysis - Cycle 3
[pending] Refine notebook - Cycle 3
[pending] Create $SKILL_NAME skill from validated notebook
```

## When to Use This Workflow

✅ **Use when:**
- Creating complex new skills from research
- Building production-critical documentation
- Learning unfamiliar technical domains
- Need to validate understanding before teaching others
- High stakes: errors would be costly

❌ **Don't use when:**
- Simple, well-understood tasks
- Time-sensitive quick documentation
- Concepts you already deeply understand
- Low-stakes exploratory work

## The Process

### Step 1: Research & Synthesis
Gather authoritative sources on the topic. Use web search, fetch documentation, and analyze existing implementations. Create a comprehensive understanding of:
- Core concepts and mental models
- Technical specifications and requirements
- Best practices and anti-patterns
- Real-world usage patterns

### Step 2: Create Feynman Notebook

**Create**: `$NOTEBOOK_PATH`

Explain ALL major concepts as if teaching an intelligent 8-year-old:

**Key principles:**
- Use simple analogies (restaurants, walkie-talkies, etc.)
- Concrete examples for every abstract concept
- Focus on WHY things work, not just HOW
- Short sentences, clear language
- If you can't explain it simply, you don't understand it yet

**Notebook structure:**
```markdown
# Understanding [Topic]: Explained Simply

## What We're Learning Today
[Hook with relatable scenario]

## Part 1: The [Main Analogy]
[Core mental model using familiar concepts]

## Part 2: The Problem This Solves
[Why this technology exists]

## Part 3-10: [Progressive complexity]
[Each section builds on previous]

## Summary: What We Learned
[Review all key concepts]
```

### Step 3: Sequential Thinking Analysis (3 Cycles)

**Cycle 1 - Find Major Issues:**
```
Use mcp__sequential-thinking__sequentialthinking tool to analyze:
- Technical accuracy errors
- Major conceptual omissions
- Unclear or confusing explanations
- Missing important examples
```

**After Cycle 1:** Refine notebook, add missing content, fix errors

**Cycle 2 - Add Depth:**
```
Sequential thinking focuses on:
- Flow and organization
- Clarity of technical concepts
- Completeness of coverage
- Age-appropriateness of language
```

**After Cycle 2:** Polish explanations, improve analogies, integrate sections

**Cycle 3 - Final Polish:**
```
Sequential thinking checks:
- Overall coherence
- Consistency of analogies
- Readability and engagement
- No remaining gaps
```

**After Cycle 3:** Final refinements, verify no errors remain

### Step 4: Re-encode for Expert Use

Now that understanding is validated, create the actual skill/documentation in **high-signal, low-friction format**:

**Characteristics:**
- Pattern-dense with code examples
- Decision tables and lookup charts
- If-then logic, not narrative
- Anti-patterns explicitly marked (❌)
- Checklists for validation
- Hierarchical for easy scanning
- ASCII diagrams for mental models

**Format example:**
```markdown
## Core Mental Model

```
[ASCII diagram of architecture]
```

## Pattern: [Name]

```typescript
// Code example with inline explanation
class Example {
  // ✅ CORRECT: Pattern shown
  // ❌ WRONG: Anti-pattern shown
}
```

| Decision | Use When | Pros | Cons |
|----------|----------|------|------|
[Lookup table]
```

### Step 5: Document the Process

Store artifacts using the defined variables:
- **Feynman Notebook**: `$NOTEBOOK_PATH`
- **Sequential Thinking Notes**: Embedded in notebook markdown cells
- **Final Skill**: `$SKILL_PATH` with SKILL.md + reference files
- **Workflow Reference**: `.claude/workflows/feynman-sequential-thinking-workflow.md`

## Example Invocation

**Example 1: With arguments**
```
User: /sequential-feynman distributed consensus algorithms

Claude:
TOPIC="distributed consensus algorithms"
SKILL_NAME="distributed-consensus-algorithms"
NOTEBOOK_PATH="notebooks/feynman-distributed-consensus-algorithms.ipynb"
SKILL_PATH=".claude/skills/distributed-consensus-algorithms/"

Starting workflow:

Step 1: Research & Synthesis
[Searches for Paxos, Raft, Byzantine fault tolerance docs...]

Step 2: Creating Feynman Notebook
[Creates notebooks/feynman-distributed-consensus-algorithms.ipynb]
[Explains consensus using voting/democracy analogies for 8-year-olds]

Step 3: Sequential Thinking - Cycle 1
[Analyzes notebook, finds omissions about leader election]

Step 4: Refine notebook...
[Continues through all 3 cycles]

Step 5: Create expert skill at .claude/skills/distributed-consensus-algorithms/
[Pattern-dense, code-first format]
```

**Example 2: Without arguments**
```
User: /sequential-feynman

Claude: "What topic should I create a skill for?"

User: "WebAssembly optimization techniques"

Claude:
TOPIC="WebAssembly optimization techniques"
SKILL_NAME="webassembly-optimization-techniques"
...
[Proceeds through workflow]
```

## Benefits of This Workflow

**Quality Assurance:**
- Exposes gaps in understanding that would become errors in documentation
- Forces deep comprehension through simplification
- Validates completeness through systematic analysis
- Results in higher-quality, more accurate skills

**Efficiency Paradox:**
- High friction during learning → Low friction during use
- Time invested upfront → Time saved avoiding errors
- Deep validation once → Trust the skill indefinitely

**Cognitive Benefits:**
- Building from first principles ensures understanding
- Multiple representations (simple + expert) aid recall
- Pattern recognition improves with dense encoding
- Teaching forces clarity of thought

## Output Artifacts

After running this workflow, you'll have:

1. **Validated Feynman Notebook** (`notebooks/feynman-[topic].ipynb`)
   - Proof of understanding
   - Teaching resource
   - Reference for explaining to others

2. **Expert Skill** (`.claude/skills/[skill-name]/SKILL.md`)
   - Production-ready documentation
   - High-signal, low-friction format
   - Optimized for rapid application

3. **Workflow Documentation** (`.claude/workflows/feynman-sequential-thinking-workflow.md`)
   - Process record
   - Reusable template

4. **Sequential Thinking Analysis** (embedded in notebook)
   - Error log
   - Improvement trail
   - Quality validation proof

## Customization Points

**Adjust Feynman target audience:**
- 8-year-old: Maximum simplification (default)
- High schooler: Allow some technical terms
- College student: More formal but still clear

**Adjust cycle count:**
- 2 cycles: Minimum viable (not recommended)
- 3 cycles: Standard (recommended)
- 4+ cycles: Mission-critical work

**Adjust final format:**
- Code-first: For implementation skills (default)
- Concept-first: For theoretical topics
- Hybrid: Mixed implementation + theory

## Success Criteria

You've successfully completed the workflow when:

- [ ] Feynman notebook explains all concepts with clear analogies
- [ ] 3 cycles of sequential thinking completed
- [ ] No technical errors remain
- [ ] No major omissions identified
- [ ] Final skill is in high-signal, low-friction format
- [ ] You can explain the topic clearly to both novices and experts
- [ ] All artifacts stored in standard locations
- [ ] Workflow provides confident understanding of material

---

## Quick Reference

**Command**: `/sequential-feynman $ARGUMENTS`

**Purpose**: Deep learning validation before creating skills

**Time investment**: 2-4 hours for complex topics

**Payoff**: Deeply validated, production-ready documentation that you trust

**Best for**: Complex technical skills, unfamiliar domains, high-stakes work

**Artifacts created**:
- `$NOTEBOOK_PATH` - Validated Feynman explanation
- `$SKILL_PATH` - Production-ready expert skill
- Todo tracking - Complete audit trail of the process
