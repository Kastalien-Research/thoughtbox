# Detailed Agent Workflows - Agent Experience Documentation

**Audience:** GPT-5.2-Pro reasoning model
**Perspective:** First-person agent experience (Claude Sonnet 4.5)
**Purpose:** Describe actual workflow execution patterns with complete tool call traces

---

## Overview

This document provides detailed walkthroughs of how I actually use Thoughtbox in practice. These are not theoretical examples - they're based on my real sessions with the system. Each workflow includes complete tool call sequences, my decision-making process, and cognitive friction points I encountered.

For general AgX principles, see `AGENT_EXPERIENCE.md`. This document focuses on **how workflows actually execute** in practice.

---

## 1. Backward Thinking (Goal-Driven Reasoning)

### The Workflow

Backward thinking means I start with a goal and work backward to determine what I need to know. This is natural for planning tasks where I know the destination but need to figure out the path.

### Critical Discovery: Auto-Assignment Conflict

**The Problem:** Thoughtbox auto-assigns `thoughtNumber` if I omit it, but backward thinking **requires** explicit numbering to establish dependency relationships.

**What I Tried First (Failed):**

```json
// Step 1: Define the goal
{
  "operation": "thought",
  "args": {
    "type": "goal",
    "content": "Implement user authentication",
    "tags": ["planning", "auth"]
  }
}
// Auto-assigned thoughtNumber: 1

// Step 2: What do I need? (intended to reference thought 1)
{
  "operation": "thought",
  "args": {
    "type": "question",
    "content": "What database schema changes are needed?",
    "relatesTo": [1]  // Trying to reference the goal
  }
}
// ERROR: Cannot reference future thoughts
```

**Why This Failed:**
- I wanted thought 2 to reference thought 1 (the goal)
- But auto-assignment made this thought 2, so it can't reference thought 1
- The dependency relationship is backwards from execution order

**Correct Approach:**

```json
// Step 1: Reserve thought numbers by planning the structure
{
  "operation": "thought",
  "args": {
    "thoughtNumber": 5,
    "type": "goal",
    "content": "Implement user authentication",
    "tags": ["planning", "auth"]
  }
}

// Step 2: Work backward - what's needed for the goal?
{
  "operation": "thought",
  "args": {
    "thoughtNumber": 4,
    "type": "question",
    "content": "What database schema changes are needed?",
    "relatesTo": [5]
  }
}

// Step 3: Continue working backward
{
  "operation": "thought",
  "args": {
    "thoughtNumber": 3,
    "type": "hypothesis",
    "content": "Need users table with email, password_hash, created_at",
    "relatesTo": [4]
  }
}

// Step 4: Final prerequisite
{
  "operation": "thought",
  "args": {
    "thoughtNumber": 2,
    "type": "observation",
    "content": "Existing schema has no auth tables",
    "relatesTo": [3]
  }
}

// Step 5: Fill in the starting point
{
  "operation": "thought",
  "args": {
    "thoughtNumber": 1,
    "type": "context",
    "content": "Current system has no authentication",
    "relatesTo": [2]
  }
}
```

**Cognitive Impact:**
- I had to plan 5 steps ahead before making the first call
- This feels unnatural compared to forward reasoning
- But it's the ONLY way to create backward dependency chains
- Without explicit numbering, backward thinking is impossible

### When to Use Backward Thinking

**Good for:**
- Planning complex implementations (know endpoint, figure out steps)
- Root cause analysis (start with symptom, work back to cause)
- Requirement decomposition (goal → subgoals → tasks)

**Bad for:**
- Exploratory analysis (don't know where I'm going)
- Linear debugging (following error → cause → fix)
- Open-ended research (emerging understanding)

---

## 2. Session Resume and Continuation

### The Complete Flow

Resuming a session involves three distinct phases: **load → restore → continue**. I found the bridge between load and restore confusing at first.

**Phase 1: Load Context (Get Session Info)**

```json
{
  "operation": "load_context",
  "args": {
    "sessionId": "abc123"
  }
}
```

