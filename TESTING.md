# Phase 3 Testing Checklist

## Overview
Phase 3 builds on Phases 1 & 2 by adding skill export automation and diff tracking between refinement cycles. This testing plan validates the advanced automation features.

**Prerequisites**: All Phase 1 and Phase 2 tests passing

---

## Test Environment Setup

### Prerequisites
- [ ] Phase 1 tests all passing
- [ ] Phase 2 tests all passing
- [ ] Build successful: `npm run build`
- [ ] MCP server running
- [ ] File system write permissions

### Test Data
- **Test Topic**: "Byzantine Fault Tolerance"
- **Test Language**: TypeScript
- **Skill Export Path**: `.claude/skills/byzantine-fault-tolerance`

---

## Test Suite

### Category 1: Snapshot Creation

#### Test 1: Snapshot on Cycle Start
**Objective**: Verify snapshot is created when starting a cycle

**Steps**:
1. Create notebook from template
2. Modify a Feynman cell (add some text)
3. Start Cycle 1: `{ "operation": "start_cycle", "args": { "notebookId": "<id>", "cycle": 1 } }`
4. Check response message

**Expected Results**:
- [ ] Success response
- [ ] Message includes "(snapshot created)"
- [ ] Timestamp returned
- [ ] No errors

---

#### Test 2: Snapshot Contains Cell Data
**Objective**: Verify snapshot captures cell content

**Steps**:
1. Create notebook
2. Start Cycle 1
3. Inspect notebook object (via debugging or export)

**Expected Results**:
- [ ] `cycleSnapshots` array exists
- [ ] Array has 1 entry (for Cycle 1)
- [ ] Snapshot has `cycle: 1`
- [ ] Snapshot has `timestamp`
- [ ] Snapshot has `cellSnapshots` object
- [ ] `cellSnapshots` contains cellId → text mappings

---

#### Test 3: Multiple Snapshots
**Objective**: Verify multiple cycles create separate snapshots

**Steps**:
1. Create notebook
2. Start Cycle 1
3. Start Cycle 2
4. Start Cycle 3
5. Check notebook state

**Expected Results**:
- [ ] `cycleSnapshots` array has 3 entries
- [ ] Each snapshot has different cycle number
- [ ] Each snapshot has different timestamp
- [ ] Snapshots are independent

---

#### Test 4: Snapshot Covers Feynman Cells
**Objective**: Verify snapshot captures Feynman phase cells

**Steps**:
1. Create notebook
2. Filter Feynman cells: `{ "operation": "filter_cells", "args": { "notebookId": "<id>", "phase": "feynman" } }`
3. Count cells
4. Start Cycle 1
5. Check snapshot has entries for Feynman cells

**Expected Results**:
- [ ] Snapshot has multiple cell entries
- [ ] All Feynman phase cells included
- [ ] Code cells included
- [ ] Non-Feynman cells excluded (research, expert, etc.)

---

### Category 2: Diff Tracking

#### Test 5: Get Diff - No Changes
**Objective**: Verify diff returns empty when nothing changed

**Steps**:
1. Create notebook
2. Start Cycle 1
3. Immediately get diff: `{ "operation": "get_cycle_diff", "args": { "notebookId": "<id>", "cycle": 1 } }`

**Expected Results**:
- [ ] Success response
- [ ] `changes: 0`
- [ ] `diffs` array is empty
- [ ] Timestamp matches snapshot creation

---

#### Test 6: Get Diff - With Changes
**Objective**: Verify diff detects changes

**Steps**:
1. Create notebook
2. Start Cycle 1 (creates snapshot)
3. Update a Feynman cell: `{ "operation": "update_cell", "args": { "notebookId": "<id>", "cellId": "<id>", "content": "New content" } }`
4. Get diff for Cycle 1

**Expected Results**:
- [ ] Success response
- [ ] `changes: 1` (at least)
- [ ] `diffs` array has entries
- [ ] Each diff has: `cellId`, `cellType`, `before`, `after`, `changed: true`
- [ ] `before` text is original
- [ ] `after` text is new content

---

#### Test 7: Diff Shows Multiple Changes
**Objective**: Verify diff tracks all modified cells

**Steps**:
1. Create notebook
2. Start Cycle 1
3. Modify 3 different Feynman cells
4. Get diff

**Expected Results**:
- [ ] `changes: 3`
- [ ] `diffs` array has 3 entries
- [ ] Each diff has correct before/after
- [ ] All modified cells represented

---

#### Test 8: Diff Across Cycles
**Objective**: Verify each cycle has independent diff

**Steps**:
1. Create notebook
2. Start Cycle 1
3. Modify cell A
4. Start Cycle 2 (new snapshot)
5. Modify cell B
6. Get diff for Cycle 1
7. Get diff for Cycle 2

**Expected Results**:
- [ ] Cycle 1 diff shows change to cell A
- [ ] Cycle 2 diff shows change to cell B
- [ ] Diffs are independent
- [ ] No cross-contamination

---

#### Test 9: Get Diff - No Snapshot
**Objective**: Verify error handling when snapshot doesn't exist

