#!/usr/bin/env bash
set -euo pipefail

# Fails if forbidden local artifacts are present in a git diff.
#
# Usage:
#   scripts/check-artifacts.sh --staged
#   scripts/check-artifacts.sh --diff <git-range>
#
# Bypass (local only):
#   ALLOW_ARTIFACTS_COMMIT=1 scripts/check-artifacts.sh --staged

if [[ "${ALLOW_ARTIFACTS_COMMIT:-}" == "1" ]]; then
  exit 0
fi

mode="${1:-}"
range="${2:-}"

if [[ "$mode" != "--staged" && "$mode" != "--diff" ]]; then
  echo "Usage: $0 --staged | --diff <git-range>" >&2
  exit 2
fi

if [[ "$mode" == "--diff" && -z "$range" ]]; then
  echo "Usage: $0 --diff <git-range>" >&2
  exit 2
fi

if [[ "$mode" == "--staged" ]]; then
  changed_files="$(git diff --cached --name-only)"
else
  changed_files="$(git diff --name-only "$range")"
fi

if [[ -z "$changed_files" ]]; then
  exit 0
fi

# Forbidden patterns: keep these local-only.
# (Note: .gitignore does not protect already-tracked files, so we enforce here too.)
forbidden_re='^(traces/|plans/|SESSION-.*\.md$|STATUS-REPORT-.*\.md$|EXPLORATION_REPORT_.*\.md$|MENTAL-MODELS-.*\.md$|uncommitted-changes-.*\.patch$|CHANGELOG-SYSTEM-IMPLEMENTATION\.md$)'

hits="$(printf "%s\n" "$changed_files" | sed '/^$/d' | grep -E "$forbidden_re" || true)"

if [[ -z "$hits" ]]; then
  exit 0
fi

cat >&2 <<'EOF'
ERROR: Attempting to commit local-only artifacts.

These files are intended to remain on disk but MUST NOT be tracked in Git.
If you want to keep them locally:
- Ensure they are ignored in .gitignore
- Untrack them with: git rm -r --cached <path>  (does not delete local files)

To bypass this check locally (not recommended), set:
  ALLOW_ARTIFACTS_COMMIT=1

Blocked paths:
EOF
printf "%s\n" "$hits" >&2
exit 1

