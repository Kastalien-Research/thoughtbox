# Project Structure

Essential paths and what's where.

## Core Thoughtbox

| Path | Contents |
|------|----------|
| `src/` | Main source code |
| `src/hub/` | Hub modules: identity, attribution, workspace, problems, proposals, consensus, channels, proxy, hub-handler, hub-storage-fs |
| `src/hub/hub-types.ts` | Hub TypeScript type definitions |
| `src/hub/__tests__/` | Hub unit tests (vitest) |
| `src/hub/__tests__/test-helpers.ts` | Shared test helpers (in-memory storage + thought store) |

## Specifications & Design

| Path | Contents | Note |
|------|----------|------|
| `.specs/` | Design docs (DRAFT status) | NOT implementation authorization |
| `staging/docs/adr/` | Architecture Decision Records | Source of truth |
| `specs/continual-improvement/` | CI system specs (10 specs) | Gitignored — local reference only |
| `agentic-dev-team/agentic-dev-team-spec.md` | Agent team roles spec | 4 roles with escalation thresholds |

## Agent Infrastructure

| Path | Contents |
|------|----------|
| `.claude/agents/` | Agent definitions (.md files) |
| `.claude/skills/` | Skill definitions (SKILL.md files) |
| `.claude/rules/` | Behavioral rules (always loaded) |
| `.claude/hooks/` | Session hooks (write-protected) |
| `.claude/knowledge/` | Detailed knowledge files (this directory) |
| `scripts/agents/` | Agent SDK script wrappers |
| `scripts/utils/` | Utility scripts |

## Data Stores

| Path | Format | Contents |
|------|--------|----------|
| `research-workflows/workflows.db` | SQLite | QD populations, adversarial findings, attack patterns, taste evaluations |
| `.assumptions/registry.jsonl` | JSONL | Verified/unverified assumptions |
| `.eval/baselines.json` | JSON | Evaluation metric baselines |
| `.dgm/` | JSON | DGM state (fitness, lineage, niche grid) |
| `agentops/` | Mixed | AgentOps pipeline, signals, runner |

## CI/CD & GitHub

| Path | Contents |
|------|----------|
| `.github/workflows/` | CI, AgentOps daily brief, SIL weekly, controller sync |
| `dgm-specs/implementation-status.json` | Spec implementation tracking |

## Branch State

- **main**: Hub core ops, thought chains, observatory, branch thought retrieval
- **feat/hub-wait** (NOT merged): profiles, hub_wait, behavioral test suite, profile priming
- **fix/read-thoughts-range** (PR #100, NOT merged): range/last query fix, gateway description updates
- **fix/observatory-workspace-events** (current): workspace events fix + CI scaffolding

## Config

| Path | Contents |
|------|----------|
| `vitest.config.ts` | Test runner config |
| `docker-compose.yml` | Docker config (builds from working dir — checkout right branch first) |
| `tsconfig.json` | TypeScript config |
