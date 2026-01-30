# Observatory Architecture Specs

This folder documents how the Observatory UI maps to Thoughtbox server behavior.

Contents:
- `observatory-overview.md` — high-level architecture and components.
- `observatory-event-map.md` — end-to-end event flow from emitters to UI.
- `observatory-ui-bindings.md` — UI update triggers and the payload fields they use.
- `observatory-http-api.md` — REST endpoints and data sources.
- `observatory-issues.md` — known wiring or contract gaps found during review.

Conventions:
- Event format is `[topic, event, payload]`.
- Topics: `observatory` (global) and `reasoning:<sessionId>` (per session).
- File paths in this doc are relative to repository root unless noted.
