#!/usr/bin/env npx tsx
/**
 * Unit tests for Benchmark Suite Configuration Loader
 * SPEC: SIL-002
 *
 * Run with: npx tsx benchmarks/config-loader.test.ts
 */

import {
  loadBenchmarkConfig,
  ConfigLoadError,
  getTierById,
  getTestIds,
  getAnchorTestIds,
  getTestsToSkip,
  getProctoringStatus,
  BenchmarkConfigSchema,
  type BenchmarkConfig,
} from "./config-loader.js";
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

function assertThrows(fn: () => void, errorType?: new (...args: unknown[]) => Error): void {
  try {
    fn();
    throw new Error(`Expected function to throw in "${currentTest}"`);
  } catch (err) {
    if (errorType && !(err instanceof errorType)) {
      throw new Error(
        `Expected ${errorType.name} but got ${(err as Error).constructor.name} in "${currentTest}"`
      );
    }
  }
}

// =============================================================================
// Test Fixtures
// =============================================================================

const MINIMAL_VALID_CONFIG = `
name: test-suite
version: "1.0"
description: Test benchmark suite

tiers:
  - id: smoke
    name: Smoke Tests
    description: Basic smoke tests
    timeout_seconds: 30
    required_pass_rate: 1.0
    tests:
      - id: test-1
        toolhost: init
        name: Test 1
        description: First test
        steps:
          - operation: get_state
            expectedBehavior: Returns state

anchor_points:
  enabled: true
  confidence_threshold: 0.95
  anchors:
    - test_id: test-1
      correlation: 0.9
      description: Main anchor
  sampling_rules:
    - trigger:
        anchor_id: test-1
        result: pass
      skip_probability: 0.5
      affected_tests:
        - test-2

proctoring:
  enabled: true
  contamination_detection:
    enabled: true
    baseline_hash_check: true
  variance_injection:
    enabled: true
    permute_test_order: true
    input_fuzzing: true
    fuzzing_seed_rotation: weekly
  anomaly_detection:
    enabled: true
    benchmark_real_world_gap_threshold: 0.15
    perfect_score_investigation: true

target_repos:
  - owner: test
    repo: repo
    issue_label: bug
    max_issues: 5

execution:
  max_concurrency: 4
  retry_count: 2
  retry_delay_seconds: 5
  output_dir: ./output
  baseline:
    path: ./baseline.json
    thresholds:
      duration_ms_increase_max: 20
      response_bytes_increase_max: 10
      pass_rate_decrease_max: 5

reporting:
  formats:
    - json
  output_dir: ./reports
  timing_breakdown: true
  include_output_samples: true
  sample_limit: 3
`;

const INVALID_CONFIG_MISSING_TIERS = `
name: test-suite
version: "1.0"
description: Missing tiers

anchor_points:
  enabled: false
  confidence_threshold: 0.95
  anchors: []
  sampling_rules: []

proctoring:
  enabled: false
  contamination_detection:
    enabled: false
    baseline_hash_check: false
  variance_injection:
    enabled: false
    permute_test_order: false
    input_fuzzing: false
    fuzzing_seed_rotation: weekly
  anomaly_detection:
    enabled: false
    benchmark_real_world_gap_threshold: 0.15
    perfect_score_investigation: false

target_repos: []

execution:
  max_concurrency: 4
  retry_count: 2
  retry_delay_seconds: 5
  output_dir: ./output
  baseline:
    path: ./baseline.json
    thresholds:
      duration_ms_increase_max: 20
      response_bytes_increase_max: 10
      pass_rate_decrease_max: 5

reporting:
  formats:
    - json
  output_dir: ./reports
  timing_breakdown: true
  include_output_samples: true
  sample_limit: 3
`;

