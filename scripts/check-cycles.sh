#!/bin/bash
# Check for cyclic dependencies in the codebase
# Usage: ./scripts/check-cycles.sh [--verbose] [--strict]
#
# By default, warns below 3 cycles but fails at 3 or more.
# Use --strict to fail on any cycles.

set -e

STRICT=false
THRESHOLD=3

for arg in "$@"; do
    case $arg in
        --strict)
            STRICT=true
            ;;
        --threshold=*)
            THRESHOLD="${arg#*=}"
            ;;
    esac
done

echo "Checking for cyclic dependencies..."

# Run madge to detect circular dependencies
RESULT=$(npx --yes madge --circular --extensions ts src/ 2>&1) || true

if echo "$RESULT" | grep -q "No circular dependency found"; then
    echo "✓ No cyclic dependencies detected"
    exit 0
else
    # Count the number of cycles (each cycle starts with a number followed by a dot)
    CYCLE_COUNT=$(echo "$RESULT" | grep -c "^[0-9]\+)" || echo "0")

    echo ""
    echo "$RESULT"
    echo ""

    if [[ "$STRICT" == "true" ]] || [[ "$CYCLE_COUNT" -ge "$THRESHOLD" ]]; then
        echo "✗ Found $CYCLE_COUNT cyclic dependencies (threshold: $THRESHOLD)"
        echo "Please resolve these circular imports before committing."
        exit 1
    else
        echo "⚠ Warning: Found $CYCLE_COUNT cyclic dependencies (threshold: $THRESHOLD)"
        echo "Consider resolving these circular imports soon."
        exit 0
    fi
fi
