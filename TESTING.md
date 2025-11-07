# Phase 2 Testing Checklist

## Overview
Phase 2 builds on Phase 1 by adding cell metadata, progress tracking, and cycle management helpers. This testing plan validates the enhanced workflow features.

**Prerequisites**: All Phase 1 tests passing

---

## Test Environment Setup

### Prerequisites
- [ ] Phase 1 tests all passing
- [ ] Build successful: `npm run build`
- [ ] MCP server running
- [ ] Able to create notebooks from template

### Test Data
- **Test Topic**: "Distributed Consensus Algorithms"
- **Test Language**: TypeScript

---

## Test Suite

### Category 1: Cell Metadata & Tagging

#### Test 1: Automatic Cell Tagging
**Objective**: Verify cells are automatically tagged with metadata during template creation

**Steps**:
1. Create notebook from template
2. Filter cells by phase: `{ "operation": "filter_cells", "args": { "notebookId": "<id>", "phase": "research" } }`
3. Repeat for each phase: "feynman", "refinement", "expert", "meta"

**Expected Results**:
- [ ] Research phase cells returned (at least 1)
- [ ] Feynman phase cells returned (multiple expected)
- [ ] Refinement phase cells returned (3+ for cycles)
- [ ] Expert phase cells returned (multiple expected)
- [ ] Meta phase cells returned (at least 1)

---

#### Test 2: Cycle-Specific Tagging
**Objective**: Verify refinement cells are tagged with cycle numbers

**Steps**:
1. Create notebook from template
2. Filter: `{ "operation": "filter_cells", "args": { "notebookId": "<id>", "phase": "refinement", "cycle": 1 } }`
3. Repeat for cycle 2 and 3

**Expected Results**:
- [ ] Cycle 1 cells returned (count > 0)
- [ ] Cycle 2 cells returned (count > 0)
- [ ] Cycle 3 cells returned (count > 0)
- [ ] Each cycle has separate cells
- [ ] No overlap between cycles

---

#### Test 3: Progress Tracker Role Tag
**Objective**: Verify special role tags are applied

**Steps**:
1. Create notebook from template
2. List all cells
3. Find cell with `metadata.role === "progress-tracker"`

**Expected Results**:
- [ ] Exactly 1 cell with role "progress-tracker"
- [ ] Cell contains "Progress Checklist" text
- [ ] Cell type is markdown or title

---

#### Test 4: Metadata Persistence
**Objective**: Verify metadata persists through export/import

**Steps**:
1. Create notebook from template
2. Export notebook
3. Load exported notebook
4. Filter cells by phase

**Expected Results**:
- [ ] Export succeeds
- [ ] Import succeeds
- [ ] Metadata preserved in imported notebook
- [ ] Filter operations still work

---

### Category 2: Progress Tracking

#### Test 5: Get Progress - Initial State
**Objective**: Verify progress tracking on fresh notebook

**Operation**:
```json
{
  "operation": "get_progress",
  "args": {
    "notebookId": "<id>"
  }
}
```

**Expected Results**:
- [ ] Success response
- [ ] `percentage` is 0
- [ ] `completed` is 0
- [ ] `total` is 6 (number of checklist items)
- [ ] `tasks` array has 6 items
- [ ] All tasks have `completed: false`
- [ ] `currentPhase` extracted (may be "Unknown" or "Phase 1 - Research")
- [ ] `currentCycle` is "N/A"

---

#### Test 6: Progress Parsing - Checkboxes
**Objective**: Verify checkbox parsing is accurate

**Steps**:
1. Create notebook
2. Get progress (baseline)
3. Manually update progress cell: change `- [ ]` to `- [x]` for one item
4. Get progress again

**Expected Results**:
- [ ] `completed` increases by 1
- [ ] `percentage` increases
- [ ] Specific task shows `completed: true`
- [ ] Other tasks remain `completed: false`

---

#### Test 7: Progress with No Tracker
**Objective**: Verify handling when no progress tracker exists

**Steps**:
1. Create blank notebook (no template)
2. Get progress: `{ "operation": "get_progress", "args": { "notebookId": "<id>" } }`

**Expected Results**:
- [ ] Success response (not error)
- [ ] Message indicates no progress tracker found
- [ ] Graceful degradation

---

### Category 3: Cycle Management

#### Test 8: Start Cycle - First Cycle
**Objective**: Verify starting Cycle 1 updates notebook state

