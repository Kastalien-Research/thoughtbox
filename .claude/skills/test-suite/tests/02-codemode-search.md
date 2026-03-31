# 02 — thoughtbox_search

Purpose: Verify the executable-code discovery surface for operations, prompts, resources, and resource templates.

---

## Test 1: List Operation Modules

**Goal:** Verify the Code Mode catalog exposes the intended module namespaces.

**Steps:**
1. Call `thoughtbox_search` with:
   ```js
   async () => Object.keys(catalog.operations).sort()
   ```

**Expected:**
- Includes `session`, `thought`, `knowledge`, `notebook`, `theseus`, `ulysses`, `observability`
- Does **not** include `hub`
- Does **not** include `init`

---

## Test 2: Discover Session Operations

**Goal:** Verify search can inspect a specific module.

**Steps:**
1. Call:
   ```js
   async () => Object.keys(catalog.operations.session).sort()
   ```

**Expected:** Includes session operations such as `session_list`, `session_get`, `session_search`, `session_resume`, `session_export`, `session_analyze`, `session_extract_learnings`

---

## Test 3: Discover Prompts

**Goal:** Verify search can discover prompts as markdown-backed guidance.

**Steps:**
1. Call:
   ```js
   async () => catalog.prompts.filter(p => p.name.includes("spec"))
   ```

**Expected:** Returns one or more `spec-*` prompts with names and descriptions

---

## Test 4: Discover Resources

**Goal:** Verify search can discover embedded resources by URI/description.

**Steps:**
1. Call:
   ```js
   async () => catalog.resources.filter(r => r.uri.includes("tests"))
   ```

**Expected:** Returns test/guidance resources with URIs and descriptions

---

## Test 5: Resource Templates and Logs

**Goal:** Verify search supports resource-template discovery and console logging.

**Steps:**
1. Call:
   ```js
   async () => {
     console.log("listing templates");
     return catalog.resourceTemplates.map(t => t.uriTemplate);
   }
   ```

**Expected:**
- Returns one or more resource template URIs
- Response logs contain `listing templates`
