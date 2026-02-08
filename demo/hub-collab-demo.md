# Hub Collaboration Demo: Observatory Monochrome Redesign

## Goal

Three agents (Coordinator, Architect, Debugger) collaborate via Thoughtbox Hub to redesign the Observatory UI from its current emerald-green color scheme to a monochrome black-and-white scheme. The Debugger demonstrates sub-agent spawning by delegating WCAG contrast checking to a specialist. At the end, the actual CSS file is edited and the change is visible in the browser.

## Why This Works as a Demo

- **Visible**: The Observatory UI changes color — you can see it in the browser
- **Reversible**: `git checkout src/observatory/ui/observatory.html` undoes everything
- **Real collaboration**: Agents discuss, analyze, propose, review, and merge — then one actually edits the file
- **Observable**: The Observatory itself (via WebSockets) shows the agents' thought chains in real-time

## Prerequisites

1. Docker is running with the Thoughtbox container (`docker-compose up -d`)
2. Observatory is accessible in browser (check port in docker-compose.yml)
3. You're on a clean branch: `git checkout -b demo/monochrome-redesign`
4. The hub agent instruction files are up to date (fixed in commit `131706c` on `refactor/coordinator-rename-manager-flag`)

## The File Being Changed

`src/observatory/ui/observatory.html` — single-file HTML app with inline CSS.

Current color scheme (CSS custom properties at `:root`, lines 11-24):
```css
--bg-primary: #030712;        /* Near-black */
--bg-secondary: #111827;      /* Dark gray */
--bg-tertiary: #1f2937;       /* Medium-dark gray */
--accent-primary: #10b981;    /* Emerald green */
--accent-secondary: #059669;  /* Darker emerald */
--accent-light: #34d399;      /* Light emerald */
--text-primary: #ffffff;
--text-secondary: #9ca3af;
--text-muted: #6b7280;
--border-color: rgba(31, 41, 55, 0.5);
```

Target monochrome scheme:
```css
--accent-primary: #ffffff;
--accent-secondary: #d1d5db;
--accent-light: #f3f4f6;
```

Plus changing emerald-specific hardcoded colors throughout:
- Scrollbar thumb: `rgba(16, 185, 129, ...)` -> `rgba(255, 255, 255, ...)`
- Graph gradient corners: `rgba(16, 185, 129, 0.1)` -> `rgba(255, 255, 255, 0.05)`
- Ambient orbs: `rgba(16, 185, 129, 0.05)` -> `rgba(255, 255, 255, 0.03)`
- SVG arrowhead fill `#34d399` -> `#ffffff`
- Connection gradient stops: `rgb(16, 185, 129)` -> `rgb(255, 255, 255)`
- Node fill `#059669` -> `#6b7280` (gray for main nodes)
- Session tab active: `var(--accent-secondary)` -> `#374151` with white text
- Logo bar gradient: emerald -> white-to-gray
- Status badge: emerald -> white

**Do NOT change**: Agent role colors (lines 623-631) — those stay colorful to distinguish agents.

## Demo Script (Step by Step)

### Phase 1: Coordinator Sets Up Workspace

Run as the **parent agent** (you, Claude Code):

1. Register as Coordinator on the hub:
   ```
   thoughtbox_hub { operation: "register", args: { name: "Coordinator", profile: "COORDINATOR", manager: true } }
   ```

2. Create workspace:
   ```
   thoughtbox_hub { operation: "create_workspace", args: {
     name: "observatory-monochrome",
     description: "Redesign Observatory UI from emerald-green to monochrome black-and-white"
   }}
   ```
   Save the `workspaceId`.

3. Create two problems:
   ```
   thoughtbox_hub { operation: "create_problem", args: {
     workspaceId: "<id>",
     title: "Design monochrome color scheme for Observatory",
     description: "Analyze observatory.html CSS, identify all emerald-green color values, propose monochrome replacements. Must preserve agent role colors (lines 623-631). Output a complete list of old->new CSS value mappings."
   }}
   ```
   ```
   thoughtbox_hub { operation: "create_problem", args: {
     workspaceId: "<id>",
     title: "Review color scheme for accessibility and contrast",
     description: "Review the proposed monochrome scheme for WCAG contrast ratios, readability on dark backgrounds, and visual hierarchy preservation. Flag any values that would make text unreadable or lose important visual distinctions."
   }}
   ```
   Add dependency: review depends on design.

### Phase 2: Launch Architect in Background, Then Debugger

Launch sub-agents **sequentially but concurrently** — start the Architect with `run_in_background: true` so it begins working immediately, then launch the Debugger while the Architect is still alive. Both agents collaborate through the hub in real time.

**Why not parallel spawning?** Agent IDs don't persist reliably across simultaneous Task calls on a shared MCP connection. Sequential launch with background execution gives you both agents alive at the same time without identity conflicts.

