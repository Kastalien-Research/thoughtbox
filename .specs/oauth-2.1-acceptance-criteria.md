# OAuth 2.1 MCP Auth — Acceptance Criteria

Verification spec for the OAuth 2.1 implementation described in the plan
(`glittery-mapping-sifakis.md`).

**Test modes:** Run each applicable check in both local mode (no Supabase,
in-memory stores, ephemeral JWT key) and multi-tenant mode
(`THOUGHTBOX_STORAGE=supabase`) where noted.

## Verification Tools

Not everything here is testable the same way. The right tool depends on
what layer the check lives at.

| Tool | Good for | Bad for |
|------|----------|---------|
| `curl` | Stateless HTTP endpoints: discovery (A), registration (B), token exchange (C), revocation (F), JWT inspection (D) | Anything requiring an active MCP session — curl can send a single POST but can't maintain SSE streams, session IDs, or JSON-RPC message sequences |
| `npx @modelcontextprotocol/inspector` | Interactive MCP debugging — walks the full protocol handshake, shows tool listings, lets you invoke tools | Automated or repeatable checks |
| Claude Code itself | The real integration test — exercises the full OAuth discovery + PKCE + MCP session flow as a real client would | Isolating which layer failed when something breaks |
| `mcp-remote` / SDK `Client` | Scriptable MCP client that can perform the full protocol handshake programmatically | Not installed by default; setup overhead |

**Each check below is tagged with its verification method.**

---

## A. Discovery Endpoints

> **Verify with:** `curl` — these are plain GET requests returning JSON.

These must exist before any MCP client will attempt auth.

### A1. Protected Resource Metadata

```
curl -s http://localhost:<PORT>/.well-known/oauth-protected-resource/mcp | jq .
```

**Expect:** 200, `Content-Type: application/json`

```json
{
  "resource": "<SERVER_BASE_URL>",
  "authorization_servers": ["<SERVER_BASE_URL>"]
}
```

### A2. Authorization Server Metadata

```
curl -s http://localhost:<PORT>/.well-known/oauth-authorization-server | jq .
```

**Expect:** 200, `Content-Type: application/json`

Required fields:
- `issuer` — matches `SERVER_BASE_URL`
- `authorization_endpoint` — `<SERVER_BASE_URL>/authorize`
- `token_endpoint` — `<SERVER_BASE_URL>/token`
- `registration_endpoint` — `<SERVER_BASE_URL>/register`
- `response_types_supported` — includes `"code"`
- `code_challenge_methods_supported` — includes `"S256"`

---

## B. Dynamic Client Registration (RFC 7591)

> **Verify with:** `curl` — standard POST requests with JSON bodies.

### B1. Successful Registration

```
curl -s -X POST http://localhost:<PORT>/register \
  -H 'Content-Type: application/json' \
  -d '{"redirect_uris":["http://localhost:9999/callback"],"client_name":"acceptance-test"}' \
  | jq .
```

**Expect:** 201, JSON body containing:
- `client_id` — non-empty string
- `client_secret` — non-empty string (only returned once)
- `client_id_issued_at` — unix timestamp
- `redirect_uris` — echoes back the input

Save `client_id` and `client_secret` — needed for all subsequent checks.

### B2. Missing redirect_uris

```
curl -s -X POST http://localhost:<PORT>/register \
  -H 'Content-Type: application/json' \
  -d '{"client_name":"bad-client"}' \
  | jq .
```

**Expect:** 400 error response.

### B3. Registered Client Persists

After B1, verify the client is usable by proceeding to C1. If the
authorize step recognizes the `client_id`, the client persisted.

**Expect:** Client data survives between the registration call and
subsequent usage (not just held in a request-scoped variable).

---

## C. Authorization + Token Exchange (PKCE)

> **Verify with:** `curl` — the authorize endpoint returns a redirect
> (capture with `-w '%{redirect_url}'` or `-L -o /dev/null`), and the
> token endpoint is a standard POST. These are pure HTTP; no MCP session
> needed.

