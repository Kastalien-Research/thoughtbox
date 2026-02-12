# Run History

Historical context for major workstreams. Consult when resuming work.

## Knowledge Graph Extraction (COMPLETE, 2026-02-10)

- **Branch**: feat/knowledge-read-loop — no code changes, all work via MCP
- **Result**: 57 entities, 75 relations, 18 observations in server-side knowledge graph
- **Priming verified**: `cipher` auto-injects knowledge context; `knowledge_prime` returns filtered entity digest
- **Hub workspace**: f927e88f — 5 problems, 30+ channel messages, full audit trail
- **Critic rating**: 3/5 stars — entity naming excellent, observation coverage low (0.32 avg)
- **Known issues**: 3 duplicate relations, 3 remaining orphan entities, 1 borderline type classification

## Observatory Native Primitives — Run 005 (2026-02-09)

- **Branch**: feat/observatory-native-primitives
- **Resume instructions**: `git reset --hard main` then `git stash pop` (stash: "agent-definitions-toolsearch")
- **Hub workspace**: 5a4755ae-f715-4e4a-82e6-82ede40de80c — 6 problems with deps, all open
- **Hypotheses H1-H9 locked** — thought #1 in session 621b47fb
- **H1-H9**: Tab renames, Channels tab, Activity enrichment, Hidden primitives (deps/comments/reviews/consensus), Cross-refs, Session persistence
- **Container**: 24 workspaces, 26 Feb sessions. proof-run-001 (63f6cb07) has rich test data.
- **Observatory REST API**: port 1729 (same as UI, NOT 1731/MCP). 8 endpoints verified.
- **Session store**: in-memory only (InMemorySessionStore in reasoning.ts). H9 fixes this.
- **Team**: crispy-snuggling-dahl, workspace: abd65cd4

## Multi-Agent Demo (VERIFIED, 2026-02-08)

- Session isolation CONFIRMED: sub-agents get separate agentIds
- Cross-workspace visibility CONFIRMED
- Cross-agent review CONFIRMED: Debugger approved Architect's proposal
- Coordinator caveat: re-registering loses coordinator role
- Hub profile agents: `.claude/agents/hub-{coordinator,architect,debugger}.md`
- Orchestration skill: `.claude/skills/hub-collab/SKILL.md`

## Continual Improvement Scaffolding (2026-02-11)

- 10 specs in `specs/continual-improvement/` (gitignored)
- 6 agent definitions in `.claude/agents/`
- 15+ SDK scripts in `scripts/agents/`
- 5 new skills, DGM state, eval baselines, assumption registry
- ULC Ralph loop skill: `/ulc-loop`
- QD database: `research-workflows/workflows.db` (adversarial findings, attack patterns, workflows)
