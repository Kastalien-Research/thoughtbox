import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

/** Length of the random prefix segment issued by the web app (excludes `tbx_`). */
export const API_KEY_PREFIX_LENGTH = 8;

const KEY_SCHEME = 'tbx_';

/**
 * Extracts the candidate `api_keys.prefix` values for an incoming key.
 *
 * Key format (issuance: apps/web/src/app/w/[workspaceSlug]/api-keys/actions.ts):
 *   `tbx_<prefix:8><_><secret>`
 *
 * The prefix MUST be parsed positionally — it is exactly the 8 characters
 * after `tbx_`. Historically issued prefixes used the base64url alphabet,
 * which includes `_`, so splitting the key on `_` truncates ~11.8% of
 * prefixes and made those keys unresolvable. The stored prefix was always
 * the full 8 characters, so positional parsing rescues those keys.
 *
 * A legacy split-based candidate is kept as a defensive fallback for any
 * hypothetical old-format key whose prefix segment is not 8 characters.
 *
 * @returns Candidate prefixes in lookup order (positional first), deduped.
 */
export function extractPrefixCandidates(providedKey: string): string[] {
  const candidates: string[] = [];

  // Positional parse: `tbx_` + exactly 8 chars + `_` separator + secret.
  const positional = providedKey.slice(
    KEY_SCHEME.length,
    KEY_SCHEME.length + API_KEY_PREFIX_LENGTH,
  );
  if (
    positional.length === API_KEY_PREFIX_LENGTH &&
    providedKey.charAt(KEY_SCHEME.length + API_KEY_PREFIX_LENGTH) === '_'
  ) {
    candidates.push(positional);
  }

  // Legacy parse: second underscore-delimited segment.
  const parts = providedKey.split('_');
  if (parts.length >= 3 && parts[1] && !candidates.includes(parts[1])) {
    candidates.push(parts[1]);
  }

  return candidates;
}

/**
 * Resolves an incoming API key (e.g., tbx_abc123...xyz) to a workspace ID.
 *
 * 1. Extracts candidate prefixes (positional parse first, legacy split fallback).
 * 2. Queries the `api_keys` table using a Service Role key.
 * 3. Verifies the full key against the stored `key_hash` using bcrypt.
 *
 * @param providedKey The raw API key provided by the client.
 * @returns The `workspace_id` associated with the key.
 * @throws Error if the key is invalid, inactive, or not found.
 */
export async function resolveApiKeyToWorkspace(providedKey: string): Promise<string> {
  if (!providedKey || !providedKey.startsWith(KEY_SCHEME)) {
    throw new Error('Invalid API key format');
  }

  const candidates = extractPrefixCandidates(providedKey);
  if (candidates.length === 0) {
    throw new Error('Invalid API key format');
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Server misconfiguration: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  // Create an admin client that bypasses RLS to query the api_keys table
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });

  let failure = 'Invalid API key';

  for (const prefix of candidates) {
    const { data, error } = await adminClient
      .from('api_keys')
      .select('workspace_id, key_hash, status')
      .eq('prefix', prefix)
      .single();

    if (error || !data) {
      continue; // No row for this candidate; try the next one.
    }

    if (data.status !== 'active') {
      failure = 'API key is not active';
      continue;
    }

    const isValid = await bcrypt.compare(providedKey, data.key_hash);
    if (isValid) {
      return data.workspace_id;
    }
  }

  throw new Error(failure);
}
