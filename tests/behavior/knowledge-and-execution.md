# Knowledge Graph, Notebooks, Mental Models, and Sampling - Behavioral Tests

This test suite covers the execution and knowledge management capabilities of Thoughtbox:

1. **Knowledge Graph**: Entity/relation/observation CRUD, queries, JSONL+SQLite dual storage
2. **Notebooks**: Headless executable notebooks with JavaScript/TypeScript support
3. **Mental Models**: Structured reasoning framework retrieval and discovery
4. **Sampling/RLM**: Autonomous LLM sampling for critique and recursive language model operations

All tests use the `thoughtbox_gateway` MCP tool with appropriate operation parameters.

---

## Knowledge Graph Tests

### Test 1: Create and Retrieve Entity
<!-- Citation: src/knowledge/handler.ts:80-108, src/knowledge/storage.ts:294-374 -->

**Goal:** Verify entity creation with properties and retrieval by ID.

**Action:**
```json
{
  "operation": "knowledge",
  "args": {
    "action": "create_entity",
    "name": "test-workflow-1",
    "type": "Workflow",
    "label": "Test Workflow Pattern",
    "properties": {
      "success_rate": 0.85,
      "complexity": "medium"
    },
    "created_by": "test-agent"
  }
}
```

**Expected Outcome:**
- Response includes `entity_id` (UUID), `name`, `type`, `created_at` (ISO timestamp)
- Entity persisted to `~/.thoughtbox/projects/_default/memory/graph.jsonl` as JSONL entry
- Entity indexed in `~/.thoughtbox/projects/_default/memory/memory.db` SQLite database

**Verification:**
1. Call `get_entity` with returned `entity_id`:
   ```json
   {
     "operation": "knowledge",
     "args": {
       "action": "get_entity",
       "entity_id": "<uuid-from-create>"
     }
   }
   ```
2. Verify response contains all fields including properties
3. Check JSONL file contains line with entity data
4. Verify SQLite has entity with `SELECT * FROM entities WHERE id = '<uuid>'`

---

### Test 2: List Entities with Filters
<!-- Citation: src/knowledge/handler.ts:128-156, src/knowledge/storage.ts:393-438 -->

**Goal:** Verify entity listing with type and visibility filters.

**Action:**
1. Create multiple entities of different types:
   - Insight: "test-insight-1"
   - Workflow: "test-workflow-2"
   - Concept: "test-concept-1"
2. List all entities:
   ```json
   {
     "operation": "knowledge",
     "args": {
       "action": "list_entities"
     }
   }
   ```
3. List only Workflow entities:
   ```json
   {
     "operation": "knowledge",
     "args": {
       "action": "list_entities",
       "types": ["Workflow"]
     }
   }
   ```

**Expected Outcome:**
- First call returns all 3 entities with count and entity summaries
- Second call returns only Workflow entity (test-workflow-2)
- Entities sorted by `importance_score DESC`

**Verification:**
- Verify `count` field matches number of `entities` in response
- Verify filtered list excludes non-Workflow types
- Verify each entity has `id`, `name`, `type`, `label`, `created_at`

---

### Test 3: Add Observations to Entity
<!-- Citation: src/knowledge/handler.ts:158-182, src/knowledge/storage.ts:537-587 -->

**Goal:** Verify observations can be attached to entities.

**Action:**
1. Create an entity (from Test 1)
2. Add observations:
   ```json
   {
     "operation": "knowledge",
     "args": {
       "action": "add_observation",
       "entity_id": "<entity-uuid>",
       "content": "Successfully applied in production deployment",
       "source_session": "session-abc-123",
       "added_by": "deployment-agent"
     }
   }
   ```
3. Add second observation to same entity
4. Retrieve observations:
   ```json
   {
     "operation": "knowledge",
     "args": {
       "action": "get_entity",
       "entity_id": "<entity-uuid>"
     }
   }
   ```