const INVALID_CONFIG_BAD_TOOLHOST = `
name: test-suite
version: "1.0"
description: Invalid toolhost

tiers:
  - id: smoke
    name: Smoke Tests
    description: Basic smoke tests
    timeout_seconds: 30
    required_pass_rate: 1.0
    tests:
      - id: test-1
        toolhost: invalid_tool
        name: Test 1
        description: First test
        steps:
          - operation: get_state
            expectedBehavior: Returns state

anchor_points:
  enabled: false
  confidence_threshold: 0.95
  anchors: []
  sampling_rules: []

proctoring:
  enabled: false
  contamination_detection:
    enabled: false
    baseline_hash_check: false
  variance_injection:
    enabled: false
    permute_test_order: false
    input_fuzzing: false
    fuzzing_seed_rotation: weekly
  anomaly_detection:
    enabled: false
    benchmark_real_world_gap_threshold: 0.15
    perfect_score_investigation: false

target_repos: []

execution:
  max_concurrency: 4
  retry_count: 2
  retry_delay_seconds: 5
  output_dir: ./output
  baseline:
    path: ./baseline.json
    thresholds:
      duration_ms_increase_max: 20
      response_bytes_increase_max: 10
      pass_rate_decrease_max: 5

reporting:
  formats:
    - json
  output_dir: ./reports
  timing_breakdown: true
  include_output_samples: true
  sample_limit: 3
`;

// =============================================================================
// Tests
// =============================================================================

