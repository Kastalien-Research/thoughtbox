# Compound Document: Continual Self-Improvement System Design

**Date**: 2026-02-11
**Duration**: ~20 minutes active work + parallel agent research
**Branch**: fix/observatory-workspace-events
**Workflow**: PLOW (Plan → Work → Review → Compound)

---

## What Was Built

### Specs (10 files)

| File | Gap | Key Insight |
|------|-----|-------------|
| 00-overview.md | Architecture | System of loops at different timescales, not a single loop |
| 01-unified-loop-controller.md | Three independent loops | Controller as "while true" outer loop connecting Interactive/Daily/Weekly |
| 02-knowledge-accumulation-layer.md | Fragmented knowledge | Thoughtbox knowledge graph as backbone with adapters for other stores |
| 03-automated-pattern-evolution.md | Manual DGM | Automate `/dgm-evolve` via hooks + GitHub Actions; don't change the algorithm |
| 04-cross-session-continuity.md | Context loss | File-based handoff protocol (Carlini pattern) + reasoning trajectories (Letta pattern) |
| 05-evaluation-harness.md | No metrics | Three existing eval subsystems are disconnected; wire them together, don't rebuild |
| 06-agent-team-orchestration.md | Ad-hoc teams | C compiler pattern: file-based coordination, git-based sync, Hub as structured overlay |
| 07-assumption-registry.md | Assumption failures | JSONL registry seeded from MEMORY.md gotchas; periodic verification via GitHub Action |
| 08-compound-integration.md | Compound agents idle | Map 29 compound agents to improvement loop phases; PLOW composes with OODA |
| 09-implementation-plan.md | Phased execution | Foundation → Automation → Integration → Orchestration; 5 weeks + ongoing calibration |

### Instantiation Artifacts (18 files)

| Category | Count | Files |
|----------|-------|-------|
| Skills | 5 | session-review, knowledge, assumptions, eval, loop-status |
| DGM state | 3 | fitness.json (10 patterns), niche-grid.json (75% coverage), lineage.json |
| Eval state | 1 | baselines.json (7 metrics with thresholds) |
| Assumption registry | 1 | registry.jsonl (12 seeded assumptions from MEMORY.md) |
| Hook templates | 2 | fitness_tracker.sh, eval_collector.sh (in specs/hooks/ due to write protection) |
| Directories | 6 | .sessions/, .assumptions/, .dgm/, .dgm/graveyard/, .eval/, .eval/metrics/ |

---

## Key Decisions and Reasoning

### 1. Knowledge graph as backbone, not new store
**Decision**: The unified knowledge layer uses Thoughtbox's existing knowledge graph with adapters, not a new database.
**Reasoning**: Creating a new unified store would fragment knowledge further. The knowledge graph already has structured entities, relations, and observations. Adapters for MEMORY.md (grep), Beads (CLI), and git (log) are thin wrappers.
**Alternative considered**: SQLite-based unified store. Rejected because it would require migration and wouldn't integrate with the MCP ecosystem.

### 2. Session handoff as JSON file, not database
**Decision**: Cross-session continuity uses `.sessions/handoff-{timestamp}.json` files, not a database.
**Reasoning**: The Carlini C compiler project proved that file-based external memory is sufficient for agent coordination. Files are readable by any tool, don't require running services, and survive container restarts.
**Alternative considered**: Extending Observatory's InMemorySessionStore to file-backed. Would solve H9 but not the handoff protocol problem.

### 3. Hooks as templates, not direct installs
**Decision**: Hook scripts are stored in `specs/continual-improvement/hooks/` as templates with installation instructions.
**Reasoning**: The `.claude/hooks/` directory is write-protected by the pre_tool_use hook (agents cannot modify their own safety mechanisms). Templates let the human install when ready.
**Alternative considered**: Modifying the pre_tool_use guard to allow specific hook additions. Rejected because the safety mechanism exists for good reason.

### 4. DGM state files initialized with real patterns
**Decision**: fitness.json is pre-populated with 10 patterns extracted from the actual codebase rules and memory.
**Reasoning**: An empty fitness file provides no value. Pre-populating with real patterns gives the evolution system something to work with immediately.
**Alternative considered**: Empty files with "run /dgm-evolve to populate." Rejected as too many steps before the system is useful.

### 5. PLOW composes with OODA, doesn't replace it
**Decision**: The compound engineering PLOW cycle (Plan/Work/Review/Compound) operates at a higher level than OODA loops. OODA runs inside each PLOW phase.
**Reasoning**: OODA is the cognitive loop (how agents think). PLOW is the workflow loop (how work progresses). They operate at different abstraction levels and compose naturally.
**Alternative considered**: Replacing OODA with PLOW. Rejected because OODA is more granular and better suited for moment-to-moment agent decisions.

---

## Patterns Discovered

### Pattern: "Spec agents need research time"
Background agents writing specs need 3-5 minutes to research the codebase before writing. Rushing them produces generic specs. Giving them time produces specs grounded in real file paths and code.

### Pattern: "Seed state files with real data"
Empty state files are friction. Pre-populating with extracted data from existing sources (MEMORY.md → assumptions, rules → patterns) makes the system useful immediately.

### Pattern: "Write-protection as design constraint"
The `.claude/hooks/` write protection turned a planned direct install into a template pattern. This is actually better — it creates a human checkpoint for new infrastructure.

### Pattern: "Parallel spec writing scales well"
8 agents writing specs simultaneously produced high-quality, non-conflicting results. Each agent had clear scope (one gap) and clear context (the overview). No coordination needed.

---

## What the Reviewers Should Check

Three compound engineering reviewers are analyzing this work:

1. **Architecture Strategist**: Are the 8 gaps the right gaps? Dependencies correct? Phasing correct?
2. **Spec Flow Analyzer**: Are there dead-end flows? Cold start issues? Error recovery gaps?
3. **Code Simplicity Reviewer**: Is anything over-engineered? What's the minimum viable version?

Their findings should be incorporated before this moves from Draft to Implementation.

---

## Reusability Assessment

For "another agent to use this workflow to build a complex app end-to-end":

**Transfers directly**:
- Skill templates (SKILL.md format with OODA phases)
- DGM fitness tracking (pattern evolution is project-agnostic)
- Session handoff protocol
- Assumption registry format
- Hook templates (fitness tracking, eval collection)

**Requires customization**:
- Knowledge store adapters (project-specific stores)
- Assumption categories and seeds
- Evaluation metrics and baselines
- DGM pattern population (project-specific patterns)
- Compound agent mapping (project-specific agent selection)

**The bootstrap sequence** (from 09-implementation-plan.md):
1. Copy `.claude/skills/`, `.claude/rules/` as templates
2. Create `.dgm/`, `.eval/`, `.assumptions/`, `.sessions/` directories
3. Configure `settings.json` with hook wiring
4. Seed assumptions from project documentation
5. Run first session — system bootstraps from there
