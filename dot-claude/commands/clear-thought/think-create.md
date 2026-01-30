# Think-Create

Generate novel solutions through creative thinking techniques, systems analysis, visual reasoning, and structured synthesis.

## Usage
```
/think-create <challenge or opportunity>
```

## Variables
- `CHALLENGE`: $ARGUMENTS (creative challenge to address)
- `CREATIVITY_ROUNDS`: 5 (ideation iterations)
- `TECHNIQUES_PER_ROUND`: 3 (creative techniques to apply)
- `SYSTEM_DEPTH`: "comprehensive" (level of systems analysis)
- `MIN_NOVELTY_SCORE`: 0.7 (threshold for idea uniqueness)

## Phase 1: Creative Ideation

### Agent: Creative Generator
```mcp
mcp__clear-thought__creativethinking({
  "prompt": "$CHALLENGE",
  "ideas": [],
  "techniques": ["brainstorming", "SCAMPER", "random_word"],
  "connections": [],
  "insights": [],
  "sessionId": "create-$TIMESTAMP",
  "iteration": 1,
  "nextIdeaNeeded": true
})
```

Apply rotating techniques across rounds:
- **Round 1**: Brainstorming, Mind Mapping, Free Association
- **Round 2**: SCAMPER, Reverse Thinking, What-If Scenarios
- **Round 3**: Random Word, Forced Connections, Metaphorical Thinking
- **Round 4**: Lateral Thinking, Provocation, Movement
- **Round 5**: Synthesis, Pattern Recognition, Emergence

## Phase 2: Systems Analysis of Ideas

### Agent: Systems Analyzer
For top creative ideas, analyze system implications:

```mcp
mcp__clear-thought__systemsthinking({
  "system": "System affected by idea: [creative solution]",
  "components": ["identify all parts"],
  "relationships": [
    {"from": "component1", "to": "component2", "type": "influences", "strength": 0.8}
  ],
  "feedbackLoops": [
    {
      "components": ["A", "B", "C"],
      "type": "positive",
      "description": "Reinforcing innovation cycle"
    }
  ],
  "emergentProperties": ["unexpected benefits"],
  "leveragePoints": ["where small changes have big impact"],
  "sessionId": "systems-create-$TIMESTAMP",
  "iteration": 1,
  "nextAnalysisNeeded": true
})
```

## Phase 3: Visual Concept Development

### Agent: Visual Designer
Create visual representations of top concepts:

```mcp
mcp__clear-thought__visualreasoning({
  "operation": "create_concept_map",
  "diagramId": "concept-$TIMESTAMP",
  "diagramType": "innovation_blueprint",
  "iteration": 1,
  "nextOperationNeeded": true
})
```

Operations sequence:
1. `create_concept_map` - Overall idea structure
2. `add_connections` - Link related concepts
3. `identify_patterns` - Find emergent themes
4. `simplify_representation` - Distill to essence
5. `annotate_insights` - Add key discoveries

## Phase 4: Innovation Synthesis

### Agent: Innovation Architect
Combine best ideas into coherent solutions:

```mcp
mcp__clear-thought__sequentialthinking({
  "thought": "Synthesizing top creative concepts...",
  "thoughtNumber": 1,
  "totalThoughts": 3,
  "nextThoughtNeeded": true,
  "branchId": "synthesis",
  "needsMoreThoughts": false
})
```

## Phase 5: Structured Presentation

### Agent: Solution Presenter
```mcp
mcp__clear-thought__structuredargumentation({
  "claim": "Innovative solution to $CHALLENGE",
  "premises": [
    "Creative techniques revealed [insights]",
    "Systems analysis shows [benefits]",
    "Visual reasoning identified [patterns]",
    "Synthesis created [novel combination]"
  ],
  "conclusion": "Recommended innovative approach with implementation",
  "argumentType": "abductive",
  "confidence": 0.85,
  "nextArgumentNeeded": false
})
```

## Novelty Assessment

### Agent: Innovation Evaluator
```mcp
mcp__clear-thought__metacognitivemonitoring({
  "task": "Assessing innovation: $CHALLENGE solutions",
  "stage": "novelty-evaluation",
  "overallConfidence": 0.0,
  "uncertaintyAreas": ["market readiness", "technical feasibility"],
  "recommendedApproach": "Test with prototype",
  "monitoringId": "novelty-$TIMESTAMP",
  "iteration": 1,
  "nextAssessmentNeeded": false
})
```

## Memory Storage

```mcp
mcp__mem0__mem0_memory({
  "operation": "add",
  "messages": [{
    "role": "assistant",
    "content": "Creative Challenge: $CHALLENGE\nTop Innovation: [solution]\nKey Techniques: [effective methods]\nNovelty Score: [score]\nImplementation Ideas: [list]"
  }],
  "user_id": "clear-thought",
  "metadata": {
    "type": "creative-solution",
    "command": "think-create",
    "techniques_used": ["list"],
    "timestamp": "$TIMESTAMP"
  }
})
```

## Output Format

```markdown
# Creative Solutions: $CHALLENGE

## 🎨 Ideation Summary
Generated **[N]** ideas across **5** rounds using **15** techniques

### Top Creative Concepts
1. **[Concept Name]** (Novelty: 9/10)
   - Description: [brief explanation]
   - Origin: [technique that sparked it]
   - Potential: [why it's promising]

2. **[Concept Name]** (Novelty: 8.5/10)
   - Description: [brief explanation]
   - Origin: [technique that sparked it]
   - Potential: [why it's promising]

## 🔄 Systems Impact Analysis

### [Top Solution] System Effects
- **Components**: [affected parts]
- **Feedback Loops**: 
  - Positive: [reinforcing cycles]
  - Negative: [balancing factors]
- **Leverage Points**: [where to intervene]
- **Emergent Properties**: [unexpected benefits]

## 🎯 Visual Concept Map
```
[ASCII or description of concept visualization]
```

## 💡 Recommended Innovation

### The Solution: [Name]
[Detailed description combining best elements]

### Why It Works
1. [Systems reasoning]
2. [Creative breakthrough]
3. [Practical feasibility]

### Implementation Pathway
1. **Prototype**: [first step]
2. **Test**: [validation approach]
3. **Iterate**: [improvement cycle]
4. **Scale**: [growth strategy]

### Innovation Metrics
- **Novelty Score**: [X]/10
- **Feasibility**: [X]/10
- **Impact Potential**: [X]/10
- **Resource Efficiency**: [X]/10

## 🚀 Next Steps
- [ ] Build minimal prototype
- [ ] Test with target users
- [ ] Refine based on feedback
- [ ] Develop full implementation plan
```

## Integration Points

- Chain with `/think-strategy` for implementation
- Use `/rapid-prototype` to build quickly
- Apply `/think-solve` for technical challenges
- Connect to `/market-analysis` for validation
- Export to `/patent-search` for IP protection

## Example

```
/think-create How might we make remote work more engaging and productive for distributed teams?
```

This would:
1. Generate ideas using brainstorming, SCAMPER, lateral thinking, etc.
2. Analyze system dynamics of remote work
3. Create visual concepts for solutions
4. Synthesize best ideas into innovative approach
5. Present structured plan with novelty assessment