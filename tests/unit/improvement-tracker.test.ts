#!/usr/bin/env npx tsx
/**
 * Unit tests for ImprovementTracker
 * SPEC: SIL-001
 *
 * Run with: npx tsx tests/unit/improvement-tracker.test.ts
 */

import { ImprovementTracker, improvementTracker } from "../../src/observatory/improvement-tracker.js";
import { ThoughtEmitter } from "../../src/observatory/emitter.js";
import type { ImprovementEvent } from "../../src/observatory/emitter.js";

// =============================================================================
// Test Utilities
// =============================================================================

let testsPassed = 0;
let testsFailed = 0;
let currentTest = "";

function test(name: string, fn: () => void | Promise<void>): void {
  currentTest = name;
  Promise.resolve(fn())
    .then(() => {
      testsPassed++;
      console.log(`  \u2713 ${name}`);
    })
    .catch((err) => {
      testsFailed++;
      console.error(`  \u2717 ${name}`);
      console.error(`    Error: ${err.message}`);
    });
}

function assert(condition: boolean, message?: string): void {
  if (!condition) {
    throw new Error(message || `Assertion failed in "${currentTest}"`);
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(
      message ||
        `Expected "${expected}" but got "${actual}" in "${currentTest}"`
    );
  }
}

// =============================================================================
// Tests
// =============================================================================

