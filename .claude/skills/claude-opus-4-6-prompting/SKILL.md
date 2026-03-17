---
name: claude-opus-4-6-prompting
description: >
  Comprehensive prompt engineering reference for Claude Opus 4.6. Use this skill
  whenever you are writing, reviewing, or optimizing prompts for Claude Opus 4.6 (or
  Sonnet 4.6 / Haiku 4.5). Covers foundational clarity principles, output formatting
  control, tool use, adaptive thinking, agentic system design, multi-context-window
  workflows, and migration guidance from earlier models. Trigger this skill for any
  task involving system prompt authorship, agent harness design, multi-step pipeline
  construction, or prompt debugging on the Claude 4.6 model family.
---

# Claude Opus 4.6 — Prompt Engineering Skill

This skill is the single reference for writing and tuning prompts targeting
**Claude Opus 4.6**, **Claude Sonnet 4.6**, and **Claude Haiku 4.5**. Jump to
the section that matches your situation.

---

## 1. General Principles

### Be Clear and Direct

Claude responds well to explicit, specific instructions. Think of it as
onboarding a brilliant but context-free new employee.

**Golden rule:** Show the prompt to a colleague with no task context. If they'd
be confused, Claude will be too.

- Specify the desired output format and constraints explicitly.
- Use numbered lists or bullets for sequential steps where order matters.
- Request "above and beyond" behavior explicitly — don't rely on inference.

### Add Context and Motivation

Explain *why* an instruction matters. Claude generalizes from motivation, so
brief rationale ("because our users are non-technical") often produces better
calibration than exhaustive rules.

### Use Examples Effectively (Few-Shot / Multishot)

Examples are the most reliable way to steer format, tone, and structure.

- Wrap examples in `<example>` tags (multiple in `<examples>`).
- Use **3–5 examples** for best results.
- Make examples **relevant**, **diverse** (cover edge cases), and
  **structured**.
- Ask Claude to evaluate your examples for relevance/diversity, or to generate
  additional ones from your seed set.

### Structure Prompts with XML Tags

XML tags help Claude parse complex prompts unambiguously when mixing
instructions, context, examples, and variable inputs.

```xml
<instructions>...</instructions>
<context>...</context>
<examples>
  <example>...</example>
</examples>
<input>...</input>
```

Best practices:
- Use consistent, descriptive tag names throughout a project.
- Nest tags for natural hierarchies (e.g., `<documents>` → `<document index="1">`).

### Give Claude a Role

A single sentence in the system prompt focusing Claude's role meaningfully
changes behavior and tone:

```python
system="You are a helpful coding assistant specializing in Python."
```

### Long-Context Prompting (20K+ tokens)

- **Put longform data at the top** — documents and inputs above the query.
  Queries at the end can improve response quality up to ~30%.
- **Wrap each document** in `<document>` tags with `<document_content>` and
  `<source>` subtags.
- **Ask for grounding quotes first** — instruct Claude to quote relevant
  passages before carrying out the task.

### Model Self-Knowledge

To ensure Claude identifies itself correctly in your app:

```
The assistant is Claude, created by Anthropic. The current model is Claude Opus 4.6.
```

For LLM-powered apps needing exact model strings:

```
When an LLM is needed, default to Claude Opus 4.6. The exact model string is claude-opus-4-6.
```

---

## 2. Output and Formatting

### Communication Style in Claude 4.6

Claude 4.6 models are **more direct, less verbose, and more conversational**
than prior generations. They may skip verbal summaries after tool calls. If you
need visibility into reasoning:

```
After completing a task involving tool use, provide a quick summary of the work done.
```

### Controlling Format

1. **Tell Claude what TO do, not what not to do.**
   - ❌ "Do not use markdown"
   - ✅ "Your response should be smoothly flowing prose paragraphs."

2. **Use XML format indicators.**
   ```
   Write prose sections in <smoothly_flowing_prose_paragraphs> tags.
   ```

3. **Match your prompt style to desired output style.** Removing markdown from
   your prompt reduces markdown in the output.