**Expected Outcome:**
- Each `add_observation` returns `observation_id`, `entity_id`, `added_at`
- Observations appended to JSONL as separate entries
- SQLite `observations` table updated

**Verification:**
- Call storage method `getObservations(entityId)` to verify both observations present
- Verify observations ordered by `added_at DESC`
- Verify `source_session` and `added_by` fields persisted correctly

---

### Test 4: Create Relations Between Entities
<!-- Citation: src/knowledge/handler.ts:184-211, src/knowledge/storage.ts:452-495 -->

**Goal:** Verify typed relations can connect entities.

**Action:**
1. Create two entities (Entity A: Insight, Entity B: Workflow)
2. Create relation:
   ```json
   {
     "operation": "knowledge",
     "args": {
       "action": "create_relation",
       "from_id": "<entity-a-uuid>",
       "to_id": "<entity-b-uuid>",
       "relation_type": "EXTRACTED_FROM",
       "properties": {
         "confidence": 0.9
       },
       "created_by": "analysis-agent"
     }
   }
   ```

**Expected Outcome:**
- Response includes `relation_id`, `from_id`, `to_id`, `type`, `created_at`
- Relation persisted to JSONL
- SQLite `relations` table updated with foreign key constraints enforced

**Verification:**
- Call `getRelationsFrom(entity_a_id)` to verify relation appears
- Call `getRelationsTo(entity_b_id)` to verify relation appears from other direction
- Verify properties JSON serialized correctly
- Test foreign key cascade: delete Entity A, verify relation deleted automatically

---

### Test 5: Graph Traversal Query
<!-- Citation: src/knowledge/handler.ts:213-249, src/knowledge/storage.ts:603-635 -->

**Goal:** Verify breadth-first graph traversal with depth limit.

**Action:**
1. Create entity chain: A → B → C → D (4 entities, 3 relations)
2. Query from A with max_depth=2:
   ```json
   {
     "operation": "knowledge",
     "args": {
       "action": "query_graph",
       "start_entity_id": "<entity-a-uuid>",
       "max_depth": 2
     }
   }
   ```

**Expected Outcome:**
- Response includes entities A, B, C (not D due to depth limit)
- Response includes relations A→B, B→C (not B→D if exists)
- `entity_count`: 3, `relation_count`: 2, `max_depth`: 2

**Verification:**
- Verify Entity D not in results
- Test with `relation_types` filter to only traverse specific edge types
- Test with max_depth=1 to only get immediate neighbors

---

### Test 6: Knowledge Graph Statistics
<!-- Citation: src/knowledge/handler.ts:251-260, src/knowledge/storage.ts:637-677 -->

**Goal:** Verify stats aggregation across entity types and relation types.

**Action:**
```json
{
  "operation": "knowledge",
  "args": {
    "action": "stats"
  }
}
```

**Expected Outcome:**
- `entity_counts`: Object with counts per EntityType (Insight, Workflow, Concept, etc.)
- `relation_counts`: Object with counts per RelationType (RELATES_TO, BUILDS_ON, etc.)
- `total_observations`: Total number of observations across all entities
- `avg_observations_per_entity`: Computed average
- `created_at`, `updated_at`: Timestamps

**Verification:**
- Create 3 entities, 2 relations, 5 observations
- Call stats
- Verify counts: entity_counts.Workflow=1 (or appropriate), total_observations=5
- Verify avg_observations_per_entity = 5/3 ≈ 1.67

---

### Test 7: JSONL Rebuild from Source of Truth
<!-- Citation: src/knowledge/storage.ts:190-221 -->

**Goal:** Verify SQLite index can be rebuilt from JSONL after corruption.

**Action:**
1. Create entities, relations, observations via MCP operations
2. Stop server (docker-compose down)
3. Delete `~/.thoughtbox/projects/_default/memory/memory.db`
4. Start server (docker-compose up)
5. Query entities via MCP

