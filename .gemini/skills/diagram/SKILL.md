---
name: diagram
description: Generate architecture diagrams for a codebase subsystem or module. Explores source files and produces Mermaid diagrams in docs/.
argument-hint: [subsystem or module path, e.g. "observatory", "hub", "persistence"]
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Task
---

Generate architecture diagrams for: $ARGUMENTS

## Workflow

1. Launch the `architecture-diagrammer` agent with the target subsystem
2. The agent will:
   - Explore all files in the target module
   - Map entry points, data flows, and component relationships
   - Produce `docs/<target>-architecture.md` with Mermaid diagrams
3. Report which diagrams were produced

## Execution

Use the Task tool to launch the `architecture-diagrammer` agent:

```
Task({
  subagent_type: "architecture-diagrammer",
  prompt: "Generate architecture diagrams for the '$ARGUMENTS' subsystem. Explore the codebase, trace data flows, and produce docs/$ARGUMENTS-architecture.md with Mermaid diagrams covering: system context, sequence diagrams for key flows, component architecture, and startup lifecycle.",
  description: "Diagram $ARGUMENTS architecture"
})
```

## Output

After the agent completes, summarize:
- File produced: `docs/<target>-architecture.md`
- Number and types of diagrams generated
- Key architectural insights discovered