**Liveness constraint**: Once a sub-agent's Task completes (or hits `max_turns`), its hub identity is permanently gone — no resurrection. Both agents must finish all hub operations before returning.

**Architect** — `subagent_type: "hub-architect"`, `run_in_background: true`:

```
Register on the hub with manager: true, join workspace '<workspaceId>'.
Claim the design problem. Read src/observatory/ui/observatory.html.
Analyze all CSS color values. Create a thought chain (5-8 thoughts) documenting:
1. Current color inventory (all emerald values)
2. Proposed monochrome replacements
3. What to preserve (agent role colors)
4. Trade-offs (contrast, visual hierarchy)

Then submit a proposal with the complete old->new mapping as the description.
Post a summary to the problem channel.

IMPORTANT: Once you return, your hub identity is permanently gone. Complete ALL hub
operations (proposal submission, channel posts) before returning.
```

Do **not** wait for the Architect to complete. Launch the Debugger immediately after.

**Debugger** — `subagent_type: "hub-debugger"`:

```
Register on the hub with manager: true, join workspace '<workspaceId>'.
Claim the accessibility review problem. Read src/observatory/ui/observatory.html to understand the current color scheme.

Before doing your own review, spawn a sub-agent (using the Task tool with subagent_type "general-purpose")
to calculate WCAG 2.1 contrast ratios for each proposed color pairing against the dark backgrounds
(#030712, #111827, #1f2937). The sub-agent should return a table of foreground/background pairs
with their contrast ratios and pass/fail for AA and AAA levels.

Poll the hub for the Architect's proposal (list_proposals). The Architect is running concurrently
in the background, so the proposal may not exist yet. Poll with retries — interleave polling with
your own WCAG analysis work rather than blocking. Try list_proposals every few turns; if nothing
appears after 5+ attempts, the Architect may need more turns (see maxTurns tuning below).

Once the proposal appears, read it and incorporate the sub-agent's contrast findings into your
thought chain (3-5 thoughts):
1. Sub-agent contrast ratio results
2. Will visual hierarchy be preserved? (primary vs secondary vs muted)
3. Are there hardcoded colors the Architect missed?
4. Overall verdict with evidence

Then review the Architect's proposal (approve or request-changes).
Post your findings — including the contrast ratio table from your sub-agent — to the problem channel.

IMPORTANT: Once you return, your hub identity is permanently gone. Complete ALL hub
operations (review, channel posts) before returning.
```

**After both agents**: Use `TaskOutput` to check on the background Architect agent and collect its results. If either agent exhausted `max_turns` before finishing hub work, increase `max_turns` (default 25) and re-run.

### Phase 3: Coordinator Merges and Applies

Back as the parent agent:

1. Check proposals: `thoughtbox_hub { operation: "list_proposals", args: { workspaceId: "<id>" } }`
2. Merge the approved proposal: `thoughtbox_hub { operation: "merge_proposal", args: { workspaceId: "<id>", proposalId: "<id>", mergeMessage: "Approved monochrome redesign" } }`
3. Mark consensus: `thoughtbox_hub { operation: "mark_consensus", args: { workspaceId: "<id>", name: "Monochrome color scheme", description: "Team agreed on B&W replacement values", thoughtRef: 1 } }`

### Phase 4: Apply the Change (THE VISIBLE PART)

Now actually edit `src/observatory/ui/observatory.html`:

Replace the `:root` CSS variables and all hardcoded emerald colors with the monochrome values from the merged proposal. The specific replacements are listed in the "File Being Changed" section above.

### Phase 5: Rebuild and Show

```bash
docker-compose down && docker-compose build && docker-compose up -d
```

Open the Observatory in the browser. It should now be monochrome.

### Phase 6: Revert (After Recording)

```bash
git checkout src/observatory/ui/observatory.html
docker-compose down && docker-compose build && docker-compose up -d
```

## Key Gotchas

1. **Launch sub-agents sequentially with background execution** — start Architect with `run_in_background: true`, then launch Debugger immediately after; the Debugger polls the hub for the Architect's proposal
2. **Liveness is ephemeral** — once a sub-agent's Task completes (or hits `max_turns`), its hub identity is permanently gone. No resurrection. Both agents must finish all hub operations before returning. If `max_turns` (default 25) is too low, increase it and re-run.
3. **Sub-agents need the gateway init sequence**: `get_state` -> `start_new` -> `cipher` -> `thought` (not `init` or `new_thought`)
4. **First thought must be on main chain** (no branchId), then fork with `branchFromThought: 1`
5. **`create_proposal` args**: `{ workspaceId, problemId, title, description, sourceBranch }` — no `thoughtRef` object
6. **`post_message` args**: `{ workspaceId, problemId, content }` — no `channelId`
7. **`mark_consensus` thoughtRef is a number**, not an object
8. **Don't re-register as Coordinator after workspace creation** if you need to merge later — re-registering loses coordinator role
9. **Agent role colors (lines 623-631) must NOT change** — they distinguish agents in the visualization
