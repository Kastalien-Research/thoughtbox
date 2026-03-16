# Root Cause Failure Modes Reference

Each root cause is a named, documented failure mode with specific examples from the thoughtbox git history (808 commits, 106 branches, 166 PRs, Oct 2025 - Mar 2026). Use these IDs to connect governance components to the specific failures they prevent.

---

## RC-1: "The Bait-and-Switch"

**Agent commits different code than what was approved.**

| Field | Value |
|-------|-------|
| Mechanism | Agent previews a plan/document in chat. Human approves. Agent commits a materially different version. No diff between approved preview and committed artifact. |
| Where it breaks | Commit time (post-approval, pre-push) |
| Rework caused | ~24 commits |
| Cost rank | 1st (most expensive) |
| Predictable | Yes |

### Examples
- **AUTH-01** (`ae1fda5` / `14f801f`): Agent previewed correct ADR scoped to JWT validation. Committed version consumed a ChatGPT scratch document as authoritative architecture, pulling in workspace tables and RLS rewrites from a different workstream. Broke 33 integration tests.
- **pnpm lockfile** (`20669f6`): Agent deleted `pnpm-lock.yaml` asserting "project uses npm." Factually wrong. 3 months of build inconsistency, 5+ remediation commits.

### What prevents it
- **Layer 1 (Kernel Sandbox):** Deny writes to `.adr/`, `.specs/` unless explicitly allowlisted per-session. Forces scope constraint at filesystem level.
- **Layer 4 (Policy-as-Code):** OPA policy checking committed ADR scope section against linked bead description. CI-level, not bypassable.
- **Layer 3 (CI Validation):** Lockfile deletion check — CI fails if lockfile is removed without corresponding package manager config change.

---

## RC-2: "The Kitchen Sink"

**Scope creep within a single PR/branch.**

| Field | Value |
|-------|-------|
| Mechanism | Branch scoped to task X accumulates commits for tasks Y and Z. PR becomes too large, gets rejected by automated reviewers, or merges with hidden defects. |
| Where it breaks | Branch scoping (before first commit) |
| Rework caused | ~20 commits |
| Cost rank | 2nd |
| Predictable | Yes |

### Examples
- **AUTH-01 branch** (`feat/auth-01-supabase-oauth`): Scoped to WS-03 (auth middleware), delivered WS-02 work (workspace tables, RLS rewrites). Stash commit `07cd51e` titled "Non-AUTH-01 changes."
- **Supabase Data v1**: Accumulated unrelated commits; required clean v2 branch.
- **PR redo cycles**: #19->#21, #20->#22, #85->#95, #148->#149. PRs >150 files rejected by bots, redone.

### What prevents it
- **Layer 4 (Policy-as-Code):** PR file-footprint check — directories touched vs branch name/linked issue scope. PR size gate at 100 changed files.
- **Layer 2 (GitHub Server-Side):** GitHub Rulesets enforcing branch naming conventions tied to issue scope.

---

## RC-3: "The Decorative Test Suite"

**Tests exist but don't run or don't test boundaries.**

| Field | Value |
|-------|-------|
| Mechanism | (a) CI doesn't execute tests, (b) tests validate internal handlers not API boundary, (c) tests validate structure not data flow. |
| Where it breaks | CI configuration (systemic) |
| Rework caused | ~15 gateway fix commits + unknown pre-March-8 breakage |
| Cost rank | 3rd |
| Predictable | Yes |

### Examples
- **CI never ran vitest** until 2026-03-08 (`578a41a`). Every test before this date was decorative.
- **Gateway 3-layer gap**: ADR-009 tested handlers, missed gateway passthrough. ADR-010 tested field presence, missed copy step. ADR-012 tested dispatch routing, missed string manipulation.
- **PR #159**: Greptile flagged exact gateway bug with exact fix code. Merged anyway. Fixed 21h later in `5b933d3`.

### What prevents it
- **Layer 2 (GitHub Server-Side):** `Test Suite` as required status check (now implemented).
- **Layer 3 (CI Validation):** Gateway protocol-boundary integration tests calling through MCP SDK.
- **Layer 5 (Watchdog):** Cross-reference validator catching required check names that don't match any workflow job name (the exact bug that disconnected CI from branch protection).

---

## RC-4: "The Local-Only Validation"

**Features tested locally, break in Docker/Cloud Run.**

| Field | Value |
|-------|-------|
| Mechanism | Features validated only in local Node.js environment. Container-specific failures discovered at deployment time. |
| Where it breaks | Test environment (before merge) |
| Rework caused | ~8 commits |
| Cost rank | 5th |
| Predictable | Yes |

