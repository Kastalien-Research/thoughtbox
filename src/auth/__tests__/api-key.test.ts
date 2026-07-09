import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';

/**
 * Regression tests for the api-key prefix parsing defect.
 *
 * Issuance historically generated the 8-char prefix from the base64url
 * alphabet, which includes `_` and `-`. Resolution used to split the key
 * on `_` and take parts[1], so any prefix containing `_` was truncated,
 * the DB lookup missed, and the key 401'd everywhere (~11.8% of keys).
 * Resolution must parse positionally: the prefix is exactly the 8
 * characters after `tbx_`.
 */

interface FakeRow {
  workspace_id: string;
  key_hash: string;
  status: string;
  prefix: string;
}

const rows: FakeRow[] = [];

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: (column: string, value: string) => ({
          single: async () => {
            expect(table).toBe('api_keys');
            expect(column).toBe('prefix');
            const matches = rows.filter((r) => r.prefix === value);
            if (matches.length !== 1) {
              return { data: null, error: { message: 'no or multiple rows' } };
            }
            return { data: matches[0], error: null };
          },
        }),
      }),
    }),
  }),
}));

const { resolveApiKeyToWorkspace, extractPrefixCandidates, API_KEY_PREFIX_LENGTH } =
  await import('../api-key.js');

async function seedKey(
  prefix: string,
  plainKey: string,
  workspaceId: string,
  status = 'active',
): Promise<void> {
  rows.push({
    prefix,
    workspace_id: workspaceId,
    key_hash: await bcrypt.hash(plainKey, 4),
    status,
  });
}

describe('extractPrefixCandidates', () => {
  it('parses an underscore-containing prefix positionally (positional candidate first)', () => {
    expect(extractPrefixCandidates('tbx_ab_cdefg_scrt')).toEqual([ // gitleaks:allow
      'ab_cdefg',
      'ab',
    ]);
  });

  it('parses a hyphen-containing prefix positionally and dedupes the legacy candidate', () => {
    expect(extractPrefixCandidates('tbx_ab-cdefg_scrt')).toEqual(['ab-cdefg']); // gitleaks:allow
  });

  it('parses a hex prefix', () => {
    expect(extractPrefixCandidates('tbx_a1b2c3d4_scrt')).toEqual(['a1b2c3d4']); // gitleaks:allow
  });

  it('falls back to split parsing for a non-8-char legacy prefix', () => {
    expect(extractPrefixCandidates('tbx_abc123_scrt')).toEqual(['abc123']); // gitleaks:allow
  });

  it('returns no candidates when there is no prefix/secret separator', () => {
    expect(extractPrefixCandidates('tbx_abcdefgh')).toEqual([]);
  });

  it('prefix length constant matches issuance (8 chars)', () => {
    expect(API_KEY_PREFIX_LENGTH).toBe(8);
  });
});

describe('resolveApiKeyToWorkspace', () => {
  beforeEach(() => {
    rows.length = 0;
    process.env.SUPABASE_URL = 'http://localhost:54321';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';
  });

  it('resolves a key whose prefix contains an underscore (rescues existing keys)', async () => {
    const key = 'tbx_ab_cdefg_scrt1'; // gitleaks:allow
    await seedKey('ab_cdefg', key, 'ws-underscore');
    await expect(resolveApiKeyToWorkspace(key)).resolves.toBe('ws-underscore');
  });

  it('resolves a key whose prefix contains a hyphen', async () => {
    const key = 'tbx_ab-cdefg_scrt2'; // gitleaks:allow
    await seedKey('ab-cdefg', key, 'ws-hyphen');
    await expect(resolveApiKeyToWorkspace(key)).resolves.toBe('ws-hyphen');
  });

  it('resolves a new-format hex-prefix key', async () => {
    const key = 'tbx_a1b2c3d4_scrt3'; // gitleaks:allow
    await seedKey('a1b2c3d4', key, 'ws-hex');
    await expect(resolveApiKeyToWorkspace(key)).resolves.toBe('ws-hex');
  });

  it('resolves a legacy key with a non-8-char prefix via the split fallback', async () => {
    const key = 'tbx_abc123_scrt4'; // gitleaks:allow
    await seedKey('abc123', key, 'ws-legacy');
    await expect(resolveApiKeyToWorkspace(key)).resolves.toBe('ws-legacy');
  });

  it('rejects a key with a wrong secret', async () => {
    await seedKey('a1b2c3d4', 'tbx_a1b2c3d4_real', 'ws-hex');
    await expect(
      resolveApiKeyToWorkspace('tbx_a1b2c3d4_wrong'),
    ).rejects.toThrow('Invalid API key');
  });

  it('rejects an inactive key with a distinct error', async () => {
    const key = 'tbx_a1b2c3d4_scrt3'; // gitleaks:allow
    await seedKey('a1b2c3d4', key, 'ws-hex', 'revoked');
    await expect(resolveApiKeyToWorkspace(key)).rejects.toThrow(
      'API key is not active',
    );
  });

  it('rejects keys without the tbx_ scheme', async () => {
    await expect(resolveApiKeyToWorkspace('sk_live_nope_nope')).rejects.toThrow(
      'Invalid API key format',
    );
  });

  it('rejects unresolvable keys cleanly', async () => {
    await expect(
      resolveApiKeyToWorkspace('tbx_deadbeef_none'),
    ).rejects.toThrow('Invalid API key');
  });
});
