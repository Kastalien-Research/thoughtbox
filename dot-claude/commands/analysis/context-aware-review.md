# Context-Aware Code Review

Performs intelligent code review using memory of past patterns and preferences.

## Variables

FILE_PATTERN: $ARGUMENTS

## Execute

1. SEARCH mem0 for relevant coding patterns and past review feedback
2. ANALYZE current code against remembered patterns
3. CHECK for violations of previously established preferences
4. GENERATE review comments with historical context

## Features

- Remembers and applies team coding standards over time
- Learns from past review feedback
- Suggests improvements based on successful patterns
- Tracks evolution of coding practices

## Example

```
/context-aware-review "src/**/*.ts"

Output:
- "This pattern violates the error handling approach we established in PR #123"
- "Consider using the Observer pattern here, similar to our implementation in the MCP module"
- "This naming convention differs from what we agreed on 2024-12-15"
```