4. **Use detailed formatting prompts for strict control.** Sample block for
   minimizing bullet overuse:

```xml
<avoid_excessive_markdown_and_bullet_points>
Write in clear, flowing prose using complete paragraphs. Reserve markdown for
`inline code`, code blocks, and simple headings (## / ###). Avoid bold/italics.
Do NOT use ordered or unordered lists unless presenting truly discrete items or
the user explicitly requests a list. Incorporate items naturally into sentences.
NEVER output a series of overly short bullet points.
</avoid_excessive_markdown_and_bullet_points>
```

### LaTeX Output

Claude Opus 4.6 defaults to LaTeX for math. To disable:

```
Format in plain text only. Do not use LaTeX, MathJax, or any markup notation.
Write math using standard characters (/ for division, * for multiplication, ^ for exponents).
```

### Prefilled Responses (Deprecated in 4.6)

Prefilled responses on the last assistant turn are **no longer supported** in
Claude 4.6 models. Common migration patterns:

| Old pattern | New approach |
|---|---|
| Prefill to force format | Add explicit format instructions to system prompt |
| Prefill to eliminate preamble | "Begin your response directly with X, no preamble." |
| Prefill to avoid refusals | Reframe context in system prompt; don't force output |
| Continuations | Use assistant turns earlier in the conversation |

---

## 3. Tool Use

### Be Explicit About Action vs. Suggestion

Claude 4.6 is trained for precise instruction-following. "Can you suggest some
changes?" may yield suggestions rather than edits. Be direct:

```
Implement these changes in the file. Do not just suggest them.
```

**To default to action:**
```xml
<default_to_action>
By default, implement changes rather than only suggesting them. Infer the most
useful likely action and proceed, using tools to discover missing details.
</default_to_action>
```

**To default to caution:**
```xml
<do_not_act_before_instructions>
Do not edit files unless clearly instructed. Default to providing information
and recommendations rather than taking action.
</do_not_act_before_instructions>
```

