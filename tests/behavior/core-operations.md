# Thoughtbox Core Operations - Behavioral Tests

This test suite provides comprehensive behavioral tests for Thoughtbox core operations including initialization flow, session management, thought operations, and persistence. Each test includes exact citations to the source code implementing the behavior.

## Test Organization

- **Initialization Tests**: Verify progressive disclosure and session setup
- **Session Management Tests**: Test session lifecycle and continuity
- **Thought Operation Tests**: Sequential reasoning, branching, revisions
- **Persistence Tests**: Storage operations, integrity, exports
- **Stage Progression Tests**: Stage transitions and operation gating

---

## Initialization Flow Tests

### Test 1.1: Gateway Always Available at Stage 0
<!-- Citation: src/server-factory.ts:393-398, src/tool-registry.ts:register() -->

**Objective**: Verify the gateway tool is registered at Stage 0 and always accessible.

**Setup**: Server initialization.

**Action**:
```typescript
// Call gateway at Stage 0
thoughtbox_gateway({
  operation: "get_state"
})
```

**Expected Outcome**:
- Gateway tool call succeeds
- Response includes `stage: "stage_1"` (STAGE_1_UNINITIALIZED)
- No stage requirement error
- Navigation state shows available init operations

**Verification**:
- Check response contains session state
- Verify embedded resource with navigation markdown
- Confirm no "operation requires stage" error

---

### Test 1.2: Get State Shows Uninitialized Stage
<!-- Citation: src/init/tool-handler.ts:228-249, src/init/state-manager.ts:100-103 -->

**Objective**: Verify `get_state` returns correct initial state before any operations.

**Setup**: Fresh server connection, no prior operations.

**Action**:
```typescript
thoughtbox_gateway({
  operation: "get_state"
})
```

**Expected Outcome**:
- Response includes `Connection stage: stage_1`
- State shows no active project/task/aspect
- Navigation markdown lists available operations:
  - `list_sessions`
  - `navigate`
  - `start_new`
  - `list_roots`
  - `bind_root`

**Verification**:
- Parse text content for "Connection stage: stage_1"
- Check embedded resource has "Getting Started" section
- Verify all Stage 0 operations are listed

---

### Test 1.3: List Sessions Without Prior Sessions
<!-- Citation: src/init/tool-handler.ts:254-317, src/persistence/filesystem-storage.ts:listSessions() -->

**Objective**: Verify `list_sessions` works correctly when no sessions exist.

**Setup**: Fresh server with no persisted sessions.

**Action**:
```typescript
thoughtbox_gateway({
  operation: "list_sessions",
  args: {
    filters: { limit: 10 }
  }
})
```

**Expected Outcome**:
- Response indicates "Found 0 sessions"
- Embedded resource shows "No sessions found matching criteria"
- No errors thrown
- State advances to STAGE_2_INIT_STARTED

**Verification**:
- Check response text contains session count
- Verify embedded resource URI is `thoughtbox://init/sessions`
- Confirm response.isError is undefined or false

---

### Test 1.4: Start New Work Without Bound Root
<!-- Citation: src/init/tool-handler.ts:503-614, src/init/state-manager.ts:144-154 -->

**Objective**: Verify `start_new` creates a new work context with explicit project.

**Setup**: No bound root set.

**Action**:
```typescript
thoughtbox_gateway({
  operation: "start_new",
  args: {
    newWork: {
      project: "test-project",
      task: "init-flow",
      aspect: "behavioral-testing"
    }
  }
})
```

**Expected Outcome**:
- Response confirms initialization: "Initialized new work context: test-project/init-flow/behavioral-testing"
- State updates to STAGE_3_FULLY_LOADED
- Session state includes project/task/aspect
- Embedded resource includes "Next action: Call `thoughtbox_gateway` with operation `cipher`"
- STAGE_1_OPERATIONS_SCHEMA content is included

**Verification**:
- Check text content for initialization message
- Verify embedded resource has "New Work Context" heading
- Confirm Stage 1 operations schema is present
- Query storage for related sessions (should show counts)

---

### Test 1.5: Load Context with Existing Session
<!-- Citation: src/init/tool-handler.ts:435-495, src/gateway/gateway-handler.ts:290-308 -->

