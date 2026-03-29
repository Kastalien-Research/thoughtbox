/**
 * OAuth 2.1 server provider for Thoughtbox MCP.
 *
 * Implements the SDK's OAuthServerProvider interface. Acts as both
 * Authorization Server and Resource Server (combined AS+RS).
 *
 * Auth codes and refresh tokens use Supabase when available,
 * falling back to in-memory Maps for local development.
 */

import type { Response } from 'express';
import type {
  OAuthServerProvider,
  AuthorizationParams,
} from '@modelcontextprotocol/sdk/server/auth/provider.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type {
  OAuthClientInformationFull,
  OAuthTokens,
  OAuthTokenRevocationRequest,
} from '@modelcontextprotocol/sdk/shared/auth.js';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import {
  InvalidGrantError,
  InvalidRequestError,
} from '@modelcontextprotocol/sdk/server/auth/errors.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  signAccessToken,
  verifyAccessToken as verifyJwt,
} from './jwt.js';
import crypto from 'node:crypto';

const AUTH_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface AuthCodeEntry {
  clientId: string;
  workspaceId: string;
  codeChallenge: string;
  redirectUri: string;
  scopes: string[];
  expiresAt: number;
  consumedAt?: number;
}

interface RefreshTokenEntry {
  clientId: string;
  workspaceId: string;
  scopes: string[];
  expiresAt: number;
  revokedAt?: number;
}

export interface ThoughtboxOAuthProviderOpts {
  clientsStore: OAuthRegisteredClientsStore;
  supabase?: SupabaseClient;
  defaultWorkspaceId?: string;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class ThoughtboxOAuthProvider implements OAuthServerProvider {
  private readonly _clientsStore: OAuthRegisteredClientsStore;
  private readonly supabase?: SupabaseClient;
  private readonly defaultWorkspaceId: string;

  // In-memory fallback stores for local mode
  private authCodes = new Map<string, AuthCodeEntry>();
  private refreshTokens = new Map<string, RefreshTokenEntry>();

  constructor(opts: ThoughtboxOAuthProviderOpts) {
    this._clientsStore = opts.clientsStore;
    this.supabase = opts.supabase;
    this.defaultWorkspaceId = opts.defaultWorkspaceId ?? 'local-dev-workspace';
  }

  get clientsStore(): OAuthRegisteredClientsStore {
    return this._clientsStore;
  }

  // ---------------------------------------------------------------------------
  // authorize — auto-consent, generate auth code, redirect
  // ---------------------------------------------------------------------------

  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Response,
  ): Promise<void> {
    const code = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const workspaceId = this.defaultWorkspaceId;
    const scopes = params.scopes ?? [];

    if (this.supabase) {
      const { error } = await this.supabase
        .from('oauth_authorization_codes')
        .insert({
          code,
          client_id: client.client_id,
          workspace_id: workspaceId,
          code_challenge: params.codeChallenge,
          redirect_uri: params.redirectUri,
          scopes,
          expires_at: new Date(now + AUTH_CODE_TTL_MS).toISOString(),
        });
      if (error) {
        throw new Error(`Failed to store auth code: ${error.message}`);
      }
    } else {
      this.authCodes.set(code, {
        clientId: client.client_id,
        workspaceId,
        codeChallenge: params.codeChallenge,
        redirectUri: params.redirectUri,
        scopes,
        expiresAt: now + AUTH_CODE_TTL_MS,
      });
    }

    const redirectUrl = new URL(params.redirectUri);
    redirectUrl.searchParams.set('code', code);
    if (params.state) {
      redirectUrl.searchParams.set('state', params.state);
    }

    res.redirect(302, redirectUrl.href);
  }

  // ---------------------------------------------------------------------------
  // challengeForAuthorizationCode — return stored code_challenge
  // ---------------------------------------------------------------------------

