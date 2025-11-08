# Notebook Optimization Phase 2: Response Optimization - End State Specification

**Status**: Target Architecture  
**Version**: 1.0  
**Phase**: 2 of 3  
**Prerequisites**: Phase 1 complete  
**Last Updated**: 2025-11-07  
**Estimated Implementation Time**: 2-3 hours  
**Expected Performance Gain**: 25-40% smaller responses, faster serialization

## Purpose

This document describes the desired end state of Phase 2 notebook optimizations, which make operation resource embedding smart and configurable to reduce response size and improve serialization performance.

## Overview

Phase 2 focuses on optimizing the data sent back to clients by making embedded operation resources optional. Currently, every notebook tool response embeds the full operation definition, adding 200-500 bytes per response regardless of whether the client needs it.

This phase introduces **smart embedding** with backward compatibility.

## Problem Statement

### Current Behavior

Every successful notebook operation response looks like this:

```json
{
  "content": [
    {
      "type": "text",
      "text": "{ \"success\": true, ... }"
    },
    {
      "type": "resource",
      "resource": {
        "uri": "thoughtbox://notebook/operations/create",
        "title": "Create Notebook",
        "mimeType": "application/json",
        "text": "{ \"name\": \"create\", \"title\": ..., \"inputSchema\": ... }",
        "annotations": {
          "audience": ["assistant"],
          "priority": 0.5
        }
      }
    }
  ]
}
```

**Issues**:
- Operation schema embedded in EVERY response
- Client likely already has this information
- Adds ~300-500 bytes per operation
- Redundant serialization work
- Noise in response for clients that don't need it

### Target Behavior

Responses should be **lean by default**, with schema available **on-demand**:

```json
{
  "content": [
    {
      "type": "text",
      "text": "{ \"success\": true, ... }"
    }
  ]
}
```

Clients can request schema when needed via:
- Reading `thoughtbox://notebook/operations/{operation}` resource
- Setting `includeSchema: true` in operation args

---

## Architecture Changes

### 1. Smart Embedding Logic

**File**: `src/notebook/index.ts`

**Location**: Lines ~416-431 (current embedding block)

**Target Logic**:

```typescript
// Determine if operation schema should be embedded
const shouldEmbed = 
  // Explicitly requested by client
  (args.includeSchema === true) ||
  // Operation failed (schema helps debug)
  (result.success === false) ||
  // First-time hint mode (optional - see Configuration)
  (config.alwaysEmbedSchema === true);

// Conditionally embed operation details as resource
if (shouldEmbed && opDef) {
  content.push({
    type: "resource",
    resource: {
      uri: `thoughtbox://notebook/operations/${operation}`,
      title: opDef.title,
      mimeType: "application/json",
      text: JSON.stringify(opDef, null, 2),
      annotations: {
        audience: ["assistant"],
        priority: 0.5,
      },
    },
  });
}
```

**Decision Tree**:
```
Should embed operation schema?
├─ args.includeSchema === true? → YES
├─ result.success === false? → YES (helps with debugging)
├─ config.alwaysEmbedSchema === true? → YES (backward compat mode)
└─ else → NO (lean response)
```

---

### 2. Operation Input Schema Extension

**File**: `src/notebook/index.ts`

**Location**: Tool definition, lines ~524-538

**Current Schema**:
```typescript
inputSchema: {
  type: "object",
  properties: {
    operation: {
      type: "string",
      enum: getOperationNames(),
      description: "The notebook operation to execute",
    },
    args: {
      type: "object",
      description: "Arguments for the operation (varies by operation)",
    },
  },
  required: ["operation"],
}
```

**Target Schema** (add includeSchema property):
```typescript
inputSchema: {
  type: "object",
  properties: {
    operation: {
      type: "string",
      enum: getOperationNames(),
      description: "The notebook operation to execute",
    },
    args: {
      type: "object",
      description: "Arguments for the operation (varies by operation). May include 'includeSchema' boolean to embed operation definition in response.",
      properties: {
        includeSchema: {
          type: "boolean",
          description: "If true, embed the operation schema in the response as an additional resource. Useful for debugging or first-time operation discovery.",
        }
      }
    },
  },
  required: ["operation"],
}
```

---

### 3. Configuration Option

**File**: `src/index.ts`

**Location**: Lines ~31-39 (config schema)

**Current Config**:
```typescript
export const configSchema = z.object({
  disableThoughtLogging: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Disable thought output to stderr (useful for production deployments)"
    ),
});
```

**Target Config** (add alwaysEmbedSchema option):
```typescript
export const configSchema = z.object({
  disableThoughtLogging: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Disable thought output to stderr (useful for production deployments)"
    ),
  alwaysEmbedSchema: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Always embed operation schemas in notebook tool responses (backward compatibility mode)"
    ),
});
```

**Usage**:
```typescript
const server = createServer({
  config: {
    disableThoughtLogging: false,
    alwaysEmbedSchema: false, // New clients use lean responses
  },
});
```

---

### 4. Per-Operation Resource Endpoints

**File**: `src/index.ts`

**Location**: Lines ~471-539 (ReadResourceRequestSchema handler)

**Current Behavior**: Only handles `thoughtbox://notebook/operations` (full catalog)

