#!/usr/bin/env bash
# Session start hook - logs session start and optionally loads development context

set -euo pipefail

# Parse command line arguments
load_context=false
announce=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --load-context)
            load_context=true
            shift
            ;;
        --announce)
            announce=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Read JSON input from stdin
input_json=$(cat)

# Ensure log directory and JSON file exist
mkdir -p logs
[[ ! -s logs/session_start.json ]] && echo "[]" > logs/session_start.json

# Append new data
log_data=$(cat logs/session_start.json)
echo "$log_data" | jq --argjson new "$input_json" '. += [$new]' > logs/session_start.json

# Extract fields
session_id=$(echo "$input_json" | jq -r '.session_id // "unknown"')
source=$(echo "$input_json" | jq -r '.source // "unknown"')

# Load development context if requested
if [[ "$load_context" == "true" ]]; then
    context=""
    context+="Session started at: $(date '+%Y-%m-%d %H:%M:%S')\n"
    context+="Session source: $source\n"

    # Add git information if available
    if git rev-parse --git-dir > /dev/null 2>&1; then
        branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
        context+="Git branch: $branch\n"

        changes=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
        if [[ "$changes" -gt 0 ]]; then
            context+="Uncommitted changes: $changes files\n"
        fi
    fi

    # Project-scoped knowledge memory status (lightweight; no token-heavy dumps)
    project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
    project_id="$(basename "$project_dir" | sed 's/[^[:alnum:]._-]/_/g')"
    graph_path="$project_dir/.thoughtbox/projects/$project_id/memory/graph.jsonl"
    if [[ -f "$graph_path" ]]; then
        line_count=$(wc -l < "$graph_path" 2>/dev/null | tr -d ' ')
        context+="\n--- 🧠 Project Knowledge Memory ---\n"
        context+="graph.jsonl entries: ${line_count}\n"
        context+="path: $graph_path\n"
    fi

    # Load session handoff from previous session
    handoff_file="$project_dir/.claude/session-handoff.json"
    if [[ -f "$handoff_file" ]]; then
        # Validate: handoff SHA must be ancestor of HEAD
        handoff_sha=$(jq -r '.git.lastCommit.sha // ""' "$handoff_file" 2>/dev/null)
        is_current=true
        if [[ -n "$handoff_sha" ]] && ! git merge-base --is-ancestor "$handoff_sha" HEAD 2>/dev/null; then
            is_current=false
        fi

        if [[ "$is_current" == "true" ]]; then
            context+="\n--- Session Continuity (previous handoff) ---\n"
            prev_summary=$(jq -r '.summary // "No summary"' "$handoff_file" 2>/dev/null)
            prev_branch=$(jq -r '.git.branch // "unknown"' "$handoff_file" 2>/dev/null)
            prev_time=$(jq -r '.timestamp // ""' "$handoff_file" 2>/dev/null)
            context+="Previous session: $prev_time on $prev_branch\n"
            context+="Summary: $prev_summary\n"

            # Show failed approaches (highest value — prevents repeating mistakes)
            failed_count=$(jq -r '.failed_approaches | length // 0' "$handoff_file" 2>/dev/null || echo 0)
            if [[ "$failed_count" -gt 0 ]]; then
                context+="Failed approaches (do NOT retry):\n"
                failed_text=$(jq -r '.failed_approaches[] | "- \(.what): \(.why)"' "$handoff_file" 2>/dev/null | head -5)
                context+="$failed_text\n"
            fi

            # Recommend next action if present
            next_action=$(jq -r '.next_priorities[0] // ""' "$handoff_file" 2>/dev/null)
            if [[ -n "$next_action" && "$next_action" != "null" ]]; then
                context+="Recommended: $next_action\n"
            fi
        else
            context+="\n--- Stale handoff (branch diverged, skipping) ---\n"
        fi
    fi

    # Load project-specific context files if they exist
    for file in ".claude/CONTEXT.md" ".claude/TODO.md" "TODO.md" ".github/ISSUE_TEMPLATE.md"; do
        if [[ -f "$file" ]]; then
            context+="\n--- Content from $file ---\n"
            context+="$(head -c 1000 "$file")\n"
        fi
    done

    # Note: legacy .claude/rules memory loading intentionally removed to prevent context clogging.

    # Add recent issues if gh CLI is available
    if command -v gh &> /dev/null; then
        issues=$(gh issue list --limit 5 --state open 2>/dev/null || true)
        if [[ -n "$issues" ]]; then
            context+="\n--- Recent GitHub Issues ---\n"
            context+="$issues\n"
        fi
    fi

    # Output context in hook-specific format
    jq -n --arg ctx "$context" \
      '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$ctx}}'
fi

# Note: TTS announcement functionality removed
# Session start is now logged silently

exit 0
