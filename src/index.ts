#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
// Fixed chalk import for ESM
import chalk from 'chalk';
import { z } from 'zod';
import { PATTERNS_COOKBOOK } from './resources/patterns-cookbook-content.js';

// Configuration schema for Smithery
export const configSchema = z.object({
  disableThoughtLogging: z.boolean()
    .optional()
    .default(false)
    .describe("Disable thought output to stderr (useful for production deployments)"),
});

interface ThoughtData {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts?: boolean;
  includeGuide?: boolean;
  nextThoughtNeeded: boolean;
}

class ClearThoughtServer {
  private thoughtHistory: ThoughtData[] = [];
  private branches: Record<string, ThoughtData[]> = {};
  private disableThoughtLogging: boolean;
  private patternsCookbook: string;

  constructor(disableThoughtLogging: boolean = false) {
    this.disableThoughtLogging = disableThoughtLogging;
    // Use imported cookbook content (works for both STDIO and HTTP builds)
    this.patternsCookbook = PATTERNS_COOKBOOK;
  }

  private validateThoughtData(input: unknown): ThoughtData {
    const data = input as Record<string, unknown>;

    if (!data.thought || typeof data.thought !== 'string') {
      throw new Error('Invalid thought: must be a string');
    }
    if (!data.thoughtNumber || typeof data.thoughtNumber !== 'number') {
      throw new Error('Invalid thoughtNumber: must be a number');
    }
    if (!data.totalThoughts || typeof data.totalThoughts !== 'number') {
      throw new Error('Invalid totalThoughts: must be a number');
    }
    if (typeof data.nextThoughtNeeded !== 'boolean') {
      throw new Error('Invalid nextThoughtNeeded: must be a boolean');
    }

    return {
      thought: data.thought,
      thoughtNumber: data.thoughtNumber,
      totalThoughts: data.totalThoughts,
      nextThoughtNeeded: data.nextThoughtNeeded,
      isRevision: data.isRevision as boolean | undefined,
      revisesThought: data.revisesThought as number | undefined,
      branchFromThought: data.branchFromThought as number | undefined,
      branchId: data.branchId as string | undefined,
      needsMoreThoughts: data.needsMoreThoughts as boolean | undefined,
      includeGuide: data.includeGuide as boolean | undefined,
    };
  }

  private formatThought(thoughtData: ThoughtData): string {
    const { thoughtNumber, totalThoughts, thought, isRevision, revisesThought, branchFromThought, branchId } = thoughtData;

    let prefix = '';
    let context = '';

    if (isRevision) {
      prefix = chalk.yellow('🔄 Revision');
      context = ` (revising thought ${revisesThought})`;
    } else if (branchFromThought) {
      prefix = chalk.green('🌿 Branch');
      context = ` (from thought ${branchFromThought}, ID: ${branchId})`;
    } else {
      prefix = chalk.blue('💭 Thought');
      context = '';
    }

    const header = `${prefix} ${thoughtNumber}/${totalThoughts}${context}`;
    const border = '─'.repeat(Math.max(header.length, thought.length) + 4);

    return `
┌${border}┐
│ ${header} │
├${border}┤
│ ${thought.padEnd(border.length - 2)} │
└${border}┘`;
  }

