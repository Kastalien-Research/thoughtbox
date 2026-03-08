#!/usr/bin/env bash
# Pre-tool use hook - validates and logs tool usage

set -euo pipefail

# Read JSON input from stdin
input_json=$(cat)

# Extract tool name and input
tool_name=$(echo "$input_json" | jq -r '.tool_name // ""')
tool_input=$(echo "$input_json" | jq -r '.tool_input // {}')

# Function to check for dangerous rm commands
is_dangerous_rm() {
    local command="$1"
    local normalized=$(echo "$command" | tr -s ' ' | tr '[:upper:]' '[:lower:]')
    
    # Check for rm -rf patterns
    if echo "$normalized" | grep -qE '\brm\s+.*-[a-z]*r[a-z]*f' || \
       echo "$normalized" | grep -qE '\brm\s+.*-[a-z]*f[a-z]*r' || \
       echo "$normalized" | grep -qE '\brm\s+--recursive\s+--force' || \
       echo "$normalized" | grep -qE '\brm\s+--force\s+--recursive'; then
        
        # Check for dangerous paths
        if echo "$normalized" | grep -qE '(/\*|~|~\/|\$HOME|\.\.|^\s*\.)'; then
            return 0  # dangerous
        fi
        return 0  # any rm -rf is dangerous
    fi
    return 1  # not dangerous
}

# Function to check for .env file write access
is_env_file_write() {
    local tool="$1"
    local input="$2"
    
    if [[ "$tool" == "Edit" || "$tool" == "MultiEdit" || "$tool" == "Write" ]]; then
        local file_path=$(echo "$input" | jq -r '.file_path // ""')
        if [[ "$file_path" == *".env"* && "$file_path" != *".env.sample"* ]]; then
            return 0  # writing to .env
        fi
    elif [[ "$tool" == "Bash" ]]; then
        local command=$(echo "$input" | jq -r '.command // ""')
        if echo "$command" | grep -qE '\.env\b' && ! echo "$command" | grep -q '\.env\.sample'; then
            return 0  # potentially modifying .env
        fi
    fi
    return 1  # not writing to .env
}

# Check for .env file write access (read access is allowed)
if is_env_file_write "$tool_name" "$tool_input"; then
    echo "BLOCKED: Write access to .env files containing sensitive data is prohibited" >&2
    echo "Read access is allowed, but modifications must be done manually" >&2
    exit 2  # Exit code 2 blocks tool call
fi

# Function to check for .claude directory modifications
is_claude_dir_modification() {
    local tool="$1"
    local input="$2"

    if [[ "$tool" == "Edit" || "$tool" == "Write" ]]; then
        local file_path=$(echo "$input" | jq -r '.file_path // ""')
        if [[ "$file_path" == *".claude/hooks/"* || "$file_path" == *".claude/settings"* ]]; then
            return 0  # modifying .claude infrastructure
        fi
    elif [[ "$tool" == "Bash" ]]; then
        local command=$(echo "$input" | jq -r '.command // ""')
        # Block any writes to .claude/hooks or .claude/settings
        if echo "$command" | grep -qE '(>|>>|tee|mv|cp|rm).*\.claude/(hooks|settings)'; then
            return 0  # modifying .claude infrastructure
        fi
    fi
    return 1  # not modifying .claude
}

# Check for .claude directory modifications (agents should never modify their own hooks/settings)
if is_claude_dir_modification "$tool_name" "$tool_input"; then
    echo "BLOCKED: Agents cannot modify .claude/hooks or .claude/settings files" >&2
    echo "This prevents agents from disabling their own safety mechanisms" >&2
    echo "If hooks/settings need changes, the user must make them manually" >&2
    exit 2  # Exit code 2 blocks tool call
fi

# Block Write (full-file replace) to memory-bearing files
# Edit (surgical replacement) is allowed — it can't delete content it doesn't reference
is_destructive_memory_write() {
    local tool="$1"
    local input="$2"
    if [[ "$tool" == "Write" ]]; then
        local file_path=$(echo "$input" | jq -r '.file_path // ""')
        local basename=$(basename "$file_path")
        case "$basename" in
            CLAUDE.md|AGENTS.md)
                return 0;;
        esac
        if [[ "$file_path" == *".claude/agents/"* && "$file_path" == *.md ]]; then
            return 0
        fi
    fi
    return 1
}

# Protected working directories — local dev artifacts that must not be deleted or overwritten
PROTECTED_WORK_DIRS=("specs/" ".specs/" "docs/" "self-improvement/")

