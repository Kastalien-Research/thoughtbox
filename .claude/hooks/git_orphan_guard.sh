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
# Resolve the subcommand structurally by token position rather than by the
# adjacency of "git branch": this tolerates global options in between
# (`git -C <path> branch ...`, `git -c k=v ...`, `git --no-pager ...`) and
# distinguishes a real deletion from "branch" merely appearing in a message
# (`git commit -m '... branch ...'`). git refs cannot contain whitespace, so
# splitting each segment on whitespace is a safe tokenization.
detected_delete=0
candidates=""
while IFS= read -r seg; do
  read -ra toks <<< "$seg"
  n=${#toks[@]}

  # Locate the git invocation: a bare `git` token or a path ending in /git.
  i=0
  while [[ $i -lt $n ]]; do
    case "${toks[$i]}" in git | */git) break ;; esac
    i=$((i + 1))
  done
  [[ $i -lt $n ]] || continue
  i=$((i + 1)) # step past git

  # Skip git global options so the real subcommand is reached. The options
  # listed take a separate argument (e.g. `-C <path>`); any other dashed
  # token is a self-contained global flag.
  while [[ $i -lt $n ]]; do
    case "${toks[$i]}" in
      -C | -c | --git-dir | --work-tree | --namespace | --super-prefix) i=$((i + 2)) ;;
      -*) i=$((i + 1)) ;;
      *) break ;;
    esac
  done

  # The first non-option token is the subcommand.
  [[ "${toks[$i]:-}" == "branch" ]] || continue
  i=$((i + 1))

  # A deletion flag among the remaining tokens, including bundled short forms
  # like -Df / -df / -fd where -d/-D is not whitespace-delimited.
  rest=" ${toks[*]:$i} "
  echo "$rest" | grep -qE '(^|[[:space:]])(--delete|-[A-Za-z]*[dD][A-Za-z]*)([[:space:]]|$)' || continue
  detected_delete=1

  # Branch names are the remaining non-option tokens.
  for ((j = i; j < n; j++)); do
    case "${toks[$j]}" in
      -*) ;;
      *) candidates="$candidates ${toks[$j]}" ;;
    esac
  done
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

# Fail closed: a target that is not a literal name. We see the command before
# the shell expands it, so a token like $br, "$br", ${br} or $(cat name)
# reaches here verbatim. Verifying it as a literal ref finds nothing and would
# wave the deletion through, yet the real command still expands to and deletes
# a live branch. We cannot resolve it (that would mean executing arbitrary
# substitutions), so we refuse. Real branch names use only [A-Za-z0-9._/+-];
# any other character means the token carries expansion syntax we can't verify.
for br in $candidates; do
  case "$br" in
    *[!A-Za-z0-9._/+-]*)
      {
        echo "BLOCKED: branch-deletion target '$br' is not a literal name."
        echo "It expands at runtime (variable, command substitution, or glob),"
        echo "so this guard cannot check whether the real branch would orphan"
        echo "commits. Re-run with the literal branch name, or add an orphan-ok"
        echo "marker if the deletion is intentional and reviewed."
      } >&2
      exit 2
      ;;
  esac
done

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
