---
name: model-enhancement-servers
description: Guide for creating MCP servers that enhance LLM reasoning through structured processes, persistence, and workflow guidance. Use when building MCP servers for structured thinking, journaling, memory systems, or other cognitive enhancement patterns.
---

# Model Enhancement Servers

*Based on MCP Protocol Version: 2025-06-18*

## Overview

Model enhancement servers are a specialized category of MCP servers that extend LLM capabilities not by wrapping external APIs, but by providing structured reasoning frameworks, persistence mechanisms, and cognitive workflow guidance.

### Wrapper Servers vs. Model Enhancement Servers

**Wrapper servers** are like keys that open specific chests with specific treasures. They provide access to external services (Supabase, Gmail, Airtable) and are essential for integrating LLMs with existing systems.

**Model enhancement servers** are like pen and paper: general-purpose cognitive tools natively designed for LLM use. They extend the model's abilities across a variety of circumstances, not just specific API integrations.

Think of model enhancement servers as a **bullet journal for AI**. The model documents information with the server, which does basic heuristic processing to signal completion of steps and define next scopes. By directing the AI to consider only a small set of concerns during ongoing transactions, performance improves in tasks requiring memory, reasoning, and runtime lookup.

### The Context Window Benefit

Similar to how Getting Things Done (GTD) helps humans by offloading thoughts into documents, model enhancement servers help LLMs process more effectively. When we write down one thought instead of juggling a hundred, we can focus better. **Context window management is critical to all entities that use attention—a scarce resource.**

### "Do Nothing" as a core feature of Model Enhancement Servers

A model enhancement server does not *do* anything, any more than a real bullet journal "does" anything: its value is entirely tied to how well it
facilitates the agentic process it's meant to support.

Instead, the server "enhances" an agent's capabilities by externalizing some state that represents the agent's thinking process. As mentioned above, this externalized state allows the agent to focus on the current step. But further, because a representation of reasoning is lossy relative to the actual process of reasoning, creating the representation forces an agent to make choices about what is and is not important to the process: in this way, externalization can be modeled as a form of compression. Just as a human may improve their thinking through journaling or other forms of externalization, agents can improve their reasoning through externalization: the benefits of externalization are not confined to the carbon substrate.

---

## ⚠️ CRITICAL PRINCIPLE: The Server Does NOT Reason

**The most important thing to understand about model enhancement servers:**

### The agent performs reasoning. The server provides structure.

Model enhancement servers are **scaffolding, not reasoning engines**. They are persistence mechanisms and workflow guides, not AI models themselves.

**What the server does:**
- ✅ Records reasoning steps (journaling)
- ✅ Maintains state and history
- ✅ Validates input format
- ✅ Returns metadata and progress indicators
- ✅ Simplifies the possibility space available to the agent
- ✅ Encourages use of structured workflows
- ✅ Makes the process transparent and evaluable

**What the server does NOT do:**
- ❌ Generate thoughts or reasoning
- ❌ Decide what the next step should be
- ❌ Evaluate the quality of the agent's reasoning
- ❌ Make decisions about problem-solving approaches
- ❌ Act as an autonomous agent
- ❌ Perform any AI inference

### Why This Matters

The value of model enhancement comes from:
1. **Simplifying possibility space**: Fewer choices → better focus
2. **Encouraging structured workflows**: Patterns that can be evaluated and improved
3. **Making processes transparent**: We (and the agent) can see and analyze what the agent did
4. **Providing persistence**: The agent doesn't lose context

The server is a notebook, a journal, a whiteboard—not a tutor, not a critic, not a collaborator.

**Remember**: The MCP client application (the agent) does the thinking. Your server just keeps the whiteboard clean and organized.

---

## Core Patterns

### 1. Structured Journal Pattern

**Purpose**: Track and persist a sequence of reasoning steps while guiding the model through a cognitive process.

**Key Features**:
- Single tool with rich, descriptive guidance in the tool description
- State tracking (history of steps, branches, revisions)
- Support for non-linear thinking (revisions, branches, adjusting scope)
- Dual output channels (structured JSON for model, formatted logs for humans)

