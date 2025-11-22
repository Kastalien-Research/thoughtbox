# MCP Sampling Implementation Exploration for Thoughtbox

## Executive Summary

This document explores how the MCP sampling primitive could be integrated into the Thoughtbox MCP server. The SDK (v1.20.0) already includes full sampling support via the `server.createMessage()` method.

## Current Architecture Review

### MCP Server Structure

The Thoughtbox server implements three main tools using different architectural patterns:

1. **ClearThoughtServer (`thoughtbox` tool)**: Direct implementation for step-by-step reasoning
2. **NotebookServer (`notebook` tool)**: Toolhost pattern with 10 operations for literate programming
3. **MentalModelsServer (`mental_models` tool)**: Toolhost pattern with 15 embedded reasoning frameworks

### Key Files
- `/src/index.ts` (645 lines): Main server, ClearThoughtServer, request handlers
- `/src/notebook/index.ts` (601 lines): Notebook operations
- `/src/mental-models/index.ts` (648 lines): Mental models registry

## MCP Sampling Specification Summary

### What is Sampling?

**Sampling enables servers to request LLM generations from clients** without needing API keys. This allows agentic server behaviors while maintaining client control over model access and permissions.

Key principles:
- **Human in the loop**: Clients SHOULD present sampling requests to users for approval
- **Client control**: Clients have full discretion over model selection and request approval
- **Provider-agnostic**: Servers specify capability priorities (cost, speed, intelligence) rather than specific models

### Protocol Details

#### Request Format
```typescript
server.createMessage({
  messages: [
    { role: "user", content: { type: "text", text: "..." } },
    { role: "assistant", content: { type: "text", text: "..." } }
  ],
  systemPrompt: "Optional instructions for model behavior",
  maxTokens: 1000,
  modelPreferences: {
    hints: [{ name: "claude" }],  // Optional model hints (substring matches)
    costPriority: 0.5,             // 0-1 scale
    speedPriority: 0.7,            // 0-1 scale
    intelligencePriority: 0.9      // 0-1 scale
  }
})
```

#### Response Format
```typescript
{
  model: "claude-3-5-sonnet-20241022",
  role: "assistant",
  content: { type: "text", text: "..." },
  stopReason: "endTurn" | "stopSequence" | "maxTokens"
}
```

#### Capability Negotiation

Clients must declare sampling support during initialization:
```typescript
{
  capabilities: {
    sampling: {}
  }
}
```

The server can check if the client supports sampling:
```typescript
const capabilities = server.getClientCapabilities();
if (capabilities?.sampling) {
  // Client supports sampling
}
```

## SDK Implementation

The `@modelcontextprotocol/sdk` v1.20.0 already includes:

