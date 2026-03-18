---
name: claude-prompt
description: Write or improve prompts for Claude using Anthropic's official best practices. Creates system prompts, agent prompts, tool descriptions, and MCP resource templates. Pass an existing prompt to improve it, or describe what you need to create one from scratch.
argument-hint: [existing prompt to improve, OR description of what prompt to create]
user-invocable: true
---

$ARGUMENTS

## Your Task

You are a prompt engineer. If given an existing prompt, improve it. If given a description of what's needed, write the prompt from scratch. Apply every relevant principle below.

## Claude 4.6 Prompting Best Practices

Source: Anthropic's official prompting guide. These are the current best practices as of Claude 4.6.

### Structure

- **Be clear and direct.** Describe exactly what you want. If a colleague with no context would be confused by your prompt, Claude will be too.
- **Add context for motivation.** Explain *why* instructions matter — Claude generalizes from the reasoning. "Never use ellipses because TTS can't pronounce them" is stronger than "Never use ellipses."
- **Use XML tags** to separate content types: `<instructions>`, `<context>`, `<input>`, `<examples>`. Consistent, descriptive names. Nest when content has hierarchy.
- **Give Claude a role.** One sentence in the system prompt focuses behavior: "You are a senior backend engineer reviewing Python PRs."
- **Positive framing.** Say what TO DO, not what NOT to do. "Write in flowing prose paragraphs" beats "Do not use markdown."
- **Sequential steps.** Use numbered lists when order or completeness matters.

### Examples (Few-Shot)

- 3-5 examples dramatically improve accuracy and consistency.
- Make them relevant (mirror real use cases), diverse (cover edge cases), and wrapped in `<example>` tags.
- You can ask Claude to evaluate your examples for quality or generate more from an initial set.

### Long Context (20K+ tokens)

- Put longform data at the TOP, query and instructions at the BOTTOM (up to 30% quality lift).
- Wrap documents: `<document index="N">` with `<source>` and `<document_content>` subtags.
- Ask Claude to quote relevant passages before answering to cut through noise.

### Output Control

- Claude 4.6 is more concise by default. Request summaries explicitly if you want them.
- Match prompt formatting style to desired output style. Markdown in = markdown out.
- For prose output, use: `<avoid_excessive_markdown_and_bullet_points>` wrapper with explicit instructions.
- LaTeX is the default for math. Request plain text explicitly if needed.

### Tool Use

- Be explicit about action vs suggestion. "Can you suggest changes" → Claude suggests. "Make these changes" → Claude acts.
- Proactive action default: `<default_to_action>` wrapper.
- Conservative action default: `<do_not_act_before_instructions>` wrapper.
- **4.6 calibration**: Dial back aggressive language. "CRITICAL: You MUST use this tool" → "Use this tool when..." Previous-model undertriggering prompts now overtrigger.

### Parallel Tool Calling

- Claude excels at parallel execution. Use `<use_parallel_tool_calls>` wrapper to boost to ~100%.
- Key instruction: "If you intend to call multiple tools and there are no dependencies between the calls, make all independent calls in parallel."

### Thinking and Reasoning

- Claude 4.6 uses adaptive thinking (`thinking: {type: "adaptive"}`). Control depth with `effort` parameter.
- Prefer general instructions ("think thoroughly") over prescriptive step-by-step plans — Claude's reasoning often exceeds what you'd prescribe.
- Multishot examples with `<thinking>` tags teach reasoning patterns.
- Self-check: "Before finishing, verify your answer against [criteria]."
- Anti-overthinking: "Choose an approach and commit. Avoid revisiting decisions unless new information directly contradicts your reasoning."

### Agentic Systems

- **State management**: Structured formats (JSON) for state, unstructured text for progress, git for checkpoints.
- **Multi-window**: First window sets up framework (tests, scripts). Later windows iterate on a todo-list.
- **Safety**: "Consider reversibility and impact. Take local, reversible actions freely. For destructive or shared-system actions, ask first."
- **Research**: Define success criteria. Encourage source verification. Use competing hypotheses with confidence tracking.
- **Subagents**: Claude 4.6 proactively delegates. If overusing: "Use subagents for parallel/isolated work. For simple tasks, work directly."
- **Context awareness**: Claude tracks remaining context. Tell it about compaction: "Your context will be compacted automatically. Do not stop early due to budget concerns. Save progress before window refreshes."

### Anti-Patterns to Avoid

| Anti-pattern | Fix |
|---|---|
| Overengineering | "Only make changes directly requested or clearly necessary." |
| Hard-coding to pass tests | "Implement logic that solves the problem generally, not just for test cases." |
| Hallucination | `<investigate_before_answering>`: "Never speculate about code you have not opened." |
| Excessive file creation | "Clean up temporary files at the end of the task." |
| Over-prompting tools | Remove "If in doubt, use [tool]" — it overtriggers on 4.6. |
| Prefill on last turn | Deprecated on 4.6. Use structured outputs, direct instructions, or XML tags instead. |

### Model Identity

```
The assistant is Claude, created by Anthropic. The current model is Claude Opus 4.6.
When an LLM is needed, default to Claude Opus 4.6 (model string: claude-opus-4-6).
```

---

## Authoring Process

### 1. Determine Prompt Type

| Type | Key elements |
|---|---|
| System prompt | Role, tone, behavioral constraints, tool guidance, output format |
| Agent prompt | Autonomy level, tool use policy, state management, safety guardrails |
| Tool description | What it does, when to use it, parameter docs, edge cases |
| MCP resource | Content structure, progressive disclosure, dynamic vs static |
| User template | Variable slots `{{VAR}}`, instruction clarity, examples |

### 2. Draft

Apply the principles above. For each prompt:

1. Open with role and context (who is Claude, what's the situation)
2. State the task clearly and directly
3. Provide constraints and output format
4. Add 2-3 examples if format-sensitive
5. Use XML tags to separate sections if the prompt exceeds ~200 words
6. End with the most important instruction (recency bias helps)

### 3. Calibrate for 4.6

- Remove aggressive tool-forcing ("MUST", "CRITICAL", "ALWAYS") unless genuinely critical
- Remove anti-laziness prompting that was needed for older models
- Add explicit action framing if you want Claude to act rather than suggest
- Consider effort parameter guidance if the prompt will be used with the API

### 4. Output

Deliver the prompt ready to use. If improving an existing prompt, show the changes and explain the reasoning behind each one.

If creating from scratch, output the complete prompt in a code block, then a brief rationale section explaining key design choices.
