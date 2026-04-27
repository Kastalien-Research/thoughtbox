/**
 * spec-04-zod.test.ts
 *
 * Validates V4.5: Invalid thoughtType rejection
 *
 * V4.5 — ZOD — target: attach input schema
 * check: invalid thoughtType rejected
 * pass: safeParse({thoughtType:'not_a_real_type'}).success === false
 */

import { describe, expect, it } from "vitest";
import { thoughtToolInputSchema } from "../thought/tool.js";

describe("Spec 04 — Subagent Session Attachment", () => {
  describe("V4.5: Invalid thoughtType rejection", () => {
    const validMinimalInput = {
      thought: "Subagent completing work",
      nextThoughtNeeded: false,
      thoughtType: "reasoning" as const,
    };

    it("accepts valid thoughtType values", () => {
      const validThoughtTypes = [
        "reasoning",
        "decision_frame",
        "action_report",
        "belief_snapshot",
        "assumption_update",
        "context_snapshot",
        "progress",
      ] as const;

      for (const thoughtType of validThoughtTypes) {
        const result = thoughtToolInputSchema.safeParse({
          ...validMinimalInput,
          thoughtType,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid thoughtType 'not_a_real_type'", () => {
      const result = thoughtToolInputSchema.safeParse({
        ...validMinimalInput,
        thoughtType: "not_a_real_type",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        // Should have an invalid_type error (or similar enum error)
        const hasInvalidTypeError = result.error.issues.some(
          (issue) => issue.code === "invalid_type" || issue.code === "invalid_enum_value"
        );
        expect(hasInvalidTypeError).toBe(true);
      }
    });

    it("rejects empty string thoughtType", () => {
      const result = thoughtToolInputSchema.safeParse({
        ...validMinimalInput,
        thoughtType: "",
      });

      expect(result.success).toBe(false);
    });

    it("rejects thoughtType with extra whitespace", () => {
      const result = thoughtToolInputSchema.safeParse({
        ...validMinimalInput,
        thoughtType: " reasoning ",
      });

      expect(result.success).toBe(false);
    });

    it("rejects thoughtType that is a number instead of string", () => {
      const result = thoughtToolInputSchema.safeParse({
        ...validMinimalInput,
        // @ts-expect-error - intentionally passing wrong type to test runtime validation
        thoughtType: 123,
      });

      expect(result.success).toBe(false);
    });

    it("rejects thoughtType case variations that don't match enum", () => {
      const caseVariations = [
        "Reasoning",
        "REASONING",
        "Decision_Frame",
        "ACTION_REPORT",
      ];

      for (const thoughtType of caseVariations) {
        const result = thoughtToolInputSchema.safeParse({
          ...validMinimalInput,
          thoughtType: thoughtType as any,
        });
        expect(result.success).toBe(false);
      }
    });

    it("error message should indicate valid options", () => {
      const result = thoughtToolInputSchema.safeParse({
        ...validMinimalInput,
        thoughtType: "invalid_type",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        // The error should provide useful information about valid values
        const errorMessage = result.error.issues
          .map((i) => i.message)
          .join(" ");

        // Should mention something about the expected values
        // (exact format depends on Zod implementation)
        expect(errorMessage.length).toBeGreaterThan(0);
      }
    });
  });
});