**Operation**:
```json
{
  "operation": "get_cycle_diff",
  "args": {
    "notebookId": "<id>",
    "cycle": 1
  }
}
```
*(without starting cycle first)*

**Expected Results**:
- [ ] `success: false`
- [ ] Error message: "No cycle snapshots found"
- [ ] Helpful message about starting cycle

---

#### Test 10: Get Diff - Invalid Cycle
**Objective**: Verify validation for cycle numbers

**Test Cases**:
- Cycle 0
- Cycle 4
- Cycle -1

**Expected Results**:
- [ ] All return error
- [ ] Error indicates invalid cycle number
- [ ] Range (1-3) mentioned

---

### Category 3: Skill Export

#### Test 11: Export to Skill - Basic
**Objective**: Verify basic skill export works

**Operation**:
```json
{
  "operation": "export_to_skill",
  "args": {
    "notebookId": "<id>",
    "skillPath": ".claude/skills/test-skill"
  }
}
```

**Expected Results**:
- [ ] Success response
- [ ] `skillPath` returned
- [ ] `file` path returned (points to SKILL.md)
- [ ] Message confirms export

---

#### Test 12: Skill Directory Creation
**Objective**: Verify skill directory is created

**Steps**:
1. Ensure skill path doesn't exist
2. Export to skill
3. Check filesystem

**Expected Results**:
- [ ] Directory `.claude/skills/test-skill` created
- [ ] Directory has correct permissions
- [ ] Parent directories created if needed (recursive)

---

#### Test 13: SKILL.md File Content
**Objective**: Verify SKILL.md contains expert content

**Steps**:
1. Create notebook, fill in Phase 4 (expert) sections
2. Export to skill
3. Read SKILL.md file

**Expected Contents**:
- [ ] File exists at `<skillPath>/SKILL.md`
- [ ] Starts with "# Skill: <topic>"
- [ ] Contains expert phase content
- [ ] Contains mental models section
- [ ] Contains pattern catalog
- [ ] Contains anti-patterns
- [ ] No Feynman explanation (that stays in notebook)
- [ ] No research notes (that stays in notebook)

---

#### Test 14: Skill Export - Topic Name Cleaned
**Objective**: Verify topic name is cleaned in skill title

**Steps**:
1. Create notebook titled "React Server Components"
2. Export to skill
3. Check SKILL.md title

**Expected Results**:
- [ ] Title is "# Skill: React Server Components"
- [ ] "🧠 Sequential Feynman Learning: " prefix removed
- [ ] Topic name preserved exactly
- [ ] No extra characters

---

#### Test 15: Export Without Expert Content
**Objective**: Verify error when no expert content exists

**Steps**:
1. Create blank notebook (no template) OR
2. Create template notebook but don't fill Phase 4
3. Export to skill

**Expected Results**:
- [ ] `success: false`
- [ ] Error: "No expert re-encoding content found (Phase 4)"
- [ ] Helpful message

---

#### Test 16: Export Overwrites Existing Skill
**Objective**: Verify export overwrites if skill exists

**Steps**:
1. Create skill export (first time)
2. Modify expert content in notebook
3. Export to same path (second time)
4. Read SKILL.md

**Expected Results**:
- [ ] Export succeeds both times
- [ ] Second export overwrites first
- [ ] File contains updated content
- [ ] No error about existing file

---

#### Test 17: Export to Nested Path
**Objective**: Verify export creates nested directories

**Skill Path**: `.claude/skills/databases/distributed/byzantine-consensus`

**Expected Results**:
- [ ] All parent directories created
- [ ] SKILL.md created in deepest directory
- [ ] No errors about missing directories

---

#### Test 18: Export Multiple Skills
**Objective**: Verify multiple notebooks can export to different skills

**Steps**:
1. Create Notebook A, export to skill-a
2. Create Notebook B, export to skill-b
3. Verify both skills exist

**Expected Results**:
- [ ] Both exports succeed
- [ ] Both SKILL.md files exist
- [ ] Content is different
- [ ] No cross-contamination

---

### Category 4: Integration Tests

#### Test 19: Complete Workflow with Export
**Objective**: Simulate full workflow ending in skill export

**Steps**:
1. Create notebook from template
2. Fill in research notes (Phase 1)
3. Write Feynman explanation (Phase 2)
4. Start Cycle 1
5. Make refinements to Feynman section
6. Complete Cycle 1
7. Get diff (verify changes)
8. Repeat for Cycles 2 and 3
9. Fill in expert re-encoding (Phase 4)
10. Export to skill
11. Verify SKILL.md contains expert content

**Expected Results**:
- [ ] All steps succeed
- [ ] Diffs capture all refinements
- [ ] Skill export successful
- [ ] Final skill is high quality
- [ ] Progress tracking shows completion

---

#### Test 20: Diff After Export
**Objective**: Verify diff still works after skill export

**Steps**:
1. Complete workflow through skill export
2. Get diff for each cycle

