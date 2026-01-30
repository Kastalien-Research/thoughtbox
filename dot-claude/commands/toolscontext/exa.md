# EXA API CONTEXT

Hi, friend. You are Claude Code, an agentic coding assistant with access to the Exa API for web search and content retrieval. This context provides comprehensive documentation for utilizing Exa's search capabilities.

## VARIABLES

CONTEXT: $ARGUMENTS

### Documentation URLs

EXA_API_OVERVIEW: https://docs.exa.ai/
EXA_API_REFERENCE: https://docs.exa.ai/reference/
EXA_GETTING_STARTED: https://docs.exa.ai/getting-started
EXA_QUICKSTART: https://docs.exa.ai/quickstart

#### Core API Endpoints
EXA_SEARCH_ENDPOINT: https://docs.exa.ai/reference/search
EXA_CONTENTS_ENDPOINT: https://docs.exa.ai/reference/get-contents
EXA_FIND_SIMILAR_ENDPOINT: https://docs.exa.ai/reference/find-similar-links
EXA_ANSWER_ENDPOINT: https://docs.exa.ai/reference/answer
EXA_RESEARCH_ENDPOINT: https://docs.exa.ai/reference/research

#### Advanced Features
EXA_CHAT_COMPLETIONS: https://docs.exa.ai/reference/chat-completions
EXA_WEBSETS_API: https://docs.exa.ai/reference/websets
EXA_OPENAI_COMPATIBILITY: https://docs.exa.ai/reference/openai-compatibility

#### Integration Guides
EXA_RAG_QUICKSTART: https://docs.exa.ai/guides/rag-quickstart
EXA_LANGCHAIN_INTEGRATION: https://docs.exa.ai/guides/langchain
EXA_LLAMAINDEX_INTEGRATION: https://docs.exa.ai/guides/llamaindex
EXA_OPENAI_WRAPPER: https://docs.exa.ai/guides/openai-wrapper
EXA_CREWAI_INTEGRATION: https://docs.exa.ai/guides/crewai
EXA_TOOL_CALLING_GPT: https://docs.exa.ai/guides/tool-calling-gpt
EXA_TOOL_CALLING_CLAUDE: https://docs.exa.ai/guides/tool-calling-claude

#### SDK Documentation
EXA_PYTHON_SDK: https://docs.exa.ai/sdk/python
EXA_JAVASCRIPT_SDK: https://docs.exa.ai/sdk/javascript
EXA_PYTHON_GITHUB: https://github.com/exa-labs/exa-py
EXA_JAVASCRIPT_GITHUB: https://github.com/exa-labs/exa-js

#### Concepts and Features
EXA_SEARCH_EXPLAINED: https://docs.exa.ai/concepts/search-explained
EXA_INDEX_EXPLAINED: https://docs.exa.ai/concepts/index-explained
EXA_CONTENTS_RETRIEVAL: https://docs.exa.ai/concepts/contents-retrieval
EXA_CAPABILITIES_EXPLAINED: https://docs.exa.ai/concepts/capabilities-explained
EXA_LIVECRAWL: https://docs.exa.ai/concepts/livecrawl
EXA_RESEARCH_EXPLAINED: https://docs.exa.ai/concepts/research-explained
EXA_SUBPAGE_CRAWLING: https://docs.exa.ai/concepts/subpage-crawling

#### Administration
EXA_TEAM_MANAGEMENT: https://docs.exa.ai/admin/team-management
EXA_RATE_LIMITS: https://docs.exa.ai/admin/rate-limits
EXA_ENTERPRISE_SECURITY: https://docs.exa.ai/admin/enterprise-security

#### API Reference Structure
EXA_OPENAPI_SPEC: https://docs.exa.ai/reference/openapi-spec
EXA_FAQS: https://docs.exa.ai/faqs

### Dashboard and Tools
EXA_DASHBOARD: https://dashboard.exa.ai/
EXA_PUBLIC_SEARCH: https://exa.ai/search
EXA_API_KEYS: https://dashboard.exa.ai/api-keys

## YOUR EXA CAPABILITIES

### Core Search Engine for AI

Exa is a search API designed specifically for LLMs and AI applications, providing:

- **Neural Search**: Embeddings-based semantic search using proprietary models
- **Keyword Search**: Traditional keyword-based search for exact matches
- **Auto Search**: Intelligent routing between neural and keyword search
- **LiveCrawl**: Real-time content updates and fresh data retrieval
- **Content Extraction**: Clean, parsed HTML with highlights and summaries

### Available Tools via MCP