**Expected Outcome:**
- On server start, `rebuildIndexFromJsonl()` runs automatically
- SQLite database recreated from JSONL entries
- All entities, relations, observations restored in query index
- Queries return same data as before deletion

**Verification:**
- Compare entity counts before and after rebuild
- Verify all entity IDs still retrievable
- Verify relations still traversable
- Check server logs for "Rebuilding index from JSONL" message

---

### Test 8: Entity Access Tracking
<!-- Citation: src/knowledge/storage.ts:376-391 -->

**Goal:** Verify access_count and last_accessed_at updated on retrieval.

**Action:**
1. Create entity
2. Call `get_entity` 3 times
3. Query SQLite directly: `SELECT access_count, last_accessed_at FROM entities WHERE id = '<uuid>'`

**Expected Outcome:**
- `access_count` incremented to 3
- `last_accessed_at` updated to most recent access timestamp

**Verification:**
- Verify timestamp is within last few seconds
- Verify count increments atomically (no race conditions in single-threaded context)

---

## Notebook Tests

### Test 9: Create Notebook and Add Cells
<!-- Citation: src/notebook/operations.ts:19-46, src/notebook/state.ts:50-85 -->

**Goal:** Verify notebook creation with multiple cell types.

**Action:**
```json
{
  "operation": "notebook",
  "args": {
    "operation": "create",
    "title": "Test Analysis Notebook",
    "language": "typescript"
  }
}
```

Then add cells:
```json
{
  "operation": "notebook",
  "args": {
    "operation": "add_cell",
    "notebookId": "<notebook-id>",
    "cellType": "title",
    "content": "Data Analysis Example"
  }
}
```

**Expected Outcome:**
- Create returns `notebookId`, `title`, `language`, `cells: []`
- Add cell returns cell with `cellId`, `cellType`, `content`
- Notebook workspace created in temp directory
- Cell metadata tracked in memory

**Verification:**
1. Call `list_cells` to verify all cells present
2. Call `get_cell` for specific cellId to retrieve full content
3. Verify cells maintain insertion order

---

### Test 10: Execute Code Cell
<!-- Citation: src/notebook/operations.ts:159-180, src/notebook/execution.ts:133-158 -->

**Goal:** Verify code execution with stdout/stderr capture.

**Action:**
1. Create TypeScript notebook
2. Add code cell:
   ```json
   {
     "operation": "notebook",
     "args": {
       "operation": "add_cell",
       "notebookId": "<id>",
       "cellType": "code",
       "content": "const x = 42;\nconsole.log('Answer:', x);",
       "filename": "test.ts"
     }
   }
   ```
3. Run cell:
   ```json
   {
     "operation": "notebook",
     "args": {
       "operation": "run_cell",
       "notebookId": "<id>",
       "cellId": "<cell-id>"
     }
   }
   ```

**Expected Outcome:**
- Code written to `<workspace>/src/test.ts`
- Executed with `npx tsx <workspace>/src/test.ts`
- Response includes `stdout: "Answer: 42\n"`, `stderr: ""`, `exitCode: 0`, `status: "completed"`

**Verification:**
- Verify stdout captured correctly
- Test with syntax error: verify `stderr` contains error, `exitCode: 1`, `status: "failed"`
- Test timeout: code with infinite loop should timeout after 30s (default)

---

### Test 11: Update Cell Content
<!-- Citation: src/notebook/operations.ts:129-156 -->

**Goal:** Verify cell content modification.

**Action:**
1. Create notebook with code cell
2. Update cell:
   ```json
   {
     "operation": "notebook",
     "args": {
       "operation": "update_cell",
       "notebookId": "<id>",
       "cellId": "<cell-id>",
       "content": "console.log('Updated code');"
     }
   }
   ```
3. Run updated cell

**Expected Outcome:**
- Cell content updated in memory
- File on disk updated
- Next execution uses new content
- Output shows "Updated code"