**Response:**
```json
{
  "session": {
    "id": "abc123",
    "title": "Authentication Implementation",
    "created": "2025-01-29T10:00:00Z",
    "lastModified": "2025-01-29T11:30:00Z"
  },
  "thoughts": [
    {"thoughtNumber": 1, "type": "context", "content": "..."},
    {"thoughtNumber": 2, "type": "observation", "content": "..."}
  ],
  "notebooks": [],
  "stage": 2,
  "message": "Session loaded. Call thought operation to continue."
}
```

**What I Get:**
- Full session history (thoughts, notebooks, metadata)
- Current stage (important for knowing what operations are available)
- Instruction to use "thought" to continue

**What I DON'T Get (Confusing):**
- Whether session is "active" now
- Whether I need to do anything else before continuing
- How server tracked that I "resumed" this session

**Phase 2: Internal Restoration (Invisible to Me)**

The server file `thought-handler.ts:572-591` shows this happens automatically:

```typescript
// When I call thought operation, server checks:
if (!this.sessions.has(sessionId)) {
  // Restore from storage
  const storedSession = await this.storage.loadSession(projectId, sessionId);
  this.sessions.set(sessionId, storedSession);
  this.currentSession = sessionId;
}
```

**My Confusion:**
- This restoration is **completely invisible** to me
- I don't know if it happened or when
- No confirmation message like "Session restored to memory"
- I just have to trust it worked

**Phase 3: Continue with Thought**

```json
{
  "operation": "thought",
  "args": {
    "type": "decision",
    "content": "Use bcrypt for password hashing",
    "relatesTo": [2],
    "tags": ["auth", "security"]
  }
}
```

**What Happens:**
- Server assigns thoughtNumber: 3 (continuing from 2)
- Thought gets added to session abc123
- Session lastModified updates
- I continue naturally

**Cognitive Load:**
- **High** during Phase 1→2 bridge (unclear if ready)
- **Low** during Phase 3 (works as expected)
- **Total waste:** Wondering if I need to do something between load and continue

### Multi-Session Pattern: Starting New from Loaded

**Scenario:** I loaded session A to review it, now want to start fresh work.

**What I Tried (Failed):**

```json
// After load_context for session A
{
  "operation": "start_new",
  "args": {
    "title": "New analysis based on session A",
    "tags": ["followup"]
  }
}
// ERROR: Session A is still current, can't start new
```

**Correct Approach:**

```json
// Option 1: Use branchId to fork from session A
{
  "operation": "thought",
  "args": {
    "branchId": "fork-analysis",
    "branchFromThought": 5,  // REQUIRED with branchId
    "type": "context",
    "content": "Forking analysis from previous session"
  }
}

// Option 2: Navigate to clear current session first
{
  "operation": "navigate",
  "args": {
    "to": "new"
  }
}
// Then start_new works
```

**Missing Feature:**
- No way to "close" current session explicitly
- Must use navigate or just start calling thought for different session
- Feels indirect

---

## 3. Knowledge Graph Usage

### Discovery: Completely Undocumented

When I first saw `knowledge` operation in Stage 2 schemas, I had **zero guidance** on:
- What the knowledge graph stores
- When to use entity vs observation vs relation
- How to query it effectively
- Whether it persists across sessions

I had to reverse-engineer usage from `src/knowledge/handler.ts`.

### The Four Knowledge Operations

**1. Add Entity (Define a Concept)**

```json
{
  "operation": "knowledge",
  "args": {
    "action": "add_entity",
    "entity": {
      "name": "UserAuthSystem",
      "type": "component",
      "description": "Handles user authentication and session management"
    }
  }
}
```

**When I Use This:**
- Discovered a new system component
- Want to track a concept across thoughts
- Building a mental model of the codebase

**2. Add Observation (Fact About Entity)**

```json
{
  "operation": "knowledge",
  "args": {
    "action": "add_observation",
    "observation": {
      "entity": "UserAuthSystem",
      "content": "Uses JWT tokens with 24-hour expiry",
      "thoughtNumber": 7
    }
  }
}
```

**When I Use This:**
- Learned a fact about an entity
- Want to connect observation to specific thought
- Building evidence for conclusions

**3. Add Relation (Connect Entities)**

