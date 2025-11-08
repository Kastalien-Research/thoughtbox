# Interleaved Thinking Resource Templates - End State Specification

**Status**: Target Architecture  
**Version**: 1.0  
**Last Updated**: 2025-11-07

## Purpose

This document describes the desired end state of the Thoughtbox MCP server's interleaved thinking feature, which enables models to discover and use mode-specific reasoning guides through MCP's resource templates mechanism.

## Overview

The interleaved thinking feature provides three specialized reasoning guides (research, analysis, development) that:
1. Are **discoverable** via MCP resource templates
2. Can be **dynamically accessed** as resources with parameterized URIs
3. Can be **embedded** in prompt responses as structured references
4. Follow the **IRCoT (Interleaved Retrieval and Chain-of-Thought)** pattern from academic literature

## Architecture Components

### 1. Resource Templates Discovery

**Endpoint**: `resources/templates/list`

**Expected Behavior**:
- Server advertises the resource template pattern during template listing
- Clients can discover that mode-specific guides exist at `thoughtbox://interleaved/{mode}`

**Response Structure**:
```typescript
{
  resourceTemplates: [
    {
      uriTemplate: "thoughtbox://interleaved/{mode}",
      name: "thoughtbox-interleaved-guides",
      title: "Thoughtbox Interleaved Thinking Guides",
      description: "IRCoT-style interleaved reasoning guides centered on Thoughtbox as the canonical reasoning workspace. Mode parameter: research, analysis, or development.",
      mimeType: "text/markdown",
      annotations: {
        audience: ["assistant"],
        priority: 1.0
      }
    }
  ]
}
```

**Code Location**: 
- Template definition: `src/prompts/index.ts::getInterleavedResourceTemplates()`
- Server handler: `src/index.ts` - registers `ListResourceTemplatesRequestSchema` handler

### 2. Resource Content Resolution

**Endpoint**: `resources/read`

**Supported URIs**:
- `thoughtbox://interleaved/research` - Research tasks guide
- `thoughtbox://interleaved/analysis` - Analysis tasks guide  
- `thoughtbox://interleaved/development` - Development tasks guide

**Expected Behavior**:
- Client requests a specific URI with mode parameter
- Server validates mode is one of: `research`, `analysis`, `development`
- Server generates mode-specific markdown guide content
- Server returns resource with appropriate metadata

**Response Structure**:
```typescript
{
  contents: [{
    uri: "thoughtbox://interleaved/research",
    mimeType: "text/markdown",
    text: "# Thoughtbox Interleaved Thinking - Research Mode\n\n..."
  }]
}
```

**Code Location**:
- Content generator: `src/prompts/contents/interleaved-template.ts::interleavedGuide(mode)`
- URI resolver: `src/prompts/index.ts::getInterleavedGuideForUri(uri)`
- Server handler: `src/index.ts` - extends `ReadResourceRequestSchema` handler

### 3. Mode-Specific Content Structure

Each mode guide contains:

**Phases**:
1. Tooling Inventory (Grounding)
2. Tooling Sufficiency Assessment
3. Strategy in Thoughtbox
4. Interleaved Execution Loop (IRCoT-style)
5. Final Answer

**Capability Kinds** (abstract tool categories):
- `thoughtbox_workspace` - Required for all modes
- `retrieval_search` - Required for research, optional for analysis
- `code_repo` - Required for development
- `sandbox_execute` - Required for development

**Key Features**:
- Self-check procedure: Model verifies it has required capabilities
- Gate-based execution: Checkpoints instead of rigid plans
- Honesty requirements: Never fabricate tool capabilities
- Mode-specific notes: Tailored guidance per use case

**Code Location**:
- Type definitions: `src/prompts/contents/interleaved-template.ts::InterleavedMode`, `CapabilityKind`, `ModeConfig`
- Content templates: `src/prompts/contents/interleaved-template.ts::MODE_CONFIG`
- Formatter: `src/prompts/contents/interleaved-template.ts::interleavedGuide()`

### 4. Resource Embedding in Prompts

**Use Case**: Prompts can reference these resources as embedded content

**Example Prompt Response with Embedded Resource**:
```typescript
{
  messages: [{
    role: "user",
    content: {
      type: "resource",
      resource: {
        uri: "thoughtbox://interleaved/research",
        mimeType: "text/markdown",
        text: "# Thoughtbox Interleaved Thinking - Research Mode\n\n...",
        annotations: {
          audience: ["assistant"],
          priority: 1.0
        }
      }
    }
  }]
}
```

**Expected Behavior**:
- Client applications that support embedded resources will render them appropriately
- Models receive the guide content inline with the prompt
- No additional resource fetch required

