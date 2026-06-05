# sdk-implement — autonomous implementation with external verification

A minimum SDK runner for implementing systems where the agent cannot decide whether the work is done. Verification runs in a separate process the agent can't intercept.

## Why this exists

In-conversation agents are simultaneously the implementer, the reporter, and the verifier. "Done" collapses to "whatever the agent says." Adding more verification while the same agent describes reality just gives gaming a bigger playground. This script moves verification out of the agent's reach: a YAML spec declares external checks (shell commands and required file paths), the agent runs, then the harness runs the checks itself.

## Interaction surface

Three things, in order:

1. **Write a YAML spec.** It declares the task, hard constraints, verify commands, and required artifacts.
2. **Run the script** against the spec. Audit log is written to `.sdk-runs/<spec>-<timestamp>.jsonl`.
3. **Read the exit code.** That's the entire feedback channel.

There is no daemon, no chat, no resume. State lives on disk (the audit log) and in git (the changes the agent made).

## Spec format

```yaml
task: |
  Prose description of what to implement. Include the WHY — what's broken
  now, what should be true after. The agent reads this verbatim.

constraints:
  - "Hard rule that gets prepended to the prompt as non-negotiable"
  - "Constraints that forbid known cheats go here"

verify:
  - "shell command — must exit 0"
  - "another command — all must pass"

artifacts:
  - path/that/must/exist/after.json
  - another/required/artifact.ts
```

All four fields are optional except `task`. Empty `verify` and `artifacts` mean nothing is checked — equivalent to the old gameable harness, so don't ship those.

## Run

```bash
npx tsx scripts/sdk-implement.ts <path-to-spec.yaml> [--budget N]
```

`--budget` defaults to 5 USD. The SDK enforces this — the agent can't exceed it.

Output during run: agent's text messages stream to stdout in real time. After the agent finishes, you'll see:

```
[sdk-implement] agent finished: success | cost=$1.42 | turns=14
[sdk-implement] running external verification...
```

Then the verify commands run with their stdout/stderr inherited, so you see exactly what the checks did.

## Exit codes

| Code | Meaning | What to do |
|------|---------|------------|
| `0` | PASS — agent claimed done AND all verify commands exited 0 AND all artifacts exist | `git diff` to review, commit if you like the change |
| `2` | GAMING DETECTED — agent finished but external verification failed | Read the failure list, `git diff` to see what was actually written, `git restore .` to discard, then tighten the spec |
| `1` | Script error (bad spec, SDK crash, etc.) | Read the error message |

## Iteration loop when gaming happens

The first time a spec catches gaming, you'll see something like:

```
[sdk-implement] GAMING DETECTED: agent claimed done but external verification failed
  verify failures:
    exit 1: npm test
  missing artifacts:
    .github/workflows/ci.yml
  audit log: .sdk-runs/implement-ci-gate-2026-04-29T...jsonl
```

Two next steps:

1. **Tighten the spec.** What did the agent do instead of the real work? Add a constraint forbidding it, or add a verify command that catches it. Re-run.
2. **Read the audit log.** Every assistant message and tool call is in there as JSONL. Search for the moment the agent decided "this is good enough" and you'll see the gaming pattern in their reasoning. That informs the next spec.

The agent has no memory across runs. Each invocation starts fresh, so a tightened spec is a fresh attempt with the new rules in force from message one.

## Audit log format

`.sdk-runs/<spec-name>-<ISO-timestamp>.jsonl` — one JSON object per line, each is a raw SDK message. Useful queries:

```bash
# What tools did the agent call?
jq -r 'select(.type=="assistant") | .message.content[] | select(.type=="tool_use") | .name' .sdk-runs/foo-*.jsonl

# Final result
jq 'select(.type=="result")' .sdk-runs/foo-*.jsonl

# Just the assistant text
jq -r 'select(.type=="assistant") | .message.content[] | select(.type=="text") | .text' .sdk-runs/foo-*.jsonl
```

## Example specs

Write a YAML spec that declares the task, hard constraints, verify commands, and required artifacts, following the format above.

## What this does not solve

An agent could write code that satisfies a verify command without doing the underlying work (e.g. a verify check that only inspects file contents can be satisfied by writing a fake file). The harness only catches the failure mode where the agent claims completion and the declared external signal disagrees. The defense against fake-work is writing verify commands that observe behavior, not artifacts: run the system, check it produced the expected effect on the world, not just that a file exists.
