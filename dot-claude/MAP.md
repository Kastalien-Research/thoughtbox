# dot-claude Map

Holistic map of `dot-claude/`, focusing on what exists and how pieces connect.

## Top-Level Layout

```
dot-claude/
├── agents/               # Project subagents
├── bin/                  # Memory CLI helpers
├── commands/             # Slash commands (docs + workflows)
├── hooks/                # Claude Code hook scripts
├── output-styles/        # Output formatting presets
├── plugins/              # Plugin bundles (commands, agents, hooks)
├── rules/                # Project rules
├── status_lines/         # Status line renderers
├── settings.json         # Project settings (plugins enabled)
└── settings.local.json   # Local env + permissions + MCP enablement
```

## Settings + Lifecycle Wiring

### `settings.json`
```
enabledPlugins:
  compound-engineering@every-marketplace: true
```

### `settings.local.json`
```
env:
  CLAUDE_CODE_ENABLE_TELEMETRY=1
  OTEL_* vars for OTLP to localhost:4317

permissions.allow:
  - Skill(specifications:specification-suite)
  - Skill(specifications:spec-designer)
  - mcp__thoughtbox__thoughtbox_gateway
  - mcp__context7__query-docs
  - mcp__container-use__environment_*
  - WebSearch, WebFetch(domain:...)
  - many Bash allowlist entries

enableAllProjectMcpServers: true
enabledMcpjsonServers:
  - github
  - firecrawl-mcp
  - context7
  - thoughtbox
  - container-use
  - claude-flow
```

**Connection:** permissions + MCP server toggles determine which tools and skills can execute from commands and agents.

## Hooks (Automations)

```
dot-claude/hooks/
├── pre_tool_use.sh
├── post_tool_use.sh
├── git-validator.sh
├── session_start.sh
├── session_end_memory.sh
├── user_prompt_submit.sh
├── pre_compact.sh
├── stop.sh
├── subagent_stop.sh
├── notification.sh
├── track_file_access.sh
├── memory_pattern_detector.sh
└── integrate_memory_hooks.sh
```

**Connection:** hooks are registered via settings (not shown in `dot-claude/settings.json`), so activation depends on your global/project hook configuration.

### What each hook actually does (verified from scripts)

- **`pre_tool_use.sh` (PreToolUse)**:
  - **Blocks**:
    - Writing/modifying `.env*` files (except `.env.sample`) via `Edit`/`Write`/`MultiEdit` or Bash commands that reference `.env`.
    - Modifying `.claude/hooks/*` or `.claude/settings*` via `Edit`/`Write`, or Bash redirection/copy/move/remove touching `.claude/(hooks|settings)`.
    - Dangerous `rm -rf` patterns.
    - Dangerous Git operations via `Bash` (direct pushes to `main|master|develop|production`, force pushes, branch deletion, remote branch deletion).
  - **Warns (does not block)**: non-conventional `git commit -m ...` messages (checks `^(feat|fix|refactor|docs|test|chore|perf|style)(\(.+\))?:`).
  - **Logs**: appends raw hook input JSON to `dot-claude/hooks/logs/pre_tool_use.json`.

- **`post_tool_use.sh` (PostToolUse)**:
  - **Logs**: if tool was `Bash` and the command begins with `git ...`, appends an audit entry to `dot-claude/hooks/logs/git_operations.json`.

- **`git-validator.sh` (PermissionRequest)**:
  - **Outputs JSON** with a `decision` of `block|prompt|approve` plus a `reason` for protected Git pushes, force pushes, and branch deletions.

- **`session_start.sh` (SessionStart)**:
  - Always appends raw hook input JSON to `dot-claude/hooks/logs/session_start.json`.
  - With `--load-context`, emits `hookSpecificOutput.additionalContext` including timestamp, session source, git branch + dirty count, and a short preview of a few project files if present.
  - Also attempts to summarize a “memory system” rooted at `.claude/rules/*` if that directory exists.

- **`user_prompt_submit.sh` (UserPromptSubmit)**:
  - Logs raw hook input JSON to `dot-claude/hooks/logs/user_prompt_submit.json`.
  - Optional flags:
    - `--store-last-prompt`: appends prompt text into `.claude/data/sessions/<session_id>.json`.
    - `--name-agent`: sets a simple random `agent_name` in that same session file.
    - `--validate`: blocks prompt if it contains `rm -rf /` (exit code 2).

- **`pre_compact.sh` (PreCompact)**:
  - Logs raw hook input JSON to `dot-claude/hooks/logs/pre_compact.json`.
  - With `--backup`, copies the transcript to `dot-claude/hooks/logs/transcript_backups/` before compaction.

