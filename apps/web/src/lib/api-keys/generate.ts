import { randomBytes } from "node:crypto";

/**
 * Length of the random prefix segment (excludes the `tbx_` scheme).
 * The MCP server resolves keys by taking exactly this many characters
 * after `tbx_` and matching them against `api_keys.prefix`
 * (src/auth/api-key.ts) — keep the two in sync.
 */
export const API_KEY_PREFIX_LENGTH = 8;

export interface GeneratedApiKey {
  /** Stored whole in `api_keys.prefix`; shown in the dashboard key list. */
  prefix: string;
  /** Full key handed to the user once: `tbx_<prefix>_<secret>`. */
  plainKey: string;
}

/**
 * Generates a new API key.
 *
 * The prefix uses hex — an underscore-free alphabet — so the key is
 * unambiguously parseable as `tbx_<8-char prefix>_<secret>`. Earlier
 * issuance used base64url for the prefix, whose alphabet includes `_`;
 * combined with split-on-`_` parsing on the server, ~11.8% of issued
 * keys could never resolve.
 */
export function generateApiKey(): GeneratedApiKey {
  const prefix = randomBytes(API_KEY_PREFIX_LENGTH / 2).toString("hex");
  const plainKey = `tbx_${prefix}_${randomBytes(24).toString("base64url")}`;
  return { prefix, plainKey };
}