All checks in this section use the `client_id` and `client_secret` from B1.

### Setup: Generate PKCE Pair

```bash
CODE_VERIFIER=$(openssl rand -base64 32 | tr -d '=+/' | head -c 43)
CODE_CHALLENGE=$(echo -n "$CODE_VERIFIER" \
  | openssl dgst -sha256 -binary \
  | base64 \
  | tr '+/' '-_' \
  | tr -d '=')
```

### C1. Authorize — Local Auto-Consent

```
curl -s -o /dev/null -w '%{redirect_url}' \
  "http://localhost:<PORT>/authorize?response_type=code&client_id=<CLIENT_ID>&redirect_uri=http://localhost:9999/callback&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256&state=test123"
```

**Expect (local mode):** 302 redirect to
`http://localhost:9999/callback?code=<AUTH_CODE>&state=test123`

No user interaction required. The server auto-approves and binds to
`local-dev-workspace`. Extract `AUTH_CODE` from the redirect URL.

### C2. Token Exchange — Authorization Code

```
curl -s -X POST http://localhost:<PORT>/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "grant_type=authorization_code&code=$AUTH_CODE&code_verifier=$CODE_VERIFIER&redirect_uri=http://localhost:9999/callback&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET" \
  | jq .
```

**Expect:** 200, JSON body containing:
- `access_token` — a JWT string
- `token_type` — `"bearer"`
- `expires_in` — `1800` (30 minutes)
- `refresh_token` — non-empty string

### C3. Expired or Consumed Code

Repeat C2 with the same `code`.

**Expect:** 400, error `invalid_grant`. Auth codes are single-use.

### C4. Wrong Code Verifier

Run C1 to get a fresh code, then POST to `/token` with a different
`code_verifier` than the one used to generate the `code_challenge`.

**Expect:** 400, error `invalid_grant`.

### C5. Refresh Token Exchange

```
curl -s -X POST http://localhost:<PORT>/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "grant_type=refresh_token&refresh_token=$REFRESH_TOKEN&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET" \
  | jq .
```

**Expect:** 200, JSON with a new `access_token` JWT and `expires_in: 1800`.

### C6. Revoked Refresh Token

After revoking the token (see F1), attempt C5 with the same refresh token.

**Expect:** 400, error `invalid_grant`.

---

## D. Access Token Verification

> **Verify with:** `curl` output + JWT decode — no server interaction
> needed. Decode the base64 payload segment of the access token from C2.

### D1. JWT Claims Structure

```bash
echo "$ACCESS_TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null | jq .
```

**Expect claims:**
- `sub` — equals the `client_id` from B1
- `workspace_id` — `"local-dev-workspace"` in local mode
- `scopes` — array (e.g., `["mcp:tools"]`)
- `iat` — unix timestamp at time of issue
- `exp` — `iat + 1800`

### D2. Signature Verification

Verify the JWT using `jose` or equivalent with the server's signing key.

**Expect:** Signature valid, algorithm `HS256`.

In local mode the key is ephemeral (generated at startup), so this check
must run in the same server session as the token exchange.

---

## E. Dual Auth on /mcp

> **Verify with:** This is the boundary where `curl` starts to break down.
>
> **Auth rejection checks (E4–E6):** `curl` works fine — you send a bad
> request and confirm you get 401 back. No MCP session needed to verify
> rejection.
>
> **Auth acceptance checks (E1–E3):** `curl` can confirm that the server
> doesn't reject the request (i.e., you get a 200 back from an
> `initialize` POST, not a 401). But a single POST doesn't prove the
> full MCP session works — it doesn't test SSE streaming, session
> continuity, or tool invocation over an authenticated connection. For
> that, use MCP Inspector or Claude Code (section G).
>
> The curl checks here are a **necessary but not sufficient** signal.
> "Server accepted my auth" is not the same as "MCP session works."

These checks verify backward compatibility. The existing API key path
must continue to work alongside the new OAuth path.

