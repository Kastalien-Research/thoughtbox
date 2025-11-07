# Sequential Feynman Template Notebook Specification

**Version**: 1.0
**Date**: 2025-11-07
**Status**: Design Specification

---

## Executive Summary

This specification describes a pre-templated Jupyter notebook that enables agents to perform the Sequential Feynman workflow without manually creating structure for each new topic. The template embeds guidance, prompts, and structure directly into the notebook, transforming it from a blank canvas into a "literate reasoning environment" that scaffolds deep understanding.

## The Problem

**Current State:**
- Agents must create notebook structure from scratch for each topic
- No guidance on what to write in each section
- Easy to skip important aspects (analogies, gap analysis, anti-patterns)
- Difficult to track which refinement cycle is active
- No built-in prompts to trigger deeper metacognition
- High cognitive overhead deciding "what goes where"

**User Impact:**
- More time spent on structure than learning
- Inconsistent quality across different topics
- Risk of incomplete analysis
- No reusable learning pattern

## The Vision: Guided Literate Reasoning

### Core Concept

A notebook that functions as an **embedded tutor** - it knows the Sequential Feynman process and guides the agent through each phase with:

- **Structural scaffolding**: Pre-organized cells matching workflow phases
- **Metacognitive prompts**: Questions that trigger deeper thinking
- **Progress tracking**: Visual indicators of which cycle/phase is active
- **Gap awareness**: Explicit spaces to note unknowns
- **Quality checkpoints**: Built-in criteria for self-assessment

### Key Design Principles

1. **Low Friction, High Guidance**: Structure without rigidity
2. **Progressive Disclosure**: Complexity builds naturally
3. **Explicit Gaps**: Unknowns are tracked, not hidden
4. **Cycle-Aware**: Clear markers for refinement iterations
5. **Reusable Pattern**: Same template works for any topic
6. **Export-Ready**: Natural path from notebook → skill artifact

---

## Template Structure

### Overall Organization

```
┌─────────────────────────────────────────┐
│ METADATA & PROGRESS TRACKING            │ ← Current cycle, topic, checklist
├─────────────────────────────────────────┤
│ PHASE 1: RESEARCH NOTES                 │ ← Capture initial findings
├─────────────────────────────────────────┤
│ PHASE 2: FEYNMAN EXPLANATION            │ ← Teach it simply
│   • Hook & Motivation                   │
│   • Core Analogy                        │
│   • Progressive Concepts (×6)           │
│   • Summary                             │
├─────────────────────────────────────────┤
│ PHASE 3: REFINEMENT CYCLES              │ ← 3 cycles of analysis
│   ├─ Cycle 1: Find Major Issues         │
│   ├─ Cycle 2: Add Depth                 │
│   └─ Cycle 3: Final Polish              │
├─────────────────────────────────────────┤
│ PHASE 4: EXPERT RE-ENCODING             │ ← Extract patterns
│   • Mental Models (ASCII diagrams)      │
│   • Code Patterns                       │
│   • Decision Tables                     │
│   • Anti-Patterns                       │
├─────────────────────────────────────────┤
│ META-REFLECTION                         │ ← What I learned
└─────────────────────────────────────────┘
```

---

## Detailed Cell-by-Cell Specification

### Section 0: Metadata & Progress Tracking

**Cell 1: Title & Topic** (Markdown)
```markdown
# 🧠 Sequential Feynman Learning: [TOPIC]

**Topic**: `[REPLACE WITH YOUR TOPIC]`
**Started**: [DATE]
**Current Phase**: Phase 1 - Research
**Refinement Cycle**: N/A

---

## Progress Checklist

- [ ] Phase 1: Research & Synthesis completed
- [ ] Phase 2: Initial Feynman Explanation written
- [ ] Phase 3, Cycle 1: Major issues identified & fixed
- [ ] Phase 3, Cycle 2: Depth added & polished
- [ ] Phase 3, Cycle 3: Final validation passed
- [ ] Phase 4: Expert skill created
```

**Purpose**: Single source of truth for progress; update as you advance.

---

### Section 1: Research Notes

**Cell 2: Research Goals** (Markdown)
```markdown
# Phase 1: Research & Synthesis

## What I Need to Learn

*Before diving into sources, clarify what I need to understand:*

- **Core Purpose**: Why does this technology/concept exist?
- **Key Mechanisms**: How does it actually work?
- **Mental Models**: What are the governing principles?
- **Usage Patterns**: How do practitioners actually use this?
- **Anti-Patterns**: What are common mistakes?
- **Trade-offs**: What are the costs and benefits?

---

## Sources & Key Findings

*Track authoritative sources and main takeaways:*
```

