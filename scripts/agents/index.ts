/**
 * Agent Scripts
 *
 * Headless agent runners built on the Claude Agent SDK, plus the behavioral
 * contract verification (BCV) framework used to verify that agent surfaces
 * actually reason about their inputs.
 *
 * @module scripts/agents
 */

export * from "./behavioral-contracts.js";
export { parseFrontmatter, getCommonArgs, runAgentFile, agentPath } from "./run-agent-util.js";