✅ **Server.createMessage()** method for making sampling requests
✅ **CreateMessageRequestSchema** for request validation
✅ **CreateMessageResultSchema** for response validation
✅ **Automatic capability checking** (throws error if client doesn't support sampling)

Located at: `/node_modules/@modelcontextprotocol/sdk/dist/cjs/server/index.d.ts:77`

## Potential Use Cases in Thoughtbox

### 1. **ClearThoughtServer Enhancements**

#### A. Thought Validation & Suggestions
**Use case**: After each thought, sample the LLM to validate reasoning and suggest next steps

```typescript
async processThought(input: unknown, extra: RequestHandlerExtra) {
  // ... existing thought processing ...

  const capabilities = this.getClientCapabilities();
  if (capabilities?.sampling) {
    // Request validation from LLM
    const validation = await extra.sendRequest({
      method: "sampling/createMessage",
      params: {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Validate this reasoning step and suggest improvements:\n\n${validatedInput.thought}`
            }
          }
        ],
        systemPrompt: "You are a critical thinking assistant. Identify logical flaws and suggest improvements.",
        maxTokens: 500,
        modelPreferences: {
          intelligencePriority: 0.9,
          speedPriority: 0.5
        }
      }
    }, CreateMessageResultSchema);

    // Return validation as additional context
  }
}
```

#### B. Branching Decision Support
**Use case**: Help decide when/how to branch reasoning paths

```typescript
// Analyze current thought path and suggest if branching would be beneficial
const branchingSuggestion = await extra.sendRequest({
  method: "sampling/createMessage",
  params: {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Given these thoughts so far:\n${thoughtHistory}\n\nShould we explore alternative approaches? If yes, suggest branch points.`
        }
      }
    ],
    maxTokens: 300,
    modelPreferences: {
      intelligencePriority: 0.9
    }
  }
}, CreateMessageResultSchema);
```

### 2. **NotebookServer Enhancements**

#### A. Code Generation Assistant
**Use case**: Generate code for cells based on natural language descriptions

```typescript
async processTool(operation: string, args: any, extra: RequestHandlerExtra) {
  if (operation === "generate_code" && this.clientSupportsSampling()) {
    const response = await extra.sendRequest({
      method: "sampling/createMessage",
      params: {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Generate TypeScript code for: ${args.description}\n\nNotebook context: ${args.context}`
            }
          }
        ],
        systemPrompt: "You are a code generation assistant for literate programming notebooks.",
        maxTokens: 1000,
        modelPreferences: {
          intelligencePriority: 0.8,
          speedPriority: 0.6
        }
      }
    }, CreateMessageResultSchema);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            generatedCode: response.content.text,
            model: response.model
          })
        }
      ]
    };
  }
}
```

#### B. Code Explanation & Documentation
**Use case**: Explain existing code cells or suggest improvements

```typescript
// New operation: explain_cell
async explainCell(cellId: string, extra: RequestHandlerExtra) {
  const cell = this.getCell(cellId);

  const explanation = await extra.sendRequest({
    method: "sampling/createMessage",
    params: {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Explain this code:\n\`\`\`typescript\n${cell.source}\n\`\`\``
          }
        }
      ],
      maxTokens: 500,
      modelPreferences: {
        intelligencePriority: 0.7,
        speedPriority: 0.8
      }
    }
  }, CreateMessageResultSchema);

  return explanation;
}
```

### 3. **MentalModelsServer Enhancements**

#### A. Mental Model Application
**Use case**: Apply a specific mental model to a user's problem

```typescript
async processTool(operation: string, args: any, extra: RequestHandlerExtra) {
  if (operation === "apply_model" && this.clientSupportsSampling()) {
    const model = this.getModel(args.modelName);

    const application = await extra.sendRequest({
      method: "sampling/createMessage",
      params: {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Mental Model: ${model.name}\n\n${model.content}\n\nProblem: ${args.problem}\n\nApply this mental model to analyze the problem.`
            }
          }
        ],
        systemPrompt: "You are a reasoning assistant that applies mental models to real-world problems.",
        maxTokens: 1500,
        modelPreferences: {
          intelligencePriority: 0.95,
          speedPriority: 0.3
        }
      }
    }, CreateMessageResultSchema);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            model: args.modelName,
            analysis: application.content.text,
            llmModel: application.model
          })
        }
      ]
    };
  }
}
```

#### B. Model Selection Assistance
**Use case**: Suggest which mental model best fits a problem

```typescript
async suggestModel(problem: string, extra: RequestHandlerExtra) {
  const catalog = this.getModelCatalog();

  const suggestion = await extra.sendRequest({
    method: "sampling/createMessage",
    params: {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Available mental models:\n${catalog}\n\nProblem: ${problem}\n\nWhich mental model(s) would be most helpful?`
          }
        }
      ],
      systemPrompt: "You help select appropriate mental models for problem-solving.",
      maxTokens: 400,
      modelPreferences: {
        intelligencePriority: 0.8,
        speedPriority: 0.7
      }
    }
  }, CreateMessageResultSchema);

  return suggestion;
}
```

## Implementation Patterns

### Pattern 1: Direct Sampling in Tool Handlers

**When to use**: For simple, one-off sampling requests within tool execution

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
  if (request.params.name === "my_tool") {
    const capabilities = server.getClientCapabilities();

    if (capabilities?.sampling) {
      const result = await extra.sendRequest({
        method: "sampling/createMessage",
        params: { /* ... */ }
      }, CreateMessageResultSchema);

      // Use result in tool response
    }
  }
});
```

**Pros**: Simple, straightforward
**Cons**: Tightly couples sampling to tool logic

### Pattern 2: Sampling as Separate Operations

**When to use**: For toolhost-based servers (like notebook and mental_models)

```typescript
// Add new operations to existing toolhosts
const OPERATIONS = {
  // ... existing operations ...

  generate_with_llm: {
    description: "Generate content using LLM sampling",
    schema: z.object({
      prompt: z.string(),
      modelPrefs: z.object({ /* ... */ }).optional()
    })
  }
};

async processTool(operation: string, args: any, extra: RequestHandlerExtra) {
  if (operation === "generate_with_llm") {
    return await this.sampleLLM(args, extra);
  }
}
```

**Pros**: Clean separation, explicit opt-in
**Cons**: More complex API surface

### Pattern 3: New Sampling-First Tool

**When to use**: For advanced use cases requiring sophisticated LLM interactions

```typescript
// New tool: thoughtbox_assistant
const THOUGHTBOX_ASSISTANT_TOOL = {
  name: "thoughtbox_assistant",
  description: "AI assistant that uses mental models and reasoning frameworks",
  inputSchema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["reason", "brainstorm", "analyze", "critique"]
      },
      context: { type: "object" }
    }
  }
};

class ThoughtboxAssistant {
  async processTool(operation: string, args: any, extra: RequestHandlerExtra) {
    // Use sampling extensively to provide AI-powered reasoning assistance
    switch (operation) {
      case "reason":
        return await this.reasonWithMentalModels(args, extra);
      case "brainstorm":
        return await this.brainstormWithLLM(args, extra);
      // etc.
    }
  }
}
```