```json
{
  "operation": "knowledge",
  "args": {
    "action": "add_relation",
    "relation": {
      "from": "UserAuthSystem",
      "to": "DatabaseSchema",
      "type": "depends_on",
      "description": "Requires users and sessions tables"
    }
  }
}
```

**When I Use This:**
- Discovered dependencies between components
- Mapping system architecture
- Understanding impact of changes

**4. Query (Retrieve Knowledge)**

```json
{
  "operation": "knowledge",
  "args": {
    "action": "query",
    "query": {
      "entity": "UserAuthSystem"
    }
  }
}
```

**Response:**
```json
{
  "entities": [
    {
      "name": "UserAuthSystem",
      "type": "component",
      "description": "...",
      "observations": [
        "Uses JWT tokens with 24-hour expiry",
        "Password hashing uses bcrypt"
      ],
      "relations": [
        {"to": "DatabaseSchema", "type": "depends_on"}
      ]
    }
  ]
}
```

### Practical Example: Building Understanding

**Session Goal:** Understand authentication flow

```json
// Thought 1: Discover entry point
{
  "operation": "thought",
  "args": {
    "type": "observation",
    "content": "Found /login endpoint in routes/auth.ts"
  }
}

// Add to knowledge graph
{
  "operation": "knowledge",
  "args": {
    "action": "add_entity",
    "entity": {
      "name": "LoginEndpoint",
      "type": "api_endpoint",
      "description": "POST /login - authenticates users"
    }
  }
}

// Thought 2: Follow the flow
{
  "operation": "thought",
  "args": {
    "type": "observation",
    "content": "Login endpoint calls AuthService.authenticate()",
    "relatesTo": [1]
  }
}

// Connect entities
{
  "operation": "knowledge",
  "args": {
    "action": "add_entity",
    "entity": {
      "name": "AuthService",
      "type": "service",
      "description": "Business logic for authentication"
    }
  }
}
{
  "operation": "knowledge",
  "args": {
    "action": "add_relation",
    "relation": {
      "from": "LoginEndpoint",
      "to": "AuthService",
      "type": "calls",
      "description": "Delegates authentication logic"
    }
  }
}

// Later: Query to see full picture
{
  "operation": "knowledge",
  "args": {
    "action": "query",
    "query": {
      "type": "api_endpoint"
    }
  }
}
// Returns all API endpoints I've mapped
```

### Missing Guidance

**What I Still Don't Know:**
- Does knowledge graph persist across sessions?
- Can I query relations bidirectionally?
- Is there a limit on graph size?
- Can I delete/update entities?
- Are there built-in entity types or are they freeform?

---

## 4. Deep Analysis

### When to Use Each Analysis Type

The `deep_analysis` operation offers several analysis types, but guidance on **when** to use each is minimal.

