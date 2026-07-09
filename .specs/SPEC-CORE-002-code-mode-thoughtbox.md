# SPEC-CORE-002: Code Mode Thoughtbox

> **Status**: Partially adopted — Layer A (Code Mode authoring surface) shipped; Layers B/C/D (Canonical IR, TBX-C1 wire codec, projections) were removed from this spec in the 2026-07 demolition pass as dead design work.
> **Created**: 2026-03-13
> **Branch**: `feat/code-mode-mvp`
> **Depends on**: None

## Scope

This specification defines the migration of Thoughtbox from a massive multi-tool JSON schema API toward a Code Mode architecture (inspired by Cloudflare's "Code Mode MCP" concept which can "give agents an entire API in 1,000 tokens").

The surviving scope is the authoring layer: a tiny MCP tool surface behind which the model writes JavaScript against a typed `tb` SDK, radically reducing context window usage while improving reasoning precision.

## 1. Problem Statement

Thoughtbox previously exposed its semantic operations and reasoning abstractions via heavy MCP JSON Schema tool definitions. As the reasoning abstractions (claims, revisions, parallel branches, etc.) and hub tools grow, the context window cost to load the API definition and serialize large payloads back-and-forth balloons.

## 2. Layer A: Authoring API (The Code Mode Sandbox)

The model interacts with Thoughtbox by writing simple JavaScript/TypeScript snippets, executed server-side. It does not generate raw JSON payloads or manual cipher strings.

*   **Surface:** A tiny set of MCP tools, such as `search()` and `execute()`.
*   **Helpers:** Inside `execute()`, a typed `tb` library provides builders:
    *   `tb.claim(text, { supports: [...] })`
    *   `tb.plan(...)`
    *   `tb.question(...)`
    *   `tb.evidence(...)`

### Security Constraints

Because executing LLM-generated JS/TS server-side, the isolate boundary must be strictly constrained:
*   **API Isolation:** Host APIs like `fs`, `net`, `child_process`, and environment variables (`process.env`) are fully restricted. The isolate only receives the explicit `tb` library. Other MCP tools cannot be invoked from within the script unless explicitly proxied.
*   **Resource Limits:** Every `execute` call runs within a strict CPU and memory budget (e.g., 50ms execution time, minimal memory allowance) to prevent Denial of Service (DoS) attacks via infinite loops or huge allocations.
*   **Injection Protection:** The `tb` library is injected dynamically into the isolate global scope but does not share memory with the Node/Deno host, preventing prototype pollution or sandbox escapes that could exfiltrate host secrets.

## 3. Execution Flow

1. **Discovery:** The LLM uses `search({ code: "..." })` to query available Thoughtbox operations, schema shapes, or context boundaries.
2. **Authoring:** The LLM calls `execute({ code: "..." })`, writing JS/TS using the injected `tb` helper library.
3. **Execution:** The host sandbox evaluates the script and dispatches `tb.*` calls to the Thoughtbox operation registry, which persists results through the storage layer.
4. **Response:** Results (and any `console.log` output) are returned to the model as compact JSON.

## Removed design work (historical note)

Earlier revisions of this spec defined three additional layers — Layer B (a Canonical Thoughtbox IR envelope), Layer C (a `TBX-C1` compact wire codec with dictionary/columnar compression), and Layer D (async read-optimized projections) — plus a five-phase rollout built around dual-write shadow emission. None of that was implemented and it no longer reflects intended direction. See git history of this file for the full text.
