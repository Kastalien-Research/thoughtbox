#!/usr/bin/env tsx
/**
 * Seed probe: verify a thought round-trips through real Supabase persistence.
 *
 * Drives an agent to record a thought carrying a unique marker via
 * `thoughtbox_execute`, then retrieve it back. Asserts the run completed,
 * exercised execute, and the marker survives the round-trip.
 *
 * Run: npx tsx scripts/probes/thought-roundtrip.probe.ts
 */

import { runProbe, reportProbe } from "./harness.js";

const marker = `probe-roundtrip-${Date.now()}`;

const result = await runProbe({
  name: "thought-roundtrip",
  maxTurns: 12,
  prompt: [
    "You are connected to the Thoughtbox MCP server (Code Mode).",
    `Using thoughtbox_execute and the tb SDK, record a thought whose content`,
    `includes the exact marker string "${marker}".`,
    "Then retrieve or search your recorded thoughts to confirm it persisted.",
    `Report back the marker and the thought's id, and state clearly whether`,
    "the round-trip succeeded.",
  ].join(" "),
  assert: (r) => {
    if (!r.completed) throw new Error("agent did not complete");
    const usedExecute = r.toolCalls.some((t) => t.tool.includes("thoughtbox_execute"));
    if (!usedExecute) throw new Error("agent never called thoughtbox_execute");
    if (!r.finalText.includes(marker)) {
      throw new Error("marker not present in final report — round-trip unverified");
    }
  },
});

reportProbe(result);
process.exit(result.passed ? 0 : 1);
