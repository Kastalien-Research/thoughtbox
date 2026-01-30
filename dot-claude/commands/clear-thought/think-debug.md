# Think-Debug

Systematic debugging using proven approaches, systems thinking, scientific method, and sequential documentation.

## Usage
```
/think-debug <issue description>
```

## Variables
- `ISSUE`: $ARGUMENTS (the bug or problem to debug)
- `DEBUG_APPROACH`: "auto" (automatically select best approach)
- `MAX_DEPTH`: 5 (maximum investigation depth)
- `HYPOTHESIS_LIMIT`: 3 (concurrent hypotheses to test)
- `TIME_LIMIT`: 30 (minutes before switching strategies)

## Phase 1: Initial Debugging Approach

### Agent: Debug Strategist
Select and apply appropriate debugging approach:

```mcp
# Analyze issue to select approach
mcp__clear-thought__sequentialthinking({
  "thought": "Analyzing issue characteristics: $ISSUE",
  "thoughtNumber": 1,
  "totalThoughts": 3,
  "nextThoughtNeeded": true,
  "needsMoreThoughts": false
})

# Apply selected approach
mcp__clear-thought__debuggingapproach({
  "approachName": "root_cause_analysis",  # or binary_search, divide_conquer, etc.
  "issue": "$ISSUE",
  "steps": [
    "Reproduce the issue",
    "Identify symptoms vs root cause",
    "Trace execution path",
    "Isolate failing component"
  ],
  "findings": "",
  "resolution": ""
})
```

Available approaches:
- `binary_search` - For issues in ordered sequences
- `root_cause_analysis` - For complex system failures
- `divide_conquer` - For large codebases
- `delta_debugging` - For regression issues
- `rubber_duck` - For logic errors
- `log_analysis` - For production issues

## Phase 2: Systems Context Analysis

### Agent: Systems Debugger
```mcp
mcp__clear-thought__systemsthinking({
  "system": "System containing issue: $ISSUE",
  "components": ["identify all interacting parts"],
  "relationships": [
    {"from": "component1", "to": "component2", "type": "data_flow"},
    {"from": "component2", "to": "component3", "type": "dependency"}
  ],
  "feedbackLoops": [
    {
      "components": ["error_source", "error_propagation"],
      "type": "positive",
      "description": "How error amplifies"
    }
  ],
  "emergentProperties": ["unexpected behaviors"],
  "leveragePoints": ["where to intervene"],
  "sessionId": "debug-systems-$TIMESTAMP",
  "iteration": 1,
  "nextAnalysisNeeded": true
})
```

## Phase 3: Hypothesis Testing

### Agent: Scientific Debugger
```mcp
# Form hypotheses
mcp__clear-thought__scientificmethod({
  "stage": "hypothesis",
  "inquiryId": "debug-$TIMESTAMP",
  "iteration": 1,
  "nextStageNeeded": true,
  "observation": "Issue manifests as: $ISSUE",
  "question": "What causes this behavior?",
  "hypothesis": {
    "statement": "The issue is caused by...",
    "variables": [
      {"name": "error_condition", "type": "independent"},
      {"name": "failure_mode", "type": "dependent"}
    ],
    "assumptions": ["system state", "input conditions"],
    "hypothesisId": "debug-hyp-1",
    "confidence": 0.6,
    "domain": "debugging",
    "iteration": 1,
    "status": "proposed"
  }
})

# Design and run experiments
mcp__clear-thought__scientificmethod({
  "stage": "experiment",
  "inquiryId": "debug-$TIMESTAMP",
  "iteration": 2,
  "nextStageNeeded": true,
  "experiment": {
    "design": "Controlled test to verify hypothesis",
    "methodology": "Isolate variables and test",
    "predictions": [
      {"if": "hypothesis correct", "then": "behavior X"},
      {"if": "hypothesis wrong", "then": "behavior Y"}
    ],
    "experimentId": "exp-1",
    "hypothesisId": "debug-hyp-1",
    "controlMeasures": ["consistent environment", "same inputs"]
  }
})
```

