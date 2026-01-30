# Research Commands

Commands for intelligent research, documentation gathering, and knowledge synthesis.

## Available Commands

| Command | Description |
|---------|-------------|
| `/docs-researcher` | Comprehensive documentation research and cataloging system |
| `/intelligent-mcp-research-suite` | Multi-modal research orchestration using swarm intelligence |
| `/advanced-retrieval-orchestrator` | Advanced retrieval and analysis patterns |
| `/consciousness-research-nexus` | Deep research into complex domains |

## Quick Reference

### /docs-researcher

**Purpose:** Automatically discover project technologies, catalog their usage, and scrape relevant external documentation.

**When to use:**
- Setting up a new project for AI-assisted development
- Ensuring documentation is available for all dependencies
- Building a local knowledge base for offline/faster access

**Workflow:**
1. **Discovery** - Find all technologies from package.json, config files, imports
2. **Cataloging** - Deploy agents to analyze HOW each technology is used
3. **Scraping** - Use Firecrawl to fetch relevant documentation
4. **Verification** - Compare scraped docs against expected coverage

```bash
/docs-researcher              # Full workflow
/docs-researcher discovery    # Only discover technologies
/docs-researcher catalog      # Only catalog usage
/docs-researcher scrape       # Only scrape documentation
```

**Output:**
- `tech_stack/*.md` - Technology usage catalogs
- `ai_docs/{technology}/` - Scraped documentation
- `.docs-research/state.json` - Process state

### /intelligent-mcp-research-suite

**Purpose:** Transform research from linear search to multi-dimensional intelligence gathering using specialized agents.

**When to use:**
- Complex research questions requiring multiple sources
- Technology landscape mapping
- Implementation pattern discovery

**Agent Specializations:**
- Deep Research Agent - Primary intelligence gathering
- Pattern Recognition Agent - Identify relationships and patterns
- Innovation Scout Agent - Discover cutting-edge approaches
- Integration Synthesis Agent - Combine findings into actionable knowledge

### /advanced-retrieval-orchestrator

**Purpose:** Orchestrate multiple retrieval strategies for comprehensive information gathering.

### /consciousness-research-nexus

**Purpose:** Deep, multi-layered research into complex or novel domains.

## Prerequisites

Most research commands benefit from:
- **Firecrawl MCP** - Web scraping and search
- **Context7 MCP** - Library documentation lookup
- **Exa MCP** - Advanced web search

## Tips

1. **Start with /docs-researcher** when joining a new project to build your knowledge base
2. **Use /intelligent-mcp-research-suite** for open-ended research questions
3. **Combine with /knowledge-fusion** to synthesize findings into actionable knowledge
4. **Run /fact-check-docs** after scraping to verify documentation accuracy
