/**
 * Code Mode — Search Index
 *
 * Builds a unified catalog object used by the search tool's sandbox.
 * Aggregates operations, prompts, resources, and resource templates
 * from across the server surface.
 */

import { SESSION_OPERATIONS } from "../sessions/operations.js";
import { NOTEBOOK_OPERATIONS } from "../notebook/operations.js";
import { KNOWLEDGE_OPERATIONS } from "../knowledge/operations.js";
// Created concurrently — imports resolve at compile time
import { THOUGHT_OPERATIONS } from "../thought/operations.js";
import {
  THESEUS_OPERATIONS,
  ULYSSES_OPERATIONS,
} from "../protocol/operations.js";
import {
  OBSERVABILITY_OPERATIONS,
} from "../observability/operations.js";

export interface SearchCatalog {
  operations: Record<string, Record<string, {
    title: string;
    description: string;
    category: string;
    inputSchema?: object;
  }>>;
  prompts: Array<{
    name: string;
    description: string;
    args: string[];
  }>;
  resources: Array<{
    name: string;
    uri: string;
    description: string;
    mimeType: string;
  }>;
  resourceTemplates: Array<{
    name: string;
    uriTemplate: string;
    description: string;
    mimeType: string;
  }>;
}

interface OperationEntry {
  name: string;
  title: string;
  description: string;
  category: string;
  inputSchema?: object;
}

function indexOperations(
  ops: OperationEntry[],
): Record<string, { title: string; description: string; category: string; inputSchema?: object }> {
  const indexed: Record<string, {
    title: string;
    description: string;
    category: string;
    inputSchema?: object;
  }> = {};
  for (const op of ops) {
    indexed[op.name] = {
      title: op.title,
      description: op.description,
      category: op.category,
      inputSchema: op.inputSchema,
    };
  }
  return indexed;
}

