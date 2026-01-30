# Think-Research

Deep research using Socratic questioning, scientific method, mental models, and metacognitive monitoring for comprehensive understanding.

## Usage
```
/think-research <topic or question>
```

## Variables
- `TOPIC`: $ARGUMENTS (research topic or question)
- `RESEARCH_DEPTH`: "standard" (quick/standard/exhaustive)
- `HYPOTHESIS_COUNT`: 3 (parallel hypotheses to explore)
- `SOURCE_DIVERSITY`: 5 (different perspectives to include)
- `CONFIDENCE_TARGET`: 0.85 (minimum confidence for conclusions)

## Phase 1: Socratic Exploration

### Agent: Research Questioner
```mcp
mcp__clear-thought__socraticmethod({
  "claim": "Initial understanding of: $TOPIC",
  "premises": ["What we think we know"],
  "conclusion": "",
  "question": "What do we really mean by $TOPIC?",
  "stage": "clarification",
  "argumentType": "inductive",
  "confidence": 0.3,
  "sessionId": "research-socratic-$TIMESTAMP",
  "iteration": 1,
  "nextArgumentNeeded": true
})
```

Progress through Socratic stages:
1. **Clarification**: Define terms and scope
2. **Assumptions**: Uncover hidden beliefs
3. **Evidence**: Examine support for claims
4. **Perspectives**: Consider alternative views
5. **Implications**: Explore consequences
6. **Questions**: Identify what remains unknown

## Phase 2: Hypothesis Formation

### Agent: Hypothesis Generator
Based on Socratic insights, form research hypotheses:

```mcp
mcp__clear-thought__scientificmethod({
  "stage": "hypothesis",
  "inquiryId": "research-$TIMESTAMP",
  "iteration": 1,
  "nextStageNeeded": true,
  "observation": "From Socratic exploration...",
  "question": "Core research question about $TOPIC",
  "hypothesis": {
    "statement": "Hypothesis 1 about $TOPIC",
    "variables": [
      {"name": "key_factor", "type": "independent"},
      {"name": "outcome", "type": "dependent"}
    ],
    "assumptions": ["underlying beliefs"],
    "hypothesisId": "research-hyp-1",
    "confidence": 0.5,
    "domain": "$TOPIC domain",
    "iteration": 1,
    "status": "proposed"
  }
})
```

Generate multiple competing hypotheses for parallel investigation.

## Phase 3: Research Design & Execution

### Agent: Research Executor
```mcp
mcp__clear-thought__scientificmethod({
  "stage": "experiment",
  "inquiryId": "research-$TIMESTAMP",
  "iteration": 2,
  "nextStageNeeded": true,
  "experiment": {
    "design": "Research methodology for $TOPIC",
    "methodology": "Literature review, data analysis, expert consultation",
    "predictions": [
      {"if": "hypothesis 1 true", "then": "expect finding X"},
      {"if": "hypothesis 2 true", "then": "expect finding Y"}
    ],
    "experimentId": "research-exp-1",
    "hypothesisId": "research-hyp-1",
    "controlMeasures": ["bias mitigation", "source verification"]
  }
})
```

## Phase 4: Mental Model Application

### Agent: Framework Analyst
Apply relevant mental models to research findings:

```mcp
# First Principles
mcp__clear-thought__mentalmodel({
  "modelName": "first_principles",
  "problem": "Understanding $TOPIC at fundamental level",
  "steps": [
    "Strip away assumptions",
    "Identify core truths",
    "Build up from basics"
  ],
  "reasoning": "Breaking down to fundamentals...",
  "conclusion": "Core insights about $TOPIC"
})

# Systems Thinking
mcp__clear-thought__systemsthinking({
  "system": "$TOPIC as a system",
  "components": ["key elements"],
  "relationships": [
    {"from": "element1", "to": "element2", "type": "influences"}
  ],
  "feedbackLoops": [],
  "emergentProperties": ["system-level insights"],
  "leveragePoints": ["key intervention points"],
  "sessionId": "research-systems-$TIMESTAMP",
  "iteration": 1,
  "nextAnalysisNeeded": false
})
```

## Phase 5: Confidence Assessment

### Agent: Research Monitor
```mcp
mcp__clear-thought__metacognitivemonitoring({
  "task": "Research on: $TOPIC",
  "stage": "synthesis-assessment",
  "overallConfidence": 0.0,
  "uncertaintyAreas": [
    "Gaps in evidence",
    "Conflicting sources",
    "Untested assumptions"
  ],
  "recommendedApproach": "Further investigation needed in...",
  "monitoringId": "research-meta-$TIMESTAMP",
  "iteration": 1,
  "nextAssessmentNeeded": false
})
```

