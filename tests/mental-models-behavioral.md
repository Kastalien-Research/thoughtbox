# Mental Models Toolhost - Behavioral Tests

Workflows for Claude to execute when verifying the mental_models toolhost functions correctly.

## Test 1: Discovery Flow

**Goal:** Verify an agent can discover what's available.

**Steps:**
1. Call `mental_models` with operation `list_tags`
2. Verify response contains 9 tags with descriptions
3. Pick a tag (e.g., "debugging") and call `list_models` with that tag filter
4. Verify only models with that tag are returned

**Expected:** Agent can navigate from tags → filtered models

---

## Test 2: Model Retrieval Flow

**Goal:** Verify an agent can retrieve and use a mental model.

**Steps:**
1. Call `mental_models` with operation `get_model`, model `five-whys`
2. Verify response contains:
   - Name and title
   - Tags array
   - Content with "# Five Whys" heading
   - "## When to Use" section
   - "## Process" section with numbered steps
3. Content should be process scaffolding (HOW to think), not analysis

**Expected:** Full prompt content suitable for guiding reasoning

---

## Test 3: Error Handling Flow

**Goal:** Verify graceful error handling.

**Steps:**
1. Call `get_model` without a model name - should error with available models list
2. Call `get_model` with invalid model name - should error with available models list
3. Call `list_models` with invalid tag - should error with available tags list
4. Call unknown operation - should error with available operations list

**Expected:** All errors include guidance on valid options

---

## Test 4: Capability Graph Flow

**Goal:** Verify capability graph can initialize knowledge graph.

**Steps:**
1. Call `mental_models` with operation `get_capability_graph`
2. Verify response contains:
   - `entities` array with thoughtbox_server, tools, tags, and models
   - `relations` array with provides, contains, tagged_with relationships
   - `usage` object with step-by-step instructions
3. Optionally: Use returned data with `memory_create_entities` and `memory_create_relations`

**Expected:** Structured data ready for knowledge graph initialization

---

## Test 5: Tag Coverage Flow

**Goal:** Verify tag taxonomy covers use cases.

**Steps:**
1. Call `list_tags` to see all categories
2. For each tag, call `list_models` with that tag
3. Verify each tag has at least one model
4. Verify model descriptions match tag intent

**Expected:** Complete coverage - no orphan tags or miscategorized models

---

## Test 6: Content Quality Flow

**Goal:** Verify mental model content follows "infrastructure not intelligence" principle.

**Steps:**
1. Retrieve several models (rubber-duck, pre-mortem, inversion)
2. For each, verify content:
   - Has clear process steps (numbered or bulleted)
   - Explains WHEN to use
   - Provides examples of APPLICATION
   - Lists anti-patterns or common mistakes
   - Does NOT perform reasoning or draw conclusions

**Expected:** Process scaffolds, not analysis

---

## Running These Tests

Execute by calling the `mental_models` MCP tool with the specified operations and verifying responses match expectations. Report any failures with:
- Operation called
- Arguments provided
- Expected vs actual response
- Specific assertion that failed
