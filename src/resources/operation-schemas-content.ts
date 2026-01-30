/**
 * Operation Schema Resources
 *
 * Embedded schema documentation for gateway operations at each disclosure stage.
 * These resources provide proactive discovery - agents learn what operations are
 * available and how to call them before needing to try and fail.
 */

export const STAGE_1_OPERATIONS_SCHEMA = `# Stage 1 Operations (Post-Initialization)

After calling \`start_new\` or \`load_context\`, the gateway supports these operations:

---

## Available Operations

### 1. cipher
Load the Thoughtbox notation system (cipher protocol).

**Parameters:** None

**Example:**
\`\`\`typescript
thoughtbox_gateway({
  operation: "cipher"
})
\`\`\`

**What it does:**
- Loads the compression cipher notation system
- Advances to Stage 2 (unlocks thought, notebook, knowledge operations)
- Returns the full cipher documentation

**Next step:** After cipher loads, call \`thought\` to begin structured reasoning.

---

### 2. session
Manage session state - save progress, list sessions, export data.

**Parameters:** Nested operation object with \`operation\` field

**Sub-operations:**
- \`save\`: Save current session progress
- \`list\`: List all sessions
- \`export\`: Export session data

**Example (save):**
\`\`\`typescript
thoughtbox_gateway({
  operation: "session",
  args: {
    operation: "save"
  }
})
\`\`\`

**Example (list):**
\`\`\`typescript
thoughtbox_gateway({
  operation: "session",
  args: {
    operation: "list",
    limit: 10
  }
})
\`\`\`

**Example (export):**
\`\`\`typescript
thoughtbox_gateway({
  operation: "session",
  args: {
    operation: "export",
    sessionId: "abc123",
    format: "json"
  }
})
\`\`\`

---

### 3. deep_analysis
Analyze patterns across sessions (requires session history).

**Parameters:** Direct args object (no nested operation)

**Schema:**
\`\`\`typescript
{
  timeRange?: {
    start: string;  // ISO timestamp
    end: string;    // ISO timestamp
  };
  filters?: {
    projects?: string[];
    tasks?: string[];
    aspects?: string[];
  };
  analysisType?: "patterns" | "evolution" | "relationships";
}
\`\`\`

**Example:**
\`\`\`typescript
thoughtbox_gateway({
  operation: "deep_analysis",
  args: {
    analysisType: "patterns",
    filters: {
      projects: ["thoughtbox"]
    }
  }
})
\`\`\`

---

## Parameter Nesting Patterns

Gateway operations use **3 different nesting patterns**:

### Pattern 1: No Args (Direct Call)
Operations that take no parameters:
\`\`\`typescript
thoughtbox_gateway({ operation: "cipher" })
\`\`\`

### Pattern 2: Nested Operation
Operations that dispatch to sub-operations (have their own \`operation\` field):
\`\`\`typescript
thoughtbox_gateway({
  operation: "session",
  args: {
    operation: "save"  // ← nested operation field
  }
})
\`\`\`

### Pattern 3: Direct Args
Operations that take parameters directly (no nested \`operation\`):
\`\`\`typescript
thoughtbox_gateway({
  operation: "deep_analysis",
  args: {
    analysisType: "patterns"  // ← direct parameters
  }
})
\`\`\`

---

## Error Handling

If you call an operation with wrong parameters, you'll get a clear error showing:
- **Required parameters** you're missing
- **Optional parameters** available
- **Received parameters** from your call
- **Example** of correct usage

This schema is for proactive discovery. Errors are for reactive correction.
`;

