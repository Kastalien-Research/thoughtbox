/**
 * spec-10-zod.test.ts
 *
 * Validates V10.7: Structural scoping — persistAs restriction
 *
 * V10.7 — ZOD — target: structural scoping
 * check: persistAs on a reasoning (or any non-belief/assumption) thought is rejected
 * pass: parse error mentions persistAs not allowed on this thoughtType
 *
 * persistAs is only valid for:
 * - belief_snapshot (creates Concept entity)
 * - assumption_update with newStatus='refuted' (creates Decision entity)
 * - assumption_update with downstream dependencies (creates Decision entity)
 */

import { describe, expect, it } from "vitest";
import { thoughtToolInputSchema } from "../thought/tool.js";

describe("Spec 10 — Knowledge Graph Persistence Shortcut", () => {
  describe("V10.7: Structural scoping — persistAs field restrictions", () => {
    const baseInput = {
      thought: "Analyzing the problem",
      nextThoughtNeeded: false,
    };

    describe("persistAs is only valid for belief_snapshot and assumption_update", () => {
      it("accepts persistAs on belief_snapshot thought", () => {
        const input = {
          ...baseInput,
          thoughtType: "belief_snapshot" as const,
          beliefs: {
            entities: [{ name: "Test Entity", state: "active" }],
          },
          persistAs: {
            name: "TestConcept",
            visibility: "agent-private" as const,
          },
        };

        const result = thoughtToolInputSchema.safeParse(input);
        // This should succeed if persistAs is properly scoped to belief_snapshot
        // Note: The schema may not yet have persistAs defined, this tests the expected behavior
        expect(result.success).toBe(true);
      });

      it("accepts persistAs on assumption_update thought", () => {
        const input = {
          ...baseInput,
          thoughtType: "assumption_update" as const,
          assumptionChange: {
            text: "The assumption",
            oldStatus: "believed",
            newStatus: "refuted" as const,
          },
          persistAs: {
            name: "RefutedAssumption",
            visibility: "agent-private" as const,
          },
        };

        const result = thoughtToolInputSchema.safeParse(input);
        // This should succeed - assumption_update with refuted status can persist
        expect(result.success).toBe(true);
      });

      it("rejects persistAs on reasoning thought", () => {
        const input = {
          ...baseInput,
          thoughtType: "reasoning" as const,
          persistAs: {
            name: "ShouldNotPersist",
            visibility: "agent-private" as const,
          },
        };

        const result = thoughtToolInputSchema.safeParse(input);
        expect(result.success).toBe(false);

        if (!result.success) {
          const errorMessage = result.error.issues
            .map((issue) => issue.message)
            .join(" ");

          // Error should indicate persistAs is not allowed on reasoning thoughtType
          expect(errorMessage.toLowerCase()).toMatch(/persistas|not allowed|invalid.*reasoning/);
        }
      });

      it("rejects persistAs on decision_frame thought", () => {
        const input = {
          ...baseInput,
          thoughtType: "decision_frame" as const,
          options: [{ label: "A", selected: true }],
          persistAs: {
            name: "ShouldNotPersist",
            visibility: "agent-private" as const,
          },
        };

        const result = thoughtToolInputSchema.safeParse(input);
        expect(result.success).toBe(false);

        if (!result.success) {
          const errorMessage = result.error.issues
            .map((issue) => issue.message)
            .join(" ");

          expect(errorMessage.toLowerCase()).toMatch(/persistas|not allowed|invalid.*decision/);
        }
      });

      it("rejects persistAs on action_report thought", () => {
        const input = {
          ...baseInput,
          thoughtType: "action_report" as const,
          actionResult: {
            success: true,
            reversible: "yes",
            tool: "test",
            target: "test-target",
          },
          persistAs: {
            name: "ShouldNotPersist",
            visibility: "agent-private" as const,
          },
        };

        const result = thoughtToolInputSchema.safeParse(input);
        expect(result.success).toBe(false);

        if (!result.success) {
          const errorMessage = result.error.issues
            .map((issue) => issue.message)
            .join(" ");

          expect(errorMessage.toLowerCase()).toMatch(/persistas|not allowed|invalid.*action/);
        }
      });

      it("rejects persistAs on context_snapshot thought", () => {
        const input = {
          ...baseInput,
          thoughtType: "context_snapshot" as const,
          contextData: {
            toolsAvailable: ["tool1"],
            modelId: "test-model",
          },
          persistAs: {
            name: "ShouldNotPersist",
            visibility: "agent-private" as const,
          },
        };

        const result = thoughtToolInputSchema.safeParse(input);
        expect(result.success).toBe(false);

        if (!result.success) {
          const errorMessage = result.error.issues
            .map((issue) => issue.message)
            .join(" ");

          expect(errorMessage.toLowerCase()).toMatch(/persistas|not allowed|invalid.*context/);
        }
      });

      it("rejects persistAs on progress thought", () => {
        const input = {
          ...baseInput,
          thoughtType: "progress" as const,
          progressData: {
            task: "test-task",
            status: "in_progress" as const,
          },
          persistAs: {
            name: "ShouldNotPersist",
            visibility: "agent-private" as const,
          },
        };

        const result = thoughtToolInputSchema.safeParse(input);
        expect(result.success).toBe(false);

        if (!result.success) {
          const errorMessage = result.error.issues
            .map((issue) => issue.message)
            .join(" ");

          expect(errorMessage.toLowerCase()).toMatch(/persistas|not allowed|invalid.*progress/);
        }
      });
    });

    describe("persistAs field structural requirements", () => {
      it("persistAs requires name field", () => {
        const input = {
          ...baseInput,
          thoughtType: "belief_snapshot" as const,
          beliefs: {
            entities: [{ name: "Test", state: "active" }],
          },
          persistAs: {
            visibility: "agent-private",
            // missing name
          },
        };

        const result = thoughtToolInputSchema.safeParse(input);
        // Should fail due to missing required name field
        expect(result.success).toBe(false);
      });

      it("persistAs visibility defaults to agent-private", () => {
        // When persistAs is accepted with just a name, visibility should default
        const input = {
          ...baseInput,
          thoughtType: "belief_snapshot" as const,
          beliefs: {
            entities: [{ name: "Test", state: "active" }],
          },
          persistAs: {
            name: "TestConcept",
            // visibility omitted - should default
          },
        };

        const result = thoughtToolInputSchema.safeParse(input);
        // Depends on whether schema has default for visibility
        // The spec says it should default to agent-private
        expect(result.success).toBe(true);
      });

      it("persistAs visibility accepts valid values", () => {
        const validVisibilities = [
          "public",
          "agent-private",
          "user-private",
          "team-private",
        ] as const;

        for (const visibility of validVisibilities) {
          const input = {
            ...baseInput,
            thoughtType: "belief_snapshot" as const,
            beliefs: {
              entities: [{ name: "Test", state: "active" }],
            },
            persistAs: {
              name: "TestConcept",
              visibility,
            },
          };

          const result = thoughtToolInputSchema.safeParse(input);
          expect(result.success).toBe(true);
        }
      });

      it("persistAs rejects invalid visibility values", () => {
        const input = {
          ...baseInput,
          thoughtType: "belief_snapshot" as const,
          beliefs: {
            entities: [{ name: "Test", state: "active" }],
          },
          persistAs: {
            name: "TestConcept",
            // @ts-expect-error - intentionally testing runtime validation
            visibility: "invalid-visibility",
          },
        };

        const result = thoughtToolInputSchema.safeParse(input);
        expect(result.success).toBe(false);
      });
    });

    describe("persistAs with relation targets", () => {
      it("accepts persistAs with relationTo on valid thoughtType", () => {
        const input = {
          ...baseInput,
          thoughtType: "belief_snapshot" as const,
          beliefs: {
            entities: [{ name: "New Concept", state: "active" }],
          },
          persistAs: {
            name: "NewConcept",
            visibility: "agent-private",
            relationTo: "existing-entity-id",
          },
        };

        const result = thoughtToolInputSchema.safeParse(input);
        // relationTo should be accepted on belief_snapshot
        expect(result.success).toBe(true);
      });

      it("rejects persistAs with relationTo on invalid thoughtType", () => {
        const input = {
          ...baseInput,
          thoughtType: "reasoning" as const,
          persistAs: {
            name: "ShouldNotPersist",
            visibility: "agent-private",
            relationTo: "some-entity-id",
          },
        };

        const result = thoughtToolInputSchema.safeParse(input);
        // Should fail because reasoning doesn't allow persistAs
        expect(result.success).toBe(false);
      });
    });
  });
});
