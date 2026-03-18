# Supabase Auth + MCP Research (2026-03-13)

Raw materials for ADR-AUTH-01. Sources scraped from official docs and reference implementations.

## Source 1: Supabase MCP Authentication Guide

URL: https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication

### How MCP authentication works

1. **Discovery**: MCP client fetches OAuth config from discovery endpoint
2. **Registration** (optional): Client registers itself via Dynamic Client Registration (DCR)
3. **Authorization**: User redirected to your authorization endpoint to approve AI tool access
4. **Token exchange**: Supabase issues access + refresh tokens for the authenticated user
5. **Authenticated access**: MCP server makes requests to Supabase APIs on behalf of user

### Key points

- MCP clients auto-configure using Supabase discovery endpoints
- DCR lets MCP clients register themselves automatically (enable in dashboard: Authentication > OAuth Server)
- Existing RLS policies automatically apply to MCP clients
- FastMCP (Python) has built-in SupabaseProvider for this exact pattern
- Token validation uses same approach as other OAuth clients

## Source 2: Getting Started with OAuth 2.1 Server

URL: https://supabase.com/docs/guides/auth/oauth-server/getting-started

### Setup steps

1. Enable OAuth 2.1 in dashboard: Authentication > OAuth Server (beta, free on all plans)
2. Configure authorization path (e.g., /oauth/consent)
3. Build authorization UI (frontend consent screen)
4. Register OAuth client applications

### Endpoints exposed after enabling

| Endpoint | URL |
|----------|-----|
| Authorization | /auth/v1/oauth/authorize |
| Token | /auth/v1/oauth/token |
| JWKS | /auth/v1/.well-known/jwks.json |
| Discovery | /.well-known/oauth-authorization-server/auth/v1 |
| OIDC discovery | /auth/v1/.well-known/openid-configuration |

### JWT signing

- Default is HS256 (symmetric) -- NOT recommended for OAuth
- Should migrate to RS256 or ES256 (asymmetric)
- Asymmetric keys required for OpenID Connect ID tokens
- Third-party clients validate JWTs via public key from JWKS endpoint

### Client registration

- Dashboard: Authentication > OAuth Apps > Add new client
- Client types: Public (mobile/SPA, no secret) or Confidential (server-side, with secret)
- Token endpoint auth methods: none (public), client_secret_basic (default confidential), client_secret_post
- Redirect URIs must be exact matches (no wildcards)

### Authorization UI (frontend)

- supabase.auth.oauth.getAuthorizationDetails(authorization_id)
- supabase.auth.oauth.approveAuthorization(authorization_id)
- supabase.auth.oauth.denyAuthorization(authorization_id)
- Approve/deny returns redirect_to URL

## Source 3: OAuth 2.1 Flows

URL: https://supabase.com/docs/guides/auth/oauth-server/oauth-flows

### Supported grant types

1. Authorization Code with PKCE (authorization_code) -- for initial tokens
2. Refresh Token (refresh_token) -- for new tokens without re-auth
3. client_credentials and password are NOT supported

### Access token structure (OAuth)

```json
{
  "aud": "authenticated",
  "sub": "user-uuid",
  "role": "authenticated",
  "client_id": "9a8b7c6d-...",
  "iss": "https://<project-ref>.supabase.co/auth/v1",
  "session_id": "session-uuid",
  "email": "user@example.com"
}
```

Key: client_id claim identifies which OAuth client obtained the token.

### Available scopes

| Scope | Effect |
|-------|--------|
| openid | Enables OIDC, includes ID token |
| email | email + email_verified |
| profile | name, picture, etc. |
| phone | phone_number + verified |

Default scope when none specified: email. Custom scopes not yet supported.

### Token validation (Node.js)

```typescript
import { createRemoteJWKSet, jwtVerify } from 'jose'

const JWKS = createRemoteJWKSet(
  new URL('https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json')
)

async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: 'https://<project-ref>.supabase.co/auth/v1',
    audience: 'authenticated',
  })
  return payload
}
```

### User grant management

- supabase.auth.oauth.getUserGrants() -- list authorized apps
- supabase.auth.oauth.revokeGrant(clientId) -- revoke (invalidates all sessions + refresh tokens)

## Source 4: Token Security and RLS

URL: https://supabase.com/docs/guides/auth/oauth-server/token-security

### Key insight

OAuth scopes control OIDC data only, NOT database access.
Use RLS with client_id claim to control which OAuth clients access which data.

### RLS patterns

```sql
-- Extract client_id from token
(auth.jwt() ->> 'client_id')

-- Check if from OAuth client (vs direct user session)
(auth.jwt() ->> 'client_id') IS NOT NULL

-- Restrict sensitive data to direct sessions only
CREATE POLICY "No OAuth for payments"
ON payment_methods FOR ALL
USING (
  auth.uid() = user_id AND
  (auth.jwt() ->> 'client_id') IS NULL
);
```

### Custom Access Token Hooks

- Triggered for ALL token issuance including OAuth
- Can customize aud claim per client, add workspace/project claims
- Implemented as Supabase Edge Functions
- Use client_id to differentiate OAuth from regular auth

## Source 5: FastMCP SupabaseProvider (Reference)

URL: https://gofastmcp.com/python-sdk/fastmcp-server-auth-providers-supabase

- FastMCP acts as resource server (verifies JWTs)
- Supabase handles OAuth flow directly
- Verifies JWTs using JWKS endpoint
- Supports DCR via metadata forwarding
- Default auth_route is /auth/v1

## Implications for Thoughtbox

### What aligns

- Supabase project already has product schema + RLS
- Cloud Run service already validates JWTs (currently self-minted)
- client_id claim maps naturally to our existing project claim
- Token validation with jose library is a small middleware addition

### What changes

1. Enable OAuth 2.1 Server on Supabase project
2. Switch JWT signing from HS256 to RS256/ES256
3. Build authorization UI (consent screen) -- frontend requirement (WS-07)
4. Update Cloud Run middleware to validate via JWKS instead of self-minting
5. Register Thoughtbox MCP as OAuth client (or enable DCR)
6. Update RLS policies: auth.uid() + client_id instead of project claim

### Migration path

Current: Self-minted JWTs with project claim -> RLS checks auth.jwt() ->> 'project'
Target: Supabase-issued JWTs with sub (user) + client_id -> RLS checks auth.uid() + client_id

### Open questions for ADR-AUTH-01

1. Enable DCR (any MCP client registers) or pre-register only?
2. Need consent UI for v1, or simpler API key approach initially?
3. How does workspace-scoping map to OAuth? Custom claim via Access Token Hook?
4. Migration path for existing self-minted project tokens?
