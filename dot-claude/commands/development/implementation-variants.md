# Implementation Variants Generator

Generate multiple implementation approaches for the same feature using different patterns.

## Variables

FEATURE_DESCRIPTION: $ARGUMENTS
VARIANT_COUNT: $ARGUMENTS

## Execute

For each variant:

1. RECALL relevant patterns from mem0
2. RESEARCH different architectural approaches via web/GitHub
3. GENERATE implementation using distinct patterns
4. COMPARE trade-offs between approaches

## Variants to Generate

1. **Functional Approach** - Pure functions, immutability, composition
2. **OOP Approach** - Classes, inheritance, encapsulation
3. **Event-Driven** - Pub/sub, event emitters, reactive patterns
4. **State Machine** - Explicit states and transitions
5. **Actor Model** - Message passing, isolated actors

## Output Format

Creates a comparison table:

- Implementation complexity
- Performance characteristics
- Testability score
- Maintainability assessment
- Team familiarity (from mem0 history)

## Example

```
/implementation-variants "Add retry logic to MCP calls"

Generates:
- Exponential backoff with promises
- Retry decorator pattern
- Event-driven retry queue
- State machine implementation
```