**Target Behavior**: Also handle individual operation resources

**Add New Handler**:
```typescript
// Handle individual operation schema resources
if (uri.startsWith("thoughtbox://notebook/operations/")) {
  const operationName = uri.substring("thoughtbox://notebook/operations/".length);
  const opDef = getOperation(operationName);
  
  if (!opDef) {
    throw new Error(`Unknown notebook operation: ${operationName}`);
  }
  
  return {
    contents: [{
      uri,
      mimeType: "application/json",
      text: JSON.stringify({
        name: opDef.name,
        title: opDef.title,
        description: opDef.description,
        category: opDef.category,
        inputs: opDef.inputSchema,
        example: opDef.example,
      }, null, 2),
    }],
  };
}
```

This should be placed **before** the full catalog handler, so URIs are matched in order:
1. `thoughtbox://notebook/operations/{operation}` → single operation
2. `thoughtbox://notebook/operations` → full catalog

---

### 5. Resource Templates for Operations

**File**: `src/notebook/operations.ts`

**New Export**: Add resource template function

```typescript
/**
 * Get resource templates for individual operation schemas
 */
export function getOperationResourceTemplates() {
  return {
    resourceTemplates: [
      {
        uriTemplate: "thoughtbox://notebook/operations/{operation}",
        name: "notebook-operation-schema",
        title: "Notebook Operation Schema",
        description: "Schema and documentation for a specific notebook operation. Operation parameter must be one of: " + OPERATION_NAMES.join(", "),
        mimeType: "application/json",
        annotations: {
          audience: ["assistant"],
          priority: 0.6,
        },
      },
    ],
  };
}
```

**File**: `src/notebook/index.ts`

**Export Addition**:
```typescript
export { getOperationResourceTemplates } from "./operations.js";
```

**File**: `src/index.ts`

**Location**: Lines ~467-469 (ListResourceTemplatesRequestSchema handler)

**Update Handler**:
```typescript
server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
  const interleavedTemplates = getInterleavedResourceTemplates();
  const operationTemplates = getOperationResourceTemplates();
  
  return {
    resourceTemplates: [
      ...interleavedTemplates.resourceTemplates,
      ...operationTemplates.resourceTemplates,
    ],
  };
});
```

---

## File Changes Summary

### Modified Files

1. **`src/notebook/index.ts`**
   - Add smart embedding logic in `processTool()` method
   - Update tool input schema to document `includeSchema` parameter
   - Extract `getOperation` import from operations.ts

2. **`src/notebook/operations.ts`**
   - Add `getOperationResourceTemplates()` export function

3. **`src/index.ts`**
   - Add `alwaysEmbedSchema` to config schema
   - Pass config to NotebookServer constructor
   - Add individual operation resource handler in `ReadResourceRequestSchema`
   - Update `ListResourceTemplatesRequestSchema` to include operation templates
   - Import and use `getOperationResourceTemplates`

4. **`src/notebook/index.ts` (constructor)**
   - Accept optional config parameter
   - Store config for use in smart embedding

---

## Usage Examples

### Example 1: Lean Response (Default)

**Request**:
```json
{
  "name": "notebook",
  "arguments": {
    "operation": "create",
    "args": {
      "title": "My Notebook",
      "language": "typescript"
    }
  }
}
```

**Response**:
```json
{
  "content": [{
    "type": "text",
    "text": "{\n  \"success\": true,\n  \"notebook\": {\n    \"id\": \"abc123\",\n    \"title\": \"My Notebook\",\n    \"language\": \"typescript\",\n    \"cellCount\": 3,\n    \"createdAt\": 1699401234567\n  }\n}"
  }]
}
```

**Size**: ~250 bytes

---

### Example 2: Schema Embedded on Request

