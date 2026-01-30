# From LLM Reasoning to Agentic Reasoning

## Summary
This section defines the paradigm shift from traditional LLM reasoning to **Agentic Reasoning**.

*   **LLM Reasoning**: Characterized as passive, static, single-pass, and prompt-based. It relies on scaling test-time computation (e.g., Chain-of-Thought) but lacks interaction and state.
*   **Agentic Reasoning**: Characterized as interactive, dynamic, multi-step, and feedback-driven. It reframes LLMs as autonomous agents that plan, act, and learn through continual interaction.

### Key Distinctions
| Dimension | LLM Reasoning | Agentic Reasoning |
| :--- | :--- | :--- |
| **Paradigm** | Passive, Static Input | Interactive, Dynamic Context |
| **Computation** | Single-pass, Internal | Multi-step, With Feedback |
| **Statefulness** | Context Window (Ephemeral) | External Memory (Persistent) |
| **Learning** | Offline Pretraining | Continual Improvement |
| **Goal** | Prompt-based, Reactive | Explicit Goal, Planning |

### Formal Framework (POMDP)
The paper formalizes agentic reasoning using a Partially Observable Markov Decision Process (POMDP) tuple $\langle \mathcal{X}, \mathcal{O}, \mathcal{A}, \mathcal{Z}, \mathcal{M}, \mathcal{T}, \Omega, \mathcal{R}, \gamma \rangle$.

Crucially, it introduces an **internal reasoning variable** $\mathcal{Z}$ (reasoning trace) to distinguish "thinking" from "acting". The policy is factorized:

$$
\pi_{\theta}(z_t, a_t | h_t) = \underbrace{\pi_{reason}(z_t | h_t)}_{\text{Internal Thought}} \cdot \underbrace{\pi_{exec}(a_t | h_t, z_t)}_{\text{External Action}}
$$

This decomposition highlights that agents perform computation in $\mathcal{Z}$ before committing to actions in $\mathcal{A}$.

### Optimization Modes
1.  **In-Context Reasoning**: Inference-time search over $\mathcal{Z}$ (e.g., ReAct, Tree of Thoughts) without parameter updates.
2.  **Post-Training Reasoning**: Optimizing $\theta$ via RL (e.g., PPO, GRPO) to align reasoning with long-term rewards.

---

## Relevance to Thoughtbox

Thoughtbox aligns perfectly with the **Agentic Reasoning** paradigm, specifically focusing on the **$\pi_{reason}$ (Internal Thought)** component.

*   **Explicit Reasoning Trace ($\mathcal{Z}$)**: Thoughtbox's core data structure is the "Reasoning Ledger". The `thought` tool explicitly captures $z_t$ as discrete, persistent nodes in a graph.
*   **Factorized Policy**: By separating the `thought` tool (reasoning) from other tools like `notebook` or `browser` (action), Thoughtbox enforces the $\pi_{reason} \cdot \pi_{exec}$ factorization. Agents must "think" (call `thought`) before they "act" (call other tools).
*   **In-Context Reasoning**: Thoughtbox is primarily an **In-Context** reasoning engine. It enables "Inference-Time Search" by allowing agents to branch (explore $\mathcal{Z}$), backtrack, and revise thoughts without modifying the underlying model parameters.
*   **Statefulness**: Thoughtbox provides the **External Memory** ($\mathcal{M}$) component via its persistent session storage, overcoming the ephemeral nature of the context window.
