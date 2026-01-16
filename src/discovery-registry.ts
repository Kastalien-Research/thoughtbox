/**
 * @fileoverview Discovery Registry for Operation-Based Tool Discovery
 *
 * Extends SPEC-008's stage-based progressive disclosure with operation-based
 * tool discovery. When an agent calls specific operations on a "hub" tool,
 * specialized tools become visible.
 *
 * Works alongside ToolRegistry - discovery respects stage constraints.
 *
 * @module src/discovery-registry
 * @see SPEC-009
 */

import type { RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ToolRegistry, DisclosureStage } from "./tool-registry.js";

/**
 * Trigger definition for operation-based tool discovery
 */
export interface DiscoveryTrigger {
  /** Hub tool that triggers discovery (e.g., "session") */
  hubTool: string;

  /** Operation that triggers discovery (e.g., "analyze") */
  operation: string;

  /** Optional arg matching for conditional discovery */
  operationArgs?: Record<string, unknown>;

  /** Tools to enable when trigger fires */
  unlocksTools: string[];

  /** Human-readable description of what this discovery provides */
  description: string;

  /** Minimum stage required for this discovery to activate */
  requiredStage?: DisclosureStage;
}

/**
 * A tool that can be discovered through hub operations
 */
export interface DiscoverableTool {
  /** The registered tool object */
  tool: RegisteredTool;

  /** Triggers that can discover this tool */
  discoveredBy: DiscoveryTrigger[];

  /** Auto-hide after N milliseconds of non-use (optional) */
  autoHideAfterMs?: number;

  /** Last time this tool was used (for auto-hide) */
  lastUsedAt?: number;

  /** Stage-specific descriptions */
  descriptions: {
    /** Description when discovered and active */
    discovered: string;
    /** Description when hidden (if shown in listings) */
    hidden?: string;
  };
}

/**
 * Discovery notification for response augmentation
 */
export interface DiscoveryNotification {
  /** Tools that were newly discovered */
  newlyDiscovered: string[];

  /** Human-readable message about the discovery */
  message: string;
}

/**
 * Registry for managing operation-based tool discovery
 *
 * Works alongside ToolRegistry from SPEC-008. Discovery respects
 * stage constraints - a tool can only be discovered if its required
 * stage is active.
 */
export class DiscoveryRegistry {
  /** Map of hubTool:operation → triggers */
  private triggers = new Map<string, DiscoveryTrigger[]>();

  /** Map of tool name → discoverable tool definition */
  private discoverableTools = new Map<string, DiscoverableTool>();

  /** Set of currently discovered tool names */
  private discoveredTools = new Set<string>();

  /** Reference to stage-based tool registry */
  private toolRegistry: ToolRegistry;

  constructor(toolRegistry: ToolRegistry) {
    this.toolRegistry = toolRegistry;
  }

  /**
   * Register a trigger that unlocks tools when an operation is called
   */
  registerTrigger(trigger: DiscoveryTrigger): void {
    const key = this.getTriggerKey(trigger.hubTool, trigger.operation);
    const existing = this.triggers.get(key) || [];
    existing.push(trigger);
    this.triggers.set(key, existing);
  }

  /**
   * Register a tool that can be discovered through hub operations
   */
  registerDiscoverableTool(
    name: string,
    tool: RegisteredTool,
    discoveredBy: DiscoveryTrigger[],
    descriptions: DiscoverableTool["descriptions"],
    autoHideAfterMs?: number
  ): void {
    this.discoverableTools.set(name, {
      tool,
      discoveredBy,
      descriptions,
      autoHideAfterMs,
    });

    // Start disabled - will be enabled when discovered
    tool.disable();

    // Also register all triggers from discoveredBy
    for (const trigger of discoveredBy) {
      this.registerTrigger(trigger);
    }
  }

  /**
   * Called when a hub tool operation executes
   *
   * @param hubTool - Name of the hub tool (e.g., "session")
   * @param operation - Operation that was called (e.g., "analyze")
   * @param args - Arguments passed to the operation
   * @returns Discovery notification if tools were unlocked, null otherwise
   */
  onOperationCalled(
    hubTool: string,
    operation: string,
    args?: Record<string, unknown>
  ): DiscoveryNotification | null {
    const key = this.getTriggerKey(hubTool, operation);
    const triggers = this.triggers.get(key) || [];
    const newlyDiscovered: string[] = [];

    for (const trigger of triggers) {
      // Check stage constraint
      if (trigger.requiredStage) {
        const currentStage = this.toolRegistry.getCurrentStage();
        if (!this.stageAllows(trigger.requiredStage, currentStage)) {
          continue;
        }
      }

      // Check arg matching if specified
      if (trigger.operationArgs && args) {
        const matches = Object.entries(trigger.operationArgs).every(
          ([k, v]) => args[k] === v
        );
        if (!matches) continue;
      }

      // Enable each unlocked tool
      for (const toolName of trigger.unlocksTools) {
        if (!this.discoveredTools.has(toolName)) {
          const discoverable = this.discoverableTools.get(toolName);
          if (discoverable) {
            discoverable.tool.enable();
            discoverable.tool.update({
              description: discoverable.descriptions.discovered,
            });
            discoverable.lastUsedAt = Date.now();
            this.discoveredTools.add(toolName);
            newlyDiscovered.push(toolName);
          }
        }
      }
    }

    if (newlyDiscovered.length === 0) {
      return null;
    }

    return {
      newlyDiscovered,
      message: this.buildDiscoveryMessage(newlyDiscovered),
    };
  }

