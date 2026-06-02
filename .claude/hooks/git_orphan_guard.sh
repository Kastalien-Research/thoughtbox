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
# Fails CLOSED: if a deletion is detected but the target branch cannot be
# parsed (e.g. an unusual command shape), it blocks rather than waving it
# through, so the guard cannot be silently defeated.
#
# Override for genuine throwaways: add an `orphan-ok` marker to the command,
#   git branch -D scratch  # orphan-ok
set -uo pipefail

input_json=$(cat)
tool_name=$(echo "$input_json" | jq -r '.tool_name // ""')
[[ "$tool_name" != "Bash" ]] && exit 0

cmd=$(echo "$input_json" | jq -r '.tool_input.command // ""')

# Explicit, conscious override (checked against the whole command).
echo "$cmd" | grep -q 'orphan-ok' && exit 0

# Split the command into sub-commands on shell control operators, so a
# deletion chained before another `git branch` (or any later "branch" word)
# is still handled. Pure-bash replacement avoids the BSD-sed newline trap.
work="${cmd%%#*}"            # drop a trailing # comment
work="${work//&&/$'\n'}"
work="${work//||/$'\n'}"
work="${work//;/$'\n'}"
work="${work//|/$'\n'}"

# Per-segment: is it a `git branch` deletion, and what branches does it name?
# awk prints tokens after the first standalone `branch` word, so branch names
# that themselves contain "branch" (e.g. feature-branch) are handled.
detected_delete=0
candidates=""
while IFS= read -r seg; do
  echo "$seg" | grep -qE 'git[[:space:]]+branch([[:space:]]|$)' || continue
  echo "$seg" | grep -qE '(-D|-d|--delete)([[:space:]]|$)' || continue
  detected_delete=1
  names=$(echo "$seg" \
    | tr -s '[:space:]' '\n' \
    | awk 'found {print} $0 == "branch" {found=1}' \
    | grep -vE '^-' \
    | grep -vE '^(--delete|--force)$' \
    | grep -vE '^$' || true)
  candidates="$candidates $names"
done <<< "$work"

# Not a branch deletion at all — nothing to guard.
[[ "$detected_delete" -eq 0 ]] && exit 0

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$project_dir" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

# Fail closed: a deletion was detected but no branch name could be parsed.
if [[ -z "${candidates// /}" ]]; then
  {
    echo "BLOCKED: detected a 'git branch' deletion but could not parse the target branch."
    echo "Run the deletion as a standalone command (not chained), or add an"
    echo "orphan-ok marker if the deletion is intentional and reviewed."
  } >&2
  exit 2
fi

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
for br in $candidates; do
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