**Operation**:
```json
{
  "operation": "start_cycle",
  "args": {
    "notebookId": "<id>",
    "cycle": 1
  }
}
```

**Expected Results**:
- [ ] Success response
- [ ] Message: "Cycle 1 started"
- [ ] Timestamp returned
- [ ] Title cell updated with cycle info
- [ ] Cycle status cell updated to "In Progress"

---

#### Test 9: Start Cycle - Status Update
**Objective**: Verify cycle status changes are reflected

**Steps**:
1. Create notebook
2. Start Cycle 1
3. Get cells for Cycle 1: `{ "operation": "filter_cells", "args": { "notebookId": "<id>", "phase": "refinement", "cycle": 1 } }`
4. Check cell content

**Expected Results**:
- [ ] Cycle 1 cells contain "In Progress" status
- [ ] Date stamp present
- [ ] Original "Not Started" text replaced

---

#### Test 10: Complete Cycle - Progress Update
**Objective**: Verify completing a cycle checks off progress

**Steps**:
1. Create notebook
2. Get progress (baseline)
3. Complete Cycle 1: `{ "operation": "complete_cycle", "args": { "notebookId": "<id>", "cycle": 1 } }`
4. Get progress again

**Expected Results**:
- [ ] Success response
- [ ] Progress `completed` increased by 1
- [ ] Specific checkbox for Cycle 1 is checked
- [ ] Progress percentage updated
- [ ] Cycle status cell updated to "Complete"

---

#### Test 11: Complete All Cycles
**Objective**: Verify all three cycles can be completed

**Steps**:
1. Create notebook
2. Start and complete Cycle 1
3. Start and complete Cycle 2
4. Start and complete Cycle 3
5. Get progress

**Expected Results**:
- [ ] All cycle operations succeed
- [ ] Progress shows 3 cycles completed
- [ ] Progress percentage reflects all completions
- [ ] All cycle status cells updated

---

#### Test 12: Cycle Validation - Invalid Numbers
**Objective**: Verify cycle number validation

**Test Cases**:
- Cycle 0: `{ "operation": "start_cycle", "args": { "notebookId": "<id>", "cycle": 0 } }`
- Cycle 4: `{ "operation": "start_cycle", "args": { "notebookId": "<id>", "cycle": 4 } }`
- Cycle -1: `{ "operation": "start_cycle", "args": { "notebookId": "<id>", "cycle": -1 } }`

**Expected Results**:
- [ ] All return error (not success)
- [ ] Error message indicates invalid cycle number
- [ ] Error mentions valid range (1-3)

---

### Category 4: Cell Filtering

#### Test 13: Filter by Phase Only
**Objective**: Verify filtering by phase without cycle

**Steps**:
1. Create notebook
2. Filter research: `{ "operation": "filter_cells", "args": { "notebookId": "<id>", "phase": "research" } }`
3. Filter feynman
4. Filter expert

**Expected Results**:
- [ ] Each filter returns appropriate cells
- [ ] Cell counts make sense (feynman > research)
- [ ] No cycle-specific cells in non-refinement phases
- [ ] Returned cells include metadata field

---

#### Test 14: Filter by Cycle Only
**Objective**: Verify filtering by cycle returns only refinement cells

**Operation**:
```json
{
  "operation": "filter_cells",
  "args": {
    "notebookId": "<id>",
    "cycle": 1
  }
}
```

**Expected Results**:
- [ ] Only Cycle 1 cells returned
- [ ] All returned cells have `metadata.cycle === 1`
- [ ] All returned cells have `metadata.phase === "refinement"`

---

#### Test 15: Filter by Phase and Cycle Combined
**Objective**: Verify combined filtering works

**Operation**:
```json
{
  "operation": "filter_cells",
  "args": {
    "notebookId": "<id>",
    "phase": "refinement",
    "cycle": 2
  }
}
```

**Expected Results**:
- [ ] Only Cycle 2 refinement cells returned
- [ ] Count matches expected (3-5 cells per cycle)
- [ ] No Cycle 1 or Cycle 3 cells
- [ ] No other phase cells

---

#### Test 16: Filter Returns Cell Details
**Objective**: Verify filtered cells include useful information

**Steps**:
1. Filter cells by any phase
2. Examine returned cell objects

**Expected Cell Object**:
- [ ] `id` field present
- [ ] `type` field present
- [ ] `metadata` field present with phase/cycle/role
- [ ] `text` field present (for markdown/title)
- [ ] `filename` field present (for code cells)