**Cell 3: Research Notes** (Markdown)
```markdown
### Source 1: [Title/URL]
- Key point 1
- Key point 2
- Questions raised:

### Source 2: [Title/URL]
- Key point 1
- Key point 2
- Questions raised:

### Source 3: [Title/URL]
- Key point 1
- Key point 2
- Questions raised:

*Add more sources as needed*
```

**Cell 4: Initial Confusions** (Markdown)
```markdown
## 🤔 What I Don't Understand Yet

*Be explicit about gaps - they're where the learning happens:*

1.
2.
3.

*This list should shrink as you progress through the notebook*
```

---

### Section 2: Feynman Explanation

**Cell 5: Hook & Motivation** (Markdown)
```markdown
# Phase 2: Feynman Explanation

## What We're Learning Today

*Start with a relatable scenario that hooks interest:*

[Imagine you're explaining this to an intelligent college freshman who asks "Why should I care about this?" - answer that question in 2-3 paragraphs using a concrete scenario they'd relate to]

**Example structure:**
- Relatable problem or scenario
- Why existing approaches fall short
- How this concept solves it
```

**Cell 6: Core Analogy** (Markdown)
```markdown
## The Core Mental Model: [Your Analogy]

*Pick ONE central analogy that captures the essence - restaurants, mail systems, orchestras, etc.*

**The Analogy:**

[Develop your analogy in detail - what maps to what?]

**The Mapping:**

| Real System Component | Analogy Equivalent | Why This Maps |
|----------------------|-------------------|---------------|
|                      |                   |               |
|                      |                   |               |

**Limitations of This Analogy:**

*Be honest about where the analogy breaks down:*
-
```

**Cell 7-12: Progressive Concepts** (Markdown × 6)
```markdown
## Concept 1: [Concept Name]

**In simple terms:**

[Explain using the analogy or simple language]

**Why this matters:**

[Connect to the larger picture]

**Concrete example:**

[Show a real, specific case]

---

*Repeat this structure for Concepts 2-6, building complexity gradually*
```

**Cell 13: Code Exploration** (Code)
```python
# If applicable: Concrete code example demonstrating the concept

# Example:
# [Show actual working code that demonstrates what you just explained]

# Expected output:
# [What should happen when this runs?]
```

**Cell 14: Summary** (Markdown)
```markdown
## Summary: What We Learned

*Recap the key insights without jargon:*

1. **Main Idea**:
2. **Why It Matters**:
3. **How It Works**:
4. **When to Use It**:
5. **When NOT to Use It**:

**The One-Sentence Explanation:**

[If you had to explain this entire topic in one sentence, what would it be?]
```

---

### Section 3: Refinement Cycles

**Cell 15: Cycle Overview** (Markdown)
```markdown
# Phase 3: Refinement Through Clear Thought Analysis

*This section tracks three refinement cycles. Each cycle has:*
- Pre-analysis questions to focus attention
- Space for clear_thought analysis results
- Action items for refinement
- Post-refinement validation

---
```

#### Cycle 1: Find Major Issues

**Cell 16: Cycle 1 - Pre-Analysis** (Markdown)
```markdown
## 🔍 Cycle 1: Finding Major Issues

**Current Status**: [Not Started | In Progress | Complete]

**Focus Areas for This Cycle:**
- Technical accuracy errors
- Major conceptual omissions
- Unclear or confusing explanations
- Missing critical examples
- Broken or weak analogies

**Prompt for clear_thought:**
> "Analyzing this Feynman explanation of [TOPIC] to identify technical errors, major conceptual gaps, unclear sections, and missing critical examples. Will be thorough and critical."
```

**Cell 17: Cycle 1 - Analysis Results** (Markdown)
```markdown
### Issues Identified

*After running clear_thought, document what needs fixing:*

#### Technical Errors
1.
2.

#### Conceptual Gaps
1.
2.

#### Unclear Explanations
1.
2.

#### Missing Examples
1.
2.

---

### Action Items

- [ ] Fix issue 1
- [ ] Fix issue 2
- [ ] Fix issue 3
```

**Cell 18: Cycle 1 - Refinements Applied** (Markdown)
```markdown
### Refinements Made

*Document what you changed and why:*

1. **Fixed**: [What changed]
   - **Why**: [Reasoning]

2. **Added**: [What was added]
   - **Why**: [Reasoning]

---

*Now go back and update the Feynman Explanation section above ↑*
```

