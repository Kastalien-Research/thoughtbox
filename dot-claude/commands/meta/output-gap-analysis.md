# Output Gap Analysis

**Purpose**: Systematically evaluate any summarized output to identify what's useful, what's missing, and how to improve the summarization process.

---

## When to Use This Command

Use `/meta:output-gap-analysis` when you've received summarized output (from subagent-summarize, session exports, documentation, etc.) and want to:

1. Assess what information was actually useful
2. Identify what you wish you had received
3. Consider different use cases that would need different information
4. Draft improvements to the summarization source

---

## Step 1: Identify the Source

**What output are you analyzing?**

| Source Type | Examples |
|-------------|----------|
| Thoughtbox session summary | Via subagent-summarize pattern (Task tool) |
| Code analysis | From exploration agents |
| Documentation summary | From doc retrieval |
| Research synthesis | From web research |
| Other | Any compressed/summarized output |

**Note**: The subagent-summarize pattern is not a slash command - it's a Task tool workflow documented in the `thoughtbox://subagent-summarize` resource. See that resource for invocation details.

**Record:**
- Source identifier (session ID, file path, etc.)
- Original context: What task led to requesting this summary?
- Approximate compression ratio (full vs. summary size)

---

## Step 2: Use Thoughtbox for Structured Evaluation

Begin a Thoughtbox reasoning session (20-40 thoughts recommended) to systematically evaluate.

### Phase A: Assess What You Received (5-10 thoughts)

Consider:
- What conclusions/findings were included?
- What evidence supported those conclusions?
- Were key decisions or recommendations present?
- Was the format useful for your immediate need?

**Cipher marking suggestion:**
```
S1|E|[source]|SUMMARY CONTAINED: [list key elements]
S2|E|S1|FORMAT ASSESSMENT: [how structure helped/hindered]
S3|C|S1-S2|IMMEDIATE UTILITY: [was it useful for the task at hand?]
```

### Phase B: Identify Gaps (5-10 thoughts)

Consider what's missing:
- **Rejected alternatives**: What options were considered but dismissed?
- **Open questions**: What remains unresolved?
- **Assumptions**: What was taken for granted without explicit stating?
- **Reasoning trajectory**: How did the thinking evolve?
- **Branch synthesis**: If alternatives were explored, how did they compare?
- **Confidence levels**: How certain are the conclusions?

**Cipher marking suggestion:**
```
S4|Q|S3|MISSING: Rejected alternatives - what was explored and dismissed?
S5|Q|S4|MISSING: Open threads - what questions remain unanswered?
S6|A|S3|IMPLICIT ASSUMPTION: [assumption underlying the summary]
```

### Phase C: Consider Alternative Use Cases (5-10 thoughts)

Different downstream uses need different information:

| Use Case | Primary Need |
|----------|--------------|
| **Continuation** | Open threads, assumptions, plans |
| **Cross-reference** | Conclusions, evidence links |
| **Validation** | Evidence, assumptions, methodology |
| **Learning** | Rejected paths, reasoning evolution |
| **Debugging** | Full structure, all branches, timeline |

For each relevant use case, note what the summary would need to include.

### Phase D: Draft Improvements (5-10 thoughts)

Synthesize into actionable recommendations:
- What extraction template changes would help?
- What new modes might be needed?
- What server-side support would enable better filtering?
- What's the minimum viable improvement?

**Cipher marking suggestion:**
```
S15|P|S10-S14|IMPROVEMENT: [specific change recommendation]
S16|P|S15|IMPLEMENTATION: [how to implement this change]
S17|C|S4-S16|PRIORITY: [rank improvements by impact/effort]
```

---

## Step 3: Generate Gap Report

After completing the Thoughtbox session, create a structured report:

```markdown
# Output Gap Analysis Report

## Source
- **Type**: [session summary | code analysis | documentation | other]
- **Identifier**: [session ID, file path, etc.]
- **Original Task**: [what prompted requesting this summary]
- **Compression**: [~X% of original content]

## What Was Useful
- [Item 1]
- [Item 2]
- [Item 3]

## What Was Missing

### For Current Task
- [ ] [Gap 1]
- [ ] [Gap 2]

### For Continuation Use Case
- [ ] [Gap requiring Q-type thoughts]
- [ ] [Gap requiring A-type thoughts]

### For Learning Use Case
- [ ] [Gap requiring X-type/rejected thoughts]
- [ ] [Gap requiring trajectory]

## Recommendations

### Quick Wins (Prompt-only changes)
1. [Recommendation 1]
2. [Recommendation 2]

### Structural Changes (Code changes)
1. [Recommendation 1] - Effort: [Low/Medium/High]
2. [Recommendation 2] - Effort: [Low/Medium/High]

## Suggested Mode Templates

If applicable, draft mode templates:

**Mode: [name]**
- Include types: [H, E, C, Q, A, X, P, R]
- Include branches: [yes/no]
- Include trajectory: [yes/no]
- Target length: [~X words]
- Purpose: [when to use this mode]

## Next Steps
1. [ ] [Immediate action]
2. [ ] [Follow-up action]
3. [ ] [Spec to write if substantial]
```

---

## Step 4: Action on Findings

Based on your analysis:

### If findings are minor:
- Update relevant prompt templates directly
- Note in project memory for future reference

### If findings warrant specification:
- Create spec in `.specs/` directory
- Reference the Thoughtbox session as source
- Follow SPEC template format

### If findings reveal new use case:
- Document the use case
- Consider new summary mode
- Update this command's use case table

---

## Example Invocation

```
User: /meta:output-gap-analysis

Agent: I'll analyze the summary I just received from the subagent-summarize call.

[Begins Thoughtbox session]
S1|E|summary|RECEIVED: ~400 word summary of 95-thought Knowledge Zone session
S2|E|S1|CONTAINED: 3 recommendations, philosophy quote, decision table
S3|C|S1-S2|USEFUL FOR: Quick understanding of conclusions
S4|Q|S3|MISSING: Why was scratchpad rejected? What were the alternatives?
S5|Q|S4|MISSING: Are there open questions about auto-extraction?
...
[20-30 more thoughts]
...
S28|C|S1-S27|PRIORITY RECOMMENDATIONS: 1) Add mode parameter, 2) Include X-types in learning mode

[Generates gap report]
```

---

## Connection to Other Commands

- **After using subagent-summarize pattern**: Evaluate summary quality
- **Before `/workflows:spec-designer`**: Gather requirements for summarization improvements
- **With `/meta:capture-learning`**: Document what you learned about information needs

---

## Meta-Note: This Command Is Self-Improving

This gap analysis process itself can be analyzed. If you find gaps in how this command works:

1. Run gap analysis on your gap analysis output
2. Update this command file with improvements
3. Note: This command was originally created from Thoughtbox session 8909365f-e2a3-474c-9224-9e68cae91541

---

**See Also**:
- `.specs/SPEC-SUM-001-subagent-summarize-modes.md` - Spec for summary modes
- `.claude/commands/meta/capture-learning.md` - Capture findings as learnings
- `.claude/rules/00-meta.md` - Memory system meta-rules
