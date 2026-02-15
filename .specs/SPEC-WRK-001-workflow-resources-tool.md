# SPEC-WRK-001: Workflow Resources Tool

> **Status**: Draft
> **Priority**: Medium
> **Phase**: Enhancement
> **Estimated Effort**: 3-4 hours
> **Source**: User request for post-init workflow tool with resource returns

## Summary

Add a `thoughtbox_workflows` tool that exposes workflow patterns as MCP-compliant embedded resources or resource links. This tool unlocks at Stage 2 (after cipher call) and provides discoverable access to workflow documentation like subagent-summarize, patterns-cookbook, session-analysis, etc.

## Problem Statement

Current workflow patterns exist as MCP resources but have limited discoverability:

1. **Resources require explicit reading**: Agent must know to call `resources/read` with exact URI
2. **No tool-based access**: Workflows aren't surfaced through the tool interface
3. **Progressive disclosure gap**: After cipher, agent has core tools but no guide to workflow patterns
4. **Context cost**: Reading full resources adds to conversation context

The tool should:
- Surface workflows through discoverable tool operations
- Return MCP-compliant resource content (embedded or linked)
- Integrate with progressive disclosure (Stage 2)
- Support different return modes (full embed vs. link-only)

## Scope

### In Scope
1. New `thoughtbox_workflows` tool with operations: `list`, `get`
2. MCP-compliant return types (embedded resources, resource links)
3. Stage 2 progressive disclosure integration
4. Annotation support (audience, priority)

### Out of Scope
- Creating new workflow content (use existing resources)
- Modifying progressive disclosure stages
- Client-side caching behavior

## Requirements

### R1: Tool Definition

```typescript
interface WorkflowsTool {
  name: 'thoughtbox_workflows';
  description: 'Access workflow patterns and guides for Thoughtbox usage';
  inputSchema: {
    type: 'object';
    properties: {
      operation: {
        enum: ['list', 'get'];
        description: 'list: show available workflows; get: retrieve specific workflow';
      };
      args: {
        type: 'object';
        properties: {
          workflowId?: string;    // Required for 'get'
          returnMode?: 'embedded' | 'link';  // Default: 'embedded'
        };
      };
    };
    required: ['operation'];
  };
}
```

### R2: Operations

#### R2.1: `list` Operation

Returns available workflows with metadata (not content):

```typescript
interface ListResult {
  workflows: WorkflowMetadata[];
}

interface WorkflowMetadata {
  id: string;           // e.g., 'subagent-summarize'
  name: string;         // e.g., 'Subagent Summarize Pattern'
  description: string;  // Brief description
  uri: string;          // MCP resource URI
  annotations?: {
    audience?: ('user' | 'assistant')[];
    priority?: number;  // 0.0 - 1.0
  };
}
```

**Example response:**
```json
{
  "content": [{
    "type": "text",
    "text": "Available workflows:\n- subagent-summarize: Context-isolated session retrieval\n- patterns-cookbook: Common Thoughtbox patterns\n- session-analysis: Session analysis workflows\n- notebook-export: Notebook export patterns"
  }],
  "structuredContent": {
    "workflows": [
      {
        "id": "subagent-summarize",
        "name": "Subagent Summarize Pattern",
        "description": "Context-isolated session retrieval via Task tool",
        "uri": "thoughtbox://workflows/subagent-summarize",
        "annotations": { "audience": ["assistant"], "priority": 0.8 }
      }
    ]
  }
}
```

#### R2.2: `get` Operation

Returns workflow content as embedded resource or resource link:

**Mode: embedded (default)**
```json
{
  "content": [{
    "type": "resource",
    "resource": {
      "uri": "thoughtbox://workflows/subagent-summarize",
      "mimeType": "text/markdown",
      "text": "# Subagent Summarize Pattern\n\nUse Claude Code's Task tool...",
      "annotations": {
        "audience": ["assistant"],
        "priority": 0.8
      }
    }
  }]
}
```

**Mode: link**
```json
{
  "content": [{
    "type": "resource_link",
    "uri": "thoughtbox://workflows/subagent-summarize",
    "name": "Subagent Summarize Pattern",
    "description": "Context-isolated session retrieval via Task tool",
    "mimeType": "text/markdown"
  }]
}
```

### R3: Workflow Registry

Map workflow IDs to content sources:

