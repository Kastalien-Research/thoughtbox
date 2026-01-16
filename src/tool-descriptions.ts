/**
 * @fileoverview Stage-specific tool descriptions for progressive disclosure
 *
 * Each tool has descriptions that update based on workflow stage.
 * Descriptions are PREDICTIVE - they tell agents what will happen next.
 *
 * @module src/tool-descriptions
 */

import { DisclosureStage } from "./tool-registry.js";

/**
 * Domain to mental models mapping
 */
export const DOMAIN_MODELS: Record<string, string[]> = {
  debugging: ["rubber-duck", "five-whys"],
  planning: [
    "pre-mortem",
    "assumption-surfacing",
    "fermi-estimation",
    "decomposition",
    "time-horizon-shifting",
    "impact-effort-grid",
    "inversion",
  ],
  architecture: [
    "trade-off-matrix",
    "abstraction-laddering",
    "decomposition",
    "constraint-relaxation",
  ],
  "decision-making": [
    "steelmanning",
    "trade-off-matrix",
    "opportunity-cost",
    "time-horizon-shifting",
  ],
  "risk-management": ["pre-mortem", "adversarial-thinking", "inversion"],
  development: ["rubber-duck", "five-whys", "decomposition"],
  research: ["assumption-surfacing", "fermi-estimation", "abstraction-laddering"],
};

/**
 * All available domains
 */
export const AVAILABLE_DOMAINS = Object.keys(DOMAIN_MODELS);

/**
 * Init tool descriptions by stage
 */
export const INIT_DESCRIPTIONS: Partial<Record<DisclosureStage, string>> = {
  [DisclosureStage.STAGE_0_ENTRY]: `Navigate and initialize Thoughtbox sessions.

WORKFLOW: This is the entry point. After completing initialization, you will gain access to:
  - thoughtbox_cipher: Token-efficient notation system (REQUIRED before reasoning)
  - session: Manage and search reasoning sessions

Call with operation "get_state" to see available sessions, or "start_new" to begin fresh work.`,

  [DisclosureStage.STAGE_1_INIT_COMPLETE]: `Navigate and manage Thoughtbox sessions.

Session is active. Use to switch domains, load different sessions, or start new work.
Domain selection enables mental_models with structured reasoning frameworks filtered to your problem space.`,
};

/**
 * Cipher tool descriptions by stage
 */
export const CIPHER_DESCRIPTIONS: Partial<Record<DisclosureStage, string>> = {
  [DisclosureStage.STAGE_1_INIT_COMPLETE]: `Returns Thoughtbox's notation system for token-efficient reasoning.

IMPORTANT: Call this tool BEFORE using thoughtbox. The notation system significantly reduces token usage during multi-step reasoning.

After calling this tool, the main thoughtbox reasoning tool will become available.`,

  [DisclosureStage.STAGE_2_CIPHER_LOADED]: `Returns Thoughtbox's notation system for token-efficient reasoning.

Reference material - you have already loaded this. Use for refreshing notation conventions during long sessions.`,
};

/**
 * Session tool description (same across all stages)
 */
export const SESSION_DESCRIPTION = `Manage Thoughtbox reasoning sessions.

Operations: list, get, search, resume, export, analyze, extract_learnings

Use to find previous work, export reasoning chains, or analyze session patterns.`;

/**
 * Thoughtbox tool descriptions by stage
 */
export const THOUGHTBOX_DESCRIPTIONS: Partial<Record<DisclosureStage, string>> = {
  [DisclosureStage.STAGE_2_CIPHER_LOADED]: `Step-by-step thinking tool for complex problem-solving.

You have loaded the cipher notation system. Use compact notation for efficient reasoning chains.

Supports: forward thinking (1→N), backward thinking (N→1), branching, revision.

After domain selection, mental_models becomes available with structured reasoning frameworks filtered to your problem domain.`,
};

/**
 * Notebook tool descriptions by stage
 */
export const NOTEBOOK_DESCRIPTIONS: Partial<Record<DisclosureStage, string>> = {
  [DisclosureStage.STAGE_2_CIPHER_LOADED]: `Literate programming toolhost with JavaScript/TypeScript execution.

Create notebooks with markdown documentation and executable code cells. Each notebook runs in an isolated environment.

Operations: create, list, load, add_cell, update_cell, run_cell, install_deps, list_cells, get_cell, export

Use alongside thoughtbox for code-assisted reasoning workflows.`,
};

/**
 * Generate mental_models description based on active domain
 *
 * @param domain - Active domain (or null for generic description)
 */
export function getMentalModelsDescription(domain: string | null): string {
  if (!domain || !DOMAIN_MODELS[domain]) {
    return `Access mental models for structured reasoning.

Available domains: ${AVAILABLE_DOMAINS.join(", ")}

Operations: get_model, list_models, list_tags`;
  }

  const models = DOMAIN_MODELS[domain];
  const modelList = models.map((m) => `  - ${m}`).join("\n");

  return `Access mental models for structured reasoning.

Available models for domain "${domain}":
${modelList}

Operations: get_model, list_models, list_tags`;
}

/**
 * Export reasoning chain tool descriptions by stage
 */
export const EXPORT_DESCRIPTIONS: Partial<Record<DisclosureStage, string>> = {
  [DisclosureStage.STAGE_3_DOMAIN_ACTIVE]: `Export a reasoning session to filesystem as linked JSON structure.

Useful for persisting reasoning chains, sharing sessions, or archiving completed work.`,
};

/**
 * Helper to get all descriptions for a tool
 */
export function getToolDescriptions(
  toolName: string
): Partial<Record<DisclosureStage, string>> {
  switch (toolName) {
    case "init":
      return INIT_DESCRIPTIONS;
    case "thoughtbox_cipher":
      return CIPHER_DESCRIPTIONS;
    case "session":
      return {
        [DisclosureStage.STAGE_1_INIT_COMPLETE]: SESSION_DESCRIPTION,
      };
    case "thoughtbox":
      return THOUGHTBOX_DESCRIPTIONS;
    case "notebook":
      return NOTEBOOK_DESCRIPTIONS;
    case "mental_models":
      // Dynamic - use getMentalModelsDescription() instead
      return {
        [DisclosureStage.STAGE_3_DOMAIN_ACTIVE]: getMentalModelsDescription(null),
      };
    case "export_reasoning_chain":
      return EXPORT_DESCRIPTIONS;
    default:
      return {};
  }
}
