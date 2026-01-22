/**
 * Behavioral Contract Verification (BCV)
 *
 * Implements the four verification layers from SPEC-SIL-BCV:
 * 1. VARIANCE - Different inputs must produce different outputs
 * 2. CONTENT_COUPLED - Output must reference input-specific content
 * 3. TRACE_EXISTS - Reasoning artifacts must exist
 * 4. LLM_JUDGES - Semantic evaluation of reasoning quality
 *
 * These contracts verify that AI components ACTUALLY REASON, not just
 * return structurally correct but hardcoded/random values.
 */

import Anthropic from "@anthropic-ai/sdk";
import { BehavioralContractResult, BehavioralVerificationReport } from "./types.js";

// ============================================================================
// VARIANCE: Different inputs must produce different outputs
// ============================================================================

export async function VARIANCE<T, R>(
  fn: (input: T) => Promise<R>,
  input1: T,
  input2: T,
  extractField: (result: R) => unknown
): Promise<BehavioralContractResult> {
  try {
    const result1 = await fn(input1);
    const result2 = await fn(input2);
    const field1 = extractField(result1);
    const field2 = extractField(result2);

    const field1Str = JSON.stringify(field1);
    const field2Str = JSON.stringify(field2);

    if (field1Str === field2Str) {
      return {
        contract: "VARIANCE",
        passed: false,
        details: `Different inputs produced identical outputs`,
        failureReason:
          `Input1: ${JSON.stringify(input1).substring(0, 100)}...\n` +
          `Input2: ${JSON.stringify(input2).substring(0, 100)}...\n` +
          `Output field (identical): ${field1Str.substring(0, 200)}`,
      };
    }

    return {
      contract: "VARIANCE",
      passed: true,
      details: `Outputs differ as expected. Field1: ${field1Str.substring(0, 50)}... Field2: ${field2Str.substring(0, 50)}...`,
    };
  } catch (error) {
    return {
      contract: "VARIANCE",
      passed: false,
      details: "Contract execution failed",
      failureReason: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// CONTENT_COUPLED: Output must reference input-specific content
// ============================================================================

export async function CONTENT_COUPLED<T, R>(
  fn: (input: T) => Promise<R>,
  input: T,
  inputMarker: string,
  extractOutputText: (result: R) => string
): Promise<BehavioralContractResult> {
  try {
    const result = await fn(input);
    const outputText = extractOutputText(result);

    // Check for exact marker
    if (outputText.includes(inputMarker)) {
      return {
        contract: "CONTENT_COUPLED",
        passed: true,
        details: `Output contains marker "${inputMarker}"`,
      };
    }

    // Check for normalized version (lowercase, trimmed)
    const normalizedMarker = inputMarker.toLowerCase().trim();
    const normalizedOutput = outputText.toLowerCase();

    if (normalizedOutput.includes(normalizedMarker)) {
      return {
        contract: "CONTENT_COUPLED",
        passed: true,
        details: `Output contains normalized marker "${normalizedMarker}"`,
      };
    }

    // Check for partial matches (at least 50% of marker words)
    const markerWords = normalizedMarker.split(/\s+/).filter((w) => w.length > 3);
    const matchedWords = markerWords.filter((w) => normalizedOutput.includes(w));
    const matchRatio = matchedWords.length / markerWords.length;

    if (matchRatio >= 0.5) {
      return {
        contract: "CONTENT_COUPLED",
        passed: true,
        details: `Output contains ${Math.round(matchRatio * 100)}% of marker words: ${matchedWords.join(", ")}`,
      };
    }

    return {
      contract: "CONTENT_COUPLED",
      passed: false,
      details: `Output does not reference input`,
      failureReason:
        `Expected marker: "${inputMarker}"\n` +
        `Output text preview: ${outputText.substring(0, 500)}...`,
    };
  } catch (error) {
    return {
      contract: "CONTENT_COUPLED",
      passed: false,
      details: "Contract execution failed",
      failureReason: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// TRACE_EXISTS: Reasoning artifacts must exist
// ============================================================================

export interface TraceInfo {
  length: number;
  thoughts: Array<{ content: string; id?: string }>;
}

export async function TRACE_EXISTS<T, R>(
  fn: (input: T) => Promise<R>,
  input: T,
  getTrace: () => TraceInfo | Promise<TraceInfo>,
  minThoughts: number = 3
): Promise<BehavioralContractResult> {
  try {
    await fn(input);
    const trace = await getTrace();

    // Check minimum thoughts
    if (trace.length < minThoughts) {
      return {
        contract: "TRACE_EXISTS",
        passed: false,
        details: `Insufficient reasoning trace`,
        failureReason: `Expected >= ${minThoughts} thoughts, got ${trace.length}`,
      };
    }

    // Check that thoughts show progression (reference each other)
    if (trace.thoughts.length >= 2) {
      const lastThought = trace.thoughts[trace.thoughts.length - 1];
      const hasReferences = /S\d+|thought\s*\d+|earlier|above|previous|prior/i.test(
        lastThought.content
      );

      if (!hasReferences) {
        // Soft warning, not failure
        return {
          contract: "TRACE_EXISTS",
          passed: true,
          details: `${trace.length} thoughts recorded. Warning: Final thought may not reference earlier reasoning.`,
        };
      }
    }

    return {
      contract: "TRACE_EXISTS",
      passed: true,
      details: `${trace.length} thoughts recorded with progression`,
    };
  } catch (error) {
    return {
      contract: "TRACE_EXISTS",
      passed: false,
      details: "Contract execution failed",
      failureReason: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// LLM_JUDGES: Semantic evaluation of reasoning quality
// ============================================================================

export type JudgeFunction = (prompt: string) => Promise<string>;

export async function LLM_JUDGES<T, R>(
  fn: (input: T) => Promise<R>,
  input: T,
  judge: JudgeFunction,
  minScore: number = 6
): Promise<BehavioralContractResult> {
  try {
    const result = await fn(input);

    const judgePrompt = `
You are evaluating whether an AI system's output demonstrates actual reasoning about a given input.

INPUT:
${JSON.stringify(input, null, 2)}

OUTPUT:
${JSON.stringify(result, null, 2)}

Score 1-10 on each dimension:
1. Does the output reference SPECIFIC details from the input? (not generic responses)
2. Does the reasoning show logical progression toward the output?
3. Would this output plausibly address the input's specific concerns?
4. Is the assessment tailored to this input or could it apply to any input?

Respond with ONLY four numbers separated by commas (e.g., "7,8,6,7")
`.trim();

    const response = await judge(judgePrompt);
    const scores = response
      .trim()
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));

    if (scores.length !== 4) {
      return {
        contract: "LLM_JUDGES",
        passed: false,
        details: `Invalid judge response format`,
        failureReason: `Expected 4 scores, got: "${response}"`,
      };
    }

    const minObserved = Math.min(...scores);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    if (minObserved < minScore) {
      return {
        contract: "LLM_JUDGES",
        passed: false,
        details: `Semantic verification failed`,
        failureReason: `Scores: ${scores.join(", ")} (avg: ${avgScore.toFixed(1)}). Minimum: ${minObserved}, required: ${minScore}`,
      };
    }

    return {
      contract: "LLM_JUDGES",
      passed: true,
      details: `Scores: ${scores.join(", ")} (avg: ${avgScore.toFixed(1)}, min: ${minObserved})`,
    };
  } catch (error) {
    return {
      contract: "LLM_JUDGES",
      passed: false,
      details: "Contract execution failed",
      failureReason: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// Default Judge Implementation (uses Haiku for cost-effectiveness)
// ============================================================================

export function createDefaultJudge(): JudgeFunction {
  const client = new Anthropic();

  return async (prompt: string): Promise<string> => {
    const response = await client.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 50,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock ? textBlock.text : "";
  };
}

// ============================================================================
// Full Verification Suite
// ============================================================================

export async function runBehavioralVerification<T, R>(
  functionName: string,
  fn: (input: T) => Promise<R>,
  testInputs: { input1: T; input2: T; marker: string },
  extractField: (result: R) => unknown,
  extractText: (result: R) => string,
  getTrace?: () => TraceInfo | Promise<TraceInfo>
): Promise<BehavioralVerificationReport> {
  const results: BehavioralContractResult[] = [];

  // VARIANCE
  console.log(`  Running VARIANCE...`);
  results.push(
    await VARIANCE(fn, testInputs.input1, testInputs.input2, extractField)
  );

  // CONTENT_COUPLED
  console.log(`  Running CONTENT_COUPLED...`);
  results.push(
    await CONTENT_COUPLED(fn, testInputs.input1, testInputs.marker, extractText)
  );

  // TRACE_EXISTS (if trace getter provided)
  if (getTrace) {
    console.log(`  Running TRACE_EXISTS...`);
    results.push(await TRACE_EXISTS(fn, testInputs.input1, getTrace));
  }

  // LLM_JUDGES
  console.log(`  Running LLM_JUDGES...`);
  const judge = createDefaultJudge();
  results.push(await LLM_JUDGES(fn, testInputs.input1, judge));

  const report: BehavioralVerificationReport = {
    functionName,
    timestamp: new Date(),
    results,
    allPassed: results.every((r) => r.passed),
  };

  return report;
}

// ============================================================================
// Report Formatting
// ============================================================================

export function formatVerificationReport(
  report: BehavioralVerificationReport
): string {
  const lines: string[] = [
    `=== Behavioral Contract Verification Report ===`,
    `Function: ${report.functionName}`,
    `Timestamp: ${report.timestamp.toISOString()}`,
    `Overall: ${report.allPassed ? "PASS" : "FAIL"}`,
    ``,
  ];

  for (const result of report.results) {
    const status = result.passed ? "✓" : "✗";
    lines.push(`${status} ${result.contract}: ${result.details}`);
    if (result.failureReason) {
      const indented = result.failureReason
        .split("\n")
        .map((l) => `    ${l}`)
        .join("\n");
      lines.push(indented);
    }
  }

  return lines.join("\n");
}
