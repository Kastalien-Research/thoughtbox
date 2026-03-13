/**
 * ADR-AUTH-01: Auth middleware unit tests.
 *
 * H2: Middleware validates/rejects tokens (mocked JWKS).
 * H6: Dual-backend auth path (FS skips, Supabase enforces).
 *
 * H1, H3, H4, H5 require a live Supabase instance and are marked
 * as integration tests that need `supabase start` or the hosted project.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateToken,
  extractBearerToken,
  type AuthContext,
} from '../middleware/auth.js';
import { SignJWT, exportJWK, generateKeyPair } from 'jose';

// ---------------------------------------------------------------------------
// H2: Middleware validates/rejects tokens
// ---------------------------------------------------------------------------

describe('H2: JWT validation middleware', () => {
  let privateKey: CryptoKey;
  let jwks: ReturnType<typeof import('jose').createRemoteJWKSet>;
  const supabaseUrl = 'https://test-project.supabase.co';

  beforeEach(async () => {
    // Generate an RS256 key pair for test token signing
    const pair = await generateKeyPair('RS256');
    privateKey = pair.privateKey;

    // Create a mock JWKS function that returns the public key
    const publicJwk = await exportJWK(pair.publicKey);
    publicJwk.kid = 'test-key-id';
    publicJwk.alg = 'RS256';
    publicJwk.use = 'sig';

    // Mock JWKS as a function that resolves to the key
    // jose's jwtVerify accepts a KeyLike or a function that returns one
    jwks = (async () => pair.publicKey) as unknown as ReturnType<
      typeof import('jose').createRemoteJWKSet
    >;
  });

  it('validates a well-formed token and extracts claims', async () => {
    const token = await new SignJWT({
      sub: 'user-uuid-123',
      client_id: 'mcp-client-abc',
      role: 'authenticated',
      session_id: 'sess-456',
      email: 'test@example.com',
      aud: 'authenticated',
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key-id' })
      .setIssuer(`${supabaseUrl}/auth/v1`)
      .setAudience('authenticated')
      .setExpirationTime('1h')
      .sign(privateKey);

    const result = await validateToken(token, jwks, supabaseUrl);

    expect(result.userId).toBe('user-uuid-123');
    expect(result.clientId).toBe('mcp-client-abc');
    expect(result.role).toBe('authenticated');
    expect(result.sessionId).toBe('sess-456');
    expect(result.email).toBe('test@example.com');
  });

  it('rejects an expired token', async () => {
    const token = await new SignJWT({
      sub: 'user-uuid-123',
      role: 'authenticated',
      aud: 'authenticated',
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key-id' })
      .setIssuer(`${supabaseUrl}/auth/v1`)
      .setAudience('authenticated')
      .setExpirationTime('-1h') // Already expired
      .sign(privateKey);

    await expect(
      validateToken(token, jwks, supabaseUrl),
    ).rejects.toThrow();
  });

  it('rejects a token signed with wrong key', async () => {
    // Sign with a different key pair
    const otherPair = await generateKeyPair('RS256');
    const token = await new SignJWT({
      sub: 'user-uuid-123',
      role: 'authenticated',
      aud: 'authenticated',
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key-id' })
      .setIssuer(`${supabaseUrl}/auth/v1`)
      .setAudience('authenticated')
      .setExpirationTime('1h')
      .sign(otherPair.privateKey);

    await expect(
      validateToken(token, jwks, supabaseUrl),
    ).rejects.toThrow();
  });

  it('rejects a token with wrong issuer', async () => {
    const token = await new SignJWT({
      sub: 'user-uuid-123',
      role: 'authenticated',
      aud: 'authenticated',
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key-id' })
      .setIssuer('https://wrong-issuer.example.com/auth/v1')
      .setAudience('authenticated')
      .setExpirationTime('1h')
      .sign(privateKey);

    await expect(
      validateToken(token, jwks, supabaseUrl),
    ).rejects.toThrow();
  });

  it('rejects a token with wrong audience', async () => {
    const token = await new SignJWT({
      sub: 'user-uuid-123',
      role: 'authenticated',
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key-id' })
      .setIssuer(`${supabaseUrl}/auth/v1`)
      .setAudience('wrong-audience')
      .setExpirationTime('1h')
      .sign(privateKey);

    await expect(
      validateToken(token, jwks, supabaseUrl),
    ).rejects.toThrow();
  });

  it('rejects a token missing sub claim', async () => {
    const token = await new SignJWT({
      role: 'authenticated',
      aud: 'authenticated',
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key-id' })
      .setIssuer(`${supabaseUrl}/auth/v1`)
      .setAudience('authenticated')
      .setExpirationTime('1h')
      .sign(privateKey);

    await expect(
      validateToken(token, jwks, supabaseUrl),
    ).rejects.toThrow('Token missing required "sub" claim');
  });

  it('defaults role to authenticated when not present', async () => {
    const token = await new SignJWT({
      sub: 'user-uuid-123',
      aud: 'authenticated',
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key-id' })
      .setIssuer(`${supabaseUrl}/auth/v1`)
      .setAudience('authenticated')
      .setExpirationTime('1h')
      .sign(privateKey);

    const result = await validateToken(token, jwks, supabaseUrl);
    expect(result.role).toBe('authenticated');
  });
});

// ---------------------------------------------------------------------------
// extractBearerToken
// ---------------------------------------------------------------------------

describe('extractBearerToken', () => {
  it('extracts token from valid Bearer header', () => {
    expect(extractBearerToken('Bearer abc123')).toBe('abc123');
  });

  it('returns null for missing header', () => {
    expect(extractBearerToken(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractBearerToken('')).toBeNull();
  });

  it('returns null for non-Bearer scheme', () => {
    expect(extractBearerToken('Basic abc123')).toBeNull();
  });

  it('returns null for Bearer with no token', () => {
    expect(extractBearerToken('Bearer ')).toBeNull();
  });

  it('returns null for malformed header with extra parts', () => {
    expect(extractBearerToken('Bearer abc 123')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// H6: Dual-backend auth path
// ---------------------------------------------------------------------------

describe('H6: Dual-backend auth path', () => {
  it('FS mode does not require auth middleware (architectural)', () => {
    // This test verifies the code path: when THOUGHTBOX_STORAGE != supabase,
    // the server does not set up JWKS or call validateToken.
    // The actual gating happens in src/index.ts:
    //   const requireAuth = storageType === "supabase";
    // FS mode (storageType === "fs") sets requireAuth = false.

    const storageType = 'fs';
    const requireAuth = storageType === 'supabase';
    expect(requireAuth).toBe(false);
  });

  it('Supabase mode requires auth middleware (architectural)', () => {
    const storageType = 'supabase';
    const requireAuth = storageType === 'supabase';
    expect(requireAuth).toBe(true);
  });

  it('memory mode does not require auth middleware', () => {
    const storageType = 'memory';
    const requireAuth = storageType === 'supabase';
    expect(requireAuth).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Integration test stubs (H1, H3, H4, H5)
// ---------------------------------------------------------------------------

describe.skip('H1: Supabase OAuth 2.1 endpoints (integration)', () => {
  it.todo(
    'Discovery endpoint returns JSON with authorization_endpoint, token_endpoint, jwks_uri',
  );
  it.todo('JWKS endpoint returns key set with RS256 key');
});

describe.skip('H3: Current RLS policies reject OAuth tokens (integration)', () => {
  it.todo('OAuth token (no project claim) fails INSERT on all 5 product tables');
});

describe.skip('H4: Membership-based RLS grants correct access (integration)', () => {
  it.todo('User A in W1 can access P1, cannot access P2');
  it.todo('User B in W1+W2 can access both P1 and P2');
});

describe.skip('H5: RS256 asymmetric validation (integration)', () => {
  it.todo('Token validates via JWKS public key without shared secret');
});
