/**
 * MCP Prompt definition for listing server capabilities
 *
 * Dynamically generates content from the source modules
 * (notebook operations, mental models, etc.)
 */

import { NOTEBOOK_OPERATIONS } from "../notebook/operations.js";
import { AVAILABLE_TEMPLATES } from "../notebook/templates.generated.js";
import { listNotebookModes } from "../notebook/engine/registry.js";


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
 * Generates the list_mcp_assets prompt content dynamically
 */
export function getListMcpAssetsContent(): string {
  return `# Thoughtbox MCP Server - Capabilities

## Overview

**Package:** \`@kastalien-research/thoughtbox\`
**MCP Name:** \`io.github.Kastalien-Research/thoughtbox\`

Thoughtbox provides cognitive enhancement tools for LLM agents - infrastructure for structured reasoning, not intelligence.

---

## Public Tools

### 1. \`thoughtbox_search\` — Catalog Search

Discover Thoughtbox operation modules, prompts, resources, and public tool surfaces by querying the server catalog with JavaScript.

### 2. \`thoughtbox_execute\` — Code Mode Operation Runner

Run JavaScript against the \`tb\` SDK to use Thoughtbox operation modules such as session, thought, knowledge, notebook, protocol, observability, and branch operations.

### 3. \`thoughtbox_peer_notebook\` — Mock Peer Notebook Pilot

Brokered MCP peer notebook pilot surface for the deterministic in-memory \`claim-extractor\` peer.

Supported operations:

| Operation | Purpose |
|-----------|---------|
| \`peer_artifact_seed\` | Seed an in-memory text artifact |
| \`peer_invoke\` | Invoke \`claim-extractor.extract_claims\` |
| \`peer_get_invocation\` | Read invocation metadata |
| \`peer_list_trace_events\` | Read broker/runtime trace events, including denied outbound calls |
| \`peer_get_artifact\` | Read seeded or produced artifacts |
| \`peer_manifest_create\` | Compile \`peer.manifest.json\` content into a draft manifest |
| \`peer_manifest_approve\` | Approve a draft manifest (activates it; retires the previously active one) |
| \`peer_manifest_reject\` | Reject a draft manifest |
| \`peer_manifest_list\` | List manifest versions and statuses for a peer |

### Notebook Evidence Engine

Toolhost for interactive notebooks with JavaScript/TypeScript. Notebooks are also a visible evidence engine: executable Markdown artifacts with prose, code, deterministic validators, structured outputs, and replayable runs.

Use \`notebook_validate\` as the low-level predicate primitive when a single code cell should decide pass/fail from observed JSON. Use \`notebook_start_run\` for full evidence workflows.

**Evidence modes:** ${listNotebookModes().map(m => `\`${m.mode}\``).join(", ")}

**Operations (${NOTEBOOK_OPERATIONS.length}):**

| Operation | Category | Description |
|-----------|----------|-------------|
${NOTEBOOK_OPERATIONS.map(op => `| \`${op.name}\` | ${op.category} | ${op.description.split("\n")[0]} |`).join("\n")}

**Templates:** ${AVAILABLE_TEMPLATES.map(t => `\`${t}\``).join(", ")}

**Capability resource:** \`thoughtbox://notebook/capabilities\`



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
| \`thoughtbox://notebook/capabilities\` | Notebook Evidence Engine modes, templates, outputs, and recommended use cases |
| \`thoughtbox://peer-notebook/pilot\` | Mock peer notebook pilot surface and operation quick reference |
| \`thoughtbox://patterns-cookbook\` | Thoughtbox reasoning patterns guide |
| \`thoughtbox://architecture\` | Server architecture and implementation guide |




### Resource Templates

| URI Template | Description |
|--------------|-------------|

| \`thoughtbox://interleaved/{mode}\` | IRCoT reasoning guides (research, analysis, development) |

---

## Quick Start

### Code Mode And Peer Notebook Pilot

\`\`\`javascript
// Discover operations and public tool surfaces
thoughtbox_search({
  code: "async () => ({ modules: Object.keys(catalog.operations), publicTools: catalog.publicTools })"
})

// Start a reasoning session through Code Mode
thoughtbox_execute({
  code: "async () => tb.thought({ thought: 'Breaking down the problem into key decision areas...', thoughtNumber: 1, totalThoughts: 10, nextThoughtNeeded: true, sessionTitle: 'Architecture Decision', sessionTags: ['architecture', 'planning'] })"
})

// Seed a peer artifact, invoke claim extraction, then inspect traces
const seeded = await thoughtbox_peer_notebook({
  operation: "peer_artifact_seed",
  text: "First claim. Second claim."
})

const invoked = await thoughtbox_peer_notebook({
  operation: "peer_invoke",
  peerId: "claim-extractor",
  tool: "extract_claims",
  args: { textArtifactId: seeded.artifact.id }
})

await thoughtbox_peer_notebook({
  operation: "peer_list_trace_events",
  invocationId: invoked.invocationId
})
\`\`\`



### Notebooks for Exploration
1. Use eval workbooks when a claim needs scoring.
2. Use failure capsules when debugging should become replayable.
3. Use ADR evidence packs when an architectural hypothesis needs executable validation.
4. Use skill certification when a reusable workflow needs proof obligations.
5. Use scenario factories when test/eval data needs generation.
6. Use system audits when repo invariants need recurring checks.
7. Combine with \`thoughtbox\` for reasoning about results.
8. Export with \`export\` or persist with \`notebook_persist\` for local-first artifacts.

---

## Summary Statistics

- **Public Tools:** 3 (thoughtbox_search, thoughtbox_execute, thoughtbox_peer_notebook)
- **Notebook Operations:** ${NOTEBOOK_OPERATIONS.length}
- **Prompts:** 2
- **Static Resources:** 7+
- **Resource Templates:** 3

`;
}
