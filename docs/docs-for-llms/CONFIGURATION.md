# Thoughtbox Configuration Reference

> **Part of:** [Architecture Documentation](./ARCHITECTURE.md)
> **Last Updated:** 2026-01-21

Complete configuration reference including environment variables, server configuration, and appendices.

---

## Table of Contents

- [Environment Variables](#environment-variables)
- [Event Streaming](#event-streaming)
- [Server Configuration Object](#server-configuration-object)
- [Cipher Protocol](#cipher-protocol)
- [Appendix: Mental Models Catalog](#appendix-mental-models-catalog)
- [Appendix: Resources and Prompts](#appendix-resources-and-prompts)

---

## Environment Variables

```yaml
environment_variables:
  # Transport
  THOUGHTBOX_TRANSPORT:
    default: "http"
    values: ["stdio", "http"]
    description: "MCP transport type"

  # Storage
  THOUGHTBOX_STORAGE:
    default: "fs"
    values: ["memory", "fs"]
    description: "Storage backend"

  THOUGHTBOX_DATA_DIR:
    default: "~/.thoughtbox"
    description: "Persistent data directory"

  THOUGHTBOX_PROJECT:
    default: "_default"
    description: "Project scope for isolation"

  # Server
  PORT:
    default: 1731
    description: "HTTP server port"

  HOST:
    default: "0.0.0.0"
    description: "HTTP bind address"

  DISABLE_THOUGHT_LOGGING:
    default: false
    description: "Suppress stderr output"

  # Observatory
  THOUGHTBOX_OBSERVATORY_ENABLED:
    default: false
    description: "Enable Observatory UI"

  THOUGHTBOX_OBSERVATORY_PORT:
    default: 1729
    description: "WebSocket port (taxicab number)"

  THOUGHTBOX_OBSERVATORY_CORS:
    default: "*"
    description: "CORS origins"

  THOUGHTBOX_OBSERVATORY_MAX_CONNECTIONS:
    default: 100
    description: "Maximum WebSocket connections"

  THOUGHTBOX_OBSERVATORY_HTTP_API:
    default: false
    description: "Enable HTTP API endpoints"

  # Event Streaming (SIL-104)
  THOUGHTBOX_EVENT_OUTPUT:
    default: "none"
    values: ["none", "stderr", "stdout", "file"]
    description: "JSONL event output destination"

  THOUGHTBOX_EVENT_FILE:
    default: null
    description: "File path when EVENT_OUTPUT=file"

  THOUGHTBOX_EVENT_TYPES:
    default: "*"
    description: "Comma-separated event types or * for all"
    example: "thought_added,session_started,stage_changed"
```

---

## Event Streaming

SIL-104 enables JSONL event streaming for external consumers like log aggregators, monitoring systems, and data pipelines.

### Configuration

```yaml
# Enable stderr streaming (good for log aggregation)
THOUGHTBOX_EVENT_OUTPUT: stderr

# Enable file streaming (good for batch processing)
THOUGHTBOX_EVENT_OUTPUT: file
THOUGHTBOX_EVENT_FILE: /var/log/thoughtbox/events.jsonl

# Filter to specific events
THOUGHTBOX_EVENT_TYPES: thought_added,session_started
```

### Event Types

| Event Type | Description | Trigger |
|------------|-------------|---------|
| `thought_added` | New thought recorded | `thought` operation |
| `thought_revised` | Thought revision created | `thought` with `isRevision: true` |
| `branch_created` | New branch started | `thought` with `branchFromThought` |
| `session_started` | New session created | `start_new` operation |
| `session_loaded` | Existing session loaded | `load_context` operation |
| `session_exported` | Session exported | `session.export` operation |
| `cipher_loaded` | Protocol notation loaded | `cipher` operation |
| `stage_changed` | Progressive disclosure advanced | Stage transition |

### JSONL Format

Each line is a self-contained JSON object:

```jsonl
{"type":"session_started","timestamp":"2026-01-21T10:00:00Z","sessionId":"abc-123","data":{"title":"Debug API"}}
{"type":"thought_added","timestamp":"2026-01-21T10:00:05Z","sessionId":"abc-123","data":{"thoughtNumber":1,"thought":"Starting analysis..."}}
{"type":"stage_changed","timestamp":"2026-01-21T10:00:10Z","sessionId":"abc-123","data":{"previousStage":1,"newStage":2,"trigger":"cipher"}}
```

### Consuming Events

```bash
# Tail live events
tail -f /var/log/thoughtbox/events.jsonl | jq -c 'select(.type == "thought_added")'

# Parse with jq
cat events.jsonl | jq -s 'group_by(.sessionId) | map({session: .[0].sessionId, thoughts: length})'

# Send to monitoring
tail -f events.jsonl | nc monitoring.example.com 5140
```

---

## Server Configuration Object

```yaml
ServerConfig:
  type: object
  properties:
    disableThoughtLogging:
      type: boolean
      default: false
      description: "Suppress stderr output"

    autoCreateSession:
      type: boolean
      default: true
      description: "Auto-create session on first thought"

    reasoningSessionId:
      type: string
      nullable: true
      description: "Pre-load specific session"
```

---

## Cipher Protocol

The cipher is a formal protocol enabling deterministic server-side parsing without LLM inference.

### Step Type Markers

| Marker | Meaning | Example |
|--------|---------|---------|
| `H` | Hypothesis | `S12\|H\|API latency caused by db` |
| `E` | Evidence | `S13\|E\|S12\|Logs show 500ms queries` |
| `C` | Conclusion | `S14\|C\|S12,S13\|DB needs indexing` |
| `Q` | Question | `S15\|Q\|Why no index on user_id?` |
| `R` | Revision | `S16\|R\|^S12\|Actually network issue` |
| `P` | Plan | `S17\|P\|1. Add index 2. Test 3. Deploy` |
| `O` | Observation | `S18\|O\|CPU at 95% during peak` |
| `A` | Assumption | `S19\|A\|Assuming prod config` |
| `X` | Rejected | `S20\|X\|S12\|Hypothesis disproven` |

### Logical Operators

| Symbol | Meaning |
|--------|---------|
| `→` | implies / leads to |
| `←` | derived from / because of |
| `∴` | therefore |
| `∵` | because |
| `∧` | and |
| `∨` | or |
| `¬` | not |
| `⊕` | supports |
| `⊖` | contradicts |

### Reference Syntax

| Pattern | Meaning |
|---------|---------|
| `[SN]` | Reference to thought N |
| `^[SN]` | Revision of thought N |
| `S1,S2,S3` | Multiple references |

### Complete Thought Format

```
{thought_number}|{type}|{references}|{content}
```

### Example Reasoning Chain

```
S1|O|User reports slow page loads
S2|H|S1|Database queries causing latency
S3|E|S2|Query logs show 2s avg response
S4|H|S3|Missing index on users.email
S5|E|S4|EXPLAIN shows full table scan
S6|C|S4,S5|∴ Add index on users.email
S7|P|S6|1. Create migration 2. Apply to staging 3. Verify 4. Deploy
```

### Benefits

- **2-4x compression** vs natural language
- **LLM-parseable** without special training
- **Human-readable** for debugging
- **Deterministic parsing** on server side
- **Graph construction** from linear stream

---

## Appendix: Mental Models Catalog

| Model ID | Name | Tags |
|----------|------|------|
| `rubber-duck` | Rubber Duck Debugging | debugging |
| `five-whys` | Five Whys | debugging, problem-solving |
| `pre-mortem` | Pre-Mortem Analysis | planning, risk-management |
| `steelmanning` | Steelmanning | decision-making |
| `fermi-estimation` | Fermi Estimation | planning, analysis |
| `trade-off-matrix` | Trade-off Matrix | decision-making |
| `decomposition` | Problem Decomposition | planning, problem-solving |
| `inversion` | Inversion | decision-making, risk-management |
| `abstraction-laddering` | Abstraction Laddering | problem-solving, analysis |
| `constraint-relaxation` | Constraint Relaxation | problem-solving |
| `assumption-surfacing` | Assumption Surfacing | analysis |
| `adversarial-thinking` | Adversarial Thinking | risk-management |
| `time-horizon-shifting` | Time Horizon Shifting | planning, decision-making |
| `impact-effort-grid` | Impact-Effort Grid | planning, decision-making |
| `opportunity-cost` | Opportunity Cost | decision-making |

---

## Appendix: Resources and Prompts

### Static Resources

| URI | Type | Description |
|-----|------|-------------|
| `thoughtbox://init` | Markdown | Session initialization guide |
| `thoughtbox://architecture` | Markdown | Server architecture docs |
| `thoughtbox://cipher` | Markdown | Protocol notation reference |
| `thoughtbox://patterns-cookbook` | Markdown | Reasoning pattern examples |
| `thoughtbox://session-analysis-guide` | Markdown | Analysis methodology |
| `thoughtbox://mental-models` | JSON | Mental models directory |
| `thoughtbox://mental-models/{tag}/{model}` | Markdown | Individual model content |

### Prompts

| Prompt | Purpose |
|--------|---------|
| `list_mcp_assets` | Overview of all capabilities |
| `interleaved-thinking` | Alternate reasoning with tool execution |
| `subagent-summarize` | RLM-style context isolation |
| `evolution-check` | A-Mem retroactive linking |

---

*See also: [Architecture Overview](./ARCHITECTURE.md) | [Data Models](./DATA-MODELS.md) | [Tool Interfaces](./TOOL-INTERFACES.md)*
