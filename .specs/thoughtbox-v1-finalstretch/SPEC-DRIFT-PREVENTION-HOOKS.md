# SPEC-DRIFT-PREVENTION-HOOKS: Agent Drift Prevention Hook Stack

## Status: IMPLEMENTED (v1) — detect-flip (§6) deferred

Shipped: server surface (`src/http/drift-http.ts`, mounted in
`src/index.ts`), CLI hook family
(`plugins/thoughtbox-claude-code/src/cli/hooks.ts`), and hooks.json wiring
(UserPromptSubmit ×3, Stop ×1). Verified headlessly against a live local
server; see Acceptance Criteria for per-item evidence and what still
requires a human-attended Claude Code session.

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
3. Hooks that post to Thoughtbox resolve the endpoint and API key the same
   way `protocol_gate.sh` and the channel do: `THOUGHTBOX_URL` /
   `THOUGHTBOX_API_KEY` env overrides first, then the config `thoughtbox
   init` wrote to `.claude/settings.local.json` (OTLP endpoint/headers or
   the MCP server URL). No new credentials. (The originally drafted
   `userConfig.*` mechanism does not exist in Claude Code plugin
   manifests; env + init-written settings are the real surface.)
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
5. Runs asynchronously: the foreground invocation reads the payload,
   re-invokes itself detached (`--sync --payload-file <tmp>`) for the
   network delivery, and exits immediately. `THOUGHTBOX_HOOK_SYNC=1`
   forces inline delivery for tests and harnesses.
6. Must be idempotent across duplicate hook invocations for the same turn
   (served by the server-side dedupe in §8.1).

### 3. `thoughtbox hook surface-decisions` (UserPromptSubmit, sync)

1. Reads the hook payload from stdin.
2. Queries Thoughtbox for thoughts in the active session with thoughtType in
   {`decision_frame`, `assumption_update`} where assumption_update has
   `newStatus: "refuted"`. Orders by recency. Limit configurable via
   `THOUGHTBOX_DRIFT_REMINDER_LIMIT` (default 10, max 25).
3. Emits a `<system-reminder type="session-decisions">` block via the hook's
   `additionalContext` output, containing the retrieved items as
   `Decision #K (thought M): [text]` entries (`Correction #K` for refuted
   assumption_updates), each truncated to 600 chars.
4. Must complete within 500ms p95 on warm paths. Served by the cached
   `/drift/session-decisions` endpoint (§8.2); the hook additionally
   enforces a hard client-side timeout (`THOUGHTBOX_HOOK_TIMEOUT_MS`,
   default 2000ms) and degrades silently past it.
5. When zero matching items exist for the session, emits no block.

### 4. `thoughtbox hook promote-to-decision` (UserPromptSubmit, async)

1. Reads the hook payload from stdin.
2. Evaluates whether the user's prompt matches correction-language patterns
   (configurable via `THOUGHTBOX_DECISION_PATTERNS`, a JSON array of regex
   strings; default set: leading `no`, `stop`, `don't`, `actually`,
   `we removed`, `that's wrong`, explicit imperative negation). The check
   is local and runs BEFORE any detach or network work, so non-correction
   turns cost nothing.
3. On match, posts an `assumption_update` thought with
   `newStatus: "refuted"` and `reviseLatestUserTurn: true`; the server
   records it as a revision (`isRevision`/`revisesThought`) of the
   user-turn thought captured by `capture-user-turn` (§8.3). This is
   lighter than promoting to `decision_frame` (which requires structured
   `options`) while still flagging the turn as a durable correction that
   surface-decisions re-injects.
4. Runs asynchronously (same detached re-invocation as §2.5). Failure to
   reclassify must not block the turn.
5. False positives on this hook are less harmful than false negatives
   because the surface-decisions hook only injects recency-ordered items;
   a noisy frame falls out of the top-N quickly.

### 5. `thoughtbox hook audit-response` (Stop, sync)

1. Reads the hook payload from stdin. The Stop payload carries
   `transcript_path`, not the response text itself; the hook parses the
   just-completed turn (last assistant text + tool_use blocks after the
   last real user prompt) out of the transcript JSONL.
2. Scans the response for assertion patterns referencing repo state.
   Minimum patterns: `the [path] [is|contains|has]`, `[path] still [verb]`,
   `the current state of [path]`, `package.json [verb]`,
   `the file [path] [verb]`, and a configurable regex list extensible via
   `THOUGHTBOX_AUDIT_PATTERNS` (JSON array; capture group 1 = target).
3. For each matched assertion, verifies that the turn's tool-use history
   contains at least one `Read`, `Grep`, `Glob`, or `Bash` call referencing
   a path or symbol consistent with the assertion (basename containment;
   MCP-namespaced tool names are normalized to their tail).
4. If any assertion fails verification, the hook returns a blocking JSON
   response that refuses turn termination and returns to the model a
   message of the form: `Assertion about {target} was not verified in this
   turn. Either cite the file:line you read, or remove the claim.`
   When the payload arrives with `stop_hook_active: true` the hook is a
   no-op, so a turn is never blocked twice.