export const STAGE_2_OPERATIONS_SCHEMA = `# Stage 2 Operations (Post-Cipher)

After calling \`cipher\`, the gateway supports all reasoning operations:

---

## Available Operations

### 1. thought
Record a structured thought in the cipher notation system.

**Parameters:** Direct args object (no nested operation)

**Required:**
- \`thought\`: string - The thought content (can include cipher notation)

**Optional:**
- \`nextThoughtNeeded\`: boolean - Whether another thought follows
- \`branchId\`: string - Branch identifier for divergent reasoning paths
- \`branchFromThought\`: number - Thought number to branch from (required if using branchId)
- \`revisesThought\`: number - Thought number being revised
- \`context\`: object - Additional context metadata

**Example (simple):**
\`\`\`typescript
thoughtbox_gateway({
  operation: "thought",
  args: {
    thought: "Initial observation: API latency increased 40% after deployment",
    nextThoughtNeeded: true
  }
})
\`\`\`

**Example (with cipher):**
\`\`\`typescript
thoughtbox_gateway({
  operation: "thought",
  args: {
    thought: "S1|O|API latency ↑ 40% post-deploy → investigate db queries",
    nextThoughtNeeded: true
  }
})
\`\`\`

**Example (branching):**
\`\`\`typescript
thoughtbox_gateway({
  operation: "thought",
  args: {
    thought: "S5|H|alt-hypothesis: cache invalidation issue",
    nextThoughtNeeded: false,
    branchId: "cache-path",
    branchFromThought: 3
  }
})
\`\`\`

---

### 2. read_thoughts
Retrieve thoughts from the current session.

**Parameters:** Direct args object (optional)

**Optional:**
- \`limit\`: number - Max thoughts to return
- \`offset\`: number - Skip first N thoughts
- \`thoughtNumber\`: number - Get specific thought by number

**Example (recent thoughts):**
\`\`\`typescript
thoughtbox_gateway({
  operation: "read_thoughts",
  args: {
    limit: 5
  }
})
\`\`\`

**Example (specific thought):**
\`\`\`typescript
thoughtbox_gateway({
  operation: "read_thoughts",
  args: {
    thoughtNumber: 3
  }
})
\`\`\`

---

### 3. get_structure
Get the structural analysis of current session's thought graph.

**Parameters:** None (or empty args object)

**Example:**
\`\`\`typescript
thoughtbox_gateway({
  operation: "get_structure"
})
\`\`\`

**What it returns:**
- Thought graph structure (nodes, edges, branches)
- Reasoning patterns detected
- Branching points and convergence

---

### 4. notebook
Literate programming integration - combine code, thoughts, and explanations.

**Parameters:** Nested operation object with \`operation\` field

**Sub-operations:**
- \`create_entry\`: Create a new notebook entry
- \`list_entries\`: List all entries
- \`get_entry\`: Get specific entry
- \`link_code\`: Link code to thoughts

**Example (create entry):**
\`\`\`typescript
thoughtbox_gateway({
  operation: "notebook",
  args: {
    operation: "create_entry",
    title: "API Performance Investigation",
    content: "...",
    linkedThoughts: [1, 2, 5]
  }
})
\`\`\`

**Example (list entries):**
\`\`\`typescript
thoughtbox_gateway({
  operation: "notebook",
  args: {
    operation: "list_entries",
    limit: 10
  }
})
\`\`\`

---

### 5. mental_models
Apply structured reasoning frameworks (OODA, 5-Whys, etc.).

**Parameters:** Nested operation object with \`operation\` field

**Sub-operations:**
- \`apply\`: Apply a mental model framework
- \`list\`: List available models
- \`get\`: Get model details

**Example (apply OODA):**
\`\`\`typescript
thoughtbox_gateway({
  operation: "mental_models",
  args: {
    operation: "apply",
    model: "ooda",
    phase: "observe",
    content: "Current system state analysis..."
  }
})
\`\`\`

**Example (list models):**
\`\`\`typescript
thoughtbox_gateway({
  operation: "mental_models",
  args: {
    operation: "list"
  }
})
\`\`\`

---

### 6. knowledge
Query and manage the knowledge graph built from thoughts.

**Parameters:** Nested action object with \`action\` field

**Actions:**
- \`query\`: Search the knowledge graph
- \`relate\`: Create relationships between concepts
- \`extract\`: Extract structured knowledge

**Example (query):**
\`\`\`typescript
thoughtbox_gateway({
  operation: "knowledge",
  args: {
    action: "query",
    query: "performance optimization patterns",
    limit: 5
  }
})
\`\`\`

**Example (relate concepts):**
\`\`\`typescript
thoughtbox_gateway({
  operation: "knowledge",
  args: {
    action: "relate",
    source: "api-latency",
    target: "database-query",
    relationship: "caused-by"
  }
})
\`\`\`

---

## Parameter Nesting Patterns

Stage 2 operations use **3 different nesting patterns**:

### Pattern 1: Direct Parameters
Operations that take params directly (\`thought\`, \`read_thoughts\`, \`get_structure\`, \`deep_analysis\`):
\`\`\`typescript
thoughtbox_gateway({
  operation: "thought",
  args: {
    thought: "...",         // ← direct parameters
    nextThoughtNeeded: true
  }
})
\`\`\`

### Pattern 2: Nested Operation
Operations that dispatch to sub-operations (\`notebook\`, \`mental_models\`, \`session\`):
\`\`\`typescript
thoughtbox_gateway({
  operation: "notebook",
  args: {
    operation: "create_entry",  // ← nested operation field
    title: "...",
    content: "..."
  }
})
\`\`\`

### Pattern 3: Nested Action
The \`knowledge\` operation uses \`action\` instead of \`operation\`:
\`\`\`typescript
thoughtbox_gateway({
  operation: "knowledge",
  args: {
    action: "query",  // ← nested action field (not operation)
    query: "...",
    limit: 5
  }
})
\`\`\`

---

## Common Mistakes

❌ **Wrong nesting:**
\`\`\`typescript
thoughtbox_gateway({
  operation: "thought",
  args: {
    operation: "record",  // ← No! thought takes direct params
    thought: "..."
  }
})
\`\`\`

✅ **Correct:**
\`\`\`typescript
thoughtbox_gateway({
  operation: "thought",
  args: {
    thought: "...",  // ← Direct parameters
    nextThoughtNeeded: true
  }
})
\`\`\`

---

❌ **Forgetting branchFromThought:**
\`\`\`typescript
thoughtbox_gateway({
  operation: "thought",
  args: {
    thought: "...",
    branchId: "new-path"  // ← Error: branchId requires branchFromThought
  }
})
\`\`\`

✅ **Correct:**
\`\`\`typescript
thoughtbox_gateway({
  operation: "thought",
  args: {
    thought: "...",
    branchId: "new-path",
    branchFromThought: 3  // ← Required when using branchId
  }
})
\`\`\`

---

## Error Messages

If you call an operation incorrectly, you'll get a detailed error showing:
- **Required parameters** you're missing
- **Optional parameters** available
- **Received parameters** from your call
- **Correct example** for that operation

These schemas are for proactive discovery. Error messages are for reactive correction. Both work together to help you use operations successfully.

---

## Next Steps

**Common workflow:**
1. Record initial observations with \`thought\`
2. Continue reasoning with more \`thought\` calls
3. Check structure with \`get_structure\`
4. Read previous context with \`read_thoughts\`
5. Create notebook entries to document findings
6. Apply mental models when stuck
7. Query knowledge graph to find patterns

**Remember:** The cipher notation (S1|O|...) is optional but powerful. You can write plain text thoughts and add cipher later as you get comfortable with the syntax.
`;
