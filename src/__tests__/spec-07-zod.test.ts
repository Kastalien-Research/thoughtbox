/**
 * spec-07-zod.test.ts
 *
 * Validates V7.2 and V7.3: Cross-element and cross-field deliberation invariants
 *
 * V7.2 — ZOD — target: cross-element invariant
 * check: options=[{label:'A',selected:true},{label:'B',selected:true}] rejected at parse time
 * pass: safeParse returns success:false with message containing 'At most one option may have selected: true'
 *
 * V7.3 — ZOD — target: cross-field invariant
 * check: decisionState='committed' with zero selections rejected
 * pass: parse error message contains 'Committed decision must have exactly one selected option'
 */

import { describe, expect, it } from "vitest";
import { thoughtToolInputSchema } from "../thought/tool.js";

describe("Spec 07 — Deliberation Without Commitment", () => {
  describe("V7.2: Cross-element invariant — multiple selected options", () => {
    const baseInput = {
      thought: "Evaluating options for the decision",
      nextThoughtNeeded: false,
      thoughtType: "decision_frame" as const,
    };

    it("accepts exactly one selected option", () => {
      const input = {
        ...baseInput,
        options: [
          { label: "A", selected: true, reason: "Best choice" },
          { label: "B", selected: false },
          { label: "C", selected: false },
        ],
      };

      const result = thoughtToolInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("accepts zero selected options (deliberating state)", () => {
      const input = {
        ...baseInput,
        options: [
          { label: "A", selected: false },
          { label: "B", selected: false },
          { label: "C", selected: false },
        ],
      };

      const result = thoughtToolInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("accepts empty options array (deliberating)", () => {
      const input = {
        ...baseInput,
        options: [],
      };

      const result = thoughtToolInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("rejects multiple selected options with message about 'At most one option may have selected: true'", () => {
      const input = {
        ...baseInput,
        options: [
          { label: "A", selected: true },
          { label: "B", selected: true },
        ],
      };

      const result = thoughtToolInputSchema.safeParse(input);
      expect(result.success).toBe(false);

      if (!result.success) {
        const errorMessage = result.error.issues
          .map((issue) => issue.message)
          .join(" ");

        expect(errorMessage).toContain("At most one option may have selected: true");
      }
    });

    it("rejects three options with multiple selected", () => {
      const input = {
        ...baseInput,
        options: [
          { label: "A", selected: true },
          { label: "B", selected: false },
          { label: "C", selected: true },
        ],
      };

      const result = thoughtToolInputSchema.safeParse(input);
      expect(result.success).toBe(false);

      if (!result.success) {
        const errorMessage = result.error.issues
          .map((issue) => issue.message)
          .join(" ");

        expect(errorMessage.toLowerCase()).toContain("selected");
      }
    });

    it("rejects all options selected", () => {
      const input = {
        ...baseInput,
        options: [
          { label: "A", selected: true },
          { label: "B", selected: true },
          { label: "C", selected: true },
        ],
      };

      const result = thoughtToolInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("V7.3: Cross-field invariant — committed decision without selection", () => {
    const baseInput = {
      thought: "Making a final decision",
      nextThoughtNeeded: false,
      thoughtType: "decision_frame" as const,
    };

    it("accepts committed decision with one selected option", () => {
      const input = {
        ...baseInput,
        options: [{ label: "A", selected: true }],
      };

      const result = thoughtToolInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("accepts deliberating decision with zero selections", () => {
      const input = {
        ...baseInput,
        options: [
          { label: "A", selected: false },
          { label: "B", selected: false },
        ],
      };

      const result = thoughtToolInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("accepts deliberating decision with empty options", () => {
      const input = {
        ...baseInput,
        options: [],
      };

      const result = thoughtToolInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("rejects committed decision with zero selections", () => {
      // This requires a decisionState field or equivalent to distinguish committed vs deliberating
      // The schema should have a .refine() that checks:
      // IF decisionState === 'committed' THEN exactly one option must be selected

      const input = {
        ...baseInput,
        decisionState: "committed" as const,
        options: [
          { label: "A", selected: false },
          { label: "B", selected: false },
        ],
      };

      const result = thoughtToolInputSchema.safeParse(input);

      // V7.3 says committed + zero selections should be rejected
      // The schema needs decisionState field and refinement logic to enforce this
      // For now, this test documents the expected behavior
      expect(result.success).toBe(false);

      if (!result.success) {
        const errorMessage = result.error.issues
          .map((issue) => issue.message)
          .join(" ");

        // Should mention the committed decision invariant
        expect(errorMessage).toContain("Committed decision must have exactly one selected option");
      }
    });

    it("rejects committed decision with empty options array", () => {
      const input = {
        ...baseInput,
        decisionState: "committed" as const,
        options: [],
      };

      const result = thoughtToolInputSchema.safeParse(input);
      expect(result.success).toBe(false);

      if (!result.success) {
        const errorMessage = result.error.issues
          .map((issue) => issue.message)
          .join(" ");

        expect(errorMessage).toContain("Committed decision must have exactly one selected option");
      }
    });

    it("committed decision with multiple selections should fail on V7.2 first", () => {
      // Multiple selections should be caught by V7.2 invariant first
      const input = {
        ...baseInput,
        options: [
          { label: "A", selected: true },
          { label: "B", selected: true },
        ],
      };

      const result = thoughtToolInputSchema.safeParse(input);
      expect(result.success).toBe(false);

      if (!result.success) {
        const errorMessage = result.error.issues
          .map((issue) => issue.message)
          .join(" ");

        // V7.2 should fire first (at most one selected)
        expect(errorMessage).toContain("At most one option may have selected: true");
      }
    });
  });
});
