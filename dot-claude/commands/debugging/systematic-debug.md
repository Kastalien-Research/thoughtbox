# Systematic Debug

Multi-phase debugging approach combining instrumentation, hypothesis testing, and systematic elimination for complex problems.

## Command Structure

```bash
/systematic-debug "<issue_description>" [--phase=<phase>] [--strategy=<strategy>] [--context=<context>]
```

## Parameters

- `issue_description`: Clear description of the problem being debugged
- `phase`: Specific phase to execute (reproduce, instrument, hypothesize, test, verify)
- `strategy`: Debugging strategy (binary-search, divide-conquer, backtrack, eliminate)
- `context`: Additional context (production, staging, local, historical)

## Phases

### Phase 1: Reproduction
- Establish reliable reproduction steps
- Document environment conditions
- Capture initial state and expected behavior
- Create minimal test case

### Phase 2: Instrumentation
- Add strategic logging and monitoring
- Implement state capture points
- Set up performance measurements
- Create debug trace boundaries

### Phase 3: Hypothesis Formation
- Analyze symptoms and patterns
- Form testable hypotheses
- Prioritize by likelihood and impact
- Document assumptions and dependencies

### Phase 4: Systematic Testing
- Test each hypothesis methodically
- Eliminate possibilities systematically
- Collect evidence for root cause
- Validate findings with additional tests

### Phase 5: Verification
- Implement solution
- Verify fix resolves issue
- Confirm no regressions introduced
- Document solution and learnings

## Debugging Strategies

### Binary Search
- Divide problem space in half
- Test mid-points to isolate issues
- Recursively narrow down location
- Efficient for linear problems

### Divide and Conquer
- Break complex system into components
- Test each component independently
- Identify failing subsystems
- Recursively debug components

### Backtracking
- Start from known good state
- Trace forward through changes
- Identify where problem was introduced
- Validate each step in sequence

### Systematic Elimination
- List all possible causes
- Test and eliminate each systematically
- Use process of elimination
- Document ruled-out possibilities

## Integration with Analysis Commands

```bash
# Analyze system state before debugging
/time-machine "src/problem-area" --point-in-time="before-issue"
/systematic-debug "Performance regression in API responses"

# Use knowledge graph to understand relationships
/knowledge-graph "failing-component" --depth=2
/systematic-debug "Component interaction failure" --context=dependencies
```

## Output Artifacts

### Debug Report
- Problem statement and reproduction steps
- Instrumentation strategy and results
- Hypothesis formation and testing
- Root cause analysis and solution
- Verification results and learnings

### Instrumentation Code
- Logging and monitoring additions
- State capture mechanisms
- Performance measurement tools
- Debug trace utilities

### Test Cases
- Reproduction test cases
- Hypothesis validation tests
- Regression prevention tests
- Performance benchmarks

## Best Practices

1. **Document Everything**: Capture all findings, hypotheses, and decisions
2. **Test Incrementally**: Small, focused tests are more effective
3. **Preserve Evidence**: Keep debug artifacts for future reference
4. **Think Systematically**: Follow the phases and strategies consistently
5. **Verify Thoroughly**: Ensure solutions actually fix the problem

## Example Usage

```bash
# Start systematic debugging process
/systematic-debug "API timeout errors in production"

# Focus on specific phase
/systematic-debug "Memory leak in worker process" --phase=instrument

# Use specific strategy
/systematic-debug "Race condition in concurrent updates" --strategy=binary-search

# Include context
/systematic-debug "Authentication failures" --context=production --strategy=eliminate
```

## Success Metrics

- Time to identify root cause
- Accuracy of hypothesis formation
- Completeness of solution
- Prevention of similar issues
- Quality of documentation

## Learning Integration

The systematic-debug command learns from each debugging session:
- Successful hypothesis patterns
- Effective instrumentation strategies
- Common root cause categories
- Best practices for specific problem types
- Team debugging preferences and standards