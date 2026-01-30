# MCP Recipe Runner

Execute pre-defined MCP tool recipes.

## Variables

RECIPE_NAME: $ARGUMENTS

## Built-in Recipes

### research-and-save

Search web, scrape content, save to memory:

```
mcp__exa__web_search_exa -> mcp__firecrawl-mcp__firecrawl_scrape -> mcp__mem0-mcp__add_coding_preference
```

### github-to-memory

Search GitHub code and save patterns:

```
mcp__github__search_code -> mcp__github__get_file_contents -> mcp__mem0-mcp__add_coding_preference
```

### deep-research

Comprehensive research on a topic:

```
mcp__firecrawl-mcp__firecrawl_deep_research -> mcp__mem0-mcp__add_coding_preference
```

### docs-fetch

Get library documentation:

```
mcp__context7__resolve-library-id -> mcp__context7__get-library-docs -> mcp__mem0-mcp__add_coding_preference
```

## Custom Recipe Format

Create `.claude/recipes/[name].json`:

```json
{
	"name": "custom-workflow",
	"description": "My custom MCP workflow",
	"inputs": {
		"query": "Search query",
		"limit": "Result limit"
	},
	"steps": [
		{
			"tool": "mcp__exa__web_search_exa",
			"params": {
				"query": "$input.query",
				"numResults": "$input.limit"
			},
			"output": "search_results"
		},
		{
			"tool": "mcp__firecrawl-mcp__firecrawl_scrape",
			"params": {
				"url": "$search_results.results[0].url"
			},
			"output": "scraped_content"
		}
	]
}
```

## Usage

```
/mcp-recipe research-and-save query="OpenTelemetry patterns"
/mcp-recipe github-to-memory q="trace implementation typescript"
/mcp-recipe custom-workflow query="my search" limit=5
```