5. Must complete within 800ms p95. Pattern scanning is local; no network.

### 6. `thoughtbox hook detect-flip` (Stop, sync, optional LLM-as-judge)

DEFERRED — NOT IMPLEMENTED in v1. The LLM-judge dependency (latency, cost,
and a second credential path) is out of scope for the first ship; the
decision-persistence + re-injection + local audit half stands alone. The
requirements below are preserved for the follow-up.

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

IMPLEMENTED in `plugins/thoughtbox-claude-code/src/cli/hooks.ts` (+
`hook-common.ts`), dispatched from the existing CLI entry (`thoughtbox
hook <name>`).

1. Add a `hook` subcommand family to the plugin's `thoughtbox` CLI with
   the four handlers above: capture-user-turn, surface-decisions,
   promote-to-decision, audit-response (detect-flip deferred, §6).
2. These subcommands are distinct from the existing OTLP `hook` family
   written by the pre-existing `mergeThoughtboxInitConfig` path. The OTLP
   capture hooks remain in the plugin's shell scripts; these new hooks
   are the TypeScript-implemented drift-prevention family.
3. Each subcommand reads JSON from stdin, matching Claude Code's hook
   payload schema (detached re-invocations read `--payload-file` instead).
4. Each subcommand exits 0 on success AND on every failure path (fail
   open — even an unknown hook name exits 0 so plugin/CLI version skew
   cannot block a turn). On blocking cases (hook 5), it prints a JSON
   object with `{"decision": "block", "reason": "..."}` on stdout
   consistent with Claude Code's Stop-hook protocol. Only
   surface-decisions and audit-response ever write to stdout: for
   UserPromptSubmit hooks stdout becomes model context, so the async
   hooks stay silent.

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

Claude Code plugin manifests have no `userConfig` mechanism (the draft
assumed one). Configuration is environment variables, which reach hook
processes via the session environment (including the `env` block
`thoughtbox init` writes to `.claude/settings.local.json`):

- `THOUGHTBOX_DRIFT_REMINDER_LIMIT` — number, default 10, max 25. Controls
  the size of the injected session-decisions block.
- `THOUGHTBOX_AUDIT_PATTERNS` — JSON array of regex strings, default
  empty. Additional assertion patterns for `audit-response` (capture
  group 1 = asserted target).
- `THOUGHTBOX_DECISION_PATTERNS` — JSON array of regex strings, default
  documented set. Correction-language regexes for `promote-to-decision`.
- `THOUGHTBOX_HOOK_TIMEOUT_MS` — number, default 2000. Hard client-side
  network budget per hook call.
- `THOUGHTBOX_HOOK_SYNC` — set to `1` to force inline delivery for the
  async hooks (tests/harnesses).
- `detect_flip_enabled` — deferred with detect-flip (§6).

## Acceptance Criteria

- [x] HEADLESS EQUIVALENT VERIFIED (2026-07-09, live local server, real
      CLI binary driven with simulated hook payloads): a correction turn
      ("no, we removed the redis dependency — stop adding it back") was
      captured detached by capture-user-turn, promoted by
      promote-to-decision to a refuted `assumption_update` revision
      (`revisesThought` pointing at the captured turn), and re-injected on
      the next turn by surface-decisions as a
      `<system-reminder type="session-decisions">` block via
      `additionalContext`. An unverified repo-state assertion in a fixture
      transcript was blocked by audit-response with the exact §5.4
      message; the same assertion backed by Read/Bash tool_use passed.
      REMAINING HUMAN-ATTENDED CHECK: the same loop inside a real Claude
      Code session (hooks fired by the runtime rather than piped payloads,
      reminder visibly present in model context, Stop-block re-prompting
      the model) — reproducing the original npm/hub/channel drift sequence
      end to end.
- [~] Latency: local measurements — surface-decisions full CLI round trip
      62ms; warm `/drift/session-decisions` GET <1ms (2s server cache);
      audit-response is local-only file parsing. The 500ms p95 bound
      UNDER HOSTED Cloud Run latency is not yet measured — needs a run
      against the deployed endpoint (no hosted mutations were permitted
      during this implementation pass).
- [x] Unreachable server (dead port, sync mode): capture-user-turn,
      surface-decisions, and promote-to-decision all exit 0 with no
      stdout; the async pair additionally detach so the foreground cost
      is ~0.3s regardless. Verified live.
- [x] All hooks live in the plugin's `hooks/hooks.json`; nothing was
      added to `.claude/settings.json`, so disabling the plugin removes
      the hooks with no residual effect. (Structural: the hooks exist
      nowhere else.)
- [ ] `thoughtbox doctor` reporting: the shipped CLI has no `doctor`
      subcommand yet (the old doctor lives behind the collapsed
      `src/http/cli-routes.ts` boundary slated for separation). Deferred
      until doctor lands plugin-side.
- [x] Reclassification always carries a revision record: the server
      records promotions as `isRevision`/`revisesThought` against the
      captured user-turn thought (verified live: `revisesThought: 1` in
      the promote response), and the only fallback (capture not yet
      landed) creates a NEW assumption_update without touching any prior
      thought.

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
