# 03 — CLI Dispatch and Scope Consent

> Part of [Project-as-API Spec](./00-index.md)

## CLI Dispatch Table

### Purpose

The CLI gateway gives the agent controlled access to project infrastructure without
arbitrary shell access. The dispatch table is the mechanism: only declared CLIs are
reachable, arguments are passed as arrays (never interpolated into a shell string), and
the working directory is controlled by config.

For this project, the initial set is: `git`, `gcloud`, `supabase`, `gh`. This covers:
- **git**: commits, branches, status, diffs, log
- **gcloud**: Cloud Run deploy, secret management, project config
- **supabase**: migrations, type generation, DB push/pull
- **gh**: PR creation, issue management, workflow runs

### Project Config Format

`thoughtbox.project.json` at the repo root:

```json
{
  "$schema": "https://thoughtbox.dev/schemas/project-config/v1.json",
  "cli": {
    "allowed": ["git", "gcloud", "supabase", "gh"],
    "workingDir": ".",
    "env": {}
  },
  "scope": {
    "blacklist": [
      ".adr/",
      ".specs/",
      ".claude/",
      ".gemini/",
      "AGENTS.md",
      "CLAUDE.md",
      "CONTRIBUTING.md",
      "GOVERNANCE.md",
      "SECURITY.md"
    ]
  }
}
```

**Alternatively**, the config may live under a `"thoughtbox"` key inside `.mcp.json` to
avoid a second config file at the repo root. The server checks `.mcp.json` first, then
falls back to `thoughtbox.project.json`. If neither exists, Project Mode starts with an
empty CLI allowlist and a minimal default blacklist.

### Dispatch Logic

When `tp.cli.exec(cli, args)` is called:

1. **Allowlist check**: `cli` must be in `config.cli.allowed`. If not:
   ```
   CLI_NOT_ALLOWED  "git" is not in the project CLI allowlist. Allowed: [...]
   ```

2. **Metacharacter check**: each element of `args` is scanned for shell metacharacters
   (`; | & $ > < ` \` ( ) { } ! *` outside of quoted contexts). If any are found:
   ```
   UNSAFE_ARG  Argument contains shell metacharacter. Args must be plain strings.
   ```
   Note: This is defense-in-depth. Because args are passed as an array to `child_process.spawn`
   (not `exec`), shell interpolation cannot occur regardless. The check provides an early
   error with a clear message.

3. **Execution**: `child_process.spawn(cli, args, { cwd: workingDir, env: mergedEnv })`
   where `mergedEnv = { ...process.env, ...config.cli.env }`.

4. **Result collection**: stdout and stderr are collected as strings. The call resolves
   with a `CliResult` when the process exits. A 60-second timeout kills the process and
   returns a `TIMEOUT` error.

5. **Trace**: the invocation is logged as a `project_cli_exec` event on the active session
   trace, including cli name, args array, exit code, and duration.

### Why `spawn` Not `exec`

`child_process.spawn` takes the command and args as separate parameters. The shell is never
invoked. This means `tp.cli.exec("git", ["commit", "-m", "feat: add new route"])` is
equivalent to typing `git commit -m 'feat: add new route'` in a terminal — the message
is a literal string argument, not a shell-parsed expression.

`child_process.exec` (which takes a shell command string) is explicitly not used here.

### Extensibility

Adding a new CLI to the dispatch table requires:
1. Adding its name to `config.cli.allowed` in `thoughtbox.project.json`.
2. Restarting the MCP server (config is loaded at startup).

No code changes are needed. The dispatch table is fully data-driven. This means Linear's
CLI (if available), `terraform`, `docker`, or any other infrastructure CLI can be added
by config alone.

---

## Scope Model

### Blacklist-Based (Default Open)

All project paths are writable by default. The blacklist declares paths the agent must
not modify without explicit human consent. This is intentional: the default answer is
"yes, write here" and the governance artifacts are explicitly protected, rather than
the agent needing permission for every write.

**Default blacklist** (covers governance artifacts in this repo):
```
.adr/
.specs/
.claude/
.gemini/
AGENTS.md
CLAUDE.md
CONTRIBUTING.md
GOVERNANCE.md
SECURITY.md
```

**Blacklist matching rule**: a path is blacklisted if it equals a blacklist entry exactly,
or if it starts with the entry (treating entries ending in `/` as directory prefixes).

```
isBlacklisted("AGENTS.md", blacklist)     → true  (exact match)
isBlacklisted(".adr/staging/foo.md", blacklist) → true  (prefix match)
isBlacklisted("src/hub/handler.ts", blacklist)  → false
```