**Pros**: Rich, integrated experience; clean API
**Cons**: Requires clients to support sampling

## Design Considerations

### 1. **Graceful Degradation**

Always check if client supports sampling:

```typescript
const capabilities = server.getClientCapabilities();
if (!capabilities?.sampling) {
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        error: "This operation requires a client that supports MCP sampling",
        requiredCapability: "sampling"
      })
    }],
    isError: true
  };
}
```

### 2. **Model Preferences Strategy**

Different use cases need different priorities:

| Use Case | Cost | Speed | Intelligence |
|----------|------|-------|--------------|
| Quick validation | 0.8 | 0.9 | 0.3 |
| Code generation | 0.5 | 0.6 | 0.8 |
| Deep reasoning | 0.2 | 0.3 | 0.95 |
| Documentation | 0.7 | 0.7 | 0.5 |

### 3. **System Prompts**

Craft specific system prompts for each use case:

```typescript
const SYSTEM_PROMPTS = {
  codeGen: "You are a TypeScript code generation assistant. Generate clean, well-typed code with minimal dependencies.",
  reasoning: "You are a critical thinking assistant. Apply rigorous logic and identify assumptions.",
  explanation: "You explain complex concepts clearly and concisely."
};
```

### 4. **Token Budgets**

Set appropriate maxTokens based on use case:

- Quick suggestions: 100-300 tokens
- Code generation: 500-1500 tokens
- Deep analysis: 1500-3000 tokens

### 5. **Error Handling**

```typescript
try {
  const result = await extra.sendRequest({
    method: "sampling/createMessage",
    params: { /* ... */ }
  }, CreateMessageResultSchema);
} catch (error) {
  // Client may reject sampling request (human in the loop)
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        error: "Sampling request was rejected or failed",
        details: error.message
      })
    }],
    isError: true
  };
}
```

## Recommended Implementation Approach

### Phase 1: Experimental Feature in Notebook Server

Start with a single new operation in the notebook server:

```typescript
// Add to notebook operations
explain_code: {
  description: "Use LLM to explain code in a cell (requires client with sampling support)",
  requiresSampling: true,
  schema: z.object({
    cellId: z.string(),
    detailLevel: z.enum(["brief", "detailed"]).optional()
  })
}
```

**Benefits**:
- Low risk (single operation)
- Easy to test
- Natural fit (code explanation is valuable)
- Can be removed if problematic

### Phase 2: Mental Models Application

Add `apply_model` operation to mental_models server:

```typescript
apply_model: {
  description: "Apply a mental model to a problem using LLM (requires sampling)",
  requiresSampling: true,
  schema: z.object({
    modelName: z.string(),
    problem: z.string(),
    additionalContext: z.string().optional()
  })
}
```

**Benefits**:
- High value (core use case for mental models)
- Demonstrates intelligent reasoning
- Showcases Thoughtbox capabilities

### Phase 3: New Thoughtbox Assistant Tool

Create a dedicated sampling-first tool that integrates all capabilities:

```typescript
const ASSISTANT_TOOL = {
  name: "thoughtbox_assistant",
  description: "AI-powered reasoning assistant using Thoughtbox frameworks",
  operations: [
    "analyze_with_mental_model",
    "generate_reasoning_steps",
    "critique_argument",
    "brainstorm_solutions"
  ]
};
```

## Testing Strategy

### 1. **Client Capability Detection**

```typescript
// Test with sampling-capable client
// Test with non-sampling client (should gracefully degrade)
```

### 2. **Model Preference Verification**

Log which models are selected by clients for different preference profiles

### 3. **Human-in-the-Loop Testing**

Verify that clients present sampling requests for user approval

### 4. **Error Scenarios**

- Client rejects sampling request
- Network timeout during sampling
- Invalid response format

## Security & Privacy Considerations

1. **Data Leakage**: Sampling sends data to the client's LLM. Ensure no sensitive data is included.
2. **Prompt Injection**: Sanitize user inputs included in sampling requests
3. **Rate Limiting**: Consider implementing server-side rate limits on sampling requests
4. **Audit Logging**: Log sampling requests for debugging and usage analysis

## Open Questions

1. **Caching**: Should we cache sampling results for identical requests?
2. **Streaming**: Does the SDK support streaming sampling responses?
3. **Multi-turn**: Can we maintain conversation context across multiple tool calls?
4. **Custom Schemas**: Can we use structured output formats (JSON schemas)?

## Conclusion

The MCP sampling primitive is well-supported in the SDK and offers powerful opportunities for the Thoughtbox server to become more intelligent and helpful. The recommended approach is to:

1. **Start small**: Add one experimental operation to the notebook server
2. **Validate value**: Ensure users find it helpful
3. **Expand gradually**: Add mental model application, then consider a dedicated assistant tool
4. **Maintain compatibility**: Always gracefully handle clients without sampling support

The toolhost architecture makes it easy to add sampling-powered operations incrementally without breaking existing functionality.