```typescript
interface WorkflowRegistry {
  workflows: Record<string, WorkflowDefinition>;
}

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  contentSource: string;  // Path to content module
  annotations: {
    audience: ('user' | 'assistant')[];
    priority: number;
  };
}

// Example registry
const WORKFLOW_REGISTRY: WorkflowRegistry = {
  workflows: {
    'subagent-summarize': {
      id: 'subagent-summarize',
      name: 'Subagent Summarize Pattern',
      description: 'Context-isolated session retrieval via Task tool',
      contentSource: './resources/subagent-summarize-content',
      annotations: { audience: ['assistant'], priority: 0.8 }
    },
    'patterns-cookbook': {
      id: 'patterns-cookbook',
      name: 'Patterns Cookbook',
      description: 'Common Thoughtbox usage patterns',
      contentSource: './resources/patterns-cookbook-content',
      annotations: { audience: ['assistant'], priority: 0.7 }
    },
    'session-analysis': {
      id: 'session-analysis',
      name: 'Session Analysis Guide',
      description: 'Workflows for analyzing Thoughtbox sessions',
      contentSource: './resources/session-analysis-guide-content',
      annotations: { audience: ['assistant'], priority: 0.6 }
    },
    'notebook-export': {
      id: 'notebook-export',
      name: 'Notebook Export Pattern',
      description: 'Export and share notebook sessions',
      contentSource: './resources/notebook-export-pattern',
      annotations: { audience: ['assistant'], priority: 0.5 }
    },
    'evolution-check': {
      id: 'evolution-check',
      name: 'Evolution Check',
      description: 'Track reasoning evolution across sessions',
      contentSource: './resources/evolution-check-content',
      annotations: { audience: ['assistant'], priority: 0.4 }
    }
  }
};
```

### R4: Progressive Disclosure Integration

Tool enabled at Stage 2 (STAGE_2_CIPHER_LOADED):

```typescript
// In tool-registry.ts
registerTool(
  ToolName.WORKFLOWS,
  workflowsTool,
  DisclosureStage.STAGE_2_CIPHER_LOADED
);
```

### R5: Error Handling

| Error Case | Response |
|------------|----------|
| Unknown workflow ID | `{ isError: true, content: [{ type: 'text', text: 'Workflow not found: {id}. Use list operation to see available workflows.' }] }` |
| Missing required args | `{ isError: true, content: [{ type: 'text', text: 'get operation requires workflowId in args' }] }` |

## Implementation

### Phase 1: Core Tool

1. Create `src/workflows/index.ts` - WorkflowsHandler class
2. Create `src/workflows/registry.ts` - Workflow registry
3. Register tool in `src/index.ts`
4. Add to tool-registry.ts at Stage 2

**Files to create:**
- `src/workflows/index.ts` - Main handler
- `src/workflows/registry.ts` - Workflow definitions

**Files to modify:**
- `src/index.ts` - Tool registration
- `src/tool-registry.ts` - Stage 2 disclosure

### Phase 2: Enhanced Features

1. Add caching for workflow content
2. Support partial content retrieval (headers-only mode)
3. Add workflow search/filter

## Migration Path

- No breaking changes
- New tool adds capability without affecting existing flows
- Resources remain accessible via `resources/read`

## Acceptance Criteria

1. [ ] `thoughtbox_workflows` tool registered and visible after cipher
2. [ ] `list` operation returns all workflows with metadata
3. [ ] `get` operation returns embedded resource by default
4. [ ] `get` with `returnMode: 'link'` returns resource link
5. [ ] Unknown workflow ID returns error with helpful message
6. [ ] Tool disabled at Stage 0 and Stage 1
7. [ ] Annotations included in responses

## Test Cases

### T1: List Workflows
```
Input: { operation: 'list' }
Expected: Array of workflow metadata (no content)
```

### T2: Get Workflow Embedded
```
Input: { operation: 'get', args: { workflowId: 'subagent-summarize' } }
Expected: type: 'resource' with full markdown content
```

### T3: Get Workflow Link
```
Input: { operation: 'get', args: { workflowId: 'subagent-summarize', returnMode: 'link' } }
Expected: type: 'resource_link' with URI, name, description
```

### T4: Get Unknown Workflow
```
Input: { operation: 'get', args: { workflowId: 'nonexistent' } }
Expected: isError: true with helpful message
```

### T5: Progressive Disclosure
```
Precondition: Stage 0 (no init)
Input: { operation: 'list' }
Expected: Tool not available / disabled error
```

## Connection to Subagent Summarize Modes

This tool complements SPEC-SUM-001 (Subagent Summarize Modes):

- **Workflows tool**: Provides instructions on HOW to use patterns
- **Summary modes**: Provides options for WHAT to extract from sessions

Agents can:
1. Call `thoughtbox_workflows` → `get(subagent-summarize)` to learn the pattern
2. Use that pattern with different modes from SPEC-SUM-001

## Design Rationale

### Why Tool Instead of Just Resources?

1. **Discoverability**: Tools appear in tool list; resources require knowing URIs
2. **Progressive Disclosure**: Tool visibility tied to workflow stage
3. **Flexibility**: Can return embedded OR linked based on context cost needs
4. **Structured Output**: `structuredContent` for programmatic access

### Why Embedded as Default?

1. **Single-call access**: Content immediately available without follow-up
2. **Matches existing pattern**: Current resources are read in full
3. **Link mode optional**: For context-sensitive agents who want to defer

---

**Created**: 2026-01-19
**Source**: User request for post-init workflow tool exposing resources