**When to Use**:
- Breaking down complex problems into steps
- Planning and design requiring iteration
- Analysis that might need course correction
- Problems where scope isn't fully known upfront
- Tasks requiring context maintenance across multiple steps

**Example: Sequential Thinking Server**

This server provides a framework for step-by-step reasoning with the ability to revise, branch, and adjust course.

**Architecture**:
```typescript
interface ThoughtData {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts?: boolean;
  nextThoughtNeeded: boolean;
}
```

**Tool Design**:
- **Name**: Single, clear tool name (e.g., `sequentialthinking`)
- **Description**: Extensive guidance on when to use, how it works, parameter meanings, key features, workflow recommendations
- **Input Schema**: Mix of required (core workflow) and optional (advanced features) fields
- **State Management**: Maintain history array, track branches separately, validate input, return status and metadata
- **Output Strategy**: JSON for model, formatted colored display for humans (stderr)

**Variations**: The Structured Journal pattern can be specialized for specific methodologies:

- **Structured Argumentation**: Typed workflow states (thesis, antithesis, synthesis), relationship graphs, methodology-aware suggestions
- **Analogical Reasoning**: Complex nested structures (source/target domains), multi-instance state tracking, rich metadata summaries

**Novel Strategies**:
1. Typed Workflow States: Use enums to make methodology steps explicit
2. Relationship Tracking: Maintain graphs of how entries relate
3. Auto-ID Generation: Reduce agent cognitive load
4. Confidence/Strength Metadata: Let agents express uncertainty numerically
5. Complex Nested Structures: Support domain-specific decomposition
6. Methodology-Aware Guidance: Suggest next steps based on formal structure
7. Multi-Instance Registries: Enable building on previous work
8. Rich State Summaries: Return contextual metadata about current state

---

### 2. Literate Reasoning / Notebook Pattern

**Purpose**: Provide a Jupyter-like notebook interface where models work through problems with full transparency and reproducibility.

**Key Features**:
- Markdown cells for explanations and reasoning
- Code cells for executable actions
- Cell-by-cell execution with visible outputs
- Re-runnable and modifiable workflows
- Living documentation of problem-solving process

**When to Use**:
- Complex multi-step processes requiring transparency
- Debugging and tracing agent reasoning
- Iterative problem-solving where you might modify approaches
- Creating reusable workflow templates ("notebook presets")
- Situations where the process matters as much as the result

**The Problem It Solves**:

Traditional agent interactions are "black boxes" - you get a final answer but don't see how the agent arrived at it. Notebooks provide four critical benefits:

1. **Transparency**: See the agent's thought process step-by-step
2. **Reproducibility**: Replay and refine workflows
3. **Built-in Gating**: Control agent reasoning at the source with validation checkpoints
4. **Headless Simplicity**: Serve as pure data structures via API/MCP tools without UI overhead

**Architecture Pattern**:

Unlike the Structured Journal pattern (which maintains state in the server), the Notebook pattern typically:
- Uses a CLI application to serve the notebook to the model (headless - no UI needed)
- Provides both markdown cells (guidance) and code cells (actions)
- Allows non-linear execution (jump to cells, re-run, modify)
- Maintains execution history and cell outputs
- Can be persisted and shared as templates
- Serves notebooks as data structures via MCP tools (agents interact via API, not visually)
- Enables gating between cells (validation, checkpoints, required steps)

**Notebook Structure**:
```typescript
interface NotebookCell {
  id: string;
  type: 'markdown' | 'code';
  content: string;
  output?: string;
  executionCount?: number;
  metadata?: Record<string, unknown>;
}

interface Notebook {
  cells: NotebookCell[];
  metadata: {
    language: string;
    title: string;
    description?: string;
  };
}
```

**Tool Design**:
- `notebook_create`: Initialize new notebook with optional preset template
- `notebook_add_cell`: Add markdown or code cells
- `notebook_run_cell`: Execute a specific cell (can enforce gating rules)
- `notebook_get_cell`: Retrieve cell content and output
- `notebook_validate_progression`: Check if agent can proceed to next cell (gating)
- `notebook_export`: Save notebook for sharing/reuse