## Phase 4: Solution Documentation

### Agent: Debug Documenter
```mcp
mcp__clear-thought__sequentialthinking({
  "thought": "Documenting debugging process and solution",
  "thoughtNumber": 1,
  "totalThoughts": 4,
  "nextThoughtNeeded": true,
  "needsMoreThoughts": true
})
```

Document:
1. Root cause identification
2. Step-by-step reproduction
3. Solution implementation
4. Prevention strategies

## Phase 5: Solution Validation

### Agent: Quality Validator
```mcp
mcp__clear-thought__structuredargumentation({
  "claim": "The issue is resolved by [solution]",
  "premises": [
    "Root cause identified as [cause]",
    "Experiments confirmed hypothesis",
    "Fix addresses the root cause",
    "Tests verify resolution"
  ],
  "conclusion": "Issue resolved with confidence",
  "argumentType": "deductive",
  "confidence": 0.95,
  "nextArgumentNeeded": false
})
```

## Memory Storage

```mcp
mcp__mem0__mem0_memory({
  "operation": "add",
  "messages": [{
    "role": "assistant",
    "content": "Issue: $ISSUE\nRoot Cause: [identified cause]\nSolution: [fix applied]\nPrevention: [future safeguards]\nDebugging Pattern: [approach used]"
  }],
  "user_id": "clear-thought",
  "metadata": {
    "type": "debug-solution",
    "command": "think-debug",
    "approach": "[selected approach]",
    "timestamp": "$TIMESTAMP"
  }
})
```

## Output Format

```markdown
# Debug Report: $ISSUE

## 🔍 Issue Analysis
**Symptoms**: [what user sees]
**Root Cause**: [actual problem]
**Affected Components**: [system parts]

## 🔬 Investigation Process

### Approach: [Selected Method]
1. [Step 1 with findings]
2. [Step 2 with findings]
3. [Step 3 with findings]

### System Analysis
```
[Component A] --data--> [Component B]
      |                      |
      v                      v
[Component C] <--error-- [Component D]
```

### Hypotheses Tested
1. ❌ **Hypothesis 1**: [description]
   - Test: [what was done]
   - Result: [why rejected]

2. ✅ **Hypothesis 2**: [description]
   - Test: [what was done]
   - Result: [confirmed]

## 💡 Solution

### The Fix
```code
[Code changes or configuration]
```

### Why It Works
[Explanation of how fix addresses root cause]

## 🛡️ Prevention

### Immediate Actions
- [ ] Add test case for this scenario
- [ ] Update error handling
- [ ] Add monitoring/logging

### Long-term Improvements
- [ ] Refactor vulnerable component
- [ ] Improve system resilience
- [ ] Document edge cases

## 📊 Debug Metrics
- **Time to Identify**: [duration]
- **Hypotheses Tested**: [count]
- **Components Examined**: [count]
- **Confidence Level**: [score]/1.0

## 🔄 Similar Issues
[Related problems in memory that might help]
```

## Integration Points

- Chain with `/code-fix` to implement solution
- Use `/test-generate` to create test cases
- Apply `/think-solve` for complex fixes
- Connect to `/monitor-setup` for future detection
- Export to `/postmortem` for team learning

## Debug Strategies

### When to Use Each Approach
- **Binary Search**: Error occurs in specific range/sequence
- **Root Cause**: Complex system interactions
- **Divide & Conquer**: Large codebase, unknown location
- **Delta Debugging**: Recent change caused issue
- **Rubber Duck**: Logic or algorithm errors
- **Log Analysis**: Production issues with logs available

## Example

```
/think-debug Users report intermittent 500 errors when submitting forms, but only during peak hours
```

This would:
1. Select root cause analysis approach
2. Map system components (form handler, validator, database, cache)
3. Form hypotheses (rate limiting, connection pool, race condition)
4. Test each hypothesis systematically
5. Document solution and prevention measures