**Verification:**
- Call `get_cell` to verify content changed
- Verify old content overwritten, not appended

---

### Test 12: Install Dependencies
<!-- Citation: src/notebook/operations.ts:183-199, src/notebook/execution.ts:57-61 -->

**Goal:** Verify npm dependency installation.

**Action:**
1. Create notebook
2. Add or update package.json cell with dependencies
3. Call `install_deps`:
   ```json
   {
     "operation": "notebook",
     "args": {
       "operation": "install_deps",
       "notebookId": "<id>"
     }
   }
   ```
4. Add code cell using installed dependency
5. Run code cell

**Expected Outcome:**
- `npm install` executed in notebook workspace
- `node_modules/` created with dependencies
- Code cell can import and use installed packages
- Installation output captured in response

**Verification:**
- Check `<workspace>/node_modules/` directory exists
- Verify code using dependency executes successfully
- Test with missing package.json: should return error

---

### Test 13: Export Notebook to .src.md
<!-- Citation: src/notebook/operations.ts:246-274, src/notebook/encoding.ts -->

**Goal:** Verify notebook serialization to .src.md format.

**Action:**
1. Create notebook with title, markdown, and code cells
2. Export:
   ```json
   {
     "operation": "notebook",
     "args": {
       "operation": "export",
       "notebookId": "<id>",
       "path": "/tmp/test-notebook.src.md"
     }
   }
   ```

**Expected Outcome:**
- Response includes full .src.md content as string
- If path provided: file written to filesystem
- Format includes:
  - Metadata comment with notebook info
  - Title cells as `# Title`
  - Markdown cells as regular markdown
  - Code cells as ` ```js filename.js ` or ` ```ts filename.ts `

**Verification:**
- Read exported file, verify structure
- Verify metadata comment contains notebook ID, language, title
- Count cells: should match original notebook

---

### Test 14: Load Notebook from .src.md
<!-- Citation: src/notebook/operations.ts:62-88 -->

**Goal:** Verify notebook deserialization from .src.md format.

**Action:**
1. Export a notebook (Test 13)
2. Load from content string:
   ```json
   {
     "operation": "notebook",
     "args": {
       "operation": "load",
       "content": "<exported-src.md-content>"
     }
   }
   ```

**Expected Outcome:**
- New notebook created with unique notebookId
- All cells restored: title, markdown, code
- Cell content matches original
- Code cells have correct filenames

**Verification:**
- Call `list_cells` on loaded notebook
- Compare cell count and content to original
- Run code cells to verify they still execute
- Test roundtrip: export → load → export → compare content strings

---

### Test 15: Notebook Template Instantiation
<!-- Citation: src/notebook/operations.ts:19-46, src/notebook/templates.generated.ts -->

**Goal:** Verify templates create pre-populated notebooks.

**Action:**
```json
{
  "operation": "notebook",
  "args": {
    "operation": "create",
    "title": "React Hooks Deep Dive",
    "language": "typescript",
    "template": "sequential-feynman"
  }
}
```

**Expected Outcome:**
- Notebook created with scaffolded structure
- Contains title cell with topic
- Contains markdown cells with template prompts (e.g., "## Step 1: Initial Understanding")
- Contains code cell placeholders
- Template provides guided workflow for learning

**Verification:**
- Call `list_cells` to see template structure
- Verify cells > 0 (not empty notebook)
- Verify title cell content includes topic name

---

### Test 16: List Notebooks
<!-- Citation: src/notebook/operations.ts:49-58 -->

**Goal:** Verify notebook discovery.

**Action:**
1. Create 3 notebooks with different titles/languages
2. Call `list`:
   ```json
   {
     "operation": "notebook",
     "args": {
       "operation": "list"
     }
   }
   ```

**Expected Outcome:**
- Response includes array of all active notebooks
- Each notebook has `notebookId`, `title`, `language`, `createdAt`
- Notebooks sorted by creation time (newest first)

