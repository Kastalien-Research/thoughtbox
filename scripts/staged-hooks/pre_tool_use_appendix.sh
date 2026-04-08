# ===================================================================
# SECTION: Ulysses enforcer (reflect-required blocks everything)
# ===================================================================

ulysses_state_dir="${PROJECT_DIR}/.claude/state/ulysses"
workflow_state_dir="${PROJECT_DIR}/.claude/state/bead-workflow"

if [[ -f "$ulysses_state_dir/reflect-required" ]]; then
    if [[ "$tool_name" == "Read" || "$tool_name" == "Glob" || "$tool_name" == "Grep" \
       || "$tool_name" == "AskUserQuestion" ]]; then
        exit 0
    fi
    if [[ "$tool_name" == "Bash" ]]; then
        _cmd=$(echo "$tool_input" | jq -r '.command // ""')
        if [[ "$_cmd" == *"ulysses"* && "$_cmd" == *"reflect"* ]] \
           || [[ "$_cmd" == *"thoughtbox_gateway"* && "$_cmd" == *"reflect"* ]] \
           || [[ "$_cmd" == *"bd show"* || "$_cmd" == *"bd update"*"--notes"* ]] \
           || [[ "$_cmd" == *"git status"* || "$_cmd" == *"git diff"* ]]; then
            exit 0
        fi
    fi
    if [[ "$tool_name" == "Skill" ]]; then
        exit 0
    fi
    task_id="unknown"
    count=0
    if [[ -f "$workflow_state_dir/current-bead.json" ]]; then
        task_id=$(jq -r '.bead_id // "unknown"' "$workflow_state_dir/current-bead.json")
        count=$(jq -r '.surprise_count // 0' "$workflow_state_dir/current-bead.json")
    fi
    echo "BLOCKED: REFLECT REQUIRED (${count} consecutive surprises on ${task_id})." >&2
    exit 1
fi

# ===================================================================
# SECTION: Workflow enforcer
# ===================================================================

# Pending validation blocks new work
if [[ -f "$workflow_state_dir/pending-validation.json" ]]; then
    task_ids=$(jq -r '.bead_ids // ""' "$workflow_state_dir/pending-validation.json")
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
           || "$_cmd" == *"bd "* \
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
        if [[ -f "$workflow_state_dir/current-bead.json" ]]; then
            hyp=$(jq -r '.hypothesis_stated // false' "$workflow_state_dir/current-bead.json")
            if [[ "$hyp" != "true" ]]; then
                task_id=$(jq -r '.bead_id // "unknown"' "$workflow_state_dir/current-bead.json")
                echo "BLOCKED: No code changes until hypothesis is recorded for ${task_id}." >&2
                echo "Record hypothesis before making code changes. --notes=\"Hypothesis: <your hypothesis>\"" >&2
                exit 1
            fi
        fi
    fi
fi

# No batch closes and no close without tests
if [[ "$tool_name" == "Bash" ]]; then
    _cmd=$(echo "$tool_input" | jq -r '.command // ""')
    if [[ "$_cmd" == *"bd close"* ]]; then
        match_count=$(echo "$_cmd" | grep -oEc 'thoughtbox-[a-z0-9.]+')
        if [[ "$match_count" -gt 1 ]]; then
            echo "BLOCKED: Cannot close multiple issues in one command." >&2
            exit 1
        fi
        if [[ ! -f "$workflow_state_dir/tests-passed-since-edit" ]]; then
            echo "BLOCKED: Cannot close — tests have not passed since last code change." >&2
            exit 1
        fi
    fi
fi

exit 0
