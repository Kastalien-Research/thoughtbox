# SPEC-BLAST-RADIUS: Blast Radius Analysis

## Status: DRAFT

## Summary

Blast radius analysis enriches tool events with structural context from the project model and computes metrics that answer the morning-after question: "did the agent stay on task or go sideways?" By mapping each file touched to its module and computing dependency fan-out, Thoughtbox shows not just what changed but what was affected. A session that edited 2 files in 1 module has a small blast radius; a session that edited 12 files across 6 modules with 15 downstream dependents has a large one. The user sees this at a glance.

## Requirements

1. For each tool event with a `file.path`, resolve the file to its containing module (from SPEC-PROJECT-MODEL). Record the module as an attribute on the stored event.
2. For write events (Edit, Write, Bash that modifies files), compute the dependent modules by traversing reverse `DEPENDS_ON` relations in the knowledge graph. Store the dependent count as an event attribute.
3. Per-connection metrics (computed on demand, not stored): `modules_touched` (count of distinct modules with write events), `modules_read` (count of distinct modules with read events), `read_to_write_ratio` (reads / writes, higher = more investigation), `scope_drift_score` (modules_touched / expected_modules, where expected is derived from the task description or defaults to 3).
4. The web app dashboard shows a connection summary card with: duration, total events, modules touched (with names), blast radius visualization (module dependency subgraph with touched modules highlighted), and the read-to-write ratio as a behavioral indicator.
5. Scope drift alerting: when `modules_touched` exceeds a configurable threshold (default: 5 for a single connection), flag the connection in the dashboard with a warning. No push notification — just visual flagging.
6. The blast radius view supports drill-down: clicking a module shows the specific tool events that touched it, with timestamps and diffs.

## Acceptance Criteria

- [ ] Tool events with file paths are annotated with their containing module name
- [ ] Write events include a count of downstream dependent modules
- [ ] Connection summary computes modules_touched, modules_read, read_to_write_ratio
- [ ] Dashboard displays module dependency subgraph with touched modules highlighted
- [ ] Connections exceeding the scope drift threshold are visually flagged
- [ ] Drill-down from module to individual tool events works in the web app

## Dependencies

- SPEC-PROJECT-MODEL for file-to-module resolution and dependency graph
- SPEC-HOOK-CAPTURE for the tool event stream
- SPEC-CONNECTION-TRACKING for per-connection grouping
- Web app observability page (exists, needs enhancement)

## Open Questions

- How should blast radius handle files outside the project model (e.g., config files, markdown, files in node_modules)? Current plan: group under an "untracked" pseudo-module.
- Should scope_drift_score use the number of modules in the initial task prompt as the baseline, or a static default? The task prompt may not be available to the server.
- Is the module dependency subgraph visualization feasible in the current web app stack, or does it need a new charting library?
