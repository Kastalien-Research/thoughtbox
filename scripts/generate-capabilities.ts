#!/usr/bin/env tsx
/**
 * @fileoverview Build-time capabilities documentation generator
 * Generates a markdown file documenting all server capabilities (tools, prompts, resources)
 * Runs at build time via tsx to generate src/CAPABILITIES.md
 * @module scripts/generate-capabilities
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname/__filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_FILE = path.join(__dirname, '../src/CAPABILITIES.md');

// Import all the source modules
import { NOTEBOOK_OPERATIONS } from '../src/notebook/operations.js';
import { AVAILABLE_TEMPLATES } from '../src/notebook/templates.generated.js';
import {
  MENTAL_MODELS,
  TAG_DEFINITIONS,
  MENTAL_MODELS_OPERATIONS,
} from '../src/mental-models/operations.js';
import {
  LIST_MCP_ASSETS_PROMPT,
  INTERLEAVED_THINKING_PROMPT,
} from '../src/prompts/index.js';

// Tool definitions (we'll inline these since they're defined in index.ts)
const THOUGHTBOX_TOOL = {
  name: 'thoughtbox',
  description: `Step-by-step thinking tool for complex problem-solving.

Supports flexible reasoning: forward thinking (1→N), backward thinking (N→1), branching, and revision.
Adjust your approach dynamically as understanding deepens.

Use for:
- Multi-step analysis and planning
- Problems requiring course correction
- Hypothesis generation and testing
- System design and architecture decisions`,
  inputSchema: {
    type: 'object',
    properties: {
      thought: {
        type: 'string',
        description: 'Your current thinking step',
      },
      nextThoughtNeeded: {
        type: 'boolean',
        description: 'Whether another thought step is needed',
      },
      thoughtNumber: {
        type: 'integer',
        description: 'Current thought number (can be 1→N for forward thinking, or N→1 for backward/goal-driven thinking)',
        minimum: 1,
      },
      totalThoughts: {
        type: 'integer',
        description: 'Estimated total thoughts needed',
        minimum: 1,
      },
      isRevision: {
        type: 'boolean',
        description: 'Whether this revises previous thinking',
      },
      revisesThought: {
        type: 'integer',
        description: 'Which thought is being reconsidered',
        minimum: 1,
      },
      branchFromThought: {
        type: 'integer',
        description: 'Branching point thought number',
        minimum: 1,
      },
      branchId: {
        type: 'string',
        description: 'Branch identifier',
      },
      needsMoreThoughts: {
        type: 'boolean',
        description: 'If more thoughts are needed',
      },
      includeGuide: {
        type: 'boolean',
        description: 'Request the patterns cookbook guide as embedded resource',
      },
    },
    required: ['thought', 'nextThoughtNeeded', 'thoughtNumber', 'totalThoughts'],
  },
};

const NOTEBOOK_TOOL = {
  name: 'notebook',
  description: `Notebook toolhost for literate programming with JavaScript/TypeScript.

Create, manage, and execute interactive notebooks with markdown documentation and executable code cells.
Each notebook runs in an isolated environment with its own package.json and workspace.

Features:
- Pre-structured templates for guided workflows
- Isolated execution environments
- Full execution support with output capture`,
};

const MENTAL_MODELS_TOOL = {
  name: 'mental_models',
  description: `Access ${MENTAL_MODELS.length} mental models for structured reasoning.

Each model provides a complete prompt with process steps, examples, and pitfalls.
Mental models are process scaffolds that tell you HOW to think about a problem, not WHAT to think.`,
};

function generateHeader(): string {
  const timestamp = new Date().toISOString();
  return `# Thoughtbox MCP Server - Capabilities

> Auto-generated documentation of all server capabilities.
> Generated: ${timestamp}

## Overview

**Package:** \`@kastalien-research/thoughtbox\`
**MCP Name:** \`io.github.Kastalien-Research/thoughtbox\`
**Version:** 1.0.1

Thoughtbox is an MCP server that provides cognitive enhancement tools for LLM agents. It offers infrastructure for structured reasoning, not intelligence - the server serves process scaffolds that tell agents HOW to think, not WHAT to think.

---

`;
}

function generateToolsSection(): string {
  let md = `## Tools

The server provides ${3} tools:

`;

  // Thoughtbox tool
  md += `### 1. \`thoughtbox\` - Step-by-Step Thinking

${THOUGHTBOX_TOOL.description}

#### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
`;

  const props = THOUGHTBOX_TOOL.inputSchema.properties;
  const required = THOUGHTBOX_TOOL.inputSchema.required;

  for (const [key, value] of Object.entries(props)) {
    const prop = value as any;
    const isRequired = required.includes(key);
    md += `| \`${key}\` | ${prop.type} | ${isRequired ? 'Yes' : 'No'} | ${prop.description} |\n`;
  }

  // Notebook tool
  md += `
### 2. \`notebook\` - Literate Programming Toolhost

${NOTEBOOK_TOOL.description}

#### Available Operations (${NOTEBOOK_OPERATIONS.length})

| Operation | Category | Description |
|-----------|----------|-------------|
`;

  for (const op of NOTEBOOK_OPERATIONS) {
    md += `| \`${op.name}\` | ${op.category} | ${op.description.split('\n')[0]} |\n`;
  }

  // Templates
  md += `
#### Available Templates

`;
  for (const template of AVAILABLE_TEMPLATES) {
    md += `- \`${template}\`\n`;
  }

  // Mental Models tool
  md += `
### 3. \`mental_models\` - Structured Reasoning Toolhost

${MENTAL_MODELS_TOOL.description}

#### Available Operations (${MENTAL_MODELS_OPERATIONS.length})

| Operation | Category | Description |
|-----------|----------|-------------|
`;

  for (const op of MENTAL_MODELS_OPERATIONS) {
    md += `| \`${op.name}\` | ${op.category} | ${op.description.split('\n')[0]} |\n`;
  }

  // Tags
  md += `
#### Available Tags (${TAG_DEFINITIONS.length})

| Tag | Description |
|-----|-------------|
`;

  for (const tag of TAG_DEFINITIONS) {
    md += `| \`${tag.name}\` | ${tag.description} |\n`;
  }

  // Mental Models
  md += `
#### Mental Models (${MENTAL_MODELS.length})

| Name | Title | Tags |
|------|-------|------|
`;

  for (const model of MENTAL_MODELS) {
    md += `| \`${model.name}\` | ${model.title} | ${model.tags.join(', ')} |\n`;
  }

  md += '\n---\n\n';
  return md;
}

function generatePromptsSection(): string {
  let md = `## Prompts

The server provides 2 prompt templates:

### 1. \`list_mcp_assets\`

**Description:** ${LIST_MCP_ASSETS_PROMPT.description}

No arguments required.

### 2. \`interleaved-thinking\`

**Description:** ${INTERLEAVED_THINKING_PROMPT.description}

#### Arguments

| Name | Required | Description |
|------|----------|-------------|
`;

  for (const arg of INTERLEAVED_THINKING_PROMPT.arguments) {
    md += `| \`${arg.name}\` | ${arg.required ? 'Yes' : 'No'} | ${arg.description} |\n`;
  }

  md += '\n---\n\n';
  return md;
}

function generateResourcesSection(): string {
  let md = `## Resources

### Static Resources

| URI | Name | MIME Type |
|-----|------|-----------|
| \`system://status\` | Notebook Server Status | application/json |
| \`thoughtbox://notebook/operations\` | Notebook Operations Catalog | application/json |
| \`thoughtbox://patterns-cookbook\` | Thoughtbox Patterns Cookbook | text/markdown |
| \`thoughtbox://architecture\` | Server Architecture Guide | text/markdown |
| \`thoughtbox://mental-models/operations\` | Mental Models Operations Catalog | application/json |
| \`thoughtbox://mental-models\` | Mental Models Root | application/json |

### Tag-based Resources

`;

  for (const tag of TAG_DEFINITIONS) {
    md += `- \`thoughtbox://mental-models/${tag.name}\`\n`;
  }

  md += `
### Resource Templates

| URI Template | Description |
|--------------|-------------|
| \`thoughtbox://mental-models/{tag}/{model}\` | Browse mental models by tag |
| \`thoughtbox://mental-models/{tag}\` | List models under a specific tag |
| \`thoughtbox://interleaved/{mode}\` | IRCoT-style interleaved reasoning guides (modes: research, analysis, development) |

---

`;
  return md;
}

function generateNotebookOperationsDetail(): string {
  let md = `## Notebook Operations Detail

`;

  const categories = [...new Set(NOTEBOOK_OPERATIONS.map(op => op.category))];

  for (const category of categories) {
    const categoryOps = NOTEBOOK_OPERATIONS.filter(op => op.category === category);
    md += `### ${category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}\n\n`;

    for (const op of categoryOps) {
      md += `#### \`${op.name}\` - ${op.title}\n\n`;
      md += `${op.description}\n\n`;

      if (op.inputSchema.properties && Object.keys(op.inputSchema.properties).length > 0) {
        md += `**Parameters:**\n\n`;
        md += `| Parameter | Type | Required | Description |\n`;
        md += `|-----------|------|----------|-------------|\n`;

        const props = op.inputSchema.properties;
        const required = op.inputSchema.required || [];

        for (const [key, value] of Object.entries(props)) {
          const prop = value as any;
          const isRequired = required.includes(key);
          const typeStr = prop.enum ? `enum: ${prop.enum.join(', ')}` : prop.type;
          md += `| \`${key}\` | ${typeStr} | ${isRequired ? 'Yes' : 'No'} | ${prop.description || ''} |\n`;
        }
        md += '\n';
      }

      if (op.example) {
        md += `**Example:**\n\n\`\`\`json\n${JSON.stringify(op.example, null, 2)}\n\`\`\`\n\n`;
      }
    }
  }

  md += '---\n\n';
  return md;
}

function generateFooter(): string {
  return `## Configuration

### Environment Variables

- \`DISABLE_THOUGHT_LOGGING\` - Set to "true" to disable thought output to stderr

### Smithery Configuration

\`\`\`typescript
{
  disableThoughtLogging: boolean // default: false
}
\`\`\`

---

## Summary Statistics

- **Tools:** 3 (thoughtbox, notebook, mental_models)
- **Notebook Operations:** ${NOTEBOOK_OPERATIONS.length}
- **Mental Models Operations:** ${MENTAL_MODELS_OPERATIONS.length}
- **Mental Models:** ${MENTAL_MODELS.length}
- **Tags:** ${TAG_DEFINITIONS.length}
- **Prompts:** 2
- **Static Resources:** 6+
- **Resource Templates:** 3
`;
}

async function main(): Promise<void> {
  try {
    console.log('📝 Generating capabilities documentation...');

    let markdown = '';
    markdown += generateHeader();
    markdown += generateToolsSection();
    markdown += generatePromptsSection();
    markdown += generateResourcesSection();
    markdown += generateNotebookOperationsDetail();
    markdown += generateFooter();

    await fs.writeFile(OUTPUT_FILE, markdown, 'utf-8');
    console.log(`✅ Generated ${OUTPUT_FILE}`);
    console.log(`   - ${MENTAL_MODELS.length} mental models`);
    console.log(`   - ${TAG_DEFINITIONS.length} tags`);
    console.log(`   - ${NOTEBOOK_OPERATIONS.length} notebook operations`);
  } catch (error) {
    console.error('❌ Failed to generate capabilities:', error);
    process.exit(1);
  }
}

main();