### Scope Change — Elicitation Flow

When the agent calls `tp.project.requestScopeChange({ action, path, reason })`:

1. The server sends an MCP `elicitation/create` request to the client:

```json
{
  "method": "elicitation/create",
  "params": {
    "message": "An agent is requesting a scope change that requires your approval.",
    "requestedSchema": {
      "type": "object",
      "title": "Scope Change Request",
      "description": "Agent wants to remove \".specs/\" from the blacklist.\nReason: Need to update the spec for this feature as part of the implementation.",
      "properties": {
        "approved": {
          "type": "boolean",
          "title": "Approve this scope change?",
          "description": "Removing this path from the blacklist will allow the agent to edit files within it."
        },
        "note": {
          "type": "string",
          "title": "Optional note for the agent"
        }
      },
      "required": ["approved"]
    }
  }
}
```

2. The server awaits the elicitation response. The `tp.project.requestScopeChange()` call
   blocks (within the vm sandbox's async context) until the response arrives.

3. On approval (`approved: true`):
   - The in-memory blacklist is updated immediately.
   - `thoughtbox.project.json` is updated on disk to persist the change.
   - A `project_scope_change_result` trace event is logged (approved, path, reason, note).
   - The function returns `{ approved: true, note: "..." }`.

4. On rejection (`approved: false`):
   - The blacklist is unchanged.
   - A `project_scope_change_result` trace event is logged (rejected, path, reason, note).
   - The function returns `{ approved: false, note: "..." }`.

5. **If the client does not support elicitation** (responds with `MethodNotFound` or
   `InvalidRequest`):
   - The function returns `{ approved: false, note: "Scope changes require a client that supports MCP elicitation (form mode). This client does not. Request the scope change manually by editing thoughtbox.project.json." }`
   - No trace event is logged for the failed request (avoids log pollution on every use
     with a non-elicitation client).

### Scope in the Search Surface

`thoughtbox_project_search` exposes the current scope as `catalog.scope.blacklist`. This
means the agent can discover what it cannot touch before attempting writes:

```js
// "What's off-limits?"
async () => catalog.scope.blacklist
```

This is intentional: the agent should be able to reason about scope before it encounters
a `BLACKLISTED` error on a write attempt.

---

## Project Config Schema

The full `thoughtbox.project.json` JSON Schema (for editor validation):

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Thoughtbox Project Config",
  "type": "object",
  "properties": {
    "cli": {
      "type": "object",
      "properties": {
        "allowed": {
          "type": "array",
          "items": { "type": "string" },
          "description": "CLIs available to tp.cli.exec()"
        },
        "workingDir": {
          "type": "string",
          "description": "Working directory for CLI invocations. Relative to repo root.",
          "default": "."
        },
        "env": {
          "type": "object",
          "additionalProperties": { "type": "string" },
          "description": "Additional environment variables merged into CLI process env."
        }
      },
      "required": ["allowed"]
    },
    "scope": {
      "type": "object",
      "properties": {
        "blacklist": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Paths the agent cannot write to without user consent."
        }
      },
      "required": ["blacklist"]
    }
  },
  "required": ["cli", "scope"]
}
```

---

## Security Properties

### What is defended against

| Threat | Defense |
|---|---|
| Arbitrary shell execution | `spawn` with args array; no shell metacharacters; allowlist only |
| Prototype pollution via vm | Same `vm.createContext` isolation as `thoughtbox_execute` |
| Codebase-wide destructive write | Blacklist; scope-change requires human elicitation |
| Governance artifact modification | Default blacklist covers `.adr/`, `.specs/`, `.claude/`, etc. |
| CLI invocation without reasoning record | Session attribution requirement |
| Scope escalation without human awareness | Elicitation blocks and logs every scope change attempt |

### What is NOT defended against (known limits)

- **node:vm is not a security boundary** (per Node.js docs). The sandbox is defense-in-depth
  against accidental scope creep, not a security isolation layer. For true isolation, a
  future migration to `isolated-vm` would be required.
- **CLI arg injection via agent-controlled strings**: args are array-passed so no shell
  injection is possible, but an agent could still pass malicious arguments to a CLI
  (e.g., `git push --force`). The dispatch table does not validate argument semantics,
  only syntax (no metacharacters). Argument-level policy is future work.
- **Elicitation client trust**: the elicitation response comes from whatever client is
  connected. If the client is compromised or impersonated, the response cannot be trusted.
  This is a MCP protocol-level concern, not specific to this feature.
