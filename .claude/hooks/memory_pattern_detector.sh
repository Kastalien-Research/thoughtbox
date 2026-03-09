#!/usr/bin/env bash
###
# Memory Pattern Detector Hook
# Runs periodically to detect patterns worth capturing
# Can be called from post_tool_use or as a standalone analysis
###

set -euo pipefail

# Configuration
STATE_DIR=".claude/state"
CALIBRATION_FILE="$STATE_DIR/memory-calibration.json"
LOG_FILE="$STATE_DIR/memory-calibration.log"
default_state='{"patterns":[],"coverage_gaps":[],"repeated_issues":[],"discovery_times":[],"last_analysis":null}'

mkdir -p "$STATE_DIR"

# Initialize calibration state if missing or empty
if [[ ! -s "$CALIBRATION_FILE" ]]; then
    echo "$default_state" > "$CALIBRATION_FILE"
fi

# Read current state; recover automatically if file is corrupted.
if state=$(jq -c '.' "$CALIBRATION_FILE" 2>/dev/null); then
    :
else
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] WARN: invalid $CALIBRATION_FILE detected; resetting to default state" >> "$LOG_FILE"
    tmp_calibration="${CALIBRATION_FILE}.tmp.$$"
    echo "$default_state" > "$tmp_calibration"
    mv "$tmp_calibration" "$CALIBRATION_FILE"
    state="$default_state"
fi

# Read input (tool use data if provided)
input_json=$(cat)

# Extract relevant data
tool_name=$(echo "$input_json" | jq -r '.tool_name // "unknown"' 2>/dev/null || echo "unknown")
timestamp=$(date '+%Y-%m-%d %H:%M:%S')

# Log analysis
echo "[$timestamp] Pattern detection run: tool=$tool_name" >> "$LOG_FILE"

# Knowledge bridge (project-scoped) - best effort
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
KNOWLEDGE_BRIDGE="$PROJECT_DIR/.claude/hooks/knowledge_memory_bridge.mjs"
SESSION_ID="$(echo "$input_json" | jq -r '.session_id // ""' 2>/dev/null || echo "")"

# --- Pattern Detection Logic ---

# 1. Detect repeated file access (might indicate missing memory)
if [[ -f "$STATE_DIR/file_access.log" ]]; then
    # Find files accessed multiple times in recent history
    repeated_files=$(
      tail -100 "$STATE_DIR/file_access.log" \
        | sed -E 's/^\[[^]]+\] //g' \
        | sort \
        | uniq -c \
        | sort -rn \
        | head -5
    )
    
    if [[ -n "$repeated_files" ]]; then
        while IFS= read -r line; do
            count=$(echo "$line" | awk '{print $1}')
            file="$(echo "$line" | sed -E 's/^[[:space:]]*[0-9]+[[:space:]]+//')"
            
            if [[ "$count" -gt 3 ]]; then
                echo "[$timestamp] ⚠️  Coverage Gap: $file accessed ${count}x" >> "$LOG_FILE"

                # Add to state
                state=$(echo "$state" | jq \
                    --arg file "$file" \
                    --arg count "$count" \
                    --arg time "$timestamp" \
                    '.coverage_gaps += [{file: $file, access_count: ($count | tonumber), detected: $time}]')

                # Persist to project-scoped knowledge memory (no context injection)
                if [[ -x "$KNOWLEDGE_BRIDGE" ]]; then
                  node "$KNOWLEDGE_BRIDGE" add-insight \
                    --name "coverage-gap:${file}" \
                    --label "Coverage gap: ${file}" \
                    --content "File accessed ${count}x recently during agent work; consider adding stable project facts or documentation for this area." \
                    --session-id "$SESSION_ID" \
                    --properties-json "$(jq -n --arg file "$file" --argjson count "$count" '{kind:"coverage_gap", file:$file, access_count:$count}')" \
                    >/dev/null 2>&1 || true
                fi
            fi
        done <<< "$repeated_files"
    fi
fi

# 2. Detect repeated error patterns
if [[ -f "$STATE_DIR/errors.log" ]]; then
    # Find errors that occur multiple times
    repeated_errors=$(
      tail -100 "$STATE_DIR/errors.log" \
        | sed -E 's/^\[[^]]+\] //g' \
        | sort \
        | uniq -c \
        | sort -rn \
        | head -3
    )
    
    if [[ -n "$repeated_errors" ]]; then
        while IFS= read -r line; do
            count=$(echo "$line" | awk '{print $1}')
            error="$(echo "$line" | sed -E 's/^[[:space:]]*[0-9]+[[:space:]]+//')"
            
            if [[ "$count" -gt 2 ]]; then
                echo "[$timestamp] 🔁 Repeated Issue: \"$error\" seen ${count}x" >> "$LOG_FILE"
                
                # Add to state
                state=$(echo "$state" | jq \
                    --arg error "$error" \
                    --arg count "$count" \
                    --arg time "$timestamp" \
                    '.repeated_issues += [{error: $error, count: ($count | tonumber), detected: $time}]')

                if [[ -x "$KNOWLEDGE_BRIDGE" ]]; then
                  # keep the entity name stable by hashing the normalized error
                  err_hash="$(
                    node -e "const crypto=require('crypto');process.stdout.write(crypto.createHash('sha256').update(process.argv[1]||'').digest('hex').slice(0,16));" \
                      "$error" 2>/dev/null || echo ""
                  )"
                  node "$KNOWLEDGE_BRIDGE" add-insight \
                    --name "repeated-issue:${err_hash}" \
                    --label "Repeated issue (${count}x)" \
                    --content "Repeated error pattern observed ${count}x: ${error}" \
                    --session-id "$SESSION_ID" \
                    --properties-json "$(jq -n --arg error "$error" --argjson count "$count" '{kind:"repeated_issue", error:$error, count:$count}')" \
                    >/dev/null 2>&1 || true
                fi
            fi
        done <<< "$repeated_errors"
    fi
fi

# 3. Track discovery time (if provided in input)
discovery_time=$(echo "$input_json" | jq -r '.discovery_time_seconds // null' 2>/dev/null || echo "null")
if [[ "$discovery_time" != "null" ]]; then
    state=$(echo "$state" | jq \
        --arg time "$discovery_time" \
        --arg timestamp "$timestamp" \
        '.discovery_times += [{seconds: ($time | tonumber), timestamp: $timestamp}]')
    
    # Calculate running average
    avg_discovery=$(echo "$state" | jq '[.discovery_times[] | .seconds] | add / length')
    echo "[$timestamp] Discovery time: ${discovery_time}s (avg: ${avg_discovery}s)" >> "$LOG_FILE"
    
    # Alert if discovery is slow
    if [[ "$discovery_time" =~ ^[0-9]+$ ]] && (( discovery_time > 120 )); then
        echo "[$timestamp] ⚠️  Slow discovery (>2min): Consider adding memory for this area" >> "$LOG_FILE"
    fi
fi

# 4. Pattern convergence (old .claude/rules system removed)

# Update state with last analysis time
state=$(echo "$state" | jq --arg time "$timestamp" '.last_analysis = $time')

# Save updated state atomically to avoid partial writes.
tmp_calibration="${CALIBRATION_FILE}.tmp.$$"
echo "$state" > "$tmp_calibration"
mv "$tmp_calibration" "$CALIBRATION_FILE"

# Silent success (avoid context/window noise)
exit 0
