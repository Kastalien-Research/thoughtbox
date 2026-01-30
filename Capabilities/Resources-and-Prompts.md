 # Resources and Prompts
 
 Thoughtbox uses MCP resources and prompts to expose documentation, workflows, and guidance.
 
 ## Prompts (registered)
 
 - `list_mcp_assets` — capability overview
 - `interleaved-thinking` — IRCoT-style interleaved reasoning workflow
 - `subagent-summarize` — context isolation for session retrieval
 - `evolution-check` — A-Mem retroactive linking workflow
 - `test-thoughtbox` — behavioral tests for thoughtbox
 - `test-notebook` — behavioral tests for notebook
 - `test-mental-models` — behavioral tests for mental models
 - `test-memory` — behavioral tests for knowledge graph
 - `spec-designer` — specification design workflow
 - `spec-validator` — specification validation workflow
 - `spec-orchestrator` — specification orchestration workflow
 - `specification-suite` — chained design → validate → orchestrate workflow
 
 ## Static resources
 
 - `system://status` — notebook server status
 - `thoughtbox://notebook/operations` — notebook operations catalog
 - `thoughtbox://patterns-cookbook` — reasoning patterns guide
 - `thoughtbox://architecture` — server architecture guide
 - `thoughtbox://cipher` — cipher protocol
 - `thoughtbox://session-analysis-guide` — qualitative analysis guide
 - `thoughtbox://guidance/parallel-verification` — branching verification workflow
 - `thoughtbox://prompts/evolution-check` — prompt content as resource
 - `thoughtbox://prompts/subagent-summarize` — prompt content as resource
 - `thoughtbox://mental-models/operations` — mental models catalog
 - `thoughtbox://loops/catalog` — OODA loop catalog
 - `thoughtbox://loops/analytics/refresh` — refresh loop usage metrics
 - `thoughtbox://knowledge/stats` — knowledge graph statistics
 
 ## Init flow resources
 
 - `thoughtbox://init`
 - `thoughtbox://init/{mode}`
 - `thoughtbox://init/{mode}/{project}`
 - `thoughtbox://init/{mode}/{project}/{task}`
 - `thoughtbox://init/{mode}/{project}/{task}/{aspect}`
 
 ## Mental model browsing resources
 
 - `thoughtbox://mental-models`
 - `thoughtbox://mental-models/{tag}`
 - `thoughtbox://mental-models/{tag}/{model}`
 
 ## Thought graph query resources
 
 - `thoughtbox://thoughts/{sessionId}/{type}`
 - `thoughtbox://thoughts/{sessionId}/range/{start}-{end}`
 - `thoughtbox://references/{sessionId}/{thoughtNumber}`
 - `thoughtbox://revisions/{sessionId}/{thoughtNumber}`
 
 ## Interleaved guides
 
 - `thoughtbox://interleaved/{mode}` with modes `research`, `analysis`, `development`
 
 ## OODA loops and analytics
 
 - OODA loop content is embedded and browsed by category + name:
   - `thoughtbox://loops/{category}/{name}`
 - Loop usage is tracked in `.claude/thoughtbox/loop-usage.jsonl` when available.
 - Hot loop rankings are written to `.claude/thoughtbox/hot-loops.json`.
