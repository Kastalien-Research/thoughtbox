# ===================================================================
# SECTION: Ulysses enforcer (reflect-required blocks everything)
# ===================================================================

ulysses_state_dir="${PROJECT_DIR}/.claude/state/ulysses"
workflow_state_dir="${PROJECT_DIR}/.claude/state/task-workflow"

if [[ -f "$ulysses_state_dir/reflect-required" ]]; then
    if [[ "$tool_name" == "Read" || "$tool_name" == "Glob" || "$tool_name" == "Grep" \
       || "$tool_name" == "AskUserQuestion" ]]; then
        exit 0
    fi
    if [[ "$tool_name" == "Bash" ]]; then
        _cmd=$(echo "$tool_input" | jq -r '.command // ""')
        if [[ "$_cmd" == *"ulysses"* && "$_cmd" == *"reflect"* ]] \
           || [[ "$_cmd" == *"thoughtbox_gateway"* && "$_cmd" == *"reflect"* ]] \
           || [[ "$_cmd" == *"git status"* || "$_cmd" == *"git diff"* ]]; then
            exit 0
        fi
    fi
    if [[ "$tool_name" == "Skill" ]]; then
        exit 0
    fi
    task_id="unknown"
    count=0
    if [[ -f "$workflow_state_dir/current-task.json" ]]; then
        task_id=$(jq -r '.task_id // "unknown"' "$workflow_state_dir/current-task.json")
        count=$(jq -r '.surprise_count // 0' "$workflow_state_dir/current-task.json")
    fi
    echo "BLOCKED: REFLECT REQUIRED (${count} consecutive surprises on ${task_id})." >&2
    exit 1
fi

# ===================================================================
# SECTION: Workflow enforcer
# ===================================================================

# Pending validation blocks new work
if [[ -f "$workflow_state_dir/pending-validation.json" ]]; then
    task_ids=$(jq -r '.task_ids // ""' "$workflow_state_dir/pending-validation.json")
    if [[ "$tool_name" == "Read" || "$tool_name" == "Glob" || "$tool_name" == "Grep" \
       || "$tool_name" == "AskUserQuestion" ]]; then
        exit 0
    fi
    if [[ "$tool_name" == "Bash" ]]; then
        _cmd=$(echo "$tool_input" | jq -r '.command // ""')
        if [[ "$_cmd" == *"vitest"* || "$_cmd" == *"tsc"* \
           || "$_cmd" == *"test"* || "$_cmd" == *"supabase"*"query"* \
           || "$_cmd" == *"supabase"*"migration list"* \
           || "$_cmd" == *"git status"* || "$_cmd" == *"git diff"* \
           || "$_cmd" == *"validation-confirmed"* ]]; then
            exit 0
        fi
    fi
    echo "BLOCKED: Validation pending for closed task(s): ${task_ids}" >&2
    exit 1
fi

# No code changes without hypothesis
if [[ "$tool_name" == "Edit" || "$tool_name" == "Write" ]]; then
    _fp=$(echo "$tool_input" | jq -r '.file_path // ""')
    if [[ "$_fp" == */src/* || "$_fp" == */supabase/migrations/* ]]; then
        if [[ -f "$workflow_state_dir/current-task.json" ]]; then
            hyp=$(jq -r '.hypothesis_stated // false' "$workflow_state_dir/current-task.json")
            if [[ "$hyp" != "true" ]]; then
                task_id=$(jq -r '.task_id // "unknown"' "$workflow_state_dir/current-task.json")
                echo "BLOCKED: No code changes until hypothesis is recorded for ${task_id}." >&2
                echo "Record hypothesis before making code changes. --notes=\"Hypothesis: <your hypothesis>\"" >&2
                exit 1
            fi
        fi
    fi
fi

exit 0
