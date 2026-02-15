# Multi-Agent Information Flow

Data flow traces through the multi-agent system from three angles.

## 1. Single Thought Lifecycle

A single thought from creation to persistence:

```
Client calls:
  thoughtbox_gateway { operation: "thought", args: { thought: "CLAIM: API latency ↑" ... } }

GatewayHandler.handleThought()
  │ agentId injected from config (env var → constructor → handleThought)
  │ agentName injected same path
  ▼
ThoughtHandler.processThought(input)
  │
  ├── Auto-assign thoughtNumber if not provided (SIL-102)
  ├── Compute contentHash:
  │     computeHash({ thought, thoughtNumber, agentId?, parentHash? })
  │     → SHA-256 hex digest
  │
  ├── Resolve parentHash:
  │     resolveParentHash(storage, sessionId, thoughtNumber)
  │     → previous thought's contentHash or GENESIS_HASH
  │
  ├── Build ThoughtData:
  │     { thought, thoughtNumber, totalThoughts, nextThoughtNeeded,
  │       agentId, agentName, contentHash, timestamp, ... }
  │
  ├── Persist via storage.saveThought(sessionId, thoughtData)
  │
  └── Return formatted response with thoughtNumber, contentHash
```

**Key invariant**: Every thought has a `contentHash` computed from its content and lineage. Agent identity is optional but propagated when available.

## 2. Conflict Detection Flow

Two agents posting contradictory claims:

```
Agent-A posts: "CLAIM: API latency caused by db regression"
Agent-B posts: "CLAIM: ¬(API latency caused by db regression)"
                "REFUTE: [S3] ⊖ Agent-A/CLAIM bc log vol w/in normal range"

                        ┌─────────────────────┐
                        │  parseClaims(text)   │  ← M4: claim-parser
                        │  Returns:            │
                        │  - claims[]          │
                        │  - premises[]        │
                        │  - refutations[]     │
                        │  - derivations[]     │
                        └──────────┬───────────┘
                                   │
                   ┌───────────────┴───────────────┐
                   ▼                               ▼
          Agent-A claims:                 Agent-B claims:
          ["API latency caused            ["¬(API latency caused
           by db regression"]              by db regression)"]

                        ┌─────────────────────┐
                        │ detectConflicts(     │  ← M5: conflict-detection
                        │   claimsA, claimsB   │
                        │ )                    │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ConflictResult {
                          hasConflicts: true,
                          conflicts: [{
                            claimA: "API latency...",
                            claimB: "¬(API latency...)",
                            type: "negation"
                          }]
                        }

                        ┌─────────────────────┐
                        │ computeBranchDiff()  │  ← M6: thought-diff
                        │ renderSplitDiff()    │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        Human-readable split diff:
                        ┌─ Agent-A ──────┬─ Agent-B ──────┐
                        │ S1: CLAIM:...  │ S1: CLAIM: ¬.. │
                        └────────────────┴────────────────┘
```

## 3. Multi-Agent Collaboration Flow

Full lifecycle from registration to consensus:

```
Step 1: Register
  thoughtbox_hub { operation: "register", args: { name: "Claude Alpha" } }
  → { agentId: "uuid-1", name: "Claude Alpha" }

Step 2: Create workspace
  thoughtbox_hub { operation: "create_workspace",
    args: { name: "Debug Sprint", description: "..." } }
  → { workspaceId: "ws-1", mainSessionId: "sess-1" }
  (First agent becomes coordinator)

Step 3: Other agents join
  thoughtbox_hub { operation: "join_workspace",
    args: { workspaceId: "ws-1" } }

Step 4: Coordinator creates problem
  thoughtbox_hub { operation: "create_problem",
    args: { workspaceId: "ws-1", title: "Fix latency", description: "..." } }
  → { problemId: "prob-1", channelId: "prob-1" }

Step 5: Agent claims problem (auto-branch)
  thoughtbox_hub { operation: "claim_problem",
    args: { workspaceId: "ws-1", problemId: "prob-1" } }
  → { branchId: "claude-alpha/prob-1", branchFromThought: 5 }
  (No branchId needed — auto-generated from agent name + problem ID)

Step 6: Agent works on branch
  thoughtbox_gateway { operation: "thought",
    args: { thought: "CLAIM: ...", branchId: "claude-alpha/prob-1",
            branchFromThought: 5, ... } }

Step 7: Agents communicate via channels
  thoughtbox_hub { operation: "post_message",
    args: { workspaceId: "ws-1", problemId: "prob-1",
            content: "Found root cause in query planner" } }

Step 8: Proposal + Review + Merge cycle
  create_proposal → review_proposal → merge_proposal

Step 9: Consensus
  thoughtbox_hub { operation: "mark_consensus",
    args: { workspaceId: "ws-1", name: "Root Cause",
            description: "Query planner regression",
            thoughtRef: "sess-1#7" } }
```
