# Ulysses Protocol

High-stakes debugging and problem-solving framework that prevents endless iteration cycles while maintaining quality through systematic phases and decision gates.

## Variables

PROBLEM_STATEMENT: $ARGUMENTS
ITERATION_LIMIT: 3
CONFIDENCE_THRESHOLD: 0.8
STAKES: "low" | "medium" | "high" | "critical"
COMMENTS: $ARGUMENTS

## Protocol Phases

### Phase 1: Reconnaissance (Time-boxed: 25% of budget)

```
OBJECTIVE: Understand the problem space completely

=> research_agent: Gather all available context
=> analysis_agent: Map system state and dependencies
=> time_machine: Historical context and decisions
=> knowledge_graph: Visualize relationships

GATE: Can we clearly define the problem?
- [ ] Problem statement is specific and measurable
- [ ] Root cause hypotheses are formed
- [ ] Success criteria are defined
- [ ] Risk assessment is complete

If GATE fails: Escalate or change approach
```

### Phase 2: Strategic Planning (Time-boxed: 15% of budget)

```
OBJECTIVE: Design solution approach with multiple contingencies

-> implementation_variants: Generate 3 solution approaches
-> swarm_intelligence: Evaluate approaches across dimensions
-> pattern_synthesizer: Learn from similar problems

DECISION MATRIX:
- Implementation complexity
- Risk of unintended consequences
- Resource requirements
- Probability of success
- Rollback difficulty

GATE: Do we have a viable plan?
- [ ] Primary approach selected with high confidence
- [ ] Backup approaches identified
- [ ] Risk mitigation strategies in place
- [ ] Success metrics defined

If GATE fails: Return to reconnaissance or escalate
```

### Phase 3: Controlled Implementation (Time-boxed: 45% of budget)

```
OBJECTIVE: Execute solution with continuous validation

For each iteration (max 3):
  -> Implement smallest testable change
  -> Validate against success criteria
  -> Assess unintended consequences
  -> Document findings

  ITERATION_GATE:
  - [ ] Progress toward objective
  - [ ] No regression introduced
  - [ ] Within quality thresholds
  - [ ] Learning captured

  If ITERATION_GATE fails:
    - Try backup approach
    - Reduce scope
    - Escalate if at iteration limit

PHASE_GATE: Is solution working?
- [ ] Primary objectives met
- [ ] No critical regressions
- [ ] Quality maintained
- [ ] Monitoring in place

If PHASE_GATE fails: Activate contingency plan
```

### Phase 4: Validation & Documentation (Time-boxed: 15% of budget)

```
OBJECTIVE: Ensure solution is robust and knowledge is captured

-> systematic_debug: Comprehensive testing
-> evolution_tracker: Update historical context
-> pattern_synthesizer: Extract reusable patterns
-> mem0: Store decision rationale and lessons

FINAL_GATE: Is solution production-ready?
- [ ] All tests passing
- [ ] Performance verified
- [ ] Documentation updated
- [ ] Monitoring configured
- [ ] Rollback plan tested

If FINAL_GATE fails: Return to implementation or accept partial solution
```

## Decision Framework

### When to Continue vs. Stop

**Continue if:**

- Clear progress toward objectives
- No critical system damage
- Within iteration/time budget
- Learning is occurring

**Stop and Escalate if:**

- No progress after 2 iterations
- Critical system damage risk
- Problem scope expanding uncontrollably
- Stakes exceed available resources

**Accept Partial Solution if:**

- Core objective achieved (even if incomplete)
- Further iteration has diminishing returns
- Business/time constraints require it
- Sufficient foundation for future work

### Escalation Triggers

**Technical Escalation:**

- Problem requires expertise outside team
- Infrastructure/architectural changes needed
- Cross-team coordination required

**Management Escalation:**

- Resource constraints preventing solution
- Business priority conflicts
- Risk exceeds acceptable thresholds

## Quality Gates

### Code Quality

- No new linting errors
- Test coverage maintained
- Performance within bounds
- Security review passed

### System Quality

- No service degradation
- Error rates within limits
- Monitoring alerts clear
- Dependency health good

### Process Quality

- Documentation updated
- Knowledge captured in mem0
- Rollback procedures tested
- Team informed of changes

## Example Usage

```bash
/ulysses-protocol "Fix MCP telemetry integration causing agent workflow completion issues"

Stakes: HIGH (affects core product functionality)
Budget: 2 days
Iteration Limit: 3

Phase 1 (Reconnaissance - 4 hours):
- Historical analysis of MCP integration
- Current system state mapping
- Problem reproduction verification
- Risk assessment

Phase 2 (Planning - 2 hours):
- Multiple fix approaches identified
- Risk vs benefit analysis
- Rollback strategy defined

Phase 3 (Implementation - 12 hours):
- Iteration 1: Minimal fix attempt
- Iteration 2: Comprehensive approach
- Iteration 3: Fallback solution

Phase 4 (Validation - 2 hours):
- Full regression testing
- Performance validation
- Documentation updates
```

## Anti-Patterns to Avoid

### The Endless Debugging Spiral

- No clear success criteria
- No time limits
- No learning capture
- No escalation triggers

### The Silver Bullet Fallacy

- Assuming one approach will work
- No backup plans
- Over-engineering solutions
- Ignoring constraints

### The Hero Pattern

- One person solving everything
- No knowledge sharing
- No systematic approach
- No process improvement

## Meta-Learning

The Ulysses Protocol learns from each application:

- Refine gate criteria based on outcomes
- Improve estimation accuracy
- Better risk assessment
- Enhanced escalation triggers

This creates a feedback loop where the protocol becomes more effective at preventing unproductive work while maintaining solution quality.

## Integration with Other Commands

```bash
# Research phase
/time-machine "problematic-component"
/knowledge-graph "system-architecture"

# Planning phase
/implementation-variants "potential solutions"
/swarm-intelligence "evaluate solution approaches"

# Implementation phase
/parallel-explorer "test multiple approaches"
/systematic-debug "validate each iteration"

# Validation phase
/pattern-synthesizer "extract learnings"
/context-aware-review "final quality check"
```

The Ulysses Protocol transforms debugging from reactive struggle into systematic problem-solving that builds organizational capability over time.
