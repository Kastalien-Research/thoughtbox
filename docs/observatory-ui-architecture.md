# Observatory UI Architecture

## Overview

The Observatory UI (`src/observatory/ui/observatory.html`) is a single-file SPA that provides real-time monitoring of Thoughtbox reasoning sessions and Hub collaboration events.

**Key Characteristics:**
- **Single-file architecture**: ~2100 lines of vanilla HTML/CSS/JS
- **Real-time**: WebSocket-based updates for live monitoring
- **Tab-based navigation**: Hash routing between 5 distinct views
- **State-driven rendering**: Central `state` object → `render()` → DOM

---

## UI Component Structure

### Tab Navigation (Primer UnderlineNav)

5 tabs rendered in the AppHeader (lines 105-121):

| Tab | Route | Purpose | Primary Data Source |
|-----|-------|---------|---------------------|
| **Sessions** | `#` or `#/sessions` | Reasoning session list + commit graph | WebSocket `reasoning:*` + `observatory` channels |
| **Problems** | `#/problems` | Hub problems list/detail | REST `/api/hub/workspaces/{id}/problems` |
| **Proposals** | `#/proposals` | Hub proposals list/detail | REST `/api/hub/workspaces/{id}/proposals` |
| **Activity** | `#/activity` | Global event feed | Real-time aggregation from multiple sources |
| **Digest** | `#/digest` | Workspace summary view | Synthesized from Hub REST APIs |

### Global State Object (Line 1085)

Central state store managing all UI data:

```javascript
const state = {
  // Session data
  sessions: [],              // List of reasoning sessions
  activeSessionId: null,     // Currently selected session
  thoughts: new Map(),       // sessionId → Thought[]
  branches: new Map(),       // sessionId → { branchId: Thought[] }
  arrivalOrder: [],          // Thought IDs in arrival order

  // Hub data
  activeWorkspaceId: null,   // Currently selected workspace
  workspaces: [],            // Available workspaces
  problems: [],              // Problems in active workspace
  proposals: [],             // Proposals in active workspace
  agents: [],                // Agents in active workspace
  consensusMarkers: [],      // Consensus markers in active workspace

  // UI state
  currentTab: 'sessions',    // Active tab
  connected: false,          // WebSocket connection status
  selectedThoughtId: null,   // Selected thought in graph
  activityFeed: [],          // Activity log entries
  filters: {},               // Per-tab filters

  // Counts
  problemCount: 0,
  proposalCount: 0,
  activityCount: 0
};
```

---

## Backend API Catalog

### REST Endpoints

#### Session APIs

| Endpoint | Method | Purpose | Response Format |
|----------|--------|---------|-----------------|
| `/api/sessions` | GET | List all sessions | `{ sessions: Session[] }` |
| `/api/sessions?limit=N` | GET | List sessions (paginated) | `{ sessions: Session[] }` |
| `/api/sessions/{id}` | GET | Get session detail | `{ session, thoughts[], branches{} }` |

**Lines**: 1183-1193

#### Hub APIs (Workspace-Scoped)

| Endpoint | Method | Purpose | Response Format |
|----------|--------|---------|-----------------|
| `/api/hub/workspaces` | GET | List all workspaces | `{ workspaces: Workspace[] }` |
| `/api/hub/workspaces/{id}/problems` | GET | Get problems | `{ problems: Problem[] }` |
| `/api/hub/workspaces/{id}/proposals` | GET | Get proposals | `{ proposals: Proposal[] }` |
| `/api/hub/workspaces/{id}/agents` | GET | Get agents | `{ agents: Agent[] }` |
| `/api/hub/workspaces/{id}/consensus` | GET | Get consensus markers | `{ markers: ConsensusMarker[] }` |

**Lines**: 1196-1227

### WebSocket Protocol

**Connection**: `ws://localhost:1729` (production: `wss://`)

**Message Format**: JSON array `[topic, event, payload]`

#### Topics

| Topic | Purpose | Subscription Scope |
|-------|---------|-------------------|
| `observatory` | Global session events | All clients |
| `workspace` | Hub collaboration events | All clients |
| `reasoning:{sessionId}` | Session-specific thought stream | Per-session |

#### Key Events

**Observatory Channel** (lines 1926-1971):
- `observatory:sessions:active` → List of active sessions
- `session:started` → New session created
- `thought:added` → Thought added (broadcast)

