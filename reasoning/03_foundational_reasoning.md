# Foundational Agentic Reasoning

## Summary
This section details the three core components that enable a single agent to translate reasoning into action: **Planning**, **Tool Use**, and **Search**.

### 1. Planning Reasoning
Agents must decompose problems and sequence decisions.
*   **In-Context Planning**:
    *   **Workflow Design**: Structured pipelines (e.g., inspect-reason-act-observe loops).
    *   **Tree Search**: Simulating algorithms like BFS, DFS, or MCTS (e.g., Tree of Thoughts) to explore reasoning paths.
    *   **Formalization**: Using PDDL or code to represent plans.
*   **Post-Training Planning**: Using RL to optimize planning policies (e.g., Reflexion, DeepSeek-R1).

### 2. Tool-Use Optimization
Agents augment capabilities by invoking external modules.
*   **In-Context**: Interleaving reasoning and tool use (ReAct), utilizing tool documentation, and "contrastive reasoning" before acting.
*   **Post-Training**: Supervised Fine-Tuning (SFT) on tool-use traces (Toolformer) or RL for mastery (ToolRL).
*   **Orchestration**: Coordinating multiple tools (HuggingGPT) or using "plan-before-action" strategies.

### 3. Agentic Search
Agents dynamically control retrieval (RAG) based on reasoning needs.
*   **In-Context**: Interleaving reasoning and search (Self-Ask), reflective retrieval (deciding *when* to search).
*   **Structure-Enhanced**: Reasoning over Knowledge Graphs (KG) or structured data.
*   **Post-Training**: Training agents to issue search queries and verify results (WebGPT, Search-R1).

---

## Relevance to Thoughtbox

Thoughtbox provides the infrastructure for these foundational capabilities:

*   **Planning**:
    *   **Tree Search**: The `thought` tool natively supports **Branching**, allowing agents to implement Tree of Thoughts (ToT) or Beam Search strategies manually or algorithmically.
    *   **Workflow Design**: The `mental_models` tool provides **scaffolds** (e.g., `decomposition`, `trade-off-matrix`) that enforce structured planning workflows.
    *   **Formalization**: The `notebook` tool allows agents to write **Code-based Plans** (literate programming), bridging natural language planning with executable logic.

*   **Tool Use**:
    *   **Orchestration**: Thoughtbox acts as the **Orchestrator**. The "Reasoning Ledger" serves as the control plane where the agent decides which tool to call next.
    *   **Interleaving**: The "Interleaved" thinking pattern (mentioned in Thoughtbox docs) explicitly supports the ReAct paradigm: Thought $\to$ Tool Action $\to$ Observation $\to$ Thought.

*   **Search**:
    *   **Reflective Search**: Thoughtbox encourages **Reflective Retrieval**. An agent can use a `thought` to decide "I need to search for X", then use a search tool, then use another `thought` to critique the result ("Is this sufficient?").
    *   **Structure**: While Thoughtbox doesn't inherently index KGs, its **Mental Models** can be seen as "cognitive structures" that guide search and synthesis.
