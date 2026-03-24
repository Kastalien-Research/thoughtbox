# ADR-003: Observatory Historical Sessions

## Status

PROPOSED

## Context

The Observatory UI only shows sessions received via real-time WebSocket events during the current server lifetime. Opening the Observatory when no reasoning session is active shows an empty screen. Meanwhile, all historical sessions are fully persisted on disk via `FileSystemStorage` with rich query APIs — but the Observatory server has zero access to this storage.

## Decision

### 1. Dependency Injection

Pass `ThoughtboxStorage` into `createObservatoryServer` as an optional parameter. This avoids:
- Duplicating storage initialization (a second `FileSystemStorage` instance)
- Cross-server HTTP calls between Observatory and MCP server
- Global singleton access patterns

The parameter is optional to maintain backward compatibility — the Observatory works without storage (existing behavior) but gains historical session loading when storage is provided.

### 2. REST for History, WebSocket for Live

Historical data is loaded via REST `fetch()` from the existing `/api/sessions` and `/api/sessions/:id` endpoints (extended to query persistent storage). Real-time events remain on WebSocket channels.

This separation keeps the existing WebSocket protocol unchanged while adding a simple request/response pattern for bulk historical data loading.

### 3. Adapter Pattern

A thin translation layer converts between persistence types (`Session` with `Date` objects, `ThoughtData` without `id` field) and Observatory types (`Session` with ISO strings and `status` field, `Thought` with `id` field).

Two pure functions handle the mapping:
- `toObservatorySession()`: Date→ISO, infers `status: "completed"` for persisted sessions
- `toObservatoryThought()`: synthesizes `id` as `"${sessionId}:${td.thoughtNumber}"`, maps shared fields

## Consequences

- Observatory shows historical sessions on startup (no more empty screen)
- Active sessions still appear via WebSocket with real-time updates
- Active sessions override historical entries when both exist (deduplication by ID)
- No changes to WebSocket protocol or channel architecture
- Storage parameter is optional — tests and standalone Observatory still work without it