  public processThought(input: unknown): { content: Array<any>; isError?: boolean } {
    try {
      const validatedInput = this.validateThoughtData(input);

      if (validatedInput.thoughtNumber > validatedInput.totalThoughts) {
        validatedInput.totalThoughts = validatedInput.thoughtNumber;
      }

      this.thoughtHistory.push(validatedInput);

      if (validatedInput.branchFromThought && validatedInput.branchId) {
        if (!this.branches[validatedInput.branchId]) {
          this.branches[validatedInput.branchId] = [];
        }
        this.branches[validatedInput.branchId].push(validatedInput);
      }

      if (!this.disableThoughtLogging) {
        const formattedThought = this.formatThought(validatedInput);
        console.error(formattedThought);
      }

      // Build response content array
      const content: Array<any> = [{
        type: "text",
        text: JSON.stringify({
          thoughtNumber: validatedInput.thoughtNumber,
          totalThoughts: validatedInput.totalThoughts,
          nextThoughtNeeded: validatedInput.nextThoughtNeeded,
          branches: Object.keys(this.branches),
          thoughtHistoryLength: this.thoughtHistory.length
        }, null, 2)
      }];

      // Include patterns cookbook as embedded resource when:
      // 1. At the start (thoughtNumber === 1)
      // 2. At the end (thoughtNumber === totalThoughts)
      // 3. On-demand (includeGuide === true)
      const shouldIncludeGuide =
        validatedInput.thoughtNumber === 1 ||
        validatedInput.thoughtNumber === validatedInput.totalThoughts ||
        validatedInput.includeGuide === true;

      if (shouldIncludeGuide) {
        content.push({
          type: "resource",
          resource: {
            uri: "thinking://patterns-cookbook",
            title: "Sequential Thinking Patterns Cookbook",
            mimeType: "text/markdown",
            text: this.patternsCookbook,
            annotations: {
              audience: ["assistant"],
              priority: 0.9
            }
          }
        });
      }

      return { content };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            status: 'failed'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
}

const THINK_START_PROMPT = {
  name: "think-start",
  title: "think-start",
  description: "Analyze your problem and set up the first thought with the right reasoning pattern",
  arguments: [
    {
      name: "problem",
      description: "Description of the problem or task you want to solve",
      required: true
    }
  ]
};

const CLEAR_THOUGHT_TOOL: Tool = {
  name: "clear_thought",
  description: `A detailed tool for dynamic and reflective problem-solving through thoughts.
This tool helps analyze problems through a flexible thinking process that can adapt and evolve.
Each thought can build on, question, or revise previous insights as understanding deepens.
Supports forward thinking (1→N), backward thinking (N→1), or mixed approaches.

When to use this tool:
- Breaking down complex problems into steps
- Planning and design with room for revision
- Analysis that might need course correction
- Problems where the full scope might not be clear initially
- Problems that require a multi-step solution
- Tasks that need to maintain context over multiple steps
- Situations where irrelevant information needs to be filtered out

Thinking Approaches:

**Forward Thinking (Traditional Chain of Thought)**: Start at thought 1, work sequentially to thought N
- Use when: Exploring unknowns, brainstorming, open-ended analysis, discovery
- Pattern: thoughtNumber 1 → 2 → 3 → ... → N
- Example: "How can we improve user engagement?" Start with current state, explore options, reach conclusion

**Backward Thinking (Goal-Driven Reasoning)**: Start at thought N (desired end state), work back to thought 1 (starting conditions)
- Use when: Designing systems, planning projects, solving well-defined problems, working from goals
- Pattern: thoughtNumber N → N-1 → N-2 → ... → 1
- Example: "Design a caching strategy for 10k req/s" Start with success criteria (thought 8), work backwards through prerequisites (monitoring, invalidation, implementation, profiling) to reach starting point (thought 1: define requirements)
- Tip: Begin with the desired outcome, then repeatedly ask "what must be true immediately before this?"

**Mixed/Branched Thinking**: Combine approaches or explore alternative paths using branch parameters
- Use when: Complex problems requiring multiple perspectives or hypothesis testing
- Pattern: Use isRevision, branchFromThought, and branchId to create alternative reasoning paths

Patterns Cookbook:
The patterns cookbook guide is automatically provided as an embedded resource at thought 1 and at the final thought.
You can also request it at any time using the includeGuide parameter.
The cookbook contains 20+ reasoning patterns with examples and usage guidance.

Key features:
- You can adjust total_thoughts up or down as you progress
- You can question or revise previous thoughts
- You can add more thoughts even after reaching what seemed like the end
- You can express uncertainty and explore alternative approaches
- Not every thought needs to build linearly - you can branch or backtrack
- Generates a solution hypothesis
- Verifies the hypothesis based on the Chain of Thought steps
- Repeats the process until satisfied
- Provides a correct answer

Parameters explained:
- thought: Your current thinking step, which can include:
* Regular analytical steps
* Revisions of previous thoughts
* Questions about previous decisions
* Realizations about needing more analysis
* Changes in approach
* Hypothesis generation
* Hypothesis verification
- next_thought_needed: True if you need more thinking, even if at what seemed like the end
- thought_number: Current number in sequence (can go beyond initial total if needed)
- total_thoughts: Current estimate of thoughts needed (can be adjusted up/down)
- is_revision: A boolean indicating if this thought revises previous thinking
- revises_thought: If is_revision is true, which thought number is being reconsidered
- branch_from_thought: If branching, which thought number is the branching point
- branch_id: Identifier for the current branch (if any)
- needs_more_thoughts: If reaching end but realizing more thoughts needed

You should:
1. Start with an initial estimate of needed thoughts, but be ready to adjust
2. Feel free to question or revise previous thoughts
3. Don't hesitate to add more thoughts if needed, even at the "end"
4. Express uncertainty when present
5. Mark thoughts that revise previous thinking or branch into new paths
6. Ignore information that is irrelevant to the current step
7. Generate a solution hypothesis when appropriate
8. Verify the hypothesis based on the Chain of Thought steps
9. Repeat the process until satisfied with the solution
10. Provide a single, ideally correct answer as the final output
11. Only set next_thought_needed to false when truly done and a satisfactory answer is reached`,
  inputSchema: {
    type: "object",
    properties: {
      thought: {
        type: "string",
        description: "Your current thinking step"
      },
      nextThoughtNeeded: {
        type: "boolean",
        description: "Whether another thought step is needed"
      },
      thoughtNumber: {
        type: "integer",
        description: "Current thought number (can be 1→N for forward thinking, or N→1 for backward/goal-driven thinking)",
        minimum: 1
      },
      totalThoughts: {
        type: "integer",
        description: "Estimated total thoughts needed (for backward thinking, start with thoughtNumber = totalThoughts)",
        minimum: 1
      },
      isRevision: {
        type: "boolean",
        description: "Whether this revises previous thinking"
      },
      revisesThought: {
        type: "integer",
        description: "Which thought is being reconsidered",
        minimum: 1
      },
      branchFromThought: {
        type: "integer",
        description: "Branching point thought number",
        minimum: 1
      },
      branchId: {
        type: "string",
        description: "Branch identifier"
      },
      needsMoreThoughts: {
        type: "boolean",
        description: "If more thoughts are needed"
      },
      includeGuide: {
        type: "boolean",
        description: "Request the patterns cookbook guide as embedded resource (also provided automatically at thought 1 and final thought)"
      }
    },
    required: ["thought", "nextThoughtNeeded", "thoughtNumber", "totalThoughts"]
  }
};

// Exported server creation function for Smithery HTTP transport
export default function createServer({
  config,
}: {
  config: z.infer<typeof configSchema>;
}) {
  const server = new Server(
    {
      name: "clear-thought-server",
      version: "0.2.0",
    },
    {
      // note: objects are intended to be empty
      capabilities: {
        tools: {},
        prompts: {},
        resources: {}
      },
    }
  );

  const thinkingServer = new ClearThoughtServer(config.disableThoughtLogging);

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [CLEAR_THOUGHT_TOOL],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "clear_thought") {
      return thinkingServer.processThought(request.params.arguments);
    }

    return {
      content: [{
        type: "text",
        text: `Unknown tool: ${request.params.name}`
      }],
      isError: true
    };
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [THINK_START_PROMPT]
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    if (request.params.name !== "think-start") {
      throw new Error(`Unknown prompt: ${request.params.name}`);
    }

    const problem = request.params.arguments?.problem as string || "";

    if (!problem) {
      throw new Error("Problem description is required");
    }

    // Pattern detection based on keywords
    const problemLower = problem.toLowerCase();
    let pattern = "Forward";
    let reasoning = "";
    let totalThoughts = 15;
    let startingThought = 1;
    let direction = "1→N (sequential progression)";
    let firstThoughtGuidance = `Thought 1: Start by describing the current state or context of "${problem}"`;
    let nextSteps = `- Continue with thought 2, building on your initial analysis
- Progress sequentially through thoughts
- Adjust totalThoughts if you need more or fewer steps`;

    // Backward thinking keywords
    if (problemLower.match(/\b(design|plan|build|create|implement|architect|develop)\b/)) {
      pattern = "Backward";
      reasoning = "Your problem involves design/planning/implementation, which benefits from working backwards from the desired goal state.";
      totalThoughts = 20;
      startingThought = 20;
      direction = "N→1 (working backwards from goal)";
      firstThoughtGuidance = `Thought ${totalThoughts}: GOAL STATE - Describe the successful end result of "${problem}"`;
      nextSteps = `- Work backwards from thought ${totalThoughts} to thought 1
- For each thought, ask: "What must be true immediately before this?"
- End at thought 1 with your starting conditions`;
    }
    // Branching/comparison keywords
    else if (problemLower.match(/\b(compare|versus|vs\b|options|alternatives|choose|decide)\b/)) {
      pattern = "Branching";
      reasoning = "Your problem involves comparing alternatives, which benefits from exploring multiple paths in parallel.";
      totalThoughts = 15;
      startingThought = 1;
      direction = "Create branches for each option";
      firstThoughtGuidance = `Thought 1: Identify the options you're comparing in "${problem}"`;
      nextSteps = `- After thought 5-7, create branches using branchFromThought and branchId
- Explore each option in its own branch
- Create a synthesis thought (e.g., thought 15) to compare and decide`;
    }
    // Forward thinking keywords or default
    else if (problemLower.match(/\b(explore|understand|analyze|investigate|research|learn|study)\b/)) {
      reasoning = "Your problem involves exploration/analysis, which benefits from sequential forward progression.";
      totalThoughts = 12;
    } else {
      reasoning = "Using forward progression as the default approach for systematic exploration.";
      totalThoughts = 15;
    }

    // Complexity adjustment
    const words = problem.split(/\s+/).length;
    if (words > 15) {
      totalThoughts = Math.min(totalThoughts + 10, 40);
    } else if (words < 5) {
      totalThoughts = Math.max(totalThoughts - 5, 5);
    }

    const response = `Based on your problem: "${problem}"

RECOMMENDED PATTERN: ${pattern} Thinking
REASONING: ${reasoning}

SETUP:
- totalThoughts: ${totalThoughts}
- Starting point: thought ${startingThought}
- Direction: ${direction}

FIRST THOUGHT TEMPLATE:
{
  "thought": "${firstThoughtGuidance}",
  "thoughtNumber": ${startingThought},
  "totalThoughts": ${totalThoughts},
  "nextThoughtNeeded": true
}

NEXT STEPS:
${nextSteps}

TIP: The patterns cookbook guide is automatically provided at thought 1 for detailed pattern reference.`;

    return {
      description: `Sequential thinking starter for: ${problem}`,
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: response
          }
        }
      ]
    };
  });

  return server;
}

// STDIO transport for backward compatibility
async function runServer() {
  // Get configuration from environment variable (backward compatible)
  const disableThoughtLogging = (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true";

  // Create server using the exported function
  const server = createServer({
    config: {
      disableThoughtLogging,
    },
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Clear Thought MCP Server running on stdio");
}

// Only run STDIO server when executed directly (not when imported by Smithery)
// This check only works in ESM environments; in CJS builds (Smithery), this block is skipped
if (typeof import.meta.url !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
  });
}
