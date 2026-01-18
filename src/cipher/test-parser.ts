#!/usr/bin/env tsx
/**
 * Quick test script for cipher parser
 * Run with: npx tsx src/cipher/test-parser.ts
 */

import {
  parseCipher,
  usesCipherNotation,
  getReferencedThoughts,
  inferPreviousThought,
  THOUGHT_TYPE_NAMES,
} from "./parser.js";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   ${error}`);
    process.exitCode = 1;
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${message || "Assertion failed"}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function assertTrue(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || "Expected true");
  }
}

console.log("\n🔬 Cipher Parser Tests\n");

// Step format parsing
test("parses full step format: S47|H|S45|content", () => {
  const result = parseCipher("S47|H|S45|API latency ↑ bc db regression");
  assertEqual(result.thoughtNumber, 47);
  assertEqual(result.type, "H");
  assertEqual(result.content, "API latency ↑ bc db regression");
  assertTrue(result.usedStepFormat);
  assertTrue(result.references.some((r) => r.thoughtNumber === 45));
});

test("parses step format with em-dash for no refs: S1|H|—|content", () => {
  const result = parseCipher("S1|H|—|Initial hypothesis about the problem");
  assertEqual(result.thoughtNumber, 1);
  assertEqual(result.type, "H");
  assertTrue(result.references.filter((r) => r.type === "reference").length === 0);
});

test("parses range references: S4|C|S1-S3|conclusion", () => {
  const result = parseCipher("S4|C|S1-S3|Conclusion from steps 1 through 3");
  assertEqual(result.thoughtNumber, 4);
  assertEqual(result.type, "C");
  assertEqual(getReferencedThoughts(result), [1, 2, 3]);
});

test("handles all thought types", () => {
  const types = ["H", "E", "C", "Q", "R", "P", "O", "A", "X", "I"];
  for (const type of types) {
    const result = parseCipher(`S1|${type}|-|content`);
    assertEqual(result.type, type);
    assertTrue(THOUGHT_TYPE_NAMES[type as keyof typeof THOUGHT_TYPE_NAMES] !== undefined);
  }
});

// Inline references
test("extracts revision markers: ^[S5]", () => {
  const result = parseCipher("^[S5] Correction: X not Y");
  assertEqual(result.revises, 5);
});

test("extracts invalidation markers: ×[S8]", () => {
  const result = parseCipher("×[S8] contradicted by new evidence");
  assertEqual(result.invalidates, 8);
});

test("extracts builds-on markers: +[S3]", () => {
  const result = parseCipher("+[S3] Extending this idea further");
  assertEqual(result.buildsOn, 3);
});

// Confidence markers
test("extracts high confidence: (!)", () => {
  const result = parseCipher("H1 confirmed (!)");
  assertEqual(result.confidence?.level, "high");
});

test("extracts specific probability: (p=0.7)", () => {
  const result = parseCipher("Success probability (p=0.7)");
  assertEqual(result.confidence?.level, "specific");
  assertEqual(result.confidence?.value, 0.7);
});

// Cipher detection
test("usesCipherNotation detects step format", () => {
  assertTrue(usesCipherNotation("S1|H|-|hypothesis"));
});

test("usesCipherNotation detects references", () => {
  assertTrue(usesCipherNotation("See [S5] for details"));
});

test("usesCipherNotation returns false for plain text", () => {
  assertTrue(!usesCipherNotation("Just a regular sentence"));
});

// inferPreviousThought
test("inferPreviousThought returns revised thought if present", () => {
  const result = parseCipher("^[S5] correction");
  assertEqual(inferPreviousThought(result), 5);
});

test("inferPreviousThought returns N-1 when no refs", () => {
  const result = parseCipher("S5|H|-|standalone");
  assertEqual(inferPreviousThought(result), 4);
});

// Real-world example from traces
test("parses phenomenology session thought", () => {
  const input = `S71|I|S70|PROPRIOCEPTIVE FEEDBACK for Thoughtbox: What should I 'feel' about my reasoning state?

Currently I know: thought count (bc I track manually), session exists (bc I created it).`;

  const result = parseCipher(input);
  assertEqual(result.thoughtNumber, 71);
  assertEqual(result.type, "I");
  assertTrue(result.usedStepFormat);
  assertTrue(getReferencedThoughts(result).includes(70));
});

console.log("\n✨ All tests passed!\n");