## Phase 6: Research Synthesis

### Agent: Knowledge Synthesizer
```mcp
mcp__clear-thought__structuredargumentation({
  "claim": "Research conclusion about $TOPIC",
  "premises": [
    "Socratic questioning revealed...",
    "Scientific investigation found...",
    "Mental models suggest...",
    "Multiple sources confirm..."
  ],
  "conclusion": "Comprehensive understanding with caveats",
  "argumentType": "inductive",
  "confidence": 0.85,
  "nextArgumentNeeded": false
})
```

## Memory Storage

```mcp
mcp__mem0__mem0_memory({
  "operation": "add",
  "messages": [{
    "role": "assistant",
    "content": "Research Topic: $TOPIC\nKey Findings: [summary]\nConfidence: [score]\nGaps: [what remains unknown]\nSources: [key references]\nMethodology: [approach used]"
  }],
  "user_id": "clear-thought",
  "metadata": {
    "type": "research-findings",
    "command": "think-research",
    "depth": "$RESEARCH_DEPTH",
    "timestamp": "$TIMESTAMP"
  }
})
```

## Output Format

```markdown
# Research Report: $TOPIC

## 🎯 Research Question
[Refined question from Socratic exploration]

## 🔍 Methodology
- **Approach**: [research design]
- **Sources Consulted**: [count and types]
- **Mental Models Applied**: [frameworks used]
- **Confidence Level**: [score]/1.0

## 📚 Key Findings

### Core Insights
1. **[Finding 1]** (Confidence: High)
   - Evidence: [supporting data]
   - Sources: [references]
   - Implications: [what this means]

2. **[Finding 2]** (Confidence: Medium)
   - Evidence: [supporting data]
   - Sources: [references]
   - Caveat: [limitations]

### Hypotheses Results
| Hypothesis | Status | Evidence | Confidence |
|------------|--------|----------|------------|
| H1: [desc] | ✅ Supported | [summary] | 0.9 |
| H2: [desc] | ❌ Refuted | [summary] | 0.8 |
| H3: [desc] | ⚠️ Partial | [summary] | 0.6 |

## 🧠 Theoretical Framework

### First Principles Analysis
[Fundamental truths discovered]

### Systems Perspective
```
[Visual representation of system relationships]
```

### Mental Model Insights
- **[Model 1]**: [insight]
- **[Model 2]**: [insight]

## 🔬 Evidence Assessment

### Strong Evidence For:
- [Well-supported claims]

### Moderate Evidence For:
- [Partially supported claims]

### Gaps & Uncertainties:
- [What remains unknown]
- [Conflicting evidence]
- [Areas needing research]

## 💡 Conclusions

### Primary Conclusion
[Main research finding with confidence level]

### Secondary Insights
- [Additional discoveries]
- [Unexpected findings]
- [New questions raised]

## 🔄 Further Research

### Recommended Next Steps
1. [Priority investigation area]
2. [Methodology to apply]
3. [Resources needed]

### Open Questions
- [ ] [Unresolved question 1]
- [ ] [Unresolved question 2]
- [ ] [Unresolved question 3]

## 📋 Research Metadata
- **Duration**: [time spent]
- **Iterations**: [count]
- **Hypotheses Tested**: [count]
- **Confidence Achieved**: [final score]
```

## Integration Points

- Chain with `/academic-search` for literature
- Use `/data-analysis` for quantitative research
- Apply `/expert-interview` for qualitative insights
- Connect to `/knowledge-graph` for visualization
- Export to `/research-paper` for publication

## Research Depth Levels

### Quick (30 min)
- Socratic clarification only
- 1 hypothesis
- 2-3 mental models
- Basic synthesis

### Standard (2 hours)
- Full Socratic method
- 3 hypotheses
- Multiple mental models
- Comprehensive synthesis

### Exhaustive (8+ hours)
- Deep Socratic exploration
- 5+ hypotheses
- All relevant mental models
- Meta-analysis of findings
- Publication-ready output

## Example

```
/think-research What are the long-term implications of large language models on human creativity?
```

This would:
1. Use Socratic method to define "creativity" and "implications"
2. Form hypotheses about enhancement vs replacement
3. Research evidence from multiple domains
4. Apply mental models (systems thinking, first principles)
5. Synthesize findings with confidence assessment