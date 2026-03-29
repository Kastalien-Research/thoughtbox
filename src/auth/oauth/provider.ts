/**
 * OAuth 2.1 server provider for Thoughtbox MCP.
 *
 * Implements the SDK's OAuthServerProvider interface. Acts as both
 * Authorization Server and Resource Server (combined AS+RS).
 *
 * Local mode: auto-consent with defaultWorkspaceId.
 * Multi-tenant mode: serves a consent page that accepts a tbx_* API key
 * to resolve the workspace UUID.
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
  AccessDeniedError,
} from '@modelcontextprotocol/sdk/server/auth/errors.js';
import {
  signAccessToken,
  verifyAccessToken as verifyJwt,
} from './jwt.js';
import { resolveApiKeyToWorkspace } from '../api-key.js';
import type { OAuthTokenStorage } from './token-storage.js';
import crypto from 'node:crypto';

const AUTH_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface ThoughtboxOAuthProviderOpts {
  clientsStore: OAuthRegisteredClientsStore;
  tokenStorage: OAuthTokenStorage;
  defaultWorkspaceId?: string;
  scopesSupported?: string[];
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function escapeHtmlAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export class ThoughtboxOAuthProvider implements OAuthServerProvider {
  private readonly _clientsStore: OAuthRegisteredClientsStore;
  private readonly tokenStorage: OAuthTokenStorage;
  private readonly defaultWorkspaceId?: string;
  private readonly scopesSupported?: Set<string>;

  constructor(opts: ThoughtboxOAuthProviderOpts) {
    this._clientsStore = opts.clientsStore;
    this.tokenStorage = opts.tokenStorage;
    this.defaultWorkspaceId = opts.defaultWorkspaceId;
    this.scopesSupported = opts.scopesSupported
      ? new Set(opts.scopesSupported)
      : undefined;
  }

  get clientsStore(): OAuthRegisteredClientsStore {
    return this._clientsStore;
  }

  // ---------------------------------------------------------------------------
  // authorize — local: auto-consent; multi-tenant: consent page with API key
  // ---------------------------------------------------------------------------

  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Response,
  ): Promise<void> {
    // Local mode: auto-approve with hardcoded workspace
    if (this.defaultWorkspaceId) {
      await this.issueAuthCodeAndRedirect(
        client, params, this.defaultWorkspaceId, res,
      );
      return;
    }

    // Multi-tenant: check if this is the form submission (POST with api_key)
    const apiKey = (res.req?.body as Record<string, unknown> | undefined)?.api_key as string | undefined;

    if (apiKey) {
      let workspaceId: string;
      try {
        workspaceId = await resolveApiKeyToWorkspace(apiKey);
      } catch {
        throw new AccessDeniedError('Invalid API key');
      }
      await this.issueAuthCodeAndRedirect(
        client, params, workspaceId, res,
      );
      return;
    }

    // Serve the consent page
    res.status(200).type('html').send(this.renderConsentPage(client, params));
  }

  // ---------------------------------------------------------------------------
  // challengeForAuthorizationCode — return stored code_challenge (read-only)
  // ---------------------------------------------------------------------------

  async challengeForAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
  ): Promise<string> {
    return this.tokenStorage.getAuthCodeChallenge(
      authorizationCode, client.client_id,
    );
  }

  // ---------------------------------------------------------------------------
  // exchangeAuthorizationCode — atomically consume code, issue tokens
  // ---------------------------------------------------------------------------

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    _codeVerifier?: string,
    _redirectUri?: string,
    _resource?: URL,
  ): Promise<OAuthTokens> {
    const entry = await this.tokenStorage.consumeAuthCode(
      authorizationCode, client.client_id,
    );

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
    const entry = await this.tokenStorage.lookupRefreshToken(
      tokenHash, client.client_id,
    );

    const effectiveScopes = scopes ?? entry.scopes;
    if (scopes) {
      const allowed = new Set(entry.scopes);
      for (const s of scopes) {
        if (!allowed.has(s)) {
          throw new InvalidRequestError(
            `Scope "${s}" not granted in original authorization`,
          );
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
  // revokeToken — attempt revocation regardless of hint (RFC 7009 §2.1)
  // ---------------------------------------------------------------------------

  async revokeToken(
    _client: OAuthClientInformationFull,
    request: OAuthTokenRevocationRequest,
  ): Promise<void> {
    // token_type_hint is advisory per RFC 7009. Always attempt revocation —
    // revokeRefreshToken is a no-op if the hash doesn't match any row.
    const tokenHash = hashToken(request.token);
    await this.tokenStorage.revokeRefreshToken(tokenHash);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async issueAuthCodeAndRedirect(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    workspaceId: string,
    res: Response,
  ): Promise<void> {
    const code = crypto.randomBytes(32).toString('hex');
    const requested = params.scopes ?? [];
    const scopes = this.scopesSupported
      ? requested.filter((s) => this.scopesSupported!.has(s))
      : requested;

    await this.tokenStorage.storeAuthCode(code, {
      clientId: client.client_id,
      workspaceId,
      codeChallenge: params.codeChallenge,
      redirectUri: params.redirectUri,
      scopes,
      expiresAt: Date.now() + AUTH_CODE_TTL_MS,
    });

    const redirectUrl = new URL(params.redirectUri);
    redirectUrl.searchParams.set('code', code);
    if (params.state) {
      redirectUrl.searchParams.set('state', params.state);
    }

    res.redirect(302, redirectUrl.href);
  }

  private renderConsentPage(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
  ): string {
    const esc = escapeHtmlAttr;
    const clientName = client.client_name ?? client.client_id;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Authorize ${esc(clientName)} — Thoughtbox</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 420px; margin: 80px auto; padding: 0 16px; color: #1a1a1a; }
  h1 { font-size: 1.25rem; font-weight: 600; }
  label { display: block; margin-top: 16px; font-size: 0.875rem; font-weight: 500; }
  input[type=text] { width: 100%; padding: 8px 12px; margin-top: 4px; border: 1px solid #ccc; border-radius: 6px; font-size: 0.9rem; box-sizing: border-box; }
  button { margin-top: 16px; padding: 10px 20px; background: #1a1a1a; color: #fff; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; }
  button:hover { background: #333; }
  .hint { font-size: 0.8rem; color: #666; margin-top: 4px; }
</style>
</head>
<body>
<h1>Authorize ${esc(clientName)}</h1>
<p>Enter your Thoughtbox API key to grant access to your workspace.</p>
<form method="POST" action="/authorize">
  <input type="hidden" name="client_id" value="${esc(client.client_id)}">
  <input type="hidden" name="redirect_uri" value="${esc(params.redirectUri)}">
  <input type="hidden" name="code_challenge" value="${esc(params.codeChallenge)}">
  <input type="hidden" name="code_challenge_method" value="S256">
  <input type="hidden" name="response_type" value="code">
  ${params.state ? `<input type="hidden" name="state" value="${esc(params.state)}">` : ''}
  ${params.scopes?.length ? `<input type="hidden" name="scope" value="${esc(params.scopes.join(' '))}">` : ''}
  <label for="api_key">API Key</label>
  <input type="text" id="api_key" name="api_key" placeholder="tbx_..." required autofocus>
  <p class="hint">Find your API key in the Thoughtbox web app under Settings.</p>
  <button type="submit">Authorize</button>
</form>
</body>
</html>`;
  }
}
