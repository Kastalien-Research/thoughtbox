# Behavioral Tests: Observability, Events, Resources, and Prompts

This test suite covers Thoughtbox's observability features (health checks, metrics, alerts), event systems (Observatory and JSONL events), resource templates, and prompt workflows.

## Table of Contents

1. [Observability Gateway Tests](#observability-gateway-tests)
2. [Observatory Events Tests](#observatory-events-tests)
3. [Resource Templates Tests](#resource-templates-tests)
4. [Prompt Workflows Tests](#prompt-workflows-tests)
5. [Event Stream Tests](#event-stream-tests)

---

## Observability Gateway Tests

The observability gateway provides direct access to metrics, health, and session info without requiring session initialization.

### Test: Check System Health
<!-- Citation: src/observability/gateway-handler.ts:142-186, src/observability/operations/health.ts:31-82 -->

**Action:**
```javascript
observability_gateway({
  operation: "health"
})
```

**Expected Outcome:**
- Returns overall status: "healthy", "degraded", or "unhealthy"
- Includes health status for default services: thoughtbox, sidecar, prometheus, grafana
- Each service shows status and optional metadata (version, uptime, targets, etc.)
- Returns ISO 8601 timestamp

**Verification:**
- Response has `status` field with one of the valid statuses
- `services` object contains entries for all requested services
- Thoughtbox service shows version if healthy
- Prometheus service shows target counts if healthy

### Test: Check Health of Specific Services
<!-- Citation: src/observability/operations/health.ts:31-82 -->

**Action:**
```javascript
observability_gateway({
  operation: "health",
  args: {
    services: ["thoughtbox", "prometheus"]
  }
})
```

**Expected Outcome:**
- Returns health only for specified services
- Excludes sidecar and grafana from results
- Overall status computed from specified services only

**Verification:**
- `services` object contains exactly 2 entries
- Keys are "thoughtbox" and "prometheus"
- No other service entries present

### Test: Query Instant Metrics
<!-- Citation: src/observability/gateway-handler.ts:189-190, src/observability/operations/metrics.ts:21-29 -->

**Action:**
```javascript
observability_gateway({
  operation: "metrics",
  args: {
    query: "mcp_active_connections"
  }
})
```

**Expected Outcome:**
- Returns Prometheus query result
- Result has `status: "success"` or `status: "error"`
- For success: includes `data.resultType` and `data.result` array
- Each metric has `metric` labels and `value` [timestamp, value] tuple

**Verification:**
- Response has `status` field
- If successful, `data.result` is an array
- Each result entry has `metric` object and `value` array

### Test: Query Time Series Metrics
<!-- Citation: src/observability/gateway-handler.ts:193-194, src/observability/operations/metrics.ts:32-46 -->

**Action:**
```javascript
observability_gateway({
  operation: "metrics_range",
  args: {
    query: "mcp_upstream_available",
    start: "2025-01-30T10:00:00Z",
    end: "2025-01-30T11:00:00Z",
    step: "1m"
  }
})
```

**Expected Outcome:**
- Returns range query result with time series data
- Each metric has `values` array instead of single `value`
- Values array contains [timestamp, value] tuples for each step
- Step parameter controls resolution (defaults to 15s if omitted)

**Verification:**
- Response data.result entries have `values` array
- Values array has multiple entries
- Timestamps are evenly spaced by step duration

### Test: Query with Missing Required Parameters
<!-- Citation: src/observability/operations/metrics.ts:25-27, src/observability/operations/metrics.ts:36-44 -->

**Action:**
```javascript
observability_gateway({
  operation: "metrics",
  args: {}
})
```

**Expected Outcome:**
- Returns error response
- Error message: "Missing required argument: query"
- `isError: true` in tool result

**Verification:**
- Response contains error field
- Error message indicates missing query parameter

### Test: List Active Reasoning Sessions
<!-- Citation: src/observability/gateway-handler.ts:197-198, src/observability/operations/sessions.ts:46-88 -->

**Action:**
```javascript
observability_gateway({
  operation: "sessions",
  args: {
    limit: 10,
    status: "active"
  }
})
```

**Expected Outcome:**
- Returns array of active sessions (accessed within last 30 minutes)
- Each session includes: id, title, thoughtCount, branchCount, createdAt, lastActivity, status, tags
- Sessions sorted by last activity (most recent first)
- Total count reflects filtered count

**Verification:**
- `sessions` array has length <= 10
- All sessions have `status: "active"`
- Each session has required fields
- `total` field indicates total active sessions

### Test: Get Session Detailed Information
<!-- Citation: src/observability/gateway-handler.ts:201-202, src/observability/operations/sessions.ts:91-131 -->

**Action:**
```javascript
observability_gateway({
  operation: "session_info",
  args: {
    sessionId: "test-session-123"
  }
})
```

**Expected Outcome:**
- Returns detailed session info with additional metrics
- Includes base fields plus description and metrics object
- Metrics include revisionsCount
- Status computed from last activity timestamp

**Verification:**
- Response has all base session fields
- `metrics` object present with `revisionsCount`
- Status is either "active" or "idle"

### Test: Get Alerts from Prometheus
<!-- Citation: src/observability/gateway-handler.ts:205-206, src/observability/operations/alerts.ts:29-65 -->

**Action:**
```javascript
observability_gateway({
  operation: "alerts",
  args: {
    state: "firing"
  }
})
```

**Expected Outcome:**
- Returns array of firing alerts only
- Each alert has: name, state, severity, summary, description, activeAt, value
- Summary counts show total firing and pending alerts
- State filter applied correctly

**Verification:**
- All alerts in `alerts` array have `state: "firing"`
- `firing` count matches alerts array length
- `pending` count shows total pending (not filtered)

### Test: Generate Dashboard URL
<!-- Citation: src/observability/gateway-handler.ts:209-213 -->

**Action:**
```javascript
observability_gateway({
  operation: "dashboard_url",
  args: {
    dashboard: "thoughtbox-sessions"
  }
})
```

**Expected Outcome:**
- Returns Grafana dashboard URL
- URL format: `{grafanaUrl}/d/{dashboard}/{dashboard}`
- Dashboard parameter embedded in path twice
- Default dashboard is "thoughtbox-mcp" if not specified

**Verification:**
- Response has `url` and `dashboard` fields
- URL contains specified dashboard name twice
- URL starts with Grafana base URL

---

## Observatory Events Tests

The Observatory provides real-time WebSocket-based observation of reasoning processes.

### Test: Subscribe to Reasoning Channel
<!-- Citation: src/observatory/ws-server.ts:254-282, src/observatory/channels/reasoning.ts:169-195 -->

**Action:**
1. Connect WebSocket to Observatory server
2. Send subscribe message: `["reasoning:session-123", "subscribe", {}]`

**Expected Outcome:**
- Receives `subscribed` confirmation event
- Receives `session:snapshot` with full session state
- Snapshot includes session object, thoughts array, branches object
- Future thought events broadcast to this connection

**Verification:**
- First message after subscribe is `subscribed` event
- Second message is `session:snapshot` with complete data
- Can parse snapshot payload to validate structure

### Test: Receive Thought Added Event
<!-- Citation: src/observatory/emitter.ts:241-243, src/observatory/channels/reasoning.ts:198-215 -->

**Action:**
1. Subscribe to reasoning channel
2. Trigger thought addition in session
3. Listen for WebSocket events

**Expected Outcome:**
- Receives `thought:added` event with thought data
- Event includes: thought object, parentId, sessionId
- Thought stored in memory for new subscribers
- Event broadcast to all channel subscribers

**Verification:**
- WebSocket receives message: `["reasoning:session-123", "thought:added", {...}]`
- Payload contains thought with thoughtNumber, timestamp, content
- Parent relationship included

### Test: Receive Thought Revised Event
<!-- Citation: src/observatory/emitter.ts:250-252, src/observatory/channels/reasoning.ts:217-226 -->

**Action:**
1. Subscribe to reasoning channel
2. Trigger thought revision in session
3. Listen for WebSocket events

**Expected Outcome:**
- Receives `thought:revised` event
- Includes revised thought, parentId, and originalThoughtNumber
- Revised thought added to session store
- Event broadcast to subscribers

**Verification:**
- Event payload has `originalThoughtNumber` field
- Revised thought has different content than original
- Both thoughts exist in session after revision

### Test: Receive Branch Created Event
<!-- Citation: src/observatory/emitter.ts:261-263, src/observatory/channels/reasoning.ts:228-238 -->

**Action:**
1. Subscribe to reasoning channel
2. Create branch in session
3. Listen for WebSocket events

**Expected Outcome:**
- Receives `thought:branched` event
- Includes: thought, parentId, branchId, fromThoughtNumber
- Branch thought stored separately in branches map
- Event broadcast to subscribers

**Verification:**
- Payload has `branchId` and `fromThoughtNumber`
- Branch thought has branchId set
- Branch accessible in session branches object

### Test: Receive Session Started Event
<!-- Citation: src/observatory/emitter.ts:271-273, src/observatory/channels/reasoning.ts:240-242 -->

**Action:**
1. Start new reasoning session
2. Listen on observatory channel (if subscribed)

**Expected Outcome:**
- Session stored in memory store
- New subscribers can retrieve session via snapshot
- Session appears in sessions list

**Verification:**
- Session exists in sessionStore
- Can subscribe to reasoning:{sessionId} channel
- Snapshot includes new session

### Test: Receive Session Ended Event
<!-- Citation: src/observatory/emitter.ts:281-283, src/observatory/channels/reasoning.ts:244-259 -->

**Action:**
1. Subscribe to reasoning channel
2. End reasoning session
3. Listen for WebSocket events

**Expected Outcome:**
- Receives `session:ended` event with sessionId and finalThoughtCount
- Session status updated to "completed"
- Session completedAt timestamp set
- Event broadcast to subscribers

**Verification:**
- Event payload has `finalThoughtCount`
- Session status changed to "completed"
- CompletedAt timestamp is valid ISO 8601

### Test: Fire-and-Forget Event Emission
<!-- Citation: src/observatory/emitter.ts:367-383 -->

**Action:**
1. Register listener that throws error
2. Emit thought event
3. Verify main process continues

**Expected Outcome:**
- Event emission completes immediately (synchronous)
- Listener error logged to console but not thrown
- Main reasoning process unaffected by listener failure
- Other listeners still receive events

**Verification:**
- No exception propagates to emitter caller
- Console shows error log from safeEmit
- Event processing continues normally

### Test: Subscribe to Multiple Channels
<!-- Citation: src/observatory/ws-server.ts:158-190 -->

**Action:**
1. Connect WebSocket
2. Subscribe to "observatory" channel
3. Subscribe to "reasoning:session-123" channel
4. Verify connection tracks both subscriptions

**Expected Outcome:**
- Connection subscriptions set contains both topics
- Receives broadcasts on both channels
- Can unsubscribe from each independently
- Max connections limit enforced

**Verification:**
- Connection.subscriptions.size === 2
- Receives events on both topics
- Unsubscribe removes only specified subscription

### Test: WebSocket Connection Limit
<!-- Citation: src/observatory/ws-server.ts:159-164 -->

**Action:**
1. Configure maxConnections: 2
2. Establish 3 WebSocket connections
3. Verify third connection rejected

**Expected Outcome:**
- First two connections accepted
- Third connection closed with code 1008
- Close reason: "Server at maximum capacity"
- Warning logged to console

**Verification:**
- Only 2 connections active
- Third connection receives close event
- getConnectionCount() returns 2

---

## Resource Templates Tests

Resources expose documentation, query capabilities, and workflow guidance.

### Test: List All Resources
<!-- Citation: src/server-factory.ts:1-150 (registration), src/resources/* -->

**Action:**
```javascript
// MCP list_resources request
```

**Expected Outcome:**
- Returns list of static resources with URIs
- Includes: thoughtbox://cipher, thoughtbox://architecture, thoughtbox://patterns-cookbook
- Includes: thoughtbox://session-analysis-guide, thoughtbox://loops/catalog
- Includes: thoughtbox://mental-models/operations, thoughtbox://knowledge/stats
- Each resource has uri, name, mimeType, description

**Verification:**
- Response contains array of resources
- Each resource has required MCP fields
- URIs follow thoughtbox:// scheme

### Test: List Resource Templates
<!-- Citation: src/prompts/index.ts:435-452 -->

**Action:**
```javascript
// MCP list_resource_templates request
```

**Expected Outcome:**
- Returns templates with URI patterns containing parameters
- Includes: thoughtbox://interleaved/{mode}
- Includes: thoughtbox://thoughts/{sessionId}/{type}
- Includes: thoughtbox://mental-models/{tag}/{model}
- Templates have uriTemplate, name, description, mimeType

**Verification:**
- Templates contain parameter placeholders: {mode}, {sessionId}, {type}
- Each template has annotations with audience and priority
- MimeType is text/markdown or appropriate type

### Test: Read Static Resource
<!-- Citation: src/resources/thoughtbox-cipher-content.ts -->

**Action:**
```javascript
// MCP read_resource request for thoughtbox://cipher
```

**Expected Outcome:**
- Returns Thoughtbox cipher documentation
- Content includes S|TYPE| notation guide
- Includes thought types: H, E, C, Q, R, P, O, A, X
- MimeType: text/markdown

**Verification:**
- Response has uri, mimeType, text fields
- Text contains cipher notation examples
- Document explains thought types and linking

### Test: Read Templated Resource - Interleaved Guide
<!-- Citation: src/prompts/index.ts:462-485 -->

**Action:**
```javascript
// MCP read_resource for thoughtbox://interleaved/research
```

**Expected Outcome:**
- Returns mode-specific interleaved thinking guide
- Mode parameter validated: research, analysis, or development
- Content tailored to specified mode
- MimeType: text/markdown

**Verification:**
- URI matches expected pattern
- Content differs based on mode parameter
- Invalid mode throws error

### Test: Query Thoughts by Type
<!-- Citation: src/resources/thought-query-handler.ts:69-90 -->

**Action:**
```javascript
// MCP read_resource for thoughtbox://thoughts/session-123/H
```

**Expected Outcome:**
- Returns all hypothesis thoughts from session
- Filters by type prefix: S\d+\|H\|
- Response includes sessionId, query, thoughts array, count
- Each thought has thoughtNumber, content, timestamp, type

**Verification:**
- All returned thoughts have type === "H"
- Count matches thoughts array length
- Thoughts sorted by thoughtNumber

### Test: Query Thought Range
<!-- Citation: src/resources/thought-query-handler.ts:96-118 -->

**Action:**
```javascript
// MCP read_resource for thoughtbox://thoughts/session-123/range/5-10
```

**Expected Outcome:**
- Returns thoughts 5 through 10 inclusive
- Range validated: start >= 1, end >= start
- Results filtered by thoughtNumber
- Missing thoughts in range handled gracefully

**Verification:**
- All thoughts have thoughtNumber between 5 and 10
- Results include exactly the requested range
- Invalid ranges rejected with error

### Test: Find Thought References
<!-- Citation: src/resources/thought-query-handler.ts:123-146 -->

**Action:**
```javascript
// MCP read_resource for thoughtbox://references/session-123/42
```

**Expected Outcome:**
- Returns all thoughts referencing S42
- Matches patterns: [S42], S10-S42, S42-S50, S42 standalone
- Searches thought content for references
- Returns referencing thoughts with metadata

**Verification:**
- Returned thoughts contain "S42" or "[S42]" in content
- Reference patterns correctly detected
- No false positives from similar numbers

### Test: Get Revision History
<!-- Citation: src/resources/thought-query-handler.ts:152-193 -->

**Action:**
```javascript
// MCP read_resource for thoughtbox://revisions/session-123/10
```

**Expected Outcome:**
- Returns original thought plus all revisions
- Revisions linked via revisesNode field
- Results sorted by timestamp (chronological)
- Includes isRevision flag on revision thoughts

**Verification:**
- First thought in results is original (thoughtNumber === 10)
- Subsequent thoughts have isRevision === true
- Timestamps increase chronologically
- All revisions point to same original node

### Test: Browse Mental Models by Tag
<!-- Citation: src/mental-models/* (resource templates) -->

**Action:**
```javascript
// MCP read_resource for thoughtbox://mental-models/decision
```

**Expected Outcome:**
- Returns list of mental models tagged "decision"
- Each model shows name, description, tags
- Models formatted for browsing
- Can drill down to individual model content

**Verification:**
- All returned models have "decision" tag
- Response includes model metadata
- Can construct URI for individual model

### Test: Read OODA Loop Content
<!-- Citation: src/resources/loops-content.ts -->

**Action:**
```javascript
// MCP read_resource for thoughtbox://loops/observe/context-scan
```

**Expected Outcome:**
- Returns loop content for specific category/name
- Loop includes description, phases, deliverables
- Structured as building block for workflows
- MimeType: text/markdown

**Verification:**
- Response contains loop definition
- Loop has all required fields
- Content formatted for agent consumption

---

## Prompt Workflows Tests

Prompts provide structured workflows with argument substitution.

### Test: List Available Prompts
<!-- Citation: src/prompts/index.ts -->

**Action:**
```javascript
// MCP list_prompts request
```

**Expected Outcome:**
- Returns registered prompts with metadata
- Includes: interleaved-thinking, parallel-verification, spec-designer, etc.
- Each prompt has name, description, arguments array
- Arguments specify required/optional flags

**Verification:**
- Response contains prompt definitions
- Each prompt has name and arguments
- Argument definitions include type and required flag

### Test: Get Interleaved Thinking Prompt
<!-- Citation: src/prompts/index.ts:217-251 -->

**Action:**
```javascript
// MCP get_prompt: interleaved-thinking
{
  task: "Analyze user authentication flow",
  thoughts_limit: 50,
  clear_folder: true
}
```

**Expected Outcome:**
- Returns workflow content with substituted variables
- TASK replaced with provided task
- THOUGHTS_LIMIT set to 50
- CLEAR_FOLDER set to true
- Defaults applied for omitted arguments

**Verification:**
- Response contains markdown workflow guide
- Variables section shows substituted values
- Workflow instructions intact
- Default values applied where arguments omitted

### Test: Get Parallel Verification Prompt
<!-- Citation: src/prompts/contents/parallel-verification.ts -->

**Action:**
```javascript
// MCP get_prompt: parallel-verification
{
  input: "Compare three approaches to caching: max_branches:3"
}
```

**Expected Outcome:**
- Returns parallel verification workflow
- Parses max_branches from input if present
- Sets up branching structure for hypothesis exploration
- Instructions for running parallel thought paths

**Verification:**
- Workflow content includes branching instructions
- max_branches parameter extracted and applied
- Default to 3 branches if not specified

### Test: Get Spec Designer Prompt
<!-- Citation: src/prompts/index.ts:256-293 -->

**Action:**
```javascript
// MCP get_prompt: spec-designer
{
  prompt: "Design user session management",
  output_folder: ".specs/sessions/",
  depth: "comprehensive",
  max_specs: 10
}
```

**Expected Outcome:**
- Returns spec design workflow with OODA loop structure
- Variables substituted in workflow content
- OUTPUT_FOLDER set to provided path
- DEPTH and MAX_SPECS configured
- Confidence threshold set to default 0.85

**Verification:**
- Workflow includes OODA loop phases
- All variables correctly substituted
- Output folder path in variables section
- Depth parameter affects workflow detail

### Test: Get Spec Validator Prompt
<!-- Citation: src/prompts/index.ts:298-331 -->

**Action:**
```javascript
// MCP get_prompt: spec-validator
{
  spec_path: ".specs/sessions/session-management.md",
  strict: "true",
  deep: "true"
}
```

**Expected Outcome:**
- Returns validation workflow content
- SPEC_PATH set to provided path
- STRICT_MODE enables fail-on-missing behavior
- DEEP_VALIDATION enables semantic analysis
- RESUME defaulted to false

**Verification:**
- Workflow includes validation phases
- Strict mode affects validation criteria
- Deep validation adds cross-file analysis
- All boolean flags properly handled

### Test: Get Spec Orchestrator Prompt
<!-- Citation: src/prompts/index.ts:336-371 -->

**Action:**
```javascript
// MCP get_prompt: spec-orchestrator
{
  spec_folder: ".specs/",
  budget: 200,
  max_iterations: 5,
  plan_only: "true"
}
```

**Expected Outcome:**
- Returns orchestration workflow
- BUDGET set to energy units
- MAX_ITERATIONS controls per-spec attempts
- PLAN_ONLY skips implementation phase
- Confidence threshold default 0.9

**Verification:**
- Workflow includes dependency management
- Budget controls implementation scope
- Plan-only mode for analysis without implementation
- WORKTREE_MODE defaulted to false

### Test: Get Specification Suite Prompt
<!-- Citation: src/prompts/index.ts:376-429 -->

**Action:**
```javascript
// MCP get_prompt: specification-suite
{
  prompt_or_spec_path: "Design authentication system",
  output_folder: ".specs/auth/",
  depth: "standard",
  budget: 150,
  skip_validation: "true"
}
```

**Expected Outcome:**
- Returns chained workflow: design → validate → orchestrate
- PROMPT_OR_SPEC_PATH determines starting point
- SKIP_VALIDATION jumps from design to orchestration
- Combines parameters for all three sub-workflows

**Verification:**
- Workflow chains three prompt workflows
- Skip flags control which phases run
- Parameters passed to appropriate sub-workflows
- Default values applied for omitted params

### Test: Prompt with Missing Required Argument
<!-- Citation: src/prompts/index.ts (argument validation) -->

**Action:**
```javascript
// MCP get_prompt: interleaved-thinking
{
  thoughts_limit: 100
  // Missing required 'task' argument
}
```

**Expected Outcome:**
- Returns error indicating missing required argument
- Error message specifies which argument is missing
- No workflow content returned

**Verification:**
- Response indicates error
- Error mentions "task" argument
- No partial substitution performed

---

## Event Stream Tests

JSONL event streaming for external monitoring and integration.

### Test: Enable Event Stream to stderr
<!-- Citation: src/events/event-emitter.ts:140-161 -->

**Action:**
1. Set THOUGHTBOX_EVENTS_ENABLED=true
2. Set THOUGHTBOX_EVENTS_DEST=stderr
3. Create new session
4. Capture stderr output

**Expected Outcome:**
- Session creation emits JSONL line to stderr
- Event has type: "session_created"
- Event includes timestamp, payload with sessionId and title
- Optional mcpSessionId if configured

**Verification:**
- stderr contains valid JSON line
- Can parse JSON and validate schema
- Timestamp is valid ISO 8601
- Event type matches expected value

### Test: Emit Thought Added Event
<!-- Citation: src/events/event-emitter.ts:92-97 -->

**Action:**
1. Configure event emitter with enabled: true
2. Add thought to session
3. Capture event output

**Expected Outcome:**
- Emits thought_added event
- Payload includes: sessionId, thoughtNumber, wasAutoAssigned, thoughtPreview
- thoughtPreview truncated to first 100 characters
- Event written as single JSONL line

**Verification:**
- Event type is "thought_added"
- thoughtPreview max length is 100 chars
- wasAutoAssigned is boolean
- thoughtNumber matches added thought

### Test: Emit Branch Created Event
<!-- Citation: src/events/event-emitter.ts:103-108 -->

**Action:**
1. Enable event stream
2. Create branch in session
3. Capture event

**Expected Outcome:**
- Emits branch_created event
- Payload: sessionId, branchId, fromThoughtNumber
- branchId is unique identifier
- fromThoughtNumber indicates branch point

**Verification:**
- Event type correct
- branchId is non-empty string
- fromThoughtNumber is valid thought number

### Test: Emit Session Completed Event
<!-- Citation: src/events/event-emitter.ts:114-119 -->

**Action:**
1. Enable event stream
2. Complete session
3. Capture event

**Expected Outcome:**
- Emits session_completed event
- Payload: sessionId, finalThoughtCount, branchCount
- Counts reflect final session state
- Timestamp marks completion time

**Verification:**
- Event type is "session_completed"
- finalThoughtCount >= 0
- branchCount >= 0

### Test: Emit Export Requested Event
<!-- Citation: src/events/event-emitter.ts:125-130 -->

**Action:**
1. Enable event stream
2. Request session export
3. Capture event

**Expected Outcome:**
- Emits export_requested event
- Payload: sessionId, exportPath, nodeCount
- exportPath shows destination
- nodeCount reflects exported nodes

**Verification:**
- Event type correct
- exportPath is valid file path
- nodeCount matches export result

### Test: Event Stream to File
<!-- Citation: src/events/event-emitter.ts:166-184 -->

**Action:**
1. Set THOUGHTBOX_EVENTS_DEST=/tmp/thoughtbox-events.jsonl
2. Perform multiple operations
3. Read file contents

**Expected Outcome:**
- Events appended to specified file
- Directory created if doesn't exist
- Each line is valid JSON
- Events in chronological order

**Verification:**
- File exists at specified path
- File contains one JSON object per line
- Can parse all lines successfully
- Timestamps increase monotonically

### Test: Event Stream Disabled
<!-- Citation: src/events/event-emitter.ts:56-58, src/events/event-emitter.ts:141-143 -->

**Action:**
1. Set THOUGHTBOX_EVENTS_ENABLED=false (or omit)
2. Perform operations
3. Check for event output

**Expected Outcome:**
- No events emitted
- Event emitter returns early
- No performance impact from disabled events
- Main operations unaffected

**Verification:**
- No JSONL output produced
- isEnabled() returns false
- Operations complete normally

### Test: Event Emission Error Handling
<!-- Citation: src/events/event-emitter.ts:155-160 -->

**Action:**
1. Configure invalid file path (e.g., /readonly/path.jsonl)
2. Attempt event emission
3. Verify graceful failure

**Expected Outcome:**
- Error logged to console
- Main operation continues successfully
- No exception thrown to caller
- Event emission fails silently

**Verification:**
- Console shows error message
- Operation that triggered event succeeds
- No unhandled exceptions

### Test: Include MCP Session ID
<!-- Citation: src/events/event-emitter.ts:146-151 -->

**Action:**
1. Set includeMcpSessionId: true
2. Set MCP session ID on emitter
3. Emit events
4. Verify mcpSessionId in events

**Expected Outcome:**
- Events include mcpSessionId field
- mcpSessionId matches configured value
- Enables client-side event filtering
- Optional field omitted if not configured

**Verification:**
- Event JSON has mcpSessionId field
- Value matches setMcpSessionId() value
- Field absent when includeMcpSessionId: false

---

## Integration Tests

### Test: Observability with Observatory Integration
<!-- Citation: src/observability/*, src/observatory/* -->

**Action:**
1. Enable Observatory WebSocket server
2. Subscribe to reasoning channel
3. Query observability_gateway for session_info
4. Verify data consistency

**Expected Outcome:**
- Both systems show same session state
- observability_gateway reflects current status
- Observatory events show real-time updates
- Session counts match between systems

**Verification:**
- Session info from gateway matches Observatory snapshot
- Thought counts consistent
- Both show same session status (active/idle)

### Test: Resource and Prompt Workflow Consistency
<!-- Citation: src/resources/*, src/prompts/* -->

**Action:**
1. List prompts via MCP
2. Get prompt content for interleaved-thinking
3. Compare with thoughtbox://interleaved/{mode} resource
4. Verify complementary documentation

**Expected Outcome:**
- Prompt provides executable workflow
- Resource provides reference documentation
- Both reference same Thoughtbox operations
- Content complementary but distinct

**Verification:**
- Prompt has argument substitution
- Resource is static documentation
- Both mention same thought types and operations

### Test: Event Stream and Observatory Event Correlation
<!-- Citation: src/events/*, src/observatory/* -->

**Action:**
1. Enable both JSONL event stream and Observatory
2. Create session and add thoughts
3. Capture JSONL events
4. Monitor Observatory WebSocket events
5. Compare event sequences

**Expected Outcome:**
- Both systems emit events for same operations
- JSONL events have different schema (flatter)
- Observatory events have richer metadata
- Both show same operation sequence

**Verification:**
- session_created in JSONL correlates with session:started in Observatory
- thought_added events appear in both streams
- Timestamps closely match
- Event order consistent between systems

---

## Performance and Reliability Tests

### Test: Observatory Event Emission Performance
<!-- Citation: src/observatory/emitter.ts:367-383 -->

**Action:**
1. Emit 1000 thought events rapidly
2. Measure emission time
3. Verify no blocking

**Expected Outcome:**
- All events emit synchronously
- No async/await delays
- Total time < 100ms for 1000 events
- No listener backpressure

**Verification:**
- Emission completes immediately
- No event queue buildup
- Listeners process asynchronously

### Test: WebSocket Server Max Connections
<!-- Citation: src/observatory/ws-server.ts:73, src/observatory/ws-server.ts:159-164 -->

**Action:**
1. Set maxConnections to 100
2. Attempt to establish 150 connections
3. Verify graceful rejection

**Expected Outcome:**
- First 100 connections accepted
- Connections 101-150 rejected with code 1008
- Server remains stable
- Existing connections unaffected

**Verification:**
- getConnectionCount() returns 100
- Rejected connections receive close event
- No server errors or crashes

### Test: Prometheus Client Timeout Handling
<!-- Citation: src/observability/prometheus-client.ts:58-65, src/observability/prometheus-client.ts:126-139 -->

**Action:**
1. Configure PrometheusClient with timeout: 5000
2. Query non-responsive Prometheus endpoint
3. Verify timeout enforcement

**Expected Outcome:**
- Query aborts after 5 seconds
- Throws error with timeout message
- Does not hang indefinitely
- Error caught by gateway handler

**Verification:**
- Request completes within timeout + margin
- Error indicates timeout or network failure
- Gateway returns error response to client

### Test: Session Store Memory Cleanup
<!-- Citation: src/observatory/channels/reasoning.ts:117-149 -->

**Action:**
1. Create 1100 sessions in sessionStore
2. Verify cleanup triggers at 1000
3. Check oldest completed sessions removed

**Expected Outcome:**
- Store maintains <= 1000 sessions
- Oldest completed/abandoned sessions removed first
- Active sessions preserved
- Cleanup logged to console

**Verification:**
- getAllSessions().length <= 1000
- Removed sessions are oldest by createdAt
- Active sessions still accessible

---

## Error Handling Tests

### Test: Invalid Resource URI
<!-- Citation: src/resources/thought-query-handler.ts:198-220 -->

**Action:**
```javascript
// MCP read_resource for invalid URI
thoughtbox://invalid/path/structure
```

**Expected Outcome:**
- Throws error with descriptive message
- Error indicates URI pattern not recognized
- No partial parsing attempted
- Error message suggests valid patterns

**Verification:**
- Error message mentions URI pattern matching
- No resource content returned
- Error clearly identifies the problem

### Test: Query Non-Existent Session
<!-- Citation: src/observability/operations/sessions.ts:99-102 -->

**Action:**
```javascript
observability_gateway({
  operation: "session_info",
  args: {
    sessionId: "does-not-exist"
  }
})
```

**Expected Outcome:**
- Returns error response
- Error message: "Session not found: does-not-exist"
- isError flag set to true
- No partial data returned

**Verification:**
- Response indicates error
- Error message includes session ID
- No session object in response

### Test: Malformed WebSocket Message
<!-- Citation: src/observatory/ws-server.ts:199-218 -->

**Action:**
1. Connect to Observatory WebSocket
2. Send invalid JSON: `{broken json`
3. Verify error handling

**Expected Outcome:**
- Receives error event on "error" topic
- Error code: "INVALID_PAYLOAD"
- Error message: "Invalid JSON"
- Connection remains open

**Verification:**
- Error event received
- Connection not closed
- Can send valid messages after error

### Test: Invalid Prometheus Query
<!-- Citation: src/observability/prometheus-client.ts:126-139 -->

**Action:**
```javascript
observability_gateway({
  operation: "metrics",
  args: {
    query: "invalid{query{syntax"
  }
})
```

**Expected Outcome:**
- Prometheus returns error response
- Gateway forwards error to client
- Response has status: "error"
- Error type and message from Prometheus

**Verification:**
- Response indicates query error
- Error message describes syntax issue
- No crash or unhandled exception