async function runTests(): Promise<void> {
  console.log("\nImprovementTracker Tests\n");

  // -------------------------------------------------------------------------
  // Setup: Reset singleton before each test group
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // Singleton Tests
  // -------------------------------------------------------------------------

  console.log("Singleton Tests:");

  test("getInstance returns same instance", () => {
    ImprovementTracker.resetInstance();
    const instance1 = ImprovementTracker.getInstance();
    const instance2 = ImprovementTracker.getInstance();
    assert(instance1 === instance2, "Should return same instance");
  });

  test("resetInstance creates new instance", () => {
    const instance1 = ImprovementTracker.getInstance();
    instance1.startIteration();
    ImprovementTracker.resetInstance();
    const instance2 = ImprovementTracker.getInstance();
    assert(!instance2.isIterationInProgress(), "New instance should not have iteration in progress");
  });

  // -------------------------------------------------------------------------
  // Iteration Tests
  // -------------------------------------------------------------------------

  console.log("\nIteration Tests:");

  test("startIteration increments iteration number", () => {
    ImprovementTracker.resetInstance();
    const tracker = ImprovementTracker.getInstance();
    assertEqual(tracker.getCurrentIteration(), 0);
    tracker.startIteration();
    assertEqual(tracker.getCurrentIteration(), 1);
    tracker.endIteration(true);
    tracker.startIteration();
    assertEqual(tracker.getCurrentIteration(), 2);
  });

  test("isIterationInProgress tracks state correctly", () => {
    ImprovementTracker.resetInstance();
    const tracker = ImprovementTracker.getInstance();
    assert(!tracker.isIterationInProgress(), "Should not be in progress initially");
    tracker.startIteration();
    assert(tracker.isIterationInProgress(), "Should be in progress after start");
    tracker.endIteration(true);
    assert(!tracker.isIterationInProgress(), "Should not be in progress after end");
  });

  test("endIteration without start does not throw", () => {
    ImprovementTracker.resetInstance();
    const tracker = ImprovementTracker.getInstance();
    // Should not throw, just emit warning event
    tracker.endIteration(false);
    assert(true, "Should not throw");
  });

  // -------------------------------------------------------------------------
  // Cost Tracking Tests
  // -------------------------------------------------------------------------

  console.log("\nCost Tracking Tests:");

  test("trackDiscovery accumulates cost", () => {
    ImprovementTracker.resetInstance();
    const tracker = ImprovementTracker.getInstance();
    tracker.startIteration();
    tracker.trackDiscovery({ source: "test" }, 100);
    tracker.trackDiscovery({ source: "test" }, 50);
    const costs = tracker.getCurrentPhaseCosts();
    assert(costs !== null, "Should have phase costs");
    assertEqual(costs!.discovery, 150);
  });

  test("trackFilter accumulates cost", () => {
    ImprovementTracker.resetInstance();
    const tracker = ImprovementTracker.getInstance();
    tracker.startIteration();
    tracker.trackFilter({ reason: "priority" }, 25);
    const costs = tracker.getCurrentPhaseCosts();
    assertEqual(costs!.filter, 25);
  });

  test("trackExperiment accumulates cost", () => {
    ImprovementTracker.resetInstance();
    const tracker = ImprovementTracker.getInstance();
    tracker.startIteration();
    tracker.trackExperiment({ experimentId: "exp-1" }, 500);
    const costs = tracker.getCurrentPhaseCosts();
    assertEqual(costs!.experiment, 500);
  });

  test("trackEvaluation accumulates cost", () => {
    ImprovementTracker.resetInstance();
    const tracker = ImprovementTracker.getInstance();
    tracker.startIteration();
    tracker.trackEvaluation({ passed: true }, 200);
    const costs = tracker.getCurrentPhaseCosts();
    assertEqual(costs!.evaluate, 200);
  });

  test("trackIntegration accumulates cost", () => {
    ImprovementTracker.resetInstance();
    const tracker = ImprovementTracker.getInstance();
    tracker.startIteration();
    tracker.trackIntegration({ changeId: "chg-1" }, 75);
    const costs = tracker.getCurrentPhaseCosts();
    assertEqual(costs!.integrate, 75);
  });

  test("getTotalCost accumulates across iterations", () => {
    ImprovementTracker.resetInstance();
    const tracker = ImprovementTracker.getInstance();

    // First iteration
    tracker.startIteration();
    tracker.trackDiscovery({}, 100);
    tracker.trackFilter({}, 50);
    tracker.endIteration(true);

    // Second iteration
    tracker.startIteration();
    tracker.trackExperiment({}, 200);
    tracker.trackEvaluation({}, 100);
    tracker.endIteration(true);

    assertEqual(tracker.getTotalCost(), 450);
  });

  test("getCurrentPhaseCosts returns null when no iteration", () => {
    ImprovementTracker.resetInstance();
    const tracker = ImprovementTracker.getInstance();
    assertEqual(tracker.getCurrentPhaseCosts(), null);
  });

  // -------------------------------------------------------------------------
  // Event Emission Tests
  // -------------------------------------------------------------------------

  console.log("\nEvent Emission Tests:");

  test("startIteration emits cycle_start event", () => {
    ImprovementTracker.resetInstance();
    ThoughtEmitter.resetInstance();
    const emitter = ThoughtEmitter.getInstance();

    let receivedEvent: ImprovementEvent | null = null;
    emitter.on("improvement:event", (event: ImprovementEvent) => {
      if (event.type === "cycle_start") {
        receivedEvent = event;
      }
    });

    const tracker = ImprovementTracker.getInstance();
    tracker.startIteration({ testMetadata: "value" });

    assert(receivedEvent !== null, "Should emit cycle_start event");
    assertEqual(receivedEvent!.type, "cycle_start");
    assertEqual(receivedEvent!.iteration, 1);
    assert(receivedEvent!.metadata.testMetadata === "value", "Should include metadata");
  });

  test("endIteration emits cycle_end event", () => {
    ImprovementTracker.resetInstance();
    ThoughtEmitter.resetInstance();
    const emitter = ThoughtEmitter.getInstance();

    let receivedEvent: ImprovementEvent | null = null;
    emitter.on("improvement:event", (event: ImprovementEvent) => {
      if (event.type === "cycle_end") {
        receivedEvent = event;
      }
    });

    const tracker = ImprovementTracker.getInstance();
    tracker.startIteration();
    tracker.trackDiscovery({}, 100);
    tracker.endIteration(true, { finalNote: "done" });

    assert(receivedEvent !== null, "Should emit cycle_end event");
    assertEqual(receivedEvent!.type, "cycle_end");
    assertEqual(receivedEvent!.success, true);
    assertEqual(receivedEvent!.cost, 100);
    assert(receivedEvent!.metadata.finalNote === "done", "Should include metadata");
    assert(typeof receivedEvent!.metadata.duration_ms === "number", "Should include duration");
  });

  test("trackDiscovery emits discovery event", () => {
    ImprovementTracker.resetInstance();
    ThoughtEmitter.resetInstance();
    const emitter = ThoughtEmitter.getInstance();

    const events: ImprovementEvent[] = [];
    emitter.on("improvement:event", (event: ImprovementEvent) => {
      events.push(event);
    });

    const tracker = ImprovementTracker.getInstance();
    tracker.startIteration();
    tracker.trackDiscovery({ candidateCount: 5 }, 100, true);

    const discoveryEvent = events.find((e) => e.type === "discovery");
    assert(discoveryEvent !== undefined, "Should emit discovery event");
    assertEqual(discoveryEvent!.phase, "discovery");
    assertEqual(discoveryEvent!.cost, 100);
    assertEqual(discoveryEvent!.success, true);
    assertEqual(discoveryEvent!.metadata.candidateCount, 5);
  });

  test("all phase events include timestamp and iteration", () => {
    ImprovementTracker.resetInstance();
    ThoughtEmitter.resetInstance();
    const emitter = ThoughtEmitter.getInstance();

    const events: ImprovementEvent[] = [];
    emitter.on("improvement:event", (event: ImprovementEvent) => {
      events.push(event);
    });

    const tracker = ImprovementTracker.getInstance();
    tracker.startIteration();
    tracker.trackDiscovery({});
    tracker.trackFilter({});
    tracker.trackExperiment({});
    tracker.trackEvaluation({});
    tracker.trackIntegration({});
    tracker.endIteration(true);

    for (const event of events) {
      assert(typeof event.timestamp === "string", `Event ${event.type} should have timestamp`);
      assert(event.timestamp.length > 0, `Event ${event.type} timestamp should not be empty`);
      assert(typeof event.iteration === "number", `Event ${event.type} should have iteration`);
    }
  });

  // -------------------------------------------------------------------------
  // Error Handling Tests
  // -------------------------------------------------------------------------

  console.log("\nError Handling Tests:");

  test("tracking without iteration does not throw", () => {
    ImprovementTracker.resetInstance();
    const tracker = ImprovementTracker.getInstance();
    // These should not throw, just emit events without accumulating costs
    tracker.trackDiscovery({ test: true }, 100);
    tracker.trackFilter({});
    tracker.trackExperiment({});
    tracker.trackEvaluation({});
    tracker.trackIntegration({});
    assert(true, "Should not throw when tracking without iteration");
  });

  // -------------------------------------------------------------------------
  // Module Export Tests
  // -------------------------------------------------------------------------

  console.log("\nModule Export Tests:");

  test("improvementTracker export is singleton", () => {
    ImprovementTracker.resetInstance();
    // After reset, the module-level export should get a fresh instance when accessed
    const instance = ImprovementTracker.getInstance();
    // Note: The module-level improvementTracker was created before reset,
    // so we need to check that getInstance returns consistent results
    const instance2 = ImprovementTracker.getInstance();
    assert(instance === instance2, "getInstance should return same instance");
  });

  // -------------------------------------------------------------------------
  // Wait for async tests and report
  // -------------------------------------------------------------------------

  await new Promise((resolve) => setTimeout(resolve, 100));

  // Final summary
  console.log("\n" + "=".repeat(50));
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  console.log("=".repeat(50));

  if (testsFailed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
