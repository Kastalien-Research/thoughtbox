#!/usr/bin/env bash
# PostToolUse hook: detect assumption-laden tool calls and record candidates
set -euo pipefail

input_json=$(cat)
tool_name=$(echo "$input_json" | jq -r '.tool_name // ""')

# Only inspect WebFetch, WebSearch, Bash
case "$tool_name" in
    WebFetch|WebSearch) ;;
    Bash) ;;
    *) exit 0 ;;
esac

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
candidates_file="$project_dir/.assumptions/candidates.jsonl"
mkdir -p "$project_dir/.assumptions"

# Extract tool input
tool_input=$(echo "$input_json" | jq -r '.tool_input // ""')

# Pattern match for assumption-laden calls
is_candidate=false
category=""
claim=""

case "$tool_name" in
    WebFetch|WebSearch)
        url=$(echo "$tool_input" | jq -r '.url // .query // ""')
        # API documentation patterns
        if echo "$url" | grep -qiE '(docs\.|api\.|npmjs\.com|pypi\.org|crates\.io|/blob/|developer\.)'; then
            is_candidate=true
            category="api_behavior"
            claim="Referenced external docs: $url"
        fi
        ;;
    Bash)
        command=$(echo "$tool_input" | jq -r '.command // ""')
        # Package version checks
        if echo "$command" | grep -qiE '(npm (show|view|info)|pip (show|install)|cargo (info|search))'; then
            is_candidate=true
            category="package_stability"
            claim="Package version check: $command"
        fi
        # GitHub Actions references
        if echo "$command" | grep -qiE 'actions/(checkout|setup-node|cache)@'; then
            is_candidate=true
            category="build_infra"
            claim="GitHub Action reference: $command"
        fi
        ;;
esac

if [[ "$is_candidate" == "true" ]]; then
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    claim_truncated=$(echo "$claim" | head -c 200 | tr -d '\n')
    jq -n --arg ts "$timestamp" --arg cat "$category" --arg cl "$claim_truncated" \
      '{timestamp:$ts,category:$cat,claim:$cl,source:"auto-detected",status:"candidate"}' \
      >> "$candidates_file"
fi

exit 0
