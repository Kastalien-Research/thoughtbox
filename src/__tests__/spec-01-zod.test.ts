/**
 * spec-01-zod.test.ts
 *
 * Validates V1.2: Schema strict mode enforcement for thoughtNumber
 *
 * V1.2 — ZOD — target: src/thought/tool.ts thoughtToolInputSchema
 * check: schema is .strict() (or thoughtNumber is removed from the z.object shape entirely)
 * pass: safeParse({...thoughtNumber:5}).success === false with code: 'unrecognized_keys'
 *       (strict) or the field is absent from schema.shape
 */

import { describe, expect, it } from "vitest";
import { thoughtToolInputSchema } from "../thought/tool.js";

describe("Spec 01 — Auto-Numbering Surfacing", () => {
  describe("V1.2: thoughtNumber strict mode enforcement", () => {
    /**
     * Valid minimal input that should pass schema validation.
     * All required fields present, no extra keys.
     */
    const validMinimalInput = {
      thought: "Analyzing the problem",
      nextThoughtNeeded: true,
      thoughtType: "reasoning" as const,
    };

    it("accepts valid minimal input without thoughtNumber", () => {
      const result = thoughtToolInputSchema.safeParse(validMinimalInput);
      expect(result.success).toBe(true);
    });

    it("rejects input with thoughtNumber via strict mode (unrecognized_keys)", () => {
      const inputWithThoughtNumber = {
        ...validMinimalInput,
        thoughtNumber: 5,
      };

      const result = thoughtToolInputSchema.safeParse(inputWithThoughtNumber);

      // The schema should reject thoughtNumber via strict mode
      expect(result.success).toBe(false);

      if (!result.success) {
        // Check for unrecognized_keys error code (from .strict())
        const hasUnrecognizedKeysError = result.error.issues.some(
          (issue) => issue.code === "unrecognized_keys"
        );
        expect(hasUnrecognizedKeysError).toBe(true);

        // Verify the error mentions thoughtNumber
        const errorMessage = result.error.issues
          .filter((issue) => issue.code === "unrecognized_keys")
          .map((issue) => issue.message)
          .join(" ");
        expect(errorMessage).toContain("thoughtNumber");
      }
    });

    it("rejects thoughtNumber regardless of how schema enforces it", () => {
      // V1.2 requires thoughtNumber to be rejected - either via strict mode
      // or by not being in the schema at all. Either way, parsing must fail.
      const result = thoughtToolInputSchema.safeParse({
        ...validMinimalInput,
        thoughtNumber: 1,
      });
      expect(result.success).toBe(false);

      if (!result.success) {
        const hasUnrecognizedKeysError = result.error.issues.some(
          (issue) => issue.code === "unrecognized_keys"
        );
        const errorMessage = result.error.issues.map((i) => i.message).join(" ");

        // Either we get unrecognized_keys OR the field simply isn't accepted
        expect(
          hasUnrecognizedKeysError || errorMessage.length > 0,
          "Expected thoughtNumber to be rejected with an error"
        ).toBe(true);
      }
    });

    it("multiple extra keys should all be caught by strict mode", () => {
      const inputWithExtraKeys = {
        ...validMinimalInput,
        thoughtNumber: 1,
        totalThoughts: 10,
        someOtherField: "value",
      };

      const result = thoughtToolInputSchema.safeParse(inputWithExtraKeys);
      expect(result.success).toBe(false);

      if (!result.success) {
        // Should report unrecognized_keys errors
        const unrecognizedKeysIssues = result.error.issues.filter(
          (issue) => issue.code === "unrecognized_keys"
        );
        expect(unrecognizedKeysIssues.length).toBeGreaterThan(0);
      }
    });
  });
});