**Request**:
```json
{
  "name": "notebook",
  "arguments": {
    "operation": "create",
    "args": {
      "title": "My Notebook",
      "language": "typescript",
      "includeSchema": true
    }
  }
}
```

**Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"success\": true,\n  \"notebook\": {...}\n}"
    },
    {
      "type": "resource",
      "resource": {
        "uri": "thoughtbox://notebook/operations/create",
        "title": "Create Notebook",
        "mimeType": "application/json",
        "text": "{\n  \"name\": \"create\",\n  \"title\": \"Create Notebook\",\n  ...\n}",
        "annotations": {
          "audience": ["assistant"],
          "priority": 0.5
        }
      }
    }
  ]
}
```

**Size**: ~650 bytes

---

### Example 3: Schema Embedded on Error

**Request**:
```json
{
  "name": "notebook",
  "arguments": {
    "operation": "add_cell",
    "args": {
      "notebookId": "invalid-id",
      "cellType": "code",
      "content": "console.log('test');"
    }
  }
}
```

**Response** (automatic schema embedding because error):
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"success\": false,\n  \"error\": \"filename is required for code cells\"\n}"
    },
    {
      "type": "resource",
      "resource": {
        "uri": "thoughtbox://notebook/operations/add_cell",
        "title": "Add Cell",
        "mimeType": "application/json",
        "text": "{\n  \"name\": \"add_cell\",\n  ...\n  \"inputSchema\": {...}\n}",
        "annotations": {
          "audience": ["assistant"],
          "priority": 0.5
        }
      }
    }
  ],
  "isError": true
}
```

**Rationale**: Schema helps client/model understand what went wrong

---

### Example 4: Fetch Schema Separately

**Client discovers operation via resource template**:
```
GET thoughtbox://notebook/operations/{operation}
```

**Read specific operation**:
```json
{
  "uri": "thoughtbox://notebook/operations/run_cell"
}
```

**Response**:
```json
{
  "contents": [{
    "uri": "thoughtbox://notebook/operations/run_cell",
    "mimeType": "application/json",
    "text": "{\n  \"name\": \"run_cell\",\n  \"title\": \"Run Cell\",\n  \"description\": \"Execute a code cell and capture output\",\n  \"category\": \"execution\",\n  \"inputs\": {\n    \"type\": \"object\",\n    \"properties\": {\n      \"notebookId\": { \"type\": \"string\", ... },\n      \"cellId\": { \"type\": \"string\", ... }\n    },\n    \"required\": [\"notebookId\", \"cellId\"]\n  },\n  \"example\": {\n    \"notebookId\": \"abc123\",\n    \"cellId\": \"cell456\"\n  }\n}"
  }]
}
```

---

## Performance Impact

### Response Size Reduction

| Scenario | Before | After | Reduction |
|----------|--------|-------|-----------|
| Successful operation | 650 bytes | 250 bytes | 61% smaller |
| Failed operation | 650 bytes | 650 bytes | Same (schema helps debug) |
| With includeSchema | 650 bytes | 650 bytes | Same (explicit request) |
| Backward compat mode | 650 bytes | 650 bytes | Same (config enabled) |

### Serialization Performance

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| JSON.stringify time | ~0.3ms | ~0.1ms | 66% faster |
| Response payload | ~650 bytes | ~250 bytes | 61% smaller |
| Network transfer | ~650 bytes | ~250 bytes | 61% less data |

### Real-World Impact

**Scenario**: Client performs 100 notebook operations

**Before**:
- Total response data: 65,000 bytes (~65KB)
- Serialization time: ~30ms
- Network transfer: ~65KB

**After**:
- Total response data: 25,000 bytes (~25KB)
- Serialization time: ~10ms
- Network transfer: ~25KB

**Savings**: 40KB bandwidth, 20ms CPU time

---

## Verification Checklist

When implementation is complete, the following should be true:

### Functionality
- [ ] Default responses are lean (no embedded schema)
- [ ] `includeSchema: true` embeds schema in response
- [ ] Failed operations automatically embed schema
- [ ] `alwaysEmbedSchema: true` config restores old behavior
- [ ] Individual operation resources are readable
- [ ] Resource templates advertise operation pattern

### Performance
- [ ] Default responses are ~60% smaller
- [ ] Serialization time reduced proportionally
- [ ] No performance regression on any operation

### Compatibility
- [ ] All existing operations still work
- [ ] Old clients with `alwaysEmbedSchema: true` see no change
- [ ] New clients get optimized responses by default

---

## Migration Guide

### For Server Operators

**No action required** - default behavior changes to optimized responses.

