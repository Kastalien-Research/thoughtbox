# SPEC-DGM-007: Automated Test Generation Skill

**Status**: Draft  
**Priority**: P2 - Required for DGM Loop  
**Complexity**: Medium  
**Dependencies**: None (prerequisite for other specs)  
**Target Codebase**: `letta-code-thoughtbox/.letta/skills/`

## Overview

Create a Letta skill that automatically generates comprehensive test suites for new capabilities added during DGM self-improvement. The skill must handle both TypeScript (Letta Code) and any languages used by Thoughtbox, generating appropriate test frameworks and patterns for each.

## Motivation

**DGM Requirement**: Before accepting any self-modification, the system must validate that:
1. New capability works as intended
2. No regressions introduced
3. Edge cases handled
4. Integration points maintained

**Current Gap**: Letta Code has skills for other purposes, but no automated test generation capability.

## Requirements

### Functional Requirements

#### FR-001: Multi-Language Test Generation
**Priority**: MUST  
**Description**: Generate tests for TypeScript (Bun), JavaScript, and any language Thoughtbox uses

**Acceptance Criteria**:
- [ ] TypeScript: Generate Bun test format
- [ ] Detect testing framework from project (bun:test, vitest, jest, mocha)
- [ ] Generate appropriate imports and setup
- [ ] Handle async/await patterns
- [ ] Support mocking for external dependencies

**Example Input**:
```typescript
// New capability added to Letta Code
// src/tools/impl/ArchitectureAnalysis.ts
export async function analyzeArchitecture(codebase: string): Promise<Analysis> {
  // ... implementation
}
```

**Generated Test**:
```typescript
// src/tests/tools/architecture-analysis.test.ts
import { test, expect } from "bun:test";
import { analyzeArchitecture } from "../../tools/impl/ArchitectureAnalysis";

test("analyzeArchitecture returns valid analysis for simple codebase", async () => {
  const result = await analyzeArchitecture("test-fixtures/simple-api");
  expect(result).toBeDefined();
  expect(result.complexity).toBeGreaterThan(0);
  expect(result.patterns).toBeInstanceOf(Array);
});

test("analyzeArchitecture handles empty codebase", async () => {
  const result = await analyzeArchitecture("test-fixtures/empty");
  expect(result.complexity).toBe(0);
});

test("analyzeArchitecture throws on invalid path", async () => {
  await expect(analyzeArchitecture("/nonexistent")).rejects.toThrow();
});
```

---

#### FR-002: Test Category Coverage
**Priority**: MUST  
**Description**: Generate all appropriate test categories

**Test Categories**:
1. **Unit Tests**: Test function/class in isolation
2. **Integration Tests**: Test with real dependencies
3. **Behavioral Tests**: Natural language expectations (for Thoughtbox)
4. **Regression Tests**: Verify no previous functionality broken
5. **Edge Case Tests**: Boundary conditions, errors, null/undefined

**Acceptance Criteria**:
- [ ] At least 3 unit tests per new function
- [ ] Integration test if new capability uses external services
- [ ] Behavioral test if capability is reasoning-related
- [ ] Regression tests check key existing functionality
- [ ] Edge cases identified via code analysis

---

#### FR-003: Behavioral Test Generation (Thoughtbox)
**Priority**: MUST  
**Description**: Generate natural language behavioral tests for Thoughtbox capabilities

**Format** (following `thoughtbox/tests/*-behavioral.md` pattern):
```markdown
# Behavioral Tests: Architecture Trade-off Analysis

## Test 1: Basic Trade-off Identification

**Setup**: Agent is considering choice between monolith vs microservices

**Action**: Call `mental_models.apply('architecture-tradeoff', { scenario: ... })`

**Expected Behavior**:
- Should identify at least 3 trade-offs
- Should provide pros/cons for each option
- Should make a recommendation with reasoning
- Should not hallucinate trade-offs not mentioned in scenario

**Validation**: Human reviews output for coherence and accuracy

---

## Test 2: Multi-Dimensional Analysis

**Setup**: Complex architectural decision with 5+ factors

**Action**: Apply architecture-tradeoff model with detailed context

**Expected Behavior**:
- Should organize trade-offs by dimension (cost, complexity, maintenance, etc.)
- Should identify interdependencies between trade-offs
- Should surface non-obvious implications
- Reasoning should be explicit and traceable

**Validation**: Compare against expert architectural analysis
```