async function runTests(): Promise<void> {
  const tempDir = resolve(__dirname, ".test-temp");
  mkdirSync(tempDir, { recursive: true });

  console.log("\nBenchmark Config Loader Tests\n");

  // -------------------------------------------------------------------------
  // Loading Tests
  // -------------------------------------------------------------------------

  console.log("Loading Tests:");

  test("loadBenchmarkConfig loads default suite.yaml", () => {
    const config = loadBenchmarkConfig();
    assert(config.name === "thoughtbox-improvement", `Expected name "thoughtbox-improvement" but got "${config.name}"`);
    assert(config.version === "1.0", `Expected version "1.0" but got "${config.version}"`);
  });

  test("loadBenchmarkConfig loads custom path", () => {
    const tempFile = resolve(tempDir, "custom.yaml");
    writeFileSync(tempFile, MINIMAL_VALID_CONFIG);
    const config = loadBenchmarkConfig(tempFile);
    assertEqual(config.name, "test-suite");
  });

  test("loadBenchmarkConfig throws on missing file", () => {
    assertThrows(() => loadBenchmarkConfig("/nonexistent/path.yaml"), ConfigLoadError);
  });

  test("loadBenchmarkConfig throws on invalid YAML", () => {
    const tempFile = resolve(tempDir, "invalid.yaml");
    writeFileSync(tempFile, "{ invalid yaml: [");
    assertThrows(() => loadBenchmarkConfig(tempFile), ConfigLoadError);
  });

  test("loadBenchmarkConfig throws on missing required fields", () => {
    const tempFile = resolve(tempDir, "missing-tiers.yaml");
    writeFileSync(tempFile, INVALID_CONFIG_MISSING_TIERS);
    assertThrows(() => loadBenchmarkConfig(tempFile), ConfigLoadError);
  });

  test("loadBenchmarkConfig throws on invalid toolhost enum", () => {
    const tempFile = resolve(tempDir, "bad-toolhost.yaml");
    writeFileSync(tempFile, INVALID_CONFIG_BAD_TOOLHOST);
    assertThrows(() => loadBenchmarkConfig(tempFile), ConfigLoadError);
  });

  // -------------------------------------------------------------------------
  // Tier Tests
  // -------------------------------------------------------------------------

  console.log("\nTier Tests:");

  test("getTierById returns correct tier", () => {
    const config = loadBenchmarkConfig();
    const tier = getTierById(config, "smoke-test");
    assert(tier !== undefined, "smoke-test tier should exist");
    assertEqual(tier!.id, "smoke-test");
  });

  test("getTierById returns undefined for missing tier", () => {
    const config = loadBenchmarkConfig();
    const tier = getTierById(config, "nonexistent");
    assert(tier === undefined, "nonexistent tier should return undefined");
  });

  test("getTestIds returns all test IDs from tier", () => {
    const config = loadBenchmarkConfig();
    const tier = getTierById(config, "smoke-test");
    assert(tier !== undefined, "smoke-test tier should exist");
    const testIds = getTestIds(tier!);
    assert(testIds.includes("init-basic"), "Should include init-basic test");
    assert(testIds.includes("thought-basic"), "Should include thought-basic test");
  });

  // -------------------------------------------------------------------------
  // Anchor Point Tests
  // -------------------------------------------------------------------------

  console.log("\nAnchor Point Tests:");

  test("getAnchorTestIds returns anchor test IDs when enabled", () => {
    const config = loadBenchmarkConfig();
    const anchorIds = getAnchorTestIds(config);
    assert(anchorIds.length > 0, "Should have anchor test IDs");
    assert(anchorIds.includes("thought-chain-10"), "Should include thought-chain-10 anchor");
  });

  test("getAnchorTestIds returns empty when disabled", () => {
    const tempFile = resolve(tempDir, "disabled-anchors.yaml");
    const configContent = MINIMAL_VALID_CONFIG.replace("enabled: true", "enabled: false");
    writeFileSync(tempFile, configContent);
    const config = loadBenchmarkConfig(tempFile);
    const anchorIds = getAnchorTestIds(config);
    assertEqual(anchorIds.length, 0);
  });

  test("getTestsToSkip returns tests based on anchor results", () => {
    const config = loadBenchmarkConfig();
    const anchorResults = new Map([["thought-chain-10", true]]);
    // Run multiple times to account for probability
    let skippedAny = false;
    for (let i = 0; i < 20; i++) {
      const testsToSkip = getTestsToSkip(config, anchorResults);
      if (testsToSkip.length > 0) {
        skippedAny = true;
        break;
      }
    }
    // With 70% skip probability and 20 tries, probability of never skipping is ~0.7^20 ~ 0
    assert(skippedAny, "Should skip some tests probabilistically");
  });

  // -------------------------------------------------------------------------
  // Proctoring Tests
  // -------------------------------------------------------------------------

  console.log("\nProctoring Tests:");

  test("getProctoringStatus returns correct status", () => {
    const config = loadBenchmarkConfig();
    const status = getProctoringStatus(config);
    assert(status.enabled === true, "Proctoring should be enabled");
    assert(status.contamination === true, "Contamination detection should be enabled");
    assert(status.variance === true, "Variance injection should be enabled");
    assert(status.anomaly === true, "Anomaly detection should be enabled");
  });

  // -------------------------------------------------------------------------
  // Schema Validation Tests
  // -------------------------------------------------------------------------

  console.log("\nSchema Validation Tests:");

  test("BenchmarkConfigSchema rejects pass_rate > 1", () => {
    const invalidConfig = {
      ...JSON.parse(JSON.stringify(loadBenchmarkConfig())),
    };
    invalidConfig.tiers[0].required_pass_rate = 1.5;
    const result = BenchmarkConfigSchema.safeParse(invalidConfig);
    assert(!result.success, "Should reject pass_rate > 1");
  });

  test("BenchmarkConfigSchema rejects negative timeout", () => {
    const invalidConfig = {
      ...JSON.parse(JSON.stringify(loadBenchmarkConfig())),
    };
    invalidConfig.tiers[0].timeout_seconds = -10;
    const result = BenchmarkConfigSchema.safeParse(invalidConfig);
    assert(!result.success, "Should reject negative timeout");
  });

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  // Wait a moment for async tests to complete
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Cleanup temp directory
  try {
    rmSync(tempDir, { recursive: true });
  } catch {
    // Ignore cleanup errors
  }

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
