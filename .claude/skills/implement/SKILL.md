---
name: implement
description: Implement a specification using a TDD-oriented workflow. Extracts requirements, generates tests first, then implements to pass the tests. Includes spiral detection and acceptance gates.
argument-hint: [spec file or description]
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Edit, Write
---

Implement the following specification: $ARGUMENTS

## Workflow

### Phase 1: Requirement Extraction (10% of effort)
1. Read the spec file (if a path was given) or parse the description
2. Extract atomic, testable requirements
3. Identify dependencies (internal and external)
4. Create a checklist of acceptance criteria

### Phase 2: Test-First Development (25% of effort)
For each requirement:
1. Write a failing test that captures the requirement
2. Run the test to confirm it fails (red)
3. Move to the next requirement

### Phase 3: Implementation (50% of effort)
For each failing test (in dependency order):
1. Implement the minimum code to make the test pass
2. Run the test to confirm it passes (green)
3. Refactor if needed (keeping tests green)
4. Check for regressions after each change

**Spiral detection**: If you find yourself editing the same files 3+ times without making progress, stop and reassess your approach.

### Phase 4: Verification (15% of effort)
1. Run the full test suite
2. Walk through each acceptance criterion — does the implementation satisfy it?
3. Check for edge cases not covered by tests
4. Report results

## Output

At completion, present:
```
## Implementation Summary

Requirements: [N total, N implemented, N deferred]
Tests: [N passing, N failing, N skipped]
Files changed: [list]

Acceptance Criteria:
  - [criterion 1]: PASS | FAIL
  - [criterion 2]: PASS | FAIL

Deferred items (if any):
  - [item]: [reason deferred]
```
