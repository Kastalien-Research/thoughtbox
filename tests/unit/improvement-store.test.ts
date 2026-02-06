/**
 * Unit tests for ImprovementEventStore
 * SPEC: SPEC-persistence.md
 *
 * Verifies JSONL persistence, filtering, and summarization.
 *
 * Run with: npx tsx tests/unit/improvement-store.test.ts
 */

import { tmpdir } from "os";
import { join } from "path";
import { mkdir, rm } from "fs/promises";
import {
  ImprovementEventStore,
  type ImprovementEvent,
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
// Test Data
// =============================================================================

function createTestEvent(overrides: Partial<ImprovementEvent> = {}): ImprovementEvent {
  return {
    timestamp: new Date().toISOString(),
    iteration: 1,
    type: "cycle_end",
    phase: "completion",
    cost: 0.5,
    success: true,
    metadata: {},
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

async function runTests() {
  console.log("\n🧪 ImprovementEventStore Tests\n");

  const testDir = join(tmpdir(), `improvement-store-test-${Date.now()}`);
  await mkdir(testDir, { recursive: true });

  try {
    // Test 1: recordEvent persists to JSONL file
    await test("recordEvent persists to JSONL file", async () => {
      const store = new ImprovementEventStore({
        path: join(testDir, "test1.jsonl"),
      });
      await store.initialize();

      const event = createTestEvent({ iteration: 1, cost: 0.25 });
      await store.recordEvent(event);

      const events = await store.listEvents({});
      assertEqual(events.length, 1, "Should have 1 event");
      assertEqual(events[0].iteration, 1, "Iteration should match");
      assertEqual(events[0].cost, 0.25, "Cost should match");
    });

    // Test 2: listEvents filters by type
    await test("listEvents filters by type", async () => {
      const store = new ImprovementEventStore({
        path: join(testDir, "test2.jsonl"),
      });
      await store.initialize();

      await store.recordEvent(createTestEvent({ type: "cycle_start", iteration: 1 }));
      await store.recordEvent(createTestEvent({ type: "discovery", iteration: 1 }));
      await store.recordEvent(createTestEvent({ type: "cycle_end", iteration: 1 }));

      const cycleEndEvents = await store.listEvents({ type: "cycle_end" });
      assertEqual(cycleEndEvents.length, 1, "Should have 1 cycle_end event");
      assertEqual(cycleEndEvents[0].type, "cycle_end", "Type should be cycle_end");

      const discoveryEvents = await store.listEvents({ type: "discovery" });
      assertEqual(discoveryEvents.length, 1, "Should have 1 discovery event");
    });

    // Test 3: listEvents filters by iteration
    await test("listEvents filters by iteration", async () => {
      const store = new ImprovementEventStore({
        path: join(testDir, "test3.jsonl"),
      });
      await store.initialize();

      await store.recordEvent(createTestEvent({ iteration: 1, type: "cycle_end" }));
      await store.recordEvent(createTestEvent({ iteration: 2, type: "cycle_end" }));
      await store.recordEvent(createTestEvent({ iteration: 3, type: "cycle_end" }));

      const iter2Events = await store.listEvents({ iteration: 2 });
      assertEqual(iter2Events.length, 1, "Should have 1 event for iteration 2");
      assertEqual(iter2Events[0].iteration, 2, "Iteration should be 2");
    });

    // Test 4: summarize computes correct metrics
    await test("summarize computes correct metrics", async () => {
      const store = new ImprovementEventStore({
        path: join(testDir, "test4.jsonl"),
      });
      await store.initialize();

      // 3 iterations: 2 success, 1 failure
      await store.recordEvent(createTestEvent({ iteration: 1, success: true, cost: 1.0 }));
      await store.recordEvent(createTestEvent({ iteration: 2, success: true, cost: 2.0 }));
      await store.recordEvent(createTestEvent({ iteration: 3, success: false, cost: 0.5 }));

      const summary = await store.summarize({});
      assertEqual(summary.totalIterations, 3, "Should have 3 iterations");
      assertEqual(summary.successfulIterations, 2, "Should have 2 successful");
      assertEqual(summary.failedIterations, 1, "Should have 1 failed");
      assertEqual(summary.totalCost, 3.5, "Total cost should be 3.5");
    });

    // Test 5: data survives restart (persistence)
    await test("data survives restart (persistence)", async () => {
      const filePath = join(testDir, "test5.jsonl");

      // Write with first store instance
      const store1 = new ImprovementEventStore({ path: filePath });
      await store1.initialize();
      await store1.recordEvent(createTestEvent({ iteration: 1, metadata: { key: "value1" } }));
      await store1.recordEvent(createTestEvent({ iteration: 2, metadata: { key: "value2" } }));

      // Read with new store instance (simulates restart)
      const store2 = new ImprovementEventStore({ path: filePath });
      await store2.initialize();
      const events = await store2.listEvents({});

      assertEqual(events.length, 2, "Should have 2 events after restart");
      assertEqual(events[0].iteration, 1, "First event iteration should be 1");
      assertEqual(events[1].iteration, 2, "Second event iteration should be 2");
    });

    // Test 6: auto-subscribe captures emitted events
    await test("auto-subscribe captures emitted events", async () => {
      // Reset emitter to ensure clean state
      ThoughtEmitter.resetInstance();

      const store = new ImprovementEventStore({
        path: join(testDir, "test6.jsonl"),
        autoSubscribe: true,
      });
      await store.initialize();

      // Emit an event via the emitter
      const emitter = ThoughtEmitter.getInstance();
      const event = createTestEvent({ iteration: 99, type: "discovery" });
      emitter.emitImprovementEvent(event);

      // Wait for batched write
      await new Promise((resolve) => setTimeout(resolve, 200));
      await store.flush();

      const events = await store.listEvents({});
      assert(events.length >= 1, "Should have at least 1 event");
      const found = events.find((e) => e.iteration === 99);
      assert(found !== undefined, "Should find the emitted event");

      store.unsubscribe();
      ThoughtEmitter.resetInstance();
    });

  } finally {
    // Cleanup
    await rm(testDir, { recursive: true, force: true });
  }

  console.log("\n✨ All ImprovementEventStore tests complete\n");
}

// Run tests
runTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
