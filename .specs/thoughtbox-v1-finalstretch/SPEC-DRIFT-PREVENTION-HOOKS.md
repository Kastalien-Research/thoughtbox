# SPEC-DRIFT-PREVENTION-HOOKS: Agent Drift Prevention Hook Stack

## Status: DRAFT

## Summary

A stack of Claude Code plugin hooks that mitigate the specific agent failure
class documented in this project's research session
`e74954cd-0984-488e-a830-54a77259bc45`: losing user-stated decisions across
turns, re-proposing rejected architecture, reverting to removed configuration,
asserting repo state without verification, and flipping positions under
pressure without grounded evidence.

The hooks ship inside `plugins/thoughtbox-claude-code/` and use Thoughtbox's
existing `decision_frame` thought type as durable storage. They operate via
Claude Code's documented hook surface (`UserPromptSubmit`, `Stop`) and do not
modify `.claude/settings.json`. None of the hooks alter agent capabilities;
they only add reminders, audits, and termination gates.

## Motivation

Frontier LLMs exhibit a measurable, documented failure class in long
conversational coding sessions:

- **Instruction fade-out** (OpenDev, arXiv 2603.05344): stated rules lose
  influence over turn distance.
- **Recursive self-deception** (Anthropic issue #26650): agent acknowledges
  a rule, proposes a compliant plan, executes a violation of that plan,
  and repeats the same pattern on the proposed fix.
- **Epistemic flattening** (Zenodo defensive-linguistics taxonomy): agent
  delivers speculation and verified fact in the same confident register.
- **Sycophancy flip under pressure** (arXiv 2505.23840 SYCON Bench):
  sustained user pushback induces position reversal regardless of evidence.
- **Multi-tier instruction conflict failure** (arXiv 2604.09443 ManyIH):
  frontier models score ~40% at resolving conflicts across many privilege
  tiers; a codebase with CLAUDE.md + AGENTS.md + `.claude/rules/` + session
  instructions + per-turn corrections is exactly such a multi-tier stack.

Anthropic's own Opus 4.7 launch announcement reports "similar low rates" of
sycophancy versus 4.6 — the model upgrade does not resolve this class.

The user's existing scaffolding (CLAUDE.md, AGENTS.md, rules, memory, skills,
HDD/Ulysses/Theseus protocols, hooks) already matches the architectural shape
the literature endorses. The gap is specifically: **no mechanism captures
stated decisions and forces them back into the model's context at later
turn boundaries, and no mechanism audits the model's assertions against
the verification history of the current turn.** This spec fills that gap.

## Requirements

### 1. Hook Surface

1. All hooks are declared in
   `plugins/thoughtbox-claude-code/hooks/hooks.json`, inside the existing
   plugin manifest. No additions to `.claude/settings.json`.
2. All hooks are implemented as subcommands of the `thoughtbox` CLI already
   shipped by the plugin, invoked via the plugin's `bin/` PATH. No new
   standalone scripts.
3. Hooks that post to Thoughtbox use the hosted Cloud Run endpoint configured
   via the plugin's existing `userConfig.thoughtbox_url` and
   `userConfig.thoughtbox_api_key`. No new credentials.
4. Hooks fail open. A Thoughtbox server outage must never block the user's
   turn; it may degrade the reminder quality for that turn.

### 2. `thoughtbox hook capture-user-turn` (UserPromptSubmit, async)

1. Reads the hook payload from stdin.
2. Extracts the user's submitted prompt text and the current Claude Code
   session id.
3. Ensures an active Thoughtbox reasoning session exists for this Claude
   Code session; creates one if not.
4. Writes the user prompt as a `context_snapshot` thought in the Thoughtbox
   session, tagged with `['user-turn', claudeSessionId]`.
5. Runs asynchronously (`curl ... &` style) so it does not add latency to
   the turn.
6. Must be idempotent across duplicate hook invocations for the same turn.

### 3. `thoughtbox hook surface-decisions` (UserPromptSubmit, sync)

1. Reads the hook payload from stdin.
2. Queries Thoughtbox for thoughts in the active session with thoughtType in
   {`decision_frame`, `assumption_update`} where assumption_update has
   `newStatus: "refuted"`. Orders by recency. Limit configurable via
   `userConfig.drift_reminder_limit` (default 10).
3. Emits a `<system-reminder type="session-decisions">` block via the hook's
   `additionalContext` output, containing the retrieved items as
   `Decision #K (turn M): [text]` entries.
4. Must complete within 500ms p95. Server must expose a cached
   `/cli/session-decisions` endpoint to meet this bound.
5. When zero matching items exist for the session, emits no block.

### 4. `thoughtbox hook promote-to-decision` (UserPromptSubmit, async)

