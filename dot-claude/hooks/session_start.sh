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

# Ensure log directory exists
mkdir -p logs

# Read existing log data or initialize empty array
if [[ -f logs/session_start.json ]]; then
    log_data=$(cat logs/session_start.json)
else
    log_data="[]"
fi

# Append new data
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
    
    # Load memory system context - current focus
    if [[ -f ".claude/rules/active-context/current-focus.md" ]]; then
        context+="\n--- 🎯 Current Focus (Memory System) ---\n"
        context+="$(head -c 2000 ".claude/rules/active-context/current-focus.md")\n"
    fi
    
    # Load project-specific context files if they exist
    for file in ".claude/CONTEXT.md" ".claude/TODO.md" "TODO.md" ".github/ISSUE_TEMPLATE.md"; do
        if [[ -f "$file" ]]; then
            context+="\n--- Content from $file ---\n"
            context+="$(head -c 1000 "$file")\n"
        fi
    done
    
    # Log loaded memory files
    if [[ -d ".claude/rules" ]]; then
        context+="\n--- 🧠 Memory System Status ---\n"
        rule_count=$(find .claude/rules -name "*.md" -type f | wc -l | tr -d ' ')
        context+="Available memory files: $rule_count\n"
        context+="Hot learnings (< 2 weeks): $(grep -r "🔥" .claude/rules 2>/dev/null | wc -l | tr -d ' ')\n"
        context+="Warm learnings (< 3 months): $(grep -r "⚡" .claude/rules 2>/dev/null | wc -l | tr -d ' ')\n"
        context+="\nSee CLAUDE.md for memory system guide\n"
    fi
    
    # Add recent issues if gh CLI is available
    if command -v gh &> /dev/null; then
        issues=$(gh issue list --limit 5 --state open 2>/dev/null || true)
        if [[ -n "$issues" ]]; then
            context+="\n--- Recent GitHub Issues ---\n"
            context+="$issues\n"
        fi
    fi
    
    # Output context in hook-specific format
    echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"$context\"}}"
fi

# Note: TTS announcement functionality removed
# Session start is now logged silently

exit 0
