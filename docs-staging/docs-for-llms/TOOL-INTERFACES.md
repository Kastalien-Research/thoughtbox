# Thoughtbox Tool Interfaces

> **Part of:** [Architecture Documentation](./ARCHITECTURE.md)
> **Last Updated:** 2026-03-15

Complete tool interface specifications including the gateway router, individual tools, and storage interface.

---

## Table of Contents

- [Gateway Architecture](#gateway-architecture)
- [Gateway Tool](#gateway-tool)
- [Thought Tool](#thought-tool)
- [Read Thoughts Tool](#read-thoughts-tool)
- [Get Structure Tool](#get-structure-tool)
- [Session Tool](#session-tool)
- [Deep Analysis Tool](#deep-analysis-tool)
- [Knowledge Graph Tool](#knowledge-graph-tool)
- [Notebook Tool](#notebook-tool)
- [Mental Models Tool](#mental-models-tool)
- [Additional MCP Tools](#additional-mcp-tools)
- [Storage Interface](#storage-interface)

---

## Gateway Architecture

The gateway is an always-on router that bypasses client tool list refresh limitations.

```mermaid
flowchart TD
    subgraph Client
        Agent[AI Agent]
    end

    subgraph Gateway["Gateway Handler (Always Enabled)"]
        Route{Route by operation}
    end

    subgraph Handlers
        Init[Init Handler]
        Cipher[Cipher Resource]
        Thought[Thought Handler]
        Session[Session Handler]
        Notebook[Notebook Handler]
        Mental[Mental Models Handler]
    end

    subgraph StageCheck["Stage Enforcement"]
        S0[Stage 0+]
        S1[Stage 1+]
        S2[Stage 2+]
    end

    Agent -->|thoughtbox_gateway| Route

    Route -->|get_state| S0 --> Init
    Route -->|start_new| S0 --> Init
    Route -->|load_context| S0 --> Init
    Route -->|cipher| S1 --> Cipher
    Route -->|session| S1 --> Session
    Route -->|deep_analysis| S1 --> Session
    Route -->|thought| S2 --> Thought
    Route -->|read_thoughts| S2 --> Thought
    Route -->|get_structure| S2 --> Thought
    Route -->|notebook| S2 --> Notebook
    Route -->|mental_models| S2 --> Mental
```

### Operation Routing Table

```yaml
gateway_routes:
  # Stage 0 operations (always available)
  get_state:
    handler: init
    minimum_stage: 0
    advances_to: null

  start_new:
    handler: init
    minimum_stage: 0
    advances_to: 1
    parameters:
      sessionTitle:
        type: string
        required: false
      domain:
        type: string
        required: false

  load_context:
    handler: init
    minimum_stage: 0
    advances_to: 1
    parameters:
      sessionId:
        type: string
        required: true

  list_sessions:
    handler: init
    minimum_stage: 0
    advances_to: null

  navigate:
    handler: init
    minimum_stage: 0
    advances_to: null

  list_roots:
    handler: init
    minimum_stage: 0
    advances_to: null
    description: "Query MCP roots from client (SPEC-011)"

  bind_root:
    handler: init
    minimum_stage: 0
    advances_to: null
    description: "Bind root directory as project scope"

  # Stage 1 operations
  cipher:
    handler: resource
    minimum_stage: 1
    advances_to: 2
    returns: "thoughtbox://cipher resource content"

  session:
    handler: sessions
    minimum_stage: 1
    advances_to: null
    sub_operations:
      - list
      - get
      - search
      - resume
      - export
      - analyze
      - extract_learnings
      - discovery  # SPEC-009

  deep_analysis:
    handler: sessions
    minimum_stage: 1
    advances_to: null
    description: "Advanced session pattern analysis"
    parameters:
      sessionId:
        type: string
        required: true
      analysisType:
        type: string
        enum: [patterns, cognitive_load, decision_points, full]
        default: full

  # Stage 2 operations
  thought:
    handler: thought
    minimum_stage: 2
    advances_to: null
    parameters:
      thought:
        type: string
        required: true
      nextThoughtNeeded:
        type: boolean
        required: true
      # SIL-102: Optional - server auto-assigns if omitted
      thoughtNumber:
        type: integer
        required: false
        description: "Optional - server auto-assigns next sequential number if omitted"
      totalThoughts:
        type: integer
        required: false
        description: "Optional - defaults to thoughtNumber if omitted"
      isRevision:
        type: boolean
        required: false
      revisesThought:
        type: integer
        required: false
      branchFromThought:
        type: integer
        required: false
      branchId:
        type: string
        required: false
      critique:
        type: boolean
        required: false
      # SIL-101: Response mode
      verbose:
        type: boolean
        required: false
        default: false
        description: "Return detailed response (default: minimal)"

  read_thoughts:
    handler: thought
    minimum_stage: 2
    advances_to: null
    description: "Retrieve previous thoughts mid-session"
    parameters:
      thoughtNumber:
        type: integer
        required: false
        description: "Get a single thought by number"
      last:
        type: integer
        required: false
        description: "Get the last N thoughts"
      range:
        type: array
        items: integer
        required: false
        description: "Get thoughts in range [start, end]"
      branchId:
        type: string
        required: false
        description: "Get all thoughts from a branch"
      sessionId:
        type: string
        required: false
        description: "Defaults to active session"

  get_structure:
    handler: thought
    minimum_stage: 2
    advances_to: null
    description: "Get reasoning graph topology without content"
    parameters:
      sessionId:
        type: string
        required: false
        description: "Defaults to active session"

  notebook:
    handler: notebook
    minimum_stage: 2
    advances_to: null
    sub_operations:
      - create
      - add_cell
      - update_cell
      - run_cell
      - install_deps
      - export

  mental_models:
    handler: mental_models
    minimum_stage: 2
    advances_to: null
    sub_operations:
      - get_model
      - list_models
      - list_tags

  # Knowledge graph operations (Stage 2, flattened with knowledge_ prefix)
  knowledge_create_entity:
    handler: knowledge
    minimum_stage: 2
    advances_to: null
  knowledge_get_entity:
    handler: knowledge
    minimum_stage: 2
    advances_to: null
  knowledge_list_entities:
    handler: knowledge
    minimum_stage: 2
    advances_to: null
  knowledge_add_observation:
    handler: knowledge
    minimum_stage: 2
    advances_to: null
  knowledge_create_relation:
    handler: knowledge
    minimum_stage: 2
    advances_to: null
  knowledge_query_graph:
    handler: knowledge
    minimum_stage: 2
    advances_to: null
  knowledge_stats:
    handler: knowledge
    minimum_stage: 2
    advances_to: null
```

---

## Gateway Tool

```yaml
tool:
  name: thoughtbox_gateway
  description: "Always-on router for all Thoughtbox operations"
  inputSchema:
    type: object
    required:
      - operation
    properties:
      operation:
        type: string
        enum:
          - get_state
          - start_new
          - load_context
          - list_sessions
          - navigate
          - list_roots
          - bind_root
          - cipher
          - session
          - deep_analysis
          - thought
          - read_thoughts
          - get_structure
          - notebook
          - mental_models
          - knowledge_create_entity
          - knowledge_get_entity
          - knowledge_list_entities
          - knowledge_add_observation
          - knowledge_create_relation
          - knowledge_query_graph
          - knowledge_stats

      # Operation-specific parameters
      # (varies by operation, see gateway routes above)
```

---

## Thought Tool

```yaml
tool:
  name: thought
  access: "gateway { operation: 'thought', ... }"
  description: "Record a reasoning step"
  inputSchema:
    type: object
    required:
      - thought
      - nextThoughtNeeded
    properties:
      thought:
        type: string
        description: "Reasoning content (can use cipher notation)"
      nextThoughtNeeded:
        type: boolean
      # SIL-102: Optional - server auto-assigns if omitted
      thoughtNumber:
        type: integer
        minimum: 1
        description: "Optional - server auto-assigns next sequential number"
      totalThoughts:
        type: integer
        minimum: 1
        description: "Optional - defaults to thoughtNumber"
      isRevision:
        type: boolean
      revisesThought:
        type: integer
      branchFromThought:
        type: integer
      branchId:
        type: string
        pattern: "^[a-z0-9-]+$"
      critique:
        type: boolean
        description: "Request autonomous LLM critique"
      # SIL-101: Response mode
      verbose:
        type: boolean
        default: false
        description: "Return detailed response (default: minimal)"
```

---

## Read Thoughts Tool

```yaml
tool:
  name: read_thoughts
  access: "gateway { operation: 'read_thoughts', ... }"
  description: "Retrieve previous thoughts mid-session"
  minimum_stage: 2
  inputSchema:
    type: object
    properties:
      thoughtNumber:
        type: integer
        description: "Get a single thought by number"
      last:
        type: integer
        description: "Get the last N thoughts (default: 5)"
      range:
        type: array
        items: [integer, integer]
        description: "Get thoughts in range [start, end] inclusive"
      branchId:
        type: string
        description: "Get all thoughts from a specific branch"
      sessionId:
        type: string
        description: "Optional - defaults to active session"
  returns:
    sessionId: string
    query: string
    count: integer
    thoughts: ThoughtData[]
```

---

## Get Structure Tool

```yaml
tool:
  name: get_structure
  access: "gateway { operation: 'get_structure', ... }"
  description: "Get reasoning graph topology without content"
  minimum_stage: 2
  inputSchema:
    type: object
    properties:
      sessionId:
        type: string
        description: "Optional - defaults to active session"
  returns:
    sessionId: string
    totalThoughts: integer
    mainChain:
      length: integer
      head: integer
      tail: integer
    branches:
      type: object
      additionalProperties:
        forks: integer
        range: [integer, integer]
        length: integer
    branchCount: integer
    revisions: array
    revisionCount: integer
```

---

## Session Tool

```yaml
tool:
  name: session
  access: "gateway { operation: 'session', subOperation: '...', ... }"
  description: "Session management operations"

  operations:
    list:
      description: "Browse sessions with filters"
      parameters:
        project:
          type: string
        task:
          type: string
        search:
          type: string
        limit:
          type: integer
          default: 20

    get:
      description: "Retrieve session with full metadata"
      parameters:
        sessionId:
          type: string
          required: true

    search:
      description: "Query sessions by content patterns"
      parameters:
        query:
          type: string
          required: true

    resume:
      description: "Load session and advance to Stage 1"
      parameters:
        sessionId:
          type: string
          required: true

    export:
      description: "Export session as JSON, Markdown, or Cipher"
      parameters:
        sessionId:
          type: string
          required: true
        format:
          type: string
          enum: [json, markdown, cipher]
          default: json
        includeMetadata:
          type: boolean
          default: true
        resolveAnchors:
          type: boolean
          default: true
          description: "SPEC-003: Resolve cross-session anchors"

    analyze:
      description: "Session statistics"
      parameters:
        sessionId:
          type: string
          required: true
      returns:
        linearity: number
        density: number
        completion: number
        branchCount: number

    extract_learnings:
      description: "Derive patterns for knowledge base"
      parameters:
        sessionId:
          type: string
          required: true
        keyMoments:
          type: array
          items:
            type: object
            properties:
              thoughtNumber: integer
              type: string  # insight, decision, pivot, revision
              significance: integer  # 1-10
              summary: string
        targetTypes:
          type: array
          items:
            type: string
            enum: [pattern, anti-pattern, signal]
          default: [signal]

    discovery:
      description: "SPEC-009: Manage dynamically discovered tools"
      parameters:
        action:
          type: string
          enum: [list, hide, show]
          required: true
        toolName:
          type: string
          description: "Required for hide/show actions"
```

---

## Deep Analysis Tool

```yaml
tool:
  name: deep_analysis
  access: "gateway { operation: 'deep_analysis', ... }"
  description: "Advanced session pattern analysis"
  minimum_stage: 1
  inputSchema:
    type: object
    required:
      - sessionId
    properties:
      sessionId:
        type: string
      analysisType:
        type: string
        enum: [patterns, cognitive_load, decision_points, full]
        default: full
      options:
        type: object
        properties:
          includeTimeline:
            type: boolean
            default: true
          compareWith:
            type: array
            items: string
            description: "Session IDs to compare against"
  returns:
    sessionId: string
    analysisType: string
    timestamp: string
    patterns:
      totalThoughts: integer
      revisionCount: integer
      branchCount: integer
      averageThoughtLength: integer
    cognitiveLoad:
      complexityScore: integer  # 0-100
      depthIndicator: integer
      breadthIndicator: integer
    decisionPoints:
      type: array
      items:
        thoughtNumber: integer
        type: string  # branch, revision
        reference: integer
    timeline:
      createdAt: string
      updatedAt: string
      durationEstimate: string
```

---

## Knowledge Graph Tool

Knowledge graph operations are accessed through `thoughtbox_gateway` with `knowledge_` prefixed operation names (Stage 2). Parameters are passed in the `args` field.

```yaml
operations:
  knowledge_create_entity:
    description: "Create a new knowledge entity"
    parameters:
      name:
        type: string
        required: true
      type:
        type: string
        required: true
        enum: [Insight, Concept, Workflow, Decision, Agent]
      label:
        type: string
        required: true
      properties:
        type: object
        required: false
      created_by:
        type: string
        required: false
      visibility:
        type: string
        enum: [public, agent-private, user-private, team-private]
        default: public

  knowledge_get_entity:
    description: "Get entity by ID"
    parameters:
      entity_id:
        type: string
        required: true

  knowledge_list_entities:
    description: "List entities with optional filtering"
    parameters:
      types:
        type: array
        items: string
        required: false
      visibility:
        type: array
        items: string
        required: false
      name_pattern:
        type: string
        required: false
        description: "SQL LIKE pattern"
      limit:
        type: integer
        required: false
      offset:
        type: integer
        required: false

  knowledge_add_observation:
    description: "Add atomic fact to an entity"
    parameters:
      entity_id:
        type: string
        required: true
      content:
        type: string
        required: true
      source_session:
        type: string
        required: false
      added_by:
        type: string
        required: false

  knowledge_create_relation:
    description: "Create directed edge between entities"
    parameters:
      from_id:
        type: string
        required: true
      to_id:
        type: string
        required: true
      relation_type:
        type: string
        required: true
        enum: [RELATES_TO, BUILDS_ON, CONTRADICTS, EXTRACTED_FROM, APPLIED_IN, LEARNED_BY, DEPENDS_ON, SUPERSEDES, MERGED_FROM]
      properties:
        type: object
        required: false

  knowledge_query_graph:
    description: "Traverse graph from starting entity (follows OUTGOING relations only)"
    parameters:
      start_entity_id:
        type: string
        required: true
      relation_types:
        type: array
        items: string
        required: false
      max_depth:
        type: integer
        default: 3
        required: false

  knowledge_stats:
    description: "Get knowledge graph statistics"
    parameters: {}
```

**Implementation:** `src/knowledge/handler.ts`

---

## Notebook Tool

```yaml
tool:
  name: notebook
  access: "gateway { operation: 'notebook', subOperation: '...', ... }"
  description: "Literate programming engine"

  operations:
    create:
      description: "Create new notebook"
      parameters:
        name:
          type: string
          required: true
        template:
          type: string
          enum: [blank, sequential-feynman]

    add_cell:
      description: "Add cell to notebook"
      parameters:
        notebookId:
          type: string
          required: true
        type:
          type: string
          enum: [title, markdown, code]
          required: true
        content:
          type: string
          required: true
        afterCellId:
          type: string

    update_cell:
      description: "Update existing cell"
      parameters:
        notebookId:
          type: string
          required: true
        cellId:
          type: string
          required: true
        content:
          type: string
          required: true

    run_cell:
      description: "Execute code cell"
      parameters:
        notebookId:
          type: string
          required: true
        cellId:
          type: string
          required: true
      returns:
        output: string
        error: string | null

    install_deps:
      description: "Install npm dependencies"
      parameters:
        notebookId:
          type: string
          required: true
        packages:
          type: array
          items:
            type: string

    export:
      description: "Export to .src.md format"
      parameters:
        notebookId:
          type: string
          required: true
```

---

## Mental Models Tool

```yaml
tool:
  name: mental_models
  access: "gateway { operation: 'mental_models', subOperation: '...', ... }"
  description: "Structured reasoning frameworks"

  operations:
    get_model:
      description: "Get full prompt for model"
      parameters:
        modelId:
          type: string
          required: true
          enum:
            - rubber-duck
            - five-whys
            - pre-mortem
            - steelmanning
            - fermi-estimation
            - trade-off-matrix
            - decomposition
            - inversion
            - abstraction-laddering
            - constraint-relaxation
            - assumption-surfacing
            - adversarial-thinking
            - time-horizon-shifting
            - impact-effort-grid
            - opportunity-cost

    list_models:
      description: "Browse models with optional tag filter"
      parameters:
        tag:
          type: string
          enum:
            - debugging
            - planning
            - decision-making
            - risk-management
            - problem-solving
            - analysis

    list_tags:
      description: "Show available tags"
      returns:
        tags:
          type: array
          items:
            type: string
```

---

## Additional MCP Tools

Beyond `thoughtbox_gateway`, the server exposes three additional MCP tools that operate independently of the progressive disclosure system.

### thoughtbox_operations

```yaml
tool:
  name: thoughtbox_operations
  description: "Discover available Thoughtbox operations and their schemas. Always available -- no session required."
  inputSchema:
    type: object
    properties:
      operation:
        type: string
        description: "Operation name to get schema for, or omit for catalog"
```

### thoughtbox_hub

Multi-agent collaboration hub. Registered as a task-capable tool (supports async execution). See [ARCHITECTURE.md](./ARCHITECTURE.md#multi-agent-hub) for the full vocabulary and operation list.

```yaml
tool:
  name: thoughtbox_hub
  description: "Multi-agent collaboration hub for coordinated reasoning"
  inputSchema:
    type: object
    required:
      - operation
    properties:
      operation:
        type: string
        enum:
          - register
          - whoami
          - create_workspace
          - join_workspace
          - list_workspaces
          - workspace_status
          - create_problem
          - claim_problem
          - update_problem
          - list_problems
          - add_dependency
          - remove_dependency
          - ready_problems
          - blocked_problems
          - create_sub_problem
          - create_proposal
          - review_proposal
          - merge_proposal
          - list_proposals
          - mark_consensus
          - endorse_consensus
          - list_consensus
          - post_message
          - read_channel
          - get_profile_prompt
      args:
        type: object
        description: "Operation-specific arguments"
```

**Note:** `quick_join` is available at the hub handler level but not exposed in the server-factory tool registration enum.

### observability_gateway

```yaml
tool:
  name: observability_gateway
  description: "Query system observability data. No session required."
  inputSchema:
    type: object
    required:
      - operation
    properties:
      operation:
        type: string
        enum: [health, metrics, metrics_range, sessions, session_info, alerts, dashboard_url]
      args:
        type: object
```

---

## Storage Interface

### ThoughtboxStorage

```yaml
ThoughtboxStorage:
  interface: true
  description: "Abstract storage interface"

  methods:
    # Session operations
    createSession:
      parameters:
        session: Session
      returns: Promise<void>

    getSession:
      parameters:
        sessionId: string
      returns: Promise<Session | null>

    updateSession:
      parameters:
        sessionId: string
        updates: Partial<Session>
      returns: Promise<void>

    listSessions:
      parameters:
        filters: SessionFilters
      returns: Promise<Session[]>

    deleteSession:
      parameters:
        sessionId: string
      returns: Promise<void>

    # Thought operations
    addThought:
      parameters:
        sessionId: string
        thought: ThoughtData
      returns: Promise<void>

    getThoughts:
      parameters:
        sessionId: string
      returns: Promise<ThoughtData[]>

    getThought:
      parameters:
        sessionId: string
        thoughtNumber: number
      returns: Promise<ThoughtData | null>

    # Branch operations
    getBranches:
      parameters:
        sessionId: string
      returns: Promise<string[]>

    getBranchThoughts:
      parameters:
        sessionId: string
        branchId: string
      returns: Promise<ThoughtData[]>
```

### Implementation Comparison

```mermaid
graph TB
    subgraph "InMemoryStorage"
        IM_Sessions[Sessions Map]
        IM_Linked[LinkedThoughtStore]
        IM_Index[Session Index]
    end

    subgraph "FileSystemStorage"
        FS_Dir[~/.thoughtbox/projects/]
        FS_Manifest[manifest.json]
        FS_Thoughts[001.json, 002.json, ...]
        FS_Branches[{branchId}/]
    end

    subgraph "SupabaseStorage"
        SB_Sessions[sessions table]
        SB_Thoughts[thoughts table]
        SB_RLS[RLS via user_can_access_project]
    end

    subgraph "LinkedThoughtStore"
        Nodes[nodes: Map]
        SessionHead[sessionHead: Map]
        SessionTail[sessionTail: Map]
        SessionIndex[sessionIndex: Map]
        RevisedBy[revisedByIndex: Map]
        BranchChildren[branchChildrenIndex: Map]
    end
```

### Directory Structure

```
~/.thoughtbox/
├── config.json                       # Global configuration
└── projects/
    └── {project}/
        └── sessions/
            ├── 2025-12/              # Monthly partition
            │   └── {uuid}/
            │       ├── manifest.json # Session metadata
            │       ├── 001.json      # Thought 1
            │       ├── 002.json      # Thought 2
            │       └── {branchId}/   # Branch directory
            │           ├── 001.json
            │           └── 002.json
            ├── 2025-W50/             # Weekly partition
            │   └── ...
            └── 2025-12-07/           # Daily partition
                └── ...
```

### Partition Strategies

```yaml
partition_strategies:
  monthly:
    format: "YYYY-MM"
    example: "2025-12"
    description: "Default - groups by month"

  weekly:
    format: "YYYY-[W]WW"
    example: "2025-W50"
    description: "ISO week numbers"

  daily:
    format: "YYYY-MM-DD"
    example: "2025-12-07"
    description: "One directory per day"

  none:
    format: ""
    example: "{uuid}/"
    description: "Legacy - flat structure"
```

---

*See also: [Architecture Overview](./ARCHITECTURE.md) | [Data Models](./DATA-MODELS.md) | [Configuration](./CONFIGURATION.md)*
