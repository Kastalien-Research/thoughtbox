/**
 * JWT signing and verification for OAuth 2.1 access tokens.
 *
 * - Local mode: ephemeral symmetric key generated on startup.
 *   Restart = re-auth, which is fine for development.
 * - Deployed (Cloud Run): reads OAUTH_JWT_SECRET env var (HS256).
 *   All containers share the same env, so tokens are portable.
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import crypto from 'node:crypto';

export interface AccessTokenClaims {
  sub: string;
  workspace_id: string;
  scopes: string[];
}

const ACCESS_TOKEN_TTL_SECONDS = 30 * 60; // 30 minutes

/** Lazy-initialized signing key. */
let signingKey: Uint8Array | undefined;

function getSigningKey(): Uint8Array {
  if (signingKey) return signingKey;

  const envSecret = process.env.OAUTH_JWT_SECRET;
  if (envSecret) {
    signingKey = new TextEncoder().encode(envSecret);
  } else {
    signingKey = crypto.getRandomValues(new Uint8Array(32));
    console.error(
      '[OAuth] No OAUTH_JWT_SECRET set — using ephemeral key. Tokens will not survive restarts.',
    );
  }
  return signingKey;
}

export async function signAccessToken(
  claims: AccessTokenClaims,
): Promise<{ token: string; expiresAt: number }> {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + ACCESS_TOKEN_TTL_SECONDS;

  const token = await new SignJWT({
    workspace_id: claims.workspace_id,
    scopes: claims.scopes,
  } satisfies JWTPayload & Omit<AccessTokenClaims, 'sub'>)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuedAt(now)
    .setExpirationTime(expiresAt)
    .sign(getSigningKey());

  return { token, expiresAt };
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenClaims & { expiresAt: number }> {
  const { payload } = await jwtVerify(token, getSigningKey(), {
    algorithms: ['HS256'],
  });

  const sub = payload.sub;
  const workspaceId = payload.workspace_id as string | undefined;
  const scopes = payload.scopes as string[] | undefined;
  const exp = payload.exp;

  if (!sub || !workspaceId || !Array.isArray(scopes) || !exp) {
    throw new Error('Malformed access token claims');
  }

  return {
    sub,
    workspace_id: workspaceId,
    scopes,
    expiresAt: exp,
  };
}
