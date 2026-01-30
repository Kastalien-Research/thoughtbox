# MCP Tool Context Commands

Commands that provide comprehensive context documentation for MCP tools and APIs.

## Available Commands

### [exa](./exa.md)

Complete context documentation for the Exa API and MCP tools, including semantic search, research capabilities, and content discovery.

### [firecrawl](./firecrawl.md)

Complete context documentation for the Firecrawl API and MCP tools, including web scraping, crawling, and data extraction capabilities.

## Use Cases

### API Development
- Understand complete API capabilities and parameters
- Learn best practices for tool integration
- Access comprehensive endpoint documentation
- Implement advanced features and configurations

### MCP Tool Usage
- Leverage full tool parameter sets
- Understand tool capabilities and limitations
- Optimize tool usage for specific use cases
- Combine tools for complex workflows

### Research and Discovery
- Access semantic search capabilities with Exa
- Perform comprehensive web scraping with Firecrawl
- Extract structured data from web sources
- Build knowledge bases from web content

### Content Processing
- Convert web content to LLM-ready formats
- Extract structured information from unstructured sources
- Process large-scale web data efficiently
- Handle JavaScript-heavy and dynamic content

## Tool Comparison

### Exa vs Firecrawl
- **Exa**: Semantic search, pre-indexed content, research-focused
- **Firecrawl**: Real-time scraping, JavaScript rendering, extraction-focused
- **Complementary**: Use Exa for discovery, Firecrawl for extraction
- **Combined workflows**: Research → Discovery → Extraction → Analysis

## Example Usage

```bash
# Load Exa context for semantic search tasks
/toolscontext:exa "research AI papers on transformers"

# Load Firecrawl context for web scraping tasks
/toolscontext:firecrawl "scrape product data from e-commerce sites"

# Combined workflow context
/toolscontext:exa,firecrawl "discover relevant sites then extract structured data"
```

## Integration Patterns

### Research Workflows
- Use Exa for semantic discovery and similarity search
- Use Firecrawl for comprehensive content extraction
- Combine both for research → extraction → analysis pipelines

### Data Collection
- Map website structure with Firecrawl
- Discover related content with Exa
- Extract structured data with LLM integration

### Content Analysis
- Search for conceptually similar content with Exa
- Scrape and process content with Firecrawl
- Build knowledge graphs from extracted information

### Competitive Intelligence
- Discover competitors and similar companies with Exa
- Extract detailed information with Firecrawl
- Monitor changes and updates over time

## Best Practices

### Performance Optimization
- Use appropriate search types (neural vs keyword)
- Implement caching strategies where applicable
- Batch operations for efficiency
- Monitor rate limits and costs

### Error Handling
- Implement retry logic for failed requests
- Handle rate limiting gracefully
- Validate inputs and outputs
- Log operations for debugging

### Cost Management
- Understand pricing models for both services
- Optimize query parameters for cost efficiency
- Use appropriate result limits
- Monitor usage and billing

### Security
- Protect API keys and credentials
- Use environment variables for configuration
- Implement proper authentication patterns
- Follow data retention policies