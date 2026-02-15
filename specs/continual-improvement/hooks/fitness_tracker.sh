#!/usr/bin/env bash
###
# DGM Fitness Tracker Hook
# Runs on SessionEnd and updates `.dgm/fitness.json` using session transcript signals.
#
# INSTALLATION: Copy to .claude/hooks/fitness_tracker.sh
# Then add to .claude/settings.json SessionEnd hooks array:
#   {"type":"command","command":"\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/fitness_tracker.sh","timeout":10000,"continueOnError":true}
###

set -euo pipefail

LOG_FILE=".claude/state/fitness-tracker.log"
mkdir -p "$(dirname "$LOG_FILE")"

input_tmp=$(mktemp)
cat > "$input_tmp"

if [[ ! -f ".dgm/fitness.json" ]]; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] skipped: .dgm/fitness.json missing" >> "$LOG_FILE"
  rm -f "$input_tmp"
  exit 0
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] skipped: npx not found" >> "$LOG_FILE"
  rm -f "$input_tmp"
  exit 0
fi

npx tsx scripts/dgm/track-fitness.ts --input "$input_tmp" >> "$LOG_FILE" 2>&1 || true
rm -f "$input_tmp"

exit 0
#!/usr/bin/env bash
###
# DGM Fitness Tracker Hook
# Runs on SessionEnd and updates `.dgm/fitness.json` using session transcript signals.
#
# INSTALLATION: Copy to .claude/hooks/fitness_tracker.sh
# Then add to .claude/settings.json SessionEnd hooks array:
#   {"type":"command","command":"\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/fitness_tracker.sh","timeout":10000,"continueOnError":true}
###

set -euo pipefail

LOG_FILE=".claude/state/fitness-tracker.log"
mkdir -p "$(dirname "$LOG_FILE")"

input_tmp=$(mktemp)
cat > "$input_tmp"

if [[ ! -f ".dgm/fitness.json" ]]; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] skipped: .dgm/fitness.json missing" >> "$LOG_FILE"
  rm -f "$input_tmp"
  exit 0
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] skipped: npx not found" >> "$LOG_FILE"
  rm -f "$input_tmp"
  exit 0
fi

npx tsx scripts/dgm/track-fitness.ts --input "$input_tmp" >> "$LOG_FILE" 2>&1 || true
rm -f "$input_tmp"

exit 0
