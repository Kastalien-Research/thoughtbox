#!/usr/bin/env npx tsx
/**
 * Behavioral Contract Tests for SIL Agents
 *
 * Tests that the improvement reasoner (SIL-006) actually reasons,
 * not just returns hardcoded values.
 *
 * Usage:
 *   npx tsx scripts/agents/test-behavioral-contracts.ts
 *
 * These tests will FAIL if the agent returns hardcoded values.
 */

import { analyzeDiscovery } from "./sil-006-improvement-reasoner.js";
import {
  runBehavioralVerification,
  formatVerificationReport,
} from "./behavioral-contracts.js";
import { Discovery, ImprovementPlan } from "./types.js";

// ============================================================================
// Test Inputs
// ============================================================================

// Two very different discoveries - must produce different outputs
const performanceDiscovery: Discovery = {
  id: "perf-001",
  type: "performance",
  description:
    "API endpoint /users takes 5 seconds to respond due to N+1 queries loading user posts without eager loading",
  severity: "high",
  source: "src/controllers/users.ts:45",
};

const securityDiscovery: Discovery = {
  id: "sec-001",
  type: "security",
  description:
    "SQL injection vulnerability in search endpoint - user input passed directly to raw query without sanitization",
  severity: "critical",
  source: "src/controllers/search.ts:23",
};

// ============================================================================
// Test Runner
// ============================================================================

async function runTests() {
  console.log("=== Behavioral Contract Tests for SIL-006 ===\n");

  // Create a wrapper function that matches the contract signature
  const analyzeWrapper = async (discovery: Discovery): Promise<ImprovementPlan> => {
    return analyzeDiscovery(discovery, {
      verbose: false,
      maxTurns: 30, // Limit turns for testing
    });
  };

  console.log("Test Inputs:");
  console.log(`  Input 1: ${performanceDiscovery.type} - ${performanceDiscovery.id}`);
  console.log(`  Input 2: ${securityDiscovery.type} - ${securityDiscovery.id}`);
  console.log("");

  try {
    const report = await runBehavioralVerification<Discovery, ImprovementPlan>(
      "ImprovementReasoner.analyze",
      analyzeWrapper,
      {
        input1: performanceDiscovery,
        input2: securityDiscovery,
        marker: performanceDiscovery.description, // Must reference this
      },
      // Extract the assessment field to check for variance
      (plan) => ({
        feasibility: plan.approaches[0]?.assessment.feasibility,
        risk: plan.approaches[0]?.assessment.risk,
        recommendedApproach: plan.recommendedApproach,
      }),
      // Extract all text for content coupling check
      (plan) =>
        JSON.stringify(plan) +
        plan.approaches.map((a) => a.assessment.rationale).join(" ")
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

  const result1 = await analyzeDiscovery(performanceDiscovery, { verbose: true });
  console.log("\nResult 1:", JSON.stringify(result1.approaches[0]?.assessment, null, 2));

  const result2 = await analyzeDiscovery(securityDiscovery, { verbose: true });
  console.log("\nResult 2:", JSON.stringify(result2.approaches[0]?.assessment, null, 2));

  const assess1 = result1.approaches[0]?.assessment;
  const assess2 = result2.approaches[0]?.assessment;

  if (
    assess1.feasibility === assess2.feasibility &&
    assess1.risk === assess2.risk
  ) {
    console.log("\n VARIANCE FAILED: Identical assessments for different inputs!");
    console.log("This is the exact bug that BCV is designed to catch.");
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
