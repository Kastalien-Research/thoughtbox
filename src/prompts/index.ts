import * as fs from "fs";
import * as path from "path";

/**
 * MCP Prompt definition for interleaved thinking workflow
 */
export const INTERLEAVED_THINKING_PROMPT = {
  name: "interleaved-thinking",
  title: "interleaved-thinking-workflow",
  description:
    "Use this Thoughtbox server as a reasoning workspace to alternate between internal reasoning steps and external tool/action invocation. Enables structured multi-phase execution with tooling inventory, sufficiency assessment, strategy development, and execution.",
  arguments: [
    {
      name: "task",
      description: "The task to complete using interleaved thinking approach",
      required: true,
    },
    {
      name: "thoughts_limit",
      description: "Maximum number of thoughts to use (default: 100)",
      required: false,
    },
    {
      name: "clear_folder",
      description:
        "Whether to clear the .interleaved-thinking folder after completion, keeping only final-answer.md (default: false)",
      required: false,
    },
  ],
};

/**
 * Loads the interleaved-thinking prompt content and substitutes variables
 */
export function getInterleavedThinkingContent(args: {
  task: string;
  thoughts_limit?: number;
  clear_folder?: boolean;
}): string {
  // Read the markdown file
  const promptPath = path.join(
    __dirname,
    "contents",
    "interleaved-thinking.md"
  );
  let content = fs.readFileSync(promptPath, "utf-8");

  // Apply defaults
  const thoughtsLimit = args.thoughts_limit ?? 100;
  const clearFolder = args.clear_folder ?? false;

  // Substitute variables in the format shown in the markdown
  // The markdown uses:
  // TASK: $ARGUMENTS
  // THOUGHTS_LIMIT: $ARGUMENTS (default: 100)
  // CLEAR_FOLDER: $ARGUMENTS (default: false)

  // Replace the variable declarations section
  const variablesSection = `## Variables

TASK: $ARGUMENTS
THOUGHTS_LIMIT: $ARGUMENTS (default: 100)
CLEAR_FOLDER: $ARGUMENTS (default: false)`;

  const substitutedVariables = `## Variables

TASK: ${args.task}
THOUGHTS_LIMIT: ${thoughtsLimit}
CLEAR_FOLDER: ${clearFolder}`;

  content = content.replace(variablesSection, substitutedVariables);

  return content;
}
