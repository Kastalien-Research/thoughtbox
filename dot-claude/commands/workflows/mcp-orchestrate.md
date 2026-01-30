# MCP Orchestration

Advanced MCP tool orchestration with parallel execution and conditional logic.

## Variables

ORCHESTRATION_SCRIPT: $ARGUMENTS

## Script Format

Use a simple DSL for orchestration:

```
# Sequential execution
-> tool_name(param1="value", param2="value")

# Parallel execution
=> tool1(param="value")
=> tool2(param="value")
=> tool3(param="value")

# Store result in variable
$var = tool_name(param="value")

# Use variables
-> other_tool(input=$var.result)

# Conditional execution
? $var.status == "success" -> success_tool()
? $var.status == "error" -> error_tool()

# Loop over results
@ item in $results.items -> process_tool(item=$item)
```

## Example

```
/mcp-orchestrate
# Search multiple sources in parallel
=> $web = mcp__exa__web_search_exa(query="OpenTelemetry Node.js", numResults=5)
=> $github = mcp__github__search_code(q="opentelemetry implementation")
=> $docs = mcp__context7__resolve-library-id(libraryName="opentelemetry")

# Process results conditionally
? $docs.found -> $details = mcp__context7__get-library-docs(context7CompatibleLibraryID=$docs.id)

# Extract from top web results
@ url in $web.results[0:3].url -> $content[] = mcp__firecrawl-mcp__firecrawl_scrape(url=$url, formats=["markdown"])

# Save consolidated findings
-> mcp__mem0-mcp__add_coding_preference(text="Research findings: Web: $web.summary, GitHub: $github.count results, Docs: $details")
```

## Features

- Sequential and parallel execution
- Variable assignment and reuse
- Conditional branching
- Loops and iteration
- Result aggregation
- Error handling and retries
- Execution visualization
