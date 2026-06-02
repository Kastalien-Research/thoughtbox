#!/usr/bin/env bash
# PreToolUse (Bash): block `git branch -D/-d/--delete` when it would orphan
# commits that exist on no other branch/tag/remote.
#
# Why: a throwaway branch can quietly accumulate work — e.g. a broad
# `git add -A` sweeps an unrelated uncommitted change into a test commit —
# and `git branch -D` then discards it. This guard lists the commits and the
# files they touch at the moment of deletion so swept-in work is obvious.
# Orphaned commits stay in the reflog ~90 days, so this is recoverable, but
# the point is to NOTICE before deleting.
#
# Override for genuine throwaways: add an `orphan-ok` marker to the command,
#   git branch -D scratch  # orphan-ok
set -uo pipefail

input_json=$(cat)
tool_name=$(echo "$input_json" | jq -r '.tool_name // ""')
[[ "$tool_name" != "Bash" ]] && exit 0

cmd=$(echo "$input_json" | jq -r '.tool_input.command // ""')

# Only act on a git branch deletion. (Portable patterns — no \b: BSD grep/sed
# on macOS, where this hook runs, do not support \b word boundaries.)
echo "$cmd" | grep -qE 'git[[:space:]]+branch[[:space:]]+.*(-D|-d|--delete)' || exit 0
# Explicit, conscious override.
echo "$cmd" | grep -q 'orphan-ok' && exit 0

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$project_dir" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

# Best-effort branch-name extraction: tokens after `branch` that are not flags.
branches=$(echo "$cmd" \
  | sed -E 's/.*branch//' \
  | tr -s '[:space:]' '\n' \
  | grep -vE '^(-|#)' \
  | grep -vE '^(orphan-ok|--delete|--force)$' \
  | grep -vE '^$' || true)

orphans_for() {
  # commits reachable from $1 but from no OTHER branch/tag/remote.
  # Feed refs via --stdin (^ = exclude) rather than --exclude/--branches,
  # which proved unreliable; this is also bash-3.2 / macOS safe.
  {
    echo "$1"
    git for-each-ref --format='^%(refname)' refs/heads refs/tags refs/remotes \
      | grep -v "^\\^refs/heads/$1\$"
  } | git rev-list --stdin 2>/dev/null
}

risky=""
for br in $branches; do
  git show-ref --verify --quiet "refs/heads/$br" || continue
  [[ -n "$(orphans_for "$br")" ]] && risky="$risky $br"
done

[[ -z "${risky// /}" ]] && exit 0

{
  echo "BLOCKED: this deletion would orphan commits that exist on no other branch/tag/remote."
  for br in $risky; do
    echo ""
    echo "  Branch '$br' — commits that would become unreachable:"
    orphans_for "$br" | head -20 | while read -r sha; do
      echo "    $(git log -1 --format='%h %s' "$sha" 2>/dev/null)"
    done
    base=$(git merge-base "$br" HEAD 2>/dev/null || true)
    if [[ -n "$base" ]]; then
      echo "  Files those commits touch (verify nothing important is here):"
      git diff --name-only "$base" "$br" 2>/dev/null | sed 's/^/    /' | head -30
    fi
  done
  echo ""
  echo "If this work is truly disposable, re-run with an orphan-ok marker:"
  echo "  git branch -D${risky} # orphan-ok"
} >&2
exit 2
