-- OAuth 2.1 tables for MCP spec compliance (2025-03-26 protocol version)
-- Supports Dynamic Client Registration (RFC 7591) and token management.
-- Access tokens are stateless JWTs — not stored here.

-- Dynamic Client Registration store
CREATE TABLE IF NOT EXISTS "public"."oauth_clients" (
    "client_id" text NOT NULL,
    "client_secret" text,
    "client_secret_expires_at" bigint,
    "client_id_issued_at" bigint NOT NULL DEFAULT extract(epoch FROM now())::bigint,
    "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "oauth_clients_pkey" PRIMARY KEY ("client_id")
);

-- Short-lived authorization codes (10 min TTL)
CREATE TABLE IF NOT EXISTS "public"."oauth_authorization_codes" (
    "code" text NOT NULL,
    "client_id" text NOT NULL REFERENCES "public"."oauth_clients"("client_id") ON DELETE CASCADE,
    "workspace_id" uuid NOT NULL,
    "code_challenge" text NOT NULL,
    "redirect_uri" text NOT NULL,
    "scopes" text[] DEFAULT '{}' NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "consumed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "oauth_authorization_codes_pkey" PRIMARY KEY ("code")
);

-- Refresh tokens (7 day TTL)
CREATE TABLE IF NOT EXISTS "public"."oauth_refresh_tokens" (
    "token_hash" text NOT NULL,
    "client_id" text NOT NULL REFERENCES "public"."oauth_clients"("client_id") ON DELETE CASCADE,
    "workspace_id" uuid NOT NULL,
    "scopes" text[] DEFAULT '{}' NOT NULL,
    "expires_at" timestamp with time zone,
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "oauth_refresh_tokens_pkey" PRIMARY KEY ("token_hash")
);

-- Indexes
CREATE INDEX "idx_oauth_codes_client" ON "public"."oauth_authorization_codes" USING btree ("client_id");
CREATE INDEX "idx_oauth_codes_expires" ON "public"."oauth_authorization_codes" USING btree ("expires_at");
CREATE INDEX "idx_oauth_refresh_client" ON "public"."oauth_refresh_tokens" USING btree ("client_id");
CREATE INDEX "idx_oauth_refresh_workspace" ON "public"."oauth_refresh_tokens" USING btree ("workspace_id");

-- RLS: these tables are accessed via service_role key only (same as api_keys)
ALTER TABLE "public"."oauth_clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."oauth_authorization_codes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."oauth_refresh_tokens" ENABLE ROW LEVEL SECURITY;

-- Cleanup: auto-delete expired auth codes after 1 hour
-- (Supabase pg_cron or manual cleanup — codes have 10min TTL so this is generous)
