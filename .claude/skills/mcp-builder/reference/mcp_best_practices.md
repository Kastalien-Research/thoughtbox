# MCP Server Development Best Practices and Guidelines

> **MCP Specification Version**: 2025-11-25
> **Reference**: https://modelcontextprotocol.io/specification/2025-11-25
> **Changelog**: https://modelcontextprotocol.io/specification/2025-11-25/changelog

## Overview

This document compiles essential best practices and guidelines for building Model Context Protocol (MCP) servers compliant with the **2025-11-25** specification. It covers naming conventions, tool design, response formats, pagination, error handling, security, and compliance requirements.

---

## Quick Reference

### Server Naming
- **Python**: `{service}_mcp` (e.g., `slack_mcp`)
- **Node/TypeScript**: `{service}-mcp-server` (e.g., `slack-mcp-server`)

### Tool Naming (2025-11-25 Spec)
- **Length**: 1-128 characters (SHOULD)
- **Case**: Case-sensitive (SHOULD)
- **Allowed characters**: A-Z, a-z, 0-9, underscore (_), hyphen (-), dot (.)
- **Format**: `{service}_{action}_{resource}` with service prefix
- **Examples**: `slack_send_message`, `github_create_issue`, `admin.tools.list`

### Tool Definition Fields (2025-11-25)
- `name`: Unique identifier (required)
- `title`: Human-readable display name (optional, NEW)
- `description`: Functionality description (optional)
- `inputSchema`: JSON Schema for parameters (required, defaults to JSON Schema 2020-12)
- `outputSchema`: JSON Schema for structured output (optional, NEW)
- `icons`: Array of icons for UI display (optional, NEW)
- `annotations`: Behavior hints (optional)

### Response Formats
- Support both JSON and Markdown formats
- JSON for programmatic processing
- Markdown for human readability
- NEW: `structuredContent` field for validated structured output

### Pagination
- Always respect `limit` parameter
- Return `has_more`, `next_offset`/`next_cursor`, `total_count`
- Default to 20-50 items

### Character Limits
- Set CHARACTER_LIMIT constant (typically 25,000)
- Truncate gracefully with clear messages
- Provide guidance on filtering

---

## Table of Contents
1. Server Naming Conventions
2. Tool Naming and Design
3. Response Format Guidelines
4. Pagination Best Practices
5. Character Limits and Truncation
6. Transport Options (Updated 2025-11-25)
7. Tool Development Best Practices
8. Transport Best Practices
9. Testing Requirements
10. OAuth and Security Best Practices
11. Resource Management Best Practices
12. Prompt Management Best Practices
13. Error Handling Standards
14. Documentation Requirements
15. Compliance and Monitoring
16. Tasks (Experimental - 2025-11-25)

---

## 1. Server Naming Conventions

Follow these standardized naming patterns for MCP servers:

**Python**: Use format `{service}_mcp` (lowercase with underscores)
- Examples: `slack_mcp`, `github_mcp`, `jira_mcp`, `stripe_mcp`

**Node/TypeScript**: Use format `{service}-mcp-server` (lowercase with hyphens)
- Examples: `slack-mcp-server`, `github-mcp-server`, `jira-mcp-server`

The name should be:
- General (not tied to specific features)
- Descriptive of the service/API being integrated
- Easy to infer from the task description
- Without version numbers or dates

---

## 2. Tool Naming and Design

### Tool Naming Requirements (2025-11-25 Spec)

Per the MCP 2025-11-25 specification, tool names have specific requirements:

1. **Length**: Tool names SHOULD be between 1 and 128 characters (inclusive)
2. **Case sensitivity**: Tool names SHOULD be considered case-sensitive
3. **Allowed characters**: Only the following characters SHOULD be used:
   - Uppercase and lowercase ASCII letters (A-Z, a-z)
   - Digits (0-9)
   - Underscore (_)
   - Hyphen (-)
   - Dot (.)
