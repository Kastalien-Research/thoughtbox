/**
 * MCP Prompt definition for listing server capabilities
 *
 * Dynamically generates content from the source modules
 * (notebook operations, mental models, etc.)
 */

import { NOTEBOOK_OPERATIONS } from "../notebook/operations.js";
import { AVAILABLE_TEMPLATES } from "../notebook/templates.generated.js";


// Inline the interleaved thinking description to avoid circular import
const INTERLEAVED_THINKING_DESCRIPTION =
  "Use this Thoughtbox server as a reasoning workspace to alternate between internal reasoning steps and external tool/action invocation";

export const LIST_MCP_ASSETS_PROMPT = {
  name: "list_mcp_assets",
  title: "list_mcp_assets",
  description:
    "Overview of all MCP capabilities, tools, resources, and quickstart guide",
  arguments: [],
};

/**
 * Thoughtbox tool schema (mirrored from index.ts)
 */
const THOUGHTBOX_PARAMS = [
  { name: "thought", type: "string", required: true, description: "Your current thinking step" },
  { name: "nextThoughtNeeded", type: "boolean", required: true, description: "Whether another thought step is needed" },
  { name: "thoughtNumber", type: "integer", required: true, description: "Current thought number (1→N forward, N→1 backward)" },
  { name: "totalThoughts", type: "integer", required: true, description: "Estimated total thoughts needed" },
  { name: "isRevision", type: "boolean", required: false, description: "Whether this revises previous thinking" },
  { name: "revisesThought", type: "integer", required: false, description: "Which thought is being reconsidered" },
  { name: "branchFromThought", type: "integer", required: false, description: "Branching point thought number" },
  { name: "branchId", type: "string", required: false, description: "Branch identifier" },
  { name: "needsMoreThoughts", type: "boolean", required: false, description: "If more thoughts are needed" },
  { name: "includeGuide", type: "boolean", required: false, description: "Request the patterns cookbook guide" },
  { name: "sessionTitle", type: "string", required: false, description: "Title for the reasoning session" },
  { name: "sessionTags", type: "array", required: false, description: "Tags for cross-chat discovery" },
];

/**
 * Generates the list_mcp_assets prompt content dynamically
 */
export function getListMcpAssetsContent(): string {
  return `# Thoughtbox MCP Server - Capabilities

## Overview

**Package:** \`@kastalien-research/thoughtbox\`
**MCP Name:** \`io.github.Kastalien-Research/thoughtbox\`

Thoughtbox provides cognitive enhancement tools for LLM agents - infrastructure for structured reasoning, not intelligence.

---

## Tools

### 1. \`thoughtbox\` — Step-by-Step Reasoning

Step-by-step thinking tool for complex problem-solving.
- Supports forward thinking (1→N), backward thinking (N→1), branching, and revision
- Automatic patterns cookbook at thought 1 and final thought
- Use for multi-step analysis, planning, hypothesis generation, system design

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
${THOUGHTBOX_PARAMS.map(p => `| \`${p.name}\` | ${p.type} | ${p.required ? "Yes" : "No"} | ${p.description} |`).join("\n")}

### 2. \`notebook\` — Literate Programming

Toolhost for interactive notebooks with JavaScript/TypeScript.

**Operations (${NOTEBOOK_OPERATIONS.length}):**

| Operation | Category | Description |
|-----------|----------|-------------|
${NOTEBOOK_OPERATIONS.map(op => `| \`${op.name}\` | ${op.category} | ${op.description.split("\n")[0]} |`).join("\n")}

**Templates:** ${AVAILABLE_TEMPLATES.map(t => `\`${t}\``).join(", ")}



## Prompts

| Prompt | Description |
|--------|-------------|
| \`list_mcp_assets\` | This prompt - overview of all capabilities |
| \`interleaved-thinking\` | ${INTERLEAVED_THINKING_DESCRIPTION} |

---

## Resources

### Static Resources

| URI | Description |
|-----|-------------|
| \`system://status\` | Notebook server health snapshot |
| \`thoughtbox://notebook/operations\` | Notebook operations catalog (JSON) |
| \`thoughtbox://patterns-cookbook\` | Thoughtbox reasoning patterns guide |
| \`thoughtbox://architecture\` | Server architecture and implementation guide |




### Resource Templates

| URI Template | Description |
|--------------|-------------|

| \`thoughtbox://interleaved/{mode}\` | IRCoT reasoning guides (research, analysis, development) |

---

## Quick Start

### Thoughtbox Reasoning

\`\`\`javascript
// Start a reasoning session
thoughtbox({
  thought: "Breaking down the problem into key decision areas...",
  thoughtNumber: 1,
  totalThoughts: 10,
  nextThoughtNeeded: true,
  sessionTitle: "Architecture Decision",
  sessionTags: ["architecture", "planning"]
})

// Branch to explore alternatives
thoughtbox({
  thought: "Exploring approach A: Use SQL database...",
  thoughtNumber: 5,
  totalThoughts: 10,
  branchFromThought: 4,
  branchId: "sql-approach",
  nextThoughtNeeded: true
})
\`\`\`

### Notebooks

\`\`\`javascript
// Create notebook
notebook({
  operation: "create",
  args: { title: "Data Analysis", language: "typescript" }
})

// Add and run code
notebook({
  operation: "add_cell",
  args: {
    notebookId: "abc123",
    cellType: "code",
    content: "console.log('Hello!');",
    filename: "hello.ts"
  }
})

notebook({
  operation: "run_cell",
  args: { notebookId: "abc123", cellId: "cell456" }
})
\`\`\`



### Notebooks for Exploration
1. Use \`notebook\` for executable documentation
2. Combine with \`thoughtbox\` for reasoning about results
3. Export with \`export\` operation for persistence

---

## Summary Statistics

- **Tools:** 2 (thoughtbox, notebook)
- **Notebook Operations:** ${NOTEBOOK_OPERATIONS.length}
- **Prompts:** 2
- **Static Resources:** 6+
- **Resource Templates:** 3

`;
}
