#!/usr/bin/env bash
###
# Evaluation Metrics Collector Hook
# Runs on SessionEnd to capture session metrics for trend analysis.
# Writes metric snapshots to `.eval/metrics/`.
#
# INSTALLATION: Copy to .claude/hooks/eval_collector.sh
# Then add to .claude/settings.json SessionEnd hooks array:
#   {"type":"command","command":"\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/eval_collector.sh","timeout":10000,"continueOnError":true}
###

set -euo pipefail

LOG_FILE=".claude/state/eval-collector.log"
mkdir -p "$(dirname "$LOG_FILE")"

input_tmp=$(mktemp)
cat > "$input_tmp"

if ! command -v npx >/dev/null 2>&1; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] skipped: npx not found" >> "$LOG_FILE"
  rm -f "$input_tmp"
  exit 0
fi

npx tsx scripts/eval/capture-session.ts --input "$input_tmp" >> "$LOG_FILE" 2>&1 || true
rm -f "$input_tmp"

exit 0
#!/usr/bin/env bash
###
# Evaluation Metrics Collector Hook
# Runs on SessionEnd to capture session metrics for trend analysis.
# Writes metric snapshots to `.eval/metrics/`.
#
# INSTALLATION: Copy to .claude/hooks/eval_collector.sh
# Then add to .claude/settings.json SessionEnd hooks array:
#   {"type":"command","command":"\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/eval_collector.sh","timeout":10000,"continueOnError":true}
###

set -euo pipefail

LOG_FILE=".claude/state/eval-collector.log"
mkdir -p "$(dirname "$LOG_FILE")"

input_tmp=$(mktemp)
cat > "$input_tmp"

if ! command -v npx >/dev/null 2>&1; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] skipped: npx not found" >> "$LOG_FILE"
  rm -f "$input_tmp"
  exit 0
fi

npx tsx scripts/eval/capture-session.ts --input "$input_tmp" >> "$LOG_FILE" 2>&1 || true
rm -f "$input_tmp"

exit 0
