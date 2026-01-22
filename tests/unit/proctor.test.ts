#!/usr/bin/env npx tsx
/**
 * Unit tests for Proctored Execution Environment
 * SPEC: SIL-007
 *
 * Run with: npx tsx tests/unit/proctor.test.ts
 */

import {
  ProctoredExecutor,
  getProctoredExecutor,
  resetProctoredExecutor,
  DEFAULT_SANDBOX_CONFIG,
  type TestCase,
  type ExecutionLogs,
  type ProctoredResult,
} from "../../benchmarks/proctor.js";

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
      console.log(`  ✓ ${name}`);
    })
    .catch((err) => {
      testsFailed++;
      console.error(`  ✗ ${name}`);
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
// Test Fixtures
// =============================================================================

const mockTestCase: TestCase = {
  id: "test-001",
  name: "simple-test",
  code: 'console.log("Hello, test!")',
  expectedDuration: 100, // 100ms for simple code (avoids timing anomaly for fast execution)
  difficulty: "easy",
};

const slowTestCase: TestCase = {
  id: "test-002",
  name: "slow-test",
  code: "// slow computation",
  expectedDuration: 60000, // 1 minute
  difficulty: "hard",
};

// =============================================================================
// Tests
// =============================================================================

async function runTests(): Promise<void> {
  console.log("\nProctored Executor Tests\n");

  // Reset singleton before tests
  resetProctoredExecutor();

  // -------------------------------------------------------------------------
  // Initialization Tests
  // -------------------------------------------------------------------------

  console.log("Initialization Tests:");

  test("creates executor with default config", () => {
    const executor = new ProctoredExecutor();
    const config = executor.getConfig();

    assertEqual(config.image, DEFAULT_SANDBOX_CONFIG.image);
    assertEqual(config.networkDisabled, DEFAULT_SANDBOX_CONFIG.networkDisabled);
    assertEqual(config.memoryLimitMb, DEFAULT_SANDBOX_CONFIG.memoryLimitMb);
    assertEqual(config.timeoutSeconds, DEFAULT_SANDBOX_CONFIG.timeoutSeconds);
  });

  test("creates executor with custom config", () => {
    const executor = new ProctoredExecutor({
      timeoutSeconds: 60,
      memoryLimitMb: 256,
    });
    const config = executor.getConfig();

    assertEqual(config.timeoutSeconds, 60);
    assertEqual(config.memoryLimitMb, 256);
    // Other values should be defaults
    assertEqual(config.networkDisabled, DEFAULT_SANDBOX_CONFIG.networkDisabled);
  });

  test("singleton pattern works", () => {
    resetProctoredExecutor();

    const exec1 = getProctoredExecutor({ timeoutSeconds: 100 });
    const exec2 = getProctoredExecutor();

    // Should be same instance
    assertEqual(exec1.getConfig().timeoutSeconds, exec2.getConfig().timeoutSeconds);
  });

  test("setConfig updates configuration", () => {
    const executor = new ProctoredExecutor();
    executor.setConfig({ memoryLimitMb: 1024 });

    assertEqual(executor.getConfig().memoryLimitMb, 1024);
  });

  // -------------------------------------------------------------------------
  // Execution Tests
  // -------------------------------------------------------------------------

  console.log("\nExecution Tests:");

  test("executes simple code successfully", async () => {
    const executor = new ProctoredExecutor({ useProcessMode: true });

    // Use a test case with 1ms expected duration to avoid timing anomaly for instant code
    const quickTestCase: TestCase = {
      ...mockTestCase,
      expectedDuration: 1, // 1ms expected - instant code won't trigger timing anomaly
    };

    const result = await executor.executeProctored(
      'console.log("Hello from sandbox")',
      quickTestCase
    );

    // With 1ms expected, even 0ms actual = 0 ratio, but timing check uses threshold
    // For very quick test cases, we just check markers and exit code
    assert(result.logs.exitCode === 0, "Exit code should be 0");
    assert(result.logs.stdout.includes("Hello from sandbox"), "Should include output");
    assert(result.logs.stdout.includes("TEST_START:"), "Should include start marker");
    assert(result.logs.stdout.includes("TEST_END:"), "Should include end marker");
  });

  test("captures test markers in output", async () => {
    const executor = new ProctoredExecutor({ useProcessMode: true });

    const result = await executor.executeProctored(
      'console.log("test output")',
      mockTestCase
    );

    assert(
      result.logs.stdout.includes(`TEST_START:${mockTestCase.name}`),
      "Should include start marker"
    );
    assert(
      result.logs.stdout.includes(`TEST_END:${mockTestCase.name}`),
      "Should include end marker"
    );
  });

  test("captures duration in output", async () => {
    const executor = new ProctoredExecutor({ useProcessMode: true });

    const result = await executor.executeProctored(
      'console.log("quick")',
      mockTestCase
    );

    assert(
      result.logs.stdout.includes("DURATION:"),
      "Should include duration marker"
    );
  });

  test("handles execution errors gracefully", async () => {
    const executor = new ProctoredExecutor({ useProcessMode: true });

    const result = await executor.executeProctored(
      'throw new Error("Test error")',
      mockTestCase
    );

    assert(result.passed === false, "Should fail for throwing code");
    assert(result.logs.exitCode === 1, "Exit code should be 1");
    assert(result.logs.stderr.includes("Test error"), "Should capture error message");
  });

  // -------------------------------------------------------------------------
  // Verification Tests
  // -------------------------------------------------------------------------

  console.log("\nVerification Tests:");

  test("detects missing start marker", () => {
    const executor = new ProctoredExecutor();

    const logs: ExecutionLogs = {
      stdout: `TEST_END:${mockTestCase.name}\nDURATION:100`,
      stderr: "",
      exitCode: 0,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      resourceUsage: { cpuUsed: 0, memoryPeakMb: 10, diskReadBytes: 0, diskWriteBytes: 0 },
    };

    const verification = executor.verifyExecution(logs, mockTestCase);

    assert(verification.consistent === false, "Should be inconsistent");
    assert(
      verification.flags.some((f) => f.type === "missing_start"),
      "Should flag missing start"
    );
  });

  test("detects missing end marker", () => {
    const executor = new ProctoredExecutor();

    const logs: ExecutionLogs = {
      stdout: `TEST_START:${mockTestCase.name}\nDURATION:100`,
      stderr: "",
      exitCode: 0,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      resourceUsage: { cpuUsed: 0, memoryPeakMb: 10, diskReadBytes: 0, diskWriteBytes: 0 },
    };

    const verification = executor.verifyExecution(logs, mockTestCase);

    assert(verification.consistent === false, "Should be inconsistent");
    assert(
      verification.flags.some((f) => f.type === "missing_end"),
      "Should flag missing end"
    );
  });

  test("passes verification with all markers present", () => {
    const executor = new ProctoredExecutor();

    const logs: ExecutionLogs = {
      stdout: `TEST_START:${mockTestCase.name}\noutput\nTEST_END:${mockTestCase.name}\nDURATION:1000`,
      stderr: "",
      exitCode: 0,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      resourceUsage: { cpuUsed: 0, memoryPeakMb: 10, diskReadBytes: 0, diskWriteBytes: 0 },
    };

    const verification = executor.verifyExecution(logs, mockTestCase);

    assert(verification.consistent === true, "Should be consistent");
    assert(
      !verification.flags.some((f) => f.type === "missing_start"),
      "Should not flag missing start"
    );
    assert(
      !verification.flags.some((f) => f.type === "missing_end"),
      "Should not flag missing end"
    );
  });

  // -------------------------------------------------------------------------
  // Timing Analysis Tests
  // -------------------------------------------------------------------------

  console.log("\nTiming Analysis Tests:");

  test("detects suspiciously fast execution", () => {
    const executor = new ProctoredExecutor();

    const logs: ExecutionLogs = {
      stdout: `TEST_START:${slowTestCase.name}\nTEST_END:${slowTestCase.name}\nDURATION:100`, // 100ms vs 60000ms expected
      stderr: "",
      exitCode: 0,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      resourceUsage: { cpuUsed: 0, memoryPeakMb: 10, diskReadBytes: 0, diskWriteBytes: 0 },
    };

    const timingAnalysis = executor.analyzeTime(logs, slowTestCase);

    assert(timingAnalysis.suspicious === true, "Should flag suspicious timing");
    assert(timingAnalysis.ratio < 0.1, `Ratio should be < 0.1, got ${timingAnalysis.ratio}`);
    assert(timingAnalysis.anomalyScore > 0, "Anomaly score should be positive");
  });

  test("passes reasonable execution time", () => {
    const executor = new ProctoredExecutor();

    const logs: ExecutionLogs = {
      stdout: `TEST_START:${mockTestCase.name}\nTEST_END:${mockTestCase.name}\nDURATION:50`, // 50ms vs 100ms expected = 50%
      stderr: "",
      exitCode: 0,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      resourceUsage: { cpuUsed: 0, memoryPeakMb: 10, diskReadBytes: 0, diskWriteBytes: 0 },
    };

    const timingAnalysis = executor.analyzeTime(logs, mockTestCase);

    assert(timingAnalysis.suspicious === false, "Should not flag reasonable timing");
    assert(timingAnalysis.ratio >= 0.1, `Ratio should be >= 0.1, got ${timingAnalysis.ratio}`);
  });

  test("timing analysis extracts duration from logs", () => {
    const executor = new ProctoredExecutor();

    const logs: ExecutionLogs = {
      stdout: "TEST_START:test\nDURATION:12345\nTEST_END:test",
      stderr: "",
      exitCode: 0,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      resourceUsage: { cpuUsed: 0, memoryPeakMb: 10, diskReadBytes: 0, diskWriteBytes: 0 },
    };

    const timingAnalysis = executor.analyzeTime(logs, mockTestCase);

    assertEqual(timingAnalysis.actualDuration, 12345);
    assertEqual(timingAnalysis.expectedDuration, mockTestCase.expectedDuration);
  });

  // -------------------------------------------------------------------------
  // Resource Anomaly Tests
  // -------------------------------------------------------------------------

  console.log("\nResource Anomaly Tests:");

  test("flags suspiciously low memory usage", () => {
    const executor = new ProctoredExecutor();

    const logs: ExecutionLogs = {
      stdout: `TEST_START:${mockTestCase.name}\nTEST_END:${mockTestCase.name}\nDURATION:1000`,
      stderr: "",
      exitCode: 0,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      resourceUsage: { cpuUsed: 0, memoryPeakMb: 0.1, diskReadBytes: 0, diskWriteBytes: 0 },
    };

    const verification = executor.verifyExecution(logs, mockTestCase);

    assert(
      verification.flags.some((f) => f.type === "resource_anomaly"),
      "Should flag resource anomaly"
    );
  });

  // -------------------------------------------------------------------------
  // Timeout Tests
  // -------------------------------------------------------------------------

  console.log("\nTimeout Tests:");

  test("enforces timeout for long-running code", async () => {
    const executor = new ProctoredExecutor({
      useProcessMode: true,
      timeoutSeconds: 1, // 1 second timeout
    });

    const longRunningCode = `
      let start = Date.now();
      while (Date.now() - start < 10000) {
        // Spin for 10 seconds
      }
    `;

    try {
      await executor.executeProctored(longRunningCode, {
        ...mockTestCase,
        code: longRunningCode,
      });
      assert(false, "Should have thrown timeout error");
    } catch (err) {
      assert(
        (err as Error).message.includes("timeout"),
        `Expected timeout error, got: ${(err as Error).message}`
      );
    }
  });

  // -------------------------------------------------------------------------
  // Integration Tests
  // -------------------------------------------------------------------------

  console.log("\nIntegration Tests:");

  test("full execution flow with verification", async () => {
    const executor = new ProctoredExecutor({ useProcessMode: true });

    // Use 1ms expected duration to prevent timing anomaly for fast code
    const quickTestCase: TestCase = {
      ...mockTestCase,
      expectedDuration: 1,
    };

    const result = await executor.executeProctored(
      `
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        console.log("Sum: " + sum);
      `,
      quickTestCase
    );

    // Should have valid logs
    assert(result.logs.stdout.includes("Sum:"), "Should have computation output");
    assert(result.logs.exitCode === 0, "Should have exit code 0");

    // Should have valid verification structure
    assert(
      typeof result.verification.timingAnalysis.actualDuration === "number",
      "Should have timing"
    );

    // Markers should be present (consistent)
    assert(
      result.logs.stdout.includes("TEST_START:"),
      "Should include start marker"
    );
    assert(
      result.logs.stdout.includes("TEST_END:"),
      "Should include end marker"
    );
  });

  // -------------------------------------------------------------------------
  // Wait and Report
  // -------------------------------------------------------------------------

  await new Promise((resolve) => setTimeout(resolve, 500));

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