**Objective**: Verify `load_context` loads a session and advances to Stage 1.

**Setup**: Pre-create a session with 3 thoughts.

**Action**:
```typescript
// First create a session with thoughts
thoughtbox_gateway({ operation: "start_new", args: { newWork: { project: "test" }}})
thoughtbox_gateway({ operation: "cipher" })
thoughtbox_gateway({
  operation: "thought",
  args: { thought: "Initial observation", nextThoughtNeeded: true }
})
// ... create thoughts 2 and 3 ...

// Now load the session in a new connection
thoughtbox_gateway({
  operation: "load_context",
  args: { sessionId: "{captured-session-id}" }
})
```

**Expected Outcome**:
- Response includes session metadata (title, thought count, tags)
- Recent thoughts (last 5) are embedded in context markdown
- State advances to STAGE_3_FULLY_LOADED
- Session ID is set as activeSessionId
- Response includes restoration info: "Session State Restored (SIL-103)"
- Restoration info shows thought count, current number, and branch count

**Verification**:
- Check text content includes "Loaded session:" and session ID
- Verify embedded resource contains "Recent Thoughts" section
- Confirm thoughtHandler is restored (via restoration info)
- Next thought operation should auto-number correctly

---

### Test 1.6: Bind Root Sets Project Scope
<!-- Citation: src/init/tool-handler.ts:677-753, src/init/state-manager.ts:189-197 -->

**Objective**: Verify `bind_root` sets bound root and affects `start_new`.

**Setup**: Server with MCP roots support.

**Action**:
```typescript
// List roots
thoughtbox_gateway({ operation: "list_roots" })

// Bind a root
thoughtbox_gateway({
  operation: "bind_root",
  args: { rootUri: "file:///path/to/project" }
})

// Start new work without explicit project
thoughtbox_gateway({
  operation: "start_new",
  args: { newWork: { task: "test-task" }}
})
```

**Expected Outcome**:
- `list_roots` shows available roots
- `bind_root` succeeds with confirmation message
- Bound root is stored in session state
- `start_new` uses bound root name as project
- Response indicates project derived from bound root

**Verification**:
- Check bind_root response: `success: true`
- Verify bound root includes uri and name
- Confirm start_new response shows project source as "bound-root"
- Session state project matches bound root name

---

## Session Management Tests

### Test 2.1: Session Auto-Creation on First Thought
<!-- Citation: src/thought-handler.ts:520-557, src/persistence/filesystem-storage.ts:createSession() -->

**Objective**: Verify session is auto-created when first thought is processed without active session.

**Setup**: Fully initialized (Stage 2), no active session.

**Action**:
```typescript
thoughtbox_gateway({
  operation: "thought",
  args: {
    thought: "First thought in new session",
    nextThoughtNeeded: true,
    sessionTitle: "Auto-created session",
    sessionTags: ["test", "auto-create"]
  }
})
```

**Expected Outcome**:
- Session is created automatically
- Response includes sessionId
- Session has title "Auto-created session"
- Session has tags ["test", "auto-create"]
- Thought is saved to new session
- Event emitter fires session_created event (if enabled)

**Verification**:
- Extract sessionId from response
- Query storage for session metadata
- Verify session.thoughtCount === 1
- Confirm session.tags includes provided tags

---

### Test 2.2: Session Continuity After Reconnect
<!-- Citation: src/gateway/gateway-handler.ts:290-308, src/thought-handler.ts:255-314 -->

**Objective**: Verify ThoughtHandler state is fully restored when loading a session.

**Setup**: Create session with thoughts 1-5, close connection.

**Action**:
```typescript
// First session: create thoughts 1-5
thoughtbox_gateway({ operation: "start_new", args: { newWork: { project: "test" }}})
thoughtbox_gateway({ operation: "cipher" })
for (let i = 1; i <= 5; i++) {
  thoughtbox_gateway({
    operation: "thought",
    args: { thought: `Thought ${i}`, nextThoughtNeeded: true }
  })
}

// Simulate reconnect - new connection, load session
thoughtbox_gateway({ operation: "load_context", args: { sessionId }})

// Add thought 6
thoughtbox_gateway({
  operation: "thought",
  args: { thought: "Thought 6", nextThoughtNeeded: false }
})
```

**Expected Outcome**:
- load_context returns restoration info
- Restoration shows: thoughtCount=5, currentThoughtNumber=5, branchCount=0
- Thought 6 is auto-numbered as thoughtNumber=6
- Response text includes "Session State Restored (SIL-103)"
- Thought history is contiguous (no gaps)

**Verification**:
- Check load_context response for restoration section
- Verify thought 6 response: `thoughtNumber: 6`
- Query storage: session should have 6 thoughts total
- Export session and verify linked chain: 1←2←3←4←5←6

---

### Test 2.3: List Sessions with Filters
<!-- Citation: src/sessions/handlers.ts:listSessions(), src/persistence/filesystem-storage.ts:listSessions() -->

**Objective**: Verify session listing with tag filters and pagination.

**Setup**: Create 15 sessions with various tags.

**Action**:
```typescript
// Create sessions with tags
for (let i = 1; i <= 15; i++) {
  thoughtbox_gateway({ operation: "start_new", args: {
    newWork: {
      project: i <= 5 ? "project-a" : "project-b",
      task: `task-${i}`
    }
  }})
  thoughtbox_gateway({ operation: "cipher" })
  thoughtbox_gateway({
    operation: "thought",
    args: { thought: `Test ${i}`, nextThoughtNeeded: false }
  })
}

// List with filters
thoughtbox_gateway({
  operation: "session",
  args: {
    operation: "list",
    args: {
      tags: ["project:project-a"],
      limit: 10
    }
  }
})
```

**Expected Outcome**:
- Response includes 5 sessions (all from project-a)
- Sessions are sorted by updatedAt (most recent first)
- Response includes metadata: title, tags, thoughtCount
- Pagination limit is respected

**Verification**:
- Parse response sessions array
- Verify sessions.length <= 10
- Check all sessions have tag "project:project-a"
- Confirm sorting order by updatedAt

---

### Test 2.4: Session Export to JSON with Linked Structure
<!-- Citation: src/thought-handler.ts:206-237, src/persistence/export.ts:export() -->

**Objective**: Verify session export produces correct linked node structure.

**Setup**: Create session with thoughts 1-3 and one branch.

**Action**:
```typescript
// Create main chain thoughts 1-3
// Create branch from thought 2
thoughtbox_gateway({
  operation: "thought",
  args: {
    thought: "Branch thought",
    branchFromThought: 2,
    branchId: "alt-path",
    nextThoughtNeeded: false
  }
})

// Export session
const response = await thoughtbox_gateway({
  operation: "session",
  args: {
    operation: "export",
    args: { sessionId, format: "json" }
  }
})
```

**Expected Outcome**:
- Export JSON includes `version: "1.0"`
- Export has `session` object with metadata
- Export has `nodes` array with 4 nodes
- Node structure:
  - Node 1: `prev: null`, `next: ["{sessionId}:2"]`
  - Node 2: `prev: "{sessionId}:1"`, `next: ["{sessionId}:3", "{sessionId}:4"]`
  - Node 3: `prev: "{sessionId}:2"`, `next: []`
  - Node 4: `prev: "{sessionId}:2"`, `branchOrigin: "{sessionId}:2"`, `branchId: "alt-path"`

**Verification**:
- Parse JSON response
- Verify nodes array length === 4
- Check node 2 has 2 children in next array
- Verify node 4 has branchOrigin pointing to node 2

---

### Test 2.5: Session Integrity Validation
<!-- Citation: src/persistence/filesystem-storage.ts:validateSessionIntegrity(), src/thought-handler.ts:145-156 -->

**Objective**: Verify filesystem integrity check before loading corrupted session.

**Setup**: Create session, manually delete a thought file from filesystem.

**Action**:
```typescript
// Create session with 3 thoughts
// Manually delete thought 002.json from filesystem
// Attempt to load session
thoughtbox_gateway({
  operation: "load_context",
  args: { sessionId }
})
```

**Expected Outcome**:
- Integrity validation detects missing file
- Response is an error
- Error message includes:
  - "Filesystem corruption detected"
  - List of missing files
  - Recovery options
- Session is NOT loaded (ThoughtHandler state unchanged)

**Verification**:
- Check response.isError === true
- Verify error text contains "corruption detected"
- Confirm error lists "002.json" as missing
- Verify thoughtHandler.getCurrentSessionId() remains null

---

## Thought Operation Tests

### Test 3.1: Sequential Thought Auto-Numbering
<!-- Citation: src/thought-handler.ts:316-391, src/gateway/gateway-handler.ts:422-471 -->

**Objective**: Verify automatic thought numbering when thoughtNumber is omitted.

**Setup**: Active session, no thoughts yet.

**Action**:
```typescript
// Omit thoughtNumber and totalThoughts - let server auto-assign
thoughtbox_gateway({
  operation: "thought",
  args: {
    thought: "First auto-numbered thought",
    nextThoughtNeeded: true
  }
})

thoughtbox_gateway({
  operation: "thought",
  args: {
    thought: "Second auto-numbered thought",
    nextThoughtNeeded: true
  }
})

thoughtbox_gateway({
  operation: "thought",
  args: {
    thought: "Third auto-numbered thought",
    nextThoughtNeeded: false
  }
})
```

**Expected Outcome**:
- First thought: `thoughtNumber: 1, totalThoughts: 1`
- Second thought: `thoughtNumber: 2, totalThoughts: 2`
- Third thought: `thoughtNumber: 3, totalThoughts: 3`
- No validation errors
- Thoughts are saved with correct numbers

**Verification**:
- Extract thoughtNumber from each response
- Verify sequential numbering: 1, 2, 3
- Query storage: session.thoughtCount === 3
- Export session: verify linked chain 1←2←3

---

### Test 3.2: Branching Creates Tree Structure
<!-- Citation: src/thought-handler.ts:559-647, src/gateway/gateway-handler.ts:422-471 -->

**Objective**: Verify branching from a thought creates multiple children.

**Setup**: Session with thoughts 1-3.

**Action**:
```typescript
// Create two branches from thought 2
thoughtbox_gateway({
  operation: "thought",
  args: {
    thought: "Branch A from thought 2",
    branchFromThought: 2,
    branchId: "option-a",
    nextThoughtNeeded: true
  }
})

thoughtbox_gateway({
  operation: "thought",
  args: {
    thought: "Branch B from thought 2",
    branchFromThought: 2,
    branchId: "option-b",
    nextThoughtNeeded: false
  }
})
```

**Expected Outcome**:
- Thought 4 (branch A): saved to branch "option-a"
- Thought 5 (branch B): saved to branch "option-b"
- Session branchCount updated to 2
- Response includes `branches: ["option-a", "option-b"]`
- Export shows node 2 with `next: [node3, node4, node5]`

**Verification**:
- Check responses include branchId in confirmation
- Query storage for branches: getBranch(sessionId, "option-a")
- Verify branchCount === 2
- Export and check node 2's next array length === 3

---

### Test 3.3: Revision Tracking
<!-- Citation: src/thought-handler.ts:392-427, src/persistence/types.ts:182-206 -->

**Objective**: Verify revisions create proper pointers and metadata.

**Setup**: Session with thoughts 1-3.

**Action**:
```typescript
thoughtbox_gateway({
  operation: "thought",
  args: {
    thought: "Revised version of thought 2",
    isRevision: true,
    revisesThought: 2,
    nextThoughtNeeded: false
  }
})
```

**Expected Outcome**:
- Thought 4 has `isRevision: true` and `revisesThought: 2`
- Export node 4 has `revisesNode: "{sessionId}:2"`
- Node 4 has `prev: "{sessionId}:3"` (maintains sequential chain)
- Revision metadata includes:
  - `isOriginal: false`
  - `isRevision: true`
  - `revisionDepth: 1`
  - `revisionChainId: "{sessionId}:2"` (groups all revisions of S2)

**Verification**:
- Check thought 4 metadata in response
- Export session and verify node 4's revisesNode pointer
- Verify revision metadata structure
- Query `thoughtbox://revisions/{sessionId}/2` resource

---

### Test 3.4: Read Thoughts Operation
<!-- Citation: src/gateway/gateway-handler.ts:483-589 -->

**Objective**: Verify `read_thoughts` retrieves specific thoughts by various query modes.

**Setup**: Session with thoughts 1-10.