4. **No special characters**: Tool names SHOULD NOT contain spaces, commas, or other special characters
5. **Uniqueness**: Tool names SHOULD be unique within a server

**Example valid tool names:**
- `getUser`
- `DATA_EXPORT_v2`
- `admin.tools.list`
- `slack_send_message`
- `github-create-issue`

### Tool Naming Best Practices

1. **Use snake_case or camelCase**: `search_users`, `createProject`, `get_channel_info`
2. **Include service prefix**: Anticipate that your MCP server may be used alongside other MCP servers
   - Use `slack_send_message` instead of just `send_message`
   - Use `github_create_issue` instead of just `create_issue`
   - Use `asana_list_tasks` instead of just `list_tasks`
3. **Be action-oriented**: Start with verbs (get, list, search, create, etc.)
4. **Be specific**: Avoid generic names that could conflict with other servers
5. **Maintain consistency**: Use consistent naming patterns within your server

### Tool Definition Structure (2025-11-25)

```typescript
{
  name: string;           // Unique identifier for the tool (required)
  title?: string;         // Human-readable display name (optional, NEW)
  description?: string;   // Human-readable description
  icons?: Icon[];         // Array of icons for UI display (optional, NEW)
  inputSchema: {          // JSON Schema for parameters (required)
    type: "object",
    properties: { ... }
  },
  outputSchema?: {        // JSON Schema for structured output (optional, NEW)
    type: "object",
    properties: { ... }
  },
  annotations?: {         // Optional hints about tool behavior
    title?: string;       // Human-readable title (can also be top-level)
    readOnlyHint?: boolean;    // If true, tool does not modify environment
    destructiveHint?: boolean; // If true, tool may perform destructive updates
    idempotentHint?: boolean;  // If true, repeated calls have no additional effect
    openWorldHint?: boolean;   // If true, tool interacts with external entities
  }
}
```

### Tool Design Guidelines

- Tool descriptions must narrowly and unambiguously describe functionality
- Descriptions must precisely match actual functionality
- Should not create confusion with other MCP servers
- Should provide tool annotations (readOnlyHint, destructiveHint, idempotentHint, openWorldHint)
- Keep tool operations focused and atomic
- **NEW**: Consider adding `title` for human-readable display names
- **NEW**: Consider adding `icons` for UI display in MCP clients
- **NEW**: Consider adding `outputSchema` for tools that return structured data

---

## 3. Response Format Guidelines

All tools that return data should support multiple formats for flexibility:

### JSON Format (`response_format="json"`)
- Machine-readable structured data
- Include all available fields and metadata
- Consistent field names and types
- Suitable for programmatic processing
- Use for when LLMs need to process data further

### Markdown Format (`response_format="markdown"`, typically default)
- Human-readable formatted text
- Use headers, lists, and formatting for clarity
- Convert timestamps to human-readable format (e.g., "2024-01-15 10:30:00 UTC" instead of epoch)
- Show display names with IDs in parentheses (e.g., "@john.doe (U123456)")
- Omit verbose metadata (e.g., show only one profile image URL, not all sizes)
- Group related information logically
- Use for when presenting information to users

---

## 4. Pagination Best Practices

For tools that list resources:

- **Always respect the `limit` parameter**: Never load all results when a limit is specified
- **Implement pagination**: Use `offset` or cursor-based pagination
- **Return pagination metadata**: Include `has_more`, `next_offset`/`next_cursor`, `total_count`
- **Never load all results into memory**: Especially important for large datasets
- **Default to reasonable limits**: 20-50 items is typical
- **Include clear pagination info in responses**: Make it easy for LLMs to request more data

Example pagination response structure:
```json
{
  "total": 150,
  "count": 20,
  "offset": 0,
  "items": [...],
  "has_more": true,
  "next_offset": 20
}
```

---

## 5. Character Limits and Truncation

To prevent overwhelming responses with too much data:

- **Define CHARACTER_LIMIT constant**: Typically 25,000 characters at module level
- **Check response size before returning**: Measure the final response length
- **Truncate gracefully with clear indicators**: Let the LLM know data was truncated
- **Provide guidance on filtering**: Suggest how to use parameters to reduce results
- **Include truncation metadata**: Show what was truncated and how to get more

Example truncation handling:
```python
CHARACTER_LIMIT = 25000

if len(result) > CHARACTER_LIMIT:
    truncated_data = data[:max(1, len(data) // 2)]
    response["truncated"] = True
    response["truncation_message"] = (
        f"Response truncated from {len(data)} to {len(truncated_data)} items. "
        f"Use 'offset' parameter or add filters to see more results."
    )
```

---

## 6. Transport Options (Updated 2025-11-25)

MCP servers support multiple transport mechanisms. The 2025-11-25 spec introduces **Streamable HTTP** as the primary HTTP transport, replacing the deprecated HTTP+SSE transport.

### Stdio Transport

**Best for**: Command-line tools, local integrations, subprocess execution

**Characteristics**:
- Standard input/output stream communication
- Simple setup, no network configuration needed
- Runs as a subprocess of the client
- Ideal for desktop applications and CLI tools

**2025-11-25 Updates**:
- Server MAY write UTF-8 strings to stderr for **any** logging purposes (not just errors)
- Client MAY capture, forward, or ignore stderr output
- Client SHOULD NOT assume stderr output indicates error conditions

**Use when**:
- Building tools for local development environments
- Integrating with desktop applications (e.g., Claude Desktop)
- Creating command-line utilities
- Single-user, single-session scenarios

### Streamable HTTP Transport (NEW - 2025-11-25)

**Best for**: Web services, remote access, multi-client scenarios

This replaces the deprecated HTTP+SSE transport from protocol version 2024-11-05.

**Characteristics**:
- Single HTTP endpoint supporting POST and GET methods
- Optional Server-Sent Events (SSE) for streaming
- Session management via `MCP-Session-Id` header
- Protocol version via `MCP-Protocol-Version` header
- DNS rebinding protection required

**Key Requirements**:
1. Server MUST validate `Origin` header (return 403 for invalid)
2. Server SHOULD bind to localhost (127.0.0.1) when running locally
3. Server SHOULD implement proper authentication
4. Client MUST include `MCP-Protocol-Version` header on all requests

**Session Management**:
```
MCP-Session-Id: <server-generated-session-id>
MCP-Protocol-Version: 2025-11-25
```

**Use when**:
- Serving multiple clients simultaneously
- Deploying as a cloud service
- Integration with web applications
- Need for load balancing or scaling

### Legacy HTTP+SSE Transport (Deprecated)

**Status**: Deprecated as of 2025-11-25

The HTTP+SSE transport from protocol version 2024-11-05 is still supported for backwards compatibility but should not be used for new implementations.

For backwards compatibility:
- **Servers**: Continue hosting old SSE and POST endpoints alongside new MCP endpoint
- **Clients**: Try POST to new endpoint first, fall back to GET for legacy SSE

### Transport Selection Criteria

| Criterion | Stdio | Streamable HTTP | Legacy SSE |
|-----------|-------|-----------------|------------|
| **Spec Status** | Current | Current (2025-11-25) | Deprecated |
| **Deployment** | Local | Remote | Remote |
| **Clients** | Single | Multiple | Multiple |
| **Communication** | Bidirectional | Bidirectional | Server-Push |
| **Complexity** | Low | Medium | Medium |
| **Session Support** | No | Yes | Limited |

---

## 7. Tool Development Best Practices

### General Guidelines
1. Tool names should be descriptive and action-oriented
2. Use parameter validation with detailed JSON schemas
3. Include examples in tool descriptions
4. Implement proper error handling and validation
5. Use progress reporting for long operations
6. Keep tool operations focused and atomic
7. Document expected return value structures
8. Implement proper timeouts
9. Consider rate limiting for resource-intensive operations
10. Log tool usage for debugging and monitoring

### Security Considerations for Tools

#### Input Validation
- Validate all parameters against schema
- Sanitize file paths and system commands
- Validate URLs and external identifiers
- Check parameter sizes and ranges
- Prevent command injection

#### Access Control
- Implement authentication where needed
- Use appropriate authorization checks
- Audit tool usage
- Rate limit requests
- Monitor for abuse

#### Error Handling
- Don't expose internal errors to clients
- Log security-relevant errors
- Handle timeouts appropriately
- Clean up resources after errors
- Validate return values

### Tool Annotations
- Provide readOnlyHint and destructiveHint annotations
- Remember annotations are hints, not security guarantees
- Clients should not make security-critical decisions based solely on annotations

---

## 8. Transport Best Practices

### General Transport Guidelines
1. Handle connection lifecycle properly
2. Implement proper error handling
3. Use appropriate timeout values
4. Implement connection state management
5. Clean up resources on disconnection

### Security Best Practices for Transport
- Follow security considerations for DNS rebinding attacks
- Implement proper authentication mechanisms
- Validate message formats
- Handle malformed messages gracefully

### Stdio Transport Specific
- Local MCP servers should NOT log to stdout (interferes with protocol)
- Use stderr for logging messages
- Handle standard I/O streams properly

---

## 9. Testing Requirements

A comprehensive testing strategy should cover:

### Functional Testing
- Verify correct execution with valid/invalid inputs

### Integration Testing
- Test interaction with external systems

### Security Testing
- Validate auth, input sanitization, rate limiting

### Performance Testing
- Check behavior under load, timeouts

### Error Handling
- Ensure proper error reporting and cleanup

---

## 10. OAuth and Security Best Practices

### Authentication and Authorization

MCP servers that connect to external services should implement proper authentication:

**OAuth 2.1 Implementation:**
- Use secure OAuth 2.1 with certificates from recognized authorities
- Validate access tokens before processing requests
- Only accept tokens specifically intended for your server
- Reject tokens without proper audience claims
- Never pass through tokens received from MCP clients

**API Key Management:**
- Store API keys in environment variables, never in code
- Validate keys on server startup
- Provide clear error messages when authentication fails
- Use secure transmission for sensitive credentials

### Input Validation and Security

**Always validate inputs:**
- Sanitize file paths to prevent directory traversal
- Validate URLs and external identifiers
- Check parameter sizes and ranges
- Prevent command injection in system calls
- Use schema validation (Pydantic/Zod) for all inputs

**Error handling security:**
- Don't expose internal errors to clients
- Log security-relevant errors server-side
- Provide helpful but not revealing error messages
- Clean up resources after errors

### Privacy and Data Protection

**Data collection principles:**
- Only collect data strictly necessary for functionality
- Don't collect extraneous conversation data
- Don't collect PII unless explicitly required for the tool's purpose
- Provide clear information about what data is accessed

**Data transmission:**
- Don't send data to servers outside your organization without disclosure
- Use secure transmission (HTTPS) for all network communication
- Validate certificates for external services

---

## 11. Resource Management Best Practices

1. Only suggest necessary resources
2. Use clear, descriptive names for roots
3. Handle resource boundaries properly
4. Respect client control over resources
5. Use model-controlled primitives (tools) for automatic data exposure

---

## 12. Prompt Management Best Practices

- Clients should show users proposed prompts
- Users should be able to modify or reject prompts
- Clients should show users completions
- Users should be able to modify or reject completions
- Consider costs when using sampling

---

## 13. Error Handling Standards (Updated 2025-11-25)

MCP 2025-11-25 distinguishes between two types of errors:

### Protocol Errors
Standard JSON-RPC errors for protocol-level issues:
- Unknown tools
- Malformed requests (fail to satisfy request schema)
- Server errors

Protocol errors are less likely to be recoverable by the LLM.