**Verification:**
- Verify count matches number created
- Verify each notebook retrievable by ID

---

## Mental Models Tests

### Test 17: List All Mental Models
<!-- Citation: src/mental-models/operations.ts:257-275, src/mental-models/operations.ts:81-196 -->

**Goal:** Verify model discovery and metadata retrieval.

**Action:**
```json
{
  "operation": "mental_models",
  "args": {
    "operation": "list_models"
  }
}
```

**Expected Outcome:**
- Response includes 15 models
- Each model has `name`, `title`, `description`, `tags`
- Models include: rubber-duck, five-whys, pre-mortem, etc.

**Verification:**
- Verify count = 15
- Verify each model has at least one tag
- Verify names are slugified (kebab-case)

---

### Test 18: Filter Models by Tag
<!-- Citation: src/mental-models/operations.ts:257-275, src/mental-models/operations.ts:228-231 -->

**Goal:** Verify tag-based filtering.

**Action:**
```json
{
  "operation": "mental_models",
  "args": {
    "operation": "list_models",
    "tag": "debugging"
  }
}
```

**Expected Outcome:**
- Only models tagged with "debugging" returned
- Should include: rubber-duck, five-whys (at minimum)
- Count < 15 (filtered subset)

**Verification:**
- Verify all returned models have "debugging" in their tags array
- Test with "prioritization" tag: should include impact-effort-grid, trade-off-matrix

---

### Test 19: Retrieve Mental Model Content
<!-- Citation: src/mental-models/operations.ts:237-256, src/mental-models/operations.ts:221-224 -->

**Goal:** Verify full model prompt retrieval.

**Action:**
```json
{
  "operation": "mental_models",
  "args": {
    "operation": "get_model",
    "model": "five-whys"
  }
}
```

**Expected Outcome:**
- Response includes full model object:
  - `name`: "five-whys"
  - `title`: "Five Whys"
  - `description`: Short description
  - `tags`: ["debugging", "validation"]
  - `content`: Full markdown prompt with:
    - "# Five Whys" heading
    - "## When to Use" section
    - "## Process" section with numbered steps
    - Examples and anti-patterns

**Verification:**
- Verify content is process scaffold (HOW to think), not analysis
- Verify content is markdown formatted
- Test with invalid model name: should return error with list of available models

---

### Test 20: List Tags with Descriptions
<!-- Citation: src/mental-models/operations.ts:277-286, src/mental-models/operations.ts:39-76 -->

**Goal:** Verify tag taxonomy retrieval.

**Action:**
```json
{
  "operation": "mental_models",
  "args": {
    "operation": "list_tags"
  }
}
```

**Expected Outcome:**
- Response includes 9 tags
- Each tag has `name` and `description`
- Tags include: debugging, planning, decision-making, risk-analysis, estimation, prioritization, communication, architecture, validation

**Verification:**
- Verify count = 9
- Verify each tag has non-empty description
- Verify tag names are lowercase kebab-case

---

### Test 21: Get Capability Graph
<!-- Citation: src/mental-models/operations.ts:288-298 -->

**Goal:** Verify structured capability graph for knowledge initialization.

**Action:**
```json
{
  "operation": "mental_models",
  "args": {
    "operation": "get_capability_graph"
  }
}
```

**Expected Outcome:**
- Response includes:
  - `entities`: Array with thoughtbox_server, tools, tags, models
  - `relations`: Array with provides, contains, tagged_with relationships
  - `usage`: Object with step-by-step instructions for knowledge graph initialization

**Verification:**
- Verify entities array includes tool definitions
- Verify relations link tools to capabilities
- Optionally: Use returned data with `knowledge` operation to create entities and relations

---

## Sampling/RLM Tests

### Test 22: Request Critique via Sampling
<!-- Citation: src/sampling/handler.ts:95-121 -->

**Goal:** Verify autonomous LLM sampling for thought critique.

