#!/usr/bin/env npx tsx
/**
 * Agentic Test Runner for ThoughtBox MCP Server
 *
 * This script implements "agentic scripts" - atomic units of functional programming
 * that incorporate agentic non-determinism. It uses the Claude Agent SDK to spawn
 * a fresh agent with an MCP client connected to the ThoughtBox server, then runs
 * behavioral tests described in natural language.
 *
 * Usage:
 *   npx tsx scripts/agentic-test.ts [test-file.md]
 *   npx tsx scripts/agentic-test.ts --tool thick_read
 *   npx tsx scripts/agentic-test.ts --all
 *
 * The agent reasons about whether tool behavior matches expectations, providing
 * semantic testing rather than brittle unit tests.
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..");

// ============================================================================
// Behavioral Test Specifications
// ============================================================================

const THICK_READ_TESTS = `
# Behavioral Tests: thick_read Tool

## Test 1: Basic File Reading with Git Context
**Action**: Call thick_read on src/index.ts with depth "standard"
**Expected**:
- Returns file content (non-empty string)
- isGitRepo should be true (this is a git repository)
- recentCommits array should have at least 1 commit
- blame.summary should include author statistics
**Verify**: Content contains "import" statements (it's a TypeScript file)

## Test 2: Shallow Depth (Performance Mode)
**Action**: Call thick_read on package.json with depth "shallow"
**Expected**:
- Returns file content with package name "@kastalien-research/thoughtbox"
- recentCommits should have at most 3 entries (shallow limit)
- blame should be undefined or minimal (skipped for performance)

## Test 3: Non-Existent File Handling
**Action**: Call thick_read on "this-file-does-not-exist.xyz"
**Expected**:
- Should return an error response
- Error message should be clear and actionable
- Should NOT crash or return undefined

## Test 4: Line Range Filtering
**Action**: Call thick_read on package.json with lineRange { start: 1, end: 10 }
**Expected**:
- Content should be limited to approximately 10 lines
- Should include the opening brace and name field

## Test 5: Deep Mode with Full Blame
**Action**: Call thick_read on README.md with depth "deep"
**Expected**:
- blame.lines array should be present (per-line attribution)
- Each blame line should have author, date, and commit info
`;

const THOUGHTBOX_TESTS = `
# Behavioral Tests: thoughtbox Tool (Structured Reasoning)

## Test 1: Start New Reasoning Session
**Action**: Call thoughtbox with thought "Analyzing test framework", thoughtNumber 1, totalThoughts 3, nextThoughtNeeded true
**Expected**:
- Returns acknowledgment of thought recorded
- Should create or reference a session
- Response should include guidance or pattern suggestions

## Test 2: Continue Reasoning Chain
**Action**: After Test 1, call thoughtbox with thought "Second step analysis", thoughtNumber 2, totalThoughts 3, nextThoughtNeeded true
**Expected**:
- Should maintain context from previous thought
- thoughtNumber should be accepted and recorded

## Test 3: Complete Reasoning Session
**Action**: Call thoughtbox with thought "Final conclusion", thoughtNumber 3, totalThoughts 3, nextThoughtNeeded false
**Expected**:
- Session should be marked complete
- Should provide summary or final acknowledgment
`;

const MENTAL_MODELS_TESTS = `
# Behavioral Tests: mental_models Tool

## Test 1: List Available Models
**Action**: Call mental_models with operation "list_models"
**Expected**:
- Returns array of available mental models
- Each model should have name and description
- Should include at least 5 models

## Test 2: Get Specific Model
**Action**: Call mental_models with operation "get_model", args { model: "first_principles" }
**Expected**:
- Returns detailed model information
- Should include process steps or framework
- Should be actionable guidance

## Test 3: List by Tag
**Action**: Call mental_models with operation "list_models", args { tag: "debugging" }
**Expected**:
- Returns filtered list of models
- All returned models should relate to debugging
`;

const TEST_SUITES: Record<string, string> = {
  "thick_read": THICK_READ_TESTS,
  "thoughtbox": THOUGHTBOX_TESTS,
  "mental_models": MENTAL_MODELS_TESTS,
};

// ============================================================================
// Test Runner
// ============================================================================

interface TestResult {
  tool: string;
  passed: number;
  failed: number;
  details: string;
}

async function runBehavioralTests(testSpec: string, toolName: string): Promise<TestResult> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Running behavioral tests for: ${toolName}`);
  console.log(`${"=".repeat(60)}\n`);

  const systemPrompt = `You are a behavioral test agent for the ThoughtBox MCP server.

Your job is to:
1. Execute each test described in the test specification
2. Invoke the appropriate MCP tools
3. Compare actual results against expected behavior
4. Report PASS or FAIL for each test with clear reasoning

Important guidelines:
- Be precise about what you observe vs what was expected
- If a test fails, explain WHY it failed
- Consider edge cases and error handling
- Tests are behavioral - focus on semantic correctness, not exact string matching

After running all tests, provide a summary in this format:
---
SUMMARY
Tests Passed: X
Tests Failed: Y
Overall: PASS/FAIL
---`;

  const prompt = `Execute the following behavioral tests and report results:

${testSpec}

For each test:
1. Call the MCP tool with the specified parameters
2. Examine the response
3. Verify it matches expected behavior
4. Report PASS or FAIL with explanation

Begin testing now.`;

  let result: TestResult = {
    tool: toolName,
    passed: 0,
    failed: 0,
    details: "",
  };

  try {
    for await (const message of query({
      prompt,
      options: {
        systemPrompt,
        mcpServers: {
          thoughtbox: {
            command: "node",
            args: [join(PROJECT_ROOT, "dist/index.js")],
            env: {
              ...process.env,
              NODE_ENV: "test",
            },
          },
        },
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        cwd: PROJECT_ROOT,
      },
    })) {
      // Process streaming messages
      if (message.type === "assistant" && message.message?.content) {
        for (const block of message.message.content) {
          if ("text" in block) {
            console.log(block.text);
            result.details += block.text + "\n";

            // Parse summary if present
            const summaryMatch = block.text.match(/Tests Passed:\s*(\d+)/);
            const failedMatch = block.text.match(/Tests Failed:\s*(\d+)/);
            if (summaryMatch) result.passed = parseInt(summaryMatch[1]);
            if (failedMatch) result.failed = parseInt(failedMatch[1]);
          } else if ("name" in block) {
            console.log(`  [Tool Call] ${block.name}`);
          }
        }
      } else if (message.type === "result") {
        if (message.subtype === "success") {
          console.log(`\n[Agent completed successfully]`);
        } else {
          console.error(`\n[Agent error: ${message.subtype}]`);
          if ("errors" in message) {
            console.error(message.errors);
          }
        }
      } else if (message.type === "system" && message.subtype === "init") {
        const mcpStatus = message.mcp_servers?.find(s => s.name === "thoughtbox");
        if (mcpStatus?.status !== "connected") {
          console.error(`WARNING: ThoughtBox MCP server status: ${mcpStatus?.status}`);
        } else {
          console.log(`[ThoughtBox MCP server connected]`);
        }
      }
    }
  } catch (error) {
    console.error("Test runner error:", error);
    result.details = `Error: ${error}`;
  }

  return result;
}

async function runTestFromFile(filePath: string): Promise<TestResult> {
  const absolutePath = resolve(process.cwd(), filePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Test file not found: ${absolutePath}`);
  }

  const testSpec = readFileSync(absolutePath, "utf-8");
  const toolName = filePath.replace(/\.test\.md$/, "").split("/").pop() || "custom";

  return runBehavioralTests(testSpec, toolName);
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
Agentic Test Runner for ThoughtBox MCP Server

Usage:
  npx tsx scripts/agentic-test.ts --tool <tool_name>   Run tests for specific tool
  npx tsx scripts/agentic-test.ts --all                Run all built-in test suites
  npx tsx scripts/agentic-test.ts <file.md>            Run tests from custom file
  npx tsx scripts/agentic-test.ts --list               List available test suites

Available tools: ${Object.keys(TEST_SUITES).join(", ")}
`);
    process.exit(0);
  }

  if (args.includes("--list")) {
    console.log("\nAvailable test suites:");
    for (const [name, spec] of Object.entries(TEST_SUITES)) {
      const testCount = (spec.match(/## Test \d+/g) || []).length;
      console.log(`  ${name}: ${testCount} tests`);
    }
    process.exit(0);
  }

  const results: TestResult[] = [];

  if (args.includes("--all")) {
    for (const [toolName, testSpec] of Object.entries(TEST_SUITES)) {
      const result = await runBehavioralTests(testSpec, toolName);
      results.push(result);
    }
  } else if (args.includes("--tool")) {
    const toolIndex = args.indexOf("--tool");
    const toolName = args[toolIndex + 1];

    if (!toolName || !TEST_SUITES[toolName]) {
      console.error(`Unknown tool: ${toolName}`);
      console.error(`Available: ${Object.keys(TEST_SUITES).join(", ")}`);
      process.exit(1);
    }

    const result = await runBehavioralTests(TEST_SUITES[toolName], toolName);
    results.push(result);
  } else {
    // Assume it's a file path
    const result = await runTestFromFile(args[0]);
    results.push(result);
  }

  // Final summary
  console.log("\n" + "=".repeat(60));
  console.log("FINAL SUMMARY");
  console.log("=".repeat(60));

  let totalPassed = 0;
  let totalFailed = 0;

  for (const result of results) {
    console.log(`${result.tool}: ${result.passed} passed, ${result.failed} failed`);
    totalPassed += result.passed;
    totalFailed += result.failed;
  }

  console.log("-".repeat(60));
  console.log(`Total: ${totalPassed} passed, ${totalFailed} failed`);
  console.log("=".repeat(60));

  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(console.error);