1. Reads the hook payload from stdin.
2. Evaluates whether the user's prompt matches correction-language patterns
   (configurable, default set: leading `no`, `stop`, `don't`, `actually`,
   `we removed`, `that's wrong`, explicit imperative negation).
3. On match, issues a Thoughtbox revision that rewrites the user-turn
   thought recorded by `capture-user-turn` as an `assumption_update` thought
   with `newStatus: "refuted"` and the `text` field populated from the
   user's prompt. This is lighter than promoting to `decision_frame`
   (which requires structured `options`) while still flagging the turn as
   a durable correction that surface-decisions should re-inject.
4. Runs asynchronously. Failure to reclassify must not block the turn.
5. False positives on this hook are less harmful than false negatives
   because the surface-decisions hook only injects recency-ordered items;
   a noisy frame falls out of the top-N quickly.

### 5. `thoughtbox hook audit-response` (Stop, sync)

1. Reads the hook payload from stdin, including the response text and the
   tool-use history for the just-completed turn.
2. Scans the response for assertion patterns referencing repo state.
   Minimum patterns: `the [path] [is|contains|has]`, `[path] still [verb]`,
   `the current state of [path]`, `package.json [verb]`,
   `the file [path] [verb]`, and a configurable regex list extensible via
   `userConfig.audit_patterns`.
3. For each matched assertion, verifies that the turn's tool-use history
   contains at least one `Read`, `Grep`, `Glob`, or `Bash` call referencing
   a path or symbol consistent with the assertion.
4. If any assertion fails verification, the hook returns a blocking JSON
   response that refuses turn termination and returns to the model a
   message of the form: `Assertion about {target} was not verified in this
   turn. Either cite the file:line you read, or remove the claim.`
5. Must complete within 800ms p95. Pattern scanning is local; no network.

### 6. `thoughtbox hook detect-flip` (Stop, sync, optional LLM-as-judge)

1. Reads the hook payload from stdin plus the last N `decision_frame` thoughts
   AND the user's immediately prior prompt text.
2. **Trigger gate**: only runs the contradiction check when the prior user
   prompt contains authority/expertise/consensus pushback language
   (configurable regex list, default: `^(no|stop|don't|listen to me|I
   (already )?told you|we (already )?decided|you're wrong|how many times|you
   need to listen|that's wrong)`). This narrows the hook to the specific
   condition under which sycophancy-flip is most likely, per the AAAI
   instruction-hierarchy finding that authority/expertise/consensus framings
   override system/user role separation. Without the gate, the hook would
   fire on benign self-corrections.
3. On trigger, performs a cheap LLM-judge call (Haiku-class) asking whether
   the current response contradicts any of the provided decision frames.