### E1. API Key via Bearer Header

```
curl -s -X POST http://localhost:<PORT>/mcp \
  -H "Authorization: Bearer tbx_<valid_key>" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"initialize","id":1,"params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"0.1"}}}'
```

**Expect:** 200, JSON-RPC response with server capabilities (not a 401).
Same behavior as before OAuth was added.

**Limitation:** This confirms auth acceptance, not a working MCP session.
Full verification requires MCP Inspector or Claude Code.

### E2. API Key via Query Param

```
curl -s -X POST "http://localhost:<PORT>/mcp?key=tbx_<valid_key>" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"initialize","id":1,"params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"0.1"}}}'
```

**Expect:** Same as E1.

### E3. OAuth JWT via Bearer Header

```
curl -s -X POST http://localhost:<PORT>/mcp \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"initialize","id":1,"params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"0.1"}}}'
```

**Expect:** 200, JSON-RPC response with server capabilities (not a 401).
The `workspace_id` from the JWT is used to resolve storage.

**Limitation:** Same as E1 — confirms auth path works, not full session.

### E4. No Auth — Multi-Tenant

> **Verify with:** `curl` — rejection checks are clean curl territory.

With `THOUGHTBOX_STORAGE=supabase` (multi-tenant mode):

```
curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:<PORT>/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"initialize","id":1,"params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"0.1"}}}'
```

**Expect:** 401.

### E5. Expired JWT

Construct a JWT whose `exp` is in the past (or wait 30 minutes after C2).

```
curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:<PORT>/mcp \
  -H "Authorization: Bearer $EXPIRED_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"initialize","id":1,"params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"0.1"}}}'
```

**Expect:** 401.

### E6. JWT Signed with Wrong Key

Sign a JWT with a different HS256 secret than the server is using.

```
curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:<PORT>/mcp \
  -H "Authorization: Bearer $BAD_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"initialize","id":1,"params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"0.1"}}}'
```

**Expect:** 401.

---

## F. Token Revocation (RFC 7009)

> **Verify with:** `curl` — standard POST endpoint.

### F1. Revoke a Refresh Token

```
curl -s -X POST http://localhost:<PORT>/revoke \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "token=$REFRESH_TOKEN&token_type_hint=refresh_token&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET"
```

**Expect:** 200 (success). Per RFC 7009, this returns 200 even if the token
was already revoked or unknown.

### F2. Revoked Token Is Rejected

After F1, attempt to use the same refresh token in a token exchange (C5).

**Expect:** 400, error `invalid_grant`.

---

## G. End-to-End: Claude Code Connects

> **Verify with:** Claude Code — the only way to test the full flow. This
> exercises OAuth discovery, Dynamic Client Registration, PKCE auth,
> token exchange, MCP session establishment, SSE streaming, and tool
> invocation as a single integrated flow. If G passes, everything works.
> If G fails but A–F pass, the problem is in MCP session handling (not
> OAuth).

### G1. Auto-Discovery and Connection

1. Start the server: `pnpm dev`
2. Add the server to Claude Code's `.mcp.json` with the HTTP URL
3. Claude Code hits A1 and A2, discovers OAuth endpoints
4. Claude Code performs Dynamic Client Registration (B1)
5. Claude Code runs the PKCE authorize flow (C1 + C2)
6. Connection succeeds with no user interaction

**Expect:** Claude Code shows the server as connected.

### G2. Tools Available and Callable

After G1, the MCP tools are listed in Claude Code.

**Expect:** `thoughtbox_search` and `thoughtbox_execute` appear in the tool
list. Invoking one returns a result (not an auth error or session error).

### G3. MCP Inspector Fallback

If G1 fails and you need to isolate whether the problem is OAuth or MCP
session handling:

```
npx @modelcontextprotocol/inspector http://localhost:<PORT>/mcp
```

Inspector walks the same protocol handshake as Claude Code but shows each
step interactively. Use it to identify which specific step fails.
