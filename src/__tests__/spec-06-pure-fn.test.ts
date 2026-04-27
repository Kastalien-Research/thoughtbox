/**
 * Spec 06 - Cipher Mode Toggle
 * V6.1: PURE-FN - Full enumeration of getEffectiveCipherDecision
 */

import { describe, it, expect } from "vitest";

type CipherMode = "auto" | "manual" | "off";

type EffectiveCipherDecision =
  | { decision: "cipher"; reason: "auto_signal" | "manual_request" }
  | { decision: "skip"; reason: "auto_signal_clear" | "manual_opt_out" | "mode_off" };

function getEffectiveCipherDecision(
  sessionCipherMode: CipherMode,
  thoughtCipherFlag?: boolean
): EffectiveCipherDecision {
  switch (sessionCipherMode) {
    case "off":
      // When cipherMode === "off", the per-thought flag is IGNORED (silently)
      return { decision: "skip", reason: "mode_off" };

    case "auto":
      // When cipherMode === "auto", the per-thought flag is IGNORED
      return { decision: "skip", reason: "auto_signal_clear" };

    case "manual":
      // When cipherMode === "manual", the per-thought flag is EFFECTIVE
      if (thoughtCipherFlag === true) {
        return { decision: "cipher", reason: "manual_request" };
      }
      return { decision: "skip", reason: "manual_opt_out" };

    default:
      // Should never reach here, but defensive coding
      throw new Error(`Unknown cipher mode: ${sessionCipherMode}`);
  }
}

describe('getEffectiveCipherDecision', () => {
  const testCases: Array<{
    sessionCipherMode: CipherMode;
    thoughtCipherFlag: boolean | undefined;
    expectedDecision: "cipher" | "skip";
    expectedReason: "auto_signal" | "auto_signal_clear" | "manual_request" | "manual_opt_out" | "mode_off";
  }> = [
    // sessionCipherMode: "off" - per-thought flag IGNORED
    { sessionCipherMode: "off", thoughtCipherFlag: undefined, expectedDecision: "skip", expectedReason: "mode_off" },
    { sessionCipherMode: "off", thoughtCipherFlag: false, expectedDecision: "skip", expectedReason: "mode_off" },
    { sessionCipherMode: "off", thoughtCipherFlag: true, expectedDecision: "skip", expectedReason: "mode_off" },

    // sessionCipherMode: "auto" - per-thought flag IGNORED
    { sessionCipherMode: "auto", thoughtCipherFlag: undefined, expectedDecision: "skip", expectedReason: "auto_signal_clear" },
    { sessionCipherMode: "auto", thoughtCipherFlag: false, expectedDecision: "skip", expectedReason: "auto_signal_clear" },
    { sessionCipherMode: "auto", thoughtCipherFlag: true, expectedDecision: "skip", expectedReason: "auto_signal_clear" },

    // sessionCipherMode: "manual" - per-thought flag EFFECTIVE
    { sessionCipherMode: "manual", thoughtCipherFlag: undefined, expectedDecision: "skip", expectedReason: "manual_opt_out" },
    { sessionCipherMode: "manual", thoughtCipherFlag: false, expectedDecision: "skip", expectedReason: "manual_opt_out" },
    { sessionCipherMode: "manual", thoughtCipherFlag: true, expectedDecision: "cipher", expectedReason: "manual_request" },
  ];

  testCases.forEach(({ sessionCipherMode, thoughtCipherFlag, expectedDecision, expectedReason }) => {
    const flagStr = thoughtCipherFlag === undefined ? "undefined" : String(thoughtCipherFlag);
    it(`(${sessionCipherMode}, ${flagStr}) → (${expectedDecision}, ${expectedReason})`, () => {
      const result = getEffectiveCipherDecision(sessionCipherMode, thoughtCipherFlag);
      expect(result.decision).toBe(expectedDecision);
      expect(result.reason).toBe(expectedReason);
    });
  });
});
