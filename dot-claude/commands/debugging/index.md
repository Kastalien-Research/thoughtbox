# Debugging Commands

Systematic debugging approaches for complex systems and distributed architectures.

## Available Commands

### [systematic-debug](./systematic-debug.md) _(Coming Soon)_

Multi-phase debugging approach combining instrumentation, hypothesis testing, and systematic elimination.

### [distributed-debug](./distributed-debug.md) _(Coming Soon)_

Debug distributed systems with trace correlation, timing analysis, and cross-service state reconstruction.

### [temporal-debug](./temporal-debug.md) _(Coming Soon)_

Debug time-sensitive issues using historical data, timing analysis, and state machine reconstruction.

## Debugging Philosophy

### Systematic Approach

- Reproduce reliably
- Isolate variables
- Test hypotheses
- Document findings
- Verify solutions

### Instrumentation Strategy

- Strategic logging placement
- Performance measurements
- State capture points
- Error boundaries
- Trace correlation

### Root Cause Analysis

- Work backwards from symptoms
- Eliminate possible causes systematically
- Understand underlying mechanisms
- Prevent similar issues

## Integration with Existing Tools

### With Analysis Commands

```bash
# Analyze then debug
/time-machine "problematic-component" --point-in-time "before-issue"
/systematic-debug "component regression analysis"
```

### With MCP Orchestration

```bash
# Distributed debugging
/mcp-orchestrate debug-distributed-system.md
```

## Best Practices

1. **Reproduce First**: Always establish reliable reproduction
2. **Instrument Strategically**: Add debugging without changing behavior
3. **Document Everything**: Capture all findings and hypotheses
4. **Think in Systems**: Consider interactions and dependencies
5. **Test Fixes Thoroughly**: Verify solutions don't introduce new issues