# Block deletion of files in protected working directories (any rm, not just rm -rf)
is_protected_dir_deletion() {
    local command="$1"
    for dir in "${PROTECTED_WORK_DIRS[@]}"; do
        if echo "$command" | grep -qE "\brm\s+.*${dir}"; then
            return 0  # blocked
        fi
        if echo "$command" | grep -qE "\bmv\s+.*${dir}.*\s+/dev/null"; then
            return 0  # blocked
        fi
    done
    return 1
}

# Block Write (full-file replace) to files in protected working directories
# Edit (surgical replacement) is allowed
is_protected_dir_overwrite() {
    local tool="$1"
    local input="$2"
    if [[ "$tool" == "Write" ]]; then
        local file_path=$(echo "$input" | jq -r '.file_path // ""')
        for dir in "${PROTECTED_WORK_DIRS[@]}"; do
            if [[ "$file_path" == *"${dir}"* ]]; then
                return 0  # blocked
            fi
        done
    fi
    return 1
}

if is_destructive_memory_write "$tool_name" "$tool_input"; then
    echo "BLOCKED: Write (full replace) to memory-bearing file is prohibited" >&2
    echo "Use Edit for surgical changes instead" >&2
    exit 2
fi

# Check for deletion of files in protected working directories
if [[ "$tool_name" == "Bash" ]]; then
    _cmd=$(echo "$tool_input" | jq -r '.command // ""')
    if is_protected_dir_deletion "$_cmd"; then
        echo "BLOCKED: Cannot delete files in protected working directories (specs/, .specs/, docs/, self-improvement/)" >&2
        echo "These are local development artifacts. Use Edit for surgical changes." >&2
        exit 2
    fi
fi

# Check for Write (full replace) to protected working directories
if is_protected_dir_overwrite "$tool_name" "$tool_input"; then
    echo "BLOCKED: Cannot Write (full replace) to files in protected working directories" >&2
    echo "Use Edit for surgical changes to specs and documentation." >&2
    exit 2
fi

# Function to check for dangerous Git operations
is_dangerous_git() {
    local command="$1"
    local normalized=$(echo "$command" | tr -s ' ' | tr '[:upper:]' '[:lower:]')
    
    # Protected branches
    PROTECTED_BRANCHES=("main" "master" "develop" "production")
    
    # Check for direct push to protected branches
    for branch in "${PROTECTED_BRANCHES[@]}"; do
        if echo "$normalized" | grep -qE "git\s+push\s+.*\s+${branch}\b"; then
            return 0  # dangerous
        fi
    done
    
    # Check for force push
    if echo "$normalized" | grep -qE "git\s+push\s+.*--force" || \
       echo "$normalized" | grep -qE "git\s+push\s+.*-f\b"; then
        return 0  # dangerous
    fi
    
    # Check for branch deletion without confirmation
    if echo "$normalized" | grep -qE "git\s+branch\s+-D\s+" || \
       echo "$normalized" | grep -qE "git\s+branch\s+--delete\s+"; then
        return 0  # dangerous
    fi
    
    # Check for remote branch deletion
    if echo "$normalized" | grep -qE "git\s+push\s+.*--delete" || \
       echo "$normalized" | grep -qE "git\s+push\s+.*:refs/heads/"; then
        return 0  # dangerous
    fi
    
    return 1  # not dangerous
}

# Function to validate Git commit message format
is_invalid_commit_message() {
    local command="$1"
    local normalized=$(echo "$command" | tr -s ' ' | tr '[:upper:]' '[:lower:]')
    
    # Extract commit message from git commit -m "message"
    if echo "$normalized" | grep -qE "git\s+commit\s+.*-m\s+['\"]"; then
        # Extract message (simplified - may need refinement)
        local msg=$(echo "$command" | sed -n "s/.*-m\s*['\"]\([^'\"]*\)['\"].*/\1/p")
        if [[ -n "$msg" ]]; then
            # Check if it follows conventional commit format
            if ! echo "$msg" | grep -qE '^(feat|fix|refactor|docs|test|chore|perf|style)(\(.+\))?:'; then
                return 0  # invalid format
            fi
        fi
    fi
    
    return 1  # valid or not a commit command
}

ACCESS_JSONL=".claude/state/file_access.jsonl"
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
ENFORCE_IMPORT_GUARD="${CC_REQUIRE_IMPORT_READS_FOR_NEW_FILES:-1}"

canonical_path() {
    local input_path="$1"
    python3 - "$input_path" <<'PY' || echo "$input_path"
import os, sys
path = sys.argv[1]
print(os.path.abspath(path))
PY
}

collect_target_paths() {
    case "$tool_name" in
        "Write"|"Edit")
            echo "$tool_input" | jq -r '.file_path // ""'
            ;;
        "MultiEdit")
            echo "$tool_input" | jq -r '
              (
                (.edits // []) | map(.file_path // empty)
              ) + (
                (.files // []) | map(.file_path // empty)
              )
              | map(select(. != ""))
              | .[]
            '
            ;;
    esac
}

get_last_event_ts() {
    local path="$1"
    local regex="$2"
    [[ -f "$ACCESS_JSONL" ]] || { echo ""; return; }
    jq -sr --arg path "$path" --arg re "$regex" '
      map(select(.path == $path and (.tool|test($re)))) | (.[-1].ts // "")
    ' "$ACCESS_JSONL"
}

require_read_after_last_write() {
    local path="$1"
    local context="$2"

    if [[ ! -f "$path" ]]; then
        return 0
    fi

    if [[ ! -f "$ACCESS_JSONL" ]]; then
        echo "BLOCKED: Must Read $context ($path) before modifying it (no access history yet)." >&2
        exit 2
    fi

    local last_read last_mut
    last_read="$(get_last_event_ts "$path" "^Read$")"
    last_mut="$(get_last_event_ts "$path" "^(Write|Edit|MultiEdit)$")"

    if [[ -z "$last_read" ]]; then
        echo "BLOCKED: Must Read $context ($path) before modifying it." >&2
        exit 2
    fi

    if [[ -n "$last_mut" && "$last_read" < "$last_mut" ]]; then
        echo "BLOCKED: Must re-Read $context ($path) after its last edit before modifying it." >&2
        exit 2
    fi
}

resolve_import_references() {
    local content="$1"
    python3 - "$content" <<'PY'
import json, re, sys

content = sys.argv[1]
pattern = re.compile(
    r'(?:'
    r'import\s+[^;]*["\'](\.?\.?/[^"\']+|src/[^"\']+)["\']'
    r'|from\s+["\'](\.?\.?/[^"\']+|src/[^"\']+)["\']'
    r'|require\s*\(\s*["\'](\.?\.?/[^"\']+|src/[^"\']+)["\']'
    r')'
)
refs = []
for match in pattern.finditer(content):
    for group in match.groups():
        if group:
            refs.append(group)
print(json.dumps(refs))
PY
}

resolve_existing_path_candidates() {
    local ref="$1"
    local base_dir="$2"
    local candidates=()

    local root="${PROJECT_DIR%/}"
    local base="$base_dir"
    local candidate=""

    if [[ "$ref" == /* ]]; then
        candidate="$root$ref"
    elif [[ "$ref" == .* ]]; then
        candidate="$(python3 - "$base" "$ref" <<'PY'
import os, sys
base, ref = sys.argv[1:3]
print(os.path.abspath(os.path.join(base, ref)))
PY
)"
    else
        candidate="$root/$ref"
    fi

    candidates+=("$candidate")

    local exts=("" ".ts" ".tsx" ".js" ".jsx" ".mjs" ".cjs" ".json" ".md")
    for ext in "${exts[@]}"; do
        candidates+=("${candidate}${ext}")
    done

    if [[ -d "$candidate" ]]; then
        for ext in "${exts[@]}"; do
            candidates+=("$candidate/index${ext}")
        done
    fi

    printf "%s\n" "${candidates[@]}" | awk '!seen[$0]++' | while IFS= read -r c; do
        [[ -e "$c" ]] && echo "$c"
    done
}

# Check for dangerous Git operations
if [[ "$tool_name" == "Bash" ]]; then
    command=$(echo "$tool_input" | jq -r '.command // ""')
    
    # Check for dangerous rm commands
    if is_dangerous_rm "$command"; then
        echo "BLOCKED: Dangerous rm command detected and prevented" >&2
        exit 2  # Exit code 2 blocks tool call
    fi
    
    # Check for dangerous Git operations
    if is_dangerous_git "$command"; then
        echo "BLOCKED: Dangerous Git operation detected and prevented" >&2
        echo "   Protected operations:" >&2
        echo "   - Direct push to main/master/develop/production" >&2
        echo "   - Force push (--force or -f)" >&2
        echo "   - Branch deletion" >&2
        echo "   Use Pull Requests for protected branches instead." >&2
        exit 2  # Exit code 2 blocks tool call
    fi
    
    # Warn about invalid commit messages (but don't block)
    if is_invalid_commit_message "$command"; then
        echo "⚠️  WARNING: Commit message doesn't follow conventional format" >&2
        echo "   Use: type(scope): subject (e.g., feat(notebook): add feature)" >&2
        # Don't exit - just warn
    fi
fi

# Read-guard enforcement for file mutation tools
if [[ "${CC_DISABLE_READ_GUARD:-0}" != "1" ]]; then
    case "$tool_name" in
        "Write"|"Edit"|"MultiEdit")
            raw_paths="$(collect_target_paths | sed '/^$/d')"
            unique_paths="$(printf "%s\n" "$raw_paths" | awk '!seen[$0]++')"
            target_paths=()
            while IFS= read -r p; do
                [[ -z "$p" ]] && continue
                abs="$(canonical_path "$p")"
                target_paths+=("$abs")
            done <<< "$unique_paths"

            new_files=()
            for path in "${target_paths[@]}"; do
                if [[ -f "$path" ]]; then
                    require_read_after_last_write "$path" "target file"
                else
                    new_files+=("$path")
                fi
            done

            # Optional dependency guard for new files that reference existing files
            if [[ "$ENFORCE_IMPORT_GUARD" == "1" && "$tool_name" == "Write" && ${#new_files[@]} -gt 0 ]]; then
                content="$(echo "$tool_input" | jq -r '.content // ""')"
                if [[ -n "$content" ]]; then
                    for new_path in "${new_files[@]}"; do
                        python3 - "$ACCESS_JSONL" "$PROJECT_DIR" "$new_path" "$content" <<'PY'
import json, os, re, sys

log_path, project_dir, target_path, content = sys.argv[1:5]

def last_ts(path, kinds):
    if not os.path.isfile(log_path):
        return None
    ts = []
    with open(log_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                evt = json.loads(line)
            except Exception:
                continue
            if evt.get("path") == path and evt.get("tool") in kinds and evt.get("ts"):
                ts.append(evt["ts"])
    return ts[-1] if ts else None

pattern = re.compile(
    r'(?:'
    r'import\s+[^;]*[\"\'](\.?\.?/[^\"\']+|src/[^\"\']+)[\"\']'
    r'|from\s+[\"\'](\.?\.?/[^\"\']+|src/[^\"\']+)[\"\']'
    r'|require\s*\(\s*[\"\'](\.?\.?/[^\"\']+|src/[^\"\']+)[\"\']'
    r')'
)

deps = []
for match in pattern.finditer(content):
    ref = next((g for g in match.groups() if g), None)
    if not ref:
        continue
    if ref.startswith("/"):
        base = os.path.join(project_dir, ref.lstrip("/"))
    elif ref.startswith("."):
        base = os.path.abspath(os.path.join(os.path.dirname(target_path), ref))
    else:
        base = os.path.join(project_dir, ref)

    candidates = [base] + [base + ext for ext in [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md"]]
    if os.path.isdir(base):
        candidates += [os.path.join(base, f"index{ext}") for ext in [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md"]]

    for cand in candidates:
        if os.path.exists(cand):
            deps.append(os.path.abspath(cand))

# Deduplicate while preserving order
seen = set()
ordered_deps = []
for dep in deps:
    if dep in seen:
        continue
    seen.add(dep)
    ordered_deps.append(dep)

for dep in ordered_deps:
    last_read = last_ts(dep, ["Read"])
    last_mut = last_ts(dep, ["Write", "Edit", "MultiEdit"])

    if not last_read:
        sys.stderr.write(f"BLOCKED: Must Read imported dependency ({dep}) before creating {target_path}\n")
        sys.exit(2)
    if last_mut and last_read <= last_mut:
        sys.stderr.write(f"BLOCKED: Must re-Read imported dependency ({dep}) after its last edit before creating {target_path}\n")
        sys.exit(2)

sys.exit(0)
PY
                        status=$?
                        if [[ $status -ne 0 ]]; then
                            exit $status
                        fi
                    done
                fi
            fi
            ;;
    esac
fi

# Ensure log directory exists
mkdir -p logs

# Read existing log data or initialize empty array
if [[ -f logs/pre_tool_use.json ]]; then
    log_data=$(cat logs/pre_tool_use.json)
else
    log_data="[]"
fi

# Append new data
echo "$log_data" | jq --argjson new "$input_json" '. += [$new]' > logs/pre_tool_use.json

exit 0
