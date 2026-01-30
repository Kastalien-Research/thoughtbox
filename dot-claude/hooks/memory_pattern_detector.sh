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

mkdir -p "$STATE_DIR"

# Initialize calibration state if doesn't exist
if [[ ! -f "$CALIBRATION_FILE" ]]; then
    echo '{"patterns": [], "repeated_issues": [], "discovery_times": [], "last_analysis": null}' > "$CALIBRATION_FILE"
fi

# Read current state
state=$(cat "$CALIBRATION_FILE")

# Read input (tool use data if provided)
input_json=$(cat)

# Extract relevant data
tool_name=$(echo "$input_json" | jq -r '.tool_name // "unknown"')
timestamp=$(date '+%Y-%m-%d %H:%M:%S')

# Log analysis
echo "[$timestamp] Pattern detection run: tool=$tool_name" >> "$LOG_FILE"

# --- Pattern Detection Logic ---

# 1. Detect repeated file access (might indicate missing memory)
if [[ -f "$STATE_DIR/file_access.log" ]]; then
    # Find files accessed multiple times in recent history
    repeated_files=$(tail -100 "$STATE_DIR/file_access.log" | sort | uniq -c | sort -rn | head -5)
    
    if [[ -n "$repeated_files" ]]; then
        while IFS= read -r line; do
            count=$(echo "$line" | awk '{print $1}')
            file=$(echo "$line" | awk '{print $2}')
            
            if [[ "$count" -gt 3 ]]; then
                # Check if this file has associated memory rules
                has_memory=false
                
                # Check if path-specific rules exist for this file
                for rule_file in .claude/rules/**/*.md; do
                    if grep -q "paths:.*$file" "$rule_file" 2>/dev/null; then
                        has_memory=true
                        break
                    fi
                done
                
                if [[ "$has_memory" == "false" ]]; then
                    echo "[$timestamp] ⚠️  Coverage Gap: $file accessed ${count}x but no memory rules found" >> "$LOG_FILE"
                    
                    # Add to state
                    state=$(echo "$state" | jq \
                        --arg file "$file" \
                        --arg count "$count" \
                        --arg time "$timestamp" \
                        '.coverage_gaps += [{file: $file, access_count: ($count | tonumber), detected: $time}]')
                fi
            fi
        done <<< "$repeated_files"
    fi
fi

# 2. Detect repeated error patterns
if [[ -f "$STATE_DIR/errors.log" ]]; then
    # Find errors that occur multiple times
    repeated_errors=$(tail -100 "$STATE_DIR/errors.log" | sort | uniq -c | sort -rn | head -3)
    
    if [[ -n "$repeated_errors" ]]; then
        while IFS= read -r line; do
            count=$(echo "$line" | awk '{print $1}')
            error=$(echo "$line" | cut -d' ' -f2-)
            
            if [[ "$count" -gt 2 ]]; then
                echo "[$timestamp] 🔁 Repeated Issue: \"$error\" seen ${count}x" >> "$LOG_FILE"
                
                # Add to state
                state=$(echo "$state" | jq \
                    --arg error "$error" \
                    --arg count "$count" \
                    --arg time "$timestamp" \
                    '.repeated_issues += [{error: $error, count: ($count | tonumber), detected: $time}]')
            fi
        done <<< "$repeated_errors"
    fi
fi

# 3. Track discovery time (if provided in input)
discovery_time=$(echo "$input_json" | jq -r '.discovery_time_seconds // null')
if [[ "$discovery_time" != "null" ]]; then
    state=$(echo "$state" | jq \
        --arg time "$discovery_time" \
        --arg timestamp "$timestamp" \
        '.discovery_times += [{seconds: ($time | tonumber), timestamp: $timestamp}]')
    
    # Calculate running average
    avg_discovery=$(echo "$state" | jq '[.discovery_times[] | .seconds] | add / length')
    echo "[$timestamp] Discovery time: ${discovery_time}s (avg: ${avg_discovery}s)" >> "$LOG_FILE"
    
    # Alert if discovery is slow
    if (( $(echo "$discovery_time > 120" | bc -l) )); then
        echo "[$timestamp] ⚠️  Slow discovery (>2min): Consider adding memory for this area" >> "$LOG_FILE"
    fi
fi

# 4. Detect pattern convergence (multiple agents, same learning)
# This would require comparing new learnings to existing ones
# For now, just log when new learnings are added
if [[ -d ".claude/rules" ]]; then
    # Find recent learnings (added in last hour)
    recent_learnings=$(find .claude/rules -name "*.md" -type f -mmin -60 2>/dev/null)
    
    if [[ -n "$recent_learnings" ]]; then
        echo "[$timestamp] 📝 Recent memory updates:" >> "$LOG_FILE"
        echo "$recent_learnings" >> "$LOG_FILE"
    fi
fi

# Update state with last analysis time
state=$(echo "$state" | jq --arg time "$timestamp" '.last_analysis = $time')

# Save updated state
echo "$state" > "$CALIBRATION_FILE"

# --- Output Suggestions ---

# If patterns detected, output suggestions
suggestions=""

# Check for coverage gaps
gap_count=$(echo "$state" | jq '.coverage_gaps // [] | length')
if [[ "$gap_count" -gt 0 ]]; then
    recent_gaps=$(echo "$state" | jq -r '.coverage_gaps[-3:] | .[] | "  - " + .file + " (" + (.access_count | tostring) + "x accessed)"')
    suggestions+="
🎯 **Coverage Gaps Detected:**

Files with frequent access but no memory rules:
$recent_gaps

Consider creating path-specific rules for these files.
"
fi

# Check for repeated issues
issue_count=$(echo "$state" | jq '.repeated_issues // [] | length')
if [[ "$issue_count" -gt 0 ]]; then
    recent_issues=$(echo "$state" | jq -r '.repeated_issues[-3:] | .[] | "  - " + .error + " (" + (.count | tostring) + "x)"')
    suggestions+="
🔁 **Repeated Issues:**

Same problems encountered multiple times:
$recent_issues

These should be documented in .claude/rules/lessons/ or relevant domain files.
"
fi

# Output suggestions if any
if [[ -n "$suggestions" ]]; then
    cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "MemoryPatternDetection",
    "suggestions": "$suggestions",
    "calibration_data": {
      "coverage_gaps": $gap_count,
      "repeated_issues": $issue_count,
      "last_analysis": "$timestamp"
    }
  }
}
EOF
else
    # No suggestions, silent success
    echo '{"hookSpecificOutput": {"hookEventName": "MemoryPatternDetection", "status": "no_patterns"}}'
fi

exit 0
