#!/usr/bin/env bash
set -euo pipefail

# Checks that all Supabase .from() queries on tenant-scoped tables include
# workspace_id filtering. Prevents cross-workspace data leaks.
#
# Tenant tables: entities, relations, observations, sessions, thoughts
# Exempt: .insert() calls (workspace_id is in the row object, not a filter)
#
# Usage: scripts/check-workspace-isolation.sh
# Exit 0 = clean, Exit 1 = violations found

TENANT_TABLES="entities|relations|observations|sessions|thoughts"
SCAN_DIRS="src/persistence src/knowledge"
VIOLATIONS=0

for dir in $SCAN_DIRS; do
  if [ ! -d "$dir" ]; then
    continue
  fi

  # Find all .from('<tenant-table>') calls with line numbers
  while IFS=: read -r file line_num line_content; do
    # Skip insert() calls — workspace_id is in the row object
    if echo "$line_content" | grep -q '\.insert('; then
      continue
    fi

    # Read forward from the .from() line to find the end of the chain
    # (look for the next await, const, let, if, return, or closing brace)
    chain=$(sed -n "${line_num},+15p" "$file" | head -16)

    # Check if workspace_id appears in the chain
    if ! echo "$chain" | grep -q "workspace_id"; then
      echo "VIOLATION: $file:$line_num — .from() on tenant table without workspace_id filter"
      echo "  $line_content"
      echo ""
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  done < <(grep -rn "\.from(['\"]\\(${TENANT_TABLES}\\)['\"])" "$dir" --include="*.ts" || true)
done

if [ "$VIOLATIONS" -gt 0 ]; then
  echo "Found $VIOLATIONS workspace isolation violation(s)."
  echo "Every .from() query on tenant tables must include .eq('workspace_id', ...) or embed workspace_id in the insert row."
  exit 1
fi

echo "✓ All tenant-scoped queries include workspace_id filtering."
exit 0
