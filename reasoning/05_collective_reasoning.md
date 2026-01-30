# Collective Multi-Agent Reasoning

## Summary
This section extends reasoning to **Multi-Agent Systems (MAS)**, where agents collaborate, communicate, and co-evolve.

### 1. Role Taxonomy
*   **Generic Roles**: Leader (Coordinator), Worker (Executor), Critic (Evaluator), Memory Keeper, Communication Facilitator.
*   **Domain-Specific**:
    *   *Software*: Architect, Developer, Tester.
    *   *Finance*: Analyst, Risk Manager, Trader.
    *   *Legal*: Researcher, Argumentation.

### 2. Collaboration & Division of Labor
*   **In-Context Collaboration**:
    *   **Manual Pipelines**: Predefined workflows (MetaGPT).
    *   **LLM-Driven**: Orchestrators dynamically plan and assign roles (AutoML-Agent).
    *   **Routing**: Selecting specialists based on task.
*   **Post-Training Collaboration**: Optimizing prompts and communication topologies (Graph generation/pruning) via RL.

### 3. Multi-Agent Evolution
*   **Temporal Evolution**:
    *   *Intra-test-time*: Adapting during execution (dynamic planning).
    *   *Inter-test-time*: Learning across episodes (updating shared memory/policy).
*   **Memory Management**:
    *   **Architecture**: Hierarchical (global insights vs local traces) vs Heterogeneous (role-specific).
    *   **Topology**: Centralized (SEDM) vs Distributed (Collaborative Memory).
    *   **Content**: Semantic vs Task-based decomposition.

---

## Relevance to Thoughtbox

While Thoughtbox is often used by a single "User Agent", its architecture supports **Collective Reasoning** patterns:

*   **Shared Ledger as Coordination Mechanism**: The "Reasoning Ledger" acts as a **Blackboard Architecture**. Multiple agents (or a single agent assuming multiple personas) can read from and write to the same session.
    *   *Leader* writes a plan (Thought 1).
    *   *Worker* executes and writes result (Thought 2).
    *   *Critic* reviews and writes critique (Thought 3).
    *   All agents share the same context via the ledger.

*   **Role Support**:
    *   **Critic**: Natively supported via the `critique` parameter (using MCP sampling to invoke a "Critic" model).
    *   **Memory Keeper**: Thoughtbox *is* the Memory Keeper. It abstracts the "Memory Management" role into the infrastructure itself.

*   **Collaboration Topologies**:
    *   **Branching**: Supports **Parallel Execution**. Different agents (or threads) can explore `Branch A` and `Branch B` simultaneously, then a "Leader" can synthesize the results (`merge`).

*   **Evolution**:
    *   **Manual Evolution**: Users/Agents can analyze past sessions (using `session.analyze`) to update their "Mental Models" or system prompts, effectively performing **Inter-test-time Evolution**.
