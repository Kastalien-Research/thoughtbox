# Thoughtbox MCP Server - Capabilities

> Auto-generated documentation of all server capabilities.
> Generated: 2025-12-06T21:01:40.726Z

## Overview

**Package:** `@kastalien-research/thoughtbox`
**MCP Name:** `io.github.Kastalien-Research/thoughtbox`
**Version:** 1.0.1

Thoughtbox is an MCP server that provides cognitive enhancement tools for LLM agents. It offers infrastructure for structured reasoning, not intelligence - the server serves process scaffolds that tell agents HOW to think, not WHAT to think.

---

## Tools

The server provides 3 tools:

### 1. `thoughtbox` - Step-by-Step Thinking

Step-by-step thinking tool for complex problem-solving.

Supports flexible reasoning: forward thinking (1→N), backward thinking (N→1), branching, and revision.
Adjust your approach dynamically as understanding deepens.

Use for:
- Multi-step analysis and planning
- Problems requiring course correction
- Hypothesis generation and testing
- System design and architecture decisions

#### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `thought` | string | Yes | Your current thinking step |
| `nextThoughtNeeded` | boolean | Yes | Whether another thought step is needed |
| `thoughtNumber` | integer | Yes | Current thought number (can be 1→N for forward thinking, or N→1 for backward/goal-driven thinking) |
| `totalThoughts` | integer | Yes | Estimated total thoughts needed |
| `isRevision` | boolean | No | Whether this revises previous thinking |
| `revisesThought` | integer | No | Which thought is being reconsidered |
| `branchFromThought` | integer | No | Branching point thought number |
| `branchId` | string | No | Branch identifier |
| `needsMoreThoughts` | boolean | No | If more thoughts are needed |
| `includeGuide` | boolean | No | Request the patterns cookbook guide as embedded resource |

### 2. `notebook` - Literate Programming Toolhost

Notebook toolhost for literate programming with JavaScript/TypeScript.

Create, manage, and execute interactive notebooks with markdown documentation and executable code cells.
Each notebook runs in an isolated environment with its own package.json and workspace.

Features:
- Pre-structured templates for guided workflows
- Isolated execution environments
- Full execution support with output capture

#### Available Operations (10)

| Operation | Category | Description |
|-----------|----------|-------------|
| `create` | notebook-management | Create a new headless notebook for literate programming with JavaScript or TypeScript support. Optionally use a pre-structured template for guided workflows. |
| `list` | notebook-management | List all active notebooks with their metadata |
| `load` | notebook-management | Load a notebook from .src.md format. |
| `add_cell` | cell-operations | Add a cell to a notebook (title, markdown, or executable code) |
| `update_cell` | cell-operations | Update the content of an existing cell |
| `run_cell` | execution | Execute a code cell and capture output (stdout, stderr, exit code) |
| `install_deps` | execution | Install npm dependencies defined in the notebook's package.json |
| `list_cells` | cell-operations | List all cells in a notebook with their metadata |
| `get_cell` | cell-operations | Get complete details of a specific cell including content and execution results |
| `export` | notebook-management | Export a notebook to .src.md format. |

#### Available Templates

- `sequential-feynman`

### 3. `mental_models` - Structured Reasoning Toolhost

Access 15 mental models for structured reasoning.

Each model provides a complete prompt with process steps, examples, and pitfalls.
Mental models are process scaffolds that tell you HOW to think about a problem, not WHAT to think.

#### Available Operations (4)

| Operation | Category | Description |
|-----------|----------|-------------|
| `get_model` | retrieval | Retrieve the full prompt content for a specific mental model |
| `list_models` | discovery | List all available mental models, optionally filtered by tag |
| `list_tags` | discovery | List all available tags with their descriptions |
| `get_capability_graph` | discovery | Get a structured representation of all Thoughtbox capabilities (tools, operations, mental models) for initializing a knowledge graph. Use with memory_create_entities and memory_create_relations to make the server's capabilities salient. |

#### Available Tags (9)