**Action:**
1. Prepare thought context (previous ThoughtData objects)
2. Request critique:
   ```typescript
   // Note: This is internal API, typically called by thought_handler
   // Testing requires mock protocol or integration test
   const handler = new SamplingHandler(protocol);
   const critique = await handler.requestCritique(
     "I think we should use microservices for this",
     [/* previous thoughts */]
   );
   ```

**Expected Outcome:**
- MCP `sampling/createMessage` request sent to client
- System prompt includes critic instructions
- Messages include last 5 thoughts as context
- Response contains critique text
- Model preferences hint Claude Sonnet 4.5

**Verification:**
- Verify request includes systemPrompt with "critical thinking expert"
- Verify maxTokens = 1000
- Verify includeContext = "thisServer"
- Test error handling: if client doesn't support sampling (error code -32601), should throw error

---

### Test 23: RLM Recursive Execution
<!-- Citation: src/sampling/rlm.ts:204-295 -->

**Goal:** Verify Recursive Language Model with REPL execution.

**Action:**
```typescript
const rlm = new RLMOrchestrator(samplingHandler);
const result = await rlm.run({
  query: "Calculate the factorial of 5",
  context: { numbers: [1, 2, 3, 4, 5] },
  maxIterations: 5
});
```

**Expected Outcome:**
- Root LLM generates REPL code blocks
- Code executed in sandboxed vm.Context
- `llm_query()` available for sub-queries
- `FINAL()` or `FINAL_VAR()` returns answer
- Response includes `text`, `model`, `iterations`, `logs`

**Verification:**
- Verify `result.text` contains "120" (factorial of 5)
- Verify `result.iterations` <= maxIterations
- Verify `result.logs` contains execution traces
- Test sandbox isolation: `process`, `require`, `eval` should be undefined

---

### Test 24: RLM Code Block Extraction
<!-- Citation: src/sampling/rlm.ts:41-49 -->

**Goal:** Verify REPL code fence parsing.

**Action:**
```typescript
const text = `
Let me calculate this:

\`\`\`repl
const x = 5;
console.log(x * x);
\`\`\`

The result is 25.
`;
const blocks = extractReplBlocks(text);
```

**Expected Outcome:**
- `blocks` array contains single entry: "const x = 5;\nconsole.log(x * x);"
- Fences correctly parsed
- Code extracted without fence markers

**Verification:**
- Verify blocks.length = 1
- Verify trimmed code content
- Test with multiple blocks: should extract all
- Test with no blocks: should return empty array

---

### Test 25: RLM FINAL Marker Detection
<!-- Citation: src/sampling/rlm.ts:51-59 -->

**Goal:** Verify FINAL and FINAL_VAR marker parsing.

**Action:**
```typescript
const text1 = "The answer is FINAL(42)";
const text2 = "result = 100; FINAL_VAR(result)";
const marker1 = findFinalMarker(text1);
const marker2 = findFinalMarker(text2);
```

**Expected Outcome:**
- `marker1` = `{ type: "FINAL", content: "42" }`
- `marker2` = `{ type: "FINAL_VAR", content: "result" }`

**Verification:**
- Verify type and content fields
- Test with no marker: should return null
- Test with both markers: FINAL_VAR takes precedence (checked first)

---

### Test 26: RLM Sandbox Safety
<!-- Citation: src/sampling/rlm.ts:95-157 -->

**Goal:** Verify sandboxed execution prevents dangerous operations.

**Action:**
```typescript
const runner = new ReplRunner({ data: "test" }, async () => "sub-result", 5000);
const result = await runner.run(`
  const fs = require('fs'); // Should fail - require undefined
  process.exit(1);          // Should fail - process undefined
  eval('console.log("pwned")'); // Should fail - eval undefined
`);
```

**Expected Outcome:**
- Execution fails with stderr containing "require is not defined"
- No filesystem access
- No process manipulation
- No code generation via eval

**Verification:**
- Verify `result.success` = false
- Verify `result.stderr` contains error message
- Verify main process not affected (test runner continues)

---

### Test 27: RLM Context Variable Access
<!-- Citation: src/sampling/rlm.ts:95-99 -->

**Goal:** Verify REPL can access provided context.

**Action:**
```typescript
const runner = new ReplRunner(
  { apiKey: "secret", users: ["alice", "bob"] },
  async () => "sub-result",
  5000
);
const result = await runner.run(`
  console.log(context.users.length);
  FINAL(context.users[0]);
`);
```

**Expected Outcome:**
- stdout: "2"
- final: "alice"
- Context accessible as global variable

**Verification:**
- Verify context readable
- Verify context can be string or object
- Test with string context: `const runner = new ReplRunner("plaintext", ...)`

---

### Test 28: RLM Sub-Query Execution
<!-- Citation: src/sampling/rlm.ts:297-311 -->

**Goal:** Verify nested LLM calls via llm_query().

**Action:**
```typescript
let subQueryCalled = false;
const mockLlmQuery = async (prompt: string) => {
  subQueryCalled = true;
  return `Answer for: ${prompt}`;
};

