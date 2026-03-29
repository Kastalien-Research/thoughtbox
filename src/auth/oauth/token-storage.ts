/**
 * OAuth 2.1 token storage — auth codes and refresh tokens.
 *
 * Two implementations:
 * - SupabaseTokenStorage: persists to oauth_authorization_codes and
 *   oauth_refresh_tokens tables (deployed)
 * - InMemoryTokenStorage: Map-backed, volatile (local dev)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  InvalidGrantError,
} from '@modelcontextprotocol/sdk/server/auth/errors.js';

export interface AuthCodeEntry {
  clientId: string;
  workspaceId: string;
  codeChallenge: string;
  redirectUri: string;
  scopes: string[];
  expiresAt: number;
}

export interface RefreshTokenEntry {
  clientId: string;
  workspaceId: string;
  scopes: string[];
  expiresAt: number;
}

export interface OAuthTokenStorage {
  storeAuthCode(code: string, entry: AuthCodeEntry): Promise<void>;
  getAuthCodeChallenge(code: string, clientId: string): Promise<string>;
  consumeAuthCode(code: string, clientId: string): Promise<AuthCodeEntry>;
  storeRefreshToken(tokenHash: string, entry: RefreshTokenEntry): Promise<void>;
  lookupRefreshToken(tokenHash: string, clientId: string): Promise<RefreshTokenEntry>;
  revokeRefreshToken(tokenHash: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Supabase implementation
// ---------------------------------------------------------------------------

export interface SupabaseTokenStorageOpts {
  supabaseUrl: string;
  serviceRoleKey: string;
}

export class SupabaseTokenStorage implements OAuthTokenStorage {
  private readonly supabaseUrl: string;
  private readonly serviceRoleKey: string;
  private client?: SupabaseClient;

  constructor(opts: SupabaseTokenStorageOpts) {
    this.supabaseUrl = opts.supabaseUrl;
    this.serviceRoleKey = opts.serviceRoleKey;
  }

  private ensureClient(): SupabaseClient {
    if (!this.client) {
      this.client = createClient(this.supabaseUrl, this.serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return this.client;
  }

  async storeAuthCode(code: string, entry: AuthCodeEntry): Promise<void> {
    const { error } = await this.ensureClient()
      .from('oauth_authorization_codes')
      .insert({
        code,
        client_id: entry.clientId,
        workspace_id: entry.workspaceId,
        code_challenge: entry.codeChallenge,
        redirect_uri: entry.redirectUri,
        scopes: entry.scopes,
        expires_at: new Date(entry.expiresAt).toISOString(),
      });

    if (error) {
      throw new Error(`Failed to store auth code: ${error.message}`);
    }
  }

  async getAuthCodeChallenge(code: string, clientId: string): Promise<string> {
    const { data, error } = await this.ensureClient()
      .from('oauth_authorization_codes')
      .select('code_challenge, client_id')
      .eq('code', code)
      .single();

    if (error || !data) throw new InvalidGrantError('Invalid authorization code');
    if (data.client_id !== clientId) throw new InvalidGrantError('Client mismatch');

    return data.code_challenge;
  }

  async consumeAuthCode(code: string, clientId: string): Promise<AuthCodeEntry> {
    // Atomic: UPDATE ... SET consumed_at = now()
    // WHERE code = ? AND consumed_at IS NULL AND expires_at > now()
    // RETURNING *
    const { data, error } = await this.ensureClient()
      .from('oauth_authorization_codes')
      .update({ consumed_at: new Date().toISOString() })
      .eq('code', code)
      .is('consumed_at', null)
      .gt('expires_at', new Date().toISOString())
      .select('*')
      .single();

    if (error || !data) {
      throw new InvalidGrantError('Invalid, already-used, or expired authorization code');
    }
    if (data.client_id !== clientId) {
      throw new InvalidGrantError('Client mismatch');
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

  async storeRefreshToken(tokenHash: string, entry: RefreshTokenEntry): Promise<void> {
    const { error } = await this.ensureClient()
      .from('oauth_refresh_tokens')
      .insert({
        token_hash: tokenHash,
        client_id: entry.clientId,
        workspace_id: entry.workspaceId,
        scopes: entry.scopes,
        expires_at: new Date(entry.expiresAt).toISOString(),
      });

    if (error) {
      throw new Error(`Failed to store refresh token: ${error.message}`);
    }
  }

  async lookupRefreshToken(tokenHash: string, clientId: string): Promise<RefreshTokenEntry> {
    const { data, error } = await this.ensureClient()
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

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    const { error } = await this.ensureClient()
      .from('oauth_refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('token_hash', tokenHash);

    if (error) {
      throw new Error(`Failed to revoke refresh token: ${error.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// In-memory implementation
// ---------------------------------------------------------------------------

interface InMemoryAuthCode extends AuthCodeEntry {
  consumedAt?: number;
}

interface InMemoryRefreshToken extends RefreshTokenEntry {
  revokedAt?: number;
}

export class InMemoryTokenStorage implements OAuthTokenStorage {
  private authCodes = new Map<string, InMemoryAuthCode>();
  private refreshTokens = new Map<string, InMemoryRefreshToken>();

  async storeAuthCode(code: string, entry: AuthCodeEntry): Promise<void> {
    this.authCodes.set(code, { ...entry });
  }

  async getAuthCodeChallenge(code: string, clientId: string): Promise<string> {
    const entry = this.authCodes.get(code);
    if (!entry) throw new InvalidGrantError('Invalid authorization code');
    if (entry.clientId !== clientId) throw new InvalidGrantError('Client mismatch');
    return entry.codeChallenge;
  }

  async consumeAuthCode(code: string, clientId: string): Promise<AuthCodeEntry> {
    const entry = this.authCodes.get(code);
    if (!entry) throw new InvalidGrantError('Invalid authorization code');
    if (entry.clientId !== clientId) throw new InvalidGrantError('Client mismatch');
    if (entry.consumedAt) throw new InvalidGrantError('Authorization code already used');
    if (entry.expiresAt < Date.now()) throw new InvalidGrantError('Authorization code expired');
    entry.consumedAt = Date.now();
    return entry;
  }

  async storeRefreshToken(tokenHash: string, entry: RefreshTokenEntry): Promise<void> {
    this.refreshTokens.set(tokenHash, { ...entry });
  }

  async lookupRefreshToken(tokenHash: string, clientId: string): Promise<RefreshTokenEntry> {
    const entry = this.refreshTokens.get(tokenHash);
    if (!entry) throw new InvalidGrantError('Invalid refresh token');
    if (entry.clientId !== clientId) throw new InvalidGrantError('Client mismatch');
    if (entry.revokedAt) throw new InvalidGrantError('Refresh token revoked');
    if (entry.expiresAt < Date.now()) throw new InvalidGrantError('Refresh token expired');
    return entry;
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    const entry = this.refreshTokens.get(tokenHash);
    if (entry) entry.revokedAt = Date.now();
  }
}
