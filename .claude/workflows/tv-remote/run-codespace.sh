#!/usr/bin/env bash
set -euo pipefail

# Headless launcher for the TV Remote tournament on a Codespace.
# NOTE: verify that `claude -p` blocks until the background workflow completes
# before trusting this unattended (see RUNBOOK.md "OPEN QUESTION"). Until then
# the interactive + tmux path in the runbook is the reliable option.

: "${ANTHROPIC_API_KEY:?set ANTHROPIC_API_KEY (Codespaces secret) before running}"

# Codespaces idle timeout resets on TERMINAL OUTPUT, not CPU. Emit a heartbeat
# so a long compute phase does not suspend the machine mid-run.
( while true; do printf 'heartbeat %s\n' "$(date -u +%H:%M:%SZ)"; sleep 60; done ) &
heartbeat_pid=$!
trap 'kill "${heartbeat_pid}" 2>/dev/null || true' EXIT

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
claude -p "/tv-remote-tournament" \
  --permission-mode bypassPermissions \
  --output-format json | tee "tournament-${stamp}.json"
