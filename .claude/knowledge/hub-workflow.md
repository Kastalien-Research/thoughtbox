# Hub Development Workflow

Patterns, standards, and lessons for working on the Thoughtbox Hub.

## HDD (Hypothesis-Driven Development)

ALL architectural changes must follow:
1. **Research** — form hypotheses, gather evidence
2. **Staging ADR** — write decision record in `staging/docs/adr/`
3. **Implementation** — build it
4. **Validation** — test against hypotheses
5. **Decision** — accept/reject/modify

- ADRs are source of truth, located in `staging/docs/adr/`
- Specs in `.specs/` are design docs, NOT implementation authorization
- A DRAFT spec does NOT authorize implementation

## Hub TDD Pattern

All 11 hub modules implemented via strict TDD:
- Factory pattern: `createXxxManager(storage, thoughtStore)` returning typed interfaces
- Shared test helpers: `src/hub/__tests__/test-helpers.ts` (in-memory storage + thought store)
- Test runner: vitest (`vitest.config.ts` in project root)

## Process Violations Found (2026-02-07)

These are documented as lessons, not to repeat:
- SPEC-HUB-002 (profiles) implemented without staging ADR — spec still DRAFT
- Profile registration has no capability detection
- Priming implementation diverged from spec (appends to gateway response instead of updating ThoughtHandler)
