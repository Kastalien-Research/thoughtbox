# 07 — Hub (`tb.hub.*` via `thoughtbox_execute`)

Stage: Always-on (`tb.hub.*` available when hubStorage is wired at server creation)
28 operations across 7 categories: identity, agent, problems, proposals, consensus, channels, status

**Primary path:** every test runs JavaScript against the `tb.hub` namespace inside `thoughtbox_execute`. SDK method names are camelCase (`tb.hub.quickJoin`, `tb.hub.createProblem`, ...); the canonical mapping to snake_case hub operations lives in `src/code-mode/execute-tool.ts` (`HUB_SDK_METHODS`).

**Identity model:** the hub keeps a per-MCP-session identity registry. The first `tb.hub.register` / `tb.hub.quickJoin` in a session becomes the implicit default agentId for all later hub calls in that session. An explicit `agentId` argument is accepted only if that agentId was registered in the SAME session. Re-registering creates a NEW agentId (and coordinator role stays bound to the creating agentId).

**One mutation per call:** submit one state-mutating hub call per `thoughtbox_execute` invocation. Read-only operations (`tb.hub.whoami`, `tb.hub.listWorkspaces`, `tb.hub.readChannel`, `tb.hub.workspaceStatus`, `tb.hub.workspaceDigest`, `tb.hub.listProblems`, `tb.hub.listProposals`, `tb.hub.listConsensus`, `tb.hub.readyProblems`, `tb.hub.blockedProblems`) may be chained freely.

**Local-HTTP alternative (explicitly non-MCP):** in local mode the server also exposes `POST /hub/api` for non-MCP clients. That surface has no MCP-session identity registry, so every request must carry an explicit agentId. Use it only when testing the HTTP adapter itself, not as the primary path for this suite.

---

## Test 1: Register Agent

**Goal:** Verify agent registration.

**Steps:**
1. Execute: `async () => tb.hub.register({ name: "test-agent" })`
2. Verify response includes `agentId`, `name`, `role: "contributor"`

**Expected:** Unique agentId assigned; it becomes the session's implicit identity

---

## Test 2: Whoami

**Goal:** Verify identity retrieval.

**Steps:**
1. Register as "test-agent"
2. Execute: `async () => tb.hub.whoami()`
3. Verify response includes agentId, name, workspaces list

**Expected:** Current (implicit session) identity returned without passing agentId

---

## Test 3: Quick Join

**Goal:** Verify register + join in one call.

**Steps:**
1. Register a coordinator and create a workspace
2. Execute: `async () => tb.hub.quickJoin({ name: "sub-agent", workspaceId: "<id>" })`
3. Verify response includes agentId and workspace state

**Expected:** Single call registers and joins

---

## Test 4: Create and List Workspaces

**Goal:** Verify workspace lifecycle.

**Steps:**
1. Register, then execute: `async () => tb.hub.createWorkspace({ name: "test-ws", description: "Test workspace" })`
2. Verify `workspaceId` returned, caller becomes coordinator
3. Execute: `async () => tb.hub.listWorkspaces()`
4. Verify workspace appears in list

**Expected:** Workspace created, discoverable

---

## Test 5: Join Workspace

**Goal:** Verify joining existing workspace.

**Steps:**
1. Create workspace as agent A
2. Register agent B (`tb.hub.register({ name: "agent-b" })`), then execute: `async () => tb.hub.joinWorkspace({ workspaceId: "<id>", agentId: "<B's agentId>" })`
3. Verify response includes workspace state with problems and proposals

**Expected:** Agent B is now a workspace member (explicit agentId works because B was registered in this session)

---

## Test 6: Problem Lifecycle

**Goal:** Verify create → claim → update → resolve.

**Steps:**
1. Setup: register + create workspace
2. Execute: `async () => tb.hub.createProblem({ workspaceId: "<id>", title: "Bug fix", description: "Fix it" })`
3. Verify `problemId` and `channelId` returned
4. Execute: `async () => tb.hub.claimProblem({ workspaceId: "<id>", problemId: "<id>" })`
5. Verify status is "in-progress", branchId auto-generated
6. Execute: `async () => tb.hub.updateProblem({ workspaceId: "<id>", problemId: "<id>", status: "resolved", resolution: "Fixed" })`
7. Verify status updated

**Expected:** Full problem lifecycle works

---

## Test 7: Dependencies

**Goal:** Verify problem dependency tracking.

**Steps:**
1. Create problems A and B
2. Execute: `async () => tb.hub.addDependency({ workspaceId: "<id>", problemId: "B", dependsOnProblemId: "A" })`
3. Execute: `async () => tb.hub.blockedProblems({ workspaceId: "<id>" })` — B should be blocked
4. Execute: `async () => tb.hub.readyProblems({ workspaceId: "<id>" })` — A should be ready, B should not
5. Resolve A, then call `readyProblems` again — B should now be ready
6. Execute: `async () => tb.hub.removeDependency({ workspaceId: "<id>", problemId: "B", dependsOnProblemId: "A" })` — verify removal works

**Expected:** Dependencies tracked, ready/blocked computed correctly

---

## Test 8: Sub-Problems

**Goal:** Verify sub-problem creation.