---

### Category 5: Integration Tests

#### Test 17: Full Workflow Simulation
**Objective**: Simulate complete Sequential Feynman workflow

**Steps**:
1. Create notebook from template
2. Get progress (0%)
3. Start Cycle 1
4. Update some Feynman cells
5. Complete Cycle 1
6. Get progress (should show Cycle 1 done)
7. Start Cycle 2
8. Complete Cycle 2
9. Start Cycle 3
10. Complete Cycle 3
11. Get progress (50% - 3 of 6 items)
12. Filter expert cells
13. Export notebook

**Expected Results**:
- [ ] All operations succeed
- [ ] Progress increases correctly
- [ ] Cycle states update properly
- [ ] Export preserves all changes
- [ ] No errors throughout workflow

---

#### Test 18: Multiple Notebooks Concurrently
**Objective**: Verify operations work with multiple notebooks

**Steps**:
1. Create Notebook A from template
2. Create Notebook B from template
3. Start Cycle 1 in Notebook A
4. Start Cycle 2 in Notebook B
5. Get progress for both
6. Verify no cross-contamination

**Expected Results**:
- [ ] Both notebooks created successfully
- [ ] Operations on A don't affect B
- [ ] Operations on B don't affect A
- [ ] Progress tracked separately
- [ ] Cycle states independent

---

### Category 6: Edge Cases

#### Test 19: Start Cycle Multiple Times
**Objective**: Verify behavior when starting same cycle twice

**Steps**:
1. Create notebook
2. Start Cycle 1
3. Start Cycle 1 again

**Expected Results**:
- [ ] Second start succeeds (or handles gracefully)
- [ ] Timestamp updates
- [ ] No duplicate entries
- [ ] State remains consistent

---

#### Test 20: Complete Cycle Without Starting
**Objective**: Verify completing unstarted cycle

**Steps**:
1. Create notebook
2. Complete Cycle 1 (without starting it)

**Expected Results**:
- [ ] Operation succeeds (or handles gracefully)
- [ ] Progress checkbox updates
- [ ] No errors

---

#### Test 21: Progress After Manual Edits
**Objective**: Verify progress tracking resilient to manual changes

**Steps**:
1. Create notebook
2. Manually edit progress cell (add/remove checkboxes)
3. Get progress

**Expected Results**:
- [ ] Parsing adapts to changed checklist
- [ ] No crashes
- [ ] Counts reflect actual checkboxes

---

### Category 7: Backward Compatibility

#### Test 22: Phase 1 Features Still Work
**Objective**: Verify Phase 1 functionality not broken

**Steps**:
1. Run all Phase 1 tests
2. Verify they still pass
3. Check for regressions

**Expected Results**:
- [ ] Template creation works
- [ ] Placeholder substitution works
- [ ] Export/import works
- [ ] No new errors

---

#### Test 23: Blank Notebooks Unaffected
**Objective**: Verify blank notebooks don't have metadata

**Steps**:
1. Create blank notebook (no template)
2. List cells
3. Try get_progress

**Expected Results**:
- [ ] Cells have no metadata (or undefined metadata)
- [ ] get_progress returns graceful message
- [ ] No errors for missing metadata
- [ ] Filter operations handle missing metadata

---

## Performance Tests

#### Test 24: Cell Tagging Performance
**Objective**: Verify tagging doesn't slow template creation

**Steps**:
1. Time template creation in Phase 1
2. Time template creation in Phase 2
3. Compare

**Expected Results**:
- [ ] Phase 2 creation < 100ms slower
- [ ] No noticeable lag
- [ ] Tagging is fast

---

#### Test 25: Filter Performance
**Objective**: Verify filtering is efficient

**Steps**:
1. Create notebook
2. Time filter operations
3. Run multiple filters

**Expected Results**:
- [ ] Filter operations < 50ms each
- [ ] No memory issues
- [ ] Consistent performance

---

## Summary Checklist

After completing all tests, verify:

- [ ] All 25 test cases passed
- [ ] Cell metadata system working
- [ ] Progress tracking accurate
- [ ] Cycle management functional
- [ ] Cell filtering efficient
- [ ] No regressions from Phase 1
- [ ] Ready for Phase 3 testing

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
**Phase 2 Test Results**: [ ] PASS [ ] FAIL [ ] PARTIAL

**Notes**:
