# Mental Models Tool

15 structured reasoning schemas across 9 problem domains.

## Operations

```javascript
mental_models({ operation: "get_model", args: { model: "five-whys" } })
mental_models({ operation: "list_models", args: { tag: "debugging" } })
mental_models({ operation: "list_tags" })
mental_models({ operation: "get_capability_graph" })  // For knowledge graph init
```

## 9 Tags

| Tag | Purpose |
|-----|---------|
| debugging | Finding and fixing issues |
| planning | Task breakdown, sequencing |
| decision-making | Choosing under uncertainty |
| risk-analysis | What could go wrong |
| estimation | Reasonable guesses |
| prioritization | What to do first |
| communication | Explaining clearly |
| architecture | System design, structure |
| validation | Testing assumptions |

## 15 Models

### Debugging & Validation

| Model | Purpose | Tags |
|-------|---------|------|
| `rubber-duck` | Explain step-by-step to find issues | debugging, communication |
| `five-whys` | Drill from symptom to root cause | debugging, validation |
| `assumption-surfacing` | Expose hidden assumptions | validation, planning |

### Risk & Planning

| Model | Purpose | Tags |
|-------|---------|------|
| `pre-mortem` | Imagine failure, work backward | risk-analysis, planning |
| `inversion` | Avoid failure paths | risk-analysis, planning |
| `adversarial-thinking` | Attacker mindset | risk-analysis, validation |

### Decision-Making

| Model | Purpose | Tags |
|-------|---------|------|
| `steelmanning` | Strongest opposing view first | decision-making, validation |
| `trade-off-matrix` | Map competing concerns | decision-making, prioritization |
| `opportunity-cost` | What you give up | decision-making, prioritization |
| `time-horizon-shifting` | Evaluate at 1wk/1yr/10yr | planning, decision-making |

### Architecture & Planning

| Model | Purpose | Tags |
|-------|---------|------|
| `decomposition` | Break into tractable pieces | planning, architecture |
| `abstraction-laddering` | Move up/down abstraction | architecture, communication |
| `constraint-relaxation` | Remove constraints, explore, reapply | planning, architecture |

### Estimation & Prioritization

| Model | Purpose | Tags |
|-------|---------|------|
| `fermi-estimation` | Order-of-magnitude estimates | estimation |
| `impact-effort-grid` | Plot impact vs effort | prioritization |

## Model Selection by Problem

| Problem Type | Recommended Models |
|--------------|-------------------|
| Bug unclear | five-whys, rubber-duck |
| Design decision | pre-mortem, trade-off-matrix, steelmanning |
| Task planning | decomposition, impact-effort-grid |
| Risk assessment | pre-mortem, adversarial-thinking, inversion |
| Estimation needed | fermi-estimation, time-horizon-shifting |
| Understanding topic | abstraction-laddering, decomposition |

## Usage Pattern

```javascript
// 1. Get framework
mental_models({ operation: "get_model", args: { model: "five-whys" } })

// 2. Apply with thoughtbox
thoughtbox({ thought: "Applying five-whys to login failure...", ... })

// 3. Iterate through model steps
thoughtbox({ thought: "WHY 1: JWT validation fails", ... })
thoughtbox({ thought: "WHY 2: Pods have different secrets", ... })
// Continue...
```

## Capability Graph

For knowledge graph initialization:

```javascript
mental_models({ operation: "get_capability_graph" })
// Returns entities and relations for memory_create_entities/relations
```

## Cross-References

- Apply models with: [THOUGHTBOX.md](THOUGHTBOX.md)
- Orchestration patterns: [PATTERNS.md](PATTERNS.md)
- Problem routing: [SELECTION.md](SELECTION.md)