You have access to these Exa tools through the Model Context Protocol:

**1. Web Search (`mcp__exa-mcp-server__web_search_exa`)**
- Perform real-time web searches with advanced filtering
- Support for 15+ parameters including domain filtering, date ranges, content types
- Returns structured results with metadata and optional content

**2. Research Paper Search (`mcp__exa-mcp-server__research_paper_search_exa`)**
- Specialized search for academic papers and research content
- Optimized for scholarly articles and research findings
- Returns detailed research metadata and citations

**3. Company Research (`mcp__exa-mcp-server__company_research_exa`)**
- Targeted search for business and company information
- Returns structured company data and business insights
- Ideal for market research and competitive analysis

**4. Content Crawling (`mcp__exa-mcp-server__crawling_exa`)**
- Extract and process content from multiple URLs
- Batch processing with highlights and summaries
- Support for subpage crawling and structured data extraction

**5. Competitor Analysis (`mcp__exa-mcp-server__competitor_finder_exa`)**
- Find competitors and similar companies
- Market positioning and competitive landscape analysis
- Industry-specific competitor identification

**6. LinkedIn Search (`mcp__exa-mcp-server__linkedin_search_exa`)**
- Search LinkedIn profiles and company pages
- Professional networking and recruitment research
- Business relationship discovery

**7. Wikipedia Search (`mcp__exa-mcp-server__wikipedia_search_exa`)**
- Access comprehensive Wikipedia content
- Factual information and authoritative sources
- Research and fact-checking capabilities

**8. GitHub Search (`mcp__exa-mcp-server__github_search_exa`)**
- Search GitHub repositories and code
- Find open source projects and code examples
- Developer and technical resource discovery

**9. Direct Answer (`mcp__exa-mcp-server__answer_exa`)**
- Get AI-powered answers with citations
- Combines web search with LLM generation
- Provides sources and attribution for responses

**10. Find Similar (`mcp__exa-mcp-server__find_similar_exa`)**
- Find web pages similar to a given URL
- Semantic similarity search
- Content discovery and recommendation

### Core API Endpoints

**Search API (`POST /search`)**
- Primary search endpoint with neural/keyword/auto search types
- Parameters: query, numResults, type, category, includeDomains, excludeDomains
- Date filtering: startPublishedDate, endPublishedDate, startCrawlDate, endCrawlDate
- Content options: text, highlights, summary with structured schemas

**Contents API (`POST /contents`)**
- Retrieve clean, parsed HTML from URLs
- Extract text content, highlights, and structured summaries
- Support for subpage crawling and link extraction
- Batch processing for multiple URLs

**Find Similar API (`POST /findSimilar`)**
- Semantic similarity search based on URL input
- Find related content and similar pages
- Advanced filtering by domain, date, and content type
- Rich content extraction with highlights and summaries

**Answer API (`POST /answer`)**
- Generate AI-powered answers with web search
- Includes citations and source attribution
- Streaming support for real-time responses
- Cost-transparent pricing with detailed breakdowns

**Research API (`POST /research/v0/tasks`)**
- Asynchronous multi-step research tasks
- Structured JSON output with custom schemas
- Agentic search with planning and synthesis
- Citation mapping to specific output fields

### Advanced Features

**Chat Completions (`POST /chat/completions`)**
- OpenAI-compatible chat interface
- Models: `exa`, `exa-research`, `exa-research-pro`
- Real-time web search integration
- Streaming responses with citations

**Websets API (`/websets/v0/`)**
- Organize content in structured containers
- Automated search agents and enrichment
- Monitoring and scheduled updates
- CSV import and data management

**LiveCrawl Technology**
- Real-time content retrieval
- Always get the latest version of pages
- JavaScript rendering support
- Fresh data for time-sensitive queries

### Search Types and Use Cases

**Neural Search (Semantic)**
- Best for: Exploratory searches, conceptual content discovery
- Uses: Embeddings-based similarity matching
- Example: "AI companies working on robotics"

**Keyword Search (Exact)**
- Best for: Proper nouns, technical terms, exact matches
- Uses: Traditional keyword matching
- Example: "OpenAI GPT-4 release date"

**Auto Search (Default)**
- Best for: Most general use cases
- Uses: Intelligent routing between neural and keyword
- Adapts to query type automatically

### Content Extraction Options

**Text Content**
- Clean, parsed HTML content
- Configurable character limits
- HTML tag inclusion options
- Full page text extraction

**Highlights**
- Relevant excerpts from content
- Customizable number of highlights per URL
- Query-specific relevance scoring
- Sentence-based extraction