**Gating Example**:
```typescript
// Server can enforce that certain cells must be executed before others
// NOTE: Gates enforce STRUCTURE (has X been done?), not QUALITY (was X done well?)
async function runCell(cellId: string): Promise<Response> {
  const cell = notebook.getCell(cellId);
  const gates = notebook.getGatesForCell(cellId);
  
  // Check if prerequisites are met (structural validation only)
  for (const gate of gates) {
    if (!gate.isOpen()) {
      return {
        error: `Cannot execute cell ${cellId}: ${gate.requirement}`,
        suggestion: `Complete cells [${gate.requiredCells.join(', ')}] first`
      };
    }
  }
  
  // Execute cell if gates are open
  return executeCell(cell);
}
```

**Use Cases**:
1. **Guided Workflows**: Pre-filled code cells with markdown explanations as tutorials
2. **Structured AI Behavior**: Direct agents through logical flows
3. **Notebook Presets**: Pre-made templates for common tasks (Git workflows, database queries, API integrations)
4. **Interactive Experimentation**: Modify parameters and re-run to see impact

**Implementation Reference**: 
- Base platform: [Srcbook](https://github.com/glassBead-tc/srcbook)
- Advanced implementation: Clear Thought 1.5
- Notebook format: [EphemeralNotebook.ts example](https://github.com/waldzellai/clearthought-onepointfive/blob/main/src/notebook/EphemeralNotebook.ts)

---

## Pattern Comparison: When to Use Which

### Structured Journal vs. Notebook

**Use Structured Journal when:**
- The process is primarily linear with optional branches
- You want minimal overhead (single tool, simple state)
- The focus is on the reasoning sequence itself
- Human inspection is secondary (optional stderr logging)
- The model drives the structure and pacing
- Example: Sequential thinking, step-by-step analysis

**Use Notebook when:**
- The process requires code execution and output inspection
- Transparency and reproducibility are critical
- You want to save/share the process as a template
- Multiple passes and revisions are expected
- Human inspection and modification are important
- You need built-in validation gates between reasoning steps
- Headless serving is preferred (agent interaction via API, no UI needed)
- Example: Research workflows, debugging, tutorials, multi-stage validation processes

**Hybrid Approach**:
You can combine both patterns - use a notebook where each cell represents a structured reasoning step that gets journaled.

---

## Implementation Guide (TypeScript)

### Project Setup

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
```

### Core Server Class Pattern

```typescript
class EnhancementServer {
  private state: YourStateType = initialState;
  private config: ConfigType;

  constructor() {
    this.config = {
      disableLogging: (process.env.DISABLE_LOGGING || "").toLowerCase() === "true"
    };
  }

  private validateInput(input: unknown): ValidatedType {
    // Type-safe validation - throw clear errors for invalid input
  }

  public processRequest(input: unknown): {
    content: Array<{ type: string; text: string }>;
    structuredContent?: { [key: string]: unknown };
    isError?: boolean;
  } {
    try {
      const validated = this.validateInput(input);
      this.updateState(validated);
      
      if (!this.config.disableLogging) {
        this.logToStderr(validated);
      }
      
      const responseData = this.getResponseData(validated);
      
      return {
        content: [{ type: "text", text: JSON.stringify(responseData, null, 2) }],
        structuredContent: responseData,
        isError: false
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            status: 'failed'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
}
```

### Tool Definition Pattern

```typescript
const ENHANCEMENT_TOOL: Tool = {
  name: "toolname",
  title: "Tool Display Name",  // Optional: display precedence: title > annotations.title > name
  
  description: `Comprehensive description that guides the model:
  
When to use this tool:
- Specific use cases

Key features:
- Feature explanations

Parameters explained:
- param1: What it means and how to use it

You should:
1. Step-by-step workflow guidance
2. Expected behavior patterns
3. When to stop/continue`,

  inputSchema: {
    type: "object",
    properties: {
      requiredField: { type: "string", description: "Clear description" },
      optionalField: { type: "boolean", description: "When to use this" }
    },
    required: ["requiredField"]
  },
  
  outputSchema: {  // Optional: enables structuredContent
    type: "object",
    properties: {
      status: { type: "string", description: "Operation status" },
      metadata: { type: "object", description: "Additional metadata" }
    },
    required: ["status"]
  },
  
  annotations: {  // Optional: hints about behavior
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};
```

### Server Initialization

```typescript
const server = new Server(
  { name: "your-enhancement-server", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

const enhancementServer = new EnhancementServer();

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [ENHANCEMENT_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "toolname") {
    return enhancementServer.processRequest(request.params.arguments);
  }
  return {
    content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
    isError: true
  };
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Enhancement Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
```

### Best Practices

**Tool Description Writing**:
- Front-load the "when to use" guidance
- Explain parameters in context, not just technically
- Provide workflow steps as numbered guidance
- Be explicit about flexibility and adaptation

**State Management**:
- Keep state minimal but sufficient for context
- Validate all inputs before updating state
- Return metadata that helps the model understand progress

**Error Handling**:
- Validate input with clear, specific error messages
- Guide the model toward correct usage in errors
- Always return structured responses, even for errors
- **CRITICAL**: Only validate format and structure, never evaluate reasoning quality

**Human Output** (optional):
- Log to stderr, never stdout (stdout is for MCP protocol)
- Make it visually distinct and informative
- Make it toggleable via environment variables

---

## Future Directions and Use Cases

As agentic networking matures, model enhancement servers enable novel patterns:

### Long-Running Async Processes

Model enhancement servers provide Day One mechanisms for maintaining context across extended operations:
- **Batch jobs**: Track progress through multi-hour processing tasks
- **Extended research**: Maintain context during deep exploration (e.g., Exa's Websets running 30+ minutes)
- **Multi-stage workflows**: Coordinate phases of complex work over hours or days

### Multi-Client Coordination

Model enhancement servers can connect to multiple clients simultaneously, acting as a bulletin board where different clients post and retrieve information. This enables coordination between clients that have no other means of communication. **MCP servers as proxies between clients** may become the dominant use case per-server.

### Formalized Workflows

Enhancement servers can support highly structured methodologies with clear definitions:
- **Scientific method**: Hypothesis generation, experimentation, validation
- **Design thinking**: Empathy, definition, ideation, prototyping, testing
- **Six Sigma**: DMAIC (Define, Measure, Analyze, Improve, Control)

The server guides adherence to the methodology while allowing flexibility within steps.

---

## Example Servers

### Sequential Thinking Server

See `example-servers/sequential-thinking` for full working example.

**What It Does**: Guides models through step-by-step reasoning, supports revision, branching, and dynamic scope adjustment.

**Key Design Decisions**:
1. Single `sequentialthinking` tool handles entire workflow
2. Rich description (~50 lines of guidance)
3. Flexible schema (required fields for core, optional for advanced)
4. Dual output (JSON for model, formatted boxes for humans)
5. State tracking (linear history + branch dictionary)

**The Whiteboard Analogy**: Each time Claude calls `sequentialthinking`, imagine Claude as a student: works out a step on a whiteboard, walks away to reflect, returns when ready for the next step. The server provides the persistent whiteboard; the model provides the reasoning.

### Structured Argumentation Server

See `example-servers/structured-argumentation` for full working example.

**What It Does**: Facilitates dialectical reasoning through formal argument structures (thesis → antithesis → synthesis).

**Key Features**: Formal claim/premises/conclusion structure, five argument types, relationship tracking, methodology guidance based on formal dialectical structure, auto-ID generation, confidence tracking.

### Analogical Reasoning Server

See `example-servers/analogical-reasoning` for full working example.

**What It Does**: Supports systematic analogical reasoning with source/target domain mapping and element typing.

**Key Features**: Complex nested structures, element typing (entity/attribute/relation/process), mapping strength ratings, domain registry for reuse, inference tracking with confidence levels.