const runner = new ReplRunner({ data: "test" }, mockLlmQuery, 5000);
const result = await runner.run(`
  const answer = await llm_query("What is 2+2?");
  console.log(answer);
  FINAL(answer);
`);
```

**Expected Outcome:**
- `subQueryCalled` = true
- stdout contains "Answer for: What is 2+2?"
- final contains "Answer for: What is 2+2?"

**Verification:**
- Verify async/await works in sandbox
- Verify llm_query receives prompt string
- Test sub-model preferences: verify passed to samplingHandler

---

### Test 29: RLM Timeout Handling
<!-- Citation: src/sampling/rlm.ts:172-187 -->

**Goal:** Verify execution timeout enforcement.

**Action:**
```typescript
const runner = new ReplRunner({ data: "test" }, async () => "sub", 1000); // 1s timeout
const result = await runner.run(`
  while (true) {
    // Infinite loop
  }
`);
```

**Expected Outcome:**
- Execution killed after ~1000ms
- stderr contains "timed out after 1000ms"
- success = false

**Verification:**
- Verify timeout occurs within reasonable margin (< 1200ms)
- Verify subsequent code executions still work (sandbox recovered)

---

### Test 30: RLM Iteration Limit
<!-- Citation: src/sampling/rlm.ts:224-275 -->

**Goal:** Verify max iteration limit prevents infinite loops.

**Action:**
```typescript
const rlm = new RLMOrchestrator(samplingHandler);
const result = await rlm.run({
  query: "Keep thinking forever",
  context: {},
  maxIterations: 3
});
```

**Expected Outcome:**
- After 3 iterations without FINAL(), orchestrator requests final answer directly
- `result.iterations` = 4 (3 normal + 1 forced final)
- `result.text` contains some answer (not undefined)

**Verification:**
- Verify iterations never exceed maxIterations + 1
- Verify fallback message sent: "Provide the final answer for: ..."
- Test with maxIterations=1: should get answer in 2 iterations max

---

## Error Handling Tests

### Test 31: Knowledge Graph - Invalid Entity Type
<!-- Citation: src/knowledge/handler.ts:80-84 -->

**Goal:** Verify validation of required parameters.

**Action:**
```json
{
  "operation": "knowledge",
  "args": {
    "action": "create_entity",
    "name": "test"
    // Missing: type, label
  }
}
```

**Expected Outcome:**
- Error response with `isError: true`
- Error message: "Missing required parameters: name, type, label"

**Verification:**
- Verify no entity created in JSONL
- Verify no entity in SQLite
- Verify error message is actionable

---

### Test 32: Notebook - Invalid Cell Type
<!-- Citation: src/notebook/operations.ts:90-127 -->

**Goal:** Verify cell type validation.

**Action:**
```json
{
  "operation": "notebook",
  "args": {
    "operation": "add_cell",
    "notebookId": "<id>",
    "cellType": "invalid-type",
    "content": "test"
  }
}
```

**Expected Outcome:**
- Error indicating invalid cellType
- Valid cell types listed: title, markdown, code

**Verification:**
- Verify no cell added to notebook
- Verify error message guides user to valid types

---

### Test 33: Mental Models - Nonexistent Model
<!-- Citation: src/mental-models/operations.ts:237-256 -->

**Goal:** Verify helpful error for missing models.

**Action:**
```json
{
  "operation": "mental_models",
  "args": {
    "operation": "get_model",
    "model": "nonexistent-model"
  }
}
```

**Expected Outcome:**
- Error message includes list of available models
- Suggests correct spelling or alternatives

**Verification:**
- Verify error contains model names: rubber-duck, five-whys, etc.
- Verify error is user-friendly

---

### Test 34: Sampling - Client Doesn't Support Sampling
<!-- Citation: src/sampling/handler.ts:84-88 -->

**Goal:** Verify graceful degradation when sampling unavailable.

**Action:**
```typescript
// Mock protocol that throws METHOD_NOT_FOUND
const mockProtocol = {
  request: async () => {
    const error: any = new Error("Method not found");
    error.code = -32601;
    throw error;
  }
};

