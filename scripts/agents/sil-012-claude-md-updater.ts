#!/usr/bin/env npx tsx
/**
 * SIL-012 CLAUDE.md Learning Updater Agent
 *
 * After improvement loop iterations, this agent analyzes what worked and
 * what didn't, then updates CLAUDE.md with learned lessons.
 *
 * Usage:
 *   npx tsx scripts/agents/sil-012-claude-md-updater.ts --iterations './results.json'
 *
 * Or import and use programmatically:
 *   import { updateClaudeMd } from "./sil-012-claude-md-updater.js";
 *   await updateClaudeMd(iterations);
 */

import { query, type SDKMessage, type SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import {
  LoopIteration,
  Learning,
  AgentConfig,
  DEFAULT_CONFIG,
  THOUGHTBOX_INSTRUCTIONS,
} from "./types.js";
import * as fs from "fs/promises";
import * as path from "path";

// ============================================================================
// Streaming Input Mode Support (for multi-turn Thoughtbox interactions)
// ============================================================================

interface StreamingUserMessage {
  type: "user";
  message: { role: "user"; content: string };
  parent_tool_use_id: string | null;
  session_id?: string;
}

function createMessageGenerator(initialPrompt: string) {
  let resolveNext: ((msg: StreamingUserMessage | null) => void) | null = null;
  const messageQueue: StreamingUserMessage[] = [];
  let finished = false;
  let capturedSessionId: string | undefined;

  async function* generateMessages(): AsyncIterable<StreamingUserMessage> {
    yield {
      type: "user",
      message: { role: "user", content: initialPrompt },
      parent_tool_use_id: null,
    } as StreamingUserMessage;

    while (!finished) {
      const nextMsg = await new Promise<StreamingUserMessage | null>((resolve) => {
        if (messageQueue.length > 0) {
          resolve(messageQueue.shift()!);
        } else {
          resolveNext = resolve;
        }
      });

      if (nextMsg === null) break;
      yield nextMsg;
    }
  }

  function queueMessage(content: string) {
    const msg: StreamingUserMessage = {
      type: "user",
      message: { role: "user", content },
      parent_tool_use_id: null,
      session_id: capturedSessionId,
    };
    if (resolveNext) {
      const resolve = resolveNext;
      resolveNext = null;
      resolve(msg);
    } else {
      messageQueue.push(msg);
    }
  }

  function setSessionId(id: string) {
    capturedSessionId = id;
  }

  function finish() {
    finished = true;
    if (resolveNext) {
      resolveNext(null);
    }
  }

  return { generateMessages, queueMessage, finish, setSessionId };
}

// ============================================================================
// System Prompt for Learning Extraction
// ============================================================================

const LEARNING_EXTRACTOR_SYSTEM_PROMPT = `
You are a Learning Extractor agent. Your job is to analyze improvement loop results and extract lessons learned.

${THOUGHTBOX_INSTRUCTIONS}

## Your Task

Given iteration results, identify:

1. **What Works** - Patterns that led to successful improvements
   - What types of discoveries were fixable?
   - What approaches succeeded?
   - What made evaluations pass?

2. **What Doesn't Work** - Patterns that led to failures
   - What discoveries were too complex?
   - What approaches failed and why?
   - What common errors occurred?

3. **Capability Gaps** - Things the loop can't do yet
   - What required human intervention?
   - What tools were missing?
   - What knowledge was lacking?

## Output Format

\`\`\`json
{
  "learnings": [
    {
      "category": "what_works|what_doesnt|capability_gaps",
      "content": "The specific learning",
      "confidence": 0.8,
      "evidence": "What iteration/data supports this"
    }
  ],
  "claudeMdUpdate": {
    "whatWorks": ["line 1", "line 2"],
    "whatDoesnt": ["line 1"],
    "capabilityGaps": ["line 1"]
  }
}
\`\`\`

## Guidelines

- Be SPECIFIC. "Tests failed" is useless. "Jest tests fail when modifying files that import from node_modules" is useful.
- Include ACTIONABLE insights. What should future runs do differently?
- Only include learnings with confidence > 0.6
- Don't repeat things already in CLAUDE.md
`.trim();

// ============================================================================
// Learning Extraction
// ============================================================================

export interface LearningExtractionResult {
  learnings: Learning[];
  claudeMdUpdate: {
    whatWorks: string[];
    whatDoesnt: string[];
    capabilityGaps: string[];
  };
}

export async function extractLearnings(
  iterations: LoopIteration[],
  config: Partial<AgentConfig> = {}
): Promise<LearningExtractionResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const prompt = `
Analyze these improvement loop iterations and extract learnings:

${JSON.stringify(iterations, null, 2)}

Focus on patterns across iterations. What generalizable lessons emerge?
`.trim();

  // Create streaming message generator for multi-turn Thoughtbox support
  const { generateMessages, queueMessage, finish, setSessionId } = createMessageGenerator(prompt);

  const assistantMessages: string[] = [];
  let success = false;
  let errorMessage: string | undefined;
  let followUpSent = false;

  try {
    for await (const message of query({
      prompt: generateMessages() as AsyncIterable<SDKUserMessage>,
      options: {
        systemPrompt: LEARNING_EXTRACTOR_SYSTEM_PROMPT,
        mcpServers: {
          thoughtbox: {
            type: "http",
            url: mergedConfig.thoughtboxUrl,
          },
        },
        allowedTools: [
          "mcp__thoughtbox__thoughtbox_gateway",
          "mcp__thoughtbox__observability_gateway",
        ],
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        model: mergedConfig.model,
        maxTurns: mergedConfig.maxTurns,
        maxBudgetUsd: mergedConfig.maxBudgetUsd,
      },
    })) {
      switch (message.type) {
        case "system":
          if (message.subtype === "init") {
            setSessionId(message.session_id); // Capture for follow-up messages
          }
          break;

        case "assistant":
          const content = extractAssistantContent(message);
          if (content) {
            assistantMessages.push(content);
            if (mergedConfig.verbose) {
              console.log("[Assistant]", content.substring(0, 300));
            }

            // Handle Thoughtbox's multi-turn handshake
            if (!followUpSent && (
              content.includes("Ready to begin") ||
              content.includes("please send any message to proceed") ||
              content.includes("send another message")
            )) {
              followUpSent = true;
              if (mergedConfig.verbose) {
                console.log("[Multi-turn] Sending follow-up to continue...");
              }
              queueMessage("Continue with the learning extraction. Complete it fully and output the final JSON result.");
            }
          }
          break;

        case "result":
          finish(); // Signal we're done with input

          if (message.subtype === "success") {
            success = true;
          } else {
            success = false;
            errorMessage = message.subtype;
          }
          break;
      }
    }
  } catch (err) {
    finish(); // Cleanup
    console.error("Learning extraction failed:", err);
    return {
      learnings: [],
      claudeMdUpdate: {
        whatWorks: [],
        whatDoesnt: [],
        capabilityGaps: [],
      },
    };
  }

  if (!success) {
    console.error("Learning extraction failed:", errorMessage);
    return {
      learnings: [],
      claudeMdUpdate: {
        whatWorks: [],
        whatDoesnt: [],
        capabilityGaps: [],
      },
    };
  }

  return extractLearningsFromMessages(assistantMessages);
}

