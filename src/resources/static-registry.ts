/**
 * Static resource registry — the single source of truth for the server's
 * static resource and resource-template METADATA.
 *
 * Three surfaces derive from this registry (they were previously three
 * hand-synced copies that drifted):
 *   1. server-factory registerResource() registrations
 *   2. the ListResourcesRequestSchema / ListResourceTemplatesRequestSchema
 *      escape-hatch handlers in server-factory
 *   3. the frozen Code Mode search catalog (src/code-mode/search-index.ts)
 *
 * Content resolvers stay in server-factory (they need runtime handlers);
 * the drift test (src/code-mode/__tests__/catalog-drift.test.ts) verifies
 * every registry entry is actually registered and readable.
 */

export interface StaticResourceDef {
  /** registerResource registration key */
  key: string;
  /** Display name shown in resources/list */
  name: string;
  uri: string;
  description: string;
  mimeType: string;
}

export interface ResourceTemplateDef {
  /** registerResource registration key */
  key: string;
  /** Display name shown in resources/templates/list */
  name: string;
  uriTemplate: string;
  description: string;
  mimeType: string;
}

export const STATIC_RESOURCES: StaticResourceDef[] = [
  {
    key: "status",
    name: "Notebook Server Status",
    uri: "system://status",
    description: "Health snapshot of the notebook server",
    mimeType: "application/json",
  },
  {
    key: "notebook-operations",
    name: "Notebook Operations Catalog",
    uri: "thoughtbox://notebook/operations",
    description: "Complete catalog of notebook operations with schemas and examples",
    mimeType: "application/json",
  },
  {
    key: "notebook-capabilities",
    name: "Notebook Evidence Engine Capabilities",
    uri: "thoughtbox://notebook/capabilities",
    description: "Notebook Evidence Engine modes, templates, outputs, and recommended use cases",
    mimeType: "application/json",
  },
  {
    key: "peer-notebook-pilot",
    name: "Peer Notebook",
    uri: "thoughtbox://peer-notebook/pilot",
    description: "Peer notebook surface: artifact seed, graduated-peer invocation, invocation/trace/artifact reads",
    mimeType: "application/json",
  },
  {
    key: "session-operations",
    name: "Session Operations Catalog",
    uri: "thoughtbox://session/operations",
    description: "Complete catalog of session operations with schemas and examples",
    mimeType: "application/json",
  },
  {
    key: "gateway-operations",
    name: "Gateway Operations Catalog",
    uri: "thoughtbox://gateway/operations",
    description: "Complete catalog of operations available through the Code Mode gateway, grouped by tb SDK module (thought, session, knowledge, notebook, theseus, ulysses, observability, branch, hub, claims, runbook, merge, vars)",
    mimeType: "application/json",
  },
  {
    key: "knowledge-operations",
    name: "Knowledge Operations Catalog",
    uri: "thoughtbox://knowledge/operations",
    description: "Complete catalog of knowledge graph operations (create_entity, get_entity, list_entities, add_observation, create_relation, query_graph, stats) with schemas and examples",
    mimeType: "application/json",
  },
  {
    key: "hub-operations",
    name: "Hub Operations Catalog",
    uri: "thoughtbox://hub/operations",
    description: "Complete catalog of all 28 hub operations organized by category with stage metadata and vocabulary",
    mimeType: "application/json",
  },
  {
    key: "claims-operations",
    name: "Claims Operations Catalog",
    uri: "thoughtbox://claims/operations",
    description: "Complete catalog of the 9 claim graph operations (assert, support, invalidate, supersede, link, subscribe, unsubscribe, query, affected) with schemas, examples, and vocabulary",
    mimeType: "application/json",
  },
  {
    key: "patterns-cookbook",
    name: "Thoughtbox Patterns Cookbook",
    uri: "thoughtbox://patterns-cookbook",
    description: "Guide to core reasoning patterns for thoughtbox tool",
    mimeType: "text/markdown",
  },
  {
    key: "architecture",
    name: "Server Architecture Guide",
    uri: "thoughtbox://architecture",
    description: "Interactive notebook explaining Thoughtbox MCP server architecture and implementation patterns",
    mimeType: "text/markdown",
  },
  {
    key: "cipher",
    name: "Thoughtbox Cipher Notation",
    uri: "thoughtbox://cipher",
    description: "Token-efficient notation system for long reasoning chains",
    mimeType: "text/markdown",
  },
  {
    key: "session-analysis-guide",
    name: "Session Analysis Process Guide",
    uri: "thoughtbox://session-analysis-guide",
    description: "Process guide for qualitative analysis of reasoning sessions (key moments, record learnings)",
    mimeType: "text/markdown",
  },
  {
    key: "parallel-verification-guide",
    name: "Parallel Verification Guide",
    uri: "thoughtbox://guidance/parallel-verification",
    description: "Workflow for parallel hypothesis exploration using Thoughtbox branching",
    mimeType: "text/markdown",
  },
  {
    key: "knowledge-stats",
    name: "Knowledge Graph Statistics",
    uri: "thoughtbox://knowledge/stats",
    description: "Knowledge graph statistics (entity/relation counts)",
    mimeType: "application/json",
  },
];

export const RESOURCE_TEMPLATES: ResourceTemplateDef[] = [
  {
    key: "gateway-operation",
    name: "Gateway Operation Detail",
    uriTemplate: "thoughtbox://gateway/operations/{op}",
    description: "Individual operation schema from the Code Mode gateway catalog, looked up by name across tb SDK modules",
    mimeType: "application/json",
  },
  {
    key: "session-operation",
    name: "Session Operation Detail",
    uriTemplate: "thoughtbox://session/operations/{op}",
    description: "Individual session operation schema and examples",
    mimeType: "application/json",
  },
  {
    key: "knowledge-operation",
    name: "Knowledge Operation Detail",
    uriTemplate: "thoughtbox://knowledge/operations/{op}",
    description: "Individual knowledge graph operation schema and examples",
    mimeType: "application/json",
  },
  {
    key: "hub-operation",
    name: "Hub Operation Detail",
    uriTemplate: "thoughtbox://hub/operations/{op}",
    description: "Individual hub operation schema and examples",
    mimeType: "application/json",
  },
  {
    key: "claims-operation",
    name: "Claims Operation Detail",
    uriTemplate: "thoughtbox://claims/operations/{op}",
    description: "Individual claim graph operation schema and examples",
    mimeType: "application/json",
  },
  {
    key: "notebook-operation",
    name: "Notebook Operation Detail",
    uriTemplate: "thoughtbox://notebook/operations/{op}",
    description: "Individual notebook operation schema and examples",
    mimeType: "application/json",
  },
  {
    key: "interleaved-guide",
    name: "Interleaved Thinking Guides",
    uriTemplate: "thoughtbox://interleaved/{guide}",
    description: "Interleaved thinking guides",
    mimeType: "text/markdown",
  },
];

/** Lookup helpers (throw on unknown key so a typo fails at module load, not silently). */
export function staticResource(key: string): StaticResourceDef {
  const def = STATIC_RESOURCES.find((r) => r.key === key);
  if (!def) throw new Error(`Unknown static resource key: ${key}`);
  return def;
}

export function resourceTemplate(key: string): ResourceTemplateDef {
  const def = RESOURCE_TEMPLATES.find((t) => t.key === key);
  if (!def) throw new Error(`Unknown resource template key: ${key}`);
  return def;
}
