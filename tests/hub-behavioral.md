# Hub Operations - Behavioral Tests

Workflows for verifying the `thoughtbox_hub` MCP tool.

**Tool:** `thoughtbox_hub`
**Operations (24):** `register`, `whoami`, `create_workspace`, `join_workspace`, `list_workspaces`, `workspace_status`, `create_problem`, `claim_problem`, `update_problem`, `list_problems`, `add_dependency`, `remove_dependency`, `ready_problems`, `blocked_problems`, `create_sub_problem`, `create_proposal`, `review_proposal`, `merge_proposal`, `list_proposals`, `mark_consensus`, `endorse_consensus`, `list_consensus`, `post_message`, `read_channel`

**Progressive disclosure stages:**
- Stage 0: `register`, `list_workspaces`
- Stage 1: `whoami`, `create_workspace`, `join_workspace`
- Stage 2: All remaining operations (require workspace membership)

---

## HB-001: register

**Goal:** Verify agent registration returns an agentId.

**Steps:**
1. Call `thoughtbox_hub` with `{ operation: "register", args: { name: "test-agent-001" } }`
2. Verify response includes:
   - `agentId` (string, non-empty)
   - `name` matches `"test-agent-001"`
3. Verify no error

**Expected:** Agent registered with unique ID

---

## HB-002: whoami

**Goal:** Verify `whoami` returns current agent identity.

**Prerequisite:** Registered (HB-001).

**Steps:**
1. Register an agent
2. Call `{ operation: "whoami" }`
3. Verify response includes:
   - `agentId` matching registration response
   - `name` matching registration name
4. Verify identity is consistent across calls

**Expected:** Current agent identity returned accurately

---

## HB-003: list_workspaces

**Goal:** Verify listing workspaces works before and after registration.

**Steps:**
1. Call `{ operation: "list_workspaces" }` (even before registering)
2. Verify response includes workspace array (may be empty)
3. Register an agent
4. Create a workspace
5. Call `{ operation: "list_workspaces" }` again
6. Verify the new workspace appears in the list
7. Each workspace should have: `id`, `name`, `description`

**Expected:** Workspaces listed regardless of registration state

---

## HB-004: create_workspace

**Goal:** Verify workspace creation.

**Prerequisite:** Registered.

**Steps:**
1. Register
2. Call `{ operation: "create_workspace", args: { name: "test-workspace", description: "A workspace for behavioral tests" } }`
3. Verify response includes:
   - `workspaceId` (string, non-empty)
   - `name` matches
4. Call `list_workspaces` to verify it appears

**Expected:** Workspace created and discoverable

---

## HB-005: join_workspace

**Goal:** Verify joining an existing workspace.

**Prerequisite:** Workspace exists (HB-004).

**Steps:**
1. Register a new agent (different from workspace creator)
2. Call `{ operation: "join_workspace", args: { workspaceId: "<id>" } }`
3. Verify success response
4. Call `workspace_status` to verify agent appears as member

**Expected:** Agent joins workspace, visible in membership

---

## HB-006: workspace_status

**Goal:** Verify workspace status returns agents and activity.

**Prerequisite:** Workspace with at least one member.

**Steps:**
1. Register and join a workspace
2. Call `{ operation: "workspace_status", args: { workspaceId: "<id>" } }`
3. Verify response includes:
   - Workspace metadata (name, description)
   - `agents` array with member details
   - Current agent appears in members list

**Expected:** Workspace status with accurate membership

---

## HB-007: create_problem

**Goal:** Verify problem definition in a workspace.

**Prerequisite:** Member of a workspace.

**Steps:**
1. Register, create workspace, join
2. Call `{ operation: "create_problem", args: { workspaceId: "<ws-id>", title: "Test Problem", description: "A problem for behavioral testing" } }`
3. Verify response includes:
   - `problemId` (string, non-empty)
   - `title` matches
   - `status` is `"open"`
4. Call `list_problems` to verify it appears

**Expected:** Problem created with open status

---

## HB-008: claim_problem

**Goal:** Verify claiming a problem auto-generates a branch.

**Prerequisite:** An open problem exists (HB-007).

**Steps:**
1. Create a problem
2. Call `{ operation: "claim_problem", args: { workspaceId: "<ws-id>", problemId: "<prob-id>" } }`
3. Verify response includes:
   - `branchId` (auto-generated)
   - `claimedBy` matches current agent
4. Verify problem status changed to `"in-progress"` (or similar)

**Expected:** Problem claimed, branch auto-created for isolated work

---

## HB-009: update_problem

**Goal:** Verify status progression: open → in-progress → resolved → closed.

