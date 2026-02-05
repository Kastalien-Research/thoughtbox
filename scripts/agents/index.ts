/**
 * SIL Agentic Scripts
 *
 * External agents that implement the Self-Improvement Loop specifications.
 * These agents connect to Thoughtbox via MCP using the Claude Agent SDK,
 * rather than being embedded in the Thoughtbox server.
 *
 * @module scripts/agents
 */

// Types and shared utilities
export * from "./types.js";
export * from "./behavioral-contracts.js";

// SIL Agents
export { analyzeDiscovery, type AnalysisResult } from "./sil-006-improvement-reasoner.js";
export { runImprovementLoop, type LoopConfig } from "./sil-010-main-loop-orchestrator.js";
export { extractLearnings, updateClaudeMd, type LearningExtractionResult } from "./sil-012-claude-md-updater.js";
