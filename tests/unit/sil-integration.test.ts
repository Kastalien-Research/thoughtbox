/**
 * Integration tests for Self-Improvement Loop tracking
 * SPEC: SPEC-automation.md, SPEC-persistence.md
 *
 * Verifies end-to-end flow: ImprovementTracker -> ThoughtEmitter -> ImprovementEventStore
 *
 * Run with: npx tsx tests/unit/sil-integration.test.ts
 */

import { tmpdir } from "os";
import { join } from "path";
import { mkdir, rm } from "fs/promises";
import {
  ImprovementTracker,
  ImprovementEventStore,
  ThoughtEmitter,
} from "../../src/observatory/index.js";

// =============================================================================
// Test Utilities
// =============================================================================

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

// =============================================================================
// Tests
// =============================================================================

async function runTests() {
  console.log("\n🧪 SIL Integration Tests\n");

  const testDir = join(tmpdir(), `sil-integration-test-${Date.now()}`);
  await mkdir(testDir, { recursive: true });

  try {
    // Test 1: Full iteration lifecycle emits all expected events
    await test("full iteration lifecycle emits all expected events", async () => {
      // Reset singletons for clean test
      ImprovementTracker.resetInstance();
      ThoughtEmitter.resetInstance();

      const store = new ImprovementEventStore({
        path: join(testDir, "test1.jsonl"),
        autoSubscribe: true,
      });
      await store.initialize();

      const tracker = ImprovementTracker.getInstance();

      // Simulate a complete SIL iteration
      tracker.startIteration({ source: "test" });
      tracker.trackDiscovery({ opportunitiesFound: 5 }, 0.1, true);
      tracker.trackFilter({ filtered: 3 }, 0.05, true);
      tracker.trackExperiment({ experimentsRun: 2 }, 0.3, true);
      tracker.trackEvaluation({ tier: "smoke", passRate: 1.0 }, 0.15, true);
      tracker.endIteration(true, { improvements: 1 });

      // Wait for batched writes
      await new Promise((resolve) => setTimeout(resolve, 200));
      await store.flush();

      const events = await store.listEvents({});

      // Should have: cycle_start, discovery, filter, experiment, evaluate, cycle_end
      assertEqual(events.length, 6, "Should have 6 events");

      const types = events.map((e) => e.type);
      assert(types.includes("cycle_start"), "Should have cycle_start");
      assert(types.includes("discovery"), "Should have discovery");
      assert(types.includes("filter"), "Should have filter");
      assert(types.includes("experiment"), "Should have experiment");
      assert(types.includes("evaluate"), "Should have evaluate");
      assert(types.includes("cycle_end"), "Should have cycle_end");

      store.unsubscribe();
      ImprovementTracker.resetInstance();
      ThoughtEmitter.resetInstance();
    });

    // Test 2: Iteration number increments correctly
    await test("iteration number increments correctly", async () => {
      ImprovementTracker.resetInstance();
      ThoughtEmitter.resetInstance();

      const store = new ImprovementEventStore({
        path: join(testDir, "test2.jsonl"),
        autoSubscribe: true,
      });
      await store.initialize();

      const tracker = ImprovementTracker.getInstance();

      // Run 3 iterations
      for (let i = 0; i < 3; i++) {
        tracker.startIteration({});
        tracker.endIteration(true, {});
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
      await store.flush();

      const cycleEndEvents = await store.listEvents({ type: "cycle_end" });
      assertEqual(cycleEndEvents.length, 3, "Should have 3 cycle_end events");

      // Iterations should be 1, 2, 3
      const iterations = cycleEndEvents.map((e) => e.iteration).sort((a, b) => a - b);
      assertEqual(iterations[0], 1, "First iteration should be 1");
      assertEqual(iterations[1], 2, "Second iteration should be 2");
      assertEqual(iterations[2], 3, "Third iteration should be 3");

      store.unsubscribe();
      ImprovementTracker.resetInstance();
      ThoughtEmitter.resetInstance();
    });

    // Test 3: Cost accumulation works correctly
    await test("cost accumulation works correctly", async () => {
      ImprovementTracker.resetInstance();
      ThoughtEmitter.resetInstance();

      const store = new ImprovementEventStore({
        path: join(testDir, "test3.jsonl"),
        autoSubscribe: true,
      });
      await store.initialize();

      const tracker = ImprovementTracker.getInstance();

      tracker.startIteration({});
      tracker.trackDiscovery({}, 0.10, true);
      tracker.trackFilter({}, 0.05, true);
      tracker.trackExperiment({}, 0.25, true);
      tracker.trackEvaluation({}, 0.10, true);
      tracker.endIteration(true, {});

      await new Promise((resolve) => setTimeout(resolve, 200));
      await store.flush();

      // Total cost should be 0.10 + 0.05 + 0.25 + 0.10 = 0.50
      assertEqual(tracker.getTotalCost(), 0.50, "Total cost should be $0.50");

      store.unsubscribe();
      ImprovementTracker.resetInstance();
      ThoughtEmitter.resetInstance();
    });

    // Test 4: Failed phases are recorded correctly
    await test("failed phases are recorded correctly", async () => {
      ImprovementTracker.resetInstance();
      ThoughtEmitter.resetInstance();

      const store = new ImprovementEventStore({
        path: join(testDir, "test4.jsonl"),
        autoSubscribe: true,
      });
      await store.initialize();

      const tracker = ImprovementTracker.getInstance();

      tracker.startIteration({});
      tracker.trackDiscovery({}, 0.1, true);
      tracker.trackFilter({}, 0.05, true);
      tracker.trackExperiment({}, 0.2, false); // Experiment failed
      tracker.trackEvaluation({}, 0.1, false); // Evaluation also failed
      tracker.endIteration(false, { reason: "experiment_failed" });

      await new Promise((resolve) => setTimeout(resolve, 200));
      await store.flush();

      const events = await store.listEvents({});

      const experimentEvent = events.find((e) => e.type === "experiment");
      assert(experimentEvent !== undefined, "Should have experiment event");
      assertEqual(experimentEvent!.success, false, "Experiment should be marked as failed");

      const cycleEndEvent = events.find((e) => e.type === "cycle_end");
      assert(cycleEndEvent !== undefined, "Should have cycle_end event");
      assertEqual(cycleEndEvent!.success, false, "Cycle should be marked as failed");

      store.unsubscribe();
      ImprovementTracker.resetInstance();
      ThoughtEmitter.resetInstance();
    });

    // Test 5: Metadata is preserved through the pipeline
    await test("metadata is preserved through the pipeline", async () => {
      ImprovementTracker.resetInstance();
      ThoughtEmitter.resetInstance();

      const store = new ImprovementEventStore({
        path: join(testDir, "test5.jsonl"),
        autoSubscribe: true,
      });
      await store.initialize();

      const tracker = ImprovementTracker.getInstance();

      tracker.startIteration({ source: "github_action", runId: "12345" });
      tracker.trackDiscovery(
        { opportunities: ["perf", "refactor"], count: 2 },
        0.1,
        true
      );
      tracker.endIteration(true, { changedFiles: ["src/foo.ts"] });

      await new Promise((resolve) => setTimeout(resolve, 200));
      await store.flush();

      const events = await store.listEvents({});

      const startEvent = events.find((e) => e.type === "cycle_start");
      assert(startEvent !== undefined, "Should have cycle_start event");
      assertEqual(startEvent!.metadata.source, "github_action", "Source should be preserved");
      assertEqual(startEvent!.metadata.runId, "12345", "Run ID should be preserved");

      const discoveryEvent = events.find((e) => e.type === "discovery");
      assert(discoveryEvent !== undefined, "Should have discovery event");
      assertEqual(discoveryEvent!.metadata.count, 2, "Count should be preserved");

      const endEvent = events.find((e) => e.type === "cycle_end");
      assert(endEvent !== undefined, "Should have cycle_end event");
      assert(
        Array.isArray(endEvent!.metadata.changedFiles),
        "Changed files should be array"
      );

      store.unsubscribe();
      ImprovementTracker.resetInstance();
      ThoughtEmitter.resetInstance();
    });

    // Test 6: Events persist across tracker reset (store survives)
    await test("events persist across tracker reset", async () => {
      ThoughtEmitter.resetInstance();

      const filePath = join(testDir, "test6.jsonl");

      // First session
      ImprovementTracker.resetInstance();
      const store1 = new ImprovementEventStore({
        path: filePath,
        autoSubscribe: true,
      });
      await store1.initialize();

      const tracker1 = ImprovementTracker.getInstance();
      tracker1.startIteration({ session: 1 });
      tracker1.endIteration(true, {});

      await new Promise((resolve) => setTimeout(resolve, 200));
      await store1.flush();
      store1.unsubscribe();

      // Second session (simulates restart)
      ImprovementTracker.resetInstance();
      ThoughtEmitter.resetInstance();

      const store2 = new ImprovementEventStore({
        path: filePath,
        autoSubscribe: true,
      });
      await store2.initialize();

      const tracker2 = ImprovementTracker.getInstance();
      tracker2.startIteration({ session: 2 });
      tracker2.endIteration(true, {});

      await new Promise((resolve) => setTimeout(resolve, 200));
      await store2.flush();

      // Should have events from both sessions
      const allEvents = await store2.listEvents({});
      const cycleEndEvents = allEvents.filter((e) => e.type === "cycle_end");

      assertEqual(cycleEndEvents.length, 2, "Should have 2 cycle_end events");

      store2.unsubscribe();
      ImprovementTracker.resetInstance();
      ThoughtEmitter.resetInstance();
    });

  } finally {
    // Cleanup
    await rm(testDir, { recursive: true, force: true });
  }

  console.log("\n✨ All SIL Integration tests complete\n");
}

// Run tests
runTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