**Prerequisite:** A claimed problem.

**Steps:**
1. Create and claim a problem (now in-progress)
2. Call `{ operation: "update_problem", args: { workspaceId: "<ws-id>", problemId: "<prob-id>", status: "resolved" } }`
3. Verify status updated to `"resolved"`
4. Call `{ operation: "update_problem", args: { ..., status: "closed" } }`
5. Verify status updated to `"closed"`

**Expected:** Status transitions work through the full lifecycle

---

## HB-010: list_problems

**Goal:** Verify listing all workspace problems.

**Prerequisite:** Workspace with problems.

**Steps:**
1. Create 2+ problems in a workspace
2. Call `{ operation: "list_problems", args: { workspaceId: "<ws-id>" } }`
3. Verify all problems returned
4. Each problem has: `problemId`, `title`, `status`, `claimedBy` (if claimed)

**Expected:** Complete problem list for workspace

---

## HB-011: add_dependency

**Goal:** Verify adding a dependency between problems.

**Steps:**
1. Create problem A and problem B in same workspace
2. Call `{ operation: "add_dependency", args: { workspaceId: "<ws-id>", problemId: "<B-id>", dependsOn: "<A-id>" } }`
3. Verify success response
4. Call `list_problems` or inspect problem B to verify dependency recorded

**Expected:** B now depends on A (B is blocked until A is resolved)

---

## HB-012: remove_dependency

**Goal:** Verify removing a dependency between problems.

**Prerequisite:** Dependency exists (HB-011).

**Steps:**
1. Add dependency B → A
2. Call `{ operation: "remove_dependency", args: { workspaceId: "<ws-id>", problemId: "<B-id>", dependsOn: "<A-id>" } }`
3. Verify success response
4. Verify dependency no longer recorded on problem B

**Expected:** Dependency removed, B is no longer blocked by A

---

## HB-013: ready_problems

**Goal:** Verify listing problems with all dependencies resolved.

**Steps:**
1. Create problems A, B, C
2. Add dependency: B depends on A
3. Call `{ operation: "ready_problems", args: { workspaceId: "<ws-id>" } }`
4. Verify A and C appear (no unresolved dependencies)
5. Verify B does NOT appear (blocked by A)
6. Resolve problem A
7. Call `ready_problems` again
8. Verify B now appears (dependency resolved)

**Expected:** Only unblocked problems returned; resolving blockers unblocks dependents

---

## HB-014: blocked_problems

**Goal:** Verify listing problems still blocked by dependencies.

**Steps:**
1. Create problems A, B with dependency B → A
2. Call `{ operation: "blocked_problems", args: { workspaceId: "<ws-id>" } }`
3. Verify B appears with its blocking dependencies listed
4. Verify A does NOT appear (not blocked)

**Expected:** Only blocked problems returned, with their blockers identified

---

## HB-015: create_sub_problem

**Goal:** Verify creating a hierarchical sub-problem under a parent.

**Steps:**
1. Create parent problem P
2. Call `{ operation: "create_sub_problem", args: { workspaceId: "<ws-id>", parentProblemId: "<P-id>", title: "Sub-task 1", description: "A child problem" } }`
3. Verify response includes:
   - `problemId` (new, different from parent)
   - `parentProblemId` matches P
4. Call `list_problems` and verify the sub-problem appears with parent reference

**Expected:** Sub-problem created with parent linkage

---

## HB-016: create_proposal

**Goal:** Verify proposal creation with source branch.

**Prerequisite:** A claimed problem with a branch.

**Steps:**
1. Create and claim a problem (generates a branch)
2. Call `{ operation: "create_proposal", args: { workspaceId: "<ws-id>", problemId: "<prob-id>", sourceBranch: "<branch-id>", title: "Fix for test problem", description: "Proposed solution" } }`
3. Verify response includes:
   - `proposalId` (string, non-empty)
   - `status` is `"open"` or `"pending"`
   - `sourceBranch` matches

**Expected:** Proposal created linking branch to problem

---

## HB-017: review_proposal

**Goal:** Verify proposal review with approve/request-changes/comment.

**Prerequisite:** A proposal exists (HB-016).

**Steps:**
1. Create a proposal
2. Call `{ operation: "review_proposal", args: { workspaceId: "<ws-id>", proposalId: "<prop-id>", verdict: "approve", comment: "Looks good" } }`
3. Verify response records the review
4. Create another proposal and review with `verdict: "request-changes"`
5. Verify the review is recorded with change requests
6. Review with `verdict: "comment"` (neutral feedback)
7. Verify comment recorded without approval/rejection

**Expected:** All three review types work correctly

---

## HB-018: merge_proposal