- **`notification.sh` (Notification)**:
  - Logs raw hook input JSON to `dot-claude/hooks/logs/notification.json`.

- **`subagent_stop.sh` (SubagentStop)**:
  - Logs raw hook input JSON to `dot-claude/hooks/logs/subagent_stop.json`.
  - With `--chat`, converts the `.jsonl` transcript into `dot-claude/hooks/logs/chat.json` (best-effort).

- **`stop.sh` (Stop)**:
  - **LangSmith exporter**: parses new transcript lines since last run (tracked in `~/.claude/state/langsmith_state.json`) and sends “turn” runs to LangSmith when `TRACE_TO_LANGSMITH=true` and an API key is present.
  - Uses `stop_hook_active` to avoid infinite continuation loops.

- **`track_file_access.sh` + `memory_pattern_detector.sh`**:
  - Intended as a “memory calibration” subsystem that logs file access and repeated errors under `.claude/state/` and then suggests memory-rule improvements.
  - See caveats below (these need alignment with Claude Code’s current hook input schema).

- **`session_end_memory.sh` (SessionEnd)**:
  - Appends a calibration entry to `.claude/state/memory-calibration.log`.
  - Emits a large JSON “prompt” payload to stdout describing how to capture learnings.

- **`integrate_memory_hooks.sh` (manual helper)**:
  - A helper script that assumes hooks live under `.claude/hooks/` and prints integration instructions; it does not register hooks by itself.

### Verified caveats / mismatches

- **Repo-root `.claude/` currently contains only `settings.json` and `settings.local.json`** (no `.claude/hooks/` directory in this repo snapshot), so these hook scripts are **not active unless installed/registered elsewhere**.
- **Claude Code does not add stdout from `SessionEnd` hooks into the agent’s context** (only `UserPromptSubmit`, `SessionStart`, and `Setup` do), so the “prompt” emitted by `session_end_memory.sh` is **not visible to the agent by default**.
- **`track_file_access.sh` expects `tool_arguments` and tool names like `read_file`**, but Claude Code hook input uses `tool_name` like `Read|Edit|Write|Bash` and `tool_input` (per Claude Code hook schema). As written, file tracking will not record standard Claude Code file tool usage.
- **`memory_pattern_detector.sh` initializes `memory-calibration.json` without `coverage_gaps`, but later tries to append using `.coverage_gaps += ...`**, which will error when it first encounters a coverage gap unless that array is initialized.

## Commands (Slash Commands)

```
dot-claude/commands/
├── loops/           # OODA primitives
├── specifications/  # spec-designer, spec-validator, spec-orchestrator, suite
├── workflows/       # orchestration + MCP chains
├── analysis/        # reviews, tracking, knowledge graph
├── development/     # implementation variants, spec-to-test
├── exploration/     # parallel exploration
├── debugging/       # systematic debugging flows
├── synthesis/       # knowledge fusion, pattern synthesis
├── orchestration/   # swarm intelligence, adaptive workflows
├── memory/          # memory system commands
├── research/        # docs researcher
├── startup/         # project priming
└── utils/           # post-edit workflow
```

### Known Keep / Migrate (User-Confirmed)

These are the command areas you explicitly want to migrate into the skills paradigm:

- `dot-claude/commands/loops/`
- `dot-claude/commands/specifications/`
- `dot-claude/commands/meta/refactoring-game.md`
- `dot-claude/commands/meta/ulysses-protocol.md`
- `dot-claude/commands/research/docs-researcher.md`
- `dot-claude/commands/development/implement-spec.md`
- `dot-claude/commands/development/parallel-executor.md`
- `dot-claude/commands/development/spec-to-test.md`

### Verified Command → Loop Connections

**`/spec-designer`** composes loop primitives explicitly:

- `@loops/exploration/problem-space.md`
- `@loops/authoring/spec-drafting.md`
- `@loops/refinement/requirement-quality.md`
- `@loops/verification/acceptance-gate.md`

**`/specification-suite`** chains commands:

```
specification-suite
 ├─> spec-designer
 ├─> spec-validator
 └─> spec-orchestrator
```

**`/spec-orchestrator`** documents its own OODA loops and spiral detection logic.

## Loop Library (OODA Primitives)

```
dot-claude/commands/loops/
├── exploration/     # problem-space, codebase-discovery, domain-research
├── authoring/       # spec-drafting, code-generation, documentation
├── refinement/      # requirement-quality, code-quality, consistency-check
├── verification/    # acceptance-gate, fact-checking, integration-test
├── orchestration/   # dependency-resolver, queue-processor, spiral-detector
└── meta/            # loop-interface, composition-patterns
```

