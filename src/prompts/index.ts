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
import { SPEC_DESIGNER_CONTENT } from "./contents/spec-designer-content.js";
import { SPEC_VALIDATOR_CONTENT } from "./contents/spec-validator-content.js";
import { SPEC_ORCHESTRATOR_CONTENT } from "./contents/spec-orchestrator-content.js";
import { SPECIFICATION_SUITE_CONTENT } from "./contents/specification-suite-content.js";

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
 * MCP Prompt definition for spec-designer workflow
 */
export const SPEC_DESIGNER_PROMPT = {
  name: "spec-designer",
  title: "Spec Designer",
  description:
    "Design and produce implementation specifications through structured cognitive loops. Creates specs from prompts using OODA loop building blocks.",
  arguments: [
    {
      name: "prompt",
      description: "The feature or system to design specifications for",
      required: true,
    },
    {
      name: "output_folder",
      description: "Folder to output specs to (default: .specs/)",
      required: false,
    },
    {
      name: "depth",
      description: "Spec depth: shallow, standard, or comprehensive (default: standard)",
      required: false,
    },
    {
      name: "max_specs",
      description: "Maximum number of specs to generate (default: 5)",
      required: false,
    },
    {
      name: "plan_only",
      description: "Only explore and plan, don't generate specs (default: false)",
      required: false,
    },
  ],
};

/**
 * MCP Prompt definition for spec-validator workflow
 */
export const SPEC_VALIDATOR_PROMPT = {
  name: "spec-validator",
  title: "Spec Validator",
  description:
    "Systematically validate specification documents against current codebase and project architecture. Identifies gaps, contradictions, and feasibility issues.",
  arguments: [
    {
      name: "spec_path",
      description: "Path to spec file or folder to validate",
      required: true,
    },
    {
      name: "strict",
      description: "Strict mode: any missing requirement is a failure (default: false)",
      required: false,
    },
    {
      name: "deep",
      description: "Perform deeper semantic analysis and cross-file trace (default: false)",
      required: false,
    },
    {
      name: "report_only",
      description: "Skip suggestion phase, only generate report (default: false)",
      required: false,
    },
  ],
};

/**
 * MCP Prompt definition for spec-orchestrator workflow
 */
export const SPEC_ORCHESTRATOR_PROMPT = {
  name: "spec-orchestrator",
  title: "Spec Orchestrator",
  description:
    "Coordinate implementation of multiple specification documents from a folder. Manages dependencies, tracks progress, and prevents implementation spirals using Operations Research principles.",
  arguments: [
    {
      name: "spec_folder",
      description: "Folder containing specification documents to implement",
      required: true,
    },
    {
      name: "budget",
      description: "Energy budget for implementation (default: 100)",
      required: false,
    },
    {
      name: "max_iterations",
      description: "Maximum iterations per spec (default: 3)",
      required: false,
    },
    {
      name: "plan_only",
      description: "Analyze without implementing (default: false)",
      required: false,
    },
  ],
};

/**
 * MCP Prompt definition for specification-suite workflow
 */
