import { describe, it, expect } from "vitest";

/**
 * Tests for the API key auth logic in src/index.ts.
 *
 * Extracts the key-checking logic into a pure function so we can
 * test it without spinning up Express. The actual server uses the
 * same algorithm inline.
 */

function checkApiKey(
  apiKey: string | undefined,
  authHeader: string | undefined,
  queryKey: string | undefined,
): { allowed: boolean; source?: "header" | "query" } {
  if (!apiKey) return { allowed: true };

  const headerKey = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;
  const providedKey = headerKey || queryKey || null;

  if (providedKey === apiKey) {
    return { allowed: true, source: headerKey ? "header" : "query" };
  }
  return { allowed: false };
}

describe("API key auth", () => {
  it("allows all requests when THOUGHTBOX_API_KEY is not set", () => {
    const result = checkApiKey(undefined, undefined, undefined);
    expect(result.allowed).toBe(true);
  });

  it("accepts correct key via Authorization header", () => {
    const result = checkApiKey("secret-123", "Bearer secret-123", undefined);
    expect(result.allowed).toBe(true);
    expect(result.source).toBe("header");
  });

  it("accepts correct key via query param", () => {
    const result = checkApiKey("secret-123", undefined, "secret-123");
    expect(result.allowed).toBe(true);
    expect(result.source).toBe("query");
  });

  it("rejects wrong key", () => {
    const result = checkApiKey("secret-123", "Bearer wrong", undefined);
    expect(result.allowed).toBe(false);
  });

  it("rejects missing key when env var is set", () => {
    const result = checkApiKey("secret-123", undefined, undefined);
    expect(result.allowed).toBe(false);
  });

  it("prefers header over query param", () => {
    const result = checkApiKey(
      "secret-123",
      "Bearer secret-123",
      "wrong-key",
    );
    expect(result.allowed).toBe(true);
    expect(result.source).toBe("header");
  });

  it("ignores non-Bearer authorization headers", () => {
    const result = checkApiKey("secret-123", "Basic dXNlcjpwYXNz", "secret-123");
    expect(result.allowed).toBe(true);
    expect(result.source).toBe("query");
  });
});
