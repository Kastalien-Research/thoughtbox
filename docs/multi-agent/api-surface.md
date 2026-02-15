# Multi-Agent API Surface

Concrete examples of every multi-agent operation available to clients.

## Environment Setup

Set these before starting the MCP server:

```bash
export THOUGHTBOX_AGENT_ID="agent-uuid-or-name"
export THOUGHTBOX_AGENT_NAME="Claude Alpha"
```

When set, every thought recorded through the gateway will carry agent attribution automatically.

## Gateway Operations

### Load Extended Cipher

```json
{
  "tool": "thoughtbox_gateway",
  "args": {
    "operation": "cipher"
  }
}
```

Returns the base cipher notation **plus** the formal logic extension:
- `⊢` (turnstile) — proves / syntactic entailment
- `⊨` — semantic entailment / models
- `CLAIM:` — assert a proposition
- `PREMISE:` — support for a claim
- `REFUTE:` — counter a claim

### Post a Thought with Claim Markup

```json
{
  "tool": "thoughtbox_gateway",
  "args": {
    "operation": "thought",
    "args": {
      "thought": "CLAIM: API latency regression caused by query planner change\nPREMISE: [S2] p99 ↑3x after deploy-47\nPREMISE: [S3] EXPLAIN plans show seq scan",
      "nextThoughtNeeded": true
    }
  }
}
```

Response includes `contentHash` (SHA-256) and `agentId` attribution.

### Post a Refutation

```json
{
  "tool": "thoughtbox_gateway",
  "args": {
    "operation": "thought",
    "args": {
      "thought": "REFUTE: ⊖ [S4]/CLAIM bc connection pool exhaustion explains same symptoms\nCLAIM: ¬(query planner regression) — pool size reduced in deploy-46",
      "nextThoughtNeeded": true
    }
  }
}
```

### Read Back Thoughts with Attribution

```json
{
  "tool": "thoughtbox_gateway",
  "args": {
    "operation": "read_thoughts",
    "args": { "last": 5 }
  }
}
```

Each thought in the response includes `agentId`, `agentName`, and `contentHash`.

## Hub Operations

### Register an Agent

```json
{
  "tool": "thoughtbox_hub",
  "args": {
    "operation": "register",
    "args": { "name": "Claude Alpha" }
  }
}
```

Returns `{ agentId, name, registeredAt }`.

### Create and Join a Workspace

```json
{
  "tool": "thoughtbox_hub",
  "args": {
    "operation": "create_workspace",
    "args": {
      "name": "Debug Sprint",
      "description": "Investigating API latency regression"
    }
  }
}
```

First agent in a workspace becomes **coordinator** (can create problems).

### Create a Problem

```json
{
  "tool": "thoughtbox_hub",
  "args": {
    "operation": "create_problem",
    "args": {
      "workspaceId": "ws-uuid",
      "title": "Diagnose API latency",
      "description": "p99 response time doubled after deploy-47"
    }
  }
}
```

### Claim a Problem (Auto-Branch)

```json
{
  "tool": "thoughtbox_hub",
  "args": {
    "operation": "claim_problem",
    "args": {
      "workspaceId": "ws-uuid",
      "problemId": "prob-uuid"
    }
  }
}
```

**No `branchId` required.** The system auto-generates `{agent-slug}/{problemId}`.

If you want a custom branch name:

```json
{
  "tool": "thoughtbox_hub",
  "args": {
    "operation": "claim_problem",
    "args": {
      "workspaceId": "ws-uuid",
      "problemId": "prob-uuid",
      "branchId": "my-custom-branch"
    }
  }
}
```

### Post to a Channel

```json
{
  "tool": "thoughtbox_hub",
  "args": {
    "operation": "post_message",
    "args": {
      "workspaceId": "ws-uuid",
      "problemId": "prob-uuid",
      "content": "Found the root cause — connection pool was undersized"
    }
  }
}
```

### Create a Proposal

```json
{
  "tool": "thoughtbox_hub",
  "args": {
    "operation": "create_proposal",
    "args": {
      "workspaceId": "ws-uuid",
      "title": "Increase connection pool to 50",
      "description": "Current pool of 10 causes exhaustion under load",
      "sourceBranch": "claude-alpha/prob-uuid",
      "problemId": "prob-uuid"
    }
  }
}
```

### Mark Consensus

```json
{
  "tool": "thoughtbox_hub",
  "args": {
    "operation": "mark_consensus",
    "args": {
      "workspaceId": "ws-uuid",
      "name": "Root Cause Identified",
      "description": "Connection pool exhaustion, not query planner",
      "thoughtRef": "session-id#7"
    }
  }
}
```

## Programmatic Access (Library)

The multi-agent module exports these functions for use outside MCP:

```typescript
import {
  computeHash,          // Content-addressable hashing
  resolveParentHash,    // Chain verification
  verifyChain,          // Verify hash chain integrity
  parseClaims,          // Extract CLAIM:/PREMISE:/REFUTE: from text
  detectConflicts,      // Find contradictions between claim sets
  computeBranchDiff,    // Structural diff between branches
  renderTimeline,       // Chronological timeline rendering
  renderSplitDiff,      // Side-by-side branch comparison
  getExtendedCipher,    // Base cipher + logic extension
} from '@kastalien-research/thoughtbox/multi-agent';
```
