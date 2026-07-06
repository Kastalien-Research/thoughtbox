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
import { BRANCH_OPERATIONS } from "../branch/operations.js";
import { HUB_OPERATIONS } from "../hub/operations.js";
import { CLAIMS_OPERATIONS } from "../claims/operations.js";
import { PEER_NOTEBOOK_TOOL } from "../peer-notebook/tool.js";

export interface SearchCatalog {
  publicTools: Array<{
    name: string;
    description: string;
    operations?: string[];
  }>;
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

/**
 * Hand-curated operation annotations. Carries the equivalent of
 * .claude/rules/mcp-gotchas.md into the agent-visible catalog so common
 * mistakes surface at discovery time without the agent having to load
 * project-local rule files. Keyed by `${module}.${operation}`.
 *
 * v0 is hand-curated; the sleep-time pipeline (ADR-EPI-03) will mine
 * these from session calibration data when it ships.
 */
export interface CatalogAnnotation {
  whenToUse?: string;
  commonMistakes?: string[];
  relatedOps?: string[];
}

export const CATALOG_ANNOTATIONS: Record<string, CatalogAnnotation> = {
  "knowledge.add_observation": {
    whenToUse:
      "Adding a new observation to an existing entity. Pass entity_id (snake_case) and content; the entity must already exist (use create_entity first or accept the existing-entity behavior on UNIQUE collision).",
    commonMistakes: [
      "passing 'entityId' (camelCase) instead of 'entity_id'",
      "passing 'observation' instead of 'content'",
    ],
    relatedOps: ["knowledge.create_entity", "knowledge.query_graph"],
  },
  "knowledge.create_relation": {
    whenToUse:
      "Linking two existing entities with a typed relation. Pass from_id and to_id (snake_case). query_graph follows OUTGOING relations only, so direction matters.",
    commonMistakes: [
      "passing 'source_id'/'target_id' instead of 'from_id'/'to_id'",
      "expecting bidirectional traversal — query_graph is outgoing-only",
    ],
    relatedOps: ["knowledge.query_graph", "knowledge.create_entity"],
  },
  "knowledge.query_graph": {
    whenToUse:
      "Traversing the knowledge graph from a starting entity. Pass start_entity_id (snake_case). Follows outgoing relations only.",
    commonMistakes: [
      "passing 'entity_id' instead of 'start_entity_id'",
      "expecting incoming relations to be traversed",
    ],
    relatedOps: ["knowledge.list_entities", "knowledge.add_observation"],
  },
  "knowledge.create_entity": {
    whenToUse:
      "Registering a new entity in the graph. Returns the existing entity on UNIQUE(name, type) collision instead of erroring — use add_observation to attach corroborating evidence to a duplicate name.",
    commonMistakes: [
      "expecting an error on duplicate name+type — the existing entity is returned",
    ],
    relatedOps: ["knowledge.add_observation", "knowledge.create_relation"],
  },
  "thought.thoughtbox_thought": {
    whenToUse:
      "Submitting a structured thought. Submit one thought per call so the response's guidance can inform the next thought. Set nextThoughtNeeded=false on the final thought to complete the session.",
    commonMistakes: [
      "forgetting to complete sessions (nextThoughtNeeded stays true)",
      "reusing thoughtNumber within the same branch (must be unique per session+branch)",
      "submitting decision_frame without exactly one selected:true option",
    ],
    relatedOps: ["session.session_resume", "branch.branch_spawn"],
  },
  "branch.branch_spawn": {
    whenToUse:
      "Forking a session to explore an alternative under a modified premise. Pair with a synthesis thought after the branch completes so the conclusion lands back on the main line.",
    relatedOps: ["branch.branch_merge", "thought.thoughtbox_thought"],
  },
  "ulysses.init": {
    whenToUse:
      "Starting a surprise-gated debugging session. The S-register increments on each surprising outcome; reaching S=2 forces a reflection before further mutations.",
    commonMistakes: [
      "calling further mutating ops with S>=2 before tb.ulysses({operation:'reflect'})",
    ],
    relatedOps: ["ulysses.outcome", "ulysses.reflect"],
  },
  "theseus.init": {
    whenToUse:
      "Starting a behavior-preserving refactor session with hard scope locking. Out-of-scope file edits require an explicit visa.",
    commonMistakes: [
      "editing a file outside the declared scope without first calling theseus.visa",
    ],
    relatedOps: ["theseus.visa", "theseus.checkpoint", "theseus.outcome"],
  },
  "notebook.notebook_validate": {
    whenToUse:
      "Running a code cell as a deterministic predicate over JSON-serialisable observed data. The cell must write its verdict to TB_VERDICT_PATH as { verdict, reason, evidence? } using the auto-materialised tb-validate.js helpers.",
    commonMistakes: [
      "forgetting to import { observed, pass, fail } from './tb-validate.js'",
      "writing arbitrary console output and expecting that to be the verdict — the verdict is the JSON file at TB_VERDICT_PATH",
    ],
    relatedOps: ["notebook.notebook_run_cell", "notebook.notebook_add_cell"],
  },
};

function formatAnnotation(annotation: CatalogAnnotation): string {
  const stanzas: string[] = [];
  if (annotation.whenToUse) {
    stanzas.push(`When to use: ${annotation.whenToUse}`);
  }
  if (annotation.commonMistakes?.length) {
    stanzas.push(`Common mistakes: ${annotation.commonMistakes.join("; ")}`);
  }
  if (annotation.relatedOps?.length) {
    stanzas.push(`Related: ${annotation.relatedOps.join(", ")}`);
  }
  return stanzas.join("\n");
}

/**
 * Mutates catalog operation descriptions in place to append hand-curated
 * environmental memory (when_to_use / common mistakes / related ops).
 * No-op for operations not in CATALOG_ANNOTATIONS.
 */
export function annotateCatalog(
  catalog: SearchCatalog,
  annotations: Record<string, CatalogAnnotation> = CATALOG_ANNOTATIONS,
): void {
  for (const [moduleName, ops] of Object.entries(catalog.operations)) {
    for (const [opName, op] of Object.entries(ops)) {
      const annotation = annotations[`${moduleName}.${opName}`];
      if (!annotation) continue;
      const formatted = formatAnnotation(annotation);
      if (!formatted) continue;
      op.description = `${op.description}\n\n${formatted}`;
    }
  }
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
  const catalog: SearchCatalog = {
    publicTools: [
      {
        name: "thoughtbox_search",
        description: "Discover Thoughtbox operations, prompts, resources, and public tool surfaces by querying this catalog with JavaScript.",
      },
      {
        name: "thoughtbox_execute",
        description: "Run JavaScript against the tb SDK for Thoughtbox operation modules.",
      },
      {
        name: PEER_NOTEBOOK_TOOL.name,
        description: PEER_NOTEBOOK_TOOL.description,
        operations: [
          "peer_artifact_seed",
          "peer_invoke",
          "peer_get_invocation",
          "peer_list_trace_events",
          "peer_get_artifact",
          "peer_manifest_create",
          "peer_manifest_approve",
          "peer_manifest_reject",
          "peer_manifest_list",
          "peer_graduate_notebook",
        ],
      },
    ],

    operations: {
      session: indexOperations(SESSION_OPERATIONS),
      notebook: indexOperations(NOTEBOOK_OPERATIONS),
      knowledge: indexOperations(KNOWLEDGE_OPERATIONS),
      thought: indexOperations(THOUGHT_OPERATIONS),
      theseus: indexOperations(THESEUS_OPERATIONS),
      ulysses: indexOperations(ULYSSES_OPERATIONS),
      observability: indexOperations(OBSERVABILITY_OPERATIONS),
      branch: indexOperations(BRANCH_OPERATIONS),
      hub: indexOperations(HUB_OPERATIONS),
      claims: indexOperations(CLAIMS_OPERATIONS),
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
        name: "Peer Notebook",
        uri: "thoughtbox://peer-notebook/pilot",
        description: "Peer notebook surface (graduated peers) and operation quick reference",
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
        name: "Hub Operations Catalog",
        uri: "thoughtbox://hub/operations",
        description: "Complete catalog of all 28 hub operations organized by category with stage metadata and vocabulary",
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
        name: "Knowledge Graph Statistics",
        uri: "thoughtbox://knowledge/stats",
        description: "Entity and relation counts for the knowledge graph",
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
        name: "Hub Operation Detail",
        uriTemplate: "thoughtbox://hub/operations/{op}",
        description: "Individual hub operation schema and examples",
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
    ],
  };

  annotateCatalog(catalog);
  return catalog;
}
