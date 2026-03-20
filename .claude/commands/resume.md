Load the bead workflow skill first, then read `.claude/session-handoff.json` for context.

```
/bead-workflow
```

Run `bd ready` to see available work. Pick the highest-priority unblocked bead.

**Follow the bead workflow for every bead. No exceptions.**

The hooks enforce every transition. If you skip a step, your tool call will be blocked with an error telling you what to do first. The 7 steps:

1. **Claim** — `bd update <id> --claim`
2. **Hypothesize** — `bd update <id> --notes="Hypothesis: ..."` (blocked from editing code until done)
3. **Implement** — write only the code that tests the hypothesis
4. **Test** — `npx vitest run <file>` (blocked from closing until tests pass)
5. **Validate** — state the result out loud
6. **Close** — `bd close <id> --reason="..."` (one bead at a time)
7. **Pause** — wait for user go-ahead (blocked from starting next bead)

Two consecutive surprises on the same bead = Ulysses REFLECT activates automatically. Everything blocks until REFLECT completes.