#### Cycle 2: Add Depth

**Cell 19: Cycle 2 - Pre-Analysis** (Markdown)
```markdown
## 🎯 Cycle 2: Adding Depth & Polish

**Current Status**: [Not Started | In Progress | Complete]

**Focus Areas for This Cycle:**
- Flow and organization
- Clarity of technical concepts
- Completeness of coverage
- Appropriateness of language for audience
- Strength and consistency of analogies
- Integration between sections

**Prompt for clear_thought:**
> "Reviewing refined notebook for [TOPIC]. Will assess flow, clarity of technical concepts, completeness of coverage, and whether language is appropriate for an intelligent college freshman."
```

**Cell 20: Cycle 2 - Analysis Results** (Markdown)
```markdown
### Depth Opportunities

*What could be richer, clearer, or more complete?*

#### Flow Issues
1.
2.

#### Clarity Improvements
1.
2.

#### Completeness Gaps
1.
2.

#### Language Adjustments
1.
2.

---

### Action Items

- [ ] Improve area 1
- [ ] Improve area 2
- [ ] Improve area 3
```

**Cell 21: Cycle 2 - Refinements Applied** (Markdown)
```markdown
### Refinements Made

*Document depth improvements:*

1. **Enhanced**: [What improved]
   - **How**: [Specific changes]

2. **Integrated**: [What connected better]
   - **How**: [Specific changes]

---

*Update the Feynman Explanation section above ↑*
```

#### Cycle 3: Final Polish

**Cell 22: Cycle 3 - Pre-Analysis** (Markdown)
```markdown
## ✨ Cycle 3: Final Validation

**Current Status**: [Not Started | In Progress | Complete]

**Focus Areas for This Cycle:**
- Overall coherence and narrative flow
- Consistency of analogies throughout
- Readability and engagement
- No remaining gaps or confusions
- Ready for expert re-encoding?

**Prompt for clear_thought:**
> "Final validation of [TOPIC] notebook. Will check overall coherence, consistency of analogies, readability, engagement, and confirm no gaps remain."
```

**Cell 23: Cycle 3 - Analysis Results** (Markdown)
```markdown
### Final Issues

*Last chance to catch problems:*

#### Coherence Issues
1.
2.

#### Consistency Problems
1.
2.

#### Readability Concerns
1.
2.

#### Remaining Gaps
1.
2.

---

### Action Items

- [ ] Polish issue 1
- [ ] Polish issue 2
- [ ] Final validation check
```

**Cell 24: Cycle 3 - Final Refinements** (Markdown)
```markdown
### Final Refinements

*Last touches:*

1. **Polished**: [Final change]
2. **Validated**: [Confirmation]

---

**✅ Feynman Explanation is now complete and validated**

*Update the Feynman Explanation section above ↑ for the last time*
```

---

### Section 4: Expert Re-Encoding

**Cell 25: Re-Encoding Overview** (Markdown)
```markdown
# Phase 4: Expert Re-Encoding

*Now that understanding is validated, extract patterns for expert use.*

**Goal**: Create high-signal, low-friction reference material optimized for rapid application.

**Characteristics:**
- Pattern-dense with code examples
- Decision tables and lookup charts
- If-then logic, not narrative
- Anti-patterns explicitly marked (❌)
- Checklists for validation
- ASCII diagrams for mental models
- Hierarchical for easy scanning

---
```

**Cell 26: Mental Models** (Markdown)
```markdown
## Core Mental Model

*Extract the essence into ASCII diagrams:*

```
[Create ASCII diagram showing system architecture or concept relationships]

Example:
    ┌─────────┐
    │ Client  │
    └────┬────┘
         │
    ┌────▼────┐
    │ Server  │
    └────┬────┘
         │
    ┌────▼────┐
    │Database │
    └─────────┘
```

**Key Principles:**
1.
2.
3.
```

**Cell 27: Pattern Catalog** (Markdown)
```markdown
## Pattern: [Pattern Name 1]

**When to Use:**
- Scenario 1
- Scenario 2

**Implementation:**

\`\`\`typescript
// ✅ CORRECT: Pattern shown
class Example {
  // Show the right way
}

// ❌ WRONG: Anti-pattern shown
class BadExample {
  // Show what NOT to do
}
\`\`\`

**Trade-offs:**

| Aspect | Pro | Con |
|--------|-----|-----|
|        |     |     |

---

## Pattern: [Pattern Name 2]

*Repeat structure for additional patterns*
```