**Action**:
```typescript
// Read specific thought
thoughtbox_gateway({
  operation: "read_thoughts",
  args: { thoughtNumber: 5 }
})

// Read last N thoughts
thoughtbox_gateway({
  operation: "read_thoughts",
  args: { last: 3 }
})

// Read range
thoughtbox_gateway({
  operation: "read_thoughts",
  args: { range: [3, 7] }
})

// Read default (no args - returns last 5)
thoughtbox_gateway({
  operation: "read_thoughts",
  args: {}
})
```

**Expected Outcome**:
- Specific: returns thought 5 only
- Last 3: returns thoughts 8, 9, 10
- Range: returns thoughts 3, 4, 5, 6, 7
- Default: returns thoughts 6, 7, 8, 9, 10
- Each response includes: `sessionId`, `query` description, `count`, `thoughts` array

**Verification**:
- Parse thoughts arrays in responses
- Verify thought counts match expectations
- Check query descriptions are accurate
- Confirm thought objects include metadata (timestamp, branchId, etc.)

---

### Test 3.5: Get Structure Operation
<!-- Citation: src/gateway/gateway-handler.ts:599-695 -->

**Objective**: Verify `get_structure` returns graph topology without content.

**Setup**: Session with:
- Main chain: thoughts 1-5
- Branch from thought 3: thoughts 6-7 (branchId: "alt")
- Revision of thought 2: thought 8

**Action**:
```typescript
thoughtbox_gateway({
  operation: "get_structure",
  args: { sessionId }
})
```

**Expected Outcome**:
- Response includes:
  - `totalThoughts: 8`
  - `mainChain: { length: 5, head: 1, tail: 5 }`
  - `branches: { "alt": { forks: 3, range: [6, 7], length: 2 }}`
  - `branchCount: 1`
  - `revisions: [[8, 2]]` (thought 8 revises thought 2)
  - `revisionCount: 1`
- No thought content included

**Verification**:
- Parse response structure object
- Verify mainChain values
- Check branches object has "alt" key
- Confirm revisions array includes [8, 2] pair
- Verify response size is small (no thought text)

---

### Test 3.6: Verbose vs Minimal Response Mode
<!-- Citation: src/thought-handler.ts:911-954, src/gateway/gateway-handler.ts:422-471 -->

**Objective**: Verify `verbose` flag controls response detail level.

**Setup**: Active session.

**Action**:
```typescript
// Minimal mode (default)
thoughtbox_gateway({
  operation: "thought",
  args: {
    thought: "Test minimal response",
    nextThoughtNeeded: true,
    verbose: false
  }
})

// Verbose mode
thoughtbox_gateway({
  operation: "thought",
  args: {
    thought: "Test verbose response",
    nextThoughtNeeded: false,
    verbose: true
  }
})
```

**Expected Outcome**:
- Minimal response includes ONLY:
  - `thoughtNumber`
  - `sessionId`
- Verbose response includes:
  - `thoughtNumber`
  - `totalThoughts`
  - `nextThoughtNeeded`
  - `branches`
  - `thoughtHistoryLength`
  - `sessionId`
  - Embedded patterns cookbook resource (if applicable)

**Verification**:
- Parse both responses
- Count keys in minimal response: exactly 2
- Count keys in verbose response: 6+
- Check verbose includes branches array
- Verify minimal has no embedded resources (unless thought 1 or last)

---

## Persistence Tests

### Test 4.1: Storage Migration and Schema Versioning
<!-- Citation: src/persistence/migration.ts, src/persistence/filesystem-storage.ts:initialize() -->

**Objective**: Verify storage migrations run correctly on initialization.

**Setup**: Fresh data directory.

**Action**:
```typescript
// Server initialization triggers storage.initialize()
// Check migration status
```

**Expected Outcome**:
- Migration system runs all pending migrations
- SQLite database is created
- Tables are created: sessions, config
- Config table has installId and dataDir
- Migrations are tracked (migration version recorded)

**Verification**:
- Check `~/.thoughtbox/thoughtbox.db` exists
- Query config table for installId
- Verify schema version matches latest migration

---

### Test 4.2: Time Partitioning for Sessions
<!-- Citation: src/persistence/types.ts:14-33, src/persistence/filesystem-storage.ts:createSession() -->

