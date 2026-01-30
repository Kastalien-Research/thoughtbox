# MCP Workflow Executor

Execute a sequence of MCP tool calls across multiple servers.

## Variables

WORKFLOW_FILE: $ARGUMENTS

## Execute

READ the workflow file at WORKFLOW_FILE

Parse and execute the workflow steps in sequence, where each step can:

- Call tools from any configured MCP server
- Pass results between steps
- Handle conditional logic
- Run steps in parallel when specified

## Workflow Format Example

```yaml
# example-workflow.yaml
name: "Research and Document"
description: "Search for information and create documentation"
steps:
    - id: search_web
      tool: mcp__exa__web_search_exa
      params:
          query: "OpenTelemetry best practices"
          numResults: 5

    - id: extract_info
      tool: mcp__firecrawl-mcp__firecrawl_extract
      params:
          urls: "${search_web.results[0].url}"
          prompt: "Extract key implementation details"

    - id: save_memory
      tool: mcp__mem0-mcp__add_coding_preference
      params:
          text: "OpenTelemetry Best Practices:\n${extract_info.data}"

    - parallel:
          - id: get_docs_1
            tool: mcp__context7__get-library-docs
            params:
                context7CompatibleLibraryID: "/opentelemetry/opentelemetry-js"

          - id: search_github
            tool: mcp__github__search_code
            params:
                q: "opentelemetry trace implementation"
```

## Usage

Run with: `/mcp-workflow workflows/otel-research.yaml`

The workflow executor will:

1. Parse the YAML/JSON workflow definition
2. Execute steps in order (or parallel when specified)
3. Pass results between steps using template variables
4. Handle errors gracefully
5. Generate a summary report
