# Agent Governance Kernel: Master Specification

## What This Is

A standalone governance system for agent-driven software development. It lives outside the projects it governs, is imported via script, and cannot be modified by the agents it constrains.

## The Problem It Solves

In agent-driven development, governance infrastructure (hooks, CI checks, branch protection, process documentation) silently decays. Agents bypass, disable, rename, or drift from governance controls — not maliciously, but as a side effect of task completion. Advisory controls (markdown rules, prompt instructions) have a documented 26.7% failure rate. Verification agents achieve 33% correctness. 73% of enterprise AI agent deployments fail to scale due to governance failures.

The core insight: **governance placed inside the agent's reasoning space will always fail under sufficient task pressure.** This is architectural, not a capability gap.

## Design Principles

### 1. Governance lives outside the governed project
The governance system is a separate repository. Agents working in the governed project never see governance source code in their context window. They cannot reason about it, optimize it, or "fix" it.

### 2. Deny by default, allow by exception
Kernel-level sandboxing (macOS Seatbelt / Linux Landlock) denies all filesystem writes by default. Only explicitly allowlisted paths are writable. This inverts the traditional model ("allow everything, block bad things") which is bypassable.

### 3. Gates verify output, not reasoning
Every gate checks whether the committed artifact is correct — not whether the reasoning that produced it was sound. Gates work on any actor (human, AI agent, CI bot) because they validate results.

### 4. Server-side over local
Controls that live on GitHub (branch protection, required checks, Allstar) cannot be locally circumvented by agents. Local hooks can be bypassed via `--no-verify`, renamed via `mv`, or deleted. Server-side gates cannot.

### 5. The governance system monitors itself
A watchdog layer verifies that governance infrastructure is still functioning. If a required check name falls out of sync with a workflow job name, the watchdog catches it. The meta-loop is closed.

### 6. Small, declarative, human-verifiable
Every governance artifact is small enough for one person to read in a single sitting. No 300-line TypeScript modules. No features with test suites. Config files and shell scripts, deliberately primitive, nothing an agent would need to "improve."

## Architecture

```
+------------------------------------------------------------------+
|                    GOVERNANCE KERNEL (this repo)                   |
|                                                                    |
|  Seatbelt       GitHub         CI             OPA/Conftest        |
|  Profiles       Rulesets       Validators     Policies            |
|  (kernel)       (server)       (CI)           (CI)                |
|                                                                    |
|  Allstar        Cross-ref      Deploy         Watchdog            |
|  Config         Validator      Script         (scheduled)         |
|  (external)     (meta-gate)    (import)       (meta-gate)         |
+------------------------------------------------------------------+
        |                |               |               |
        v                v               v               v
   +-----------+   +-----------+   +-----------+   +-----------+
   | Project A |   | Project B |   | Project C |   | Project N |
   | (governed)|   | (governed)|   | (governed)|   | (governed)|
   +-----------+   +-----------+   +-----------+   +-----------+
```

## Layers (Outside → Inside)