### Tool Execution Errors (NEW Guidance)
Reported in tool results with `isError: true`:
- API failures
- **Input validation errors** (e.g., date in wrong format, value out of range)
- Business logic errors

**Important**: Input validation errors SHOULD be returned as Tool Execution Errors, NOT Protocol Errors. This enables model self-correction.

```typescript
// Tool Execution Error (preferred for validation)
{
  "content": [
    {
      "type": "text",
      "text": "Invalid departure date: must be in the future. Current date is 08/08/2025."
    }
  ],
  "isError": true
}

// Protocol Error (for unknown tools, malformed requests)
{
  "error": {
    "code": -32602,
    "message": "Unknown tool: invalid_tool_name"
  }
}
```

### Best Practices
- Report tool errors within result objects (`isError: true`)
- Provide helpful, specific error messages that guide correction
- Don't expose internal implementation details
- Clean up resources properly on errors
- Clients SHOULD provide tool execution errors to LLMs to enable self-correction
- Clients MAY provide protocol errors to LLMs (less likely to result in recovery)

---

## 14. Documentation Requirements

- Provide clear documentation of all tools and capabilities
- Include working examples (at least 3 per major feature)
- Document security considerations
- Specify required permissions and access levels
- Document rate limits and performance characteristics

---

## 15. Compliance and Monitoring

- Implement logging for debugging and monitoring
- Track tool usage patterns
- Monitor for potential abuse
- Maintain audit trails for security-relevant operations
- Be prepared for ongoing compliance reviews

---

## 16. Tasks (Experimental - 2025-11-25)

Tasks were introduced in the 2025-11-25 specification and are currently **experimental**. Tasks provide a mechanism for tracking durable, long-running requests with polling and deferred result retrieval.

### When to Use Tasks

Tasks are useful for:
- Expensive computations
- Batch processing requests
- Integration with external job APIs
- Operations that may take a long time to complete

### Task States

Tasks can be in one of the following states:
- `working`: The request is being processed
- `input_required`: The receiver needs input from the requestor
- `completed`: The request completed successfully
- `failed`: The request did not complete successfully
- `cancelled`: The request was cancelled

### Capability Declaration

Servers that support tasks must declare the capability:

```json
{
  "capabilities": {
    "tasks": {
      "list": {},
      "cancel": {},
      "requests": {
        "tools": {
          "call": {}
        }
      }
    }
  }
}
```

### Tool-Level Task Support

Tools can declare task support via `execution.taskSupport`:
- `"required"`: Clients MUST invoke the tool as a task
- `"optional"`: Clients MAY invoke the tool as a task or normal request
- `"forbidden"` (or not present): Clients MUST NOT use task augmentation

### Basic Flow

1. Client sends task-augmented request with `task` field
2. Server returns `CreateTaskResult` with `taskId` and `status`
3. Client polls via `tasks/get` until terminal status
4. Client retrieves result via `tasks/result`

### Example

```typescript
// Task-augmented tool call
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "expensive_operation",
    "arguments": { "data": "..." },
    "task": {
      "ttl": 60000  // Task lifetime in milliseconds
    }
  }
}

// CreateTaskResult response
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "task": {
      "taskId": "786512e2-9e0d-44bd-8f29-789f320fe840",
      "status": "working",
      "createdAt": "2025-11-25T10:30:00Z",
      "ttl": 60000,
      "pollInterval": 5000
    }
  }
}
```

### Important Notes

- Tasks are experimental and may evolve in future protocol versions
- Servers MAY override the requested `ttl` duration
- Requestors SHOULD respect the `pollInterval` for polling frequency
- Task IDs MUST be unique among all tasks controlled by the receiver

---

## Summary

These best practices represent the comprehensive guidelines for building secure, efficient, and compliant MCP servers that work well within the ecosystem. Developers should follow these guidelines to ensure their MCP servers meet the standards for inclusion in the MCP directory and provide a safe, reliable experience for users.

**Specification Reference**: [MCP 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)


----------


# Tools