const handler = new SamplingHandler(mockProtocol);
try {
  await handler.requestCritique("test thought", []);
} catch (error) {
  // Expected error
}
```

**Expected Outcome:**
- Error thrown with code -32601
- Error message indicates sampling not supported

**Verification:**
- Verify specific error code propagated
- Verify error doesn't crash server
- Thoughtbox should continue working without sampling

---

## Integration Tests

### Test 35: Knowledge Graph + Mental Models Integration
<!-- Citation: Multiple files in src/knowledge/ and src/mental-models/ -->

**Goal:** Verify mental models capability graph can initialize knowledge graph.

**Action:**
1. Get capability graph from mental_models
2. Extract entities and relations
3. Create entities in knowledge graph:
   ```json
   {
     "operation": "knowledge",
     "args": {
       "action": "create_entity",
       "name": "thoughtbox-server",
       "type": "Agent",
       "label": "Thoughtbox MCP Server",
       "properties": { "version": "1.0.0" }
     }
   }
   ```
4. Create relations linking tools to mental models

**Expected Outcome:**
- Knowledge graph populated with Thoughtbox capabilities
- Can query graph to discover what tools are available
- Can traverse from mental_models tool to specific models via relations

**Verification:**
- Query graph from thoughtbox-server entity
- Verify mental model entities created
- Verify relations show tool→provides→capability structure

---

### Test 36: Notebook + Sampling Integration
<!-- Citation: src/notebook/ and src/sampling/ -->

**Goal:** Verify notebooks can use sampling for code review.

**Action:**
1. Create notebook with code cell
2. Execute code cell (potentially with bugs)
3. Use sampling to request code review
4. Add markdown cell with critique results

**Expected Outcome:**
- Code executed and output captured
- Sampling request provides critique of code quality
- Critique stored in markdown cell for reference

**Verification:**
- Verify notebook contains execution output + critique
- Verify critique is constructive and actionable
- Export notebook to verify all data serialized

---

## Running These Tests

Execute tests by calling `thoughtbox_gateway` MCP tool with:

```json
{
  "operation": "<operation-name>",
  "args": {
    "<operation-specific-args>": "..."
  }
}
```

Data persists to:
- Knowledge: `~/.thoughtbox/projects/_default/memory/`
- Notebooks: Temporary workspace directories

For a clean slate:
- Knowledge: Delete `~/.thoughtbox/projects/_default/memory/`
- Notebooks: Server cleans up expired notebooks automatically

Report failures with:
- Operation called
- Arguments provided
- Expected vs actual response
- Specific assertion that failed
- Relevant log output