  async challengeForAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
  ): Promise<string> {
    const entry = await this.lookupAuthCode(authorizationCode, client.client_id);
    return entry.codeChallenge;
  }

  // ---------------------------------------------------------------------------
  // exchangeAuthorizationCode — consume code, issue tokens
  // ---------------------------------------------------------------------------

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    _codeVerifier?: string,
    _redirectUri?: string,
    _resource?: URL,
  ): Promise<OAuthTokens> {
    const entry = await this.lookupAuthCode(authorizationCode, client.client_id);

    // Mark consumed
    await this.consumeAuthCode(authorizationCode);

    // Mint access token
    const { token: accessToken, expiresAt } = await signAccessToken({
      sub: client.client_id,
      workspace_id: entry.workspaceId,
      scopes: entry.scopes,
    });

    // Generate and store refresh token
    const refreshToken = crypto.randomBytes(32).toString('hex');
    await this.storeRefreshToken(refreshToken, {
      clientId: client.client_id,
      workspaceId: entry.workspaceId,
      scopes: entry.scopes,
    });

    const expiresIn = expiresAt - Math.floor(Date.now() / 1000);

    return {
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: expiresIn,
      scope: entry.scopes.join(' '),
      refresh_token: refreshToken,
    };
  }

  // ---------------------------------------------------------------------------
  // exchangeRefreshToken — validate, mint new access token
  // ---------------------------------------------------------------------------

  async exchangeRefreshToken(
    client: OAuthClientInformationFull,
    refreshToken: string,
    scopes?: string[],
    _resource?: URL,
  ): Promise<OAuthTokens> {
    const entry = await this.lookupRefreshToken(refreshToken, client.client_id);

    // If scopes requested, verify subset of original
    const effectiveScopes = scopes ?? entry.scopes;
    if (scopes) {
      const allowed = new Set(entry.scopes);
      for (const s of scopes) {
        if (!allowed.has(s)) {
          throw new InvalidRequestError(`Scope "${s}" not granted in original authorization`);
        }
      }
    }

    const { token: accessToken, expiresAt } = await signAccessToken({
      sub: client.client_id,
      workspace_id: entry.workspaceId,
      scopes: effectiveScopes,
    });

    const expiresIn = expiresAt - Math.floor(Date.now() / 1000);

    return {
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: expiresIn,
      scope: effectiveScopes.join(' '),
      refresh_token: refreshToken,
    };
  }

  // ---------------------------------------------------------------------------
  // verifyAccessToken — decode JWT, return AuthInfo
  // ---------------------------------------------------------------------------

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const claims = await verifyJwt(token);

    return {
      token,
      clientId: claims.sub,
      scopes: claims.scopes,
      expiresAt: claims.expiresAt,
      extra: { workspace_id: claims.workspace_id },
    };
  }

  // ---------------------------------------------------------------------------
  // revokeToken — mark refresh token as revoked (JWTs are no-op)
  // ---------------------------------------------------------------------------

  async revokeToken(
    _client: OAuthClientInformationFull,
    request: OAuthTokenRevocationRequest,
  ): Promise<void> {
    // Access tokens (JWTs) can't be individually revoked — 30min TTL limits
    // exposure. Per RFC 7009, return 200 anyway.
    if (request.token_type_hint === 'access_token') return;

    const tokenHash = hashToken(request.token);

    if (this.supabase) {
      await this.supabase
        .from('oauth_refresh_tokens')
        .update({ revoked_at: new Date().toISOString() })
        .eq('token_hash', tokenHash);
    } else {
      const entry = this.refreshTokens.get(tokenHash);
      if (entry) {
        entry.revokedAt = Date.now();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async lookupAuthCode(
    code: string,
    clientId: string,
  ): Promise<AuthCodeEntry> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('oauth_authorization_codes')
        .select('*')
        .eq('code', code)
        .single();

      if (error || !data) throw new InvalidGrantError('Invalid authorization code');
      if (data.client_id !== clientId) throw new InvalidGrantError('Client mismatch');
      if (data.consumed_at) throw new InvalidGrantError('Authorization code already used');
      if (new Date(data.expires_at).getTime() < Date.now()) {
        throw new InvalidGrantError('Authorization code expired');
      }

      return {
        clientId: data.client_id,
        workspaceId: data.workspace_id,
        codeChallenge: data.code_challenge,
        redirectUri: data.redirect_uri,
        scopes: data.scopes ?? [],
        expiresAt: new Date(data.expires_at).getTime(),
      };
    }

    const entry = this.authCodes.get(code);
    if (!entry) throw new InvalidGrantError('Invalid authorization code');
    if (entry.clientId !== clientId) throw new InvalidGrantError('Client mismatch');
    if (entry.consumedAt) throw new InvalidGrantError('Authorization code already used');
    if (entry.expiresAt < Date.now()) throw new InvalidGrantError('Authorization code expired');

    return entry;
  }

  private async consumeAuthCode(code: string): Promise<void> {
    if (this.supabase) {
      await this.supabase
        .from('oauth_authorization_codes')
        .update({ consumed_at: new Date().toISOString() })
        .eq('code', code);
    } else {
      const entry = this.authCodes.get(code);
      if (entry) entry.consumedAt = Date.now();
    }
  }

  private async storeRefreshToken(
    token: string,
    opts: { clientId: string; workspaceId: string; scopes: string[] },
  ): Promise<void> {
    const tokenHash = hashToken(token);
    const expiresAt = Date.now() + REFRESH_TOKEN_TTL_MS;

    if (this.supabase) {
      const { error } = await this.supabase
        .from('oauth_refresh_tokens')
        .insert({
          token_hash: tokenHash,
          client_id: opts.clientId,
          workspace_id: opts.workspaceId,
          scopes: opts.scopes,
          expires_at: new Date(expiresAt).toISOString(),
        });
      if (error) {
        throw new Error(`Failed to store refresh token: ${error.message}`);
      }
    } else {
      this.refreshTokens.set(tokenHash, {
        clientId: opts.clientId,
        workspaceId: opts.workspaceId,
        scopes: opts.scopes,
        expiresAt,
      });
    }
  }

  private async lookupRefreshToken(
    token: string,
    clientId: string,
  ): Promise<RefreshTokenEntry> {
    const tokenHash = hashToken(token);

    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('oauth_refresh_tokens')
        .select('*')
        .eq('token_hash', tokenHash)
        .single();

      if (error || !data) throw new InvalidGrantError('Invalid refresh token');
      if (data.client_id !== clientId) throw new InvalidGrantError('Client mismatch');
      if (data.revoked_at) throw new InvalidGrantError('Refresh token revoked');
      if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
        throw new InvalidGrantError('Refresh token expired');
      }

      return {
        clientId: data.client_id,
        workspaceId: data.workspace_id,
        scopes: data.scopes ?? [],
        expiresAt: data.expires_at ? new Date(data.expires_at).getTime() : 0,
      };
    }

    const entry = this.refreshTokens.get(tokenHash);
    if (!entry) throw new InvalidGrantError('Invalid refresh token');
    if (entry.clientId !== clientId) throw new InvalidGrantError('Client mismatch');
    if (entry.revokedAt) throw new InvalidGrantError('Refresh token revoked');
    if (entry.expiresAt < Date.now()) throw new InvalidGrantError('Refresh token expired');

    return entry;
  }
}