**Cell 28: Decision Tables** (Markdown)
```markdown
## Decision Framework

*When should I use approach A vs B vs C?*

| Decision | Use When | Pros | Cons | Example |
|----------|----------|------|------|---------|
| Approach A |        |      |      |         |
| Approach B |        |      |      |         |
| Approach C |        |      |      |         |

---

## Common Scenarios

**Scenario 1: [Description]**
→ Use: [Approach]
→ Because: [Reasoning]

**Scenario 2: [Description]**
→ Use: [Approach]
→ Because: [Reasoning]
```

**Cell 29: Anti-Patterns** (Markdown)
```markdown
## ❌ Anti-Patterns & Pitfalls

### Anti-Pattern 1: [Name]

**What it looks like:**
\`\`\`typescript
// Bad code example
\`\`\`

**Why it's wrong:**
- Reason 1
- Reason 2

**Do this instead:**
\`\`\`typescript
// Good code example
\`\`\`

---

*Repeat for other anti-patterns*
```

**Cell 30: Quick Reference** (Markdown)
```markdown
## Quick Reference Checklist

**Before using [TOPIC]:**
- [ ] Check 1
- [ ] Check 2
- [ ] Check 3

**Common gotchas:**
- ⚠️ Watch out for X
- ⚠️ Remember Y
- ⚠️ Don't forget Z

**Resources:**
- [Link to docs]
- [Link to examples]
```

---

### Section 5: Meta-Reflection

**Cell 31: Learning Reflection** (Markdown)
```markdown
# Meta-Reflection

## What I Learned

**Core Understanding:**

[What is the main thing you now understand that you didn't before?]

**Surprises:**

[What was unexpected or counterintuitive?]

**Still Unclear:**

[What remains fuzzy? (Be honest)]

---

## Skill Export Checklist

- [ ] Create `.claude/skills/[SKILL_NAME]/` directory
- [ ] Write `SKILL.md` with expert re-encoding content
- [ ] Add code examples as separate files if needed
- [ ] Test skill by using it in a real scenario
- [ ] Archive this notebook as reference

---

## Success Validation

**Can you now:**
- [ ] Explain this topic clearly to a novice?
- [ ] Explain this topic precisely to an expert?
- [ ] Identify when to use vs not use this?
- [ ] Spot anti-patterns in real code?
- [ ] Implement this without constant reference to docs?

If all boxes are checked: **Understanding validated ✅**
```

---

## Implementation Plan

### Phase 1: Core Template (Low Cost, High Impact)

**Deliverables:**
1. **Template File**: `templates/sequential-feynman-template.src.md`
   - All cells specified above
   - Embedded prompts and guidance
   - Progress tracking metadata

2. **Template Loading**: Enhance notebook tool description
   - Add parameter: `template: "sequential-feynman"` (optional)
   - Loads pre-structured notebook instead of blank
   - Topic substitution in title cell

**Estimated Effort**: 2-4 hours
- Writing template: 1-2 hours
- Integration: 1-2 hours
- Testing: 30 minutes

**Implementation:**
```typescript
// In notebook tool handler
if (template === "sequential-feynman") {
  const templateContent = loadTemplate("sequential-feynman-template.src.md");
  const populatedContent = templateContent.replace("[TOPIC]", topic);
  createNotebookFromMarkdown(populatedContent);
}
```

### Phase 2: Enhanced Features (Medium Cost, Medium Impact)

**Deliverables:**

1. **Cell Tagging**: Add metadata to cells
   - `phase: "research" | "feynman" | "refinement" | "expert" | "meta"`
   - `cycle: 1 | 2 | 3` (for refinement cells)
   - Enables filtering/navigation

2. **Progress Auto-Update**: Track checklist state
   - Parse markdown checkboxes
   - Update progress indicator in title cell
   - Show completion percentage

3. **Cycle Helpers**: Make cycle tracking explicit
   - `/start-cycle 1` command updates status
   - Auto-timestamps each cycle
   - Reminds what to focus on

**Estimated Effort**: 4-6 hours

### Phase 3: Advanced Automation (High Cost, High Impact)

**Deliverables:**

1. **Skill Export Automation**:
   - `/export-to-skill` command
   - Extracts Phase 4 content
   - Creates skill directory structure
   - Generates SKILL.md automatically

2. **Diff Tracking**:
   - Show what changed between cycles
   - Visual diff of Feynman section
   - Track refinement history

3. **AI-Assisted Prompts**:
   - Analyze current cell content
   - Suggest what's missing
   - Auto-generate clear_thought prompts

**Estimated Effort**: 8-12 hours