**Reasoning Channel** (lines 1974-2027):
- `session:snapshot` → Full session state on subscription
- `thought:added` → New thought in specific session
- `session:updated` → Session metadata changed
- `session:ended` → Session closed

**Workspace Channel** (lines 2030-2061):
- `workspace:hub:event` → Hub activity (problems, proposals, consensus, messages)

**Event Payload Types**:
```javascript
// workspace:hub:event payload.type values
'problem_created'
'problem_status_changed'
'proposal_created'
'proposal_merged'
'message_posted'
'consensus_marked'
// MISSING: 'workspace_created' ← BUG
```

---

## Data Flow Architecture

### Pattern: API → State → Render → DOM

All data flow follows this unidirectional pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                     Data Sources                             │
├──────────────────────┬──────────────────────────────────────┤
│  REST APIs           │  WebSocket Events                     │
│  - fetchWorkspaces() │  - observatory:sessions:active        │
│  - fetchAllSessions()│  - workspace:hub:event                │
│  - fetchWorkspaceData│  - reasoning:*                        │
└──────────┬───────────┴──────────────┬───────────────────────┘
           │                          │
           ▼                          ▼
    ┌─────────────────────────────────────────┐
    │        Central State Object             │
    │  - state.workspaces[]                   │
    │  - state.sessions[]                     │
    │  - state.problems[]                     │
    │  - state.proposals[]                    │
    │  - state.thoughts (Map)                 │
    └──────────────────┬──────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │     render()         │
            │  - parseRoute()      │
            │  - switch(tab)       │
            │  - renderXxxView()   │
            └──────────┬───────────┘
                       │
                       ▼
                  ┌────────┐
                  │  DOM   │
                  └────────┘
```

### Component-to-API Mapping

| UI Component | Consumes State | Populated By API | Updated By Event |
|--------------|----------------|------------------|------------------|
| Session list | `state.sessions[]` | `GET /api/sessions` | `observatory:sessions:active` |
| Thought graph | `state.thoughts`, `state.branches` | Session detail API | `reasoning:*:thought:added` |
| Workspace selector | `state.workspaces[]` | `GET /api/hub/workspaces` | ❌ **NONE** (BUG #1) |
| Problems list | `state.problems[]` | `GET /api/hub/workspaces/{id}/problems` | `workspace:hub:event` |
| Proposals list | `state.proposals[]` | `GET /api/hub/workspaces/{id}/proposals` | `workspace:hub:event` |
| Activity feed | `state.activityFeed[]` | (none, aggregated) | All channels |

---

## Critical Bugs Identified

### Bug #1: Missing Workspace Event Handler

**Location**: Lines 2030-2061 (`workspace:hub:event` handler)

**Root Cause**: The workspace event handler switch statement has cases for:
- `problem_created`
- `problem_status_changed`
- `proposal_created`
- `proposal_merged`
- `message_posted`
- `consensus_marked`

But **NO case for `workspace_created`**.

**Impact**: When a new workspace is created via Hub MCP tools:
1. Backend emits `workspace:hub:event` with `type: 'workspace_created'`
2. UI receives the event but ignores it (no matching case)
3. `fetchWorkspaces()` is never called
4. New workspace never appears in dropdown

**Current Workaround**: Page reload

**Verification**:
```bash
# Workspace exists in storage
ls /root/.thoughtbox/workspaces/6176183a-865b-4037-bf43-dc3c1809d25f/
# ✓ workspace.json exists

# But not in UI dropdown
# ✗ Not visible until page reload
```

### Bug #2: Workspace Selector Architectural Mismatch

**Location**: Lines 1417-1422 (inside `renderSessionsView()`)

**Issue**: The workspace dropdown is rendered on the **Sessions tab** but controls `state.activeWorkspaceId`, which is consumed by **Problems, Proposals, and Activity tabs**.

**Architectural Problem**:
- Selector location ≠ data scope it controls
- Selector only visible when on Sessions tab
- Changing workspaces while on Problems tab requires switching to Sessions first

**User Confusion**:
- "Why is the workspace selector on the Sessions tab when sessions aren't workspace-scoped?"
- "I'm viewing Problems but can't change workspace without switching tabs"

**Data Flow Disconnect**:
```
Sessions Tab
├── Workspace Selector (renders here) ─┐
│                                      │
│   Controls: state.activeWorkspaceId │
│                                      │
└──────────────────────────────────────┘
                                       │
                                       │ Used by:
                                       ├─→ Problems Tab (fetchWorkspaceData)
                                       ├─→ Proposals Tab (fetchWorkspaceData)
                                       ├─→ Activity Tab (filters by workspace)
                                       └─→ Digest Tab (workspace summary)