**Summaries**
- AI-generated content summaries
- Structured output with JSON schemas
- Custom summary queries
- Citation integration

**Subpage Crawling**
- Automatic navigation to related pages
- Configurable crawl depth
- Link extraction and processing
- Comprehensive content discovery

### Categories and Specialized Search

Available content categories:
- **company**: Business entities and corporate information
- **research paper**: Academic publications and research
- **news**: News articles and current events
- **linkedin profile**: Professional profiles and networking
- **github**: Repositories and code examples
- **tweet**: Social media content and discussions
- **pdf**: Document search and retrieval
- **personal site**: Individual websites and blogs
- **financial report**: Corporate financial information

### Integration Patterns

**RAG (Retrieval-Augmented Generation)**
- Combine Exa search with LLM generation
- Provide citations and source attribution
- Real-time information beyond training data
- Context-aware response generation

**Tool Calling**
- Function calling with GPT and Claude
- Structured parameter passing
- Integration with agent frameworks
- Automated search and retrieval

**Agent Frameworks**
- LangChain integration for retrieval chains
- LlamaIndex for knowledge augmentation
- CrewAI for multi-agent workflows
- Custom agent tool implementations

### Authentication and Security

**API Authentication**
- API key via `x-api-key` header
- Bearer token via `Authorization` header
- Environment variable storage recommended
- Team-based access management

**Security Features**
- SOC 2 Type I certified
- Zero data retention options (enterprise)
- HTTPS-only communication
- Enterprise-grade compliance

### Rate Limits and Pricing

**Rate Limits**
- 5 requests per second (standard)
- Higher limits for enterprise plans
- Usage-based pricing model
- $10 free credits for new users

**Pricing Structure**
- Neural search: $5 per 1,000 searches (1-25 results)
- Keyword search: $2.50 per 1,000 searches (1-100 results)
- Content retrieval: $1 per 1,000 pages
- Answer API: $5 per 1,000 answers
- Research API: $5-$10 per 1,000 tasks

### SDKs and Development Tools

**Python SDK (`exa-py`)**
- Installation: `pip install exa-py`
- Full API coverage with type hints
- Streaming support for answers
- Research task polling utilities

**JavaScript SDK (`exa-js`)**
- Installation: `npm install exa-js`
- TypeScript support and type definitions
- AsyncGenerator for streaming responses
- Cross-platform compatibility

**OpenAI Compatibility**
- Drop-in replacement for OpenAI clients
- Base URL: `https://api.exa.ai`
- Support for streaming and function calling
- Extended parameters via `extra_body`

### Best Practices

**Search Optimization**
- Use specific, descriptive queries
- Apply appropriate filters (domain, date, category)
- Choose optimal search type for use case
- Request only needed content to minimize cost

**Content Strategy**
- Use highlights for quick excerpts
- Request full text for comprehensive analysis
- Apply structured summaries for data extraction
- Leverage subpage crawling for deep content

**Error Handling**
- Implement retry logic for rate limits
- Handle API key validation errors
- Monitor usage and cost through dashboard
- Use fallback strategies for failed searches

**Performance Tips**
- Cache results for repeated queries
- Use batch operations where possible
- Implement result deduplication
- Monitor and optimize API costs

### Enterprise Features

**Team Management**
- Shared usage limits and billing
- Member invitation and access control
- Team-based API key management
- Centralized billing and reporting

**Security and Compliance**
- Custom data retention policies
- SOC 2 certification and audits
- Data Processing Agreements (DPAs)
- Master Subscription Agreements (MSAs)

**Enterprise Support**
- 1:1 onboarding and training
- Custom datasets and configurations
- Early access to new features
- Dedicated support channels

### Your Unique Value with Exa

You represent a new paradigm in AI-powered search and research:

- **From static to real-time**: Access current web content beyond training data
- **From keyword to semantic**: Understand intent and context in search queries
- **From retrieval to synthesis**: Combine search with AI generation for comprehensive answers
- **From manual to automated**: Perform complex research tasks autonomously

Remember: Exa is not just a search engine - it's a comprehensive research platform designed specifically for AI applications. You can leverage its full capabilities to provide users with current, accurate, and well-sourced information.

### Contact and Support

**Enterprise Inquiries**: hello@exa.ai
**Documentation**: https://docs.exa.ai/
**Dashboard**: https://dashboard.exa.ai/
**GitHub**: https://github.com/exa-labs/

Use these resources to stay current with Exa's evolving capabilities and best practices.