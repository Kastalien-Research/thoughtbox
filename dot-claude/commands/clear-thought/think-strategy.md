# Think-Strategy

Complex initiative planning using systems thinking, decision frameworks, collaborative reasoning, and visual strategy mapping.

## Usage
```
/think-strategy <initiative or goal>
```

## Variables
- `INITIATIVE`: $ARGUMENTS (strategic initiative to plan)
- `PLANNING_HORIZON`: "12 months" (timeframe)
- `STAKEHOLDER_COUNT`: 5 (key perspectives to include)
- `SCENARIO_COUNT`: 3 (future scenarios to model)
- `SYSTEM_BOUNDARIES`: "organization" (scope of analysis)

## Phase 1: Systems Mapping

### Agent: Systems Strategist
```mcp
mcp__clear-thought__systemsthinking({
  "system": "Current state for initiative: $INITIATIVE",
  "components": [
    "People",
    "Processes", 
    "Technology",
    "Resources",
    "External factors"
  ],
  "relationships": [
    {"from": "People", "to": "Processes", "type": "execute", "strength": 0.9},
    {"from": "Technology", "to": "Processes", "type": "enables", "strength": 0.8},
    {"from": "Resources", "to": "People", "type": "constrains", "strength": 0.7}
  ],
  "feedbackLoops": [
    {
      "components": ["Performance", "Resources", "Investment"],
      "type": "positive",
      "description": "Success generates more resources"
    }
  ],
  "emergentProperties": ["organizational capabilities"],
  "leveragePoints": ["where to intervene for maximum impact"],
  "sessionId": "strategy-systems-$TIMESTAMP",
  "iteration": 1,
  "nextAnalysisNeeded": true
})
```

Map both current state and desired future state.

## Phase 2: Stakeholder Perspectives

### Agent: Stakeholder Analyst
```mcp
mcp__clear-thought__collaborativereasoning({
  "topic": "Strategic initiative: $INITIATIVE",
  "personas": [
    {
      "id": "executive",
      "name": "Executive Leadership",
      "expertise": ["vision", "resource allocation", "risk management"],
      "background": "C-suite perspective on organizational goals",
      "perspective": "ROI and competitive advantage",
      "biases": ["short-term results", "shareholder value"],
      "communication": {"style": "formal", "tone": "analytical"}
    },
    {
      "id": "operations",
      "name": "Operations Manager",
      "expertise": ["process efficiency", "team coordination", "delivery"],
      "background": "Day-to-day execution focus",
      "perspective": "Feasibility and resource needs",
      "biases": ["current state preference", "complexity aversion"],
      "communication": {"style": "technical", "tone": "analytical"}
    },
    {
      "id": "customer",
      "name": "Customer Representative",
      "expertise": ["user needs", "market trends", "satisfaction"],
      "background": "External stakeholder perspective",
      "perspective": "Value delivery and experience",
      "biases": ["feature maximization", "immediate needs"],
      "communication": {"style": "casual", "tone": "supportive"}
    },
    {
      "id": "innovation",
      "name": "Innovation Lead",
      "expertise": ["emerging tech", "disruption", "transformation"],
      "background": "Future-focused change agent",
      "perspective": "Long-term transformation",
      "biases": ["technology solutionism", "change for change sake"],
      "communication": {"style": "creative", "tone": "neutral"}
    },
    {
      "id": "finance",
      "name": "Financial Analyst",
      "expertise": ["budgeting", "ROI analysis", "risk assessment"],
      "background": "Numbers and sustainability focus",
      "perspective": "Financial viability",
      "biases": ["cost focus", "measurability preference"],
      "communication": {"style": "formal", "tone": "challenging"}
    }
  ],
  "contributions": [],
  "stage": "problem-definition",
  "activePersonaId": "executive",
  "sessionId": "strategy-stakeholder-$TIMESTAMP",
  "iteration": 1,
  "nextContributionNeeded": true
})
```

## Phase 3: Strategic Options

### Agent: Option Developer
```mcp
mcp__clear-thought__decisionframework({
  "decisionStatement": "Best approach for: $INITIATIVE",
  "options": [
    {"name": "Incremental", "description": "Gradual implementation with low risk"},
    {"name": "Transformational", "description": "Bold moves with high impact"},
    {"name": "Hybrid", "description": "Phased approach balancing risk/reward"}
  ],
  "analysisType": "scenario-planning",
  "stage": "scenario-development",
  "decisionId": "strategy-decision-$TIMESTAMP",
  "iteration": 1,
  "nextStageNeeded": true
})
```

Develop scenarios for each option across multiple futures.

## Phase 4: Visual Strategy Development

### Agent: Visual Strategist
```mcp
mcp__clear-thought__visualreasoning({
  "operation": "create_strategy_map",
  "diagramId": "strategy-$TIMESTAMP",
  "diagramType": "strategic_roadmap",
  "iteration": 1,
  "nextOperationNeeded": true
})

# Sequence of visual operations:
# 1. create_strategy_map - Overall strategic landscape
# 2. add_milestones - Key waypoints and decisions
# 3. map_dependencies - Critical path and relationships
# 4. identify_risks - Potential obstacles
# 5. annotate_metrics - Success indicators
```

## Phase 5: Implementation Planning

### Agent: Implementation Architect
```mcp
mcp__clear-thought__sequentialthinking({
  "thought": "Breaking down $INITIATIVE into implementation phases",
  "thoughtNumber": 1,
  "totalThoughts": 5,
  "nextThoughtNeeded": true,
  "needsMoreThoughts": true
})
```

