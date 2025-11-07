// Auto-generated from src/prompts/contents/interleaved-thinking.md
// This allows the content to be bundled into the JavaScript build for both STDIO and HTTP transports

export const INTERLEAVED_THINKING_CONTENT = `# Interleaved Thinking

Use this Thoughtbox server as a reasoning workspace to alternate between internal reasoning steps and external tool/action invocation, carrying the reasoning state forward across those alternations. Put another way, you will use this server to reason about how to utilize a subset of your available tools to complete a user-provided task.

## Variables

TASK: $ARGUMENTS
THOUGHTS_LIMIT: $ARGUMENTS (default: 100)
CLEAR_FOLDER: $ARGUMENTS (default: false)

## Process Phases

### Phase 1: Tooling Inventory

\`\`\`
OBJECTIVE: Inventory all available tools (integrated and external via MCP)

Examine your environment and notice that you have certain tools available to you. Some of these will be built-in, and some of these will be provided over Model Context Protocol. It is likely that the tools that provided via Model Context Protocol will be prefixed with "mcp__" or another prefix that refers to the Model Context Protocol.

In a markdown file called tooling-inventory.md within a new folder at the root of the project called /.interleaved-thinking/, list all of the tools that are available to you.
\`\`\`

### Phase 2: Tooling sufficiency assessment

\`\`\`
OBJECTIVE: Determine if the available tools are sufficient to complete the TASK as defined by the user.

Example: Imagine that the user has asked you to perform a deep research + analysis process to determine how to refactor the current project, an agentic AI application written in TypeScript, to use the Vercel AI SDK instead of direct calls to a model provider API. In this scenario, before beginning to perform the research side of the process, you must determine if you have tools available that enable web search, database retrieval, or other means of accessing sufficient external information to plan out the refactor.

This assessment will result in one of two outcomes.

OUTCOME 1 EXAMPLE: You look in your environment and see the following tools available to you:

mcp__thoughtbox__clear_thought (thoughtbox): 2.0k tokens
mcp__thoughtbox__notebook (thoughtbox): 853 tokens
mcp__ide__getDiagnostics (ide): 611 tokens
mcp__ide__executeCode (ide): 682 tokens
mcp__firecrawl-mcp__firecrawl_scrape (firecrawl-mcp): 1.6k tokens
mcp__firecrawl-mcp__firecrawl_map (firecrawl-mcp): 855 tokens
mcp__firecrawl-mcp__firecrawl_search (firecrawl-mcp): 2.3k tokens
mcp__firecrawl-mcp__firecrawl_crawl (firecrawl-mcp): 1.9k tokens
mcp__firecrawl-mcp__firecrawl_check_crawl_status (firecrawl-mcp): 710 tokens
mcp__firecrawl-mcp__firecrawl_extract (firecrawl-mcp): 1.1k tokens
mcp__context7__resolve-library-id (context7): 874 tokens
mcp__context7__get-library-docs (context7): 835 tokens

You notice that the context7 and Firecrawl tools would allow you to retrieve the necessary information to complete the TASK, via calls to the context7 documentation libraries and the Firecrawl web crawler. You determine that the available tools are sufficient to complete the TASK as defined by the user.

OUTCOME 2 EXAMPLE: You look in your environment and see the following tools available to you:

mcp__thoughtbox__clear_thought (thoughtbox): 2.0k tokens
mcp__thoughtbox__notebook (thoughtbox): 853 tokens
mcp__ide__getDiagnostics (ide): 611 tokens
mcp__ide__executeCode (ide): 682 tokens

You notice that none of these tools enable retrieval or search capabilities. You determine that the available tools are NOT sufficient to complete the TASK as defined by the user.

if (OUTCOME 2) {
    // inform the user that your tools do not enable the necessary capabilities to complete the TASK, and describe what those capabilities are so the user can configure them for you
} else {
    // move on to Phase 3
}
\`\`\`

### Phase 3: Use Thoughtbox to reason about how to use the available tools to complete the TASK

\`\`\`
OBJECTIVE: Use your mcp__thoughtbox__clear_thought tool to develop a strategy for using the available tools to complete the TASK.

The strategy should not be a rigid TODO list that dictates what tools should be used when. Rather, it should describe a process by which you can use the provided tools to iterate toward the user's desired outcome (in our example, a plan to refactor the current project to use the Vercel AI SDK instead of direct calls to a model provider API), and should be flexible enough to adapt to unexpected information that may be discovered along the way.

Use the following process to develop your strategy:

1. Allocate a certain percentage of the number of thoughts N in the THOUGHTS_LIMIT argument (default: 100) to the strategizing phase.
2. Start by considering what a successful strategy would look like at thought N, then work backwards (N, N-1, N-2, etc.) toward the completed strategy at thought 1.
3. Be sure to define one or more "gates" in this strategy, or checkpoints that you will use to evaluate the success of the strategy as you execute it.
4. When the strategy is completed, document it in a new markdown file in the /.interleaved-thinking/ folder called strategy.md.
\`\`\`

### Phase 4: Execute the strategy

\`\`\`
OBJECTIVE: Execute the strategy for completing the user's TASK.

Utilize the mcp__thoughtbox__clear_thought tool to structure your execution as a stepwise process. This process will look something like:

1. Allocate a number of thoughts up to and including the remaining number of thoughts from the THOUGHTS_LIMIT argument (THOUGHTS_LIMIT - N, where N is the number of thoughts used in Phase 3).
2. Break down the contents of the strategy.md file into a closed-loop, stepwise process in which you iterate in sub-loops toward each "gate" as defined in the strategy.
3. Once the conditions in a gate are met, break out of the sub-loop and continue to the next gate.
4. When all gates have been reached, the strategy is complete and you can provide a final answer to the user.

Note that in our example above, the user's desired end state is merely a **plan** to refactor the current project to use the Vercel AI SDK instead of direct calls to a model provider API. The execution of that plan is outside the scope of this example to keep things simple, but the same principles would apply if the user's desired end state were a more complex process (i.e. the TASK is to actually perform the entire refactor, which may require additional tools and capabilities like a sandbox environment).
\`\`\`

### Phase 5: Provide a final answer to the user

\`\`\`
OBJECTIVE: Provide a final answer to the user.

When all gates have been reached and the strategy is completely executed (i.e. a plan has been created in our example above), you can provide a final answer to the user. This answer should include any recommendations or next steps that you believe are necessary.

If the CLEAR_FOLDER argument is true, create a new markdown file in the /.interleaved-thinking/ folder called final-answer.md, and then remove the other contents of the /.interleaved-thinking/ folder from the project.
\`\`\`
`;