**Code Location**: 
- This pattern is supported by MCP spec but not yet used in this server's prompts
- Future enhancement: Prompts could embed these resources dynamically

## Server Capabilities Declaration

**During Initialization** (`initialize` request):

```typescript
{
  capabilities: {
    tools: {},
    prompts: {},
    resources: {
      subscribe: false,
      listChanged: false
    },
    resourceTemplates: {}  // New capability
  }
}
```

## End-to-End Flow

### Discovery Flow

1. **Client connects** to Thoughtbox server
2. **Client calls** `resources/templates/list`
3. **Server responds** with template including `uriTemplate: "thoughtbox://interleaved/{mode}"`
4. **Client understands** it can substitute `{mode}` with valid values

### Usage Flow

1. **Model determines** it needs guidance for a research task
2. **Client requests** `resources/read` with `uri: "thoughtbox://interleaved/research"`
3. **Server resolves** mode from URI path
4. **Server generates** research-specific guide content
5. **Client receives** markdown guide
6. **Model follows** guide to perform interleaved reasoning

### Embedded Usage Flow

1. **User invokes** a future prompt like "interleaved-research"
2. **Server's prompt handler**:
   - Calls `getInterleavedGuideForUri("thoughtbox://interleaved/research")`
   - Embeds result as resource content block in prompt messages
3. **Client receives** prompt with embedded guide
4. **Model has** immediate access to guide without additional fetch

## Backward Compatibility

**Legacy Prompt**: The existing `interleaved-thinking` prompt remains available:
- Name: `"interleaved-thinking"`
- Arguments: `task`, `thoughts_limit`, `clear_folder`
- Content: `INTERLEAVED_THINKING_CONTENT` with variable substitution
- Purpose: Supports existing clients not yet aware of resource templates

**Migration Path**: Clients should migrate from the argument-based prompt to resource-template-based guides for better composability and discoverability.

## File Organization

```
src/
├── index.ts                          # Main server - registers all handlers
├── prompts/
│   ├── index.ts                      # Exports templates & resolvers
│   │   ├── getInterleavedResourceTemplates()
│   │   └── getInterleavedGuideForUri(uri)
│   └── contents/
│       ├── interleaved-template.ts   # Mode configs & content generator
│       │   ├── interleavedGuide(mode)
│       │   └── MODE_CONFIG
│       └── interleaved-thinking-content.ts  # Legacy prompt content
```

## Verification Checklist

When the implementation is complete, the following should be true:

- [ ] `ListResourceTemplatesRequestSchema` handler is registered in `src/index.ts`
- [ ] Handler calls `getInterleavedResourceTemplates()` and returns templates
- [ ] `ReadResourceRequestSchema` handler recognizes URIs starting with `thoughtbox://interleaved/`
- [ ] Handler calls `getInterleavedGuideForUri(uri)` for interleaved URIs
- [ ] Invalid modes (not research/analysis/development) return appropriate errors
- [ ] MCP Inspector shows template in `resources/templates/list` response
- [ ] MCP Inspector can successfully read `thoughtbox://interleaved/research`
- [ ] Generated content matches mode-specific requirements
- [ ] Server capabilities declaration includes `resourceTemplates`

## Testing Strategy

**Manual Testing with MCP Inspector**:
```bash
# List templates
$ mcp-inspector resources/templates/list
# Should show: thoughtbox://interleaved/{mode}

# Read research guide
$ mcp-inspector resources/read thoughtbox://interleaved/research
# Should return markdown guide for research mode

# Test all modes
$ mcp-inspector resources/read thoughtbox://interleaved/analysis
$ mcp-inspector resources/read thoughtbox://interleaved/development

# Test invalid mode
$ mcp-inspector resources/read thoughtbox://interleaved/invalid
# Should return error
```

**Automated Testing** (future):
- Unit tests for `interleavedGuide(mode)` with all three modes
- Integration tests for template listing and resource reading
- Schema validation tests for response structures

## References

- **MCP Specification**: Resource templates - https://modelcontextprotocol.io/specification/2025-06-18/server/resources
- **RFC 6570**: URI Template specification
- **Academic**: IRCoT paper - https://arxiv.org/abs/2212.10509
- **Code**: `src/prompts/contents/interleaved-template.ts`

## Notes

- Resource templates are **distinct** from prompts - they provide discoverable content patterns
- The mode-specific guides are **metadata-rich** resources, not executable tools
- This pattern enables **composition**: other prompts can embed these resources
- The design prioritizes **honesty**: models must self-check capabilities before proceeding