### Examples
- **Auth Cloud Run** (`d33b972`): Worked locally, failed on Cloud Run (missing env vars, JWKS misconfiguration).
- **Docker native bindings** (`ffd67d3` / PR #106): `better-sqlite3` not rebuilt for container arch.
- **ESM imports** (`ffbf4da` / PR #107): `require()` works locally (CommonJS compat), breaks in Docker ESM-strict.
- **Sidecar pnpm** (`9741438`): pnpm version not pinned in sidecar build.
- **`.dockerignore`** (`067ad5d`): Build context missing needed files.

### What prevents it
- **Layer 3 (CI Validation):** `docker build` as required CI check on every PR. Catches 4 of 5 documented issues mechanically.

---

## RC-5: "The Review-Merge Gap"

**Automated reviews flag issues that get merged anyway.**

| Field | Value |
|-------|-------|
| Mechanism | Automated review tools (Greptile, Augment) identify real bugs. Findings treated as informational, not blocking. PR merges. Bugs materialize. |
| Where it breaks | PR merge decision (explicit choice) |
| Rework caused | ~5 commits |
| Cost rank | 6th |
| Predictable | Yes (findings were presented before merge) |

### Examples
- **PR #159**: Greptile flagged gateway mental-models bug with exact fix code. Merged anyway. Fixed 21h later.
- **PR #165**: Augment flagged shared storage race condition and RLS self-enrollment hole.
- **PR #161**: Greptile flagged JWT expiry and dangling pointer bugs. Fixed 1.3h later.

### What prevents it
- **Layer 2 (GitHub Server-Side):** Automated review status as required check in branch protection. One setting change.

---

## RC-6: "The Merge-Revert Spiral"

**Insufficient branch isolation causes revert chains.**

| Field | Value |
|-------|-------|
| Mechanism | Changes land in main, immediately conflict or break, get reverted, re-merged, sometimes re-reverted. |
| Where it breaks | Branch strategy (before PR creation) |
| Rework caused | ~15 commits |
| Cost rank | 4th |
| Predictable | Partially |

### Examples
- **Interleaved thinking** (2025-11-07/08): 4 merges + 3 reverts in 12 hours. PRs #9-#13 plus `2aeec9d`.
- **Auth reversal**: Full OAuth (+3,400 lines) merged via `14f801f`, stripped (-416 lines) starting `4337221` 91 minutes later.

### What prevents it
- **Layer 4 (Policy-as-Code):** PR scope validation prevents bundling unrelated changes that cause conflicts.
- **Layer 3 (CI Validation):** Mandatory rebase + test pass on rebased branch before merge.
- **Partially downstream of RC-1**: The auth reversal was caused by the bait-and-switch (wrong spec committed), not by branch isolation per se.

---

## Meta Root Cause: Governance Decay

**The governance system itself silently breaks.**

| Field | Value |
|-------|-------|
| Mechanism | Governance controls (hooks, CI checks, required status checks) stop functioning. No alert fires. The system proceeds as if governance is active when it isn't. |
| Where it breaks | Between governance installation and governance execution |
| Rework caused | Enables all other root causes |
| Cost rank | Underlying all others |
| Predictable | Yes |

### Examples
- **CI `Test Suite` check disconnected from branch protection**: Workflow job renamed from previous name to `Test Suite`. Branch protection still referenced old name. GitHub silently stopped enforcing. PRs merged without tests for months.
- **`.beads/hooks/*.backup` files**: Hook backups exist alongside active hooks. Investigation showed these are installer artifacts, but the hooks themselves were observed to be non-functional through other mechanisms.
- **AGENTS.md rules not enforced**: Branch naming rules, scope rules, hypothesis validation rules all documented. All violated. No enforcement mechanism.

### What prevents it
- **Layer 5 (Watchdog):** Scheduled job cross-referencing required check names against workflow job names. Opens issue on mismatch.
- **Layer 2 (OpenSSF Allstar):** Continuous monitoring + auto-revert of branch protection drift.
- **Separation of concerns:** Governance source lives in a separate repo. Agents in the governed project cannot modify governance source. Deploy script overwrites any local modifications.

---

## Cross-Reference: Root Cause → Governance Layer

| Root Cause | L1 Kernel | L2 Server-Side | L3 CI | L4 Policy | L5 Watchdog |
|------------|-----------|----------------|-------|-----------|-------------|
| RC-1: Bait-and-Switch | Deny writes to spec paths | - | Lockfile check | Scope validation | - |
| RC-2: Kitchen Sink | - | Branch naming rulesets | - | PR footprint + size gate | - |
| RC-3: Decorative Tests | Deny disabling test infra | Required checks | Protocol-boundary tests | - | Check-name cross-ref |
| RC-4: Local-Only | - | - | Docker build check | - | - |
| RC-5: Review-Merge Gap | - | Review as required check | - | - | - |
| RC-6: Merge-Revert Spiral | - | - | Rebase + test | PR scope validation | - |
| Meta: Governance Decay | Deny writes to governance files | Allstar auto-revert | Governance validator | - | Scheduled health check |

---

## Quantitative Baseline

From the forensic analysis of thoughtbox (808 commits, Oct 2025 - Mar 2026):

| Metric | Value |
|--------|-------|
| Total feat commits | 170 |
| Total fix commits | 174 |
| Fix-to-feature ratio | 1.02:1 |
| Fix commits traceable to named root causes | ~87 of 174 (50%) |
| Rework preventable by mechanical gates | ~85% of traced rework |
| Median PR merge time | 18 minutes |
| PRs merged same-day | 98% |
| PRs with automated review comments ignored | 3+ documented |
| Months CI ran without executing tests | ~4 |
| Stale remote branches | 35 |

### Target metrics (post-governance-kernel)
| Metric | Target |
|--------|--------|
| Fix-to-feature ratio | < 0.5:1 |
| Required check bypass incidents | 0 |
| Governance decay detection time | < 1 scheduled cycle (7 days) |
| Sandbox violation attempts blocked | 100% |
