#!/usr/bin/env npx tsx
/**
 * verify-assumptions.ts
 *
 * Reads .assumptions/registry.jsonl, executes each record's verification_method,
 * and updates last_verified / status / confidence accordingly.
 *
 * Usage: npx tsx scripts/utils/verify-assumptions.ts
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const REGISTRY_PATH = path.join(ROOT, ".assumptions", "registry.jsonl");
const CONFIDENCE_DECREMENT = 0.2;
const SUSPECT_THRESHOLD = 0.3;
const VERIFICATION_TIMEOUT_MS = 10_000;

interface Assumption {
  id: string;
  category: string;
  claim: string;
  confidence: number;
  status: string;
  last_verified: string;
  verification_method: string;
  failure_history: Array<{ date: string; error: string }>;
  [key: string]: unknown;
}

function loadRegistry(): Assumption[] {
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.log("No registry found at", REGISTRY_PATH);
    return [];
  }
  const lines = fs
    .readFileSync(REGISTRY_PATH, "utf8")
    .split("\n")
    .filter((l) => l.trim().length > 0);
  return lines.map((line) => JSON.parse(line) as Assumption);
}

function saveRegistry(assumptions: Assumption[]): void {
  const content = assumptions.map((a) => JSON.stringify(a)).join("\n") + "\n";
  fs.writeFileSync(REGISTRY_PATH, content, "utf8");
}

function verify(assumption: Assumption): { passed: boolean; error?: string } {
  const method = assumption.verification_method;
  if (!method || method.trim().length === 0) {
    return { passed: true }; // No verification method — skip
  }

  try {
    execSync(method, {
      cwd: ROOT,
      timeout: VERIFICATION_TIMEOUT_MS,
      stdio: "pipe",
    });
    return { passed: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message.slice(0, 200) : "Unknown error";
    return { passed: false, error: message };
  }
}

function main(): void {
  const assumptions = loadRegistry();
  if (assumptions.length === 0) {
    console.log("No assumptions to verify.");
    return;
  }

  const now = new Date().toISOString();
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const a of assumptions) {
    // Skip non-active assumptions
    if (a.status !== "active" && a.status !== "suspect") {
      skipped++;
      continue;
    }

    const result = verify(a);
    if (result.passed) {
      a.last_verified = now;
      passed++;
      console.log(`  PASS: ${a.id}`);
    } else {
      a.confidence = Math.max(0, a.confidence - CONFIDENCE_DECREMENT);
      a.failure_history.push({ date: now, error: result.error ?? "" });
      if (a.confidence < SUSPECT_THRESHOLD) {
        a.status = "suspect";
      }
      failed++;
      console.log(`  FAIL: ${a.id} (confidence → ${a.confidence.toFixed(2)})`);
    }
  }

  saveRegistry(assumptions);
  console.log(
    `\nVerification complete: ${passed} passed, ${failed} failed, ${skipped} skipped`
  );
}

main();