export function buildSearchCatalog(): SearchCatalog {
  return {
    operations: {
      session: indexOperations(SESSION_OPERATIONS),
      notebook: indexOperations(NOTEBOOK_OPERATIONS),
      knowledge: indexOperations(KNOWLEDGE_OPERATIONS),
      thought: indexOperations(THOUGHT_OPERATIONS),
      theseus: indexOperations(THESEUS_OPERATIONS),
      ulysses: indexOperations(ULYSSES_OPERATIONS),
      observability: indexOperations(OBSERVABILITY_OPERATIONS),
    },

    prompts: [
      {
        name: "list_mcp_assets",
        description: "Overview of all MCP capabilities, tools, resources, and quickstart guide",
        args: [],
      },
      {
        name: "interleaved-thinking",
        description:
          "Use this Thoughtbox server as a reasoning workspace to alternate between internal reasoning steps and external tool/action invocation. Enables structured multi-phase execution with tooling inventory, sufficiency assessment, strategy development, and execution.",
        args: ["task", "thoughts_limit", "clear_folder"],
      },
      {
        name: "subagent-summarize",
        description:
          "Get instructions for using Claude Code's Task tool to retrieve and summarize Thoughtbox sessions with context isolation. Reduces context consumption by 10-40x.",
        args: ["request"],
      },
      {
        name: "evolution-check",
        description:
          "Get instructions for checking which prior thoughts should be updated when a new insight is added. Uses sub-agent pattern for context isolation. Based on A-Mem paper.",
        args: ["newThought", "sessionId", "priorThoughts"],
      },
      {
        name: "test-thoughtbox",
        description:
          "Behavioral tests for the thoughtbox thinking tool (15 tests covering forward/backward thinking, branching, revisions, linked structure)",
        args: [],
      },
      {
        name: "test-notebook",
        description:
          "Behavioral tests for the notebook literate programming tool (8 tests covering creation, cells, execution, export)",
        args: [],
      },
      {
        name: "test-mental-models",
        description:
          "Behavioral tests for the mental_models structured reasoning tool (6 tests covering discovery, retrieval, capability graph)",
        args: [],
      },
      {
        name: "test-memory",
        description:
          "Behavioral tests for the thoughtbox_knowledge tool (12 tests covering entities, observations, relations, graph traversal, stats)",
        args: [],
      },
      {
        name: "spec-designer",
        description:
          "Design and produce implementation specifications through structured cognitive loops. Creates specs from prompts using OODA loop building blocks.",
        args: ["prompt", "output_folder", "depth", "max_specs", "plan_only"],
      },
      {
        name: "spec-validator",
        description:
          "Systematically validate specification documents against current codebase and project architecture. Identifies gaps, contradictions, and feasibility issues.",
        args: ["spec_path", "strict", "deep", "report_only"],
      },
      {
        name: "spec-orchestrator",
        description:
          "Coordinate implementation of multiple specification documents from a folder. Manages dependencies, tracks progress, and prevents implementation spirals using Operations Research principles.",
        args: ["spec_folder", "budget", "max_iterations", "plan_only"],
      },
      {
        name: "specification-suite",
        description:
          "Chain the design, validate, orchestrate lifecycle into one command. Moves from blank prompt to implemented, validated specs.",
        args: [
          "prompt_or_spec_path",
          "output_folder",
          "depth",
          "budget",
          "plan_only",
          "skip_design",
          "skip_validation",
        ],
      },
    ],

    resources: [
      {
        name: "Notebook Server Status",
        uri: "system://status",
        description: "Health snapshot of the notebook server",
        mimeType: "application/json",
      },
      {
        name: "Notebook Operations Catalog",
        uri: "thoughtbox://notebook/operations",
        description: "Complete catalog of notebook operations with schemas and examples",
        mimeType: "application/json",
      },
      {
        name: "Session Operations Catalog",
        uri: "thoughtbox://session/operations",
        description: "Complete catalog of session operations with schemas and examples",
        mimeType: "application/json",
      },
      {
        name: "Knowledge Operations Catalog",
        uri: "thoughtbox://knowledge/operations",
        description: "Complete catalog of knowledge graph operations with schemas and examples",
        mimeType: "application/json",
      },
      {
        name: "Thoughtbox Patterns Cookbook",
        uri: "thoughtbox://patterns-cookbook",
        description: "Guide to core reasoning patterns for thoughtbox tool",
        mimeType: "text/markdown",
      },
      {
        name: "Server Architecture Guide",
        uri: "thoughtbox://architecture",
        description:
          "Interactive notebook explaining Thoughtbox MCP server architecture and implementation patterns",
        mimeType: "text/markdown",
      },
      {
        name: "Thoughtbox Cipher Notation",
        uri: "thoughtbox://cipher",
        description: "Token-efficient notation system for long reasoning chains",
        mimeType: "text/markdown",
      },
      {
        name: "Session Analysis Process Guide",
        uri: "thoughtbox://session-analysis-guide",
        description:
          "Process guide for qualitative analysis of reasoning sessions (key moments, extract learnings)",
        mimeType: "text/markdown",
      },
      {
        name: "Parallel Verification Guide",
        uri: "thoughtbox://guidance/parallel-verification",
        description: "Workflow for parallel hypothesis exploration using Thoughtbox branching",
        mimeType: "text/markdown",
      },
      {
        name: "Evolution Check Pattern (A-Mem)",
        uri: "thoughtbox://prompts/evolution-check",
        description:
          "Check which prior thoughts should be updated when a new insight is added. Same content as evolution-check prompt.",
        mimeType: "text/markdown",
      },
      {
        name: "Subagent Summarize Pattern (RLM)",
        uri: "thoughtbox://prompts/subagent-summarize",
        description:
          "Context isolation pattern for retrieving sessions. Same content as subagent-summarize prompt.",
        mimeType: "text/markdown",
      },
      {
        name: "Behavioral Tests: Thoughtbox",
        uri: "thoughtbox://tests/thoughtbox",
        description:
          "Behavioral tests for the thoughtbox thinking tool (15 tests covering forward/backward thinking, branching, revisions, linked structure)",
        mimeType: "text/markdown",
      },
      {
        name: "Behavioral Tests: Notebook",
        uri: "thoughtbox://tests/notebook",
        description:
          "Behavioral tests for the notebook literate programming tool (8 tests covering creation, cells, execution, export)",
        mimeType: "text/markdown",
      },
      {
        name: "Behavioral Tests: Mental Models",
        uri: "thoughtbox://tests/mental-models",
        description:
          "Behavioral tests for the mental_models structured reasoning tool (6 tests covering discovery, retrieval, capability graph)",
        mimeType: "text/markdown",
      },
      {
        name: "Knowledge Graph Statistics",
        uri: "thoughtbox://knowledge/stats",
        description: "Entity and relation counts for the knowledge graph",
        mimeType: "application/json",
      },
      {
        name: "Behavioral Tests: Memory",
        uri: "thoughtbox://tests/memory",
        description:
          "Behavioral tests for the thoughtbox_knowledge tool (12 tests covering entities, observations, relations, graph traversal, stats)",
        mimeType: "text/markdown",
      },
      {
        name: "OODA Loops Catalog",
        uri: "thoughtbox://loops/catalog",
        description:
          "Complete catalog of OODA loop building blocks with metadata, classification, and composition rules",
        mimeType: "application/json",
      },
      {
        name: "Loop Analytics Refresh",
        uri: "thoughtbox://loops/analytics/refresh",
        description: "Trigger immediate aggregation of loop usage metrics and return updated statistics",
        mimeType: "application/json",
      },
    ],

    resourceTemplates: [
      {
        name: "Session Operation Detail",
        uriTemplate: "thoughtbox://session/operations/{op}",
        description: "Individual session operation schema and examples",
        mimeType: "application/json",
      },
      {
        name: "Knowledge Operation Detail",
        uriTemplate: "thoughtbox://knowledge/operations/{op}",
        description: "Individual knowledge graph operation schema and examples",
        mimeType: "application/json",
      },
      {
        name: "Notebook Operation Detail",
        uriTemplate: "thoughtbox://notebook/operations/{op}",
        description: "Individual notebook operation schema and examples",
        mimeType: "application/json",
      },
      {
        name: "Interleaved Thinking Guides",
        uriTemplate: "thoughtbox://interleaved/{guide}",
        description: "Interleaved thinking guides",
        mimeType: "text/markdown",
      },
      {
        name: "OODA Loop",
        uriTemplate: "thoughtbox://loops/{category}/{name}",
        description:
          "OODA loop building blocks for workflow composition. Access specific loops by category and name.",
        mimeType: "text/markdown",
      },
      {
        name: "Thoughts By Type",
        uriTemplate: "thoughtbox://thoughts/{sessionId}/{type}",
        description: "Query thoughts by semantic type (H/E/C/Q/R/P/O/A/X)",
        mimeType: "application/json",
      },
      {
        name: "Thought Range",
        uriTemplate: "thoughtbox://thoughts/{sessionId}/range/{start}-{end}",
        description: "Retrieve thoughts in specified range [start, end] inclusive",
        mimeType: "application/json",
      },
      {
        name: "Thought References",
        uriTemplate: "thoughtbox://references/{sessionId}/{thoughtNumber}",
        description: "Find all thoughts that reference a specific thought number",
        mimeType: "application/json",
      },
      {
        name: "Revision History",
        uriTemplate: "thoughtbox://revisions/{sessionId}/{thoughtNumber}",
        description: "Get complete revision history for a thought",
        mimeType: "application/json",
      },
    ],
  };
}
