# Phase 1 Testing Checklist

## Overview
Phase 1 implements the core Sequential Feynman template system. This testing plan validates that templates load correctly, placeholders are substituted, and the basic workflow functions.

---

## Test Environment Setup

### Prerequisites
- [ ] Build successful: `npm run build`
- [ ] MCP server running or testable via script
- [ ] Access to create notebooks

### Test Data
- **Test Topic**: "React Server Components" (complex, multi-word)
- **Test Language**: TypeScript
- **Alternative Topics**: "WebAssembly", "Distributed Consensus"

---

## Test Suite

### Test 1: Template File Existence
**Objective**: Verify template file exists and is readable

**Steps**:
1. Check file exists: `ls templates/sequential-feynman-template.src.md`
2. Verify file size: `wc -l templates/sequential-feynman-template.src.md` (should be ~644 lines)
3. Check for placeholders: `grep "\[TOPIC\]" templates/sequential-feynman-template.src.md`
4. Check for placeholders: `grep "\[DATE\]" templates/sequential-feynman-template.src.md`
5. Check metadata header: `head -1 templates/sequential-feynman-template.src.md`

**Expected Results**:
- [ ] File exists
- [ ] ~644 lines
- [ ] Contains `[TOPIC]` placeholders
- [ ] Contains `[DATE]` placeholder
- [ ] First line is `<!-- srcbook:{"language":"[LANGUAGE]"} -->`

---

### Test 2: Create Blank Notebook (Baseline)
**Objective**: Verify existing functionality still works

**Operation**:
```json
{
  "operation": "create",
  "args": {
    "title": "Baseline Test",
    "language": "typescript"
  }
}
```

**Expected Results**:
- [ ] Success response
- [ ] Notebook ID returned
- [ ] Cell count is 2 (title + package.json)
- [ ] No template applied

---

### Test 3: Create Notebook from Template
**Objective**: Verify template loading works

**Operation**:
```json
{
  "operation": "create",
  "args": {
    "title": "React Server Components",
    "language": "typescript",
    "template": "sequential-feynman"
  }
}
```

**Expected Results**:
- [ ] Success response
- [ ] Notebook ID returned
- [ ] Cell count > 15 (should be ~18-20 cells after markdown merging)
- [ ] Title contains "React Server Components"

---

### Test 4: Placeholder Substitution - Topic
**Objective**: Verify [TOPIC] is replaced correctly

**Steps**:
1. Create notebook with topic "WebAssembly Optimization"
2. List cells: `{ "operation": "list_cells", "args": { "notebookId": "<id>" } }`
3. Check first cell (title) contains topic
4. Get cell content and verify no `[TOPIC]` remains

**Expected Results**:
- [ ] Title cell contains "WebAssembly Optimization"
- [ ] No `[TOPIC]` placeholders in any cell
- [ ] Topic appears in multiple cells (title, metadata section)

---

### Test 5: Placeholder Substitution - Date
**Objective**: Verify [DATE] is replaced with current date

**Steps**:
1. Create notebook
2. List cells
3. Check second cell (metadata) for date in YYYY-MM-DD format

**Expected Results**:
- [ ] Date is in format YYYY-MM-DD
- [ ] Date matches today's date
- [ ] No `[DATE]` placeholders remain

---

### Test 6: Placeholder Substitution - Language
**Objective**: Verify [LANGUAGE] is replaced in metadata header

**Steps**:
1. Create notebook with `language: "typescript"`
2. Export notebook: `{ "operation": "export", "args": { "notebookId": "<id>", "path": "test-export.src.md" } }`
3. Check first line of exported file

**Expected Results**:
- [ ] First line is `<!-- srcbook:{"language":"typescript"} -->`
- [ ] No `[LANGUAGE]` placeholder
- [ ] Contains tsconfig.json in metadata if TypeScript

---

### Test 7: Template Structure Validation
**Objective**: Verify all expected sections are present

**Steps**:
1. Create notebook from template
2. List cells
3. Check for presence of key sections

**Expected Sections** (as cell text or titles):
- [ ] "Progress Checklist"
- [ ] "Phase 1: Research & Synthesis"
- [ ] "Phase 2: Feynman Explanation"
- [ ] "Phase 3: Refinement"
- [ ] "Cycle 1", "Cycle 2", "Cycle 3"
- [ ] "Phase 4: Expert Re-Encoding"
- [ ] "Meta-Reflection"

---

### Test 8: JavaScript Template
**Objective**: Verify template works with JavaScript (not just TypeScript)

**Operation**:
```json
{
  "operation": "create",
  "args": {
    "title": "JavaScript Test",
    "language": "javascript",
    "template": "sequential-feynman"
  }
}
```

**Expected Results**:
- [ ] Success response
- [ ] Language is "javascript"
- [ ] Metadata shows `"language":"javascript"`
- [ ] No tsconfig.json in metadata