**Objective**: Verify sessions are stored in time-partitioned directories.

**Setup**: Configure sessionPartitionGranularity to 'monthly'.

**Action**:
```typescript
// Create session in December 2025
thoughtbox_gateway({ operation: "start_new", args: { newWork: { project: "test" }}})
thoughtbox_gateway({ operation: "cipher" })
thoughtbox_gateway({
  operation: "thought",
  args: { thought: "Test", nextThoughtNeeded: false }
})
```

**Expected Outcome**:
- Session directory created at: `~/.thoughtbox/sessions/2025-12/{sessionId}/`
- Session metadata includes `partitionPath: "2025-12"`
- Manifest and thought files are in partitioned directory

**Verification**:
- Check filesystem path: `~/.thoughtbox/sessions/2025-12/{sessionId}/session.json`
- Query session from storage: verify partitionPath field
- List directory: confirm structure matches partition

---

### Test 4.3: Session Manifest Accuracy
<!-- Citation: src/persistence/types.ts:287-299, src/persistence/filesystem-storage.ts:saveThought() -->

**Objective**: Verify session manifest tracks all files correctly.

**Setup**: Create session with main chain and branches.

**Action**:
```typescript
// Create thoughts 1-3 on main chain
// Create branch "alt" from thought 2 with thoughts 4-5
```

**Expected Outcome**:
- Manifest file: `{sessionId}/manifest.json`
- Manifest includes:
  - `thoughtFiles: ["001.json", "002.json", "003.json"]`
  - `branchFiles: { "alt": ["001.json", "002.json"] }`
  - Metadata: title, tags, createdAt, updatedAt
  - Version: "1.0.0"

**Verification**:
- Read manifest.json from filesystem
- Parse JSON and verify thoughtFiles array
- Check branchFiles has "alt" key with 2 files
- Confirm metadata matches session

---

### Test 4.4: Concurrent Thought Processing
<!-- Citation: src/thought-handler.ts:69-70, 493-506 -->

**Objective**: Verify thought processing queue prevents race conditions.

**Setup**: Active session.

**Action**:
```typescript
// Send multiple thought operations simultaneously
Promise.all([
  thoughtbox_gateway({ operation: "thought", args: { thought: "A", nextThoughtNeeded: true }}),
  thoughtbox_gateway({ operation: "thought", args: { thought: "B", nextThoughtNeeded: true }}),
  thoughtbox_gateway({ operation: "thought", args: { thought: "C", nextThoughtNeeded: false }})
])
```

**Expected Outcome**:
- All three thoughts succeed
- Thoughts are numbered sequentially: 1, 2, 3
- No race conditions in numbering
- Thoughts are saved in order
- In-memory state is consistent with storage

**Verification**:
- Check all responses have unique thoughtNumbers
- Verify sequential order: 1, 2, 3
- Query storage: session.thoughtCount === 3
- Confirm no duplicate thought files on filesystem

---

### Test 4.5: Export Auto-Triggers on Session Close
<!-- Citation: src/thought-handler.ts:823-903 -->

**Objective**: Verify session auto-exports when `nextThoughtNeeded: false`.

**Setup**: Active session with thoughts 1-3.

**Action**:
```typescript
thoughtbox_gateway({
  operation: "thought",
  args: {
    thought: "Final thought",
    nextThoughtNeeded: false
  }
})
```

**Expected Outcome**:
- Session closes (currentSessionId set to null)
- Auto-export triggered to `~/.thoughtbox/exports/`
- Response includes:
  - `sessionClosed: true`
  - `closedSessionId: "{sessionId}"`
  - `exportPath: "{path-to-export-file}"`
- Export file exists with correct structure
- Event emitter fires session_completed event

**Verification**:
- Check response has exportPath field
- Verify file exists at exportPath
- Read export file: confirm version "1.0", session, nodes
- Query thoughtHandler: getCurrentSessionId() === null

---

## Stage Progression Tests

### Test 5.1: Stage Enforcement for Operations
<!-- Citation: src/gateway/gateway-handler.ts:72-92, 201-212 -->

**Objective**: Verify operations are gated by required stages.

**Setup**: Fresh connection at Stage 0.

