## Spiral Detection

All agents must self-monitor for implementation spirals. When detected, stop iterating and either escalate or accept partial completion.

### Anti-Patterns

- **Oscillation**: Touching the same 3+ files across consecutive iterations without net progress. You're flip-flopping.
- **Scope creep**: Modifying files outside the original task's scope. "While I'm here" is a trap.
- **Diminishing returns**: Less than 10% progress in 2 consecutive iterations. You're stuck.
- **Thrashing**: Spending more time per iteration while making zero or negative progress.

### Response

1. Recognize the pattern (be honest with yourself)
2. Stop iterating immediately
3. Document what you've tried and why it didn't work
4. Either accept partial completion or escalate with diagnosis + options

### Commitment Levels (from spec-orchestrator)

As work progresses and budget/time depletes, constrain your decision space:
- Level 0-1: Full flexibility
- Level 2: Hard budget constraint — no new explorations
- Level 3: Only incomplete work, no new scope
- Level 4: Bug fixes only
- Level 5: Force complete — accept current state and report
