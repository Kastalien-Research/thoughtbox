# Tool Pedagogy Optimization

**Phase 5 of the Unified Autonomous Loop (Asynchronous/Scheduled)**

## Purpose
Traditional search algorithms (like Hill Climbing or Quality Diversity) are typically used to optimize an agent's internal prompt or reasoning architecture. Thoughtbox extends this concept to optimize the **API surface and behavior of the tools the agent uses**. 

Because agents read MCP tool schemas at runtime, we can evolve the API surface (parameter names, expected formats, error messages) without breaking backward compatibility. We are optimizing Thoughtbox to be natively ergonomic for LLM cognition.

## 1. The Real-World Dataset (Organic Data Collection)
Instead of relying on synthetic benchmarks, the primary dataset is generated organically through daily engineering work.
- **Instrumented CLIs:** Standard day-to-day interactions using tools like the Gemini CLI or Codex are instrumented with LangSmith tracing.
- **Trace Capture:** Every interaction, including the exact MCP tool schemas presented to the agent, the parameters it sent, the result Thoughtbox returned, and the agent's subsequent reaction, is logged.

## 2. The Auto-Researcher (Batch Analysis)
On a scheduled basis (e.g., weekly), an offline "Auto-Researcher" process analyzes the collected LangSmith traces.
- **Friction Detection:** The script queries for negative signals such as:
  - `ToolExecutionError` rates.
  - High tool retry counts (e.g., calling the same tool 5 times to achieve a goal).
  - Excessive token expenditure in tool responses (indicating poor signal-to-noise ratio).
- **Hypothesis Generation:** An LLM analyzes these high-friction traces to ascertain *why* the agent struggled (e.g., unclear parameter docstrings, overly verbose output formats).

## 3. Proposal and Human Review
To prevent chaotic, autonomous changes to the core API surface, the Auto-Researcher does not mutate code directly. Instead, it acts as an Agentic Product Manager.
- **Issue Creation:** It generates `.beads` issues or draft ADRs using the standard `/hdd` format. These proposals include:
  - The specific LangSmith trace illustrating the friction.
  - The hypothesis regarding the cause.
  - The proposed change to the MCP spec (e.g., "Refactor `execute_query` output format: Agents consistently fail to parse the raw JSON response. Propose returning Markdown tables").
- **Triage:** Human developers review, approve, tweak, or reject these structural tool changes.

## 4. Implementation and Validation
Approved recommendations enter the standard development lifecycle.
- Changes are implemented in a branch.
- Validated against existing tests (`npm run test` using `agentic-test.ts`).
- Merged to provide a more ergonomic version of Thoughtbox for the next cycle.

This structured loop effectively performs continuous usability testing on the MCP server, leveraging actual agent struggles to provide data-backed refactoring targets.