```

---

## Session Management Patterns

### Session Lifecycle

1. **Session Start** (first thought recorded)
   - Backend: `ThoughtHandler` → `emitSessionStarted()`
   - Event: `observatory` channel broadcasts `session:started`
   - UI: Adds to `state.sessions[]`, auto-selects if first session

2. **Thought Addition**
   - Backend: `ThoughtHandler` → `emitThoughtAdded()`
   - Events:
     - `reasoning:{sessionId}` channel: `thought:added` (session-scoped)
     - `observatory` channel: `thought:added` (global)
   - UI: Updates `state.thoughts`, re-renders graph

3. **Session End** (nextThoughtNeeded = false)
   - Backend: `ThoughtHandler` → `emitSessionEnded()`
   - Event: Both channels broadcast `session:ended`
   - UI: Updates session status to 'closed'

### Subscription Pattern

When a session is selected:
```javascript
// Line 1097-1103
function selectSession(sessionId) {
  if (currentSessionTopic) {
    client.unsubscribe(currentSessionTopic);
  }
  state.activeSessionId = sessionId;
  currentSessionTopic = `reasoning:${sessionId}`;
  client.subscribe(currentSessionTopic);
  loadSessionDetail(sessionId);
  render();
}
```

**Snapshot-on-Join**: When subscribing to `reasoning:{sessionId}`, the backend immediately sends a `session:snapshot` event with full session state (thoughts + branches).

---

## Rendering Flow

### Hash-Based Routing (Lines 1912, 286-296)

```javascript
window.addEventListener('hashchange', handleRoute);

function handleRoute() {
  const { tab, detailId } = parseRoute();
  state.currentTab = tab;
  render();
}

function parseRoute() {
  const hash = window.location.hash.slice(1) || '/';
  const [_, tab, detailId] = hash.match(/^\/([^/]+)(?:\/(.+))?$/) || [null, 'sessions', null];
  return { tab, detailId };
}
```

### Render Dispatcher (Lines 1237-1261)

```javascript
function render() {
  const main = document.getElementById('main-content');
  const { tab, detailId } = parseRoute();

  switch (tab) {
    case 'sessions':
      main.innerHTML = renderSessionsView();
      break;
    case 'problems':
      main.innerHTML = detailId
        ? renderProblemDetail(detailId)
        : renderProblemsView();
      break;
    case 'proposals':
      main.innerHTML = detailId
        ? renderProposalDetail(detailId)
        : renderProposalsView();
      break;
    case 'activity':
      main.innerHTML = renderActivityView();
      break;
    case 'digest':
      main.innerHTML = renderDigestView();
      break;
  }

  updateCounts();  // Update badge counts on tabs
}
```

---

## Recommendations

### Fix #1: Add Workspace Event Handler

**File**: `src/observatory/ui/observatory.html`
**Lines**: 2034-2058
**Change**: Add case to switch statement

```javascript
case 'workspace_created':
  addActivity('workspace', '&#x1f4c1;', `Workspace created: <strong>${escapeHtml((payload.data?.name) || '?')}</strong>`, undefined);
  fetchWorkspaces();  // ← Refresh dropdown
  break;