export const SPECIFICATION_SUITE_PROMPT = {
  name: "specification-suite",
  title: "Specification Suite",
  description:
    "Chain the design → validate → orchestrate lifecycle into one command. Moves from blank prompt to implemented, validated specs.",
  arguments: [
    {
      name: "prompt_or_spec_path",
      description: "Prompt string OR existing spec folder/file path",
      required: true,
    },
    {
      name: "output_folder",
      description: "Output folder for specs (default: .specs/)",
      required: false,
    },
    {
      name: "depth",
      description: "Spec depth: shallow, standard, or comprehensive (default: standard)",
      required: false,
    },
    {
      name: "budget",
      description: "Energy budget for orchestration (default: 100)",
      required: false,
    },
    {
      name: "plan_only",
      description: "Stop after validation, don't implement (default: false)",
      required: false,
    },
    {
      name: "skip_design",
      description: "Treat input as existing specs, skip design phase (default: false)",
      required: false,
    },
    {
      name: "skip_validation",
      description: "Skip validation, jump from design to orchestration (default: false)",
      required: false,
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
 * Loads the spec-designer prompt content and substitutes variables
 */
export function getSpecDesignerContent(args: {
  prompt: string;
  output_folder?: string;
  depth?: string;
  max_specs?: string;
  plan_only?: string;
}): string {
  let content = SPEC_DESIGNER_CONTENT;

  // Apply defaults
  const outputFolder = args.output_folder ?? ".specs/";
  const depth = args.depth ?? "standard";
  const maxSpecs = args.max_specs ?? "5";
  const planOnly = args.plan_only ?? "false";

  // Substitute variables
  const variablesSection = `## Variables

PROMPT: $ARGUMENTS
OUTPUT_FOLDER: $ARGUMENTS (default: .specs/)
DEPTH: $ARGUMENTS (default: standard)
MAX_SPECS: $ARGUMENTS (default: 5)
PLAN_ONLY: $ARGUMENTS (default: false)
CONFIDENCE_THRESHOLD: $ARGUMENTS (default: 0.85)`;

  const substitutedVariables = `## Variables

PROMPT: ${args.prompt}
OUTPUT_FOLDER: ${outputFolder}
DEPTH: ${depth}
MAX_SPECS: ${maxSpecs}
PLAN_ONLY: ${planOnly}
CONFIDENCE_THRESHOLD: 0.85`;

  content = content.replace(variablesSection, substitutedVariables);

  return content;
}

/**
 * Loads the spec-validator prompt content and substitutes variables
 */
export function getSpecValidatorContent(args: {
  spec_path: string;
  strict?: string;
  deep?: string;
  report_only?: string;
}): string {
  let content = SPEC_VALIDATOR_CONTENT;

  // Apply defaults
  const strictMode = args.strict ?? "false";
  const deepValidation = args.deep ?? "false";
  const reportOnly = args.report_only ?? "false";

  // Substitute variables
  const variablesSection = `## Variables

SPEC_PATH: $ARGUMENTS
STRICT_MODE: $ARGUMENTS (default: false - if true, any missing requirement is a failure)
DEEP_VALIDATION: $ARGUMENTS (default: false - if true, performs deeper semantic analysis and cross-file trace)
REPORT_ONLY: $ARGUMENTS (default: false - skip suggestion phase)
RESUME: $ARGUMENTS (default: false)`;

  const substitutedVariables = `## Variables

SPEC_PATH: ${args.spec_path}
STRICT_MODE: ${strictMode}
DEEP_VALIDATION: ${deepValidation}
REPORT_ONLY: ${reportOnly}
RESUME: false`;

  content = content.replace(variablesSection, substitutedVariables);

  return content;
}

/**
 * Loads the spec-orchestrator prompt content and substitutes variables
 */
export function getSpecOrchestratorContent(args: {
  spec_folder: string;
  budget?: string;
  max_iterations?: string;
  plan_only?: string;
}): string {
  let content = SPEC_ORCHESTRATOR_CONTENT;

  // Apply defaults
  const budget = args.budget ?? "100";
  const maxIterations = args.max_iterations ?? "3";
  const planOnly = args.plan_only ?? "false";

  // Substitute variables
  const variablesSection = `## Variables

SPEC_FOLDER: $ARGUMENTS
BUDGET: $ARGUMENTS (default: 100 energy units)
MAX_ITERATIONS: $ARGUMENTS (default: 3 per spec)
CONFIDENCE_THRESHOLD: $ARGUMENTS (default: 0.9)
WORKTREE_MODE: $ARGUMENTS (default: false)
PLAN_ONLY: $ARGUMENTS (default: false)`;

  const substitutedVariables = `## Variables

SPEC_FOLDER: ${args.spec_folder}
BUDGET: ${budget}
MAX_ITERATIONS: ${maxIterations}
CONFIDENCE_THRESHOLD: 0.9
WORKTREE_MODE: false
PLAN_ONLY: ${planOnly}`;

  content = content.replace(variablesSection, substitutedVariables);

  return content;
}

/**
 * Loads the specification-suite prompt content and substitutes variables
 */
export function getSpecificationSuiteContent(args: {
  prompt_or_spec_path: string;
  output_folder?: string;
  depth?: string;
  budget?: string;
  plan_only?: string;
  skip_design?: string;
  skip_validation?: string;
}): string {
  let content = SPECIFICATION_SUITE_CONTENT;

  // Apply defaults
  const outputFolder = args.output_folder ?? ".specs/";
  const depth = args.depth ?? "standard";
  const budget = args.budget ?? "100";
  const planOnly = args.plan_only ?? "false";
  const skipDesign = args.skip_design ?? "false";
  const skipValidation = args.skip_validation ?? "false";

  // Substitute variables
  const variablesSection = `## Variables

PROMPT_OR_SPEC_PATH: $ARGUMENTS (prompt string OR existing spec folder/file)
OUTPUT_FOLDER: $ARGUMENTS (default: .specs/)
DEPTH: $ARGUMENTS (default: standard; passed to spec-designer)
MAX_SPECS: $ARGUMENTS (default: 5; passed to spec-designer)
STRICT_MODE: $ARGUMENTS (default: false; passed to spec-validator)
DEEP_VALIDATION: $ARGUMENTS (default: false; passed to spec-validator)
BUDGET: $ARGUMENTS (default: 100; passed to spec-orchestrator)
MAX_ITERATIONS: $ARGUMENTS (default: 3; passed to spec-orchestrator)
PLAN_ONLY: $ARGUMENTS (default: false; stop after validation)
RESUME: $ARGUMENTS (default: false; resume previous suite run)
SKIP_DESIGN: $ARGUMENTS (default: false; treat PROMPT_OR_SPEC_PATH as existing specs)
SKIP_VALIDATION: $ARGUMENTS (default: false; jump from design to orchestrate)`;

  const substitutedVariables = `## Variables

PROMPT_OR_SPEC_PATH: ${args.prompt_or_spec_path}
OUTPUT_FOLDER: ${outputFolder}
DEPTH: ${depth}
MAX_SPECS: 5
STRICT_MODE: false
DEEP_VALIDATION: false
BUDGET: ${budget}
MAX_ITERATIONS: 3
PLAN_ONLY: ${planOnly}
RESUME: false
SKIP_DESIGN: ${skipDesign}
SKIP_VALIDATION: ${skipValidation}`;

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