**Acceptance Criteria**:
- [ ] Behavioral tests follow Thoughtbox conventions
- [ ] Tests are executable via `agentic-test.ts`
- [ ] Tests specify clear expected behavior
- [ ] Tests include validation criteria
- [ ] Tests cover happy path and failure modes

---

#### FR-004: Regression Test Generation
**Priority**: MUST  
**Description**: Automatically identify and test potential regression points

**Strategy**:
```typescript
async function generateRegressionTests(modification: Modification): Promise<Test[]> {
  const regressionTests = [];
  
  // 1. Identify affected files
  const affectedFiles = modification.files;
  
  // 2. Find existing tests for those files
  const existingTests = await findTestsFor(affectedFiles);
  
  // 3. Identify public APIs in modified files
  const publicAPIs = await extractPublicAPIs(affectedFiles);
  
  // 4. Generate regression tests
  for (const api of publicAPIs) {
    regressionTests.push({
      name: `regression: ${api.name} maintains contract`,
      test: `
        // Ensure ${api.name} still works after modification
        const result = await ${api.name}(${api.exampleArgs});
        expect(result).toMatchSnapshot(); // Or specific assertions
      `
    });
  }
  
  return regressionTests;
}
```

**Acceptance Criteria**:
- [ ] All public APIs have regression tests
- [ ] Existing test coverage not reduced
- [ ] Critical user-facing functionality covered
- [ ] Tests fail if behavior changes unexpectedly

---

#### FR-005: Test Fixture Management
**Priority**: SHOULD  
**Description**: Generate and manage test fixtures/mocks

**Acceptance Criteria**:
- [ ] Create realistic test data
- [ ] Generate mocks for external dependencies
- [ ] Reuse fixtures across tests where appropriate
- [ ] Document fixture purpose and scope

**Example**:
```typescript
// Generated fixture
// test-fixtures/sample-codebase/
//   src/
//     index.ts (simple implementation)
//   package.json
//   README.md

// Generated mock
// test-fixtures/mocks/thoughtbox-client.ts
export const mockThoughtboxClient = {
  call: jest.fn().mockResolvedValue({ result: "..." }),
  connect: jest.fn(),
  disconnect: jest.fn()
};
```

---

### Non-Functional Requirements

#### NFR-001: Test Quality
- Tests must be deterministic (no flaky tests)
- Test names describe what is tested
- Assertions are specific (not just "truthy")
- Tests fail with clear error messages

#### NFR-002: Coverage
- New code must have >80% test coverage
- Critical paths must have 100% coverage
- All error paths tested

#### NFR-003: Performance
- Test generation: <30 seconds per capability
- Test execution: <5 seconds for unit tests, <30s for integration

---

## Skill Implementation

### Skill Structure

```
.letta/skills/test-generator/
├── SKILL.md                 # Skill documentation
├── scripts/
│   ├── generate-tests.ts   # Main generation logic
│   ├── analyze-code.ts     # Parse code to understand structure
│   ├── identify-cases.ts   # Identify test cases
│   └── template-engine.ts  # Fill test templates
├── templates/
│   ├── bun-unit-test.ts    # Template for Bun tests
│   ├── behavioral-test.md  # Template for behavioral tests
│   ├── integration-test.ts # Template for integration tests
│   └── regression-test.ts  # Template for regression tests
└── examples/
    └── sample-generation.md
```

### Skill Interface

```typescript
// SKILL.md usage section
interface TestGeneratorInput {
  modification: {
    target: 'letta-code' | 'thoughtbox';
    files: string[];
    description: string;
    newFunctions: string[];      // Extracted function signatures
    newClasses: string[];        // Extracted class signatures
  };
  options?: {
    testTypes: ('unit' | 'integration' | 'behavioral' | 'regression')[];
    coverageTarget: number;      // 0.8 = 80%
    generateFixtures: boolean;
  };
}

interface TestGeneratorOutput {
  tests: {
    path: string;               // Where to save test file
    content: string;            // Test file content
    type: 'unit' | 'integration' | 'behavioral' | 'regression';
    coverage: number;           // Estimated coverage
  }[];
  fixtures: {
    path: string;
    content: string;
  }[];
  summary: {
    testsGenerated: number;
    estimatedCoverage: number;
    recommendations: string[];
  };
}
```