**Action**:
```typescript
// Try to call Stage 2 operation at Stage 0
thoughtbox_gateway({
  operation: "thought",
  args: { thought: "Should fail", nextThoughtNeeded: false }
})
```

**Expected Outcome**:
- Response is an error
- Error message: "Operation 'thought' requires stage stage_2, but current stage is stage_0"
- Suggestion: "Call gateway with operation 'cipher' first."
- isError: true

**Verification**:
- Check response.isError === true
- Parse error message for stage mismatch
- Verify suggestion includes correct operation

---

### Test 5.2: Stage Advancement on start_new
<!-- Citation: src/gateway/gateway-handler.ts:280-289, src/init/tool-handler.ts:549-558 -->

**Objective**: Verify `start_new` advances from Stage 0 to Stage 1.

**Setup**: Fresh connection at Stage 0.

**Action**:
```typescript
// Check initial stage
thoughtbox_gateway({ operation: "get_state" })

// Start new work
thoughtbox_gateway({
  operation: "start_new",
  args: { newWork: { project: "test" }}
})

// Check stage again
thoughtbox_gateway({ operation: "get_state" })
```

**Expected Outcome**:
- Initial state: `stage: "stage_1"` (UNINITIALIZED)
- After start_new: stage advances to STAGE_3_FULLY_LOADED (which unlocks Stage 1 operations)
- Stage 1 operations now available: `cipher`, `session`, `deep_analysis`

**Verification**:
- Compare stage in first and third responses
- Verify progression: stage_1 → stage_3 (skip stage_2)
- Attempt `cipher` operation - should succeed

---

### Test 5.3: Stage Advancement on load_context
<!-- Citation: src/gateway/gateway-handler.ts:290-309, src/init/tool-handler.ts:468-476 -->

**Objective**: Verify `load_context` advances from Stage 0 to Stage 1.

**Setup**: Existing session, fresh connection at Stage 0.

**Action**:
```typescript
thoughtbox_gateway({
  operation: "load_context",
  args: { sessionId }
})

thoughtbox_gateway({ operation: "get_state" })
```

**Expected Outcome**:
- load_context succeeds
- State advances to STAGE_3_FULLY_LOADED
- Stage 1 operations available
- Session state includes activeSessionId

**Verification**:
- Check get_state response: stage is stage_3
- Verify session state has activeSessionId
- Attempt session operation - should succeed

---

### Test 5.4: Stage Advancement on cipher Operation
<!-- Citation: src/gateway/gateway-handler.ts:95-105, 280-289 -->

**Objective**: Verify `cipher` advances from Stage 1 to Stage 2.

**Setup**: Stage 1 (after start_new or load_context).

**Action**:
```typescript
thoughtbox_gateway({ operation: "cipher" })

// Verify Stage 2 operations are available
thoughtbox_gateway({
  operation: "thought",
  args: { thought: "Test", nextThoughtNeeded: false }
})
```

**Expected Outcome**:
- cipher operation succeeds
- Response includes cipher notation content
- Response includes "Next Steps" with operation 'thought'
- Stage advances to STAGE_2_CIPHER_LOADED
- Stage 2 operations available: `thought`, `read_thoughts`, `get_structure`, `notebook`, `mental_models`, `knowledge`

**Verification**:
- Check cipher response includes THOUGHTBOX_CIPHER content
- Verify thought operation succeeds (no stage error)
- Check response includes STAGE_2_OPERATIONS_SCHEMA

---

### Test 5.5: Operations Available at Each Stage
<!-- Citation: src/gateway/gateway-handler.ts:72-114 -->

**Objective**: Verify correct operations are available at each stage.

**Setup**: Progress through all stages.

**Action**:
```typescript
// Stage 0
const stage0Ops = ["get_state", "list_sessions", "navigate", "load_context", "start_new", "list_roots", "bind_root"]

// Stage 1 (after start_new)
thoughtbox_gateway({ operation: "start_new", args: { newWork: { project: "test" }}})
const stage1Ops = ["cipher", "session", "deep_analysis"]

// Stage 2 (after cipher)
thoughtbox_gateway({ operation: "cipher" })
const stage2Ops = ["thought", "read_thoughts", "get_structure", "notebook", "mental_models", "knowledge"]

// Test each operation at its required stage
for (const op of [...stage0Ops, ...stage1Ops, ...stage2Ops]) {
  // Call operation and verify success/failure based on current stage
}
```