**Goal:** Verify merging an approved proposal.

**Prerequisite:** An approved proposal.

**Steps:**
1. Create and approve a proposal
2. Call `{ operation: "merge_proposal", args: { workspaceId: "<ws-id>", proposalId: "<prop-id>" } }`
3. Verify success response
4. Verify proposal status changes to `"merged"`
5. Verify the associated branch content is merged

**Expected:** Proposal merged, status updated

---

## HB-019: list_proposals

**Goal:** Verify listing all proposals in a workspace.

**Prerequisite:** At least one proposal exists.

**Steps:**
1. Create 2+ proposals
2. Call `{ operation: "list_proposals", args: { workspaceId: "<ws-id>" } }`
3. Verify all proposals returned
4. Each proposal has: `proposalId`, `title`, `status`, `sourceBranch`

**Expected:** Complete proposal list for workspace

---

## HB-020: mark_consensus

**Goal:** Verify marking a consensus decision point.

**Prerequisite:** Workspace member.

**Steps:**
1. Call `{ operation: "mark_consensus", args: { workspaceId: "<ws-id>", topic: "API Design Decision", decision: "Use REST over GraphQL", thoughtRef: "<session-id>:<thought-number>" } }`
2. Verify response includes:
   - `consensusId` (string, non-empty)
   - `topic` matches
   - `decision` matches
3. Verify consensus recorded

**Expected:** Consensus marker created with thought reference

---

## HB-021: endorse_consensus

**Goal:** Verify endorsing an existing consensus marker.

**Prerequisite:** A consensus marker exists (HB-020).

**Steps:**
1. Mark a consensus decision
2. Call `{ operation: "endorse_consensus", args: { workspaceId: "<ws-id>", consensusId: "<cons-id>" } }`
3. Verify success response
4. Verify endorsement count increased
5. Verify current agent listed as endorser

**Expected:** Endorsement recorded, agent listed as endorser

---

## HB-022: list_consensus

**Goal:** Verify listing consensus markers.

**Prerequisite:** At least one consensus marker exists.

**Steps:**
1. Create 2+ consensus markers
2. Call `{ operation: "list_consensus", args: { workspaceId: "<ws-id>" } }`
3. Verify all consensus markers returned
4. Each marker has: `consensusId`, `topic`, `decision`, `endorsements`

**Expected:** Complete consensus list for workspace

---

## HB-023: post_message

**Goal:** Verify posting a message to a problem channel.

**Prerequisite:** A problem exists in the workspace.

**Steps:**
1. Create a problem
2. Call `{ operation: "post_message", args: { workspaceId: "<ws-id>", problemId: "<prob-id>", content: "Working on this now", ref: "<optional-thought-ref>" } }`
3. Verify success response
4. Verify message includes sender (current agent) and timestamp

**Expected:** Message posted to problem's channel

---

## HB-024: read_channel

**Goal:** Verify reading all messages in a problem's channel.

**Prerequisite:** Messages exist in a problem channel (HB-023).

**Steps:**
1. Post 2+ messages to a problem channel
2. Call `{ operation: "read_channel", args: { workspaceId: "<ws-id>", problemId: "<prob-id>" } }`
3. Verify all messages returned in order
4. Each message has: `sender`, `content`, `timestamp`
5. Verify messages appear in chronological order

**Expected:** Complete message history for problem channel

---

## HB-025: Progressive Disclosure — Operations Before Registration

**Goal:** Verify operations that require registration fail with helpful error when called before registering.

**Steps:**
1. Do NOT register (fresh state)
2. Call `{ operation: "whoami" }` (requires Stage 1 = registered)
3. Verify error response
4. Verify error message mentions needing to register first
5. Call `{ operation: "create_workspace", args: { name: "test" } }` (also requires registration)
6. Verify same helpful error pattern
7. Verify `list_workspaces` still works (Stage 0 — no registration needed)
8. Verify `register` still works (Stage 0)

**Expected:** Stage 1+ operations blocked with actionable guidance; Stage 0 operations always available

---

## Running These Tests

Execute by calling the `thoughtbox_hub` MCP tool with the specified operation and args.

**Test order matters:** Many hub tests build on each other. Recommended execution order:
1. HB-025 (progressive disclosure — run first with clean state)
2. HB-001–HB-002 (registration)
3. HB-003–HB-006 (workspace management)
4. HB-007–HB-015 (problem management and dependencies)
5. HB-016–HB-019 (proposals)
6. HB-020–HB-022 (consensus)
7. HB-023–HB-024 (messaging)

**Clean slate:** Hub state is persistent. For isolated testing, use unique agent names and workspace names per test run.
