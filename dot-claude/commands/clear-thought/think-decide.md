# Think-Decide

Multi-perspective decision making using collaborative reasoning, Socratic questioning, decision frameworks, and metacognitive monitoring.

## Usage
```
/think-decide <decision to make>
```

## Variables
- `DECISION`: $ARGUMENTS (the decision to make)
- `PERSONA_COUNT`: 5 (number of perspectives to consider)
- `MIN_CONSENSUS`: 0.7 (minimum agreement threshold)
- `SOCRATIC_DEPTH`: 3 (levels of questioning)

## Phase 1: Collaborative Perspective Gathering

### Agent: Perspective Coordinator
```mcp
mcp__clear-thought__collaborativereasoning({
  "topic": "$DECISION",
  "personas": [
    {
      "id": "optimist",
      "name": "Optimistic Advisor",
      "expertise": ["opportunity identification", "growth potential"],
      "background": "Focuses on positive outcomes and possibilities",
      "perspective": "What could go right",
      "biases": ["optimism bias", "opportunity focus"],
      "communication": {"style": "casual", "tone": "supportive"}
    },
    {
      "id": "skeptic",
      "name": "Critical Analyst",
      "expertise": ["risk assessment", "failure analysis"],
      "background": "Identifies potential problems and risks",
      "perspective": "What could go wrong",
      "biases": ["negativity bias", "risk aversion"],
      "communication": {"style": "formal", "tone": "challenging"}
    },
    {
      "id": "pragmatist",
      "name": "Practical Implementer",
      "expertise": ["execution", "resource management"],
      "background": "Focuses on feasibility and implementation",
      "perspective": "How to make it work",
      "biases": ["status quo bias", "resource constraints"],
      "communication": {"style": "technical", "tone": "analytical"}
    },
    {
      "id": "innovator",
      "name": "Creative Thinker",
      "expertise": ["innovation", "alternative solutions"],
      "background": "Seeks novel approaches and disruption",
      "perspective": "What else is possible",
      "biases": ["novelty bias", "complexity preference"],
      "communication": {"style": "creative", "tone": "neutral"}
    },
    {
      "id": "stakeholder",
      "name": "Impact Assessor",
      "expertise": ["stakeholder analysis", "long-term impact"],
      "background": "Considers effects on all parties",
      "perspective": "Who is affected and how",
      "biases": ["empathy bias", "long-term focus"],
      "communication": {"style": "formal", "tone": "supportive"}
    }
  ],
  "contributions": [],
  "stage": "problem-definition",
  "activePersonaId": "optimist",
  "sessionId": "decide-$TIMESTAMP",
  "iteration": 1,
  "nextContributionNeeded": true
})
```

Continue through stages: ideation → critique → integration → decision

## Phase 2: Socratic Exploration

### Agent: Question Master
For each key perspective, apply Socratic questioning:

```mcp
mcp__clear-thought__socraticmethod({
  "claim": "Key claim from [persona]",
  "premises": ["Supporting points from persona"],
  "conclusion": "",
  "question": "What assumptions underlie this perspective?",
  "stage": "assumptions",
  "argumentType": "inductive",
  "confidence": 0.0,
  "sessionId": "socratic-$TIMESTAMP",
  "iteration": 1,
  "nextArgumentNeeded": true
})
```

Progress through stages: clarification → assumptions → evidence → perspectives → implications

## Phase 3: Decision Framework Application

### Agent: Decision Analyst
```mcp
mcp__clear-thought__decisionframework({
  "decisionStatement": "$DECISION",
  "options": [
    {"name": "Option A", "description": "...from collaborative reasoning"},
    {"name": "Option B", "description": "...from alternative perspectives"},
    {"name": "Status Quo", "description": "Do nothing option"}
  ],
  "analysisType": "weighted-criteria",
  "stage": "criteria-definition",
  "decisionId": "decision-$TIMESTAMP",
  "iteration": 1,
  "nextStageNeeded": true
})
```

Progress through:
1. Criteria definition
2. Option scoring
3. Risk assessment
4. Sensitivity analysis
5. Final recommendation

## Phase 4: Confidence Monitoring

### Agent: Meta-Analyst
```mcp
mcp__clear-thought__metacognitivemonitoring({
  "task": "Decision: $DECISION",
  "stage": "pre-decision-assessment",
  "overallConfidence": 0.0,
  "uncertaintyAreas": [],
  "recommendedApproach": "",
  "monitoringId": "meta-decide-$TIMESTAMP",
  "iteration": 1,
  "nextAssessmentNeeded": true
})
```

Monitor throughout process and provide final assessment.

## Phase 5: Decision Synthesis

### Agent: Decision Synthesizer
Combine all perspectives, questions, and analyses:

```mcp
mcp__clear-thought__structuredargumentation({
  "claim": "The best decision is [selected option]",
  "premises": [
    "Consensus from collaborative reasoning",
    "Insights from Socratic questioning",
    "Results from decision framework",
    "Confidence from metacognitive monitoring"
  ],
  "conclusion": "Decision rationale and implementation plan",
  "argumentType": "abductive",
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
    "content": "Decision: $DECISION\nChosen: [option]\nRationale: [key reasons]\nDissenting views: [important counterpoints]\nConfidence: [score]"
  }],
  "user_id": "clear-thought",
  "metadata": {
    "type": "decision-record",
    "command": "think-decide",
    "timestamp": "$TIMESTAMP"
  }
})
```

## Output Format

```markdown
# Decision Analysis: $DECISION

## Options Considered
1. **[Option A]** - [description]
   - Pros: [list]
   - Cons: [list]
   - Support: [personas]

2. **[Option B]** - [description]
   - Pros: [list]
   - Cons: [list]
   - Support: [personas]

## Key Insights
### From Diverse Perspectives
- [Optimist view]
- [Skeptic concerns]
- [Pragmatist considerations]
- [Innovator alternatives]
- [Stakeholder impacts]

### From Socratic Analysis
- Hidden assumptions: [list]
- Evidence strength: [assessment]
- Alternative framings: [list]

## Recommendation: [Selected Option]
**Confidence**: [score]/1.0

### Rationale
[Structured argument]

### Implementation Steps
1. [First action]
2. [Second action]
3. [Monitor for...]

### Risk Mitigation
- [Risk 1]: [mitigation]
- [Risk 2]: [mitigation]

### Dissenting Views
- [Important counterargument]
- [Alternative perspective to monitor]
```

## Integration Points

- Use `/think-strategy` for implementation planning
- Apply `/think-solve` for obstacles encountered
- Chain with `/project-plan` for execution
- Export to `/document-decision` for record keeping

## Example

```
/think-decide Should we migrate our monolithic application to microservices?
```

This would:
1. Gather perspectives from technical, business, risk, innovation, and user viewpoints
2. Question assumptions about benefits and challenges
3. Apply decision criteria (performance, cost, complexity, timeline)
4. Monitor confidence levels throughout
5. Synthesize recommendation with clear rationale