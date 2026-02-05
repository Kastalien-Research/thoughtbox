/**
 * Benchmark Suite Configuration Loader
 * SPEC: SIL-002
 *
 * Loads and validates the benchmark suite configuration from YAML.
 * Uses Zod for schema validation to ensure configuration integrity.
 */

import { z } from "zod";
import { readFileSync, existsSync } from "fs";
import { parse as parseYaml } from "yaml";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// =============================================================================
// Schema Definitions
// =============================================================================

/**
 * Test step within a test case
 */
export const TestStepSchema = z.object({
  operation: z.string().min(1),
  args: z.record(z.string(), z.unknown()).optional(),
  expectedBehavior: z.string().min(1),
});

export type TestStep = z.infer<typeof TestStepSchema>;

/**
 * Individual test case configuration
 */
export const TestCaseSchema = z.object({
  id: z.string().min(1),
  toolhost: z.enum(["thoughtbox", "notebook", "mental_models", "memory", "init"]),
  name: z.string().min(1),
  description: z.string().min(1),
  source: z.enum(["github", "synthetic"]).optional(),
  steps: z.array(TestStepSchema).min(1),
});

export type TestCase = z.infer<typeof TestCaseSchema>;

/**
 * Evaluation tier configuration
 */
export const TierConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  timeout_seconds: z.number().int().positive(),
  required_pass_rate: z.number().min(0).max(1),
  tests: z.array(TestCaseSchema).min(1),
});

export type TierConfig = z.infer<typeof TierConfigSchema>;

/**
 * Anchor point definition for sampling
 */
export const AnchorPointSchema = z.object({
  test_id: z.string().min(1),
  correlation: z.number().min(0).max(1),
  description: z.string().min(1),
});

export type AnchorPoint = z.infer<typeof AnchorPointSchema>;

/**
 * Sampling rule triggered by anchor point results
 */
export const SamplingRuleSchema = z.object({
  trigger: z.object({
    anchor_id: z.string().min(1),
    result: z.enum(["pass", "fail"]),
  }),
  skip_probability: z.number().min(0).max(1),
  affected_tests: z.array(z.string()).min(1),
});

export type SamplingRule = z.infer<typeof SamplingRuleSchema>;

/**
 * Anchor points configuration for cost reduction
 */
export const AnchorPointsConfigSchema = z.object({
  enabled: z.boolean(),
  confidence_threshold: z.number().min(0).max(1),
  anchors: z.array(AnchorPointSchema),
  sampling_rules: z.array(SamplingRuleSchema),
});

export type AnchorPointsConfig = z.infer<typeof AnchorPointsConfigSchema>;

/**
 * Contamination detection settings
 */
export const ContaminationDetectionSchema = z.object({
  enabled: z.boolean(),
  baseline_hash_check: z.boolean(),
});

export type ContaminationDetection = z.infer<typeof ContaminationDetectionSchema>;

/**
 * Variance injection settings
 */
export const VarianceInjectionSchema = z.object({
  enabled: z.boolean(),
  permute_test_order: z.boolean(),
  input_fuzzing: z.boolean(),
  fuzzing_seed_rotation: z.enum(["daily", "weekly", "monthly"]),
});

export type VarianceInjection = z.infer<typeof VarianceInjectionSchema>;

/**
 * Anomaly detection settings
 */
export const AnomalyDetectionSchema = z.object({
  enabled: z.boolean(),
  benchmark_real_world_gap_threshold: z.number().min(0).max(1),
  perfect_score_investigation: z.boolean(),
});

export type AnomalyDetection = z.infer<typeof AnomalyDetectionSchema>;

/**
 * Proctoring configuration for gaming prevention
 */
export const ProctoringConfigSchema = z.object({
  enabled: z.boolean(),
  contamination_detection: ContaminationDetectionSchema,
  variance_injection: VarianceInjectionSchema,
  anomaly_detection: AnomalyDetectionSchema,
});

export type ProctoringConfig = z.infer<typeof ProctoringConfigSchema>;

/**
 * Target repository for real-world testing
 */
export const TargetRepoSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  issue_label: z.string().min(1),
  max_issues: z.number().int().positive(),
});

export type TargetRepo = z.infer<typeof TargetRepoSchema>;

/**
 * Baseline threshold configuration
 */
export const BaselineThresholdsSchema = z.object({
  duration_ms_increase_max: z.number().min(0),
  response_bytes_increase_max: z.number().min(0),
  pass_rate_decrease_max: z.number().min(0),
});

export type BaselineThresholds = z.infer<typeof BaselineThresholdsSchema>;

/**
 * Execution settings
 */
export const ExecutionConfigSchema = z.object({
  max_concurrency: z.number().int().positive(),
  retry_count: z.number().int().min(0),
  retry_delay_seconds: z.number().min(0),
  output_dir: z.string().min(1),
  baseline: z.object({
    path: z.string().min(1),
    thresholds: BaselineThresholdsSchema,
  }),
});

export type ExecutionConfig = z.infer<typeof ExecutionConfigSchema>;