function extractAssistantContent(message: SDKMessage): string {
  if (message.type !== "assistant") return "";

  const apiMessage = message.message;
  if (!apiMessage?.content) return "";

  const textParts: string[] = [];

  for (const block of apiMessage.content) {
    if (block.type === "text") {
      textParts.push(block.text);
    } else if (block.type === "tool_use") {
      textParts.push(`[Tool: ${block.name}]`);
    }
  }

  return textParts.join("\n");
}

function extractLearningsFromMessages(
  assistantMessages: string[]
): LearningExtractionResult {
  for (let i = assistantMessages.length - 1; i >= 0; i--) {
    const msg = assistantMessages[i];
    const jsonMatch = msg.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          learnings: (parsed.learnings || []).map(
            (l: Record<string, unknown>) => ({
              category: l.category as Learning["category"],
              content: String(l.content || ""),
              discoveredAt: new Date(),
              sourceIterationId: String(l.evidence || "unknown"),
              confidence: Number(l.confidence ?? 0.5),
            })
          ),
          claudeMdUpdate: {
            whatWorks: parsed.claudeMdUpdate?.whatWorks || [],
            whatDoesnt: parsed.claudeMdUpdate?.whatDoesnt || [],
            capabilityGaps: parsed.claudeMdUpdate?.capabilityGaps || [],
          },
        };
      } catch {
        // Continue searching
      }
    }
  }

  return {
    learnings: [],
    claudeMdUpdate: {
      whatWorks: [],
      whatDoesnt: [],
      capabilityGaps: [],
    },
  };
}

// ============================================================================
// CLAUDE.md Update
// ============================================================================

export async function updateClaudeMd(
  iterations: LoopIteration[],
  claudeMdPath: string = "./CLAUDE.md",
  config: Partial<AgentConfig> = {}
): Promise<{ updated: boolean; learningsAdded: number }> {
  // Read current CLAUDE.md
  let claudeMdContent: string;
  try {
    claudeMdContent = await fs.readFile(claudeMdPath, "utf-8");
  } catch {
    console.error(`Could not read ${claudeMdPath}`);
    return { updated: false, learningsAdded: 0 };
  }

  // Extract learnings
  const { claudeMdUpdate } = await extractLearnings(iterations, config);

  // Count total learnings
  const totalLearnings =
    claudeMdUpdate.whatWorks.length +
    claudeMdUpdate.whatDoesnt.length +
    claudeMdUpdate.capabilityGaps.length;

  if (totalLearnings === 0) {
    console.log("No new learnings to add");
    return { updated: false, learningsAdded: 0 };
  }

  // Find and update the Improvement Loop Learnings section
  const updatedContent = updateLearningsSection(claudeMdContent, claudeMdUpdate);

  if (updatedContent === claudeMdContent) {
    console.log("CLAUDE.md unchanged");
    return { updated: false, learningsAdded: 0 };
  }

  // Write updated content
  await fs.writeFile(claudeMdPath, updatedContent, "utf-8");
  console.log(`Updated ${claudeMdPath} with ${totalLearnings} learnings`);

  return { updated: true, learningsAdded: totalLearnings };
}