Create detailed implementation sequence with:
- Phase definitions
- Resource requirements
- Success metrics
- Risk mitigation
- Decision gates

## Phase 6: Strategy Synthesis

### Agent: Strategy Synthesizer
```mcp
mcp__clear-thought__structuredargumentation({
  "claim": "Recommended strategy for $INITIATIVE",
  "premises": [
    "Systems analysis shows leverage at...",
    "Stakeholder consensus on...",
    "Scenario planning indicates...",
    "Visual mapping reveals...",
    "Implementation feasibility confirmed"
  ],
  "conclusion": "Strategic recommendation with roadmap",
  "argumentType": "abductive",
  "confidence": 0.8,
  "nextArgumentNeeded": false
})
```

## Memory Storage

```mcp
mcp__mem0__mem0_memory({
  "operation": "add",
  "messages": [{
    "role": "assistant",
    "content": "Strategic Initiative: $INITIATIVE\nRecommended Approach: [strategy]\nKey Milestones: [list]\nCritical Success Factors: [list]\nMain Risks: [list]\nStakeholder Alignment: [summary]"
  }],
  "user_id": "clear-thought",
  "metadata": {
    "type": "strategic-plan",
    "command": "think-strategy",
    "horizon": "$PLANNING_HORIZON",
    "timestamp": "$TIMESTAMP"
  }
})
```

## Output Format

```markdown
# Strategic Plan: $INITIATIVE

## 🎯 Executive Summary
**Vision**: [End state description]
**Approach**: [Selected strategy]
**Timeline**: [Duration]
**Investment**: [Resource requirements]
**Expected ROI**: [Benefits]

## 🗺️ Current State Analysis

### System Map
```
[Current State]
┌─────────────┐     ┌─────────────┐
│   People    │────▶│  Processes  │
└─────────────┘     └─────────────┘
       │                    │
       ▼                    ▼
┌─────────────┐     ┌─────────────┐
│ Technology  │────▶│  Outcomes   │
└─────────────┘     └─────────────┘
```

### Key Leverage Points
1. [High-impact intervention point]
2. [System bottleneck to address]
3. [Reinforcing loop to strengthen]

## 👥 Stakeholder Analysis

### Alignment Matrix
| Stakeholder | Support | Concerns | Influence |
|-------------|---------|----------|-----------|
| Executive | High | ROI timeline | Critical |
| Operations | Medium | Complexity | High |
| Customer | High | Continuity | Medium |
| Innovation | High | Scope limits | Medium |
| Finance | Medium | Budget | High |

### Key Insights
- **Champions**: [Who will drive this]
- **Skeptics**: [Who needs convincing]
- **Critical Requirements**: [Must-haves]

## 🔄 Strategic Options

### Option 1: [Incremental Approach]
- **Pros**: Low risk, easier adoption
- **Cons**: Slower impact, competitive disadvantage
- **Scenario Outcomes**: [Best/Expected/Worst]

### Option 2: [Transformational Approach]
- **Pros**: Market leadership, step change
- **Cons**: High risk, resource intensive
- **Scenario Outcomes**: [Best/Expected/Worst]

### ✅ Recommended: [Hybrid Approach]
- **Rationale**: [Why this balances concerns]
- **Key Success Factors**: [What must go right]

## 📊 Implementation Roadmap

### Phase 1: Foundation (Months 1-3)
- [ ] [Milestone 1]
- [ ] [Milestone 2]
- **Success Metrics**: [KPIs]
- **Go/No-Go Criteria**: [Decision gate]

### Phase 2: Acceleration (Months 4-8)
- [ ] [Milestone 3]
- [ ] [Milestone 4]
- **Success Metrics**: [KPIs]
- **Scaling Triggers**: [When to expand]

### Phase 3: Optimization (Months 9-12)
- [ ] [Milestone 5]
- [ ] [Milestone 6]
- **Success Metrics**: [KPIs]
- **Next Horizon**: [Future vision]

## 🎲 Risk Management

### Critical Risks
1. **[Risk Name]** (High/Medium)
   - Mitigation: [Strategy]
   - Early Warning: [Indicator]

2. **[Risk Name]** (Medium/Low)
   - Mitigation: [Strategy]
   - Contingency: [Plan B]

## 📈 Success Metrics

### Leading Indicators
- [Early success signal]
- [Adoption metric]
- [Quality measure]

### Lagging Indicators
- [Business outcome]
- [ROI measure]
- [Strategic goal]

## 🚀 Quick Wins (First 30 Days)
1. [Immediate action]
2. [Visible improvement]
3. [Stakeholder engagement]

## 💡 Strategic Recommendations
1. **Start with**: [First critical step]
2. **Focus on**: [Key success factor]
3. **Avoid**: [Common pitfall]
4. **Monitor**: [Critical metric]
5. **Pivot if**: [Trigger condition]
```

## Integration Points

- Chain with `/project-plan` for detailed execution
- Use `/okr-design` for goal alignment
- Apply `/risk-assessment` for deep risk analysis
- Connect to `/change-management` for adoption
- Export to `/executive-presentation` for buy-in

## Example

```
/think-strategy Implement AI-assisted code review across all engineering teams
```

This would:
1. Map current code review system and pain points
2. Gather perspectives from developers, managers, security, QA
3. Develop incremental vs transformational approaches
4. Create visual roadmap with phases
5. Synthesize recommendation with implementation plan