### Invocation

```typescript
// In DGM improvement loop
const testGenResult = await agent.useSkill('test-generator', {
  modification: {
    target: 'thoughtbox',
    files: ['src/mental-models/contents/architecture-tradeoff.ts'],
    description: 'Add mental model for architectural trade-off analysis',
    newFunctions: ['analyzeTradeoffs'],
    newClasses: []
  },
  options: {
    testTypes: ['unit', 'behavioral', 'regression'],
    coverageTarget: 0.85,
    generateFixtures: true
  }
});

// Write generated tests
for (const test of testGenResult.tests) {
  await fs.writeFile(test.path, test.content);
}
```

---

## Test Generation Logic

### Step 1: Code Analysis
```typescript
async function analyzeCode(files: string[]): Promise<CodeStructure> {
  // Parse AST to extract:
  // - Function signatures
  // - Class definitions
  // - Import dependencies
  // - Type definitions
  // - Existing tests (to avoid duplication)
  
  return {
    functions: [...],
    classes: [...],
    dependencies: [...],
    types: [...]
  };
}
```

### Step 2: Test Case Identification
```typescript
async function identifyTestCases(structure: CodeStructure): Promise<TestCase[]> {
  const cases = [];
  
  for (const fn of structure.functions) {
    // Happy path
    cases.push({ type: 'happy', fn, scenario: 'valid input' });
    
    // Edge cases (from parameter types)
    if (fn.params.includes('string')) {
      cases.push({ type: 'edge', fn, scenario: 'empty string' });
    }
    if (fn.params.includes('array')) {
      cases.push({ type: 'edge', fn, scenario: 'empty array' });
    }
    
    // Error cases
    if (fn.canThrow || fn.returns.includes('Promise')) {
      cases.push({ type: 'error', fn, scenario: 'invalid input' });
    }
  }
  
  return cases;
}
```

### Step 3: Template Application
```typescript
async function generateTest(testCase: TestCase, template: Template): Promise<string> {
  // Fill template with test case data
  return template.render({
    functionName: testCase.fn.name,
    testName: `${testCase.fn.name} ${testCase.scenario}`,
    setup: generateSetup(testCase),
    action: generateAction(testCase),
    assertions: generateAssertions(testCase)
  });
}
```

---

## Integration with DGM Loop

```typescript
// In dgm-improvement-loop.ts
async function implementModification(proposal: Proposal): Promise<Implementation> {
  // 1. Implement the capability
  const impl = await agent.implement(proposal);
  
  // 2. Generate tests automatically
  const tests = await agent.useSkill('test-generator', {
    modification: impl
  });
  
  // 3. Write test files
  for (const test of tests.tests) {
    await fs.writeFile(test.path, test.content);
  }
  
  // 4. Run tests
  const results = await runTests(impl.target);
  
  // 5. Accept/reject based on results
  return { impl, tests, results };
}
```

---

## Success Criteria

- [ ] Skill generates valid, executable tests
- [ ] Tests follow project conventions (Bun for Letta, vitest for Thoughtbox)
- [ ] Generated tests pass for valid implementations
- [ ] Generated tests fail for buggy implementations
- [ ] Behavioral tests work with `agentic-test.ts`
- [ ] Test generation time <30 seconds
- [ ] Achieves >80% coverage target
- [ ] Zero manual test writing required for DGM loop

---

## References

- [DGM Paper - Test Validation](https://arxiv.org/pdf/2505.22954) - Section 4.2
- [Thoughtbox Agentic Tests](../../thoughtbox/scripts/agentic-test.ts)
- [Letta Code Test Examples](../../letta-code-thoughtbox/src/tests/)
- [Skill Creator Skill](../../.letta/skills/skill-creator/)

---

**Previous**: [SPEC-DGM-002: Archive System](./SPEC-DGM-002-dgm-archive-system.md)  
**Next**: [SPEC-DGM-003: Reflection Sessions](./SPEC-DGM-003-reflection-session-system.md)
