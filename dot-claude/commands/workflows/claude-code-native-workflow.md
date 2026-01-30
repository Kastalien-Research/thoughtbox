# Company Research Workflow - Claude Code Native

This workflow is written specifically for me, Claude Code, to execute using my native capabilities.

## Starting the Workflow

When a user says any variation of:
- "Research [Company Name]"
- "Analyze [Company Name]"  
- "Tell me about [Company Name]"
- "Do a comprehensive analysis of [Company Name]"

I will immediately begin this workflow.

## Pre-Flight Check

I assume I'm properly configured with:
- Exa MCP Server running with valid API keys
- All 12 research tools available via `mcp__exa__*` prefix
- YouTube API key configured for video details

I'll proceed with confidence that the tools will work. If any specific tool fails, I'll handle it gracefully and continue with alternative approaches.

## My Execution Flow

### 🚀 Phase 1: Initialize Research

I'll use TodoWrite to track my progress:

```
TodoWrite([
  { content: "Gather core company information", status: "in_progress", priority: "high" },
  { content: "Analyze competitive landscape", status: "pending", priority: "high" },
  { content: "Research social media presence", status: "pending", priority: "medium" },
  { content: "Investigate technical capabilities", status: "pending", priority: "medium" },
  { content: "Synthesize findings into report", status: "pending", priority: "high" }
])
```

### 🔍 Phase 2: Core Information Gathering (Parallel)

I'll execute these simultaneously using my native parallel capability:

```
// I'll call all of these in a single message with multiple tool uses
mcp__exa__company_research_exa({ companyName: "Apple Inc." })
mcp__exa__wikipedia_search_exa({ query: "Apple Inc." })
mcp__exa__web_search_exa({ query: "Apple Inc. latest news 2024", numResults: 10 })
mcp__exa__competitor_finder_exa({ companyName: "Apple Inc." })
```

### 📊 Phase 3: Smart Conditional Analysis

Based on what I learn, I'll adapt my approach:

**If Tech Company Detected:**
```
// Additional parallel searches
mcp__exa__github_search_exa({ query: "Apple", searchType: "repositories" })
mcp__exa__research_paper_search_exa({ query: "Apple Inc research papers" })
```

**If Consumer Brand:**
```
// Focus on social presence
mcp__exa__tiktok_search_exa({ query: "Apple products" })
// Extra YouTube analysis
```

**If B2B Company:**
```
// Professional network focus
mcp__exa__linkedin_search_exa({ query: "Apple employees", searchType: "companies" })
```

### 📱 Phase 4: Social Media Deep Dive (Parallel)

Always analyze social presence:

```
// Execute all social searches in parallel
mcp__exa__youtube_search_exa({ query: "Apple", numResults: 10 })
mcp__exa__reddit_search_exa({ query: "Apple discussion", numResults: 5 })
mcp__exa__tiktok_search_exa({ query: "Apple", numResults: 5 })
mcp__exa__linkedin_search_exa({ query: "Apple Inc", searchType: "companies" })
```

Then for YouTube videos found:
```
// Extract video IDs and get details
mcp__exa__youtube_video_details_exa({ 
  videoIds: "id1,id2,id3,id4,id5" // up to 10 most relevant
})
```

### 🧠 Phase 5: My Synthesis Process

Using my native reasoning capabilities, I'll:

1. **Cross-Reference Information**
   - Verify facts across multiple sources
   - Identify conflicting information
   - Weight source credibility

2. **Pattern Recognition**
   - Identify trends in social sentiment
   - Spot competitive movements
   - Recognize market positioning

3. **Evidence Collection**
   - Track source URLs for all claims
   - Note confidence levels
   - Flag any uncertainties

## Output Generation

### Default Format (What I'll Produce)

```markdown
# Company Research Report: [Company Name]

## Executive Summary
[2-3 paragraph overview with key findings]

## Company Overview
- **Founded**: [Year] [EV-001]
- **Headquarters**: [Location] [EV-002]
- **Industry**: [Primary sectors]
- **Key Products/Services**: [List]
- **Employee Count**: [Range]
- **Revenue**: [Latest available]

## Market Position
- **Main Competitors**: [List with brief comparison]
- **Market Share**: [If available]
- **Competitive Advantages**: [Key differentiators]

## Social Media Presence
- **YouTube**: [X subscribers, top video has Y views]
- **Reddit**: [Sentiment analysis from discussions]
- **LinkedIn**: [Company page followers, employee count]
- **TikTok**: [Presence and engagement level]

## Recent Developments
[Chronological list of significant events]

## Technical Profile (if applicable)
- **Open Source**: [GitHub presence]
- **Research Output**: [Papers and patents]
- **Technology Stack**: [If identifiable]

## Analysis & Insights
[My synthesis of all findings]

## Evidence Citations
[EV-001]: Source: Wikipedia, URL: ...
[EV-002]: Source: Company Research, URL: ...
[...]
```

### Alternative Formats I Can Provide

If asked, I can also generate:
- **JSON Output**: Following the schema exactly
- **Brief Summary**: 1-page executive brief
- **Detailed Analysis**: Section-by-section deep dive
- **Comparison Format**: Side-by-side with competitors

## Error Handling (My Approach)

When tools fail or return limited data:

1. **I'll transparently report**: "GitHub search returned no results, which may indicate no public repositories"
2. **I'll adapt**: Use alternative sources to fill gaps
3. **I'll note limitations**: Clearly mark what couldn't be verified
4. **I'll continue**: Never let one failure stop the entire research

## My Memory Management

Throughout the research, I maintain:
- **Running evidence list** with citations
- **Key facts** for cross-referencing
- **Patterns and anomalies** I've noticed
- **Questions** that arise during research

## Practical Example

User: "Research Anthropic"

My immediate response:
```
I'll conduct a comprehensive research analysis of Anthropic. Let me start by gathering information across multiple sources in parallel.

[TodoWrite showing my plan]

Starting with core company information, competitive landscape, and social presence...

[Multiple parallel tool calls]

[Progressive updates as I analyze findings]

[Final comprehensive report with evidence]
```

## Why This Works for Me

1. **No External Dependencies**: I use only my built-in capabilities
2. **Natural Parallelism**: I can call multiple tools in one message
3. **Contextual Memory**: I maintain all findings in conversation context
4. **Flexible Execution**: I adapt based on what I discover
5. **Transparent Process**: Users see my progress via todos and updates

This is how I, Claude Code, actually execute company research - using my native abilities rather than trying to run external scripts or code.