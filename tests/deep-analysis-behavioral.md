# Deep Analysis - Behavioral Tests

Workflows for verifying the `thoughtbox_gateway` deep analysis operation.

**Tool:** `thoughtbox_gateway`
**Operation:** `deep_analysis`
**Required stage:** Stage 1 (init_complete)
**Analysis types:** `patterns`, `cognitive_load`, `decision_points`, `full`
**Options:** `includeTimeline`, `compareWith`

---

## DA-001: Patterns Analysis

**Goal:** Verify `patterns` analysis type returns statistical metrics.

**Prerequisite:** Stage 1, a session with thoughts/revisions/branches exists.

**Steps:**
1. Advance to Stage 1 via `start_new` or `load_context`
2. Call `{ operation: "deep_analysis", args: { sessionId: "<id>", analysisType: "patterns" } }`
3. Verify response includes:
   - `totalThoughts` (integer ≥ 1)
   - `revisionCount` (integer ≥ 0)
   - `branchCount` (integer ≥ 0)
   - `averageThoughtLength` (number > 0)
4. Verify counts match expected values for the session

**Expected:** Accurate statistical summary of session structure

---

## DA-002: Cognitive Load Analysis

**Goal:** Verify `cognitive_load` analysis type returns complexity indicators.

**Prerequisite:** Stage 1, a session exists.

**Steps:**
1. Advance to Stage 1
2. Call `{ operation: "deep_analysis", args: { sessionId: "<id>", analysisType: "cognitive_load" } }`
3. Verify response includes:
   - `complexityScore` (number 0–100)
   - `depthIndicator` (max thought number in session)
   - `breadthIndicator` (count of unique branches)
4. Verify complexityScore is within 0–100 range
5. Verify depthIndicator ≥ 1
6. Verify breadthIndicator ≥ 0

**Expected:** Meaningful complexity assessment with bounded score

---

## DA-003: Decision Points Analysis

**Goal:** Verify `decision_points` analysis type returns array of revisions and branches with references.

**Prerequisite:** Stage 1, a session with at least one revision OR one branch.

**Steps:**
1. Advance to Stage 1
2. Use a session known to have revisions and branches
3. Call `{ operation: "deep_analysis", args: { sessionId: "<id>", analysisType: "decision_points" } }`
4. Verify response includes array of decision points
5. Each decision point should have:
   - `thoughtNumber` (integer)
   - `type` (`"revision"` or `"branch"`)
   - `reference` (thought number being revised or branched from)
6. Verify revisions have type `"revision"` and branches have type `"branch"`

**Expected:** Each point where reasoning diverged is identified with type and reference

---

## DA-004: Full Analysis

**Goal:** Verify `full` analysis type combines all analysis types.

**Prerequisite:** Stage 1, a session exists.

**Steps:**
1. Advance to Stage 1
2. Call `{ operation: "deep_analysis", args: { sessionId: "<id>", analysisType: "full" } }`
3. Verify response includes all fields from DA-001 (patterns):
   - `totalThoughts`, `revisionCount`, `branchCount`, `averageThoughtLength`
4. Verify response includes all fields from DA-002 (cognitive load):
   - `complexityScore`, `depthIndicator`, `breadthIndicator`
5. Verify response includes all fields from DA-003 (decision points):
   - Decision points array

**Expected:** Superset of all three individual analysis types

---

## DA-005: Include Timeline Option

**Goal:** Verify `options.includeTimeline` adds temporal data.

**Prerequisite:** Stage 1, a session exists.

**Steps:**
1. Advance to Stage 1
2. Call `{ operation: "deep_analysis", args: { sessionId: "<id>", analysisType: "full", options: { includeTimeline: true } } }`
3. Verify response includes timeline data:
   - `createdAt` (session creation timestamp)
   - `updatedAt` (last modification timestamp)
   - `durationEstimate` (estimated session duration)
4. Call same analysis WITHOUT `includeTimeline`
5. Verify timeline fields are absent (or null) without the option

**Expected:** Timeline data included only when requested

---

## DA-006: Invalid Session ID

**Goal:** Verify clear error for nonexistent session.

**Steps:**
1. Advance to Stage 1
2. Call `{ operation: "deep_analysis", args: { sessionId: "nonexistent-session-xyz", analysisType: "patterns" } }`
3. Verify error response (not a crash)
4. Verify error message indicates session not found
5. Verify error is specific (not a generic 500)

**Expected:** Clear "session not found" error with the invalid ID echoed back

---

## Running These Tests

All deep analysis tests require Stage 1. Execute by calling `thoughtbox_gateway` with `operation: "deep_analysis"`.

**Setup:** Create a test session with thoughts, revisions, and branches before running these tests. Ideally:
- At least 5 thoughts
- At least 1 revision (isRevision: true, revisesThought: N)
- At least 1 branch (branchFromThought: N, branchId: "test-branch")
