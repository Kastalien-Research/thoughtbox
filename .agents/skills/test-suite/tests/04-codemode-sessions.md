# 04 — Session Management via `tb.session.*`

Purpose: Verify session CRUD, search, resume, export, and analysis through the Code Mode execute surface.

---

## Test 1: List Sessions with Pagination

**Goal:** Verify session listing with limit/offset.

**Steps:**
1. Call:
   ```js
   async () => {
     const page1 = await tb.session.list({ limit: 2, offset: 0 });
     const page2 = await tb.session.list({ limit: 2, offset: 2 });
     return { page1Count: page1.sessions.length, page2Count: page2.sessions.length, page1HasMore: page1.hasMore };
   }
   ```
2. Verify page1 has at most 2 sessions
3. Verify page2 has different sessions than page1

**Expected:** Pagination works, sessions have title, tags, thoughtCount, timestamps.

---

## Test 2: Get Session Details

**Goal:** Verify full session retrieval with thoughts.

**Steps:**
1. Call (using a session created in test 03):
   ```js
   async () => {
     const list = await tb.session.list({ limit: 1 });
     const sessionId = list.sessions[0].id;
     const full = await tb.session.get(sessionId);
     return {
       hasSession: !!full.session,
       hasThoughts: Array.isArray(full.thoughts),
       thoughtCount: full.thoughts?.length,
       metadataThoughtCount: full.session?.thoughtCount
     };
   }
   ```
2. Verify `thoughts` array length matches `session.thoughtCount`
3. Verify session metadata includes title, tags, timestamps

**Expected:** Complete session object with full thought chain.

---

## Test 3: Search Sessions

**Goal:** Verify text search across sessions.

**Steps:**
1. Call:
   ```js
   async () => {
     const results = await tb.session.search("Forward Thinking");
     return results;
   }
   ```
2. Verify matching sessions returned (from test 03 "Test 1: Forward Thinking")

**Expected:** Sessions matching title or content found.

---

## Test 4: Resume Session

**Goal:** Verify resuming appends to existing session.

**Steps:**
1. Call:
   ```js
   async () => {
     const t1 = await tb.thought({ thought: "Test 4-S: Original thought", thoughtType: "reasoning", nextThoughtNeeded: true, sessionTitle: "Test 4-S: Resume Test" });
     const sessionId = t1.sessionId;
     const before = await tb.session.get(sessionId);
     await tb.session.resume(sessionId);
     const t2 = await tb.thought({ thought: "Test 4-S: Resumed thought", thoughtType: "reasoning", nextThoughtNeeded: false });
     const after = await tb.session.get(sessionId);
     return {
       sessionId,
       beforeCount: before.session.thoughtCount,
       afterCount: after.session.thoughtCount
     };
   }
   ```
2. Verify `afterCount === beforeCount + 1`

**Expected:** Resumed session continues from where it left off.

---

## Test 5: Export — Markdown

**Goal:** Verify markdown export.

**Steps:**
1. Call:
   ```js
   async () => {
     const list = await tb.session.list({ limit: 1 });
     const exported = await tb.session.export(list.sessions[0].id, "markdown");
     return { hasContent: typeof exported === "string" || typeof exported?.content === "string", length: (exported?.content || exported || "").length };
   }
   ```
2. Verify output contains markdown with thought content

**Expected:** Human-readable markdown export.

---

## Test 6: Export — JSON

**Goal:** Verify JSON export with linked nodes.

**Steps:**
1. Call:
   ```js
   async () => {
     const list = await tb.session.list({ limit: 1 });
     const exported = await tb.session.export(list.sessions[0].id, "json");
     return exported;
   }
   ```
2. Verify JSON includes nodes with thought data

**Expected:** Structured JSON with linked-list node format.

---

## Test 7: Analyze Session

**Goal:** Verify objective session metrics.

**Steps:**
1. Call:
   ```js
   async () => {
     const list = await tb.session.list({ limit: 1 });
     const analysis = await tb.session.analyze(list.sessions[0].id);
     return analysis;
   }
   ```
2. Verify metrics include quantitative analysis (linearity, revision rate, etc.)

**Expected:** Quantitative analysis of reasoning patterns.

---

## Test 8: Extract Learnings

**Goal:** Verify pattern extraction from sessions.

**Steps:**
1. Call:
   ```js
   async () => {
     const list = await tb.session.list({ limit: 1 });
     const learnings = await tb.session.extractLearnings(list.sessions[0].id);
     return learnings;
   }
   ```
2. Verify patterns or signals are returned

**Expected:** Structured learnings categorized by type.
