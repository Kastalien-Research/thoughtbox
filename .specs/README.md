# Thoughtbox Specs Directory

This directory contains active specs, implementation notes, and historical
working material for the repository.

## What is authoritative

- **Claim-bearing specs** are Markdown files with YAML frontmatter matching
  `.schemas/spec-v1.json`.
- The `spec_id` and `claims` fields are the source of truth for PR claim
  references such as `SPEC-CONTROL-PLANE:c1`.
- Historical ADRs live under `docs/decisions/archive/adr/`.

## Current conventions

1. New implementation or architecture work should add or update a spec under
   `.specs/`.
2. Specs that govern implementation should include frontmatter claims.
3. PR descriptions belong under `prs/` and reference spec claims rather than
   archived ADR claims.
4. Supporting notes, diagrams, and prompts can live alongside specs, but they do
   not replace claim-bearing spec files.

## Directory shape

- Top-level `SPEC-*.md` files: standalone specs with broad repo impact.
- Topic folders such as `mcp-peer-notebooks/`, `production-overview/`, and
  `auditability/`: domain-specific spec clusters and supporting artifacts.
- `.specs/old-specs/`: quarantined historical material, useful for archaeology
  but not current authority by default.
- `.specs/letta-specific/`: legacy Letta/DGM-specific specs retained as history.

## Implementation-ready guidance

Use `.specs/IMPLEMENTATION-READY.md` for the current checklist that determines
whether a spec is ready to drive implementation.

## Related references

- `.schemas/spec-v1.json` — frontmatter schema for claim-bearing specs
- `prs/README.md` — PR description format and claim reference rules
- `AGENTS.md` — repo workflow rules and current source-of-truth hierarchy

## Notes

Some older inventory and brainstorming files remain in this directory for
historical context. If a file without frontmatter conflicts with a current
claim-bearing spec or `AGENTS.md`, prefer the current claim-bearing spec and
repo rules.
