import { describe, it, expect } from "vitest";
import { generateApiKey, API_KEY_PREFIX_LENGTH } from "./generate";

/**
 * Regression tests for the api-key prefix alphabet defect.
 *
 * Prefixes were previously generated from base64url, whose alphabet
 * includes `_` and `-`; the MCP server's split-on-`_` parsing made
 * ~11.8% of issued keys unresolvable. Issuance must now use an
 * underscore-free alphabet (hex) so keys stay trivially parseable as
 * `tbx_<8-char prefix>_<secret>`.
 */
describe("generateApiKey", () => {
  it("never produces an underscore or hyphen in the prefix (hex alphabet)", () => {
    for (let i = 0; i < 500; i++) {
      const { prefix } = generateApiKey();
      expect(prefix).toMatch(/^[0-9a-f]{8}$/);
    }
  });

  it("keeps the 8-char prefix length contract", () => {
    const { prefix } = generateApiKey();
    expect(API_KEY_PREFIX_LENGTH).toBe(8);
    expect(prefix).toHaveLength(API_KEY_PREFIX_LENGTH);
  });

  it("embeds the stored prefix positionally after tbx_", () => {
    const { prefix, plainKey } = generateApiKey();
    expect(plainKey).toMatch(/^tbx_[0-9a-f]{8}_[A-Za-z0-9_-]{32}$/);
    expect(plainKey.slice(4, 4 + API_KEY_PREFIX_LENGTH)).toBe(prefix);
    expect(plainKey.charAt(4 + API_KEY_PREFIX_LENGTH)).toBe("_");
  });
});
