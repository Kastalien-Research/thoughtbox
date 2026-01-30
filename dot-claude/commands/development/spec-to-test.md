# Spec to Test Generator

Convert specifications into comprehensive test suites with multiple testing strategies.

## Variables

SPEC_FILE: $ARGUMENTS
TEST_STRATEGIES: ["unit", "integration", "property", "fuzzing"]

## Execute

1. READ specification document
2. EXTRACT testable requirements
3. RESEARCH similar test patterns (GitHub/mem0)
4. GENERATE test suites for each strategy
5. CREATE test data generators
6. ADD edge cases from experience

## Test Strategies

### Unit Tests

- Isolated function testing
- Mock all dependencies
- Fast execution
- High coverage

### Integration Tests

- Real dependencies
- End-to-end flows
- Database/API testing
- Slower but realistic

### Property-Based Tests

- Generate random inputs
- Test invariants
- Find edge cases automatically
- Catch unexpected bugs

### Fuzzing

- Malformed inputs
- Security testing
- Stress testing
- Chaos engineering

## Special Features

1. **Remembers past bugs**: Searches mem0 for similar features and their bugs
2. **Cross-references**: Finds tests in other projects via GitHub
3. **Generates fixtures**: Creates realistic test data
4. **Performance benchmarks**: Adds performance tests automatically
5. **Accessibility tests**: For UI components

## Example

```
/spec-to-test "packages/evals/specs/OTel/opentelemetry-integration-plan.md"

Generates:
- Unit tests for each component
- Integration test for full pipeline
- Property tests for span processors
- Fuzz tests for malformed traces
- Performance benchmarks
- Race condition tests
```

## Advanced Options

```
/spec-to-test spec.md --coverage-target=95 --include-benchmarks --mutation-testing
```