```

**Verification**: Create new workspace via MCP → should appear in dropdown without reload.

### Fix #2: Relocate Workspace Selector

**Option A: Global Navigation (Recommended)**

Move workspace selector from Sessions tab content to AppHeader (lines 90-127). Render it as a top-level navigation element visible on all tabs.

**Pros**:
- Selector visible when viewing Hub tabs
- Clear architectural separation (global nav controls global state)
- Consistent UX (workspace choice persists across tab switches)

**Cons**:
- Requires AppHeader refactor
- May need CSS adjustments for layout

**Option B: Duplicate on Hub Tabs**

Render workspace selector on Problems, Proposals, Activity, and Digest tabs.

**Pros**:
- Minimal code changes
- Each tab controls its own workspace context

**Cons**:
- Code duplication (5x render logic)
- Potential sync issues if state updates don't trigger re-render on all tabs
- Inconsistent with single-source-of-truth pattern

**Recommendation**: Implement Option A. Move workspace selector to global navigation as a persistent UI element, similar to how GitHub displays repository selectors in the top bar.

---

## Component Inventory

### State Management Functions

| Function | Purpose | Lines |
|----------|---------|-------|
| `fetchWorkspaces()` | Load workspace list from API | 1196-1208 |
| `fetchWorkspaceData()` | Load all data for active workspace | 1210-1227 |
| `fetchAllSessions()` | Load session list | 1176-1181 |
| `loadSessionDetail(id)` | Load specific session | 1184-1193 |
| `selectSession(id)` | Switch active session, subscribe to channel | 1097-1103 |
| `render()` | Root render function, dispatches to view renderers | 1237-1261 |
| `updateCounts()` | Update tab badge numbers | 1263-1267 |

### View Renderers

| Function | Purpose | Lines |
|----------|---------|-------|
| `renderSessionsView()` | Sessions list + commit graph | 1417-1505 |
| `renderProblemsView()` | Problems list | 1507-1565 |
| `renderProblemDetail(id)` | Problem detail page | 1567-1625 |
| `renderProposalsView()` | Proposals list | 1627-1680 |
| `renderProposalDetail(id)` | Proposal detail page | 1682-1740 |
| `renderActivityView()` | Activity feed | 1742-1780 |
| `renderDigestView()` | Workspace summary | 1782-1840 |

### WebSocket Event Handlers

| Event | Purpose | Lines |
|-------|---------|-------|
| `connected` | Initialize: fetch workspaces + sessions, subscribe to channels | 1915-1921 |
| `observatory:sessions:active` | Merge active sessions into state | 1926-1938 |
| `session:started` | Handle new session creation | 1940-1958 |
| `thought:added` | Broadcast thought event (global) | 1960-1971 |
| `reasoning:*` message handler | Session-specific events | 1974-2027 |
| `workspace:hub:event` | Hub activity events | 2030-2061 |

---

## Testing Verification

### Bug #1 Reproduction

```bash
# Terminal 1: Start Thoughtbox server with Observatory
THOUGHTBOX_OBSERVATORY_ENABLED=true npm start

# Terminal 2: Create workspace via MCP
thoughtbox_hub create_workspace --name "Test Workspace" --description "Testing"

# Browser: Open http://localhost:1729
# ✗ New workspace does NOT appear in dropdown (current behavior)
# ✓ New workspace SHOULD appear in dropdown (after fix)
```

### Bug #2 Reproduction

```bash
# Browser: Navigate to http://localhost:1729
# 1. Switch to Problems tab
# 2. Try to find workspace selector
# ✗ Not visible (must switch to Sessions tab first)
# ✓ Should be in global nav (after fix)
```

---

## Future Enhancements

### Workspace Selector UX

**Current**: Basic `<select>` dropdown
**Proposed**: Primer `SelectPanel` component with:
- Search/filter capability
- Workspace metadata preview (problem count, agent count)
- "Create New Workspace" action

### Real-Time Workspace List Updates

Beyond fixing the `workspace_created` event, also handle:
- `workspace_deleted` → Remove from dropdown
- `workspace_updated` → Update name/description in dropdown
- `workspace_archived` → Gray out or hide in dropdown

### Session Persistence

**Issue**: `InMemorySessionStore` (backend) loses all session data on server restart.
**Impact**: UI shows empty session list after restart, even if session exports exist on disk.
**Recommendation**: See Memory context note about Observatory session persistence (H9 from Run 005).

---

## Related Documentation

- [Observatory Backend Architecture](./observatory-architecture.md) — WebSocket server, channels, emitter
- [Hub Collaboration Spec](./.specs/SPEC-HUB-001-core-operations.md) — Hub data model
- [Session Management](./SESSION_STORAGE_TASK_INTEGRATION.md) — Session storage patterns

---

## Appendix: Line Number Reference

Key sections in `src/observatory/ui/observatory.html`:

| Lines | Section |
|-------|---------|
| 1-103 | HTML structure, CSS styles |
| 105-127 | AppHeader with tab navigation |
| 129-282 | WebSocket client implementation |
| 286-296 | Hash routing logic |
| 1085-1175 | State object + helper functions |
| 1176-1227 | API fetch functions |
| 1229-1261 | Render dispatcher |
| 1417-1840 | View render functions |
| 1912-2071 | Event handlers + initialization |