**Expected Results**:
- [ ] Diffs still accessible
- [ ] Export doesn't clear snapshots
- [ ] History preserved

---

### Category 5: Edge Cases & Error Handling

#### Test 21: Export with Special Characters in Path
**Objective**: Verify path handling

**Skill Paths**:
- `.claude/skills/react-server-components`
- `.claude/skills/web_assembly_optimization`
- `.claude/skills/c++ advanced techniques`

**Expected Results**:
- [ ] Hyphens work
- [ ] Underscores work
- [ ] Spaces handled (or error with helpful message)
- [ ] No path traversal allowed

---

#### Test 22: Large Diff
**Objective**: Verify performance with many changes

**Steps**:
1. Create notebook
2. Start Cycle 1
3. Modify 10+ Feynman cells significantly
4. Get diff

**Expected Results**:
- [ ] Diff completes in reasonable time (< 1 second)
- [ ] All changes captured
- [ ] No truncation
- [ ] No memory issues

---

#### Test 23: Empty Feynman Section
**Objective**: Verify snapshot handles empty content

**Steps**:
1. Create notebook
2. Clear all Feynman cells (make them empty)
3. Start Cycle 1
4. Add content
5. Get diff

**Expected Results**:
- [ ] Snapshot captures empty strings
- [ ] Diff shows before: "" and after: "content"
- [ ] No errors

---

#### Test 24: Concurrent Operations
**Objective**: Verify operations are safe concurrently

**Steps**:
1. Create notebook
2. Start Cycle 1
3. While diff is being computed, start Cycle 2
4. Get diffs for both

**Expected Results**:
- [ ] No race conditions
- [ ] Snapshots independent
- [ ] Diffs accurate
- [ ] No data corruption

---

### Category 6: Snapshot Persistence

#### Test 25: Snapshots Survive Export/Import
**Objective**: Verify snapshots persist through export/import cycle

**Steps**:
1. Create notebook
2. Start Cycle 1
3. Make changes
4. Export notebook to .src.md
5. Load notebook back
6. Get diff

**Expected Results**:
- [ ] Export succeeds
- [ ] Import succeeds
- [ ] Snapshots preserved in exported format
- [ ] Diff still available after reload
- [ ] Snapshot data intact

---

#### Test 26: Snapshot Not in Blank Notebooks
**Objective**: Verify blank notebooks don't have snapshot cruft

**Steps**:
1. Create blank notebook (no template)
2. Check notebook structure

**Expected Results**:
- [ ] No `cycleSnapshots` field (or empty array)
- [ ] No snapshot overhead
- [ ] Clean structure

---

### Category 7: Performance & Scalability

#### Test 27: Snapshot Size
**Objective**: Verify snapshots don't bloat notebook

**Steps**:
1. Create notebook
2. Start all 3 cycles
3. Check exported file size

**Expected Results**:
- [ ] File size reasonable (< 2x original template)
- [ ] Snapshots don't duplicate entire notebook
- [ ] Only changed cells tracked

---

#### Test 28: Diff Computation Speed
**Objective**: Verify diff computation is fast

**Steps**:
1. Create notebook with many Feynman cells
2. Start cycle
3. Make changes
4. Time diff computation

**Expected Results**:
- [ ] Diff computation < 100ms
- [ ] Scales linearly with cell count
- [ ] No performance degradation

---

### Category 8: Backward Compatibility

#### Test 29: Phase 1 & 2 Features Unaffected
**Objective**: Verify previous phases still work

**Steps**:
1. Run Phase 1 critical tests
2. Run Phase 2 critical tests
3. Verify no regressions

**Expected Results**:
- [ ] Template creation works
- [ ] Cell tagging works
- [ ] Progress tracking works
- [ ] Cycle management works
- [ ] No new errors

---

#### Test 30: Old Notebooks Without Snapshots
**Objective**: Verify graceful handling of notebooks created in Phase 1/2

**Steps**:
1. Simulate old notebook (no cycleSnapshots field)
2. Try to get diff

**Expected Results**:
- [ ] Graceful error
- [ ] Helpful message about starting cycle
- [ ] No crash
- [ ] Can still use notebook normally

---

## Summary Checklist

After completing all tests, verify:

- [ ] All 30 test cases passed
- [ ] Snapshot mechanism working
- [ ] Diff tracking accurate
- [ ] Skill export functional
- [ ] No regressions from Phase 1 or 2
- [ ] Performance acceptable
- [ ] Ready for production

---

## Known Issues / Notes

_(Document any issues discovered during testing)_

---

## Test Environment Details

**Date Tested**: ___________
**Tester**: ___________
**Environment**:
- OS: ___________
- Node Version: ___________
- MCP Server Version: ___________

**Phase 1 Test Results**: [ ] ALL PASS (required)
**Phase 2 Test Results**: [ ] ALL PASS (required)
**Phase 3 Test Results**: [ ] PASS [ ] FAIL [ ] PARTIAL

**Overall Assessment**:
- [ ] Ready for merge
- [ ] Needs fixes before merge
- [ ] Blocked by: ___________

**Notes**:
