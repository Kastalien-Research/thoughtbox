#!/usr/bin/env bash
# Add this BEFORE the hypothesis check in pre_tool_use.sh to debug
# Writes to /tmp so we can see what values the check actually gets
{
  echo "=== HYPOTHESIS DEBUG $(date) ==="
  echo "tool_name=$tool_name"
  echo "tool_input=$tool_input"
  _fp=$(echo "$tool_input" | jq -r '.file_path // ""')
  echo "_fp=$_fp"
  echo "matches_src=$([[ "$_fp" == */src/* ]] && echo YES || echo NO)"
  echo "bead_file_exists=$(test -f "${PROJECT_DIR}/.claude/state/bead-workflow/current-bead.json" && echo YES || echo NO)"
  if [[ -f "${PROJECT_DIR}/.claude/state/bead-workflow/current-bead.json" ]]; then
    echo "hypothesis=$(jq -r '.hypothesis_stated' "${PROJECT_DIR}/.claude/state/bead-workflow/current-bead.json")"
  fi
} >> /tmp/hypothesis-debug.txt
