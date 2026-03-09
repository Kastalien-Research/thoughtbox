# Documentation Inconsistencies Audit

This file lists claims in `docs/docs-for-llms/` that are not clearly supported by the current codebase as checked on 2026-03-07.

The goal is strictness: if a claim is not directly backed by the current implementation, or is backed only partially, it is listed here.

## Findings

| Doc file | Claim | Evidence checked | Verdict | Notes |
|---|---|---|---|---|
| `ARCHITECTURE.md` | Project version is `1.3.0` | `package.json:3` shows `1.2.2` | Unsupported | Top-level version in the doc is ahead of the codebase. |
| `ARCHITECTURE.md` | Session continuity is implemented via `src/sessions/handlers.ts:restoreFromSession()` | `src/thought-handler.ts:245` contains `restoreFromSession()`, `src/sessions/handlers.ts` does not | Unsupported | The feature exists, but the documented implementation location is wrong. |
| `ARCHITECTURE.md`, `CONFIGURATION.md`, `DATA-MODELS.md` | Event stream includes `thought_revised`, `session_loaded`, `cipher_loaded`, `stage_changed`, `session_started`, `session_exported` | `src/events/types.ts`, `src/events/event-emitter.ts` define only `session_created`, `thought_added`, `branch_created`, `session_completed`, `export_requested` | Partially unsupported | Event streaming exists, but the documented event taxonomy does not match the implemented one. |
| `CONFIGURATION.md` | `THOUGHTBOX_OBSERVATORY_HTTP_API` defaults to `false` | `src/observatory/config.ts:31`, `src/observatory/config.ts:52` default effectively to `true` unless explicitly set to `false` | Unsupported | The documented default is inverted. |
| `CONFIGURATION.md` | `THOUGHTBOX_EVENT_OUTPUT`, `THOUGHTBOX_EVENT_FILE`, and `THOUGHTBOX_EVENT_TYPES` are supported environment variables | Search across `src/` found no implementation reading these env vars | Unsupported | Event streaming config exists as TypeScript types, but these documented env vars are not wired up in the codebase. |
| `CONFIGURATION.md` | Event streaming supports output destinations `stderr`, `stdout`, `file` and event-type filtering via env vars | `src/events/types.ts` and `src/events/event-emitter.ts` support a generic destination concept, but env-var-driven output and filtering are not clearly implemented | Partially unsupported | The docs describe a richer configuration surface than the current code clearly exposes. |

## Not flagged as inconsistencies

These claims were checked and appear to be supported:

- `list_roots` and `bind_root` are real operations (`src/gateway/gateway-handler.ts`, `src/init/tool-handler.ts`, `src/init/operations.ts`).
- `restoreFromSession()` exists as a feature, just not in the documented file.
- Observatory default port `1729` is correct (`src/observatory/config.ts`).
- `THOUGHTBOX_OBSERVATORY_HTTP_API` itself is a real env var; only the documented default is wrong.

## Recommended follow-up

1. Bring event-streaming docs into sync with the actual implemented event types.
2. Either implement the documented event-streaming env vars or remove them from the docs.
3. Fix the documented implementation location for `restoreFromSession()`.
4. Update the docs-for-llms version banner to match `package.json`.