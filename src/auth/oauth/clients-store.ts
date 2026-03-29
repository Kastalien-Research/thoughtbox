/**
 * OAuth 2.1 client registration stores.
 *
 * Two implementations:
 * - SupabaseClientsStore: persists to oauth_clients table (deployed)
 * - InMemoryClientsStore: Map-backed, volatile (local dev)
 *
 * Client secrets are stored as plaintext because the SDK's clientAuth
 * middleware does a direct string equality check (clientAuth.js:23).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import type { OAuthClientInformationFull } from '@modelcontextprotocol/sdk/shared/auth.js';

/** Fields stored as dedicated columns (not in metadata jsonb). */
const COLUMN_FIELDS = [
  'client_id',
  'client_secret',
  'client_secret_expires_at',
  'client_id_issued_at',
] as const;

type ColumnField = (typeof COLUMN_FIELDS)[number];

interface OAuthClientRow {
  client_id: string;
  client_secret: string | null;
  client_secret_expires_at: number | null;
  client_id_issued_at: number | null;
  metadata: Record<string, unknown>;
}

function rowToClient(row: OAuthClientRow): OAuthClientInformationFull {
  return {
    ...row.metadata,
    client_id: row.client_id,
    client_secret: row.client_secret ?? undefined,
    client_secret_expires_at: row.client_secret_expires_at ?? undefined,
    client_id_issued_at: row.client_id_issued_at ?? undefined,
  } as OAuthClientInformationFull;
}

function clientToRow(
  client: OAuthClientInformationFull,
): OAuthClientRow {
  const metadata: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(client)) {
    if (!COLUMN_FIELDS.includes(key as ColumnField)) {
      metadata[key] = value;
    }
  }

  return {
    client_id: client.client_id,
    client_secret: client.client_secret ?? null,
    client_secret_expires_at: client.client_secret_expires_at ?? null,
    client_id_issued_at: client.client_id_issued_at ?? null,
    metadata,
  };
}

export interface SupabaseClientsStoreOpts {
  supabaseUrl: string;
  serviceRoleKey: string;
}

export class SupabaseClientsStore implements OAuthRegisteredClientsStore {
  private supabase: SupabaseClient;

  constructor(opts: SupabaseClientsStoreOpts) {
    this.supabase = createClient(opts.supabaseUrl, opts.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async getClient(
    clientId: string,
  ): Promise<OAuthClientInformationFull | undefined> {
    const { data, error } = await this.supabase
      .from('oauth_clients')
      .select('client_id, client_secret, client_secret_expires_at, client_id_issued_at, metadata')
      .eq('client_id', clientId)
      .single();

    if (error || !data) return undefined;

    return rowToClient(data as OAuthClientRow);
  }

  async registerClient(
    client: OAuthClientInformationFull,
  ): Promise<OAuthClientInformationFull> {
    const row = clientToRow(client);

    const { error } = await this.supabase
      .from('oauth_clients')
      .insert(row);

    if (error) {
      throw new Error(`Failed to register OAuth client: ${error.message}`);
    }

    return client;
  }
}

export class InMemoryClientsStore implements OAuthRegisteredClientsStore {
  private clients = new Map<string, OAuthClientInformationFull>();

  async getClient(
    clientId: string,
  ): Promise<OAuthClientInformationFull | undefined> {
    return this.clients.get(clientId);
  }

  async registerClient(
    client: OAuthClientInformationFull,
  ): Promise<OAuthClientInformationFull> {
    this.clients.set(client.client_id, client);
    return client;
  }
}
