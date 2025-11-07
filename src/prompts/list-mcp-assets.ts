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

## Tools
- \`thoughtbox(thought, thoughtNumber, totalThoughts, ...)\` — Step-by-step reasoning for complex problem-solving
  - Supports forward thinking (1→N), backward thinking (N→1), and branching
  - Automatic Thoughtbox patterns cookbook at thought 1 and final thought

- \`notebook(operation, args)\` — Toolhost for literate programming notebooks
  - Operations: \`create\`, \`list\`, \`load\`, \`add_cell\`, \`update_cell\`, \`run_cell\`, \`install_deps\`, \`list_cells\`, \`get_cell\`, \`export\`
  - Full operation reference: \`thoughtbox://notebook/operations\`

## Resources
- \`system://status\` — Notebook server health snapshot
- \`thoughtbox://notebook/operations\` — Notebook operations catalog with schemas and examples
- \`thoughtbox://patterns-cookbook\` — Thoughtbox reasoning patterns guide
- \`thoughtbox://architecture\` — Interactive guide to Thoughtbox architecture and implementation

## Quick Start

### Thoughtbox Reasoning
\`\`\`
thoughtbox({
  thought: "Breaking down the problem...",
  thoughtNumber: 1,
  totalThoughts: 10,
  nextThoughtNeeded: true
})
\`\`\`

### Notebooks
\`\`\`
notebook({
  operation: "create",
  args: { title: "My Notebook", language: "typescript" }
})

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
`;
}