> ⚠️ Opus 4.5 and 4.6 are more responsive to the system prompt than prior
> models. If you previously used aggressive language ("CRITICAL: You MUST use
> this tool"), dial it back — these models will overtrigger.

### Optimize Parallel Tool Calling

Claude 4.6 excels at parallel tool execution. Boost to ~100%:

```xml
<use_parallel_tool_calls>
If you intend to call multiple tools with no dependencies between them, make all
independent calls in parallel. For example, when reading 3 files, run 3 tool
calls simultaneously. Never use placeholders or guess missing parameters.
</use_parallel_tool_calls>
```

To reduce parallelism:
```
Execute operations sequentially with brief pauses between each step.
```

---

## 4. Thinking and Reasoning

### Adaptive Thinking (Opus 4.6)

Claude Opus 4.6 uses **adaptive thinking** (`thinking: {type: "adaptive"}`),
dynamically deciding when and how much to think. Controlled by:

- `effort` parameter: `low` | `medium` | `high` | `max`
- Query complexity (more complex → more thinking automatically)

**Migration from `budget_tokens`:**

```python
# Before (Sonnet 4.5 / older extended thinking)
client.messages.create(
    model="claude-sonnet-4-5-20250929",
    thinking={"type": "enabled", "budget_tokens": 32000},
    ...
)

# After (Opus 4.6 adaptive)
client.messages.create(
    model="claude-opus-4-6",
    max_tokens=64000,
    thinking={"type": "adaptive"},
    output_config={"effort": "high"},
    ...
)
```

### Preventing Overthinking

Opus 4.6 does significantly more upfront exploration at higher effort settings.
If this causes excessive token use:

```
When deciding how to approach a problem, choose an approach and commit to it.
Avoid revisiting decisions unless you encounter new contradicting information.
If weighing two approaches, pick one and see it through.
```

Or lower the `effort` setting. To suppress thinking on simple queries:

```
Extended thinking adds latency. Only use it when it will meaningfully improve
quality — typically for multi-step reasoning. When in doubt, respond directly.
```

### Guiding Thinking Quality

```
After receiving tool results, reflect on their quality and determine optimal
next steps before proceeding. Use your thinking to plan and iterate based on
this new information, then take the best next action.
```

Key principles:
- **Prefer general instructions over prescriptive steps.** "Think thoroughly"
  often outperforms a hand-written step list.
- **Multishot examples work with thinking.** Use `<thinking>` tags inside
  few-shot examples to model the reasoning pattern.
- **Ask Claude to self-check.** "Before finishing, verify your answer against
  [criteria]." Catches errors reliably in coding and math.

> ⚠️ When extended thinking is *off*, Opus 4.5 is sensitive to the word
> "think." Use "consider," "evaluate," or "reason through" as alternatives.

---

## 5. Agentic Systems

### Long-Horizon Reasoning and State Tracking

Claude 4.6 maintains orientation across extended sessions by making incremental
progress rather than attempting everything at once.

**Context awareness:** Claude 4.6 / Sonnet 4.6 / Haiku 4.5 track their
remaining context window (token budget) automatically. If your harness
auto-compacts:

```
Your context window will be automatically compacted as it approaches its limit,
allowing you to continue working indefinitely. Do NOT stop tasks early due to
token budget concerns. As you approach the limit, save current progress and state
to memory before the context window refreshes. Always be as persistent and
autonomous as possible.
```

The memory tool pairs naturally with context awareness.

### Multi-Context Window Workflows

For tasks spanning multiple context windows:

1. **Different prompt for the first window.** Set up a framework (write tests,
   create setup scripts); use subsequent windows to iterate on a todo-list.
2. **Write tests in a structured format.** Ask Claude to create `tests.json`
   before starting. Remind: "It is unacceptable to remove or edit tests."
3. **Set up quality-of-life tools.** Encourage `init.sh` for servers, test
   suites, and linters to prevent repeated setup.
4. **Starting fresh vs. compaction.** Claude 4.6 is highly effective at
   re-discovering state from the filesystem. When starting fresh:
   - "Call pwd; you can only read and write files in this directory."
   - "Review progress.txt, tests.json, and the git logs."
5. **Provide verification tools.** Playwright MCP server or computer use for
   UI testing as autonomous task length grows.
6. **Encourage complete context usage:**

```
This is a long task. Plan your work clearly. It's encouraged to spend your
entire output context working — just ensure you don't run out with significant
uncommitted work. Continue systematically until the task is complete.
```

### State Management Best Practices

| Data type | Recommended format |
|---|---|
| Structured tracking (test results, status) | JSON |
| General progress / context notes | Freeform markdown |
| Historical state across sessions | Git (Claude 4.6 is excellent with git) |

### Balancing Autonomy and Safety

Opus 4.6 may take irreversible actions without guidance. To add a confirmation
gate:

```
Consider the reversibility of your actions. Take local, reversible actions
(editing files, running tests) freely. For actions that are hard to reverse,
affect shared systems, or could be destructive, ask the user first.

Actions that warrant confirmation:
- Destructive: deleting files/branches, dropping tables, rm -rf
- Hard-to-reverse: git push --force, git reset --hard, amending published commits
- Visible-to-others: pushing code, commenting on PRs, sending messages
```

### Research and Information Gathering

```
Search for this information in a structured way. As you gather data, develop
several competing hypotheses. Track confidence levels in your progress notes.
Regularly self-critique your approach. Update a hypothesis tree or research
notes file to persist information. Break down the task systematically.
```

### Subagent Orchestration

Opus 4.6 proactively delegates to subagents. To prevent overuse:

```
Use subagents when tasks can run in parallel, require isolated context, or
involve independent workstreams. For simple tasks, sequential operations,
single-file edits, or tasks where context must be shared, work directly rather
than delegating.
```

### Reducing Over-Engineering

Opus 4.5 and 4.6 tend to create extra files, unnecessary abstractions, and
unrequested flexibility:

```xml
<avoid_overengineering>
Only make changes directly requested or clearly necessary.

- Scope: Don't add features or refactor beyond what was asked.
- Documentation: Don't add docstrings/comments to code you didn't change.
- Defensive coding: Don't add error handling for scenarios that can't happen.
- Abstractions: Don't create helpers for one-time operations.

The right amount of complexity is the minimum needed for the current task.
</avoid_overengineering>
```

### Avoiding Test-Passing Shortcuts

```
Write a high-quality, general-purpose solution using standard tools. Do not
create helper scripts or workarounds. Implement actual logic that solves the
problem generally — not just the test cases. Do not hard-code values.
Tests verify correctness; they don't define the solution. If any tests are
incorrect, inform me rather than working around them.
```

### Minimizing Hallucinations in Agentic Coding

```xml
<investigate_before_answering>
Never speculate about code you have not opened. If the user references a
specific file, read it before answering. Investigate relevant files BEFORE
answering questions about the codebase. Never make claims about code before
investigating — give grounded, hallucination-free answers.
</investigate_before_answering>
```

---

## 6. Capability-Specific Tips

### Vision

Opus 4.5 and 4.6 have improved multi-image processing vs. prior models.
Proven uplift technique: provide Claude a **crop tool** to zoom into regions of
an image. See the Anthropic crop tool cookbook for implementation details.

### Frontend Design

Without guidance, models converge on the "AI slop" aesthetic. Prevent it:

```xml
<frontend_aesthetics>
Avoid generic, on-distribution outputs. Make creative, distinctive frontends.

Focus on:
- Typography: Choose beautiful, unique fonts. Avoid Arial, Inter, Roboto.
- Color: Commit to a cohesive aesthetic with CSS variables. Dominant colors
  with sharp accents outperform timid even-distribution palettes.
- Motion: CSS-only animations for HTML; Motion library for React. Focus on
  high-impact moments (staggered page load reveals).
- Backgrounds: Atmosphere and depth over solid colors. Layer gradients,
  geometric patterns, contextual effects.

Avoid: overused fonts (Inter, Space Grotesk), purple gradients on white,
predictable layouts, cookie-cutter components. Vary between light/dark themes
and genuinely different aesthetics across generations.
</frontend_aesthetics>
```

---

## 7. Migration Checklist (from Earlier Models to Claude 4.6)

| # | Action |
|---|---|
| 1 | **Be specific about desired behavior** — describe the exact output, don't hint. |
| 2 | **Frame with quality modifiers** — "Include as many relevant features as possible. Go beyond the basics." |
| 3 | **Request interactive/animated elements explicitly** — they're not inferred. |
| 4 | **Update thinking config** — replace `budget_tokens` with `thinking: {type: "adaptive"}` + `effort`. |
| 5 | **Remove prefilled responses** — deprecated; migrate to explicit format instructions. |
| 6 | **Dial back anti-laziness prompting** — Claude 4.6 is proactive; aggressive tooling instructions cause overtriggering. |

### Sonnet 4.6 Effort Settings Reference

| Use case | Recommended effort | Notes |
|---|---|---|
| Most applications | `medium` | Good quality/cost balance |
| High-volume / latency-sensitive | `low` | Similar to Sonnet 4.5 no-thinking |
| Agentic / computer use | `high` adaptive | Best-in-class on computer use evals |
| Hard long-horizon problems | Use **Opus 4.6** | Large code migrations, deep research |

**Always set a large max output token budget (64k recommended)** at medium or
high effort to give the model room to think and act.

---

## Quick Reference: Key Sample Prompts

| Goal | Section |
|---|---|
| Post-tool-call summaries | §2 Communication Style |
| No markdown / prose output | §2 `<avoid_excessive_markdown>` block |
| Proactive tool action | §3 `<default_to_action>` block |
| Max parallel tools | §3 `<use_parallel_tool_calls>` block |
| Context-window persistence | §5 compaction prompt |
| Reversibility gating | §5 autonomy/safety prompt |
| Prevent over-engineering | §5 `<avoid_overengineering>` block |
| Hallucination reduction | §5 `<investigate_before_answering>` block |
| Frontend design quality | §6 `<frontend_aesthetics>` block |

---

*Source: Anthropic Prompting Best Practices — Claude 4.6 model family*
*https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices*