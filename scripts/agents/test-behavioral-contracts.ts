#!/usr/bin/env npx tsx
/**
 * Behavioral Contract Tests
 *
 * Runs the behavioral contract verification suite (VARIANCE, CONTENT_COUPLED,
 * LLM_JUDGES) against a LIVE agent surface: the devils-advocate agent
 * definition executed through the shared run-agent harness.
 *
 * These tests FAIL if the agent surface returns hardcoded or input-ignoring
 * output instead of actually reasoning about the finding it was given.
 *
 * Usage:
 *   npx tsx scripts/agents/test-behavioral-contracts.ts [--budget 1]
 *   npx tsx scripts/agents/test-behavioral-contracts.ts --variance-only
 */

import {
  runBehavioralVerification,
  formatVerificationReport,
} from "./behavioral-contracts.js";
import { agentPath, runAgentFile } from "./run-agent-util.js";

// ============================================================================
// Test Inputs
// ============================================================================

interface Finding {
  id: string;
  type: string;
  description: string;
  severity: string;
  source: string;
}

// Two very different findings - must produce different assessments
const performanceFinding: Finding = {
  id: "perf-001",
  type: "performance",
  description:
    "API endpoint /users takes 5 seconds to respond due to N+1 queries loading user posts without eager loading",
  severity: "high",
  source: "src/controllers/users.ts:45",
};

const securityFinding: Finding = {
  id: "sec-001",
  type: "security",
  description:
    "SQL injection vulnerability in search endpoint - user input passed directly to raw query without sanitization",
  severity: "critical",
  source: "src/controllers/search.ts:23",
};

function buildPrompt(finding: Finding): string {
  return [
    `Assess the following ${finding.type} finding (id: ${finding.id}, severity: ${finding.severity}, source: ${finding.source}).`,
    ``,
    `Finding: ${finding.description}`,
    ``,
    `Respond with a short adversarial assessment: restate the specific finding,`,
    `rate feasibility of a fix (1-10) and risk of the fix (1-10), and explain WHY`,
    `those ratings apply to THIS finding. Do not read or modify any files; reason`,
    `from the finding text alone.`,
  ].join("\n");
}

function budgetArg(): number | undefined {
  const i = process.argv.indexOf("--budget");
  if (i < 0 || i + 1 >= process.argv.length) return undefined;
  const n = Number(process.argv[i + 1]);
  return isNaN(n) ? undefined : n;
}

// Live surface under test: the devils-advocate agent definition run through
// the shared harness (scripts/agents/run-agent-util.ts).
const assess = async (finding: Finding): Promise<string> => {
  return runAgentFile({
    agentFile: agentPath("devils-advocate"),
    prompt: buildPrompt(finding),
    budget: budgetArg(),
  });
};

// ============================================================================
// Test Runner
// ============================================================================

async function runTests() {
  console.log("=== Behavioral Contract Tests (devils-advocate via run-agent harness) ===\n");

  console.log("Test Inputs:");
  console.log(`  Input 1: ${performanceFinding.type} - ${performanceFinding.id}`);
  console.log(`  Input 2: ${securityFinding.type} - ${securityFinding.id}`);
  console.log("");

  try {
    const report = await runBehavioralVerification<Finding, string>(
      "devils-advocate.assess",
      assess,
      {
        input1: performanceFinding,
        input2: securityFinding,
        marker: performanceFinding.description, // Must reference this
      },
      // Field to check for variance: the assessment text itself
      (text) => text.trim(),
      // All text for content coupling check
      (text) => text
    );

    console.log("\n" + formatVerificationReport(report));

    // Exit with appropriate code
    if (report.allPassed) {
      console.log("\n ALL BEHAVIORAL CONTRACTS PASSED");
      process.exit(0);
    } else {
      console.log("\n BEHAVIORAL CONTRACTS FAILED");
      console.log(
        "\nThis means the agent is not actually reasoning about inputs."
      );
      console.log("Check for hardcoded values or input-ignoring implementations.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\nTest execution failed:", error);
    process.exit(1);
  }
}

// ============================================================================
// Individual Contract Tests (for debugging)
// ============================================================================

async function runVarianceOnly() {
  console.log("=== VARIANCE Test Only ===\n");

  const result1 = await assess(performanceFinding);
  console.log("\nResult 1 (preview):", result1.substring(0, 300));

  const result2 = await assess(securityFinding);
  console.log("\nResult 2 (preview):", result2.substring(0, 300));

  if (result1.trim() === result2.trim()) {
    console.log("\n VARIANCE FAILED: Identical assessments for different inputs!");
    console.log("This is the exact bug that BCV is designed to catch.");
    process.exit(1);
  } else {
    console.log("\n VARIANCE PASSED: Assessments differ as expected.");
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

const args = process.argv.slice(2);

if (args.includes("--variance-only")) {
  runVarianceOnly();
} else {
  runTests();
}
