# Thoughtbox Tool Interfaces

> **Part of:** [Architecture Documentation](./ARCHITECTURE.md)
> **Last Updated:** 2026-01-20

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
- [Notebook Tool](#notebook-tool)
- [Mental Models Tool](#mental-models-tool)
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