| Tag | Description |
|-----|-------------|
| `debugging` | Finding and fixing issues in code, logic, or systems |
| `planning` | Breaking down work, sequencing tasks, project organization |
| `decision-making` | Choosing between options under uncertainty |
| `risk-analysis` | Identifying what could go wrong and how to prevent it |
| `estimation` | Making reasonable guesses with limited information |
| `prioritization` | Deciding what to do first, resource allocation |
| `communication` | Explaining clearly to humans, documentation |
| `architecture` | System design, component relationships, structure |
| `validation` | Checking assumptions, testing hypotheses, verification |

#### Mental Models (15)

| Name | Title | Tags |
|------|-------|------|
| `rubber-duck` | Rubber Duck Debugging | debugging, communication |
| `five-whys` | Five Whys | debugging, validation |
| `pre-mortem` | Pre-mortem Analysis | risk-analysis, planning |
| `assumption-surfacing` | Assumption Surfacing | validation, planning |
| `steelmanning` | Steelmanning | decision-making, validation |
| `trade-off-matrix` | Trade-off Matrix | decision-making, prioritization |
| `fermi-estimation` | Fermi Estimation | estimation |
| `abstraction-laddering` | Abstraction Laddering | architecture, communication |
| `decomposition` | Decomposition | planning, architecture |
| `adversarial-thinking` | Adversarial Thinking | risk-analysis, validation |
| `opportunity-cost` | Opportunity Cost Analysis | decision-making, prioritization |
| `constraint-relaxation` | Constraint Relaxation | planning, architecture |
| `time-horizon-shifting` | Time Horizon Shifting | planning, decision-making |
| `impact-effort-grid` | Impact/Effort Grid | prioritization |
| `inversion` | Inversion | risk-analysis, planning |

---

## Prompts

The server provides 2 prompt templates:

### 1. `list_mcp_assets`

**Description:** Overview of all MCP capabilities, tools, resources, and quickstart guide

No arguments required.

### 2. `interleaved-thinking`

**Description:** Use this Thoughtbox server as a reasoning workspace to alternate between internal reasoning steps and external tool/action invocation. Enables structured multi-phase execution with tooling inventory, sufficiency assessment, strategy development, and execution.

#### Arguments

| Name | Required | Description |
|------|----------|-------------|
| `task` | Yes | The task to complete using interleaved thinking approach |
| `thoughts_limit` | No | Maximum number of thoughts to use (default: 100) |
| `clear_folder` | No | Whether to clear the .interleaved-thinking folder after completion, keeping only final-answer.md (default: false) |

---

## Resources

### Static Resources

| URI | Name | MIME Type |
|-----|------|-----------|
| `system://status` | Notebook Server Status | application/json |
| `thoughtbox://notebook/operations` | Notebook Operations Catalog | application/json |
| `thoughtbox://patterns-cookbook` | Thoughtbox Patterns Cookbook | text/markdown |
| `thoughtbox://architecture` | Server Architecture Guide | text/markdown |
| `thoughtbox://mental-models/operations` | Mental Models Operations Catalog | application/json |
| `thoughtbox://mental-models` | Mental Models Root | application/json |

### Tag-based Resources

- `thoughtbox://mental-models/debugging`
- `thoughtbox://mental-models/planning`
- `thoughtbox://mental-models/decision-making`
- `thoughtbox://mental-models/risk-analysis`
- `thoughtbox://mental-models/estimation`
- `thoughtbox://mental-models/prioritization`
- `thoughtbox://mental-models/communication`
- `thoughtbox://mental-models/architecture`
- `thoughtbox://mental-models/validation`

### Resource Templates

| URI Template | Description |
|--------------|-------------|
| `thoughtbox://mental-models/{tag}/{model}` | Browse mental models by tag |
| `thoughtbox://mental-models/{tag}` | List models under a specific tag |
| `thoughtbox://interleaved/{mode}` | IRCoT-style interleaved reasoning guides (modes: research, analysis, development) |

---

## Notebook Operations Detail

### Notebook Management

#### `create` - Create Notebook

Create a new headless notebook for literate programming with JavaScript or TypeScript support. Optionally use a pre-structured template for guided workflows.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Notebook title (or topic name when using templates) |
| `language` | enum: javascript, typescript | Yes | Programming language for the notebook |
| `template` | enum: sequential-feynman | No | Optional: Load a pre-structured template. 'sequential-feynman' provides guided structure for deep learning workflows with Feynman Technique. |

