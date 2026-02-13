/**
 * Unit tests for OnlineMonitor (Layer 5)
 *
 * Run with: npx tsx tests/unit/online-monitor.test.ts
 */

import { EventEmitter } from "events";
import { OnlineMonitor } from "../../src/evaluation/online-monitor.js";
import type { LangSmithConfig, MonitorConfig } from "../../src/evaluation/types.js";

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`\u2705 ${name}`);
  } catch (error) {
    console.error(`\u274c ${name}`);
    console.error(`   ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// =============================================================================
// Test Helpers
// =============================================================================

function createConfig(): LangSmithConfig {
  return {
    apiKey: "test-key",
    apiUrl: "https://api.smith.langchain.com",
    project: "test-project",
  };
}

function createMockClient(overrides?: {
  readRun?: (runId: string) => Promise<any>;
  createFeedback?: (runId: string, key: string, opts: any) => Promise<any>;
}) {
  const feedbackCalls: Array<{ runId: string; key: string; score: number }> = [];
  return {
    client: {
      readRun: overrides?.readRun ?? (async (runId: string) => ({
        id: runId,
        name: `session:test-session`,
        inputs: { sessionId: "test-session" },
        outputs: {
          finalThoughtCount: 10,
          trackedThoughtCount: 8,
        },
        extra: {
          metadata: { branchCount: 2, revisionCount: 1 },
        },
      })),
      createFeedback: overrides?.createFeedback ?? (async (runId: string, key: string, opts: any) => {
        feedbackCalls.push({ runId, key, score: opts.score });
        return {};
      }),
    } as any,
    feedbackCalls,
  };
}

function createMockTraceListener(sessionRunMap: Record<string, string> = { "test-session": "run-123" }) {
  return {
    getSessionRunId: (sessionId: string) => sessionRunMap[sessionId],
  } as any;
}

/**
 * Create a minimal ThoughtEmitter-compatible emitter for testing.
 * Uses a plain EventEmitter with the same API surface.
 */
function createTestEmitter() {
  const emitter = new EventEmitter() as any;
  emitter.setMaxListeners(100);
  emitter.emitMonitoringAlert = (data: any) => {
    emitter.emit("monitoring:alert", data);
  };
  return emitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// Tests
// =============================================================================

async function runTests() {
  console.log("\n\ud83e\uddea OnlineMonitor Tests\n");

  // -------------------------------------------------------------------------
  // Filtering tests
  // -------------------------------------------------------------------------

  await test("Sessions with < 5 thoughts are NOT scored", async () => {
    const { client, feedbackCalls } = createMockClient();
    const traceListener = createMockTraceListener();
    const emitter = createTestEmitter();

    const monitor = new OnlineMonitor(createConfig(), client, {
      traceListener,
      monitorConfig: { minThoughts: 5 },
    });
    monitor.attach(emitter);

    // Emit session events with only 3 thoughts (below threshold)
    emitter.emit("session:started", {
      session: { id: "low-session", tags: [] },
    });
    emitter.emit("session:ended", {
      sessionId: "low-session",
      finalThoughtCount: 3,
    });

    // Wait for any potential delayed scoring
    await sleep(4000);

    assertEqual(feedbackCalls.length, 0, "No feedback should be created for low-thought session");
    assertEqual(monitor.scoredSessionCount, 0, "No sessions should be scored");

    monitor.detach(emitter);
  });

  await test("Sessions with >= 5 thoughts ARE scored", async () => {
    const { client, feedbackCalls } = createMockClient();
    const traceListener = createMockTraceListener({ "scored-session": "run-456" });
    const emitter = createTestEmitter();

    const monitor = new OnlineMonitor(createConfig(), client, {
      traceListener,
      monitorConfig: { minThoughts: 5 },
    });
    monitor.attach(emitter);

    emitter.emit("session:started", {
      session: { id: "scored-session", tags: [] },
    });
    emitter.emit("session:ended", {
      sessionId: "scored-session",
      finalThoughtCount: 10,
    });

    // Wait for 3s delay + scoring
    await sleep(4500);

    assert(feedbackCalls.length > 0, "Feedback should be created for scored session");
    assertEqual(monitor.scoredSessionCount, 1, "One session should be scored");

    monitor.detach(emitter);
  });

  await test("Tagged sessions are ALWAYS scored (even 1 thought)", async () => {
    const { client, feedbackCalls } = createMockClient();
    const traceListener = createMockTraceListener({ "tagged-session": "run-789" });
    const emitter = createTestEmitter();

    const monitor = new OnlineMonitor(createConfig(), client, {
      traceListener,
      monitorConfig: { minThoughts: 5, alwaysScoreTags: ["eval", "test"] },
    });
    monitor.attach(emitter);

    emitter.emit("session:started", {
      session: { id: "tagged-session", tags: ["eval"] },
    });
    emitter.emit("session:ended", {
      sessionId: "tagged-session",
      finalThoughtCount: 1, // below threshold but tagged
    });

    await sleep(4500);

    assert(feedbackCalls.length > 0, "Tagged session should be scored");
    assertEqual(monitor.scoredSessionCount, 1, "One session should be scored");

    monitor.detach(emitter);
  });

  // -------------------------------------------------------------------------
  // Scoring tests
  // -------------------------------------------------------------------------

  await test("All 4 evaluators are called and feedback is created", async () => {
    const { client, feedbackCalls } = createMockClient();
    const traceListener = createMockTraceListener({ "eval-session": "run-eval" });
    const emitter = createTestEmitter();

    const monitor = new OnlineMonitor(createConfig(), client, {
      traceListener,
      monitorConfig: { minThoughts: 1 },
    });
    monitor.attach(emitter);

    emitter.emit("session:started", {
      session: { id: "eval-session", tags: [] },
    });
    emitter.emit("session:ended", {
      sessionId: "eval-session",
      finalThoughtCount: 5,
    });

    await sleep(4500);

    assertEqual(feedbackCalls.length, 4, "All 4 evaluators should create feedback");

    // Verify all evaluator keys are present
    const keys = feedbackCalls.map((f) => f.key).sort();
    assert(keys.includes("dgmFitness"), "dgmFitness evaluator should run");
    assert(keys.includes("memoryQuality"), "memoryQuality evaluator should run");
    assert(keys.includes("reasoningCoherence"), "reasoningCoherence evaluator should run");
    assert(keys.includes("sessionQuality"), "sessionQuality evaluator should run");

    monitor.detach(emitter);
  });

  await test("Missing runId (no trace-listener) skips gracefully", async () => {
    const { client, feedbackCalls } = createMockClient();
    // Trace listener returns undefined for all session IDs
    const traceListener = createMockTraceListener({});
    const emitter = createTestEmitter();

    const monitor = new OnlineMonitor(createConfig(), client, {
      traceListener,
      monitorConfig: { minThoughts: 1 },
    });
    monitor.attach(emitter);

    emitter.emit("session:started", {
      session: { id: "no-run-session", tags: [] },
    });
    emitter.emit("session:ended", {
      sessionId: "no-run-session",
      finalThoughtCount: 10,
    });

    await sleep(4500);

    assertEqual(feedbackCalls.length, 0, "No feedback when runId is missing");
    assertEqual(monitor.scoredSessionCount, 0, "No sessions scored");

    monitor.detach(emitter);
  });

  // -------------------------------------------------------------------------
  // Regression detection tests
  // -------------------------------------------------------------------------

  await test("No alerts when < 10 samples in history", async () => {
    const { client } = createMockClient();
    const traceListener = createMockTraceListener();
    const emitter = createTestEmitter();

    const alerts: any[] = [];
    emitter.on("monitoring:alert", (data: any) => alerts.push(data));

    const monitor = new OnlineMonitor(createConfig(), client, {
      traceListener,
      monitorConfig: { minThoughts: 1, minSamplesForBaseline: 10 },
    });
    monitor.attach(emitter);

    // Score 5 sessions (below 10 threshold)
    for (let i = 0; i < 5; i++) {
      const sid = `baseline-${i}`;
      const rid = `run-baseline-${i}`;
      const tl = createMockTraceListener({ [sid]: rid });
      // Override trace listener for each session
      (monitor as any).traceListener = tl;

      emitter.emit("session:started", {
        session: { id: sid, tags: [] },
      });
      emitter.emit("session:ended", {
        sessionId: sid,
        finalThoughtCount: 10,
      });
      await sleep(4500);
    }

    assertEqual(alerts.length, 0, "No alerts when baseline not established");

    monitor.detach(emitter);
  });

  await test("Regression alert emitted when score drops below mean - 2*stddev", async () => {
    const { client } = createMockClient();
    const emitter = createTestEmitter();

    const alerts: any[] = [];
    emitter.on("monitoring:alert", (data: any) => alerts.push(data));

    const monitor = new OnlineMonitor(createConfig(), client, {
      monitorConfig: {
        minThoughts: 1,
        minSamplesForBaseline: 10,
        rollingWindowSize: 20,
        stddevThreshold: 2,
        alertCooldownMs: 0, // no cooldown for testing
      },
    });

    // Directly populate the score history with consistent scores
    const history = (monitor as any).scoreHistory as Array<Record<string, number>>;
    for (let i = 0; i < 12; i++) {
      history.push({ sessionQuality: 0.8, reasoningCoherence: 0.7 });
    }

    // Simulate a regression check with a very low score
    (monitor as any).checkForRegressions(
      { sessionQuality: 0.1, reasoningCoherence: 0.7 },
      emitter,
    );

    const regressionAlerts = alerts.filter((a) => a.type === "regression");
    assert(regressionAlerts.length > 0, "Should emit regression alert");
    assertEqual(regressionAlerts[0].metric, "sessionQuality", "Alert should be for sessionQuality");
    assertEqual(regressionAlerts[0].severity, "warning", "Regression should be warning severity");

    monitor.detach(emitter);
  });

  await test("Anomaly alert emitted when score spikes above mean + 2*stddev", async () => {
    const { client } = createMockClient();
    const emitter = createTestEmitter();

    const alerts: any[] = [];
    emitter.on("monitoring:alert", (data: any) => alerts.push(data));

    const monitor = new OnlineMonitor(createConfig(), client, {
      monitorConfig: {
        minThoughts: 1,
        minSamplesForBaseline: 10,
        rollingWindowSize: 20,
        stddevThreshold: 2,
        alertCooldownMs: 0,
      },
    });

    // Populate history with consistent low scores
    const history = (monitor as any).scoreHistory as Array<Record<string, number>>;
    for (let i = 0; i < 12; i++) {
      history.push({ sessionQuality: 0.3, reasoningCoherence: 0.3 });
    }

    // Simulate anomaly with a very high score
    (monitor as any).checkForRegressions(
      { sessionQuality: 0.95, reasoningCoherence: 0.3 },
      emitter,
    );

    const anomalyAlerts = alerts.filter((a) => a.type === "anomaly");
    assert(anomalyAlerts.length > 0, "Should emit anomaly alert");
    assertEqual(anomalyAlerts[0].metric, "sessionQuality", "Alert should be for sessionQuality");
    assertEqual(anomalyAlerts[0].severity, "info", "Anomaly should be info severity");

    monitor.detach(emitter);
  });

  // -------------------------------------------------------------------------
  // Alert deduplication test
  // -------------------------------------------------------------------------

  await test("Second alert for same metric within cooldown is suppressed", async () => {
    const { client } = createMockClient();
    const emitter = createTestEmitter();

    const alerts: any[] = [];
    emitter.on("monitoring:alert", (data: any) => alerts.push(data));

    const monitor = new OnlineMonitor(createConfig(), client, {
      monitorConfig: {
        minThoughts: 1,
        minSamplesForBaseline: 10,
        rollingWindowSize: 20,
        stddevThreshold: 2,
        alertCooldownMs: 60_000, // 1 minute cooldown
      },
    });

    const history = (monitor as any).scoreHistory as Array<Record<string, number>>;
    for (let i = 0; i < 12; i++) {
      history.push({ sessionQuality: 0.8 });
    }

    // First regression check — should alert
    (monitor as any).checkForRegressions({ sessionQuality: 0.1 }, emitter);
    assertEqual(alerts.length, 1, "First alert should fire");

    // Second regression check — should be suppressed (within cooldown)
    (monitor as any).checkForRegressions({ sessionQuality: 0.1 }, emitter);
    assertEqual(alerts.length, 1, "Second alert should be suppressed by cooldown");

    monitor.detach(emitter);
  });

  // -------------------------------------------------------------------------
  // Circuit breaker test
  // -------------------------------------------------------------------------

  await test("Circuit breaker suppresses after 5 consecutive failures", async () => {
    let readRunCallCount = 0;
    const { client } = createMockClient({
      readRun: async () => {
        readRunCallCount++;
        throw new Error("LangSmith unavailable");
      },
    });

    const traceListener = createMockTraceListener();
    const emitter = createTestEmitter();

    const monitor = new OnlineMonitor(createConfig(), client, {
      traceListener,
      monitorConfig: { minThoughts: 1 },
    });
    monitor.attach(emitter);

    // Trigger 7 sessions — first 5 should attempt readRun, remaining suppressed
    for (let i = 0; i < 7; i++) {
      const sid = `fail-${i}`;
      // Make trace-listener return a run ID for every session
      (monitor as any).traceListener = createMockTraceListener({ [sid]: `run-fail-${i}` });

      emitter.emit("session:started", {
        session: { id: sid, tags: [] },
      });
      emitter.emit("session:ended", {
        sessionId: sid,
        finalThoughtCount: 10,
      });
      // Wait for timer + async
      await sleep(4500);
    }

    // After 5 failures the circuit should be open, suppressing calls 6 and 7
    assert(readRunCallCount <= 6, `Expected <= 6 readRun calls, got ${readRunCallCount}`);

    monitor.detach(emitter);
  });

  // -------------------------------------------------------------------------
  // Detach test
  // -------------------------------------------------------------------------

  await test("Detach clears timers, handlers, and session tags", async () => {
    const { client } = createMockClient();
    const traceListener = createMockTraceListener();
    const emitter = createTestEmitter();

    const monitor = new OnlineMonitor(createConfig(), client, {
      traceListener,
      monitorConfig: { minThoughts: 1 },
    });
    monitor.attach(emitter);

    // Start a session to populate session tags
    emitter.emit("session:started", {
      session: { id: "detach-session", tags: ["test"] },
    });

    const sessionTags = (monitor as any).sessionTags as Map<string, string[]>;
    assertEqual(sessionTags.size, 1, "Session tags should be stored");

    // Detach
    monitor.detach(emitter);

    assertEqual(sessionTags.size, 0, "Session tags should be cleared after detach");
    assertEqual((monitor as any).handlers.size, 0, "Handlers should be cleared after detach");
    assertEqual((monitor as any).pendingTimers.size, 0, "Pending timers should be cleared after detach");

    // Verify events no longer trigger the monitor
    emitter.emit("session:started", {
      session: { id: "post-detach", tags: [] },
    });
    assertEqual(sessionTags.size, 0, "No new tags after detach");
  });

  console.log("\n\u2728 OnlineMonitor tests complete\n");
}

runTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
