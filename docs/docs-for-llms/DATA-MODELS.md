# Thoughtbox Data Models

> **Part of:** [Architecture Documentation](./ARCHITECTURE.md)
> **Last Updated:** 2026-01-20

Complete data model specifications for the Thoughtbox server. All schemas use YAML/OpenAPI-style notation.

---

## Table of Contents

- [Core Types](#core-types) - ThoughtData, Session, ThoughtNode
- [Configuration Types](#configuration-types) - Config, TimePartitionGranularity
- [Input Parameter Types](#input-parameter-types) - CreateSessionParams, SessionFilter, ThoughtInput, ExportOptions
- [Export & Integrity Types](#export--integrity-types) - SessionExport, SessionManifest, IntegrityValidationResult
- [Knowledge Zone Types](#knowledge-zone-types) - KnowledgePattern, ScratchpadNote
- [Session Analysis Types](#session-analysis-types) - SessionAnalysis, ExtractedLearning
- [Thought Query Types](#thought-query-types) - ReadThoughtsQuery, ReadThoughtsResponse, GetStructureResponse
- [Deep Analysis Types](#deep-analysis-types) - DeepAnalysisResult, SessionPatternAnalysis
- [Event Streaming Types](#event-streaming-types) - ThoughtboxEvent (SIL-104)
- [Notebook Types](#notebook-types) - Notebook, Cell variants
- [Mental Models Types](#mental-models-types) - MentalModelDefinition, response types
- [Observatory Types](#observatory-types) - Event payloads, WebSocket schemas
- [Error Types](#error-types) - Error codes and payloads

---

## Core Types

### ThoughtData Schema

```yaml
# ThoughtData - Core reasoning unit
ThoughtData:
  type: object
  required:
    - thought
    - nextThoughtNeeded
    # Note: timestamp is auto-added by server, not required in input
  properties:
    thought:
      type: string
      description: The reasoning content
      example: "The API latency increased because of database regression"

    thoughtNumber:
      type: integer
      minimum: 1
      description: |
        Position in the reasoning chain.
        SIL-102: Optional - server auto-assigns next sequential number if omitted.

    totalThoughts:
      type: integer
      minimum: 1
      description: |
        Estimated total thoughts for this reasoning.
        SIL-102: Optional - server defaults to thoughtNumber if omitted.

    nextThoughtNeeded:
      type: boolean
      description: Whether reasoning should continue

    isRevision:
      type: boolean
      default: false
      description: Whether this thought revises a prior thought

    revisesThought:
      type: integer
      nullable: true
      description: Which thought number this revises

    branchFromThought:
      type: integer
      nullable: true
      description: Fork point for alternative exploration

    branchId:
      type: string
      nullable: true
      pattern: "^[a-z0-9-]+$"
      description: Branch identifier (lowercase alphanumeric with hyphens)

    needsMoreThoughts:
      type: boolean
      default: false
      description: Signal that more thoughts are needed

    includeGuide:
      type: boolean
      default: false
      description: Include patterns guide in response

    timestamp:
      type: string
      format: date-time
      description: ISO 8601 timestamp (auto-added)

    critique:
      type: object
      nullable: true
      description: Autonomous LLM critique
      properties:
        text:
          type: string
          description: Critique content
        model:
          type: string
          description: Model that provided critique
        timestamp:
          type: string
          format: date-time
```

### Session Schema

```yaml
# Session - Container for thought chains
Session:
  type: object
  required:
    - id
    - title
    - tags
    - thoughtCount
    - branchCount
    - createdAt
    - updatedAt
    - lastAccessedAt
  properties:
    id:
      type: string
      format: uuid
      description: Unique session identifier

    title:
      type: string
      maxLength: 200
      description: Human-readable session title

    description:
      type: string
      nullable: true
      description: Optional session description

    tags:
      type: array
      items:
        type: string
      description: Categorization tags

    thoughtCount:
      type: integer
      minimum: 0
      description: Number of thoughts in session

    branchCount:
      type: integer
      minimum: 0
      description: Number of branches in session

    partitionPath:
      type: string
      nullable: true
      description: Time partition path (monthly/weekly/daily)
      examples:
        - "2025-12"
        - "2025-W50"
        - "2025-12-07"

    createdAt:
      type: string
      format: date-time

    updatedAt:
      type: string
      format: date-time

    lastAccessedAt:
      type: string
      format: date-time
```

### ThoughtNode Schema (Linked Store)

```yaml
# ThoughtNode - Graph representation for O(1) operations
ThoughtNode:
  type: object
  required:
    - id
    - data
  properties:
    id:
      type: string
      pattern: "^[a-f0-9-]+(:[a-z0-9-]+)?:[0-9]+$"
      description: |
        Node ID format varies by thought type:
        - Main chain: "{sessionId}:{thoughtNumber}"
        - Branch: "{sessionId}:{branchId}:{thoughtNumber}"
      examples:
        - "a1b2c3d4-e5f6-7890-abcd-ef1234567890:42"           # Main chain thought 42
        - "a1b2c3d4-e5f6-7890-abcd-ef1234567890:alt-approach:3"  # Branch thought 3

    data:
      $ref: "#/ThoughtData"
      description: Original thought data

    prev:
      type: string
      nullable: true
      description: Previous thought node ID

    next:
      type: array
      items:
        type: string
      description: Next thought node IDs (supports trees)

    revisesNode:
      type: string
      nullable: true
      description: Node ID this thought revises

    branchOrigin:
      type: string
      nullable: true
      description: Node ID this branch originated from

    branchId:
      type: string
      nullable: true
      description: Branch identifier
```

---

## Configuration Types

### Config Schema

```yaml
# Config - Server configuration (persisted)
Config:
  type: object
  required:
    - installId
    - dataDir
    - disableThoughtLogging
    - sessionPartitionGranularity
    - createdAt
  properties:
    installId:
      type: string
      format: uuid
      description: Unique installation identifier

    dataDir:
      type: string
      description: Base directory for persistent data
      example: "~/.thoughtbox"

    disableThoughtLogging:
      type: boolean
      default: false
      description: Suppress stderr output

    sessionPartitionGranularity:
      $ref: "#/TimePartitionGranularity"
      default: "monthly"
      description: How sessions are organized in filesystem

    createdAt:
      type: string
      format: date-time
```

### TimePartitionGranularity

```yaml
# TimePartitionGranularity - Session directory organization
TimePartitionGranularity:
  type: string
  enum:
    - monthly   # sessions/2025-12/{uuid}/
    - weekly    # sessions/2025-W50/{uuid}/
    - daily     # sessions/2025-12-07/{uuid}/
    - none      # sessions/{uuid}/ (legacy)
  default: monthly
```

---

## Input Parameter Types

### CreateSessionParams

```yaml
# CreateSessionParams - Parameters for creating a new session
CreateSessionParams:
  type: object
  required:
    - title
  properties:
    title:
      type: string
      maxLength: 200
      description: Human-readable session title

    description:
      type: string
      nullable: true
      description: Optional detailed description

    tags:
      type: array
      items:
        type: string
      default: []
      description: Categorization tags
```

### SessionFilter

```yaml
# SessionFilter - Filter options for listing sessions
SessionFilter:
  type: object
  properties:
    tags:
      type: array
      items:
        type: string
      description: Filter by tags (AND logic)

    search:
      type: string
      description: Full-text search in title/description

    limit:
      type: integer
      minimum: 1
      maximum: 100
      default: 20
      description: Maximum results to return

    offset:
      type: integer
      minimum: 0
      default: 0
      description: Pagination offset

    sortBy:
      type: string
      enum:
        - createdAt
        - updatedAt
        - title
      default: updatedAt

    sortOrder:
      type: string
      enum:
        - asc
        - desc
      default: desc
```

### ThoughtInput

```yaml
# ThoughtInput - Extended thought with session metadata (for auto-create)
ThoughtInput:
  allOf:
    - $ref: "#/ThoughtData"
    - type: object
      properties:
        sessionTitle:
          type: string
          description: Title for auto-created session (first thought only)

        sessionTags:
          type: array
          items:
            type: string
          description: Tags for auto-created session
```

### ExportOptions

```yaml
# ExportOptions - Options for exporting a session
ExportOptions:
  type: object
  required:
    - sessionId
  properties:
    sessionId:
      type: string
      format: uuid

    destination:
      type: string
      nullable: true
      description: Custom export directory (default ~/.thoughtbox/exports/)
```

---

## Export & Integrity Types

### SessionExport

```yaml
# SessionExport - Export format for linked reasoning sessions (v1.0)
SessionExport:
  type: object
  required:
    - version
    - session
    - nodes
    - exportedAt
  properties:
    version:
      type: string
      const: "1.0"
      description: Schema version

    session:
      $ref: "#/Session"
      description: Session metadata

    nodes:
      type: array
      items:
        $ref: "#/ThoughtNode"
      description: All thought nodes with linked structure

    exportedAt:
      type: string
      format: date-time
      description: ISO 8601 timestamp of export
```

### SessionManifest

```yaml
# SessionManifest - Stored in session directory for filesystem storage
SessionManifest:
  type: object
  required:
    - id
    - version
    - thoughtFiles
    - branchFiles
    - metadata
  properties:
    id:
      type: string
      format: uuid

    version:
      type: string
      description: Schema version
      example: "1.0.0"

    thoughtFiles:
      type: array
      items:
        type: string
      description: Ordered thought file names
      example: ["001.json", "002.json", "003.json"]

    branchFiles:
      type: object
      additionalProperties:
        type: array
        items:
          type: string
      description: Branch ID to thought files mapping
      example:
        alt-approach: ["001.json", "002.json"]
        edge-case: ["001.json"]

    metadata:
      type: object
      required:
        - title
        - tags
        - createdAt
        - updatedAt
      properties:
        title:
          type: string
        description:
          type: string
          nullable: true
        tags:
          type: array
          items:
            type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
```

### IntegrityValidationResult

```yaml
# IntegrityValidationResult - Result of filesystem integrity check
IntegrityValidationResult:
  type: object
  required:
    - valid
    - sessionExists
    - manifestExists
    - manifestValid
    - missingThoughtFiles
    - missingBranchFiles
    - errors
  properties:
    valid:
      type: boolean
      description: Overall validity (all checks passed)

    sessionExists:
      type: boolean
      description: Session directory exists

    manifestExists:
      type: boolean
      description: manifest.json file exists

    manifestValid:
      type: boolean
      description: Manifest parses correctly

    missingThoughtFiles:
      type: array
      items:
        type: string
      description: Thought files referenced in manifest but missing

    missingBranchFiles:
      type: object
      additionalProperties:
        type: array
        items:
          type: string
      description: Branch ID to missing files mapping

    errors:
      type: array
      items:
        type: string
      description: Human-readable error messages
```

---

## Knowledge Zone Types

The Knowledge Zone ("The Garden") stores patterns extracted from successful reasoning sessions.

### KnowledgePattern

```yaml
# KnowledgePattern - Extracted reasoning pattern
KnowledgePattern:
  type: object
  required:
    - id
    - title
    - description
    - tags
    - content
    - createdAt
    - updatedAt
  properties:
    id:
      type: string
      pattern: "^[a-z0-9-]+$"
      description: URL-safe slug identifier
      example: "debugging-race-conditions"

    title:
      type: string
      description: Human-readable title

    description:
      type: string
      description: Brief pattern description

    tags:
      type: array
      items:
        type: string
      description: Categorization tags

    content:
      type: string
      description: Full pattern content (Markdown)

    derivedFromSessions:
      type: array
      items:
        type: string
        format: uuid
      description: Session IDs this pattern was extracted from

    createdBy:
      type: string
      nullable: true
      description: Agent ID that created this pattern

    createdAt:
      type: string
      format: date-time

    updatedAt:
      type: string
      format: date-time
```

### CreatePatternParams

```yaml
# CreatePatternParams - Parameters for creating a knowledge pattern
CreatePatternParams:
  type: object
  required:
    - title
    - description
    - content
  properties:
    title:
      type: string
    description:
      type: string
    tags:
      type: array
      items:
        type: string
      default: []
    content:
      type: string
    derivedFromSessions:
      type: array
      items:
        type: string
    createdBy:
      type: string
```

### PatternFilter

```yaml
# PatternFilter - Filter options for listing patterns
PatternFilter:
  type: object
  properties:
    tags:
      type: array
      items:
        type: string

    search:
      type: string
      description: Full-text search

    limit:
      type: integer
      default: 20

    offset:
      type: integer
      default: 0

    sortBy:
      type: string
      enum: [createdAt, updatedAt, title]
      default: updatedAt

    sortOrder:
      type: string
      enum: [asc, desc]
      default: desc
```

### ScratchpadNote

```yaml
# ScratchpadNote - Temporary collaborative work note
ScratchpadNote:
  type: object
  required:
    - id
    - title
    - content
    - createdAt
    - updatedAt
  properties:
    id:
      type: string
      pattern: "^[a-z0-9-]+$"
      description: Topic slug identifier

    title:
      type: string

    content:
      type: string
      description: Note content (Markdown)

    createdAt:
      type: string
      format: date-time

    updatedAt:
      type: string
      format: date-time
```

---

## Session Analysis Types

These types support the `session.analyze` and `session.extract_learnings` operations.

### SessionAnalysis

```yaml
# SessionAnalysis - Objective metrics for a reasoning session
SessionAnalysis:
  type: object
  required:
    - sessionId
    - metadata
    - structure
    - quality
  properties:
    sessionId:
      type: string
      format: uuid

    metadata:
      type: object
      required:
        - title
        - thoughtCount
        - branchCount
        - revisionCount
        - duration
        - createdAt
        - lastUpdatedAt
      properties:
        title:
          type: string
        tags:
          type: array
          items:
            type: string
          nullable: true
        thoughtCount:
          type: integer
          minimum: 0
        branchCount:
          type: integer
          minimum: 0
        revisionCount:
          type: integer
          minimum: 0
        duration:
          type: integer
          description: Milliseconds from first to last thought
        createdAt:
          type: string
          format: date-time
        lastUpdatedAt:
          type: string
          format: date-time

    structure:
      type: object
      required:
        - linearityScore
        - revisionRate
        - maxDepth
        - thoughtDensity
      properties:
        linearityScore:
          type: number
          minimum: 0
          maximum: 1
          description: Higher = more linear reasoning (fewer branches/revisions)
        revisionRate:
          type: number
          minimum: 0
          maximum: 1
          description: Revisions / total thoughts
        maxDepth:
          type: integer
          minimum: 0
          description: Count of distinct branch IDs
        thoughtDensity:
          type: number
          description: Thoughts per minute

    quality:
      type: object
      required:
        - critiqueRequests
        - hasConvergence
        - isComplete
      properties:
        critiqueRequests:
          type: integer
          minimum: 0
          description: Thoughts with critique enabled
        hasConvergence:
          type: boolean
          description: Main chain continues after branches
        isComplete:
          type: boolean
          description: Final thought has nextThoughtNeeded=false
```

### ExtractedLearning

```yaml
# ExtractedLearning - Pattern extracted from session for DGM evolution
ExtractedLearning:
  type: object
  required:
    - type
    - content
    - targetPath
    - metadata
  properties:
    type:
      type: string
      enum:
        - pattern       # Successful approach worth reusing
        - anti-pattern  # Approach that failed/should be avoided
        - signal        # Indicator for future detection
      description: Classification of the extracted learning

    content:
      type: string
      description: Markdown or JSON content

    targetPath:
      type: string
      description: Suggested file path for DGM evolution
      example: "patterns/debugging/race-condition-detection.md"

    metadata:
      type: object
      required:
        - sourceSession
        - sourceThoughts
        - extractedAt
      properties:
        sourceSession:
          type: string
          format: uuid
          description: Session ID this was extracted from

        sourceThoughts:
          type: array
          items:
            type: integer
          description: Thought numbers involved in this learning

        extractedAt:
          type: string
          format: date-time

        behaviorCharacteristics:
          type: object
          description: Optional scoring for pattern quality
          properties:
            specificity:
              type: integer
              minimum: 1
              maximum: 10
              description: How specific vs general (1=very general, 10=very specific)
            applicability:
              type: integer
              minimum: 1
              maximum: 10
              description: How broadly applicable
            complexity:
              type: integer
              minimum: 1
              maximum: 10
              description: How complex to implement
            maturity:
              type: integer
              minimum: 1
              maximum: 10
              description: How proven/tested
```

---

## Thought Query Types

Types for `read_thoughts` and `get_structure` operations.

### ReadThoughtsQuery

```yaml
# ReadThoughtsQuery - Query parameters for read_thoughts operation
ReadThoughtsQuery:
  type: object
  description: |
    Query modes (mutually exclusive):
    - thoughtNumber: Get single specific thought
    - last: Get N most recent thoughts
    - range: Get thoughts in range [start, end]
    - branchId: Get all thoughts in a branch
    If no query specified, returns all thoughts in main chain.
  properties:
    thoughtNumber:
      type: integer
      minimum: 1
      description: Get a specific thought by number

    last:
      type: integer
      minimum: 1
      description: Get the N most recent thoughts

    range:
      type: object
      properties:
        start:
          type: integer
          minimum: 1
          description: Start of range (inclusive)
        end:
          type: integer
          minimum: 1
          description: End of range (inclusive)
      required:
        - start
        - end

    branchId:
      type: string
      pattern: "^[a-z0-9-]+$"
      description: Get all thoughts in specified branch
```

### ReadThoughtsResponse

```yaml
# ReadThoughtsResponse - Response from read_thoughts operation
ReadThoughtsResponse:
  type: object
  required:
    - thoughts
    - count
    - sessionId
  properties:
    thoughts:
      type: array
      items:
        $ref: "#/ThoughtData"
      description: Retrieved thoughts

    count:
      type: integer
      description: Number of thoughts returned

    sessionId:
      type: string
      format: uuid
      description: Session the thoughts belong to

    query:
      type: object
      description: Echo of the query that was executed
```

### GetStructureResponse

```yaml
# GetStructureResponse - Response from get_structure operation
GetStructureResponse:
  type: object
  required:
    - sessionId
    - mainChain
    - branches
    - revisions
    - summary
  properties:
    sessionId:
      type: string
      format: uuid

    mainChain:
      type: object
      required:
        - count
        - range
      properties:
        count:
          type: integer
          description: Total thoughts in main chain
        range:
          type: object
          properties:
            first:
              type: integer
              description: First thought number
            last:
              type: integer
              description: Last thought number
          required:
            - first
            - last

    branches:
      type: array
      items:
        type: object
        required:
          - id
          - fromThought
          - count
        properties:
          id:
            type: string
            description: Branch identifier
          fromThought:
            type: integer
            description: Thought number branch originates from
          count:
            type: integer
            description: Number of thoughts in branch

    revisions:
      type: array
      items:
        type: object
        required:
          - thoughtNumber
          - revises
        properties:
          thoughtNumber:
            type: integer
            description: Revision thought number
          revises:
            type: integer
            description: Original thought that was revised

    summary:
      type: object
      required:
        - totalThoughts
        - totalBranches
        - totalRevisions
      properties:
        totalThoughts:
          type: integer
        totalBranches:
          type: integer
        totalRevisions:
          type: integer
```

---

## Deep Analysis Types

Types for `deep_analysis` advanced session analysis operation.

### DeepAnalysisResult

```yaml
# DeepAnalysisResult - Response from deep_analysis operation
DeepAnalysisResult:
  type: object
  required:
    - sessionId
    - patterns
    - metrics
    - insights
    - analysisTimestamp
  properties:
    sessionId:
      type: string
      format: uuid

    patterns:
      $ref: "#/SessionPatternAnalysis"
      description: Detected reasoning patterns

    metrics:
      type: object
      required:
        - cognitiveLoad
        - linearityScore
        - explorationDepth
        - convergenceRate
      properties:
        cognitiveLoad:
          type: number
          minimum: 0
          maximum: 1
          description: Estimated complexity of reasoning

        linearityScore:
          type: number
          minimum: 0
          maximum: 1
          description: How linear vs branching the reasoning was

        explorationDepth:
          type: integer
          minimum: 0
          description: Maximum branch depth reached

        convergenceRate:
          type: number
          minimum: 0
          maximum: 1
          description: How often branches merged back to main

    insights:
      type: array
      items:
        type: object
        required:
          - type
          - description
          - confidence
        properties:
          type:
            type: string
            enum:
              - pattern_detected
              - anomaly
              - optimization_suggestion
              - quality_observation
          description:
            type: string
          confidence:
            type: number
            minimum: 0
            maximum: 1
          relatedThoughts:
            type: array
            items:
              type: integer

    analysisTimestamp:
      type: string
      format: date-time
```

### SessionPatternAnalysis

```yaml
# SessionPatternAnalysis - Pattern detection results
SessionPatternAnalysis:
  type: object
  required:
    - dominantPattern
    - allPatterns
    - transitions
  properties:
    dominantPattern:
      type: string
      enum:
        - linear          # Straight-line reasoning
        - exploratory     # Heavy branching
        - iterative       # Many revisions
        - convergent      # Branches merge back
        - divergent       # Branches don't merge
      description: Most prominent reasoning pattern

    allPatterns:
      type: array
      items:
        type: object
        required:
          - pattern
          - frequency
        properties:
          pattern:
            type: string
          frequency:
            type: number
            minimum: 0
            maximum: 1

    transitions:
      type: array
      items:
        type: object
        required:
          - from
          - to
          - atThought
        properties:
          from:
            type: string
            description: Previous pattern
          to:
            type: string
            description: New pattern
          atThought:
            type: integer
            description: Thought number where transition occurred
      description: Pattern changes during reasoning
```

---

## Event Streaming Types

Types for SIL-104 event streaming (JSONL output).

### ThoughtboxEvent

```yaml
# ThoughtboxEvent - JSONL event format for external consumers
ThoughtboxEvent:
  type: object
  required:
    - type
    - timestamp
    - data
  properties:
    type:
      type: string
      enum:
        - thought_added
        - thought_revised
        - branch_created
        - session_started
        - session_loaded
        - session_exported
        - cipher_loaded
        - stage_changed
      description: Event type identifier

    timestamp:
      type: string
      format: date-time
      description: ISO 8601 timestamp

    sessionId:
      type: string
      format: uuid
      nullable: true
      description: Associated session (if applicable)

    data:
      type: object
      description: Event-specific payload
```

### Event Payloads by Type

```yaml
# thought_added data payload
ThoughtAddedEventData:
  type: object
  required:
    - thoughtNumber
    - thought
    - nextThoughtNeeded
  properties:
    thoughtNumber:
      type: integer
    thought:
      type: string
      maxLength: 100
      description: Truncated thought content
    nextThoughtNeeded:
      type: boolean
    branchId:
      type: string
      nullable: true

# session_started data payload
SessionStartedEventData:
  type: object
  required:
    - sessionId
    - title
  properties:
    sessionId:
      type: string
      format: uuid
    title:
      type: string
    tags:
      type: array
      items:
        type: string

# stage_changed data payload
StageChangedEventData:
  type: object
  required:
    - previousStage
    - newStage
    - trigger
  properties:
    previousStage:
      type: integer
      minimum: 0
      maximum: 3
    newStage:
      type: integer
      minimum: 0
      maximum: 3
    trigger:
      type: string
      description: Operation that caused the stage change
```

---

## Notebook Types

The notebook system uses Zod schemas for runtime validation. Cell types are discriminated unions.

### Notebook

```yaml
# Notebook - Literate programming document
Notebook:
  type: object
  required:
    - id
    - cells
    - language
    - createdAt
    - updatedAt
  properties:
    id:
      type: string

    cells:
      type: array
      items:
        $ref: "#/Cell"

    language:
      type: string
      enum: [javascript, typescript]
      description: Default language for code cells

    tsconfig.json:
      type: string
      nullable: true
      description: Custom TypeScript config (JSON string)

    createdAt:
      type: integer
      description: Unix timestamp (ms)

    updatedAt:
      type: integer
      description: Unix timestamp (ms)
```

### Cell (Discriminated Union)

```yaml
# Cell - Union of all cell types, discriminated by 'type' field
Cell:
  oneOf:
    - $ref: "#/TitleCell"
    - $ref: "#/MarkdownCell"
    - $ref: "#/PackageJsonCell"
    - $ref: "#/CodeCell"
  discriminator:
    propertyName: type
```

### TitleCell

```yaml
TitleCell:
  type: object
  required:
    - id
    - type
    - text
  properties:
    id:
      type: string
    type:
      const: "title"
    text:
      type: string
      description: Heading text
```

### MarkdownCell

```yaml
MarkdownCell:
  type: object
  required:
    - id
    - type
    - text
  properties:
    id:
      type: string
    type:
      const: "markdown"
    text:
      type: string
      description: Markdown content
```

### PackageJsonCell

```yaml
PackageJsonCell:
  type: object
  required:
    - id
    - type
    - source
    - filename
    - status
  properties:
    id:
      type: string
    type:
      const: "package.json"
    source:
      type: string
      description: JSON content
    filename:
      const: "package.json"
    status:
      $ref: "#/CellStatus"
    output:
      type: string
      nullable: true
    error:
      type: string
      nullable: true
```

### CodeCell

```yaml
CodeCell:
  type: object
  required:
    - id
    - type
    - language
    - filename
    - source
    - status
  properties:
    id:
      type: string
    type:
      const: "code"
    language:
      type: string
      enum: [javascript, typescript]
    filename:
      type: string
      description: Virtual filename for execution
    source:
      type: string
      description: Code content
    status:
      $ref: "#/CellStatus"
    output:
      type: string
      nullable: true
      description: Execution stdout
    error:
      type: string
      nullable: true
      description: Execution error message
```

### CellStatus

```yaml
CellStatus:
  type: string
  enum:
    - idle       # Not yet executed
    - running    # Currently executing
    - completed  # Executed successfully
    - failed     # Execution error
```

---

## Mental Models Types

### MentalModelDefinition

```yaml
# MentalModelDefinition - Full model specification
MentalModelDefinition:
  type: object
  required:
    - name
    - title
    - description
    - tags
    - content
  properties:
    name:
      type: string
      pattern: "^[a-z-]+$"
      description: Kebab-case identifier
      example: "five-whys"

    title:
      type: string
      description: Human-readable title
      example: "Five Whys"

    description:
      type: string
      description: Brief description for listings

    tags:
      type: array
      items:
        type: string
      description: Categorization tags

    content:
      type: string
      description: Full prompt content (Markdown)
```

### TagDefinition

```yaml
# TagDefinition - Category metadata
TagDefinition:
  type: object
  required:
    - name
    - description
  properties:
    name:
      type: string
      example: "decision-making"

    description:
      type: string
      description: When to use models with this tag
```

### GetModelResponse

```yaml
# GetModelResponse - Response from get_model operation
GetModelResponse:
  type: object
  required:
    - name
    - title
    - tags
    - content
  properties:
    name:
      type: string
    title:
      type: string
    tags:
      type: array
      items:
        type: string
    content:
      type: string
```

### ListModelsResponse

```yaml
# ListModelsResponse - Response from list_models operation
ListModelsResponse:
  type: object
  required:
    - models
    - count
  properties:
    models:
      type: array
      items:
        type: object
        properties:
          name:
            type: string
          title:
            type: string
          description:
            type: string
          tags:
            type: array
            items:
              type: string
    count:
      type: integer
    filter:
      type: string
      nullable: true
      description: Applied tag filter (if any)
```

### ListTagsResponse

```yaml
# ListTagsResponse - Response from list_tags operation
ListTagsResponse:
  type: object
  required:
    - tags
    - count
  properties:
    tags:
      type: array
      items:
        $ref: "#/TagDefinition"
    count:
      type: integer
```

---

## Observatory Types

Observatory uses Zod schemas for WebSocket message validation.

### SessionSnapshotPayload

```yaml
# SessionSnapshotPayload - Full state sent on subscription
SessionSnapshotPayload:
  type: object
  required:
    - session
    - thoughts
    - branches
  properties:
    session:
      $ref: "#/ObservatorySession"

    thoughts:
      type: array
      items:
        $ref: "#/ObservatoryThought"

    branches:
      type: object
      additionalProperties:
        $ref: "#/ObservatoryBranch"
```

### ObservatorySession

```yaml
# ObservatorySession - Session as seen by Observatory
ObservatorySession:
  type: object
  required:
    - id
    - createdAt
    - status
  properties:
    id:
      type: string
    title:
      type: string
      nullable: true
    tags:
      type: array
      items:
        type: string
      default: []
    createdAt:
      type: string
      format: date-time
    completedAt:
      type: string
      format: date-time
      nullable: true
    status:
      type: string
      enum: [active, completed, abandoned]
```

### ObservatoryThought

```yaml
# ObservatoryThought - Thought as seen by Observatory
ObservatoryThought:
  type: object
  required:
    - id
    - thoughtNumber
    - totalThoughts
    - thought
    - nextThoughtNeeded
    - timestamp
  properties:
    id:
      type: string
    thoughtNumber:
      type: integer
      minimum: 1
    totalThoughts:
      type: integer
      minimum: 1
    thought:
      type: string
    nextThoughtNeeded:
      type: boolean
    timestamp:
      type: string
      format: date-time
    isRevision:
      type: boolean
    revisesThought:
      type: integer
    branchId:
      type: string
    branchFromThought:
      type: integer
```

### ObservatoryBranch

```yaml
# ObservatoryBranch - Branch as seen by Observatory
ObservatoryBranch:
  type: object
  required:
    - id
    - fromThoughtNumber
    - thoughts
  properties:
    id:
      type: string
    name:
      type: string
      nullable: true
    fromThoughtNumber:
      type: integer
    thoughts:
      type: array
      items:
        $ref: "#/ObservatoryThought"
```

### ThoughtAddedPayload

```yaml
# ThoughtAddedPayload - Event when thought is added
ThoughtAddedPayload:
  type: object
  required:
    - thought
    - parentId
  properties:
    thought:
      $ref: "#/ObservatoryThought"
    parentId:
      type: string
      nullable: true
      description: Parent thought ID (null for first thought)
```

### ThoughtRevisedPayload

```yaml
# ThoughtRevisedPayload - Event when thought is revised
ThoughtRevisedPayload:
  type: object
  required:
    - thought
    - parentId
    - originalThoughtNumber
  properties:
    thought:
      $ref: "#/ObservatoryThought"
    parentId:
      type: string
      nullable: true
    originalThoughtNumber:
      type: integer
      description: Which thought was revised
```

### ThoughtBranchedPayload

```yaml
# ThoughtBranchedPayload - Event when branch is created
ThoughtBranchedPayload:
  type: object
  required:
    - thought
    - parentId
    - branchId
    - fromThoughtNumber
  properties:
    thought:
      $ref: "#/ObservatoryThought"
    parentId:
      type: string
      nullable: true
    branchId:
      type: string
    fromThoughtNumber:
      type: integer
      description: Main chain thought this branches from
```

### SessionStartedPayload

```yaml
# SessionStartedPayload - Event when session starts
SessionStartedPayload:
  type: object
  required:
    - session
  properties:
    session:
      $ref: "#/ObservatorySession"
```

### SessionEndedPayload

```yaml
# SessionEndedPayload - Event when session ends
SessionEndedPayload:
  type: object
  required:
    - sessionId
    - finalThoughtCount
  properties:
    sessionId:
      type: string
    finalThoughtCount:
      type: integer
```

---

## Error Types

### ErrorPayload

```yaml
# ErrorPayload - Standard error response
ErrorPayload:
  type: object
  required:
    - code
    - message
  properties:
    code:
      type: string
      enum:
        - SESSION_NOT_FOUND
        - THOUGHT_NOT_FOUND
        - INVALID_OPERATION
        - STAGE_REQUIREMENT_NOT_MET
        - INTERNAL_ERROR
        - INVALID_PAYLOAD
        - STORAGE_ERROR
        - SAMPLING_NOT_SUPPORTED

    message:
      type: string
      description: Human-readable error message

    details:
      type: object
      nullable: true
      description: Additional error context
```

### Error Codes Reference

| Code | HTTP-like | Description |
|------|-----------|-------------|
| `SESSION_NOT_FOUND` | 404 | Session ID does not exist |
| `THOUGHT_NOT_FOUND` | 404 | Thought number does not exist in session |
| `INVALID_OPERATION` | 400 | Unknown or malformed operation |
| `STAGE_REQUIREMENT_NOT_MET` | 403 | Operation requires higher stage |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `INVALID_PAYLOAD` | 400 | Request payload validation failed |
| `STORAGE_ERROR` | 500 | Filesystem or storage backend error |
| `SAMPLING_NOT_SUPPORTED` | 501 | MCP client doesn't support sampling API |

### MCP Error Codes

```yaml
# Standard JSON-RPC error codes used by MCP
MCPErrorCodes:
  METHOD_NOT_FOUND:
    code: -32601
    description: Client doesn't support the requested method
    example: "sampling/createMessage not supported"

  INVALID_PARAMS:
    code: -32602
    description: Invalid method parameters

  INTERNAL_ERROR:
    code: -32603
    description: Internal JSON-RPC error
```

---

*See also: [Architecture Overview](./ARCHITECTURE.md) | [Tool Interfaces](./TOOL-INTERFACES.md) | [Configuration](./CONFIGURATION.md)*
