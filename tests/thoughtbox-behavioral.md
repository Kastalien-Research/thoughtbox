# Thoughtbox Tool - Behavioral Tests

Workflows for Claude to execute when verifying the thoughtbox thinking tool functions correctly.

---

## Core Reasoning Tests

### Test 1: Basic Forward Thinking Flow

**Goal:** Verify sequential thought progression works.

**Steps:**
1. Call `thoughtbox` with thought 1 of 3, nextThoughtNeeded: true
2. Verify response includes thoughtNumber, totalThoughts, nextThoughtNeeded
3. Call thought 2 of 3
4. Call thought 3 of 3 with nextThoughtNeeded: false
5. Verify patterns cookbook is embedded at thought 1 and final thought

**Expected:** Clean progression with guide at bookends

---

### Test 2: Backward Thinking Flow

**Goal:** Verify goal-driven reasoning (N→1) works.

**Steps:**
1. Start at thought 5 of 5 (the goal state)
2. Progress backward: 4, 3, 2, 1
3. Verify thoughtNumber can decrease while totalThoughts stays constant

**Expected:** Tool accepts backward progression without error

---

### Test 3: Branching Flow

**Goal:** Verify parallel exploration works.

**Steps:**
1. Create thoughts 1-3 normally
2. Branch from thought 2 with branchId "option-a", thoughtNumber 4
3. Branch from thought 2 with branchId "option-b", thoughtNumber 4
4. Verify response includes both branches in branches array
5. Create synthesis thought 5

**Expected:** Multiple branches tracked, can reference later

---

### Test 4: Revision Flow

**Goal:** Verify updating previous thoughts works.

**Steps:**
1. Create thoughts 1-3
2. Create thought 4 with isRevision: true, revisesThought: 2
3. Verify response acknowledges revision

**Expected:** Revision tracked, original thought number referenced

---

### Test 5: Guide Request Flow

**Goal:** Verify on-demand patterns cookbook.

**Steps:**
1. Create thought 10 of 20 with includeGuide: true
2. Verify patterns cookbook is embedded in response
3. Cookbook should include all 6 patterns: forward, backward, branching, revision, interleaved, first principles

**Expected:** Full cookbook available mid-stream when requested

---

### Test 6: Dynamic Adjustment Flow

**Goal:** Verify totalThoughts can be adjusted.

**Steps:**
1. Start with thought 1 of 5
2. At thought 4, realize more needed - set totalThoughts to 10
3. Continue to thought 10
4. Verify tool accepts the adjustment

**Expected:** Flexible estimation, not rigid planning

---

### Test 7: Validation Flow

**Goal:** Verify input validation.

**Steps:**
1. Call without required field (thought) - should error
2. Call without thoughtNumber - should error
3. Call with thoughtNumber > totalThoughts - should auto-adjust totalThoughts
4. Call with invalid types - should error with clear message

**Expected:** Clear validation errors, graceful handling of edge cases

---

## Session Persistence Tests

### Test 8: Auto-Session Creation Flow

**Goal:** Verify sessions are auto-created on thought 1.

**Steps:**
1. Call `thoughtbox` with thought 1 of 5, no sessionTitle
2. Verify response includes `sessionId` (UUID)
3. Continue thoughts 2-5
4. Verify same `sessionId` returned throughout
5. When nextThoughtNeeded: false, verify sessionId becomes null (session ended)

**Expected:** Session auto-created, persists through chain, ends on completion

---

### Test 9: Custom Session Metadata Flow

**Goal:** Verify session title and tags work.

**Steps:**
1. Call `thoughtbox` with thought 1 and:
   ```json
   {
     "thought": "...",
     "thoughtNumber": 1,
     "totalThoughts": 3,
     "nextThoughtNeeded": true,
     "sessionTitle": "Debugging API Timeout",
     "sessionTags": ["debugging", "api", "production"]
   }
   ```
2. Verify session created with custom title
3. Complete the session (thought 3, nextThoughtNeeded: false)

**Expected:** Session has custom title and tags for later discovery

---

### Test 10: Session Persistence Flow

**Goal:** Verify thoughts survive server restart.

**Steps:**
1. Start a reasoning session (thoughts 1-3)
2. Note the sessionId
3. Complete thought 3 with nextThoughtNeeded: true (leave session open)
4. Restart the server (docker-compose down && docker-compose up)
5. Verify session data persisted in filesystem:
   - Check `~/.thoughtbox/sessions/{YYYY-MM}/{sessionId}/`
   - Verify thought files exist: `thought-001.json`, etc.

**Expected:** SQLite tracks sessions, filesystem stores thought content

---

### Test 11: Session Integrity Flow

**Goal:** Verify corrupted sessions are detected.

**Steps:**
1. Create a session with thoughts
2. Manually corrupt or delete a thought file from filesystem
3. Attempt to load the session
4. Verify error message indicates corruption with recovery options

**Expected:** Integrity validation prevents loading corrupted sessions

---

## Running These Tests

Execute by calling the `thoughtbox` MCP tool with specified parameters. The tool outputs to stderr for visual display; verify JSON response matches expectations.

**Session data persists to:**
- SQLite database: `~/.thoughtbox/thoughtbox.db` (session metadata)
- Filesystem: `~/.thoughtbox/sessions/{YYYY-MM}/{sessionId}/` (thought content)

**For a clean slate:**
- Delete `~/.thoughtbox/sessions/` directory
- Or use the db management scripts to clear session data
