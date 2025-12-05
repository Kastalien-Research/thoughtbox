# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Thoughtbox is an MCP (Model Context Protocol) server providing cognitive enhancement tools for LLM agents. It offers three main tools: structured step-by-step reasoning (`thoughtbox`), literate programming notebooks (`notebook`), and mental model prompts (`mental_models`).

## Build & Development Commands

```bash
# Install dependencies
npm install

# Build for production (runs cycle check first)
npm run build

# Development server with interactive playground
npm run dev

# Run locally
npm run start          # HTTP server on port 3000
npm run start:stdio    # STDIO transport

# Build variants
npm run build:local     # TypeScript compile + copy resources
npm run build:smithery  # Build for Smithery deployment

# Code quality
npm run check:cycles         # Warn on <3 cycles, fail on >=3
npm run check:cycles:strict  # Fail on any cycles
```

## Architecture

### Entry Points
- `src/index.ts` - Main entry point and STDIO transport. Exports `createServer()` for both transports. Contains the `ClearThoughtServer` class for the thoughtbox tool.
- `src/http.ts` - Express HTTP server using StreamableHTTP transport. Stateless mode (new transport per request).

### Tool Modules (Toolhost Pattern)
Each tool module uses a dispatcher pattern: a single MCP tool with an `operation` parameter that routes to specific handlers.

- **`src/notebook/`** - Literate programming notebooks
  - `index.ts` - `NotebookServer` class, tool definition, operation dispatcher
  - `state.ts` - `NotebookStateManager` for in-memory notebook storage
  - `operations.ts` - Operation definitions with schemas and examples
  - `execution.ts` - Code cell execution via Node.js subprocess
  - `templates.generated.ts` - Auto-generated from `templates/` directory

- **`src/mental-models/`** - Structured reasoning prompts
  - `index.ts` - `MentalModelsServer` class, resource handlers, tool definition
  - `operations.ts` - Model registry, tag definitions, catalog generation
  - `contents/*.ts` - Individual mental model content (15 models)

- **`src/prompts/`** - MCP prompt templates
- **`src/resources/`** - Static content (patterns cookbook, architecture guide)

### Build Pipeline
1. `embed-templates.ts` - Embeds `templates/*.src.md` into TypeScript
2. `generate-capabilities.ts` - Generates `src/CAPABILITIES.md` from runtime introspection
3. TypeScript compilation
4. Resource copying to `dist/`

### Key Patterns
- **Toolhost dispatcher**: Single tool with `{ operation, args }` input schema routes to handlers
- **Embedded resources**: Tool responses can include `type: "resource"` content items
- **URI hierarchy**: `thoughtbox://mental-models/{tag}/{model}` for browsable resources
- **Lazy initialization**: NotebookServer creates temp directories on first use

## Environment Variables

- `DISABLE_THOUGHT_LOGGING=true` - Suppress thought output to stderr
- `PORT` - HTTP server port (default: 3000)

## File Conventions

- `.src.md` - Literate programming notebook format (markdown with code blocks)
- Mental models synced to `~/.thoughtbox/mental-models/{tag}/{model}.md`