/**
 * Reporting settings
 */
export const ReportingConfigSchema = z.object({
  formats: z.array(z.enum(["json", "markdown", "html"])).min(1),
  output_dir: z.string().min(1),
  timing_breakdown: z.boolean(),
  include_output_samples: z.boolean(),
  sample_limit: z.number().int().positive(),
});

export type ReportingConfig = z.infer<typeof ReportingConfigSchema>;

/**
 * Complete benchmark suite configuration
 */
export const BenchmarkConfigSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().min(1),
  tiers: z.array(TierConfigSchema).min(1),
  anchor_points: AnchorPointsConfigSchema,
  proctoring: ProctoringConfigSchema,
  target_repos: z.array(TargetRepoSchema),
  execution: ExecutionConfigSchema,
  reporting: ReportingConfigSchema,
});

export type BenchmarkConfig = z.infer<typeof BenchmarkConfigSchema>;

// =============================================================================
// Configuration Loader
// =============================================================================

/**
 * Default path to the benchmark suite configuration
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DEFAULT_CONFIG_PATH = resolve(__dirname, "suite.yaml");

/**
 * Error thrown when configuration loading or validation fails
 */
export class ConfigLoadError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "ConfigLoadError";
  }
}

/**
 * Load and validate the benchmark suite configuration
 *
 * @param configPath - Optional path to configuration file. Defaults to benchmarks/suite.yaml
 * @returns Validated BenchmarkConfig object
 * @throws ConfigLoadError if file doesn't exist, can't be parsed, or fails validation
 */
export function loadBenchmarkConfig(configPath?: string): BenchmarkConfig {
  const path = configPath ?? DEFAULT_CONFIG_PATH;

  // Check file exists
  if (!existsSync(path)) {
    throw new ConfigLoadError(`Configuration file not found: ${path}`);
  }

  // Read file
  let content: string;
  try {
    content = readFileSync(path, "utf-8");
  } catch (err) {
    throw new ConfigLoadError(`Failed to read configuration file: ${path}`, err);
  }

  // Parse YAML
  let parsed: unknown;
  try {
    parsed = parseYaml(content);
  } catch (err) {
    throw new ConfigLoadError(`Failed to parse YAML: ${path}`, err);
  }

  // Validate with Zod
  const result = BenchmarkConfigSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new ConfigLoadError(
      `Configuration validation failed:\n${issues}`,
      result.error
    );
  }

  return result.data;
}

/**
 * Get a specific tier configuration by ID
 *
 * @param config - The benchmark configuration
 * @param tierId - The tier ID to find
 * @returns The tier configuration or undefined if not found
 */
export function getTierById(
  config: BenchmarkConfig,
  tierId: string
): TierConfig | undefined {
  return config.tiers.find((t) => t.id === tierId);
}

/**
 * Get all test IDs from a tier
 *
 * @param tier - The tier configuration
 * @returns Array of test IDs
 */
export function getTestIds(tier: TierConfig): string[] {
  return tier.tests.map((t) => t.id);
}

/**
 * Get anchor point tests from configuration
 *
 * @param config - The benchmark configuration
 * @returns Array of anchor point test IDs
 */
export function getAnchorTestIds(config: BenchmarkConfig): string[] {
  if (!config.anchor_points.enabled) {
    return [];
  }
  return config.anchor_points.anchors.map((a) => a.test_id);
}

/**
 * Determine which tests to skip based on anchor point results
 *
 * @param config - The benchmark configuration
 * @param anchorResults - Map of anchor test ID to pass/fail result
 * @returns Array of test IDs to skip
 */
export function getTestsToSkip(
  config: BenchmarkConfig,
  anchorResults: Map<string, boolean>
): string[] {
  if (!config.anchor_points.enabled) {
    return [];
  }

  const testsToSkip: string[] = [];

  for (const rule of config.anchor_points.sampling_rules) {
    const anchorPassed = anchorResults.get(rule.trigger.anchor_id);
    const triggerMatches =
      (rule.trigger.result === "pass" && anchorPassed === true) ||
      (rule.trigger.result === "fail" && anchorPassed === false);

    if (triggerMatches) {
      // Apply skip probability
      for (const testId of rule.affected_tests) {
        if (Math.random() < rule.skip_probability) {
          testsToSkip.push(testId);
        }
      }
    }
  }

  return [...new Set(testsToSkip)]; // Deduplicate
}

/**
 * Check if proctoring features are enabled
 *
 * @param config - The benchmark configuration
 * @returns Object describing which proctoring features are active
 */
export function getProctoringStatus(config: BenchmarkConfig): {
  enabled: boolean;
  contamination: boolean;
  variance: boolean;
  anomaly: boolean;
} {
  return {
    enabled: config.proctoring.enabled,
    contamination:
      config.proctoring.enabled &&
      config.proctoring.contamination_detection.enabled,
    variance:
      config.proctoring.enabled && config.proctoring.variance_injection.enabled,
    anomaly:
      config.proctoring.enabled && config.proctoring.anomaly_detection.enabled,
  };
}
