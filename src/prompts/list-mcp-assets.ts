/**
 * MCP Prompt definition for listing server capabilities
 */
export const LIST_MCP_ASSETS_PROMPT = {
  name: "list_mcp_assets",
  title: "list_mcp_assets",
  description:
    "Overview of all MCP capabilities, tools, resources, and quickstart guide",
  arguments: [],
};

/**
 * Generates the list_mcp_assets prompt content
 */
export function getListMcpAssetsContent(): string {
  return `# Thoughtbox MCP Server Capabilities

## Prompts
- \`list_mcp_assets()\` — Overview of tools/resources and quickstart steps (this prompt)
- \`interleaved-thinking(task, ...)\` — IRCoT-style interleaved reasoning for multi-phase task execution

## Tools

### \`thoughtbox\` — Step-by-Step Reasoning
Step-by-step thinking tool for complex problem-solving.
- Supports forward thinking (1→N), backward thinking (N→1), branching, and revision
- Automatic patterns cookbook at thought 1 and final thought
- Use for multi-step analysis, planning, hypothesis generation, system design

### \`notebook\` — Literate Programming
Toolhost for interactive notebooks with JavaScript/TypeScript.
- **Operations:** \`create\`, \`list\`, \`load\`, \`add_cell\`, \`update_cell\`, \`run_cell\`, \`install_deps\`, \`list_cells\`, \`get_cell\`, \`export\`
- **Templates:** \`sequential-feynman\` for deep learning workflows
- Full reference: \`thoughtbox://notebook/operations\`

### \`mental_models\` — Structured Reasoning
Access 15 mental models for structured reasoning.
- **Operations:** \`get_model\`, \`list_models\`, \`list_tags\`, \`get_capability_graph\`
- **Tags:** debugging, planning, decision-making, risk-analysis, estimation, prioritization, communication, architecture, validation
- **Models:** rubber-duck, five-whys, pre-mortem, trade-off-matrix, fermi-estimation, and more
- Full catalog: \`thoughtbox://mental-models/operations\`

## Resources

### Static Resources
- \`system://status\` — Notebook server health snapshot
- \`thoughtbox://notebook/operations\` — Notebook operations catalog
- \`thoughtbox://patterns-cookbook\` — Thoughtbox reasoning patterns guide
- \`thoughtbox://architecture\` — Server architecture and implementation guide
- \`thoughtbox://mental-models/operations\` — Mental models catalog
- \`thoughtbox://mental-models\` — Mental models root directory

### Resource Templates
- \`thoughtbox://mental-models/{tag}/{model}\` — Browse mental models by tag
- \`thoughtbox://interleaved/{mode}\` — IRCoT reasoning guides (research, analysis, development)

## Quick Start

### Thoughtbox Reasoning
\`\`\`javascript
thoughtbox({
  thought: "Breaking down the problem into key decision areas...",
  thoughtNumber: 1,
  totalThoughts: 10,
  nextThoughtNeeded: true
})

// Branching for alternatives
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

### Mental Models
\`\`\`javascript
// List models by tag
mental_models({
  operation: "list_models",
  args: { tag: "debugging" }
})

// Get specific model
mental_models({
  operation: "get_model",
  args: { model: "five-whys" }
})
\`\`\`

## Integration Patterns

### Models → Reasoning
1. Use \`mental_models\` to retrieve a reasoning framework
2. Apply that framework using \`thoughtbox\`
3. Iterate and refine your approach

### Notebooks for Exploration
1. Use \`notebook\` for executable documentation
2. Combine with \`thoughtbox\` for reasoning about results
3. Export with \`export\` operation for persistence

## Additional Information

For comprehensive documentation, see:
- \`thoughtbox://patterns-cookbook\` — 6 core reasoning patterns with examples
- \`thoughtbox://architecture\` — Server implementation details
- \`src/CAPABILITIES.md\` — Complete auto-generated capabilities reference
`;
}
