/**
 * JWT Validation Middleware for Supabase OAuth 2.1
 *
 * Validates Supabase-issued tokens via JWKS (RS256).
 * Used only in Supabase storage mode. FS mode skips auth entirely.
 *
 * @see .specs/deployment/auth-01-supabase-auth-config.md
 * @see .adr/staging/ADR-AUTH-01-supabase-auth-config.md
 */

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

/**
 * Validated claims extracted from a Supabase OAuth token.
 */
export interface AuthContext {
  userId: string;
  clientId: string | undefined;
  role: string;
  sessionId: string | undefined;
  email: string | undefined;
}

/**
 * Extended JWT payload with Supabase-specific claims.
 */
interface SupabaseJwtPayload extends JWTPayload {
  client_id?: string;
  role?: string;
  session_id?: string;
  email?: string;
}

/**
 * Creates a JWKS key set fetcher for a given Supabase URL.
 * `createRemoteJWKSet` handles caching and key rotation internally.
 */
export function createJwks(supabaseUrl: string) {
  return createRemoteJWKSet(
    new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`)
  );
}

/**
 * Validate a Bearer token against Supabase JWKS.
 *
 * @param token - Raw JWT string (without "Bearer " prefix)
 * @param jwks - JWKS key set from `createJwks()`
 * @param supabaseUrl - Supabase project URL (for issuer validation)
 * @returns Validated AuthContext with extracted claims
 * @throws JOSEError subtypes for invalid/expired/malformed tokens
 */
export async function validateToken(
  token: string,
  jwks: ReturnType<typeof createRemoteJWKSet>,
  supabaseUrl: string,
): Promise<AuthContext> {
  const { payload } = await jwtVerify(token, jwks, {
    issuer: `${supabaseUrl}/auth/v1`,
    audience: 'authenticated',
  });

  const claims = payload as SupabaseJwtPayload;

  if (!claims.sub) {
    throw new Error('Token missing required "sub" claim');
  }

  return {
    userId: claims.sub,
    clientId: claims.client_id,
    role: claims.role || 'authenticated',
    sessionId: claims.session_id,
    email: claims.email,
  };
}

/**
 * Extract Bearer token from an Authorization header value.
 *
 * @returns The raw token string, or null if header is missing/malformed
 */
export function extractBearerToken(
  authHeader: string | undefined,
): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1] || null;
}