---

## Alternative Designs Considered

### Option A: Minimal Template (Rejected)
**Structure**: Just N blank cells with explanation at top

**Pros:**
- Extremely flexible
- Low maintenance
- No learning curve

**Cons:**
- Doesn't guide the process
- Agent recreates structure anyway
- Misses the value proposition

**Why Rejected**: Defeats the purpose - the value IS the guidance.

---

### Option B: Wizard-Style (Deferred)
**Structure**: Interactive prompts guide through each step

**Pros:**
- Maximum guidance
- Impossible to skip steps
- Clear process

**Cons:**
- Requires interactive runtime
- Not standard Jupyter
- High implementation cost

**Why Deferred**: Great idea, but needs significant tooling. Could be Phase 4.

---

### Option C: Multi-Template Library (Future)
**Structure**: Different templates for different learning styles

**Examples:**
- `sequential-feynman-code-first`: For implementation-heavy topics
- `sequential-feynman-theory-first`: For conceptual topics
- `sequential-feynman-minimal`: Lighter version

**Why Future**: Start with one great template, expand if needed.

---

## Success Metrics

**Adoption Metrics:**
- Template usage rate vs blank notebooks
- Time to complete workflow (should decrease)
- Quality of resulting skills (subjective assessment)

**Quality Metrics:**
- % of notebooks that complete all 3 cycles
- % that reach Phase 4 (expert re-encoding)
- User satisfaction with template structure

**Iteration Metrics:**
- Which cells are most often modified/deleted?
- Which prompts are most helpful?
- Where do agents get stuck?

---

## Open Questions & Future Explorations

### Cell Ordering
- Should refinement cycles be interspersed in Feynman section, or separate as designed?
- Trade-off: Proximity to edited content vs clarity of phases

### Prompt Engineering
- What questions actually trigger deeper thinking?
- Need to test and iterate on prompt phrasing
- Could crowdsource prompts from multiple learning sessions

### Template Variants
- Would advanced users want a "minimal" version?
- Should there be templates for different domains (ML, systems, theory)?

### Integration with Thoughtbox
- Could `clear_thought` results be auto-populated into analysis cells?
- Should notebook have direct integration with clear_thought tool?

### Export Automation
- What's the right format for auto-generated skills?
- How much manual polish is needed after export?

---

## Conclusion

This template transforms the Sequential Feynman workflow from a manual, structure-each-time process into a **guided literate reasoning environment**. By embedding prompts, structure, and progress tracking directly into the notebook, we reduce cognitive load and increase the likelihood of thorough, validated learning.

**The Core Insight:**

> *The template is not just a structure - it's a conversation partner that knows what questions to ask when.*

**Recommended Implementation Path:**

1. **Start Now**: Build Phase 1 (core template) - immediate value
2. **Iterate Fast**: Deploy, use it, learn what works
3. **Enhance Gradually**: Add Phase 2/3 features based on real usage

**Estimated Total Effort:**
- Phase 1 (MVP): 2-4 hours → Ships immediately
- Phase 2 (Enhanced): +4-6 hours → Ships after feedback
- Phase 3 (Advanced): +8-12 hours → Ships when patterns are clear

---

## Appendix A: Example Usage Flow

**Step 1**: Agent receives task to learn "Byzantine Fault Tolerance"

```python
# Agent invokes notebook tool with template
create_notebook(
  path="notebooks/feynman-byzantine-fault-tolerance.src.md",
  template="sequential-feynman",
  topic="Byzantine Fault Tolerance"
)
```

**Step 2**: Notebook opens pre-structured with all guidance cells

**Step 3**: Agent follows prompts through Phase 1-4

**Step 4**: At each cycle, agent:
- Reads pre-analysis prompts
- Runs clear_thought with suggested prompt
- Documents findings in provided cells
- Applies refinements
- Updates progress checklist

**Step 5**: Expert re-encoding cells guide pattern extraction

**Step 6**: Agent exports to `.claude/skills/byzantine-fault-tolerance/SKILL.md`

**Result**: High-quality skill with full learning provenance

---

## Appendix B: Template File Location

**Proposed Structure:**
```
thoughtbox/
├── templates/
│   ├── sequential-feynman-template.src.md  ← The actual template
│   └── README.md                            ← Template documentation
├── notebooks/                                ← Where instances live
│   └── feynman-[topic].src.md
├── specs/                                    ← This document
│   └── sequential-feynman-template.md
└── src/
    └── tools/
        └── notebook.ts                       ← Template loading logic
```

---

**End of Specification**
