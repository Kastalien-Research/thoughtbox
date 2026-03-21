# 07 — thoughtbox_hub

Stage: Always-on (registered when hubStorage provided)
28 operations across 7 categories: identity, agent, problems, proposals, consensus, channels, status
All parameters are top-level (flat schema, not nested in args)

---

## Test 1: Register Agent

**Goal:** Verify agent registration.

**Steps:**
1. Call `thoughtbox_hub { operation: "register", name: "test-agent" }`
2. Verify response includes `agentId`, `name`, `role: "contributor"`

**Expected:** Unique agentId assigned

---

## Test 2: Whoami

**Goal:** Verify identity retrieval.

**Steps:**
1. Register as "test-agent"
2. Call `{ operation: "whoami" }`
3. Verify response includes agentId, name, workspaces list

**Expected:** Current identity returned

---

## Test 3: Quick Join

**Goal:** Verify register + join in one call.

**Steps:**
1. Register a coordinator and create a workspace
2. Call `{ operation: "quick_join", name: "sub-agent", workspaceId: "<id>" }`
3. Verify response includes agentId and workspace state

**Expected:** Single call registers and joins

---

## Test 4: Create and List Workspaces

**Goal:** Verify workspace lifecycle.

**Steps:**
1. Register, then call `{ operation: "create_workspace", name: "test-ws", description: "Test workspace" }`
2. Verify `workspaceId` returned, caller becomes coordinator
3. Call `{ operation: "list_workspaces" }`
4. Verify workspace appears in list

**Expected:** Workspace created, discoverable

---

## Test 5: Join Workspace

**Goal:** Verify joining existing workspace.

**Steps:**
1. Create workspace as agent A
2. Register agent B, call `{ operation: "join_workspace", workspaceId: "<id>" }`
3. Verify response includes workspace state with problems and proposals

**Expected:** Agent B is now a workspace member

---

## Test 6: Problem Lifecycle

**Goal:** Verify create → claim → update → resolve.

**Steps:**
1. Setup: register + create workspace
2. Call `{ operation: "create_problem", workspaceId: "<id>", title: "Bug fix", description: "Fix it" }`
3. Verify `problemId` and `channelId` returned
4. Call `{ operation: "claim_problem", workspaceId: "<id>", problemId: "<id>" }`
5. Verify status is "in-progress", branchId auto-generated
6. Call `{ operation: "update_problem", workspaceId: "<id>", problemId: "<id>", status: "resolved", resolution: "Fixed" }`
7. Verify status updated

**Expected:** Full problem lifecycle works

---

## Test 7: Dependencies

**Goal:** Verify problem dependency tracking.

**Steps:**
1. Create problems A and B
2. Call `{ operation: "add_dependency", workspaceId: "<id>", problemId: "B", dependsOnProblemId: "A" }`
3. Call `{ operation: "blocked_problems", workspaceId: "<id>" }` — B should be blocked
4. Call `{ operation: "ready_problems", workspaceId: "<id>" }` — A should be ready, B should not
5. Resolve A, then call `ready_problems` again — B should now be ready
6. Call `{ operation: "remove_dependency", ... }` — verify removal works

**Expected:** Dependencies tracked, ready/blocked computed correctly

---

## Test 8: Sub-Problems

**Goal:** Verify sub-problem creation.

**Steps:**
1. Create parent problem
2. Call `{ operation: "create_sub_problem", workspaceId: "<id>", parentId: "<id>", title: "Sub-task", description: "Part of parent" }`
3. Verify sub-problem created with own problemId

**Expected:** Sub-problem linked to parent

---

## Test 9: Proposal → Review → Merge

**Goal:** Verify full proposal lifecycle.

**Prerequisite:** `merge_proposal` records a merge thought in the workspace's `mainSessionId`. The workspace must have an active thought session for merge to succeed. If the workspace was created without `sessionId`, the auto-generated `mainSessionId` may not correspond to a persisted session — this causes "Session not found" errors on merge.

**Steps:**
1. Register agents A (coordinator) and B
2. **Before creating the workspace**, start a thought session and note the sessionId
3. Create workspace with `sessionId: "<id>"` to bind the session
4. B creates a proposal: `{ operation: "create_proposal", workspaceId: "<id>", title: "Fix", description: "Details", sourceBranch: "fix-branch" }`
5. A reviews: `{ operation: "review_proposal", ..., verdict: "approve", reasoning: "Looks good" }`
6. A merges: `{ operation: "merge_proposal", ..., mergeMessage: "Merged fix" }`
7. Verify proposal status is "merged"
8. Call `list_proposals` with `proposalStatus: "merged"` to confirm

**Known issue (2026-03-21):** If workspace is created without binding a pre-existing session, `merge_proposal` fails with "Session not found" because the auto-generated `mainSessionId` is not persisted. This is a server bug.

**Expected:** Full proposal lifecycle — cannot self-review, requires approval to merge

---

## Test 10: Consensus

**Goal:** Verify consensus marking and endorsement.

**Steps:**
1. Coordinator calls `{ operation: "mark_consensus", workspaceId: "<id>", name: "Use HTTP", description: "HTTP only, no STDIO", thoughtRef: 5 }`
2. Verify `consensusId` returned
3. Another agent calls `{ operation: "endorse_consensus", workspaceId: "<id>", consensusId: "<id>" }`
4. Call `{ operation: "list_consensus", workspaceId: "<id>" }` — verify marker with endorsement

**Expected:** Consensus tracked with endorsements

---

## Test 11: Channel Messaging

**Goal:** Verify problem-scoped messaging.

**Steps:**
1. Create workspace and problem
2. Call `{ operation: "post_message", workspaceId: "<id>", problemId: "<id>", content: "Working on it" }`
3. Call `{ operation: "read_channel", workspaceId: "<id>", problemId: "<id>" }`
4. Verify message appears with correct agentId attribution
5. Call `{ operation: "post_system_message", ..., content: "Status: in-progress" }`
6. Read channel again — verify system message has `agentId: "system"`

**Expected:** Messages attributed to correct agents, system messages distinct

---

## Test 12: Workspace Status and Digest

**Goal:** Verify workspace overview operations.

**Steps:**
1. Create workspace with agents, problems, proposals
2. Call `{ operation: "workspace_status", workspaceId: "<id>" }` — verify agents, problem counts
3. Call `{ operation: "workspace_digest", workspaceId: "<id>" }` — verify comprehensive view

**Expected:** Status gives summary, digest gives full picture

---

## Test 13: Profile Prompts

**Goal:** Verify behavioral prompt retrieval.

**Steps:**
1. Call `{ operation: "get_profile_prompt", profile: "ARCHITECT" }`
2. Verify response includes behavioral prompt content
3. Call with each profile: MANAGER, DEBUGGER, SECURITY, RESEARCHER, REVIEWER

**Expected:** Each profile returns distinct behavioral guidance

---

## Test 14: Multi-Agent Attribution

**Goal:** Verify correct identity in shared sessions.

**Steps:**
1. Register agents A and B in the same session
2. A creates workspace, B joins
3. A creates problem, B posts message with `agentId: B.agentId`
4. Read channel — verify message attributed to B, not A

**Expected:** agentId override correctly attributes actions

---

## Test 15: Error — Unregistered Agent

**Goal:** Verify progressive disclosure enforcement.

**Steps:**
1. Without registering, call `{ operation: "create_workspace", ... }`
2. Verify error: "Register first"

**Expected:** Clear error with recovery guidance
