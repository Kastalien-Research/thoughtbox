#!/bin/bash

STATE_DIR=".theseus"
STATE_FILE="$STATE_DIR/session.json"

# Helper for loading/saving state with jq
load_json() {
    if [ ! -f "$STATE_FILE" ]; then
        echo '{"B": 0, "scope": [], "visas": [], "test_fail_count": 0, "last_checkpoint": null}'
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
        shift
        if [ "$#" -eq 0 ]; then
            echo "❌ Error: Must provide initial file scope (e.g., ./theseus.sh init src/auth.ts)"
            exit 1
        fi
        
        # Git Checkpoint
        git add .
        git commit -m "theseus (B=0,init): Start refactor session" || true
        HEAD_COMMIT=$(git rev-parse HEAD)
        
        SCOPE=$(printf '"%s",' "$@" | sed 's/,$//')
        save_json "{\"B\": 0, \"scope\": [$SCOPE], \"visas\": [], \"test_fail_count\": 0, \"last_checkpoint\": \"$HEAD_COMMIT\"}"
        echo "✅ Theseus Protocol Initialized (B=0)."
        echo "🔒 Scope locked to: $@"
        echo "📦 Initial checkpoint saved: $HEAD_COMMIT"
        ;;

    visa)
        # Usage: theseus.sh visa <file> "<reason>"
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "❌ Usage: theseus.sh visa <file> \"<reason>\""
            exit 1
        fi
        STATE=$(load_json)
        STATE=$(echo "$STATE" | jq --arg f "$2" --arg r "$3" \
            '.visas += [{"file": $f, "reason": $r, "timestamp": now | strftime("%Y-%m-%dT%H:%M:%SZ")}] | .scope += [$f]')
        save_json "$STATE"
        echo "🛂 Visa Granted. Added '$2' to declared scope."
        ;;

    checkpoint)
        # Usage: theseus.sh checkpoint "<message>"
        if [ -z "$2" ]; then
            echo "❌ Usage: theseus.sh checkpoint \"<atomic message>\""
            exit 1
        fi
        MESSAGE="$2"
        
        # Syntactic Tollbooth
        # Reject if message contains "and", "also", "plus", etc. (case insensitive word match)
        if echo "$MESSAGE" | grep -iE '\b(and|also|plus)\b' > /dev/null; then
            echo "❌ Tollbooth Rejected: Checkpoint narrative must be atomic. Contains banned syntax ('and', 'also', 'plus')."
            exit 1
        fi
        
        # NOTE: Cassandra Audit (LLM Evaluation) happens in Thoughtbox layer, not here.
        # Calling this CLI command implies Cassandra evaluation already passed.
        
        git add .
        git commit -m "theseus (B=0): $MESSAGE" || true
        HEAD_COMMIT=$(git rev-parse HEAD)

        STATE=$(load_json)
        STATE=$(echo "$STATE" | jq --arg hc "$HEAD_COMMIT" '.last_checkpoint = $hc | .test_fail_count = 0 | .B = 0')
        save_json "$STATE"
        echo "✅ Checkpoint Accepted. Syntactic Tollbooth passed."
        echo "📦 Git checkpoint created: $HEAD_COMMIT"
        ;;

    outcome)
        # Usage: theseus.sh outcome <pass|fail>
        if [ "$2" != "pass" ] && [ "$2" != "fail" ]; then
            echo "❌ Usage: theseus.sh outcome <pass|fail>"
            exit 1
        fi
        
        STATE=$(load_json)
        if [ "$2" == "pass" ]; then
            STATE=$(echo "$STATE" | jq '.test_fail_count = 0 | .B = 0')
            save_json "$STATE"
            echo "✅ Tests Passed. You may checkpoint or continue."
        else
            COUNT=$(echo "$STATE" | jq -r '.test_fail_count')
            NEW_COUNT=$((COUNT + 1))
            
            if [ "$NEW_COUNT" -ge 2 ]; then
                # Red-Green Timer Expiration
                LAST_CP=$(echo "$STATE" | jq -r '.last_checkpoint')
                echo "🚨 Red-Green Timer Expired (2 consecutive fails)."
                echo "⏪ Executing ruthless 'git reset --hard' to $LAST_CP"
                git reset --hard "$LAST_CP"
                
                # Reset counter after rollback
                STATE=$(echo "$STATE" | jq '.test_fail_count = 0 | .B = 0')
                save_json "$STATE"
            else
                STATE=$(echo "$STATE" | jq --arg nc "$NEW_COUNT" '.test_fail_count = ($nc|tonumber) | .B = 1')
                save_json "$STATE"
                echo "⚠️ Tests Failed. Timer started. 1 repair attempt remaining (B=1)."
            fi
        fi
        ;;

    status)
        STATE=$(load_json)
        B=$(echo "$STATE" | jq -r '.B')
        FAILS=$(echo "$STATE" | jq -r '.test_fail_count')
        SCOPE=$(echo "$STATE" | jq -r '.scope | join(", ")')
        VISAS=$(echo "$STATE" | jq -r '.visas | length')
        echo "--- Theseus Status (B=$B) ---"
        echo "Test Fail Count: $FAILS (0 = safe, 1 = warning, 2 = ruthless reset)"
        echo "Declared Scope: $SCOPE"
        echo "Active Visas: $VISAS"
        echo "--------------------------------"
        ;;

    *)
        echo "Usage: theseus.sh {init|visa|checkpoint|outcome|status}"
        exit 1
        ;;
esac
