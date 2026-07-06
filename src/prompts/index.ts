import { INTERLEAVED_THINKING_CONTENT } from "./contents/interleaved-thinking-content.js";
import {
  interleavedGuide,
  isValidMode,
  type InterleavedMode,
} from "./contents/interleaved-template.js";
import {
  PARALLEL_VERIFICATION_CONTENT,
  getParallelVerificationContent,
  parseParallelParams,
} from "./contents/parallel-verification.js";

export { LIST_MCP_ASSETS_PROMPT, getListMcpAssetsContent } from "./list-mcp-assets.js";
export { getParallelVerificationContent } from "./contents/parallel-verification.js";

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
 * MCP Prompt definition for parallel verification workflow
 */
export const PARALLEL_VERIFICATION_PROMPT = {
  name: "parallel-verification",
  title: "Parallel-Verification-Workflow",
  description:
    "Execute parallel hypothesis exploration using Thoughtbox. Pass your task/question - optional max_branches param can be included or will default to 3.",
  arguments: [
    {
      name: "input",
      description:
        "Your task/question. May include 'max_branches:N' or just describe the task.",
      required: true,
    },
  ],
};

/**
 * Loads the interleaved-thinking prompt content and substitutes variables
 */
export function getInterleavedThinkingContent(args: {
  task: string;
  thoughts_limit?: any;
  clear_folder?: any;
}): string {
  // Use bundled content (no file I/O)
  let content = INTERLEAVED_THINKING_CONTENT;

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

/**
 * Returns the resource template definition for interleaved thinking guides
 * Used by the ListResourceTemplatesRequestSchema handler
 */
export function getInterleavedResourceTemplates() {
  return {
    resourceTemplates: [
      {
        uriTemplate: "thoughtbox://interleaved/{mode}",
        name: "thoughtbox-interleaved-guides",
        title: "Thoughtbox Interleaved Thinking Guides",
        description:
          "IRCoT-style interleaved reasoning guides centered on Thoughtbox as the canonical reasoning workspace. Mode parameter: research, analysis, or development.",
        mimeType: "text/markdown",
        annotations: {
          audience: ["assistant"],
          priority: 1.0,
        },
      },
    ],
  };
}

/**
 * Resolves a thoughtbox://interleaved/{mode} URI to its content
 * Used by the ReadResourceRequestSchema handler
 *
 * @param uri - The resource URI to resolve
 * @returns Resource content with metadata
 * @throws Error if the URI is invalid or mode is not supported
 */
export function getInterleavedGuideForUri(uri: string) {
  // Expected format: thoughtbox://interleaved/{mode}
  const match = uri.match(/^thoughtbox:\/\/interleaved\/(.+)$/);

  if (!match) {
    throw new Error(
      `Invalid interleaved guide URI: ${uri}. Expected format: thoughtbox://interleaved/{mode}`
    );
  }

  const mode = match[1];

  if (!isValidMode(mode)) {
    throw new Error(
      `Invalid mode: ${mode}. Must be one of: research, analysis, development`
    );
  }

  return {
    uri,
    mimeType: "text/markdown",
    text: interleavedGuide(mode),
  };
}
