#!/usr/bin/env tsx
/**
 * Seed probe: confirm the live Code Mode surface is reachable.
 *
 * Drives an agent to discover the operation catalog via `thoughtbox_search`
 * and report what it finds. Asserts the run completed and actually exercised
 * a Thoughtbox tool (which only succeeds if the MCP connection is live).
 *
 * Run: npx tsx scripts/probes/surface.probe.ts
 */

import { runProbe, reportProbe } from "./harness.js";

const result = await runProbe({
  name: "surface",
  maxTurns: 8,
  prompt: [
    "You are connected to the Thoughtbox MCP server (Code Mode).",
    "Use thoughtbox_search to discover what operation categories exist,",
    "then briefly list the categories you found.",
    "Confirm whether thoughtbox_search and thoughtbox_execute are available to you.",
  ].join(" "),
  assert: (r) => {
    if (!r.completed) throw new Error("agent did not complete");
    const usedThoughtbox = r.toolCalls.some((t) => t.tool.includes("thoughtbox"));
    if (!usedThoughtbox) throw new Error("agent never called a Thoughtbox tool");
  },
});

reportProbe(result);
process.exit(result.passed ? 0 : 1);