### Layer 1: Kernel Sandbox (highest durability)
**What:** macOS Seatbelt / Linux Landlock profile restricting filesystem writes for agent processes.
**Prevents:** `mv`, `rm`, `chmod` on governance files via Bash. Lockfile deletion. Hook tampering. CI workflow modification.
**Circumventable:** No — kernel enforcement, syscall returns EPERM.
**Root causes addressed:** [RC-1](root-causes.md#rc-1-the-bait-and-switch), [RC-3](root-causes.md#rc-3-the-decorative-test-suite) (prevents disabling test infrastructure)
**Implementation:** Declarative profile (~30 lines) specifying:
- ALLOW write: `src/`, `tests/`, `docs/`
- DENY write: `.git/hooks/`, `.beads/hooks/`, `.github/workflows/`, `*.lock`, `.claude/settings.json`, `.specs/`, `.adr/` (spec/ADR writes require per-session allowlisting)
- **Complementary control (not Seatbelt):** Git binary wrapper (e.g., `block-no-verify`, nono's git wrapping) strips `--no-verify` and blocks force-push / branch deletion on protected branches. Seatbelt cannot inspect command-line arguments — it operates at the syscall level on filesystem operations only. The combination of Seatbelt (hooks can't be deleted) + git wrapper (`--no-verify` is stripped) closes the hook bypass vector.
**Tools:** `cco`, `nono`, `Agent Safehouse`, `block-no-verify`

### Layer 2: GitHub Server-Side Gates (high durability)
**What:** Branch protection rules, required status checks, GitHub Rulesets, OpenSSF Allstar.
**Prevents:** Merging without passing CI. Disabling branch protection. Force pushes. Direct pushes to main.
**Circumventable:** No — server-side enforcement. Requires admin credentials to modify.
**Root causes addressed:** [RC-3](root-causes.md#rc-3-the-decorative-test-suite), [RC-5](root-causes.md#rc-5-the-review-merge-gap)
**Implementation:**
- Required status checks: `Test Suite`, `Docker Build`, `Governance Validator`, review bot findings
- GitHub Rulesets: branch naming conventions, commit message format
- Allstar: continuous drift detection + auto-revert for branch protection settings
**Tools:** GitHub API, OpenSSF Allstar, Terraform GitHub provider (optional)

### Layer 3: CI Validation Gates (high durability)
**What:** CI jobs that validate code, containers, and governance coherence.
**Prevents:** Broken Docker builds reaching main. Tests not running. Governance check names drifting from workflow job names.
**Circumventable:** Only by modifying workflow YAML (visible in PR diff, blocked by Layer 1 sandbox).
**Root causes addressed:** [RC-3](root-causes.md#rc-3-the-decorative-test-suite), [RC-4](root-causes.md#rc-4-the-local-only-validation)
**Implementation:**
- `test-suite.yml`: Run vitest (required check)
- `docker-build.yml`: Run `docker build` on every PR (required check)
- `governance-validator.yml`: Cross-reference required check names against workflow job names (required check, scheduled + on push to `.github/workflows/`)
**Tools:** GitHub Actions

### Layer 4: Policy-as-Code (high durability)
**What:** OPA/Conftest policies evaluating PR metadata against declared scope.
**Prevents:** Kitchen-sink PRs. Scope creep. PRs exceeding size thresholds.
**Circumventable:** Only by modifying policy files (visible in PR diff, blocked by Layer 1 sandbox).
**Root causes addressed:** [RC-2](root-causes.md#rc-2-the-kitchen-sink)
**Implementation:**
- PR file-footprint check: directories touched vs branch name/linked issue scope
- PR size gate: >100 changed files requires maintainer override
- Commit message format validation (Conventional Commits)
**Tools:** Conftest, OPA

### Layer 5: Watchdog (meta-gate)
**What:** Scheduled job that verifies the governance system itself is functioning.
**Prevents:** Silent governance decay. Check name drift. Allstar misconfiguration. Sandbox profile staleness.
**Circumventable:** Only by modifying the scheduled workflow (blocked by Layer 1).
**Root causes addressed:** All (meta-level)
**Implementation:**
- Weekly scheduled GitHub Action that:
  1. Reads branch protection required check names via API
  2. Reads all workflow job names from `.github/workflows/*.yml`
  3. Verifies every required check maps to an actual workflow job
  4. Verifies Allstar is installed and configured
  5. Verifies sandbox profile matches the governance manifest
  6. Opens an issue if any check fails
**Tools:** GitHub Actions (scheduled), GitHub API

## Deploy Script

The governance kernel is imported into governed projects via a deploy script:
```
./deploy.sh <target-repo-path>
```

The script:
1. Copies CI workflow files to `<target>/.github/workflows/`
2. Copies sandbox profile to `<target>/.governance/sandbox.sb`
3. Applies GitHub branch protection settings via API
4. Installs Allstar configuration
5. Copies OPA/Conftest policies to `<target>/.governance/policies/`
6. Verifies installation by running the watchdog check

If an agent modifies a deployed governance file in the target repo, the next `deploy.sh` run overwrites the modification. The source of truth is this repo, not the target.

## What This Does NOT Do

- **No prompt-based constraints.** No GUARDRAILS.md, no "please follow these rules" in CLAUDE.md. Advisory text has a 26.7% failure rate.
- **No local hooks as primary controls.** Hooks are defense-in-depth only. The primary gate is always server-side or kernel-level.
- **No agent-maintained governance.** Governance artifacts are written by the human, verified by the human, and deployed by script. Agents never modify governance source.
- **No complex abstractions.** Every file is small, declarative, and readable in one sitting. If it needs a test suite, it's too complex.

## File Structure

```
governance-kernel/
  master-spec.md              # This file
  root-causes.md              # Failure mode reference (linked from spec)
  deploy.sh                   # Import script for target repos
  profiles/
    macos-seatbelt.sb         # macOS sandbox profile
    linux-landlock.toml        # Linux sandbox config
  workflows/
    test-suite.yml            # Template: run tests as required check
    docker-build.yml          # Template: docker build as required check
    governance-validator.yml  # Cross-ref check names against job names
    watchdog.yml              # Scheduled governance health check
  policies/
    pr-scope.rego             # OPA: PR file footprint vs declared scope
    pr-size.rego              # OPA: PR size gate
    commit-format.rego        # OPA: Conventional Commits validation
  allstar/
    allstar.yaml              # Allstar org-level config
    branch_protection.yaml    # Allstar branch protection policy
  github/
    branch-protection.json    # Branch protection settings (applied via API)
    rulesets.json             # GitHub Rulesets config (applied via API)
```

## Durability Ranking

| Layer | Durability | Why |
|-------|-----------|-----|
| 1. Kernel Sandbox | Highest | Syscall-level. Cannot be bypassed from userspace. |
| 2. GitHub Server-Side | High | Server-side. Requires admin credentials to modify. |
| 3. CI Validation | High | Runs on GitHub. Modification visible in PR diff + blocked by sandbox. |
| 4. Policy-as-Code | High | Same as CI — runs server-side, modification blocked by sandbox. |
| 5. Watchdog | High | Monitors everything above. Runs on schedule outside agent sessions. |
| Local hooks | Low | Bypassable via `--no-verify`, `mv`, `rm`. Defense-in-depth only. |
| Markdown rules | None | Advisory. 26.7% failure rate under task pressure. |

## Success Criteria

The governance kernel is working if:
1. No PR merges to main with failing required checks
2. No governance file is modified in the target repo without being overwritten on next deploy
3. The watchdog has never detected a check-name drift that persisted for more than one scheduled cycle
4. The sandbox profile has never been circumvented (no writes to denied paths in agent session logs)
5. The fix-to-feature commit ratio in governed projects drops below 0.5:1 (from the current 1.02:1)