function updateLearningsSection(
  content: string,
  update: LearningExtractionResult["claudeMdUpdate"]
): string {
  // Find the "Improvement Loop Learnings" section
  const sectionMarker = "## Improvement Loop Learnings";
  const sectionIndex = content.indexOf(sectionMarker);

  if (sectionIndex === -1) {
    // Section doesn't exist, add it at the end
    const newSection = buildLearningsSection(update);
    return content.trimEnd() + "\n\n" + newSection + "\n";
  }

  // Find the end of this section (next ## or end of file)
  const afterSection = content.slice(sectionIndex + sectionMarker.length);
  const nextSectionMatch = afterSection.match(/\n##\s/);
  const sectionEnd = nextSectionMatch
    ? sectionIndex + sectionMarker.length + nextSectionMatch.index!
    : content.length;

  const existingSection = content.slice(sectionIndex, sectionEnd);

  // Merge new learnings with existing ones
  const mergedSection = mergeLearnings(existingSection, update);

  return content.slice(0, sectionIndex) + mergedSection + content.slice(sectionEnd);
}

function buildLearningsSection(
  update: LearningExtractionResult["claudeMdUpdate"]
): string {
  const lines = ["## Improvement Loop Learnings", "", "> Auto-generated learnings from autonomous improvement cycles", ""];

  if (update.whatWorks.length > 0) {
    lines.push("### What Works", "");
    for (const item of update.whatWorks) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }

  if (update.whatDoesnt.length > 0) {
    lines.push("### What Doesn't Work", "");
    for (const item of update.whatDoesnt) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }

  if (update.capabilityGaps.length > 0) {
    lines.push("### Current Capability Gaps", "");
    for (const item of update.capabilityGaps) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function mergeLearnings(
  existingSection: string,
  update: LearningExtractionResult["claudeMdUpdate"]
): string {
  // Extract existing items from each subsection
  const extractItems = (section: string, header: string): string[] => {
    const headerIndex = section.indexOf(header);
    if (headerIndex === -1) return [];

    const afterHeader = section.slice(headerIndex + header.length);
    const nextHeaderMatch = afterHeader.match(/\n###\s/);
    const subsectionEnd = nextHeaderMatch ? nextHeaderMatch.index! : afterHeader.length;
    const subsection = afterHeader.slice(0, subsectionEnd);

    const items: string[] = [];
    const itemMatches = subsection.matchAll(/^- (.+)$/gm);
    for (const match of itemMatches) {
      items.push(match[1]);
    }
    return items;
  };

  const existingWorks = extractItems(existingSection, "### What Works");
  const existingDoesnt = extractItems(existingSection, "### What Doesn't Work");
  const existingGaps = extractItems(existingSection, "### Current Capability Gaps");

  // Merge (deduplicate)
  const mergedWorks = [...new Set([...existingWorks, ...update.whatWorks])];
  const mergedDoesnt = [...new Set([...existingDoesnt, ...update.whatDoesnt])];
  const mergedGaps = [...new Set([...existingGaps, ...update.capabilityGaps])];

  return buildLearningsSection({
    whatWorks: mergedWorks,
    whatDoesnt: mergedDoesnt,
    capabilityGaps: mergedGaps,
  });
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const iterationsIndex = args.indexOf("--iterations");
  const claudeMdIndex = args.indexOf("--claude-md");

  if (iterationsIndex === -1 || !args[iterationsIndex + 1]) {
    console.error("Usage: npx tsx sil-012-claude-md-updater.ts --iterations <path>");
    console.error("\nOptions:");
    console.error("  --iterations <path>  Path to JSON file with iteration results");
    console.error("  --claude-md <path>   Path to CLAUDE.md (default: ./CLAUDE.md)");
    console.error("  --verbose            Show detailed output");
    process.exit(1);
  }

  const iterationsPath = args[iterationsIndex + 1];
  const claudeMdPath = claudeMdIndex !== -1 && args[claudeMdIndex + 1]
    ? args[claudeMdIndex + 1]
    : "./CLAUDE.md";

  const verbose = args.includes("--verbose");

  // Load iterations
  let iterations: LoopIteration[];
  try {
    const content = await fs.readFile(iterationsPath, "utf-8");
    iterations = JSON.parse(content);
  } catch (e) {
    console.error(`Failed to load iterations from ${iterationsPath}:`, e);
    process.exit(1);
  }

  console.log(`Loaded ${iterations.length} iterations from ${iterationsPath}`);
  console.log(`Will update: ${claudeMdPath}`);

  try {
    const result = await updateClaudeMd(iterations, claudeMdPath, { verbose });

    if (result.updated) {
      console.log(`\n SUCCESS: Added ${result.learningsAdded} learnings to CLAUDE.md`);
    } else {
      console.log("\n No updates needed");
    }
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