  /**
   * Mark a tool as used (for auto-hide tracking)
   */
  markToolUsed(name: string): void {
    const discoverable = this.discoverableTools.get(name);
    if (discoverable && this.discoveredTools.has(name)) {
      discoverable.lastUsedAt = Date.now();
    }
  }

  /**
   * Hide a discovered tool (agent no longer needs it)
   */
  hideTool(name: string): boolean {
    const discoverable = this.discoverableTools.get(name);
    if (discoverable && this.discoveredTools.has(name)) {
      discoverable.tool.disable();
      this.discoveredTools.delete(name);
      return true;
    }
    return false;
  }

  /**
   * Re-discover a hidden tool (without triggering operation)
   */
  showTool(name: string): boolean {
    const discoverable = this.discoverableTools.get(name);
    if (discoverable && !this.discoveredTools.has(name)) {
      // Check if any trigger's stage constraint is met
      const canShow = discoverable.discoveredBy.some((trigger) => {
        if (!trigger.requiredStage) return true;
        return this.stageAllows(
          trigger.requiredStage,
          this.toolRegistry.getCurrentStage()
        );
      });

      if (canShow) {
        discoverable.tool.enable();
        discoverable.tool.update({
          description: discoverable.descriptions.discovered,
        });
        discoverable.lastUsedAt = Date.now();
        this.discoveredTools.add(name);
        return true;
      }
    }
    return false;
  }

  /**
   * Get list of currently discovered tools
   */
  getDiscoveredTools(): string[] {
    return [...this.discoveredTools];
  }

  /**
   * Get list of all registered discoverable tools (discovered or not)
   */
  getAllDiscoverableTools(): string[] {
    return [...this.discoverableTools.keys()];
  }

  /**
   * Check if a tool is currently discovered
   */
  isDiscovered(name: string): boolean {
    return this.discoveredTools.has(name);
  }

  /**
   * Check if a tool is registered as discoverable
   */
  isDiscoverable(name: string): boolean {
    return this.discoverableTools.has(name);
  }

  /**
   * Get triggers for a hub tool operation
   */
  getTriggersFor(hubTool: string, operation: string): DiscoveryTrigger[] {
    const key = this.getTriggerKey(hubTool, operation);
    return this.triggers.get(key) || [];
  }

  /**
   * Process auto-hide for tools that haven't been used recently
   * Call this periodically (e.g., every minute)
   */
  processAutoHide(): string[] {
    const now = Date.now();
    const hidden: string[] = [];

    for (const [name, discoverable] of this.discoverableTools) {
      if (
        discoverable.autoHideAfterMs &&
        discoverable.lastUsedAt &&
        this.discoveredTools.has(name)
      ) {
        const elapsed = now - discoverable.lastUsedAt;
        if (elapsed > discoverable.autoHideAfterMs) {
          this.hideTool(name);
          hidden.push(name);
        }
      }
    }

    return hidden;
  }

  /**
   * Reset all discoveries (for testing or session reset)
   */
  reset(): void {
    for (const name of this.discoveredTools) {
      const discoverable = this.discoverableTools.get(name);
      if (discoverable) {
        discoverable.tool.disable();
        discoverable.lastUsedAt = undefined;
      }
    }
    this.discoveredTools.clear();
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  private getTriggerKey(hubTool: string, operation: string): string {
    return `${hubTool}:${operation}`;
  }

  private stageAllows(
    requiredStage: DisclosureStage,
    currentStage: DisclosureStage
  ): boolean {
    const stageOrder = [
      DisclosureStage.STAGE_0_ENTRY,
      DisclosureStage.STAGE_1_INIT_COMPLETE,
      DisclosureStage.STAGE_2_CIPHER_LOADED,
      DisclosureStage.STAGE_3_DOMAIN_ACTIVE,
    ];

    const requiredIdx = stageOrder.indexOf(requiredStage);
    const currentIdx = stageOrder.indexOf(currentStage);

    return currentIdx >= requiredIdx;
  }

  private buildDiscoveryMessage(discovered: string[]): string {
    if (discovered.length === 1) {
      return `🔓 Tool unlocked: ${discovered[0]}`;
    }
    return `🔓 Tools unlocked: ${discovered.join(", ")}`;
  }
}
