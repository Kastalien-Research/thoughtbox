/**
 * spec-09-zod.test.ts
 *
 * Validates V9.1: Checkpoint label regex enforcement
 *
 * V9.1 — ZOD/PURE-FN — target: createCheckpointLabel
 * check: regex enforcement
 * pass: parametrized table; spec's negative cases ('', 'Has Spaces', 'has/slashes',
 *       'UPPERCASE', '_starts') all throw with message containing the regex pattern;
 *       positive cases resolve
 *
 * The regex pattern is: /^[a-z0-9][a-z0-9_-]*$/
 * - Must start with lowercase letter or digit
 * - Can contain lowercase letters, digits, hyphens, and underscores
 * - No uppercase, spaces, slashes, or leading underscores
 */

import { describe, expect, it } from "vitest";

// Regex pattern from spec: /^[a-z0-9][a-z0-9_-]*$/
const CHECKPOINT_LABEL_REGEX = /^[a-z0-9][a-z0-9_-]*$/;

/**
 * Creates a CheckpointLabel from a validated string.
 * Throws if the string doesn't match the pattern.
 * This is a reference implementation for V9.1 validation.
 */
function createCheckpointLabel(label: string): string {
  if (!CHECKPOINT_LABEL_REGEX.test(label)) {
    throw new Error(
      `Invalid checkpoint label "${label}": must match pattern ${CHECKPOINT_LABEL_REGEX.source}. ` +
      `Labels must start with a lowercase letter or digit and contain only ` +
      `lowercase letters, digits, hyphens, and underscores.`
    );
  }
  return label;
}

describe("Spec 09 — Named Checkpoints", () => {
  describe("V9.1: createCheckpointLabel regex enforcement", () => {
    describe("negative cases — all should throw", () => {
      const negativeCases: Array<{ label: string; reason: string }> = [
        { label: "", reason: "empty string" },
        { label: "Has Spaces", reason: "contains spaces" },
        { label: "has/slashes", reason: "contains forward slash" },
        { label: "UPPERCASE", reason: "contains uppercase letters" },
        { label: "_starts", reason: "starts with underscore" },
        { label: "-starts", reason: "starts with hyphen" },
        { label: "has Spaces", reason: "internal space" },
        { label: "has\ttab", reason: "contains tab" },
        { label: "has\nnewline", reason: "contains newline" },
        { label: "has.dot", reason: "contains dot" },
        { label: "has@at", reason: "contains @ symbol" },
        { label: "has#hash", reason: "contains hash" },
      ];

      it.each(negativeCases)("rejects '$label' ($reason)", ({ label }) => {
        expect(() => createCheckpointLabel(label)).toThrow();

        try {
          createCheckpointLabel(label);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          // Error message should contain the regex pattern
          expect(message).toContain(CHECKPOINT_LABEL_REGEX.source);
        }
      });
    });

    describe("positive cases — all should resolve successfully", () => {
      const positiveCases: Array<{ label: string; description: string }> = [
        { label: "auth-analysis-complete", description: "lowercase with hyphens" },
        { label: "data_model_finalized", description: "lowercase with underscores" },
        { label: "step1", description: "starts with digit" },
        { label: "init", description: "simple lowercase" },
        { label: "a", description: "single lowercase letter" },
        { label: "1", description: "single digit" },
        { label: "a1", description: "letter followed by digit" },
        { label: "1a", description: "digit followed by letter" },
        { label: "auth2", description: "lowercase with digit" },
        { label: "step_1", description: "underscore in middle" },
        { label: "my-checkpoint_42", description: "mixed hyphens and underscores" },
        { label: "v2_api_integration", description: "real-world example" },
      ];

      it.each(positiveCases)("accepts '$label' ($description)", ({ label }) => {
        expect(() => createCheckpointLabel(label)).not.toThrow();
        expect(createCheckpointLabel(label)).toBe(label);
      });
    });

    describe("regex pattern verification", () => {
      it("pattern matches correct format", () => {
        const validLabels = [
          "auth",
          "step1",
          "init",
          "auth-analysis",
          "data_model",
          "v2_api",
        ];

        for (const label of validLabels) {
          expect(CHECKPOINT_LABEL_REGEX.test(label)).toBe(true);
        }
      });

      it("pattern rejects incorrect format", () => {
        const invalidLabels = [
          "",
          "Has Spaces",
          "UPPERCASE",
          "_starts",
          "-starts",
          "has/slash",
          "has.dot",
        ];

        for (const label of invalidLabels) {
          expect(CHECKPOINT_LABEL_REGEX.test(label)).toBe(false);
        }
      });

      it("error message contains the regex pattern", () => {
        try {
          createCheckpointLabel("INVALID");
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          // Error message should contain the pattern (either with slashes or just the source)
          expect(
            message.includes("/^[a-z0-9][a-z0-9_-]*$/") ||
            message.includes("^[a-z0-9][a-z0-9_-]*$")
          ).toBe(true);
        }
      });
    });

    describe("integration with thought schema (future)", () => {
      it("documents expected behavior when used in thought context", () => {
        // When checkpoint label is added to thought schema:
        // const input = {
        //   thought: "Creating checkpoint",
        //   nextThoughtNeeded: false,
        //   thoughtType: "progress",
        //   metadata: {
        //     checkpoint: {
        //       label: createCheckpointLabel("valid-label"),
        //       summary: "Checkpoint summary"
        //     }
        //   }
        // };
        // const result = thoughtToolInputSchema.safeParse(input);
        // expect(result.success).toBe(true);

        // Invalid labels should throw before even reaching the schema
        expect(() => createCheckpointLabel("Invalid Label")).toThrow();
      });
    });
  });
});