To maintain old behavior (always embed schemas):
```json
{
  "mcpServers": {
    "thoughtbox": {
      "command": "npx",
      "args": ["-y", "thoughtbox"],
      "env": {
        "ALWAYS_EMBED_SCHEMA": "true"
      }
    }
  }
}
```

### For Client Developers

**Recommended approach** - fetch schemas on-demand:

```typescript
// First time seeing an operation
const operation = "create";
const schema = await client.readResource(
  `thoughtbox://notebook/operations/${operation}`
);
// Cache schema locally

// Execute operation (lean response)
const result = await client.callTool("notebook", {
  operation,
  args: { ... }
});
```

**Alternative approach** - request schema when needed:

```typescript
const result = await client.callTool("notebook", {
  operation: "create",
  args: {
    title: "My Notebook",
    language: "typescript",
    includeSchema: true  // Explicit request
  }
});
// Schema embedded in result.content[1]
```

---

## Backward Compatibility

### Breaking Changes

**None** - this is an opt-in optimization.

### Default Behavior Change

- **Before Phase 2**: All responses include embedded schema
- **After Phase 2**: Responses are lean by default

This is a **breaking change in behavior** but not in **API contract**. Clients that relied on embedded schemas can:
1. Set `alwaysEmbedSchema: true` config (easiest)
2. Add `includeSchema: true` to args (per-call basis)
3. Fetch schemas via resource reads (recommended)

### Recommended Migration Timeline

1. **Week 1**: Deploy with `alwaysEmbedSchema: true` (no change for users)
2. **Week 2-4**: Monitor usage, educate clients about optimization
3. **Week 4+**: Flip default to `alwaysEmbedSchema: false` (optimized)

---

## Testing Strategy

### Unit Tests

```typescript
describe("Smart schema embedding", () => {
  it("should not embed schema by default", async () => {
    const result = await notebookServer.processTool("create", {
      title: "Test",
      language: "javascript"
    });
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
  });

  it("should embed schema when explicitly requested", async () => {
    const result = await notebookServer.processTool("create", {
      title: "Test",
      language: "javascript",
      includeSchema: true
    });
    expect(result.content).toHaveLength(2);
    expect(result.content[1].type).toBe("resource");
  });

  it("should embed schema on operation failure", async () => {
    const result = await notebookServer.processTool("add_cell", {
      notebookId: "invalid",
      cellType: "code",
      content: "test"
      // Missing: filename
    });
    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(2);
    expect(result.content[1].type).toBe("resource");
  });

  it("should always embed when config enabled", async () => {
    const server = new NotebookServer({ alwaysEmbedSchema: true });
    const result = await server.processTool("list", {});
    expect(result.content).toHaveLength(2);
  });
});
```

### Integration Tests

```typescript
describe("Operation resource endpoints", () => {
  it("should serve individual operation schemas", async () => {
    const response = await server.readResource(
      "thoughtbox://notebook/operations/create"
    );
    expect(response.contents[0].mimeType).toBe("application/json");
    const schema = JSON.parse(response.contents[0].text);
    expect(schema.name).toBe("create");
  });

  it("should advertise operation templates", async () => {
    const templates = await server.listResourceTemplates();
    const opTemplate = templates.resourceTemplates.find(
      t => t.uriTemplate === "thoughtbox://notebook/operations/{operation}"
    );
    expect(opTemplate).toBeDefined();
  });
});
```

---

## Success Metrics

After implementation, measure:

1. **Average response size**: Should drop by ~60% for successful operations
2. **Serialization time**: Should drop by ~66%
3. **Client satisfaction**: Survey whether clients prefer lean responses
4. **Resource reads**: Monitor reads of individual operation resources
5. **Error debugging**: Verify schema-on-error aids troubleshooting

---

## References

- **MCP Embedded Resources**: https://modelcontextprotocol.io/specification/2025-06-18/server/prompts#embedded-resources
- **Resource Templates**: https://modelcontextprotocol.io/specification/2025-06-18/server/resources
- **Implementation**: `src/notebook/index.ts`, `src/notebook/operations.ts`

---

## Notes

- This optimization respects the principle of **progressive disclosure** - give clients minimal info by default, more on request
- Schema-on-error is a **UX enhancement** - helps models understand what went wrong
- Resource templates make operations **discoverable** without bloating responses
- The `alwaysEmbedSchema` config provides **zero-friction rollback** if needed

**Status**: Ready for implementation after Phase 1 complete. This phase has slightly more risk than Phase 1 due to behavior change, but mitigation via config makes it safe.
