# Self-evolving Agentic Reasoning

## Summary
This section explores how agents improve their reasoning through **Feedback** and **Memory**, transforming from static solvers to adaptive systems.

### 1. Agentic Feedback Mechanisms
*   **Reflective Feedback (Inference-time)**: The agent critiques and revises its own output *without* parameter updates.
    *   *Examples*: Reflexion, Self-Refine, Self-Correction.
    *   *Mechanism*: Generate $\to$ Critique $\to$ Revise.
*   **Parametric Adaptation (Training)**: Feedback updates model weights (SFT, RL).
*   **Validator-Driven**: External signals (e.g., unit tests, code execution) guide retry loops.

### 2. Agentic Memory
Memory shifts from a passive buffer to an active reasoning component.
*   **Flat Memory**: Storing dialogue history or facts (MemGPT).
*   **Structured Memory**: Knowledge Graphs, Trees, or Workflows (GraphRAG, MEM0).
*   **Post-Training Control**: Learning *how* to manage memory (read/write/forget) via RL (Memory-R1).

### 3. Evolving Capabilities
*   **Self-Evolving Planning**: Agents generate their own tasks or shape their environments to learn.
*   **Self-Evolving Tool-Use**: Agents synthesize new tools (e.g., writing code functions) to expand their action space (Voyager).
*   **Self-Evolving Search**: Co-evolution of memory and search strategies.

---

## Relevance to Thoughtbox

Thoughtbox is a powerful engine for **Self-Evolving Reasoning**, particularly in the **In-Context/Reflective** domain.

*   **Reflective Feedback**:
    *   **Revision**: The `thought` tool has a specific `isRevision` flag. This allows agents to explicitly mark a thought as a correction of a previous one, creating a structured **Reflexion** loop natively in the data model.
    *   **Critique**: The `critique: true` parameter in the `thought` tool triggers an **Autonomous Critique** via MCP sampling. This automates the "Critic" role, enabling self-correction without user intervention.

*   **Agentic Memory**:
    *   **Structured Experience**: Thoughtbox sessions are **Structured Memory**. They are not just flat text logs but **Graphs** of reasoning steps. This allows agents to "replay" or "branch" from past states.
    *   **Persistence**: Sessions are stored locally (`~/.thoughtbox`), enabling **Inter-test-time** evolution. An agent can load a previous session (`load_context`) to continue working or analyze past mistakes.

*   **Evolving Tool-Use**:
    *   **Notebook as Tool Factory**: The `notebook` tool allows agents to define new JS/TS functions. If these functions are persisted or exported, the agent effectively **synthesizes new tools**, mirroring systems like Voyager.