**Example:**

```json
{
  "title": "Data Analysis Example",
  "language": "typescript"
}
```

#### `list` - List Notebooks

List all active notebooks with their metadata

**Example:**

```json
{}
```

#### `load` - Load Notebook

Load a notebook from .src.md format.

Accepts either a filesystem path OR content string (exactly one required).

- STDIO mode: Provide 'path' to read from local filesystem
- HTTP mode: Provide 'content' string (e.g., from previous export)

Both approaches create an identical in-memory notebook.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | No | Filesystem path to .src.md file (option 1) |
| `content` | string | No | Raw .src.md file content as string (option 2) |

**Example:**

```json
{
  "path": "/path/to/notebook.src.md"
}
```

#### `export` - Export Notebook

Export a notebook to .src.md format.

Always returns the notebook content as a string. Optionally writes to a filesystem path if provided.

- STDIO mode: Provide 'path' to write to local filesystem (content still returned)
- HTTP mode: Omit 'path', use returned 'content' directly

Both modes always receive the content, ensuring transport transparency.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `notebookId` | string | Yes | The ID of the notebook to export |
| `path` | string | No | Optional: Filesystem path to write .src.md file (typically used in STDIO mode) |

**Example:**

```json
{
  "notebookId": "abc123",
  "path": "/path/to/output.src.md"
}
```

### Cell Operations

#### `add_cell` - Add Cell

Add a cell to a notebook (title, markdown, or executable code)

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `notebookId` | string | Yes | Notebook ID |
| `cellType` | enum: title, markdown, code | Yes | Type of cell to add |
| `content` | string | Yes | Cell content (text for title/markdown, source code for code) |
| `filename` | string | No | Filename for code cells (e.g., 'example.js', 'utils.ts') |
| `position` | integer | No | Optional position to insert cell (0-indexed), appends if not specified |

**Example:**

```json
{
  "notebookId": "abc123",
  "cellType": "code",
  "content": "console.log('Hello, world!');",
  "filename": "hello.js"
}
```

#### `update_cell` - Update Cell

Update the content of an existing cell

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `notebookId` | string | Yes | Notebook ID |
| `cellId` | string | Yes | Cell ID |
| `content` | string | Yes | New content for the cell |

**Example:**

```json
{
  "notebookId": "abc123",
  "cellId": "cell456",
  "content": "console.log('Updated!');"
}
```

#### `list_cells` - List Cells

List all cells in a notebook with their metadata

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `notebookId` | string | Yes | Notebook ID |

**Example:**

```json
{
  "notebookId": "abc123"
}
```

#### `get_cell` - Get Cell

Get complete details of a specific cell including content and execution results

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `notebookId` | string | Yes | Notebook ID |
| `cellId` | string | Yes | Cell ID |

**Example:**

```json
{
  "notebookId": "abc123",
  "cellId": "cell456"
}
```

### Execution

#### `run_cell` - Run Cell

Execute a code cell and capture output (stdout, stderr, exit code)

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `notebookId` | string | Yes | Notebook ID |
| `cellId` | string | Yes | Cell ID to execute |

**Example:**

```json
{
  "notebookId": "abc123",
  "cellId": "cell456"
}
```

#### `install_deps` - Install Dependencies

Install npm dependencies defined in the notebook's package.json

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `notebookId` | string | Yes | Notebook ID |

**Example:**

```json
{
  "notebookId": "abc123"
}
```

---

## Configuration

### Environment Variables

- `DISABLE_THOUGHT_LOGGING` - Set to "true" to disable thought output to stderr

### Smithery Configuration

```typescript
{
  disableThoughtLogging: boolean // default: false
}
```

---

## Summary Statistics

- **Tools:** 3 (thoughtbox, notebook, mental_models)
- **Notebook Operations:** 10
- **Mental Models Operations:** 4
- **Mental Models:** 15
- **Tags:** 9
- **Prompts:** 2
- **Static Resources:** 6+
- **Resource Templates:** 3