---

### Test 9: Export Template Notebook
**Objective**: Verify template-created notebooks export correctly

**Steps**:
1. Create notebook from template
2. Export: `{ "operation": "export", "args": { "notebookId": "<id>", "path": "test.src.md" } }`
3. Check exported file structure

**Expected Results**:
- [ ] Export succeeds
- [ ] File is valid .src.md format
- [ ] Can be re-loaded with `load` operation
- [ ] No data loss during export/import cycle

---

### Test 10: Invalid Template Name
**Objective**: Verify error handling for non-existent templates

**Operation**:
```json
{
  "operation": "create",
  "args": {
    "title": "Test",
    "language": "typescript",
    "template": "non-existent-template"
  }
}
```

**Expected Results**:
- [ ] Error response (not success)
- [ ] Error message indicates template not found
- [ ] Error mentions the template name

---

### Test 11: Multi-word Topic Names
**Objective**: Verify complex topic names work

**Test Topics**:
- "React Server Components and Streaming"
- "Distributed Systems: Consensus Algorithms"
- "WebAssembly SIMD Optimization Techniques"

**Expected Results**:
- [ ] All multi-word topics substitute correctly
- [ ] No truncation
- [ ] Special characters handled properly

---

### Test 12: Cell Count Validation
**Objective**: Verify template creates expected number of cells

**Steps**:
1. Create notebook from template
2. List cells and count
3. Check cell types distribution

**Expected Results**:
- [ ] Total cells: 18-20 (markdown sections merge during parsing)
- [ ] Contains at least 1 title cell
- [ ] Contains multiple markdown cells
- [ ] Contains 1 package.json cell
- [ ] May contain code cells (if template has examples)

---

## Performance Tests

### Test 13: Template Load Performance
**Objective**: Verify template loading doesn't cause significant delay

**Steps**:
1. Time blank notebook creation
2. Time template notebook creation
3. Compare

**Expected Results**:
- [ ] Template creation < 500ms slower than blank
- [ ] No timeout errors
- [ ] No memory issues

---

## Integration Tests

### Test 14: Template + Cell Operations
**Objective**: Verify template notebooks work with all cell operations

**Steps**:
1. Create notebook from template
2. Add a new markdown cell: `{ "operation": "add_cell", "args": { ... } }`
3. Update existing cell: `{ "operation": "update_cell", "args": { ... } }`
4. List cells
5. Export

**Expected Results**:
- [ ] All operations succeed
- [ ] New cells integrate properly
- [ ] Updates apply correctly
- [ ] Export includes changes

---

### Test 15: Template + Code Execution
**Objective**: Verify code cells can be added and executed

**Steps**:
1. Create notebook from template
2. Add code cell with simple console.log
3. Run cell: `{ "operation": "run_cell", "args": { ... } }`

**Expected Results**:
- [ ] Code cell executes
- [ ] Output captured
- [ ] No errors related to template structure

---

## Edge Cases

### Test 16: Empty Topic Name
**Objective**: Verify handling of edge case inputs

**Operation**:
```json
{
  "operation": "create",
  "args": {
    "title": "",
    "language": "typescript",
    "template": "sequential-feynman"
  }
}
```

**Expected Results**:
- [ ] Error or handles gracefully
- [ ] If allowed, substitutes empty string correctly

---

### Test 17: Very Long Topic Name
**Objective**: Verify handling of long inputs

**Topic**: "Understanding the Complete Architecture and Implementation Details of Modern Distributed Database Systems with Consensus Algorithms"

**Expected Results**:
- [ ] Topic substitutes correctly
- [ ] No truncation
- [ ] Export/import preserves full name

---

## Regression Tests

### Test 18: Existing Notebooks Unaffected
**Objective**: Verify template system doesn't break existing notebooks

**Steps**:
1. Create blank notebook (no template)
2. Verify all existing operations work
3. Verify no unexpected metadata

**Expected Results**:
- [ ] Blank notebooks work as before
- [ ] No template metadata in blank notebooks
- [ ] Backward compatibility maintained

---

## Documentation Tests

### Test 19: Templates README
**Objective**: Verify documentation is present and accurate

**Steps**:
1. Check `templates/README.md` exists
2. Verify it documents sequential-feynman template
3. Verify usage examples are correct

**Expected Results**:
- [ ] README exists
- [ ] Documents template usage
- [ ] Examples are accurate
- [ ] Installation/usage instructions clear

---

## Summary Checklist

After completing all tests, verify:

- [ ] All 19 test cases passed
- [ ] No critical bugs identified
- [ ] Performance acceptable
- [ ] Documentation accurate
- [ ] Ready for Phase 2 testing

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

**Overall Result**: [ ] PASS [ ] FAIL [ ] PARTIAL

**Notes**:
