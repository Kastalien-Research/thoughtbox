#!/bin/bash

# Configuration
STATE_DIR=".ulysses"
STATE_FILE="$STATE_DIR/session.json"

# Helper for loading/saving state with jq
load_json() {
    if [ ! -f "$STATE_FILE" ]; then
        echo '{"S": 0, "surprise_register": [], "checkpoints": ["initial"], "history": [], "hypotheses": [], "active_step": null}'
    else
        cat "$STATE_FILE"
    fi
}

save_json() {
    mkdir -p "$STATE_DIR"
    echo "$1" > "$STATE_FILE"
}

case "$1" in
    init)
        save_json '{"S": 0, "surprise_register": [], "checkpoints": ["initial"], "history": [], "hypotheses": [], "active_step": null}'
        echo "✅ Ulysses Protocol Session Initialized (S=0)."
        git add .
        git commit -m "ulysses (S=0): init session" || true
        echo "📦 Git checkpoint created."
        ;;

    plan)
        # Usage: ulysses plan "<primary>" "<recovery>" [--irreversible]
        STATE=$(load_json)
        S=$(echo "$STATE" | jq -r '.S')
        [ "$S" -eq 2 ] && echo "❌ Error: REFLECT phase (S=2). Run 'reflect' first." && exit 1
        
        PHASE=$([ "$S" -eq 0 ] && echo "PLAN" || echo "RECOVERY")
        IRREVERSIBLE="false"
        [[ "$*" == *"--irreversible"* ]] && IRREVERSIBLE="true"

        STATE=$(echo "$STATE" | jq --arg p "$2" --arg r "$3" --arg ph "$PHASE" --arg irr "$IRREVERSIBLE" \
            '.active_step = {"phase": $ph, "primary": $p, "recovery": $r, "irreversible": ($irr == "true"), "timestamp": now | strftime("%Y-%m-%dT%H:%M:%SZ")}')
        
        save_json "$STATE"
        echo "✅ Step Recorded ($PHASE)"
        echo "Primary: $2"
        echo "Recovery: $3"
        [ "$IRREVERSIBLE" == "true" ] && echo "⚠️  Warning: Step is IRREVERSIBLE."
        ;;

    outcome)
        # Usage: ulysses outcome <type> [--severity <1|2>] [--details <text>]
        STATE=$(load_json)
        ACTIVE_STEP=$(echo "$STATE" | jq -r '.active_step')
        [ "$ACTIVE_STEP" == "null" ] && echo "❌ Error: No active step." && exit 1

        TYPE="$2"
        SEVERITY="1"
        DETAILS=""
        # Simple arg parsing for optional flags in bash
        for arg in "$@"; do
            [[ $arg == "--severity" ]] && SEVERITY="${!((OPTIND++))}" # skip next next
            [[ $arg == "--details" ]] && DETAILS="${!((OPTIND++))}"
        done

        # Record History item
        OUTCOME=$(jq -n --arg type "$TYPE" --arg details "$DETAILS" --argjson step "$ACTIVE_STEP" \
            '{"step": $step, "assessment": $type, "details": $details, "timestamp": now | strftime("%Y-%m-%dT%H:%M:%SZ")}')
        
        STATE=$(echo "$STATE" | jq --argjson o "$OUTCOME" '.history += [$o] | .active_step = null')

        if [ "$TYPE" == "expected" ]; then
            S=0
            STATE=$(echo "$STATE" | jq --arg s "$S" '.S = ($s|human_readable_status) | .checkpoints += ["checkpoint_" + (.checkpoints|length|tostring)]')
            echo "✅ Outcome: Expected. Resetting to S=0."
            
            # Git Checkpoint
            COMMIT_MSG=$(echo "$OUTCOME" | jq -r '.step.primary')
            git add .
            git commit -m "ulysses (S=0): $COMMIT_MSG" || true
            echo "📦 Git checkpoint created."
        else
            # Process Surprise
            echo "💥 Surprise ($TYPE). Severity: $SEVERITY"
            STATE=$(echo "$STATE" | jq --arg sev "$SEVERITY" --argjson o "$OUTCOME" \
                '.surprise_register += [{"details": $o.details, "severity": $sev, "timestamp": $o.timestamp}] | .surprise_register = .surprise_register[-3:]')
            
            if [ "$SEVERITY" == "2" ]; then
                STATE=$(echo "$STATE" | jq '.S = 2')
                echo "🚨 Flagrant-2: Immediate REFLECT."
            else
                S=$(echo "$STATE" | jq '.S')
                NEW_S=$(($S + 1))
                [ "$NEW_S" -gt 2 ] && NEW_S=2
                STATE=$(echo "$STATE" | jq --arg ns "$NEW_S" '.S = ($ns|tonumber)')
                echo "➡️  S=$NEW_S."
            fi
        fi
        save_json "$STATE"
        ;;

    reflect)
        # Usage: ulysses reflect "<hypothesis>" "<falsification>"
        STATE=$(load_json)
        STATE=$(echo "$STATE" | jq --arg h "$2" --arg f "$3" \
            '.hypotheses += [{"statement": $h, "falsification": $f, "timestamp": now | strftime("%Y-%m-%dT%H:%M:%SZ")}] | .S = 0')
        save_json "$STATE"
        echo "🧠 Reflection Recorded. S reset to 0."
        
        # Git Checkpoint
        git add .
        git commit -m "ulysses (S=0): reflect - $2" || true
        echo "📦 Git checkpoint created for reflection."
        ;;

    status)
        STATE=$(load_json)
        S=$(echo "$STATE" | jq -r '.S')
        STEP=$(echo "$STATE" | jq -r '.active_step.primary // "None"')
        CP=$(echo "$STATE" | jq -r '.checkpoints[-1] // "None"')
        SR=$(echo "$STATE" | jq -r '.surprise_register | length')
        echo "--- Ulysses Status (S=$S) ---"
        echo "Active Step: $STEP"
        echo "Last Checkpoint: $CP"
        echo "Surprise Register: $SR items"
        echo "--------------------------------"
        ;;

    *)
        echo "Usage: ulysses {init|plan|outcome|reflect|status}"
        exit 1
        ;;
esac
