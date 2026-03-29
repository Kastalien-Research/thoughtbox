/**
 * OAuth 2.1 server provider for Thoughtbox MCP.
 *
 * Implements the SDK's OAuthServerProvider interface. Acts as both
 * Authorization Server and Resource Server (combined AS+RS).
 *
 * Token persistence is delegated to an OAuthTokenStorage implementation
 * (Supabase for deployed, in-memory for local dev).
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
  InvalidRequestError,
} from '@modelcontextprotocol/sdk/server/auth/errors.js';
import {
  signAccessToken,
  verifyAccessToken as verifyJwt,
} from './jwt.js';
import type { OAuthTokenStorage } from './token-storage.js';
import crypto from 'node:crypto';

const AUTH_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface ThoughtboxOAuthProviderOpts {
  clientsStore: OAuthRegisteredClientsStore;
  tokenStorage: OAuthTokenStorage;
  defaultWorkspaceId?: string;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class ThoughtboxOAuthProvider implements OAuthServerProvider {
  private readonly _clientsStore: OAuthRegisteredClientsStore;
  private readonly tokenStorage: OAuthTokenStorage;
  private readonly defaultWorkspaceId: string;

  constructor(opts: ThoughtboxOAuthProviderOpts) {
    this._clientsStore = opts.clientsStore;
    this.tokenStorage = opts.tokenStorage;
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
    const scopes = params.scopes ?? [];

    await this.tokenStorage.storeAuthCode(code, {
      clientId: client.client_id,
      workspaceId: this.defaultWorkspaceId,
      codeChallenge: params.codeChallenge,
      redirectUri: params.redirectUri,
      scopes,
      expiresAt: now + AUTH_CODE_TTL_MS,
    });

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
    const entry = await this.tokenStorage.lookupAuthCode(authorizationCode, client.client_id);
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
    const entry = await this.tokenStorage.lookupAuthCode(authorizationCode, client.client_id);
    await this.tokenStorage.consumeAuthCode(authorizationCode);

    const { token: accessToken, expiresAt } = await signAccessToken({
      sub: client.client_id,
      workspace_id: entry.workspaceId,
      scopes: entry.scopes,
    });

    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = hashToken(refreshToken);

    await this.tokenStorage.storeRefreshToken(refreshTokenHash, {
      clientId: client.client_id,
      workspaceId: entry.workspaceId,
      scopes: entry.scopes,
      expiresAt: Date.now() + REFRESH_TOKEN_TTL_MS,
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
    const tokenHash = hashToken(refreshToken);
    const entry = await this.tokenStorage.lookupRefreshToken(tokenHash, client.client_id);

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
    if (request.token_type_hint === 'access_token') return;
    const tokenHash = hashToken(request.token);
    await this.tokenStorage.revokeRefreshToken(tokenHash);
  }
}
