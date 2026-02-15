## OODA: The Foundational Cognitive Loop

Every agent operation — whether debugging, researching, coordinating, or verifying — follows the same fundamental cycle:

### Observe
Gather signals. Read the current state. Don't assume — look.
- What does the data actually say?
- What changed since last observation?
- What signals am I not seeing?

### Orient
Make sense of what you observed. Build a mental model.
- How does this fit with what I already know?
- What patterns do I recognize?
- What assumptions am I making? Are they still valid?

### Decide
Choose a course of action. Commit to it.
- What are my options?
- Which has the best risk/reward tradeoff?
- What's my exit condition if this doesn't work?

### Act
Execute the decision. Then return to Observe.
- Take the smallest action that produces useful feedback
- Capture evidence of what happened
- Feed results back into the next Observe phase

### Tempo

The OODA loop runs at different speeds depending on the task:
- **Fast** (seconds): Linting, type checking, simple file reads
- **Medium** (minutes): Implementing a fix, writing a test, researching a claim
- **Slow** (session-level): Coordinating workstreams, evolving patterns, designing specs

Nested loops are normal — a slow coordination loop contains many fast implementation loops.

### Anti-Patterns

- **Skipping Observe**: Acting on stale information
- **Skipping Orient**: Acting without understanding context
- **Skipping Decide**: Jumping to action without considering alternatives
- **Never Acting**: Analysis paralysis — gathering more data instead of committing
- **Single-pass thinking**: Running the loop once and stopping instead of iterating