> Enable LLMs to perform actions through your server

Tools are a powerful primitive in the Model Context Protocol (MCP) that enable servers to expose executable functionality to clients. Through tools, LLMs can interact with external systems, perform computations, and take actions in the real world.

<Note>
  Tools are designed to be **model-controlled**, meaning that tools are exposed from servers to clients with the intention of the AI model being able to automatically invoke them (with a human in the loop to grant approval).
</Note>

## Overview

Tools in MCP allow servers to expose executable functions that can be invoked by clients and used by LLMs to perform actions. Key aspects of tools include:

* **Discovery**: Clients can obtain a list of available tools by sending a `tools/list` request
* **Invocation**: Tools are called using the `tools/call` request, where servers perform the requested operation and return results
* **Flexibility**: Tools can range from simple calculations to complex API interactions

Like [resources](/docs/concepts/resources), tools are identified by unique names and can include descriptions to guide their usage. However, unlike resources, tools represent dynamic operations that can modify state or interact with external systems.

## Tool definition structure

Each tool is defined with the following structure:

```typescript
{
  name: string;          // Unique identifier for the tool
  description?: string;  // Human-readable description
  inputSchema: {         // JSON Schema for the tool's parameters
    type: "object",
    properties: { ... }  // Tool-specific parameters
  },
  annotations?: {        // Optional hints about tool behavior
    title?: string;      // Human-readable title for the tool
    readOnlyHint?: boolean;    // If true, the tool does not modify its environment
    destructiveHint?: boolean; // If true, the tool may perform destructive updates
    idempotentHint?: boolean;  // If true, repeated calls with same args have no additional effect
    openWorldHint?: boolean;   // If true, tool interacts with external entities
  }
}
```

## Implementing tools

Here's an example of implementing a basic tool in an MCP server:

<Tabs>
  <Tab title="TypeScript">
    ```typescript
    const server = new Server({
      name: "example-server",
      version: "1.0.0"
    }, {
      capabilities: {
        tools: {}
      }
    });

    // Define available tools
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [{
          name: "calculate_sum",
          description: "Add two numbers together",
          inputSchema: {
            type: "object",
            properties: {
              a: { type: "number" },
              b: { type: "number" }
            },
            required: ["a", "b"]
          }
        }]
      };
    });

    // Handle tool execution
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === "calculate_sum") {
        const { a, b } = request.params.arguments;
        return {
          content: [
            {
              type: "text",
              text: String(a + b)
            }
          ]
        };
      }
      throw new Error("Tool not found");
    });
    ```
  </Tab>

  <Tab title="Python">
    ```python
    app = Server("example-server")

    @app.list_tools()
    async def list_tools() -> list[types.Tool]:
        return [
            types.Tool(
                name="calculate_sum",
                description="Add two numbers together",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "a": {"type": "number"},
                        "b": {"type": "number"}
                    },
                    "required": ["a", "b"]
                }
            )
        ]

    @app.call_tool()
    async def call_tool(
        name: str,
        arguments: dict
    ) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
        if name == "calculate_sum":
            a = arguments["a"]
            b = arguments["b"]
            result = a + b
            return [types.TextContent(type="text", text=str(result))]
        raise ValueError(f"Tool not found: {name}")
    ```
  </Tab>
</Tabs>

## Example tool patterns

Here are some examples of types of tools that a server could provide:

### System operations

Tools that interact with the local system:

```typescript
{
  name: "execute_command",
  description: "Run a shell command",
  inputSchema: {
    type: "object",
    properties: {
      command: { type: "string" },
      args: { type: "array", items: { type: "string" } }
    }
  }
}
```

### API integrations

Tools that wrap external APIs:

```typescript
{
  name: "github_create_issue",
  description: "Create a GitHub issue",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string" },
      body: { type: "string" },
      labels: { type: "array", items: { type: "string" } }
    }
  }
}
```

### Data processing

Tools that transform or analyze data:

```typescript
{
  name: "analyze_csv",
  description: "Analyze a CSV file",
  inputSchema: {
    type: "object",
    properties: {
      filepath: { type: "string" },
      operations: {
        type: "array",
        items: {
          enum: ["sum", "average", "count"]
        }
      }
    }
  }
}
```

## Best practices

When implementing tools:

1. Provide clear, descriptive names and descriptions
2. Use detailed JSON Schema definitions for parameters
3. Include examples in tool descriptions to demonstrate how the model should use them
4. Implement proper error handling and validation
5. Use progress reporting for long operations
6. Keep tool operations focused and atomic
7. Document expected return value structures
8. Implement proper timeouts
9. Consider rate limiting for resource-intensive operations
10. Log tool usage for debugging and monitoring

### Tool name conflicts

MCP client applications and MCP server proxies may encounter tool name conflicts when building their own tool lists. For example, two connected MCP servers `web1` and `web2` may both expose a tool named `search_web`.

Applications may disambiguiate tools with one of the following strategies (among others; not an exhaustive list):

* Concatenating a unique, user-defined server name with the tool name, e.g. `web1___search_web` and `web2___search_web`. This strategy may be preferable when unique server names are already provided by the user in a configuration file.
* Generating a random prefix for the tool name, e.g. `jrwxs___search_web` and `6cq52___search_web`. This strategy may be preferable in server proxies where user-defined unique names are not available.
* Using the server URI as a prefix for the tool name, e.g. `web1.example.com:search_web` and `web2.example.com:search_web`. This strategy may be suitable when working with remote MCP servers.

Note that the server-provided name from the initialization flow is not guaranteed to be unique and is not generally suitable for disambiguation purposes.

## Security considerations

When exposing tools:

### Input validation

* Validate all parameters against the schema
* Sanitize file paths and system commands
* Validate URLs and external identifiers
* Check parameter sizes and ranges
* Prevent command injection

### Access control

* Implement authentication where needed
* Use appropriate authorization checks
* Audit tool usage
* Rate limit requests
* Monitor for abuse

### Error handling

* Don't expose internal errors to clients
* Log security-relevant errors
* Handle timeouts appropriately
* Clean up resources after errors
* Validate return values

## Tool discovery and updates

MCP supports dynamic tool discovery:

1. Clients can list available tools at any time
2. Servers can notify clients when tools change using `notifications/tools/list_changed`
3. Tools can be added or removed during runtime
4. Tool definitions can be updated (though this should be done carefully)

## Error handling

Tool errors should be reported within the result object, not as MCP protocol-level errors. This allows the LLM to see and potentially handle the error. When a tool encounters an error:

1. Set `isError` to `true` in the result
2. Include error details in the `content` array

Here's an example of proper error handling for tools:

<Tabs>
  <Tab title="TypeScript">
    ```typescript
    try {
      // Tool operation
      const result = performOperation();
      return {
        content: [
          {
            type: "text",
            text: `Operation successful: ${result}`
          }
        ]
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`
          }
        ]
      };
    }
    ```
  </Tab>

  <Tab title="Python">
    ```python
    try:
        # Tool operation
        result = perform_operation()
        return types.CallToolResult(
            content=[
                types.TextContent(
                    type="text",
                    text=f"Operation successful: {result}"
                )
            ]
        )
    except Exception as error:
        return types.CallToolResult(
            isError=True,
            content=[
                types.TextContent(
                    type="text",
                    text=f"Error: {str(error)}"
                )
            ]
        )
    ```
  </Tab>
</Tabs>

This approach allows the LLM to see that an error occurred and potentially take corrective action or request human intervention.

## Tool annotations

Tool annotations provide additional metadata about a tool's behavior, helping clients understand how to present and manage tools. These annotations are hints that describe the nature and impact of a tool, but should not be relied upon for security decisions.

### Purpose of tool annotations

Tool annotations serve several key purposes:

1. Provide UX-specific information without affecting model context
2. Help clients categorize and present tools appropriately
3. Convey information about a tool's potential side effects
4. Assist in developing intuitive interfaces for tool approval

### Available tool annotations

The MCP specification defines the following annotations for tools:

| Annotation        | Type    | Default | Description                                                                                                                          |
| ----------------- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `title`           | string  | -       | A human-readable title for the tool, useful for UI display                                                                           |
| `readOnlyHint`    | boolean | false   | If true, indicates the tool does not modify its environment                                                                          |
| `destructiveHint` | boolean | true    | If true, the tool may perform destructive updates (only meaningful when `readOnlyHint` is false)                                     |
| `idempotentHint`  | boolean | false   | If true, calling the tool repeatedly with the same arguments has no additional effect (only meaningful when `readOnlyHint` is false) |
| `openWorldHint`   | boolean | true    | If true, the tool may interact with an "open world" of external entities                                                             |

### Example usage

Here's how to define tools with annotations for different scenarios:

```typescript
// A read-only search tool
{
  name: "web_search",
  description: "Search the web for information",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string" }
    },
    required: ["query"]
  },
  annotations: {
    title: "Web Search",
    readOnlyHint: true,
    openWorldHint: true
  }
}

// A destructive file deletion tool
{
  name: "delete_file",
  description: "Delete a file from the filesystem",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string" }
    },
    required: ["path"]
  },
  annotations: {
    title: "Delete File",
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false
  }
}

// A non-destructive database record creation tool
{
  name: "create_record",
  description: "Create a new record in the database",
  inputSchema: {
    type: "object",
    properties: {
      table: { type: "string" },
      data: { type: "object" }
    },
    required: ["table", "data"]
  },
  annotations: {
    title: "Create Database Record",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false
  }
}
```

### Integrating annotations in server implementation

<Tabs>
  <Tab title="TypeScript">
    ```typescript
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [{
          name: "calculate_sum",
          description: "Add two numbers together",
          inputSchema: {
            type: "object",
            properties: {
              a: { type: "number" },
              b: { type: "number" }
            },
            required: ["a", "b"]
          },
          annotations: {
            title: "Calculate Sum",
            readOnlyHint: true,
            openWorldHint: false
          }
        }]
      };
    });
    ```
  </Tab>

  <Tab title="Python">
    ```python
    from mcp.server.fastmcp import FastMCP

    mcp = FastMCP("example-server")

    @mcp.tool(
        annotations={
            "title": "Calculate Sum",
            "readOnlyHint": True,
            "openWorldHint": False
        }
    )
    async def calculate_sum(a: float, b: float) -> str:
        """Add two numbers together.

        Args:
            a: First number to add
            b: Second number to add
        """
        result = a + b
        return str(result)
    ```
  </Tab>
</Tabs>

### Best practices for tool annotations

1. **Be accurate about side effects**: Clearly indicate whether a tool modifies its environment and whether those modifications are destructive.

2. **Use descriptive titles**: Provide human-friendly titles that clearly describe the tool's purpose.

3. **Indicate idempotency properly**: Mark tools as idempotent only if repeated calls with the same arguments truly have no additional effect.

4. **Set appropriate open/closed world hints**: Indicate whether a tool interacts with a closed system (like a database) or an open system (like the web).

5. **Remember annotations are hints**: All properties in ToolAnnotations are hints and not guaranteed to provide a faithful description of tool behavior. Clients should never make security-critical decisions based solely on annotations.

## Testing tools

A comprehensive testing strategy for MCP tools should cover:

* **Functional testing**: Verify tools execute correctly with valid inputs and handle invalid inputs appropriately
* **Integration testing**: Test tool interaction with external systems using both real and mocked dependencies
* **Security testing**: Validate authentication, authorization, input sanitization, and rate limiting
* **Performance testing**: Check behavior under load, timeout handling, and resource cleanup
* **Error handling**: Ensure tools properly report errors through the MCP protocol and clean up resources
