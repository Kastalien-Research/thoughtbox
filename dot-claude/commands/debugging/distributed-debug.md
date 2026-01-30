# Distributed Debug

Debug distributed systems with trace correlation, timing analysis, and cross-service state reconstruction.

## Command Structure

```bash
/distributed-debug "<issue_description>" [--services=<services>] [--trace-id=<trace_id>] [--time-window=<window>] [--correlation=<type>]
```

## Parameters

- `issue_description`: Description of the distributed system issue
- `services`: Comma-separated list of services to analyze
- `trace_id`: Specific trace ID to analyze (if available)
- `time-window`: Time window for correlation analysis (e.g., "15m", "1h")
- `correlation`: Correlation type (timing, causation, dependency, flow)

## Debugging Approach

### Service Topology Analysis
- Map service dependencies and communication patterns
- Identify critical paths and bottlenecks
- Analyze service health and resource utilization
- Document inter-service contracts and protocols

### Trace Correlation
- Correlate traces across service boundaries
- Reconstruct distributed transaction flows
- Identify timing anomalies and delays
- Track request propagation and transformations

### Cross-Service State Reconstruction
- Reconstruct global state from distributed components
- Identify state consistency issues
- Analyze state synchronization patterns
- Document state flow and transformations

### Timing Analysis
- Measure end-to-end latency components
- Identify timing dependencies and constraints
- Analyze concurrency and parallelism patterns
- Detect race conditions and deadlocks

## Distributed Debugging Strategies

### Service Isolation
- Test each service independently
- Mock external dependencies
- Isolate problematic components
- Validate service contracts

### End-to-End Tracing
- Follow requests through entire system
- Correlate logs across services
- Reconstruct transaction timelines
- Identify failure points

### Cascade Analysis
- Identify how failures propagate
- Analyze retry and circuit breaker patterns
- Understand timeout and error handling
- Map failure recovery mechanisms

### Load and Performance Analysis
- Analyze system behavior under load
- Identify scalability bottlenecks
- Test failure scenarios
- Validate resource limits

## Integration with Other Commands

```bash
# Analyze system architecture first
/knowledge-graph "distributed-system" --depth=3
/distributed-debug "Service mesh communication failures"

# Use time machine for historical analysis
/time-machine "service-logs" --point-in-time="incident-start"
/distributed-debug "Cascading failure analysis" --time-window="30m"

# Combine with systematic debugging
/systematic-debug "Distributed transaction failures" --context=distributed
/distributed-debug "Cross-service state inconsistencies" --correlation=causation
```

## Debugging Tools and Techniques

### Observability Stack
- Distributed tracing (Jaeger, Zipkin)
- Metrics collection (Prometheus, Grafana)
- Log aggregation (ELK Stack, Splunk)
- Service mesh monitoring (Istio, Linkerd)

### Analysis Techniques
- Correlation analysis across services
- Timing analysis and latency breakdown
- Error propagation mapping
- Resource utilization analysis

### Testing Strategies
- Chaos engineering experiments
- Load testing with realistic scenarios
- Failure injection testing
- Network partition simulation

## Output Artifacts

### Distributed Debug Report
- Service topology and dependency map
- Trace correlation analysis results
- Cross-service state reconstruction
- Timing analysis and bottleneck identification
- Root cause analysis and recommendations

### Monitoring Setup
- Distributed tracing configuration
- Custom metrics and dashboards
- Alert rules and thresholds
- Log correlation patterns

### Test Scenarios
- Chaos engineering test cases
- Load testing configurations
- Failure simulation scripts
- Recovery validation tests

## Common Distributed System Issues

### Network Partitions
- Service isolation scenarios
- Split-brain conditions
- Consensus failures
- Data consistency issues

### Service Dependencies
- Circular dependency issues
- Cascade failure patterns
- Timeout and retry storms
- Circuit breaker failures

### Data Consistency
- Eventual consistency issues
- Distributed transaction problems
- Race conditions across services
- State synchronization failures

### Performance Issues
- Cross-service latency accumulation
- Resource contention between services
- Inefficient communication patterns
- Scalability bottlenecks

## Best Practices

1. **Comprehensive Instrumentation**: Ensure all services have proper tracing
2. **Correlation Standards**: Use consistent correlation IDs across services
3. **Timeout Strategies**: Implement proper timeout and retry mechanisms
4. **Failure Isolation**: Design for graceful degradation
5. **Testing Resilience**: Regularly test failure scenarios

## Example Usage

```bash
# Debug cross-service communication issue
/distributed-debug "API gateway timeout errors" --services="gateway,auth,orders"

# Analyze specific trace
/distributed-debug "Transaction processing failure" --trace-id="abc123" --correlation=timing

# Investigate cascading failure
/distributed-debug "Service mesh instability" --time-window="1h" --correlation=causation

# Debug data consistency issue
/distributed-debug "Order state inconsistencies" --services="orders,inventory,payment" --correlation=flow
```

## Success Metrics

- Time to identify root cause in distributed context
- Accuracy of cross-service correlation
- Effectiveness of timing analysis
- Quality of state reconstruction
- Prevention of similar distributed issues

## Learning Integration

The distributed-debug command builds expertise in:
- Common distributed system failure patterns
- Effective correlation techniques
- Service architecture best practices
- Monitoring and observability strategies
- Team debugging workflows for distributed systems