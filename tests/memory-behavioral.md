# Knowledge Zone - Behavioral Tests

Workflows for Claude to execute when verifying the knowledge toolhost functions correctly.

The Knowledge Zone ("The Garden") has two areas:
1. **Patterns** - Extracted heuristics from successful reasoning sessions (persistent)
2. **Scratchpad** - Temporary collaborative working notes (ephemeral)

---

## Pattern Tests

### Test 1: Pattern Creation Flow

**Goal:** Verify patterns can be created and retrieved.

**Steps:**
1. Call `knowledge` with operation `create_pattern`, args:
   ```json
   {
     "title": "Test Pattern",
     "description": "A test pattern for behavioral verification",
     "content": "## Steps\n\n1. First step\n2. Second step\n3. Third step",
     "tags": ["testing", "verification"]
   }
   ```
2. Verify response includes:
   - `success: true`
   - Pattern `id` (slug from title, e.g., "test-pattern")
   - Pattern `uri` (e.g., "thoughtbox://knowledge/patterns/test-pattern")
3. Call operation `get_pattern` with args: `{ "id": "test-pattern" }`
4. Verify full pattern returned with content, tags, timestamps

**Expected:** Pattern persisted as Markdown file, retrievable by ID

---

### Test 2: Pattern Update Flow

**Goal:** Verify patterns can be modified.

**Steps:**
1. Create a pattern with initial content
2. Call operation `update_pattern` with args:
   ```json
   {
     "id": "test-pattern",
     "content": "## Updated Steps\n\n1. New first step\n2. New second step",
     "tags": ["testing", "verification", "updated"]
   }
   ```
3. Verify success response
4. Call `get_pattern` to verify changes persisted
5. Verify `updatedAt` timestamp changed

**Expected:** Partial updates work, unchanged fields preserved

---

### Test 3: Pattern Listing and Filtering Flow

**Goal:** Verify pattern discovery and search.

**Steps:**
1. Create multiple patterns with different tags:
   - Pattern A: tags ["debugging", "async"]
   - Pattern B: tags ["debugging", "sync"]
   - Pattern C: tags ["architecture"]
2. Call operation `list_patterns` with no args
3. Verify all three patterns returned
4. Call `list_patterns` with args: `{ "tags": ["debugging"] }`
5. Verify only patterns A and B returned
6. Call `list_patterns` with args: `{ "search": "async" }`
7. Verify only pattern A returned (search matches content/title/description)

**Expected:** Filtering by tags and search works correctly

---

### Test 4: Pattern Tags Discovery Flow

**Goal:** Verify tag aggregation across patterns.

**Steps:**
1. Create patterns with various tags
2. Call operation `list_tags`
3. Verify response contains all unique tags used across patterns
4. Verify no duplicate tags in response

**Expected:** Complete tag inventory for navigation

---

### Test 5: Pattern Deletion Flow

**Goal:** Verify patterns can be removed.

**Steps:**
1. Create a test pattern
2. Verify it appears in `list_patterns`
3. Call operation `delete_pattern` with args: `{ "id": "test-pattern" }`
4. Verify success response
5. Call `list_patterns` - pattern should be gone
6. Call `get_pattern` - should return error "not found"

**Expected:** Pattern removed from filesystem and listings

---

## Scratchpad Tests

### Test 6: Scratchpad Write/Read Flow

**Goal:** Verify scratchpad notes can be created and read.

**Steps:**
1. Call `knowledge` with operation `write_scratchpad`, args:
   ```json
   {
     "topic": "API Design Ideas",
     "content": "## Current thinking\n\n- REST vs GraphQL\n- Pagination strategy"
   }
   ```
2. Verify response includes note `id` (slug: "api-design-ideas")
3. Call operation `read_scratchpad` with args: `{ "id": "api-design-ideas" }`
4. Verify full content returned

**Expected:** Scratchpad notes persist during session

---

### Test 7: Scratchpad Overwrite Flow

**Goal:** Verify scratchpad updates replace content.

**Steps:**
1. Create scratchpad note with initial content
2. Call `write_scratchpad` with same topic, different content
3. Call `read_scratchpad`
4. Verify content is new content (not appended)
5. Verify `updatedAt` changed

**Expected:** Write is idempotent - same topic overwrites

---

### Test 8: Scratchpad Listing Flow

**Goal:** Verify scratchpad discovery.

**Steps:**
1. Create multiple scratchpad notes
2. Call operation `list_scratchpad`
3. Verify all notes returned with id, title, uri, updatedAt
4. Verify sorted by most recently updated

**Expected:** Complete scratchpad inventory

---

### Test 9: Scratchpad Deletion Flow

**Goal:** Verify scratchpad cleanup.

**Steps:**
1. Create a scratchpad note
2. Call operation `delete_scratchpad` with args: `{ "id": "api-design-ideas" }`
3. Verify success response
4. Call `read_scratchpad` - should return error "not found"

**Expected:** Scratchpad note removed

---

## Resource Access Tests

### Test 10: Resource URI Flow

**Goal:** Verify knowledge zone resources are browsable.

**Steps:**
1. Read resource `thoughtbox://knowledge`
2. Verify root shows pattern count and scratchpad count
3. Read resource `thoughtbox://knowledge/patterns`
4. Verify pattern listing returned
5. Read resource `thoughtbox://knowledge/patterns/{id}` for a specific pattern
6. Verify Markdown with YAML frontmatter returned

**Expected:** Full resource hierarchy browsable

---

## Error Handling Tests

### Test 11: Error Handling Flow

**Goal:** Verify graceful error handling.

**Steps:**
1. Call `create_pattern` without required `title` - should error with clear message
2. Call `get_pattern` with nonexistent ID - should return "not found"
3. Call `update_pattern` with nonexistent ID - should error
4. Call unknown operation - should error with list of valid operations

**Expected:** Clear error messages, no data corruption

---

## Persistence Tests

### Test 12: Filesystem Persistence Flow

**Goal:** Verify data survives server restart.

**Steps:**
1. Create patterns and scratchpad notes
2. Note the data
3. Restart the server (docker-compose down && docker-compose up)
4. Call `list_patterns` and `list_scratchpad`
5. Verify all previously created data still present

**Expected:** Markdown files in ~/.thoughtbox/knowledge/ persist across restarts

---

## Running These Tests

Execute by calling the `knowledge` MCP tool with operation and args:

```json
{
  "operation": "create_pattern",
  "args": {
    "title": "...",
    "description": "...",
    "content": "..."
  }
}
```

Data persists to:
- `~/.thoughtbox/knowledge/patterns/` (Markdown files with YAML frontmatter)
- `~/.thoughtbox/knowledge/scratchpad/` (Markdown files)

For a clean slate, delete the `~/.thoughtbox/knowledge/` directory before testing.
