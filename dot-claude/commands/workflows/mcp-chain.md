# MCP Tool Chain

Execute a chain of MCP tool calls with simple syntax.

## Variables

CHAIN_STEPS: $ARGUMENTS

## Execute

Parse and execute the tool chain where each line is a tool call.

## Format

```
tool_name | param1=value1, param2=value2
tool_name | param1=$previous.result, param2=value
```

## Example Usage

```
/mcp-chain
mcp__exa__web_search_exa | query="React hooks best practices", numResults=3
mcp__firecrawl-mcp__firecrawl_scrape | url=$1.results[0].url, formats=["markdown"]
mcp__mem0-mcp__add_coding_preference | text=$2.data.markdown
```

## Features

- Each line is a tool call
- Use $N to reference result from step N
- Use $previous to reference the immediately previous result
- Automatic error handling with retry
- Results summary at the end
