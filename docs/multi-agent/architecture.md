# Multi-Agent Architecture

System shape and module dependency graph for multi-agent collaboration in Thoughtbox.

## Module Dependency Graph (M1–M9)

```
M1  content-hash          — Content-addressable thought hashing (SHA-256)
M2  thought-attribution   — Agent ID/name injection into ThoughtData
M3  cipher-extension      — Formal logic notation (⊢ ⊨ CLAIM:/PREMISE:/REFUTE:)
M4  claim-parser          — Extract structured claims from thought text
M5  conflict-detection    — Detect contradictions between claims
M6  thought-diff          — Structural branch diffs + timeline rendering
M7  identity-resilience   — Graceful degradation when agent identity unavailable
M8  multi-agent-integration — End-to-end integration tests
M9  runtime-wiring        — Env vars → server-factory → GatewayHandler pipeline
```

M1–M6 are pure library modules with no server dependencies.
M7 tests behavior across M1/M2 under identity edge cases.
M8 exercises the full pipeline from parse → detect → diff.
M9 wires everything into the live server runtime.

## Type Hierarchy

```
ThoughtData (src/persistence/types.ts)
├── thought: string
├── thoughtNumber: number
├── totalThoughts: number
├── nextThoughtNeeded: boolean
├── timestamp: string
├── branchId?: string
├── branchFromThought?: number
├── isRevision?: boolean
├── revisesThought?: number
├── sessionTitle?: string
├── sessionTags?: string[]
├── agentId?: string          ← M2: agent attribution
├── agentName?: string        ← M2: agent attribution
└── contentHash?: string      ← M1: content-addressable hash
```

## Runtime Pipeline

```
Environment Variables
  THOUGHTBOX_AGENT_ID
  THOUGHTBOX_AGENT_NAME
       │
       ▼
server-factory.ts (line 362–374)
  ├── Constructs GatewayHandler with { agentId, agentName }
  └── Constructs HubToolHandler with { envAgentId, envAgentName }
       │
       ▼
GatewayHandler.handleThought() (line 461–462)
  ├── Injects agentId/agentName from config into processThought() input
  └── Args-level agentId/agentName override config values
       │
       ▼
ThoughtHandler.processThought()
  ├── Computes contentHash via computeHash() (M1)
  ├── Persists thought with agentId, agentName, contentHash
  └── Returns formatted response
```

## Cipher Delivery Pipeline

```
GatewayHandler.handleCipher()
  └── getExtendedCipher(THOUGHTBOX_CIPHER)
        ├── Base cipher: H/E/C/Q/R/P/O/A/X markers, ⊕/⊖/→/∧/∨/¬ operators
        └── Logic extension (M3): ⊢/⊨ operators, CLAIM:/PREMISE:/REFUTE: prefixes

server-factory.ts cipher resource (thoughtbox://cipher)
  └── Also serves getExtendedCipher(THOUGHTBOX_CIPHER)
```

Both the `cipher` operation (tool call) and the `thoughtbox://cipher` resource now serve the extended version.

## Hub Integration

```
Hub domain layer (src/hub/)
  ├── identity.ts        — Agent registration
  ├── workspace.ts       — Workspace lifecycle
  ├── problems.ts        — Problem CRUD
  ├── hub-handler.ts     — Progressive disclosure dispatcher
  └── hub-tool-handler.ts — MCP tool interface adapter

claim_problem flow:
  1. Agent calls thoughtbox_hub { operation: 'claim_problem', args: { workspaceId, problemId } }
  2. hub-handler.ts auto-generates branchId: '{agent-slug}/{problemId}'
  3. problems.ts assigns agent, sets branch point from mainSessionId thought count
  4. Agent works on per-branch thought plane
```
