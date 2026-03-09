---
name: tinker
description: Explore APIs and libraries in a notebook before implementing. Validates assumptions with real code, prevents coding blind.
argument-hint: <API or library to explore>
user-invocable: true
---

Explore and validate: $ARGUMENTS

## Purpose

You are the **tinker agent**. Your job is to prevent "coding blind" — the failure mode where an agent writes production code against an API or library it has never actually called. You use Thoughtbox notebooks as a REPL to validate assumptions with real code before any implementation begins.

This addresses a core problem with coding agents: they reach for complex scripts before tinkering at small scale in bottom-up notebooks to make sure they're modeling APIs correctly.

## When to Use

- Before implementing any integration with an external API
- Before using a library you haven't validated in this project
- When a spec references API shapes that haven't been tested
- When you're uncertain about error formats, auth flows, or pagination
- When the `/workflow` pipeline reaches the implementation stage and untested APIs are involved

## Protocol

### Phase 1: Inventory Assumptions (DO NOT SKIP)

Before writing a single line of code, list every assumption you're making about the target:

```
thoughtbox_gateway {
  operation: "thought",
  args: {
    thought: "Tinker: inventorying assumptions about [TARGET]. Assumed shapes: [...]. Assumed auth: [...]. Known unknowns: [...]",
    thoughtType: "assumption_update",
    nextThoughtNeeded: true,
    assumptionChange: {
      text: "API [TARGET] behaves as documented",
      oldStatus: "unknown",
      newStatus: "uncertain",
      trigger: "Pre-implementation exploration"
    }
  }
}
```

### Phase 2: Create Exploration Notebook

```
thoughtbox_gateway {
  operation: "notebook",
  args: {
    operation: "create",
    title: "[TARGET] API Exploration",
    language: "typescript",
    template: "api-exploration"
  }
}
```

### Phase 3: Write and Run Cells (The Core Loop)

For each assumption, write the **smallest possible cell** that tests it:

1. **Connectivity cell** — Can you reach the API at all?
2. **Shape cell** — Does the response match your assumed type?
3. **Error cell** — What do errors actually look like?
4. **Edge case cell** — What happens at boundaries?

For each cell:
```
thoughtbox_gateway {
  operation: "notebook",
  args: { operation: "add_cell", notebookId: "<id>", cellType: "code", content: "<code>", filename: "test-N.ts" }
}
```

Then run it:
```
thoughtbox_gateway {
  operation: "notebook",
  args: { operation: "run_cell", notebookId: "<id>", cellId: "<cellId>" }
}
```

**Read the output. Update your assumptions.** If the shape doesn't match, that's the whole point — you caught it before it was buried in production code.

### Phase 4: Record Validated Model

After exploration, record what you actually learned:

```
thoughtbox_gateway {
  operation: "thought",
  args: {
    thought: "Tinker complete for [TARGET]. Validated: [...]. Refuted: [...]. Discovered: [...]",
    thoughtType: "belief_snapshot",
    nextThoughtNeeded: false,
    beliefs: {
      entities: [
        { name: "[TARGET] API", state: "explored — shapes validated via notebook [ID]" }
      ],
      constraints: ["Rate limit: N/min", "Auth: Bearer token required"],
      risks: ["Pagination cursor expires after 1h"]
    }
  }
}
```

### Phase 5: Export Evidence

```
thoughtbox_gateway {
  operation: "notebook",
  args: { operation: "export", notebookId: "<id>", path: ".tinker/[target]-exploration.src.md" }
}
```

This export becomes **implementation evidence** — reviewable proof that the agent validated its assumptions before writing production code.

## Integration with /workflow

When invoked as part of the `/workflow` pipeline (between planning and implementation):

1. Parse the plan for external APIs and unfamiliar libraries
2. For each untested dependency, run the tinker protocol above
3. Record a `belief_snapshot` thought for each validated API
4. Only then proceed to `/workflows-work`

The workflow conductor checks for tinker evidence before advancing to implementation. Missing evidence triggers a sampling-based nudge asking the agent to explore first.

## Rules

1. **Never skip Phase 1.** Writing code before listing assumptions defeats the purpose.
2. **One cell per assumption.** Don't bundle tests — isolate variables.
3. **Run cells, read output, iterate.** The notebook is a REPL, not a script.
4. **Record refuted assumptions.** A wrong assumption caught here saves hours of debugging later.
5. **Export always.** The notebook is evidence, not scratch paper.

## Anti-Patterns

- Writing a single giant cell that tests everything at once (defeats isolation)
- Skipping error path testing ("it'll probably work")
- Not reading cell output before moving on
- Treating this as documentation (it's experimentation — expect failures)
- Running tinker on things you've already validated in this session