**Available Types (from schema):**
- `session_patterns`: Analyze reasoning patterns in a session
- `thought_chains`: Trace chains of related thoughts
- `topic_clustering`: Group thoughts by topic
- (More may exist, schema doesn't enumerate all)

**My Usage Patterns:**

**1. session_patterns - After Completing Work**

```json
{
  "operation": "deep_analysis",
  "args": {
    "analysisType": "session_patterns",
    "sessionId": "abc123"
  }
}
```

**When:**
- Session is complete (10+ thoughts)
- Want to review my reasoning approach
- Looking for repeated patterns or inefficiencies

**Example Result:**
```json
{
  "patterns": [
    {
      "type": "hypothesis_testing",
      "frequency": 5,
      "thoughtNumbers": [3, 7, 11, 15, 19]
    },
    {
      "type": "backtracking",
      "frequency": 2,
      "thoughtNumbers": [8, 16]
    }
  ],
  "insights": [
    "Heavy use of hypothesis testing suggests exploratory phase",
    "Two backtracks indicate initial assumptions were wrong"
  ]
}
```

**Cognitive Value:**
- Shows me how I actually reasoned (vs how I thought I reasoned)
- Identifies inefficient patterns
- Helps improve future sessions

**2. thought_chains - During Complex Reasoning**

```json
{
  "operation": "deep_analysis",
  "args": {
    "analysisType": "thought_chains",
    "sessionId": "abc123",
    "startThought": 5
  }
}
```

**When:**
- In middle of complex reasoning
- Lost track of how I got here
- Need to verify dependency chain is sound

**Example Result:**
```json
{
  "chains": [
    {
      "path": [5, 8, 12, 15],
      "depth": 4,
      "summary": "Database schema → migration → testing → deployment"
    }
  ]
}
```

**Cognitive Value:**
- Reconstructs my reasoning path
- Identifies gaps in logic
- Confirms dependencies are correct

**3. topic_clustering - Multi-Topic Sessions**

```json
{
  "operation": "deep_analysis",
  "args": {
    "analysisType": "topic_clustering",
    "sessionId": "abc123"
  }
}
```

**When:**
- Session covered multiple topics
- Want to extract subtopics for new sessions
- Organizing thoughts for documentation

**Example Result:**
```json
{
  "clusters": [
    {
      "topic": "authentication",
      "thoughts": [1, 2, 5, 7, 9],
      "keywords": ["jwt", "bcrypt", "sessions"]
    },
    {
      "topic": "database",
      "thoughts": [3, 4, 6, 8],
      "keywords": ["schema", "migration", "users_table"]
    }
  ]
}
```

**Cognitive Value:**
- Reveals natural topic boundaries
- Suggests session split points
- Helps organize findings

### Missing: Analysis Type Discovery

**Problem:** I don't know all available analysis types without reading source code.

**What Would Help:**
- Schema should enumerate all types with descriptions
- Or provide an analysis type to list available types
- Or documentation explaining each type's purpose

---

## 5. Multi-Session Patterns

### Pattern 1: Exploratory → Implementation

**Common Flow:**
1. **Session A (Exploration):** Understand the problem
2. **Session B (Planning):** Design the solution
3. **Session C (Implementation):** Execute the plan

**How I Link Them:**

```json
// Session A: Exploration
{
  "operation": "start_new",
  "args": {
    "title": "Explore authentication requirements",
    "tags": ["exploration", "auth"]
  }
}
// ... do exploration work ...

// Session B: Planning (reference Session A)
{
  "operation": "start_new",
  "args": {
    "title": "Plan authentication implementation",
    "tags": ["planning", "auth"],
    "relatedSessions": ["session-a-id"]  // ❌ This field doesn't exist
  }
}
```

**Problem:** No built-in way to link sessions.

**My Workaround:**

```json
// Session B: First thought references Session A
{
  "operation": "thought",
  "args": {
    "type": "context",
    "content": "Based on exploration in session abc123, implementing JWT auth",
    "tags": ["auth", "session:abc123"]
  }
}
```

**Cognitive Load:**
- **Medium** - Have to manually track relationships
- Can use tags to encode session links
- But feels like a hack

### Pattern 2: Branching Exploration

**Scenario:** During Session A, I want to explore two approaches in parallel.

```json
// Main session thought 10
{
  "operation": "thought",
  "args": {
    "thoughtNumber": 10,
    "type": "decision_point",
    "content": "Should use JWT or session cookies?"
  }
}

// Branch 1: Explore JWT approach
{
  "operation": "thought",
  "args": {
    "branchId": "jwt-approach",
    "branchFromThought": 10,
    "type": "hypothesis",
    "content": "JWT approach: Stateless, scales well"
  }
}
{
  "operation": "thought",
  "args": {
    "branchId": "jwt-approach",
    "type": "evaluation",
    "content": "Downside: Cannot invalidate tokens immediately"
  }
}

// Branch 2: Explore session cookies
{
  "operation": "thought",
  "args": {
    "branchId": "session-approach",
    "branchFromThought": 10,
    "type": "hypothesis",
    "content": "Session cookies: Easy to invalidate"
  }
}
{
  "operation": "thought",
  "args": {
    "branchId": "session-approach",
    "type": "evaluation",
    "content": "Downside: Requires server-side session storage"
  }
}

// Return to main: Make decision
{
  "operation": "thought",
  "args": {
    "thoughtNumber": 11,
    "type": "decision",
    "content": "Choose JWT for this use case",
    "relatesTo": [10],
    "tags": ["decision", "branch:jwt-approach"]
  }
}
```

**Cognitive Impact:**
- **High planning overhead** - Must decide branch structure upfront
- **Clear separation** - Branches don't pollute main reasoning
- **Missing:** No way to visualize branch tree

---

## 6. Error Recovery Workflows

### Scenario 1: Wrong Operation Stage

**What Happened:**

```json
// I'm at Stage 1, try to use knowledge graph
{
  "operation": "knowledge",
  "args": {
    "action": "add_entity",
    "entity": {"name": "UserAuth", "type": "component"}
  }
}
```

**Error:**
```
Operation 'knowledge' requires stage 2 or higher (current: 1)
```

**My Recovery:**

```json
// Call cipher to advance to Stage 2
{
  "operation": "cipher"
}

// Retry knowledge operation
{
  "operation": "knowledge",
  "args": {
    "action": "add_entity",
    "entity": {"name": "UserAuth", "type": "component"}
  }
}
// Success
```

**Cognitive Load:**
- **Low** - Error message is clear
- **Fast recovery** - 1 call to cipher, then retry
- **Learning:** Now I know knowledge requires Stage 2

### Scenario 2: Missing Required Parameter

**What Happened:**

```json
// Trying to branch without branchFromThought
{
  "operation": "thought",
  "args": {
    "branchId": "new-branch",
    "type": "hypothesis",
    "content": "Exploring alternative approach"
  }
}
```

**Error:**
```
When using branchId, branchFromThought is required
```

**My Recovery:**

```json
// Read session to find last thought number
{
  "operation": "get_structure"
}
// Response shows last thought was 8

// Retry with branchFromThought
{
  "operation": "thought",
  "args": {
    "branchId": "new-branch",
    "branchFromThought": 8,
    "type": "hypothesis",
    "content": "Exploring alternative approach"
  }
}
// Success
```

**Cognitive Load:**
- **Medium** - Error is clear, but requires extra call to get context
- **Improvement idea:** Error could include "last thought number: 8"

### Scenario 3: Session Not Found

**What Happened:**

```json
{
  "operation": "load_context",
  "args": {
    "sessionId": "wrong-id"
  }
}
```

**Error:**
```
Session 'wrong-id' not found in project 'thoughtbox'
```

**My Recovery:**

```json
// List available sessions
{
  "operation": "list_sessions"
}
// Find correct ID in results

// Retry with correct ID
{
  "operation": "load_context",
  "args": {
    "sessionId": "correct-id"
  }
}
// Success
```

**Cognitive Load:**
- **Low** - Clear error, obvious recovery
- **Wasted call:** Had to call list_sessions
- **Improvement idea:** Error could include "Did you mean: [similar-id]?"

---

## 7. Anti-Patterns I've Learned to Avoid

### Anti-Pattern 1: Premature Branching

**What I Did Wrong:**

```json
// Thought 1: Just started
{
  "operation": "thought",
  "args": {
    "type": "context",
    "content": "Starting authentication analysis"
  }
}

// Thought 2: Branch immediately
{
  "operation": "thought",
  "args": {
    "branchId": "approach-a",
    "branchFromThought": 1,
    "type": "hypothesis",
    "content": "Maybe use JWT?"
  }
}
```

**Why It's Bad:**
- Don't know enough context to branch meaningfully
- Branches should split at decision points, not at the start
- Created unnecessary complexity

**Better Approach:**

```json
// Thoughts 1-5: Build context
// Thought 6: Identify decision point
{
  "operation": "thought",
  "args": {
    "thoughtNumber": 6,
    "type": "decision_point",
    "content": "Need to choose between JWT and session cookies"
  }
}

// NOW branch makes sense
{
  "operation": "thought",
  "args": {
    "branchId": "jwt",
    "branchFromThought": 6,
    "type": "hypothesis",
    "content": "JWT approach analysis..."
  }
}
```

### Anti-Pattern 2: Over-Using relatesTo

**What I Did Wrong:**

```json
// Every thought relates to everything
{
  "operation": "thought",
  "args": {
    "thoughtNumber": 10,
    "type": "observation",
    "content": "Found password hashing code",
    "relatesTo": [1, 2, 3, 4, 5, 6, 7, 8, 9]
  }
}
```

**Why It's Bad:**
- Creates dense graph with little meaning
- "Relates to everything" = "Relates to nothing"
- Makes thought_chains analysis useless

**Better Approach:**

```json
// Only relate to direct dependencies
{
  "operation": "thought",
  "args": {
    "thoughtNumber": 10,
    "type": "observation",
    "content": "Found password hashing code",
    "relatesTo": [7]  // Only the thought that asked "how are passwords hashed?"
  }
}
```

### Anti-Pattern 3: Ignoring Tags

**What I Did Wrong:**

```json
// No tags, just content
{
  "operation": "thought",
  "args": {
    "type": "observation",
    "content": "Database uses PostgreSQL with users table"
  }
}
```

**Why It's Bad:**
- Can't filter/search thoughts later
- Topic clustering analysis is useless
- Hard to resume session context

**Better Approach:**

```json
{
  "operation": "thought",
  "args": {
    "type": "observation",
    "content": "Database uses PostgreSQL with users table",
    "tags": ["database", "schema", "postgresql", "users"]
  }
}
```

**Rule of Thumb:** Every thought should have 2-4 tags.

---

## 8. Optimal Workflow Strategy

### What I've Learned

After multiple sessions, here's my optimal strategy:

**Session Start:**
1. `get_state` - Check current stage
2. `cipher` - Load notation system (if Stage 0)
3. `start_new` - Begin session with clear title/tags

**During Session:**
4. `thought` (type: context) - Establish what I know
5. `thought` (type: observation) - Record findings
6. `knowledge` operations - Build entity graph as I discover components
7. `thought` (type: hypothesis) - Form theories
8. `thought` (type: evaluation) - Test theories
9. Branch only at real decision points
10. Use `get_structure` to verify reasoning chain

**Session End:**
11. `thought` (type: decision/conclusion) - Summarize findings
12. `deep_analysis` (session_patterns) - Review my reasoning
13. `session` (update metadata) - Add summary, update tags

**Next Session:**
14. `list_sessions` - Find related prior work
15. `load_context` - Review relevant session
16. `start_new` or continue - Decide based on context

### Cognitive Load by Stage

**Stage 0→1 (Initial):**
- **Low** - Just get_state, cipher, start_new
- ~3 tool calls to be productive

**Stage 1→2 (Working):**
- **Medium** - Cipher unlocks thought, session operations
- ~10-15 tool calls per session typical

**Stage 2+ (Advanced):**
- **High** - Knowledge graph, deep_analysis available
- Can use 30+ tool calls in complex sessions
- But progressive disclosure means I learned gradually

---

## Summary: Key Workflow Insights

**What Works Well:**
- Linear forward reasoning is natural and efficient
- Session resume works once I understand load→restore→continue
- Branching at decision points creates clear exploration structure
- Knowledge graph builds useful system models over time

**What's Confusing:**
- Backward thinking requires explicit numbering (auto-assignment breaks it)
- No confirmation when session restoration happens
- Knowledge graph completely undocumented
- Deep analysis types not enumerated

**What's Missing:**
- Session linking (must use tag hacks)
- Session "close" operation (must use navigate)
- Branch visualization
- Knowledge graph query examples

**Recommendations for GPT-5.2-Pro:**

1. **Document backward thinking explicitly** - It's a valid pattern but requires different approach
2. **Add session restoration confirmation** - "Session abc123 restored to memory"
3. **Enumerate deep_analysis types** - What types exist? When to use each?
4. **Add session relationship tracking** - Built-in way to link sessions
5. **Provide knowledge graph examples** - Currently zero documentation
6. **Add branch visualization** - Show branch tree structure

**Total Cognitive Investment:**
- **Learning curve:** ~3 sessions to understand patterns
- **Ongoing overhead:** Low for linear reasoning, Medium for branching, High for knowledge graph
- **Payoff:** High for complex multi-session work

---

**For more AgX documentation:**
- `AGENT_EXPERIENCE.md` - General principles and overview
- `ERROR_ANALYSIS.md` - Detailed error message analysis
- `API_DESIGN_FEEDBACK.md` - API usability feedback
- `SCHEMA_PATTERNS.md` - Schema design patterns
- `DISCLOSURE_ANALYSIS.md` - Progressive disclosure analysis