**Expected Outcome**:
- Stage 0 operations: all succeed at any stage
- Stage 1 operations: fail at Stage 0, succeed at Stage 1+
- Stage 2 operations: fail at Stages 0-1, succeed at Stage 2+

**Verification**:
- Compile table of operation → stage → success/failure
- Verify stage enforcement matches OPERATION_REQUIRED_STAGE mapping
- Confirm no unexpected errors or successes

---

## Integration Tests

### Test 6.1: Full Workflow - New Session to Export
<!-- Citation: Integration of multiple components -->

**Objective**: Verify complete workflow from initialization to export.

**Setup**: Fresh server connection.

**Action**:
```typescript
// 1. Initialize
thoughtbox_gateway({ operation: "get_state" })
thoughtbox_gateway({ operation: "start_new", args: { newWork: { project: "integration-test" }}})
thoughtbox_gateway({ operation: "cipher" })

// 2. Create reasoning chain with branch
thoughtbox_gateway({ operation: "thought", args: { thought: "S1", nextThoughtNeeded: true }})
thoughtbox_gateway({ operation: "thought", args: { thought: "S2", nextThoughtNeeded: true }})
thoughtbox_gateway({ operation: "thought", args: { thought: "S3 main", nextThoughtNeeded: true }})
thoughtbox_gateway({
  operation: "thought",
  args: { thought: "S3 branch", branchFromThought: 2, branchId: "alt", nextThoughtNeeded: true }
})
thoughtbox_gateway({ operation: "thought", args: { thought: "S4", nextThoughtNeeded: false }})

// 3. Read structure
thoughtbox_gateway({ operation: "get_structure" })

// 4. Export
thoughtbox_gateway({
  operation: "session",
  args: { operation: "export", args: { sessionId, format: "json" }}
})
```

**Expected Outcome**:
- All operations succeed in sequence
- Session has 5 thoughts (4 main chain + 1 branch)
- Structure shows branch from thought 2
- Export includes all nodes with correct linkage
- Auto-export also triggered on session close

**Verification**:
- Check each operation response for success
- Verify final session.thoughtCount === 5
- Parse structure: mainChain.length === 4, branchCount === 1
- Verify export JSON structure matches expectations

---

### Test 6.2: Session Resume Across Multiple Stages
<!-- Citation: Integration of init, session, and thought handlers -->

**Objective**: Verify session can be resumed and continued across connections.

**Setup**: Create session, close connection, reconnect.

**Action**:
```typescript
// Connection 1: Create and populate session
// ... create thoughts 1-3 with nextThoughtNeeded: true ...
const sessionId1 = /* capture from response */

// Connection 2: Resume and continue
thoughtbox_gateway({ operation: "load_context", args: { sessionId: sessionId1 }})
thoughtbox_gateway({ operation: "cipher" })
thoughtbox_gateway({ operation: "thought", args: { thought: "S4 after resume", nextThoughtNeeded: false }})
```

**Expected Outcome**:
- load_context restores full state
- Restoration info shows 3 thoughts, current #3
- Thought 4 is correctly auto-numbered
- Session continuity maintained
- Export shows contiguous chain: 1←2←3←4

**Verification**:
- Check restoration info in load_context response
- Verify thought 4 response: `thoughtNumber: 4`
- Query storage: 4 thoughts total
- Export and verify linked structure

---

## Running These Tests

Execute tests using the `thoughtbox_gateway` tool with specified operations and arguments. Each test is independent but some require setup (creating sessions, thoughts, etc.).

**Test Execution Pattern**:
1. Initialize server (or use existing connection)
2. Execute actions via `thoughtbox_gateway` tool calls
3. Capture responses
4. Verify expected outcomes against actual responses
5. Query storage/filesystem as needed for verification
6. Clean up (optional - most tests can use isolated sessions)

**Verification Methods**:
- Parse tool response JSON
- Check for expected fields and values
- Query storage API for session/thought data
- Read exported files from filesystem
- Check embedded resources in responses
- Verify error messages and suggestions

**Citation Format**:
All tests include HTML comments citing source files and line ranges where the tested behavior is implemented.
