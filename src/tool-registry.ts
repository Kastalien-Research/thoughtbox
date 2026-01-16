/**
 * @fileoverview Tool Registry for Progressive Disclosure
 *
 * Manages staged visibility of tools based on workflow progression.
 * Uses MCP SDK's RegisteredTool enable/disable API.
 *
 * Stage 0 (Entry):        [init]
 * Stage 1 (Init Complete): [init, thoughtbox_cipher, session]
 * Stage 2 (Cipher Loaded): [init, thoughtbox_cipher, session, thoughtbox, notebook]
 * Stage 3 (Domain Active): [init, thoughtbox_cipher, session, thoughtbox, notebook, mental_models]
 *
 * @module src/tool-registry
 */

import type { RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Stages of progressive disclosure
 */
export enum DisclosureStage {
  STAGE_0_ENTRY = "entry",
  STAGE_1_INIT_COMPLETE = "init_complete",
  STAGE_2_CIPHER_LOADED = "cipher_loaded",
  STAGE_3_DOMAIN_ACTIVE = "domain_active",
}

/**
 * Tool entry with stage-based visibility
 */
export interface ToolEntry {
  tool: RegisteredTool;
  enabledAtStage: DisclosureStage;
  domainFilter?: string[]; // For stage 3 tools - which domains enable this tool
  descriptions: Partial<Record<DisclosureStage, string>>;
}

/**
 * Stage order for comparison
 */
const STAGE_ORDER: DisclosureStage[] = [
  DisclosureStage.STAGE_0_ENTRY,
  DisclosureStage.STAGE_1_INIT_COMPLETE,
  DisclosureStage.STAGE_2_CIPHER_LOADED,
  DisclosureStage.STAGE_3_DOMAIN_ACTIVE,
];

/**
 * Registry for managing tool visibility based on workflow stage
 */
export class ToolRegistry {
  private tools = new Map<string, ToolEntry>();
  private currentStage = DisclosureStage.STAGE_0_ENTRY;
  private activeDomain: string | null = null;

  /**
   * Register a tool with stage-based visibility
   *
   * @param name - Tool name
   * @param tool - RegisteredTool from SDK
   * @param enabledAtStage - Stage at which tool becomes visible
   * @param descriptions - Stage-specific descriptions
   * @param domainFilter - Optional domain filter for Stage 3 tools
   */
  register(
    name: string,
    tool: RegisteredTool,
    enabledAtStage: DisclosureStage,
    descriptions: Partial<Record<DisclosureStage, string>>,
    domainFilter?: string[]
  ): void {
    this.tools.set(name, { tool, enabledAtStage, domainFilter, descriptions });

    // Only stage 0 tools start enabled
    if (enabledAtStage !== DisclosureStage.STAGE_0_ENTRY) {
      tool.disable();
    }

    // Set initial description
    const initialDesc = descriptions[DisclosureStage.STAGE_0_ENTRY];
    if (initialDesc && enabledAtStage === DisclosureStage.STAGE_0_ENTRY) {
      tool.update({ description: initialDesc });
    }
  }

  /**
   * Advance to a new disclosure stage
   *
   * @param stage - Target stage
   * @param domain - Optional domain for Stage 3
   */
  advanceToStage(stage: DisclosureStage, domain?: string): void {
    // Don't go backwards unless explicitly requested
    const currentIdx = STAGE_ORDER.indexOf(this.currentStage);
    const targetIdx = STAGE_ORDER.indexOf(stage);

    if (targetIdx < currentIdx) {
      console.warn(
        `[ToolRegistry] Ignoring backward stage transition from ${this.currentStage} to ${stage}`
      );
      return;
    }

    this.currentStage = stage;
    if (domain) this.activeDomain = domain;

    // Update all tools based on new stage
    for (const [name, entry] of this.tools) {
      const shouldEnable = this.shouldToolBeEnabled(entry);

      if (shouldEnable) {
        entry.tool.enable();

        // Update description for current stage (fall back through stages)
        const desc = this.getDescriptionForStage(entry, stage);
        if (desc) {
          entry.tool.update({ description: desc });
        }
      } else {
        entry.tool.disable();
      }
    }

    // SDK automatically emits notifications/tools/list_changed when tools are enabled/disabled
  }

  /**
   * Get the appropriate description for a tool at a given stage
   */
  private getDescriptionForStage(
    entry: ToolEntry,
    stage: DisclosureStage
  ): string | undefined {
    // Try current stage first
    if (entry.descriptions[stage]) {
      return entry.descriptions[stage];
    }

    // Fall back through earlier stages
    const stageIdx = STAGE_ORDER.indexOf(stage);
    for (let i = stageIdx - 1; i >= 0; i--) {
      const fallbackStage = STAGE_ORDER[i];
      if (entry.descriptions[fallbackStage]) {
        return entry.descriptions[fallbackStage];
      }
    }

    return undefined;
  }

  /**
   * Check if a tool should be enabled at current stage
   */
  private shouldToolBeEnabled(entry: ToolEntry): boolean {
    const currentIdx = STAGE_ORDER.indexOf(this.currentStage);
    const enabledIdx = STAGE_ORDER.indexOf(entry.enabledAtStage);

    // Tool is not available until its stage is reached
    if (currentIdx < enabledIdx) {
      return false;
    }

    // Domain filtering for stage 3 tools
    if (
      entry.domainFilter &&
      entry.domainFilter.length > 0 &&
      this.currentStage === DisclosureStage.STAGE_3_DOMAIN_ACTIVE
    ) {
      // If no active domain, don't enable domain-filtered tools
      if (!this.activeDomain) {
        return false;
      }
      // Check if active domain matches filter
      return entry.domainFilter.includes(this.activeDomain);
    }

    return true;
  }

  /**
   * Get current disclosure stage
   */
  getCurrentStage(): DisclosureStage {
    return this.currentStage;
  }

  /**
   * Get active domain (for Stage 3)
   */
  getActiveDomain(): string | null {
    return this.activeDomain;
  }

  /**
   * Set active domain and update Stage 3 tools
   */
  setActiveDomain(domain: string): void {
    this.activeDomain = domain;

    // If already at stage 3, re-evaluate tool visibility
    if (this.currentStage === DisclosureStage.STAGE_3_DOMAIN_ACTIVE) {
      this.advanceToStage(DisclosureStage.STAGE_3_DOMAIN_ACTIVE, domain);
    }
  }

  /**
   * Get list of currently enabled tools
   */
  getEnabledTools(): string[] {
    return [...this.tools.entries()]
      .filter(([_, entry]) => entry.tool.enabled)
      .map(([name]) => name);
  }

  /**
   * Check if a specific tool is enabled
   */
  isToolEnabled(name: string): boolean {
    const entry = this.tools.get(name);
    return entry?.tool.enabled ?? false;
  }

  /**
   * Reset to Stage 0 (for testing or session reset)
   */
  reset(): void {
    this.currentStage = DisclosureStage.STAGE_0_ENTRY;
    this.activeDomain = null;

    for (const [name, entry] of this.tools) {
      if (entry.enabledAtStage === DisclosureStage.STAGE_0_ENTRY) {
        entry.tool.enable();
        const desc = entry.descriptions[DisclosureStage.STAGE_0_ENTRY];
        if (desc) entry.tool.update({ description: desc });
      } else {
        entry.tool.disable();
      }
    }
  }
}