**Steps:**
1. Create parent problem
2. Execute: `async () => tb.hub.createSubProblem({ workspaceId: "<id>", parentId: "<id>", title: "Sub-task", description: "Part of parent" })`
3. Verify sub-problem created with own problemId

**Expected:** Sub-problem linked to parent

---

## Test 9: Proposal → Review → Merge

**Goal:** Verify full proposal lifecycle.

**Prerequisite:** `tb.hub.mergeProposal` records a merge thought in the workspace's `mainSessionId`. The workspace must have an active thought session for merge to succeed. If the workspace was created without `sessionId`, the auto-generated `mainSessionId` may not correspond to a persisted session — this causes "Session not found" errors on merge.

**Steps:**
1. Register agents A (coordinator) and B in this session
2. **Before creating the workspace**, start a thought session and note the sessionId
3. Create workspace with `sessionId: "<id>"` to bind the session
4. B creates a proposal: `async () => tb.hub.createProposal({ workspaceId: "<id>", title: "Fix", description: "Details", sourceBranch: "fix-branch", agentId: "<B>" })`
5. A reviews: `async () => tb.hub.reviewProposal({ workspaceId: "<id>", proposalId: "<id>", verdict: "approve", reasoning: "Looks good", agentId: "<A>" })`
6. A merges: `async () => tb.hub.mergeProposal({ workspaceId: "<id>", proposalId: "<id>", mergeMessage: "Merged fix", agentId: "<A>" })` — must run in the session where A registered (coordinator role is session-bound)
7. Verify proposal status is "merged"
8. Execute `tb.hub.listProposals({ workspaceId: "<id>", status: "merged" })` to confirm

**Known issue (2026-03-21):** If workspace is created without binding a pre-existing session, `merge_proposal` fails with "Session not found" because the auto-generated `mainSessionId` is not persisted. This is a server bug.

**Expected:** Full proposal lifecycle — cannot self-review, requires approval to merge

---

## Test 10: Consensus

**Goal:** Verify consensus marking and endorsement.

**Steps:**
1. Coordinator executes: `async () => tb.hub.markConsensus({ workspaceId: "<id>", name: "Use HTTP", description: "HTTP only, no STDIO", thoughtRef: 5 })` — `thoughtRef` is a NUMBER
2. Verify `consensusId` returned
3. Another agent executes: `async () => tb.hub.endorseConsensus({ workspaceId: "<id>", consensusId: "<id>", agentId: "<other agent>" })` — param is `consensusId`, not markerId
4. Execute: `async () => tb.hub.listConsensus({ workspaceId: "<id>" })` — verify marker with endorsement

**Expected:** Consensus tracked with endorsements

---

## Test 11: Channel Messaging

**Goal:** Verify problem-scoped messaging.

**Steps:**
1. Create workspace and problem
2. Execute: `async () => tb.hub.postMessage({ workspaceId: "<id>", problemId: "<id>", content: "Working on it" })`
3. Execute: `async () => tb.hub.readChannel({ workspaceId: "<id>", problemId: "<id>" })`
4. Verify message appears with correct agentId attribution
5. Execute: `async () => tb.hub.postSystemMessage({ workspaceId: "<id>", problemId: "<id>", content: "Status: in-progress" })`
6. Read channel again — verify system message has `agentId: "system"`

**Expected:** Messages attributed to correct agents, system messages distinct

---

## Test 12: Workspace Status and Digest

**Goal:** Verify workspace overview operations.

**Steps:**
1. Create workspace with agents, problems, proposals
2. Execute: `async () => tb.hub.workspaceStatus({ workspaceId: "<id>" })` — verify agents, problem counts
3. Execute: `async () => tb.hub.workspaceDigest({ workspaceId: "<id>" })` — verify comprehensive view

**Expected:** Status gives summary, digest gives full picture (both read-only, may be chained in one execute call)

---

## Test 13: Profile Prompts

**Goal:** Verify behavioral prompt retrieval.

**Steps:**
1. Execute: `async () => tb.hub.getProfilePrompt({ profile: "ARCHITECT" })`
2. Verify response includes behavioral prompt content
3. Call with each profile: MANAGER, DEBUGGER, SECURITY, RESEARCHER, REVIEWER

**Expected:** Each profile returns distinct behavioral guidance

---

## Test 14: Multi-Agent Attribution (Session Identity Registry)

**Goal:** Verify correct identity in shared sessions.

**Steps:**
1. Register agents A and B in the same MCP session (two register calls; A is the implicit default)
2. A creates workspace, B joins (explicit `agentId: B`)
3. A creates problem; B posts message with `agentId: "<B's agentId>"`
4. Read channel — verify message attributed to B, not A
5. Negative check: pass an agentId that was NOT registered in this session — expect error "Agent <id> not registered in this session. Call register first."

**Expected:** agentId override correctly attributes actions; identities from other sessions are rejected

---

## Test 15: Error — Unregistered Agent

**Goal:** Verify progressive disclosure enforcement.

**Steps:**
1. In a fresh MCP session, without registering, execute: `async () => tb.hub.createWorkspace({ name: "x", description: "y" })`
2. Verify error: "Register first"

**Expected:** Clear error with recovery guidance