4. On detected contradiction, checks whether the response contains a cited
   verification (file:line reference present in the turn's tool-use history).
5. If contradiction is detected AND no verification is cited, returns a
   blocking JSON response with the message: `Response reverses decision #K
   ("{quote}") under pressure. Verify the reversal with a tool call and cite
   it, or remove the contradicting claim.`
6. If Thoughtbox returns zero decision frames for the session, the hook is
   a no-op.
7. Gated off by `userConfig.detect_flip_enabled` (default true). Can be
   disabled when the LLM-judge latency is unacceptable.

### 7. CLI Subcommand Additions

1. Add a `hook` subcommand family to the plugin's `thoughtbox` CLI with
   the four handlers above (capture-user-turn, surface-decisions,
   promote-to-decision, audit-response, detect-flip).
2. These subcommands are distinct from the existing OTLP `hook` family
   written by the pre-existing `mergeThoughtboxInitConfig` path. The OTLP
   capture hooks remain in the plugin's shell scripts; these new hooks
   are the TypeScript-implemented drift-prevention family.
3. Each subcommand reads JSON from stdin, matching Claude Code's hook
   payload schema.
4. Each subcommand exits 0 on success. On blocking cases (hooks 5 and 6),
   they print a JSON object with `{"decision": "block", "reason": "..."}`
   on stdout consistent with Claude Code's hook protocol.

### 8. Server Endpoints

IMPLEMENTED as a mountable surface in `src/http/drift-http.ts`
(`createDriftHttpSurface`), mounted in both server modes. Paths live under
`/drift/*` rather than the originally drafted `/cli/*` — setup/diagnostic
`/cli` routes are a collapsed artifact boundary this repo is moving away
from, and this surface is a workspace-scoped data plane, not CLI plumbing.
Auth mirrors `POST /protocol/enforcement` (PR #412): hosted mode resolves
the workspace from the caller's `tbx_*` API key or OAuth JWT and rejects
unauthenticated requests with 401; the request can never choose another
tenant's scope. Local mode scopes everything to the static local-dev
workspace, like the hub surface.

1. `POST /drift/session-thought` — append a thought to the drift session
   bound to a Claude Code session. Accepts `{claudeSessionId, thoughtType,
   content, tags?, reviseLatestUserTurn?, assumptionChange?}` with
   `thoughtType` restricted to `context_snapshot`, `assumption_update`,
   `decision_frame`. The drift session is found (or created) by the
   `claude-session:<id>` session tag. Duplicate submissions of the same
   content within the recent window return the existing thought
   (`deduped: true`) — the idempotency required by §2.6.
2. `GET /drift/session-decisions?claudeSessionId=&limit=` — return recent
   `decision_frame` thoughts plus `assumption_update` thoughts with
   `newStatus: "refuted"` for the given Claude Code session, recency
   first. Limit defaults to 10, max 25. Cached at the server for ≤2s to
   meet the latency bound in requirement §3.4; writes through
   `/drift/session-thought` invalidate the cache.
3. The drafted `POST /cli/session-thought-revise` endpoint is subsumed by
   `reviseLatestUserTurn` on the append endpoint: `promote-to-decision`
   posts an `assumption_update` recorded with `isRevision: true /
   revisesThought: N` against the captured user-turn thought, which is the
   revision record the acceptance criteria require. No separate revise
   endpoint exists.
4. `POST /cli/judge-contradiction` — NOT IMPLEMENTED. Deferred with the
   optional `detect-flip` hook (§6).

### 9. Configuration

New `userConfig` entries in `plugins/thoughtbox-claude-code/.claude-plugin/plugin.json`:

- `drift_reminder_limit` — number, default 10, max 25. Controls the size of
  the injected session-decisions block.
- `audit_patterns` — string array, default empty. Additional regex
  patterns for `audit-response`.
- `detect_flip_enabled` — boolean, default true.
- `decision_patterns` — string array, default documented set. Correction-
  language regexes for `promote-to-decision`.

## Acceptance Criteria

- [ ] With the hook stack enabled, a session that reproduces today's
      interaction sequence (npm/hub/channel/server-distribution drifts) has
      the relevant decision_frames surfaced by thought M and the drift
      attempts at turn M+1 blocked or auto-retracted.
- [ ] Hook latency budgets (500ms p95 for surface-decisions, 800ms p95 for
      audit-response) are met under the hosted Cloud Run default latency.
- [ ] With Thoughtbox server unreachable, the hooks degrade silently and
      the user's turns still complete.
- [ ] Disabling the plugin disables the hooks entirely with no residual
      effect on `.claude/settings.json`.
- [ ] `thoughtbox doctor` reports the drift-prevention hooks as an optional
      informational item, not a required one.
- [ ] No hook reclassifies user prompts without an accompanying Thoughtbox
      revision record attributable to the promotion event.

## Non-Goals

- Replacing or altering the existing OTLP tool capture or session tracker
  hooks.
- Fine-tuning the model or any training-time intervention.
- Preventing all classes of agent failure; this spec addresses a specific
  slice (decision persistence and assertion verification) documented in
  the motivation.
- Blocking tool calls. All hooks operate at `UserPromptSubmit` and `Stop`
  boundaries; `PreToolUse` is untouched.
- Altering the channel MCP server or its instructions.

## Dependencies

- `plugins/thoughtbox-claude-code/` plugin infrastructure.
- Thoughtbox hosted server with the endpoints in §8.
- `decision_frame` thought type already present in Thoughtbox's `thought`
  module.
- Claude Code hook protocol for `UserPromptSubmit` and `Stop` events,
  including the `additionalContext` injection path and the blocking
  decision JSON schema.

## Decisions

- The plugin's `hooks.json` is the canonical hook surface. No writes to
  `.claude/settings.json` from `thoughtbox init`.
- Decisions are stored in Thoughtbox, not in a local file. This aligns
  with the Supabase-only persistence decision.
- `capture-user-turn` writes all user prompts as `context_snapshot` first;
  `promote-to-decision` narrows by pattern. Separation of capture from
  classification.
- `audit-response` refuses termination rather than silently logging. The
  intent is to force correction at the turn boundary, not after-the-fact
  discovery.
- `detect-flip` is opt-outable because its LLM-judge cost may be
  unacceptable for some workloads; `audit-response` is not opt-outable.

## References

- Source research session: Thoughtbox session
  `e74954cd-0984-488e-a830-54a77259bc45`.
- OpenDev event-driven reminders: arXiv 2603.05344.
- AAAI failure-of-instruction-hierarchies paper:
  `ojs.aaai.org/index.php/AAAI/article/view/40339`.
- ManyIH benchmark: arXiv 2604.09443.
- SYCON Bench: arXiv 2505.23840.
- Anthropic claude-code issue #46646 (self-written failure analysis).
- Anthropic claude-code issue #26650 (recursive self-deception loop).
