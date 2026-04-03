# SPEC-PROJECT-MODEL: TypeScript Project Model

## Status: DRAFT

## Summary

A CLI-side TypeScript parser that extracts the structural model of a codebase — modules, exports, imports, dependency edges — and uploads it to the Thoughtbox knowledge graph. The server uses this model to enrich incoming tool events with structural context: "the agent edited `addObservation` in the `knowledge` module, which is depended on by `protocol` and `code-mode`." The project model is what turns raw tool event logs into a meaningful narrative. Without it, events are just logs with extra steps.

## Requirements

1. The CLI parses `tsconfig.json` to discover the project's file set and compiler options.
2. Module detection: directories containing `index.ts` (or `index.js`) are treated as modules. Top-level source files outside module directories are grouped under a root module.
3. Per module, the parser extracts: exported symbols (functions, classes, types, interfaces), imported modules (resolved via the TypeScript compiler API import graph), and file count.
4. The parser uploads the model to the Thoughtbox knowledge graph: each module becomes an entity (type: `Module`), each import edge becomes a `DEPENDS_ON` relation, each exported symbol becomes an observation on its module entity.
5. The model is idempotent: re-running `thoughtbox init` updates existing entities rather than creating duplicates. Entity matching is by module name within the project scope.
6. When tool events arrive (via SPEC-HOOK-CAPTURE), the server resolves the `file.path` attribute to its containing module entity and annotates the event with: module name, module's dependents (reverse `DEPENDS_ON` traversal), and the specific export affected (if identifiable from the diff).
7. The model updates when the user re-runs `thoughtbox init` or when the CLI detects structural changes (new modules, changed exports). There is no automatic background sync.

## Acceptance Criteria

- [ ] CLI parses a TypeScript project and produces a list of modules with their exports and import edges
- [ ] Modules are uploaded as knowledge graph entities with `DEPENDS_ON` relations
- [ ] Re-running the parser on the same project updates entities without creating duplicates
- [ ] Server enriches a tool event (Edit on a known file) with module name and dependent modules
- [ ] Parser handles monorepo structures (multiple tsconfig.json files) via explicit path argument
- [ ] Parser completes on a 500-file TypeScript project in under 10 seconds

## Dependencies

- Knowledge graph CRUD (done, 14 Supabase tests passing)
- Graph traversal for reverse dependency lookup (done: `query_graph` follows relations)
- SPEC-HOOK-CAPTURE for the event enrichment trigger
- SPEC-CLI-INIT for the user-facing command that runs the parser

## Open Questions

- Should the model capture function-level granularity (individual exports) or stop at module-level? Function-level gives better enrichment but increases entity count significantly.
- How should non-TypeScript files (JSON configs, markdown, YAML) be represented? They are edited by agents but have no import graph.
- Should the parser use the TypeScript compiler API directly or a lighter tool like `ts-morph`?
