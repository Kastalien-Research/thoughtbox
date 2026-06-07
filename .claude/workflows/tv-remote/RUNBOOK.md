# TV Remote Tournament — Codespaces Runbook

What runs where, and the three host constraints that will bite if ignored. Sourced from the Codespaces capability research (2026-06-06).

## ⚠️ Run from a throwaway clone, not your working repo (observed hazard)

In practice, the build/gate agents' git operations **move the primary checkout's HEAD** (every local run so far yanked the working tree to `main`, off the launch branch). It's harmless on an ephemeral Codespace, but on a local machine it repeatedly corrupts your working tree. **Mitigation:** run the tournament from a dedicated clone or worktree of the repo, never your active checkout. After any run, verify `git branch --show-current` and `git checkout <your-branch>` if it moved. Also: the `args` channel to the workflow proved unreliable — set `N`/`BASE`/`waveSize` by editing the workflow file, not via args.

## The 16-core box: what it gives and what it costs

- **16 cores / 64 GB RAM / 128 GB disk.** Disk is a hard cap — not expandable. $1.44/hr compute.
- The free quota (~120 core-hours personal) = **only ~7.5 hours of 16-core**. The Anthropic API spend for ~30 candidate builds dwarfs the compute bill — budget that separately.

## Three constraints that break the run if ignored

1. **Disk (128 GB hard cap).** 30 worktrees × `node_modules` would exhaust it. Mitigated by the **shared pnpm store** set in `.devcontainer/devcontainer.json` (`pnpm config set store-dir /workspaces/.pnpm-store`). pnpm hardlinks, so 30 worktrees cost ~one `node_modules` of disk. Do not remove that line.
2. **Idle suspend.** Default 30 min, **max 240 min**, and **terminal *output* resets it — CPU load alone does not.** Create the codespace with `--idle-timeout 240m` and keep output flowing (the heartbeat below, or the interactive `/workflows` view).
3. **RAM/OOM.** 14 parallel `tsc` blows 64 GB. The workflow caps build+gate to **waves of 6** (`waveSize`), below the runtime's 14-agent ceiling. Don't raise `waveSize` past ~8 on this box.

## Setup (once)

1. **Secret:** add a Codespaces secret `ANTHROPIC_API_KEY` (Settings → Codespaces → secrets), scoped to this repo. It is injected as an env var at runtime (not build time).
2. **Create the codespace on the 16-core machine with a long idle timeout:**
   ```bash
   gh codespace create -R <owner>/thoughtbox -b feat/tv-remote-tournament \
     -m largePremiumLinux --idle-timeout 240m
   ```
   (`largePremiumLinux` = the 16-core tier; confirm the exact machine name with `gh api /user/codespaces/<name>/machines` — org policy can restrict tiers.)
3. The devcontainer provisions Node 22 + pnpm + the `claude` CLI and runs `pnpm install && pnpm build`. Optionally enable a **prebuild** (repo Settings → Codespaces) to make cold-start fast — it caches the baseline clone+install+build, not the 30-way fan-out.

## Run it

**Recommended: interactive + tmux** (most reliable for a multi-hour run — the `/workflows` view streams output, which keeps the box awake):
```bash
tmux new -s tournament
claude          # then type:  /tv-remote-tournament
#   watch progress in another pane:  (inside claude)  /workflows
```
Detach with `Ctrl-b d`; the run continues. Reattach with `tmux attach -t tournament`.

**Headless** (`scripts/run-codespace.sh`) — see the OPEN QUESTION below before relying on it:
```bash
./.claude/workflows/tv-remote/run-codespace.sh
```

## OPEN QUESTION — verify before trusting the headless path

Dynamic workflows run in the **background** relative to the session. It is **not yet verified** that `claude -p "/tv-remote-tournament"` blocks until the background workflow *completes* rather than returning when the launching turn ends (which would orphan the run). **De-risk cheaply first:** run a trivial throwaway workflow via `claude -p` and confirm the process stays alive until it finishes. Until confirmed, prefer the interactive+tmux path. This is the single biggest operational unknown in the plan.

## After the run

The workflow returns `{ winner: { branch }, ranked[], report }`. Inspect the winner:
```bash
git checkout tournament/candidate-<n>
git diff main...HEAD
```
Branches `tournament/candidate-*` are local to the codespace. Push only the winner (after review), delete the rest.

## Host alternative (if this becomes recurring)

Codespaces is workable for a one-off with the mitigations above, but it's an interactive-dev product fighting a long headless batch job. For repeat runs or >128 GB disk / >64 GB RAM, a **GitHub Actions 16-core larger runner** (no idle model; runs to completion; ~$2.52/hr) or a **self-hosted runner** on a box you size is a better fit.
