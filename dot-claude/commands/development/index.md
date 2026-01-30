# Development Commands

Commands for generating code, tests, and implementation variants.

## Available Commands

### [implementation-variants](./implementation-variants.md)

Generate multiple implementation approaches for the same feature using different patterns.

### [spec-to-test](./spec-to-test.md)

Convert specifications into comprehensive test suites with multiple testing strategies.

## Use Cases

### Implementation Generation

- Explore different architectural approaches
- Compare trade-offs between solutions
- Generate boilerplate with best practices
- Create pattern-based implementations

### Test Generation

- Convert specs to test suites
- Generate property-based tests
- Create fuzz tests for security
- Add performance benchmarks

### Code Generation Strategies

#### Functional Approach

- Pure functions
- Immutability
- Composition over inheritance

#### Object-Oriented Approach

- Classes and interfaces
- SOLID principles
- Design patterns

#### Event-Driven Approach

- Event emitters
- Pub/sub patterns
- Reactive programming

## Example Usage

```bash
# Generate implementation variants
/implementation-variants "Add retry logic to API calls"

# Generate comprehensive tests
/spec-to-test "specs/feature.md" --coverage=95

# Create boilerplate
/implementation-variants "CRUD service for users" --patterns="repository,dto"
```

## Best Practices

1. Always generate tests alongside implementations
2. Consider multiple approaches before choosing
3. Use historical patterns from mem0
4. Benchmark performance-critical code
5. Include error handling and edge cases
