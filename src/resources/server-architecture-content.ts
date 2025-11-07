// Auto-generated from local-docs/server-architecture-guide.md
// This allows the content to be bundled into the JavaScript build for both STDIO and HTTP transports

export const SERVER_ARCHITECTURE_GUIDE = `<!-- srcbook:{"language":"typescript","tsconfig.json":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2022\",\n    \"module\": \"ES2022\",\n    \"moduleResolution\": \"node\",\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"strict\": true,\n    \"resolveJsonModule\": true,\n    \"allowSyntheticDefaultImports\": true,\n    \"forceConsistentCasingInFileNames\": true\n  }\n}"} -->

# Understanding the Thoughtbox MCP Server

###### package.json

\`\`\`json
{
  "type": "module",
  "dependencies": {}
}
\`\`\`

## Introduction

Thoughtbox is an MCP (Model Context Protocol) server that provides cognitive enhancement tools for LLM agents. It exposes two main capabilities:

1. **thoughtbox** - A sequential thinking tool supporting 7 core reasoning patterns
2. **notebook** - A literate programming toolhost for executable documentation

This notebook explores the architecture, implementation patterns, and design decisions behind the Thoughtbox server.

### Why MCP?

The Model Context Protocol enables LLMs to interact with external systems through:
- **Tools**: Callable functions with typed parameters
- **Resources**: URI-addressable content with MIME types
- **Prompts**: Template-based interactions

Thoughtbox leverages all three MCP primitives to create a powerful thinking environment.

## Architecture Overview

The server consists of three main components:

\`\`\`
┌─────────────────────────────────────────────┐
│         Thoughtbox MCP Server               │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │   MCP Protocol Layer (index.ts)      │  │
│  │   - Request handlers                 │  │
│  │   - Tool dispatch                    │  │
│  │   - Resource management              │  │
│  └──────────────────────────────────────┘  │
│              ↓          ↓                   │
│  ┌─────────────────┐  ┌─────────────────┐  │
│  │ ClearThought    │  │ NotebookServer  │  │
│  │ Server          │  │                 │  │
│  │                 │  │ - State Manager │  │
│  │ - History       │  │ - Execution     │  │
│  │ - Branches      │  │ - Export        │  │
│  │ - Formatting    │  │ - Operations    │  │
│  └─────────────────┘  └─────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
\`\`\`

### Key Design Patterns

1. **Toolhost Pattern**: Single \`notebook\` tool with operation dispatch vs 10 separate tools
2. **Resource Embedding**: Responses include contextual documentation as embedded resources
3. **Dual Transport**: Supports both stdio (CLI) and HTTP (Smithery) transports
4. **Lazy Initialization**: Resources created on-demand, not at startup

###### mcp-protocol-flow.ts

\`\`\`typescript
// Demonstration: MCP Protocol Message Flow
// This shows how a tool call flows through the server

interface MCPToolRequest {
  method: 'tools/call';
  params: {
    name: string;
    arguments: Record<string, any>;
  };
}

interface MCPToolResponse {
  content: Array<{
    type: 'text' | 'resource';
    text?: string;
    resource?: any;
  }>;
  isError?: boolean;
}

// Example: thoughtbox tool call
const exampleRequest: MCPToolRequest = {
  method: 'tools/call',
  params: {
    name: 'thoughtbox',
    arguments: {
      thought: 'Analyzing the problem structure',
      thoughtNumber: 1,
      totalThoughts: 5,
      nextThoughtNeeded: true
    }
  }
};

console.log('MCP Request:', JSON.stringify(exampleRequest, null, 2));

// Server processes this and returns:
const exampleResponse: MCPToolResponse = {
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        thoughtNumber: 1,
        totalThoughts: 5,
        nextThoughtNeeded: true,
        branches: [],
        thoughtHistoryLength: 1
      }, null, 2)
    },
    // At thought 1, patterns cookbook is embedded
    {
      type: 'resource',
      resource: {
        uri: 'thinking://patterns-cookbook',
        title: 'Sequential Thinking Patterns Cookbook',
        mimeType: 'text/markdown'
      }
    }
  ]
};

console.log('\nMCP Response:', JSON.stringify(exampleResponse, null, 2));
\`\`\`

## The thoughtbox Tool

The \`thoughtbox\` tool implements a flexible sequential thinking framework. Key features:

### Parameters
- **thought**: The current reasoning step
- **thoughtNumber**: Logical position (1 to N)
- **totalThoughts**: Estimated total (adjustable on the fly)
- **nextThoughtNeeded**: Continue or conclude?
- **isRevision**: Marks thought as updating a previous one
- **branchFromThought**: Creates alternative reasoning paths
- **includeGuide**: Requests the patterns cookbook

### Implementation Highlights

1. **Validation**: Type-checks all inputs before processing
2. **History Tracking**: Stores all thoughts for branch management
3. **Colored Output**: Uses chalk to format thoughts with borders and colors
4. **Resource Embedding**: Conditionally includes the patterns cookbook at thought 1, final thought, or on-demand
5. **Error Handling**: Returns structured error responses with \`isError\` flag

###### clear-thought-patterns.ts

\`\`\`typescript
// Demonstration: thoughtbox patterns

// 1. Forward Thinking (1 → N)
const forwardThinking = {
  thought: 'Starting analysis of the problem',
  thoughtNumber: 1,
  totalThoughts: 10,
  nextThoughtNeeded: true
};

// 2. Backward Thinking (N → 1)  
const backwardThinking = {
  thought: 'Final state: System handles 10k req/s',
  thoughtNumber: 8,  // Start at the end
  totalThoughts: 8,
  nextThoughtNeeded: true
};

// 3. Branching
const branch = {
  thought: 'Exploring SQL approach',
  thoughtNumber: 6,
  totalThoughts: 15,
  branchFromThought: 5,
  branchId: 'sql-option',
  nextThoughtNeeded: true
};

// 4. Revision
const revision = {
  thought: 'CORRECTION: Found additional stakeholder',
  thoughtNumber: 11,
  totalThoughts: 15,
  isRevision: true,
  revisesThought: 4,
  nextThoughtNeeded: true
};

// 5. Request guide on-demand
const withGuide = {
  thought: 'Need to review reasoning patterns',
  thoughtNumber: 7,
  totalThoughts: 15,
  includeGuide: true,  // Embeds patterns cookbook
  nextThoughtNeeded: true
};

console.log('Forward:', forwardThinking);
console.log('\nBackward:', backwardThinking);
console.log('\nBranch:', branch);
console.log('\nRevision:', revision);
console.log('\nWith Guide:', withGuide);
\`\`\`

## The Notebook Toolhost Pattern

Instead of exposing 10 separate MCP tools (\`notebook_create\`, \`notebook_list\`, etc.), Thoughtbox uses a **toolhost pattern**:

- **Single Tool**: \`notebook(operation, args)\`
- **Operation Dispatch**: The \`operation\` parameter routes to specific handlers
- **Cleaner Interface**: Clients see 1 tool instead of 10
- **Easier Maintenance**: Add operations without changing MCP tool registration

### Available Operations

**Notebook Management**
- \`create\`: Create new notebook
- \`list\`: List all notebooks
- \`load\`: Load from .src.md file
- \`export\`: Save to .src.md file

**Cell Operations**
- \`add_cell\`: Add title/markdown/code cell
- \`update_cell\`: Modify cell content
- \`list_cells\`: List all cells
- \`get_cell\`: Get cell details

**Execution**
- \`run_cell\`: Execute code cell
- \`install_deps\`: Install npm dependencies

### Operation Catalog Resource

The \`notebook://operations\` resource provides a complete catalog of operations with schemas and examples. This enables LLMs to discover and use operations correctly.

###### operations-catalog.ts

\`\`\`typescript
// Demonstration: Operations Catalog Structure
// This is what notebook://operations resource contains

const operationsCatalog = {
  version: '1.0.0',
  operations: [
    {
      name: 'create',
      title: 'Create Notebook',
      description: 'Create a new headless notebook',
      category: 'notebook-management',
      inputs: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          language: { type: 'string', enum: ['javascript', 'typescript'] }
        },
        required: ['title', 'language']
      },
      example: {
        title: 'Data Analysis',
        language: 'typescript'
      }
    },
    // ... 9 more operations
  ],
  categories: [
    {
      name: 'notebook-management',
      description: 'Create, list, load, and export notebooks'
    },
    {
      name: 'cell-operations',
      description: 'Add, update, list, and retrieve cells'
    },
    {
      name: 'execution',
      description: 'Run code cells and install dependencies'
    }
  ]
};

console.log('Total operations:', operationsCatalog.operations.length);
console.log('Categories:', operationsCatalog.categories.map(c => c.name));
console.log('\nExample operation:', JSON.stringify(operationsCatalog.operations[0], null, 2));
\`\`\`

## Resource Embedding Pattern

A powerful MCP feature: **tools can embed resources in their responses**. This provides context-aware documentation.

### Three Resource Types

1. **system://status** - Runtime health information
   - Notebook count, active notebooks
   - Dynamic, reflects current state

2. **notebook://operations** - Complete operations catalog
   - All 10 operations with schemas and examples
   - Static reference documentation

3. **thinking://patterns-cookbook** - Reasoning patterns guide
   - 7 core thinking patterns
   - Embedded at thought 1, final thought, or on-demand

### Embedded Resources in Responses

When you call a notebook operation, the response includes an embedded resource:

\`\`\`typescript
{
  content: [
    { type: 'text', text: '...' },
    {
      type: 'resource',
      resource: {
        uri: 'notebook://operations/create',
        title: 'Create Notebook',
        mimeType: 'application/json',
        text: '{ "name": "create", ... }',
        annotations: {
          audience: ['assistant'],
          priority: 0.5
        }
      }
    }
  ]
}
\`\`\`

This means every tool response includes just-in-time documentation about what was executed!

###### resource-embedding.ts

\`\`\`typescript
// Demonstration: Resource Embedding in Tool Responses

interface EmbeddedResource {
  uri: string;
  title: string;
  mimeType: string;
  text: string;
  annotations?: {
    audience?: string[];
    priority?: number;
  };
}

interface ToolResponse {
  content: Array<{
    type: 'text' | 'resource';
    text?: string;
    resource?: EmbeddedResource;
  }>;
  isError?: boolean;
}

// Example: notebook tool response with embedded operation doc
const notebookResponse: ToolResponse = {
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        success: true,
        notebook: {
          id: 'abc123',
          title: 'My Notebook',
          language: 'typescript',
          cellCount: 2
        }
      }, null, 2)
    },
    {
      type: 'resource',
      resource: {
        uri: 'notebook://operations/create',
        title: 'Create Notebook',
        mimeType: 'application/json',
        text: JSON.stringify({
          name: 'create',
          description: 'Create a new notebook',
          inputSchema: { /* ... */ }
        }),
        annotations: {
          audience: ['assistant'],  // For LLM consumption
          priority: 0.5
        }
      }
    }
  ],
  isError: false
};

console.log('Response structure:', {
  textParts: notebookResponse.content.filter(c => c.type === 'text').length,
  resourceParts: notebookResponse.content.filter(c => c.type === 'resource').length
});

console.log('\nEmbedded resource URI:', 
  notebookResponse.content.find(c => c.type === 'resource')?.resource?.uri
);
\`\`\`

## Meta-Observation: Self-Referential Demonstration

This notebook was created **using the notebook tool itself**! Every cell you see was added via:

\`\`\`typescript
notebook({
  operation: 'add_cell',
  args: {
    notebookId: 'pkbfkk9q28',
    cellType: 'markdown' | 'code',
    content: '...',
    filename: '...'  // for code cells
  }
})
\`\`\`

This demonstrates the power of the toolhost pattern:
1. The LLM used the notebook tool to explain how the notebook tool works
2. Each response included embedded resources about the operations being used
3. The patterns cookbook was accessed via the thoughtbox tool during planning

This is **literate programming for AI agents** - executable documentation that explains itself!

## Key Takeaways

### 1. MCP Enables Structured Cognition

The Model Context Protocol isn't just about API calls - it's about giving LLMs structured ways to think, document, and organize knowledge. Thoughtbox demonstrates two cognitive patterns:
- **Sequential thinking** (thoughtbox): Structured reasoning with 7 core patterns
- **Executable documentation** (notebook): Literate programming for AI

### 2. The Toolhost Pattern Scales Better

**Traditional**: 10 separate tools → 10 tool definitions → complex tool discovery

**Toolhost**: 1 tool + operation parameter → cleaner interface → extensible

Adding new operations doesn't require changing the MCP interface.

### 3. Resource Embedding Provides Context

Embedding resources in tool responses means:
- LLMs get just-in-time documentation
- No need to separately fetch resource URIs
- Contextual guidance for each operation
- Audience annotations (\`["assistant"]\`) target content to LLMs

### 4. Architecture Supports Multiple Transports

The same server logic works with:
- **stdio**: For CLI tools like Claude Desktop
- **HTTP**: For cloud deployments like Smithery

Dual transport is achieved via the \`createServer()\` export pattern.

### 5. Validation and Error Handling Matter

Every handler:
1. Validates inputs with type checks
2. Returns structured responses with \`{content, isError}\`
3. Includes helpful error messages
4. Maintains type safety throughout

### 6. Cognitive Tools for Thinking Agents

Thoughtbox demonstrates that MCP servers can be **cognitive enhancement tools**, not just data connectors. The future of AI tooling includes:
- Structured thinking frameworks
- Executable documentation environments
- Memory and knowledge management
- Workflow orchestration
- Collaborative reasoning

---

## Conclusion

The Thoughtbox MCP server showcases modern patterns for building AI-native tools. By combining the toolhost pattern, resource embedding, and cognitive frameworks, it creates a powerful environment for LLM agents to think, document, and execute code.

The self-referential nature of this notebook - created using the very tools it explains - demonstrates the meta-cognitive potential of well-designed MCP servers.`;