**Connection:** workflows and specs reference these loops via `@loops/...` paths.

## Proposed conventions (Hooks ↔ OODA ↔ Skills)

These are conventions that fit Claude Code’s current capability surface:

- **Global hooks (settings / plugins)**: deterministic safety + audit.
  - Example: keep `pre_tool_use.sh` / `git-validator.sh` as global guardrails.

- **Skill-scoped hooks (frontmatter)**: workflow-local enforcement.
  - Claude Code supports **only** `PreToolUse`, `PostToolUse`, and `Stop` hooks in skills/subagents.
  - Use these for workflow-specific invariants (e.g., spec-suite state, artifact routing, quality gates).

### Proposed “specification-suite” scoped hook set (no code changes yet)

- **PreToolUse (Write|Edit|MultiEdit)**:
  - Enforce that spec-suite artifacts are written only under `OUTPUT_FOLDER/` and `.specification-suite/` unless explicitly overridden.
  - Optionally auto-inject `additionalContext` pointing to current `.specification-suite/state.json` (lightweight state, not full logs).

- **PostToolUse (Write|Edit|MultiEdit)**:
  - Append an audit entry to `.specification-suite/amendments.json` (already described in the suite doc) when spec files are modified during Phase 2.5.
  - Optionally run fast validators on touched spec files (e.g., JSON schema checks if present).

- **Stop (prompt hook, scoped to the suite)**:
  - Enforce “Ulysses Protocol” style termination: if suite `state.json` indicates an incomplete phase (design/validate/orchestrate) and no explicit halt decision exists, block stopping with a reason that points to the next required action.

### Proposed “OODA as shared vocabulary” metadata

For each workflow skill/command, add frontmatter fields (example names):

- `version`: semver for the skill/command prompt
- `loop_interface`: e.g. `loop-interface@1.0` for loop docs
- `ooda_loops`: explicit list of loop building blocks used (paths + versions)
- `declared_dependencies`: semantic version ranges for other skills/commands it composes
- `state_files`: list of workflow state files (e.g., `.specification-suite/state.json`)

This supports “Front Matter as Truth + Generated Registry” by making dependency and loop composition machine-scannable.

## Plugins (Bundled Commands/Agents/Hooks)

```
dot-claude/plugins/
├── agent-sdk-dev/
│   ├── agents/agent-sdk-verifier-{py,ts}.md
│   └── commands/new-sdk-app.md
├── commit-commands/
│   └── commands/{commit,commit-push-pr,clean_gone}.md
├── feature-dev/
│   ├── agents/{code-architect,code-explorer,code-reviewer}.md
│   └── commands/feature-dev.md
├── pr-review-toolkit/
│   ├── agents/{code-reviewer,code-simplifier,comment-analyzer,pr-test-analyzer,silent-failure-hunter,type-design-analyzer}.md
│   └── commands/review-pr.md
└── security-guidance/
    └── hooks/hooks.json + security_reminder_hook.py
```

**Connection:** plugins can contribute commands, agents, and hooks. Enabled plugin(s) are toggled via `settings.json`.

## Agents (Project Subagents)

```
dot-claude/agents/
├── fact-checking-agent.md
└── meta-agent.md
```

**Connection:** subagents can be invoked directly or by commands that delegate.

## Output Styles

```
dot-claude/output-styles/
  bullet-points.md
  genui.md
  html-structured.md
  markdown-focused.md
  table-based.md
  tts-summary.md
  ultra-concise.md
  yaml-structured.md
```

**Connection:** format presets influence how responses are rendered when selected.

## Status Lines

```
dot-claude/status_lines/
  status_line.py
  status_line_v2.py
  status_line_v3.py
  status_line_v4.py
```

**Connection:** custom status line display logic for sessions.

## Memory Utilities

```
dot-claude/bin/
  memory-add
  memory-pipe
  memory-query
  memory-rank
  memory-stats
```

**Connection:** CLI helpers for the memory system; typically invoked from shell, not auto-wired.

## Simple Relationship Diagram

```
settings.local.json
  ├─ env (telemetry)
  ├─ permissions.allow (Bash/MCP/Skill)
  └─ MCP servers enabled

commands/
  ├─ specs/*  ---> loops/* (via @loops references)
  └─ workflows/* ---> specs/* + loops/*

plugins/
  ├─ commands/* + agents/* + hooks/*
  └─ enabled via settings.json

hooks/
  └─ registered via hook config (not in dot-claude/settings.json)
```

## Notes for "Commands vs Skills"

This repo currently uses `commands/` (not `skills/`). Claude docs state skills are the preferred extension mechanism, while commands still work. Migration is optional and can be incremental.
