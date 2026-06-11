/**
 * monitoring:alert stderr sink tests.
 *
 * OnlineMonitor emits monitoring:alert events on the ThoughtEmitter
 * singleton. initMonitoring attaches a stderr sink so those alerts are
 * visible in process logs (Cloud Run) instead of firing into the void.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { thoughtEmitter } from "../../events/index.js";
import type { ThoughtEmitterEvents } from "../../events/index.js";
import { initMonitoring, resetClient } from "../index.js";
import type { OnlineMonitor } from "../online-monitor.js";

const ORIGINAL_API_KEY = process.env.LANGSMITH_API_KEY;

function makeAlert(): ThoughtEmitterEvents["monitoring:alert"] {
  return {
    type: "regression",
    severity: "warning",
    metric: "sessionQuality",
    currentValue: 0.1,
    threshold: 0.55,
    message: "sessionQuality dropped to 0.100 (baseline: 0.800 +/- 0.125)",
    timestamp: "2026-06-11T00:00:00.000Z",
  };
}

describe("initMonitoring monitoring:alert sink", () => {
  let monitor: OnlineMonitor | null = null;

  beforeAll(() => {
    process.env.LANGSMITH_API_KEY = "test-key";
  });

  afterEach(() => {
    if (monitor) {
      monitor.detach(thoughtEmitter);
      monitor = null;
    }
    vi.restoreAllMocks();
  });

  afterAll(() => {
    if (ORIGINAL_API_KEY === undefined) {
      delete process.env.LANGSMITH_API_KEY;
    } else {
      process.env.LANGSMITH_API_KEY = ORIGINAL_API_KEY;
    }
    resetClient();
  });

  it("logs a structured stderr line when an alert is emitted", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    monitor = initMonitoring();
    expect(monitor).not.toBeNull();

    const alert = makeAlert();
    thoughtEmitter.emitMonitoringAlert(alert);

    const alertLines = errorSpy.mock.calls
      .map((call) => call.join(" "))
      .filter((line) => line.includes("monitoring:alert"));
    expect(alertLines).toHaveLength(1);
    expect(alertLines[0]).toContain(JSON.stringify(alert));
  });

  it("does not duplicate the sink when initMonitoring runs again", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    monitor = initMonitoring();
    const secondMonitor = initMonitoring();
    secondMonitor?.detach(thoughtEmitter);

    thoughtEmitter.emitMonitoringAlert(makeAlert());

    const alertLines = errorSpy.mock.calls
      .map((call) => call.join(" "))
      .filter((line) => line.includes("monitoring:alert"));
    expect(alertLines).toHaveLength(1);
  });
});
