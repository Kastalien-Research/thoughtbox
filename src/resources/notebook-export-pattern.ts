/**
 * Notebook Export Pattern
 *
 * Instructions for using Claude Code's Task tool to convert Thoughtbox sessions
 * to interactive .src.md notebook format with context isolation.
 */

export const NOTEBOOK_EXPORT_PATTERN = `# Notebook Export Pattern

Convert Thoughtbox sessions to interactive \`.src.md\` notebooks using a sub-agent. The sub-agent handles the full session (50k-70k tokens) internally and returns only the final notebook markdown.

---

## The Flow

\`\`\`
You (Orchestrator)
  ↓ Spawn sub-agent
Haiku Sub-agent
  ↓ Calls Thoughtbox MCP (50k tokens in sub-agent context)
  ↓ Analyzes structure
  ↓ Generates notebook
  ↓ Returns markdown (5-10k tokens)
You (Orchestrator)
  ↓ Write to file
session-{date}-{title}.src.md
\`\`\`

**Result:** Full session → notebook without polluting your context.

---

## How to Use

### Basic Export

\`\`\`typescript
const notebook = await Task({
  subagent_type: "general-purpose",
  model: "haiku",  // Cheaper, perfectly capable
  description: "Convert Thoughtbox session to notebook",
  prompt: \`
    Convert Thoughtbox session to interactive .src.md notebook.
    
    SESSION_ID: <SESSION_ID>
    
    Steps:
    1. Initialize Thoughtbox:
       - mcp__thoughtbox__init({ operation: "get_state" })
       - mcp__thoughtbox__thoughtbox_cipher()
    
    2. Retrieve session:
       - mcp__thoughtbox__session({ 
           operation: "get", 
           args: { sessionId: "<SESSION_ID>" }
         })
    
    3. Analyze structure:
       - Identify main line vs branches
       - Find branch points (branchFromThought)
       - Detect revisions (isRevision)
       - Locate synthesis thoughts
    
    4. Generate notebook in .src.md format:
       - Header: <!-- srcbook:{"language":"typescript"} -->
       - Title: # {project}/{task}/{aspect}
       - Metadata section with stats
       - Mermaid diagram of branch structure
       - Each thought as section with:
         * Concise title (summarize content)
         * Branch annotation if applicable
         * Thought content
         * Code cell with tool call example
       - Key insights section
       - Session metadata footer
    
    Return ONLY the complete .src.md notebook markdown.
    Do not include explanations, just the notebook content.
  \`
});

// notebook contains the full .src.md content
// Write to file: fs.writeFile(\`session-\${sessionId}.src.md\`, notebook)
\`\`\`

### Export with Custom Title

\`\`\`typescript
const notebook = await Task({
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Convert session to notebook with custom title",
  prompt: \`
    Convert Thoughtbox session to notebook.
    
    SESSION_ID: <SESSION_ID>
    CUSTOM_TITLE: "<TITLE>"
    
    [Same steps as above, but use CUSTOM_TITLE instead of project/task/aspect]
  \`
});
\`\`\`

### Export Specific Branch Only

\`\`\`typescript
const notebook = await Task({
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Export specific branch from session",
  prompt: \`
    Convert Thoughtbox session branch to notebook.
    
    SESSION_ID: <SESSION_ID>
    BRANCH_ID: "<BRANCH_ID>"
    
    Steps:
    1. Initialize Thoughtbox
    2. Retrieve full session
    3. Filter to only thoughts in branch "<BRANCH_ID>"
    4. Generate notebook with:
       - Title: # Branch: {branchId}
       - Only filtered thoughts
       - Mermaid showing branch structure
    
    Return the .src.md notebook.
  \`
});
\`\`\`

---

## Notebook Format Specification

The sub-agent should generate notebooks following this structure:

\`\`\`markdown
<!-- srcbook:{"language":"typescript"} -->

# {Project} / {Task} / {Aspect}

###### package.json
\\\`\\\`\\\`json
{
  "type": "module",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4"
  }
}
\\\`\\\`\\\`

## Session Overview

**Date:** {timestamp}
**Duration:** {duration}
**Total Thoughts:** {count}
**Branches:** {branchCount}

{Brief description of what this session explored}

## Reasoning Structure

\\\`\\\`\\\`mermaid
graph TD
    T1[Thought 1: {title}] --> T2A[Thought 2: {title}]
    T1 --> T2B[Thought 2: {title}]
    T2A --> T3[Thought 3: {title}]
    T2B --> T3
    
    style T1 fill:#e1f5ff
    style T3 fill:#c3e6cb
\\\`\\\`\\\`

## Main Line

### Thought 1: {Concise Title}
**Timestamp:** {time}
**Status:** Main line

{thought content}

###### thought-1-example.ts
\\\`\\\`\\\`typescript
// Tool call that created this thought
await thoughtbox({
  thought: "{excerpt of content}",
  thoughtNumber: 1,
  totalThoughts: {total},
  nextThoughtNeeded: true
});
\\\`\\\`\\\`

## Branch A: {branchId}
**Branched from:** Thought {branchFromThought}

### Thought 2: {Concise Title}
**Branch:** {branchId}

{thought content}

###### thought-2-branch-a.ts
\\\`\\\`\\\`typescript
await thoughtbox({
  thought: "{excerpt}",
  thoughtNumber: 2,
  branchFromThought: {num},
  branchId: "{branchId}",
  nextThoughtNeeded: true
});
\\\`\\\`\\\`

[... continue for all thoughts ...]

## Key Insights

- Pattern used: {identify patterns like branching, revision, synthesis}
- Decision points: {where branches occurred}
- Synthesis approach: {how insights were combined}
- Lessons learned: {meta-observations}

## Session Metadata

\\\`\\\`\\\`json
{
  "sessionId": "{id}",
  "created": "{timestamp}",
  "completed": "{timestamp}",
  "duration": "{duration}",
  "thoughtCount": {count},
  "branchCount": {count},
  "mainLineThoughts": {count},
  "branchedThoughts": {count},
  "revisions": {count}
}
\\\`\\\`\\\`
\`\`\`

---

## Template Variables

Replace these in prompts:

| Variable | Description |
|----------|-------------|
| \`<SESSION_ID>\` | UUID of session to export |
| \`<TITLE>\` | Custom title for notebook |
| \`<BRANCH_ID>\` | Specific branch to export |

---

## Mermaid Diagram Generation Rules

Sub-agent should follow these rules for Mermaid:

1. **Node format:** \`T{thoughtNum}[Thought {num}: {short title}]\`
2. **Main line style:** \`fill:#e1f5ff\` (light blue)
3. **Branch styles:** Different colors per branch
4. **Synthesis style:** \`fill:#c3e6cb\` (green)
5. **Maximum width:** Keep graph readable, collapse deep branches if needed

**Example:**

\`\`\`mermaid
graph TD
    T1[Thought 1: Problem Analysis] --> T2A[Thought 2: Approach A]
    T1 --> T2B[Thought 2: Approach B]
    T2A --> T3A[Thought 3: Evaluation]
    T2B --> T3B[Thought 3: Evaluation]
    T3A --> T5[Thought 5: Synthesis]
    T3B --> T5
    
    style T1 fill:#e1f5ff
    style T2A fill:#ffdddd
    style T2B fill:#ddffdd
    style T5 fill:#c3e6cb
\`\`\`

---

## Thought Title Guidelines

Sub-agent should create concise titles by:

1. **Extract key action/decision:** "Evaluated database options"
2. **Use pattern names:** "Branch A: Redis approach"
3. **Indicate status:** "Synthesis: Hybrid solution"
4. **Keep short:** 3-7 words max
5. **Be descriptive:** Avoid "Thought about X", use "Analyzed X"

**Examples:**

| Original Thought | Good Title |
|-----------------|------------|
| "I think we should use Redis because..." | "Evaluated Redis Benefits" |
| "Branch A: Notification-centric resources..." | "Branch A: Notification-Centric" |
| "After comparing both approaches..." | "Synthesis: Hybrid Approach" |
| "Wait, I need to revise thought 3..." | "Revision: Updated Constraints" |

---

## Cost & Performance

| Metric | Typical Values |
|--------|----------------|
| Session size | 50-70k tokens (in sub-agent) |
| Notebook output | 5-10k tokens (to orchestrator) |
| Model | Haiku (cheap, fast) |
| Context reduction | **10-14x** |
| Generation time | 10-20 seconds |
| Cost | ~$0.01-0.05 per export |

---

## Best Practices

### For Orchestrator (Claude Code)

1. **Use Haiku for sub-agent** - Perfectly capable of structural work
2. **Write result to file immediately** - Don't keep in context
3. **Name files descriptively** - \`session-{date}-{topic}.src.md\`
4. **Batch exports if multiple** - Spawn parallel sub-agents

### For Sub-agent Prompt

1. **Be explicit about format** - Include format specification
2. **Forbid explanations** - "Return ONLY the notebook content"
3. **Set clear boundaries** - "Do not include thoughts X-Y if filtering"
4. **Show examples** - Include sample Mermaid/formatting

---

## Advanced Use Cases

### Export Multiple Sessions as Tutorial Series

\`\`\`typescript
// Spawn sub-agent to create multi-session tutorial
const tutorial = await Task({
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Create tutorial from multiple sessions",
  prompt: \`
    Create tutorial notebook from these Thoughtbox sessions:
    - Session A: {sessionId1}
    - Session B: {sessionId2}
    - Session C: {sessionId3}
    
    Steps:
    1. Initialize Thoughtbox
    2. Retrieve all three sessions
    3. Identify progression/learning across sessions
    4. Generate single notebook with:
       - Chapter per session
       - Cross-references between sessions
       - Cumulative insights
    
    Return .src.md notebook.
  \`
});
\`\`\`

### Export with Pedagogical Enhancement

\`\`\`typescript
const teachingNotebook = await Task({
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Create teaching-focused notebook",
  prompt: \`
    Convert Thoughtbox session to teaching notebook.
    
    SESSION_ID: {sessionId}
    
    Enhancements:
    - Add "Try It Yourself" prompts after key techniques
    - Include common mistakes to avoid
    - Add reflection questions
    - Annotate decision points with "Why this matters"
    
    Return enhanced .src.md notebook.
  \`
});
\`\`\`

### Export Just the Branch Topology

\`\`\`typescript
const topology = await Task({
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Extract branch topology visualization",
  prompt: \`
    Extract and visualize branch topology from session.
    
    SESSION_ID: {sessionId}
    
    Return:
    1. Mermaid diagram (detailed)
    2. ASCII tree diagram
    3. Statistics (branches, depth, synthesis points)
    4. Analysis of branching strategy used
    
    Format as minimal notebook with visualizations.
  \`
});
\`\`\`

---

## Troubleshooting

### Sub-agent returns incomplete notebook

**Cause:** Session too large, sub-agent hit output limit

**Fix:** 
- Export in chunks (by branch)
- Or use compression: have sub-agent summarize thoughts first
- Or increase sub-agent output limit if possible

### Mermaid diagram is malformed

**Cause:** Complex branch structure

**Fix:**
- Simplify in prompt: "Collapse branches deeper than 3 levels"
- Or use ASCII tree instead
- Or create separate diagram per branch

### Notebook format doesn't match specification

**Cause:** Sub-agent misunderstood format

**Fix:**
- Include example notebook in prompt
- Or reference existing notebook: "Follow format of thoughtbox-advanced-branching.src.md"
- Or be more explicit about delimiters and syntax

---

## Example: Complete Invocation

\`\`\`typescript
// In Claude Code conversation:
"Export my API design session as a notebook"

// Claude Code executes:
const sessionId = "abc-123";  // Retrieved from context or user

const notebook = await Task({
  subagent_type: "general-purpose",
  model: "haiku",
  description: \`Export Thoughtbox session \${sessionId} to notebook\`,
  prompt: \`
Convert Thoughtbox session to interactive notebook.

SESSION_ID: \${sessionId}

Steps:
1. Initialize: 
   - mcp__thoughtbox__init({ operation: "get_state" })
   - mcp__thoughtbox__thoughtbox_cipher()

2. Retrieve:
   - mcp__thoughtbox__session({ operation: "get", args: { sessionId: "\${sessionId}" } })

3. Analyze thought structure:
   - Main line thoughts (no branchId)
   - Branch points (has branchFromThought)
   - Synthesis points (combines branches)

4. Generate .src.md notebook:

<!-- srcbook:{"language":"typescript"} -->

# Session: [Extract from session.project/task/aspect]

###### package.json
\\\`\\\`\\\`json
{"type": "module", "dependencies": {"@modelcontextprotocol/sdk": "^1.0.4"}}
\\\`\\\`\\\`

## Overview
[Summarize what session explored in 2-3 sentences]

## Structure
[Mermaid diagram showing thought→branch→synthesis flow]

## Thoughts
[For each thought, create section with:
 - ### Thought N: [Title]
 - Branch annotation if applicable
 - Thought content
 - ###### thought-N.ts code cell with tool call example]

## Insights
[Extract 3-5 key insights about patterns used]

## Metadata
[JSON with session stats]

Return ONLY the notebook content. No explanations.
  \`
});

// Write to file
const filename = \`session-\${new Date().toISOString().split('T')[0]}-api-design.src.md\`;
await fs.promises.writeFile(filename, notebook);

console.log(\`Notebook exported to \${filename}\`);
\`\`\`

---

## See Also

- \`subagent-summarize-content.ts\` - Pattern for session summarization
- \`thoughtbox_cipher\` - Compress thought content before export
- \`session.get\` - Retrieve full session data
- Example notebooks: \`srcbook/packages/api/srcbook/examples/thoughtbox-*.src.md\`

---

**This pattern lets you export massive reasoning sessions to shareable notebooks without context pollution.** 🎯
`;
