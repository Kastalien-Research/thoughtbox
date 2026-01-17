These heuristics map very cleanly onto a bunch of recent “agent-native” work. Below is a curated set of papers (2023–2026) that are explicitly agent‑applicable under your criteria, grouped by pattern and annotated in terms of *what you can steal at the agent layer*.

***

## 1. External Memory & Information Flow (Heuristics 1, 4, 6)

These all work with black‑box LLMs and move complexity into **information flow + external state**, not weights.

### A‑Mem: Agentic Memory for LLM Agents  
- **Paper**: A‑Mem: Agentic Memory for LLM Agents [arxiv](https://arxiv.org/pdf/2502.12110.pdf)
- **ArXiv**: https://arxiv.org/abs/2502.12110  
- **Why agent‑applicable**  
  - Memory is a separate system: builds notes with structured attributes + embeddings, runs top‑k retrieval, and maintains evolving links between memories. [arxiv](https://arxiv.org/html/2502.12110v11)
  - Works with any LLM that can read/write natural language memories; no finetuning assumed. [arxiv](https://arxiv.org/html/2502.12110v11)
- **What to steal**  
  - Memory entries as **rich notes**: structured fields + freeform text + embedding, not just vector chunks. [arxiv](https://arxiv.org/html/2502.12110v11)
  - When inserting new memories, **update old ones** (retroactive linking) to keep the memory graph consistent. [arxiv](https://arxiv.org/html/2502.12110v11)
  - Use **selective top‑k memory retrieval** to keep prompt length 1.2K–2.5K tokens even in long‑running agents. [arxiv](https://arxiv.org/html/2502.12110v1)

### MemInsight: Autonomous Memory Augmentation for LLM Agents  
- **Paper**: MemInsight: Autonomous Memory Augmentation for LLM Agents [arxiv](https://arxiv.org/html/2503.21760v2)
- **ArXiv**: https://arxiv.org/abs/2503.21760  
- **Why agent‑applicable**  
  - The “magic” is in how attributes are mined and used for retrieval (process), not in new embeddings. [arxiv](https://arxiv.org/html/2503.21760v2)
  - Entire pipeline can be implemented as repeated “LLM call → generate attributes → store + query” around any base model. [arxiv](https://arxiv.org/html/2503.21760v1)
- **What to steal**  
  - Attribute mining along three axes (Perspective, Granularity, Annotation) as *LLM prompts* instead of static schemas. [arxiv](https://arxiv.org/html/2503.21760v2)
  - Two retrieval modes you can scaffold:  
    - **Comprehensive**: pull all related memories + attributes when starting a session. [arxiv](https://arxiv.org/html/2503.21760v1)
    - **Refined**: infer task‑specific attributes from current context, then filter memories before embedding search. [arxiv](https://arxiv.org/html/2503.21760v1)

### Temporal Semantic Memory (TSM) for Personalized Agents  
- **Paper**: Temporal Semantic Memory for Personalized LLM Agents [arxiv](https://arxiv.org/pdf/2601.07468.pdf)
- **ArXiv**: https://arxiv.org/abs/2601.07468  
- **Why agent‑applicable**  
  - Models “semantic time” as an external memory abstraction: memories are ordered by *semantic* rather than wall‑clock time. [arxiv](https://arxiv.org/pdf/2601.07468.pdf)
  - Uses LLM to construct temporal memory prompts; base model can be frozen. [arxiv](https://arxiv.org/pdf/2601.07468.pdf)
- **What to steal**  
  - Maintain a **timeline of memories indexed by semantic events**, and let the LLM query “what was relevant just before/after X?”. [arxiv](https://arxiv.org/pdf/2601.07468.pdf)
  - Build prompts that explicitly show *temporal neighborhoods* instead of a flat recent-history window. [arxiv](https://arxiv.org/pdf/2601.07468.pdf)

***

## 2. Recursive / Hierarchical Decomposition (Heuristics 2, 3, 5)

All of these can literally be drawn as flowcharts with “LLM API call” nodes.

### ReCAP: Recursive Context-Aware Reasoning and Planning  
- **Paper**: ReCAP: Recursive Context-Aware Reasoning and Planning with Dynamic Context Trees [cs224r.stanford](https://cs224r.stanford.edu/projects/pdfs/CS224R_RECAP.pdf)
- **PDF**: https://cs224r.stanford.edu/projects/pdfs/CS224R_RECAP.pdf  
- **Why agent‑applicable**  
  - Describes a **framework**: recursive hierarchical decomposition, dynamic context tree, subgoal-level backtracking. [cs224r.stanford](https://cs224r.stanford.edu/projects/pdfs/CS224R_RECAP.pdf)
  - Works with existing LLM APIs; the recursion + context tree are outside the model. [cs224r.stanford](https://cs224r.stanford.edu/projects/pdfs/CS224R_RECAP.pdf)
- **What to steal**  
  - Represent tasks as a **context tree** where each node has: subtask description, local context, result, and status. [cs224r.stanford](https://cs224r.stanford.edu/projects/pdfs/CS224R_RECAP.pdf)
  - Implement **subgoal-level backtracking**: if a leaf fails, revise only its branch instead of restarting from the root. [cs224r.stanford](https://cs224r.stanford.edu/projects/pdfs/CS224R_RECAP.pdf)
  - Always pass parent plan snippets down into child prompts to maintain hierarchical coherence. [cs224r.stanford](https://cs224r.stanford.edu/projects/pdfs/CS224R_RECAP.pdf)

### ReAcTree: Hierarchical LLM Agent Trees with Control Flow  
- **Paper**: ReAcTree: Hierarchical LLM Agent Trees with Control Flow for Long-Horizon Tasks [arxiv](https://arxiv.org/html/2511.02424v1)
- **ArXiv**: https://arxiv.org/abs/2511.02424  
- **Why agent‑applicable**  
  - Extends ReAct into a **behavior-tree style agent system**: agent nodes (reason/act/expand) + control-flow nodes (sequence, fallback, parallel). [arxiv](https://arxiv.org/html/2511.02424v1)
  - Entire mechanism is decomposition + routing + memory; LLM is a black‑box planner/actor. [arxiv](https://arxiv.org/html/2511.02424v1)
- **What to steal**  
  - Model complex tasks as **agent trees over subgoals**, *not* raw primitive actions. [arxiv](https://arxiv.org/html/2511.02424v1)
  - Implement behavior-tree control nodes (Sequence, Fallback, Parallel) as agent orchestrators that decide which child agent to call next. [arxiv](https://arxiv.org/html/2511.02424v1)
  - Ensure each subgoal has its **own focused context**, preventing error propagation across the whole plan. [arxiv](https://arxiv.org/html/2511.02424v1)

### Recursive Knowledge Synthesis for Multi‑LLM Systems  
- **Paper**: Recursive Knowledge Synthesis for Multi‑LLM Systems [arxiv](https://www.arxiv.org/pdf/2601.08839.pdf)
- **ArXiv**: https://arxiv.org/abs/2511.11519  
- **Why agent‑applicable**  
  - Tri‑agent architecture (semantic reasoner, analytical checker, safety auditor) coordinated by an external Supervisor. [arxiv](https://www.arxiv.org/pdf/2601.08839.pdf)
  - Uses Session-Level Role Decomposition: each role is a separate conversation session, even when using same vendor/model. [arxiv](https://www.arxiv.org/pdf/2601.08839.pdf)
- **What to steal**  
  - Implement **role‑split multi‑agent clusters**: separate sessions per role with different system prompts and tool access. [arxiv](https://www.arxiv.org/pdf/2601.08839.pdf)
  - Add an **external supervisor loop** that merges outputs, resolves disagreement, and issues targeted control prompts. [arxiv](https://www.arxiv.org/pdf/2601.08839.pdf)

### ReDel: Toolkit for Recursive Multi-Agent Systems  
- **Paper**: ReDel: A Toolkit for LLM-Powered Recursive Multi-Agent Systems [arxiv](https://arxiv.org/html/2408.02248v1)
- **ArXiv**: https://arxiv.org/abs/2408.02248  
- **Why agent‑applicable**  
  - It *is* a scaffold/toolkit: recursive multi-agent orchestration with custom tool-use, delegation schemes, and event-based triggers. [arxiv](https://arxiv.org/html/2408.02248v1)
- **What to steal**  
  - Model delegation as a **first‑class primitive**: any agent can spawn sub‑agents with narrower roles and isolated context. [arxiv](https://arxiv.org/html/2408.02248v1)
  - Use **event-based orchestration** (not just synchronous calls) to trigger agents from state changes or external events. [arxiv](https://arxiv.org/html/2408.02248v1)

***

## 3. Process Supervision & Decomposition Safety (Heuristics 3, 5, “minimal trusted primitive”)

These papers encode *process* around a frozen model: supervision, monitoring, and meta‑strategies.

### Enhancing LLM Agents with Automated Process Supervision  
- **Paper**: Enhancing LLM Agents with Automated Process Supervision [aclanthology](https://aclanthology.org/2025.emnlp-main.506.pdf)
- **PDF**: https://aclanthology.org/2025.emnlp-main.506.pdf  
- **Why agent‑applicable**  
  - Focuses specifically on **supervising intermediate reasoning steps** in agents, not retraining the base model. [aclanthology](https://aclanthology.org/2025.emnlp-main.506.pdf)
  - Uses external supervisors (LLMs) to monitor stepwise chains and correct early. [aclanthology](https://aclanthology.org/2025.emnlp-main.506.pdf)
- **What to steal**  
  - Insert a **process supervisor agent** that:  
    - Observes each reasoning step.  
    - Flags inconsistent or low‑confidence steps.  
    - Provides corrective feedback before the next tool/action. [aclanthology](https://aclanthology.org/2025.emnlp-main.506.pdf)
  - Store **process-level traces** in memory to support continual improvement of agent strategies. [aclanthology](https://aclanthology.org/2025.emnlp-main.506.pdf)

### Monitoring Decomposition Attacks in LLMs  
- **Paper**: Monitoring Decomposition Attacks in LLMs with Lightweight Sequential Monitors [arxiv](https://arxiv.org/pdf/2506.10949.pdf)
- **ArXiv**: https://arxiv.org/abs/2506.10949  
- **Why agent‑applicable**  
  - Safety layer watching **decomposition traces** to catch malicious goals hidden across benign subtasks. [arxiv](https://arxiv.org/pdf/2506.10949.pdf)
  - Implemented as an external sequential monitoring process over prompts + tool calls. [arxiv](https://arxiv.org/pdf/2506.10949.pdf)
- **What to steal**  
  - Run a **separate safety monitor** that reads the *sequence* of subtasks and reconstructs suspected latent goals. [arxiv](https://arxiv.org/pdf/2506.10949.pdf)
  - Use it to veto or escalate when the overall pattern suggests policy violation, even if each subcall is benign. [arxiv](https://arxiv.org/pdf/2506.10949.pdf)

### Experience-Guided Adaptation of Inference-Time Reasoning (EGUR)  
- **Paper**: Experience-Guided Adaptation of Inference-Time Reasoning [arxiv](https://www.arxiv.org/pdf/2511.11519.pdf)
- **ArXiv**: https://arxiv.org/abs/2511.11519 (EGUR)  
- **Why agent‑applicable**  
  - EGUR generates **tailored reasoning strategies**—full computational procedures involving LLM calls, tools, and selection—based on *experience*. [arxiv](https://www.arxiv.org/pdf/2511.11519.pdf)
  - The “learning” is in the strategy library + controller, not in base model weights. [arxiv](https://www.arxiv.org/pdf/2511.11519.pdf)
- **What to steal**  
  - Persist a **strategy library** (prompt patterns, search depths, tool workflows) keyed by task type or failure modes. [arxiv](https://www.arxiv.org/pdf/2511.11519.pdf)
  - On new tasks, choose or adapt a strategy from prior experience instead of using a fixed decision tree. [arxiv](https://www.arxiv.org/pdf/2511.11519.pdf)

***

## 4. Long‑Horizon Agent Planning & Context Use (Heuristics 2, 4, 5)

These explicitly work at the *agent* level and directly target long contexts / long horizons.

### ReAcTree (again) & ReCAP (agentic angle)  
- Already above, but both explicitly frame themselves as **agentic planners for long-horizon tasks**. [arxiv](https://arxiv.org/html/2511.02424v1)
- They’re good exemplars of “if I can draw it as a control‑flow tree around a black‑box LLM, I can steal it”.

### Mem^p: Exploring Agent Procedural Memory  
- **Paper**: Mem^p: Exploring Agent Procedural Memory [arxiv](https://arxiv.org/html/2508.06433v2)
- **ArXiv**: https://arxiv.org/abs/2508.06433  
- **Why agent‑applicable**  
  - Focuses on **procedural knowledge** (how to do tasks) as external memory for agents. [arxiv](https://arxiv.org/html/2508.06433v2)
  - Uses LLM to write, refine, and execute procedures (scripts/plans) across episodes. [arxiv](https://arxiv.org/html/2508.06433v2)
- **What to steal**  
  - Treat **“how‑to scripts” as first‑class memory objects** that can be learned once and reused across tasks. [arxiv](https://arxiv.org/html/2508.06433v2)
  - Build a loop: run task → log steps → abstract into a reusable procedure with LLM → store in procedural memory. [arxiv](https://arxiv.org/html/2508.06433v2)

### Optimization Pathways for Long-Context Agentic LLM Inference  
- **Paper**: Optimization Pathways for Long-Context Agentic LLM Inference [arxiv](https://arxiv.org/html/2509.09505v2)
- **ArXiv**: https://arxiv.org/abs/2509.09505  
- **Why agent‑applicable**  
  - Characterizes **“agentic LLM inference”** as a distinct workload: big contexts (DOMs, long tool traces) hitting memory walls. [arxiv](https://arxiv.org/html/2509.09505v2)
  - Proposes hardware + quantization + FlashAttention support; that’s mostly infra, but *the framing* is valuable. [arxiv](https://arxiv.org/html/2509.09505v2)
- **What to steal (agent side)**  
  - Design agents to respect hardware realities:  
    - Avoid constantly re‑pushing entire DOMs or full history; compress and chunk aggressively. [arxiv](https://arxiv.org/html/2509.09505v2)
    - Align scaffolds with attention‑friendly patterns (e.g., local windows + explicit anchors). [arxiv](https://arxiv.org/html/2509.09505v2)

***

## 5. Memory Frameworks Purpose‑Built for Agents (Green flags everywhere)

These are about **agent memory as a subsystem**, not model-level representation learning.

### Memoria: Scalable Agentic Memory for Personalized Assistants  
- **Paper**: Memoria: A Scalable Agentic Memory Framework for Personalized LLM Agents [arxiv](https://arxiv.org/html/2512.12686v1)
- **ArXiv**: https://arxiv.org/abs/2512.12686  
- **Why agent‑applicable**  
  - Entirely about how an *agent* should store, index, and retrieve user-specific memories over time. [arxiv](https://arxiv.org/html/2512.12686v1)
  - Works at inference time with any foundation model. [arxiv](https://arxiv.org/html/2512.12686v1)
- **What to steal**  
  - Design memory as its own **service with APIs** (`record_event`, `retrieve_for(task)`, `summarize_session`) rather than ad‑hoc vector stores in each agent. [arxiv](https://arxiv.org/html/2512.12686v1)

### Temporal / Semantic / Procedural Memory Trio  
- **TSM** for temporal semantics, [arxiv](https://arxiv.org/pdf/2601.07468.pdf)
- **MemInsight** for attribute‑rich semantic memory, [arxiv](https://arxiv.org/html/2503.21760v2)
- **Mem^p** for procedural memory. [arxiv](https://arxiv.org/html/2508.06433v2)
- **Pattern**: split agent memory into **orthogonal subsystems** (when, what, how) with different retrieval/summarization policies.

***

## 6. How These Map to Your Heuristics

A quick mapping from your heuristics to concrete papers / patterns:

| Heuristic | Good exemplars | Agent‑layer pattern to reuse |
|-----------|----------------|------------------------------|
| 1. Info flow vs weight updates | A‑Mem, MemInsight, ReCAP, ReAcTree  [arxiv](https://arxiv.org/html/2502.12110v11) | All rewire information flow (what is stored, when, and how it’s combined), with frozen base models. |
| 2. Simulate with multiple API calls | ReCAP, ReAcTree, ReDel, Recursive Knowledge Synthesis  [cs224r.stanford](https://cs224r.stanford.edu/projects/pdfs/CS224R_RECAP.pdf) | Draw them as graphs of LLM calls + tool actions; no gradient needed. |
| 3. Representation vs process | Process Supervision, Decomposition Monitoring, EGUR  [aclanthology](https://aclanthology.org/2025.emnlp-main.506.pdf) | The “magic” is in supervision, monitoring, and strategy selection—pure process. |
| 4. Tokens-in vs tokens-out | A‑Mem (short prompts via selective retrieval), ReAcTree (focused local contexts), ReCAP (subgoal contexts)  [arxiv](https://arxiv.org/html/2502.12110v1) | All explicitly *reduce tokens-in* per call; tokens-out is whatever the base model emits. |
| 5. External loop | Every recursive / hierarchical paper here (ReCAP, ReAcTree, ReDel, EGUR)  [cs224r.stanford](https://cs224r.stanford.edu/projects/pdfs/CS224R_RECAP.pdf) | All define explicit outer loops over planning, monitoring, or strategy selection. |
| 6. Minimal trusted primitive | MemInsight (just “LLM can label attributes”), A‑Mem (LLM can summarize & tag), ReCAP (LLM can propose/refine subgoals)  [arxiv](https://arxiv.org/html/2503.21760v2) | You can swap in any “strong enough” model that can compute these primitives. |

***

## 7. If You Want a Concrete “Agent-Layer Playbook”

Using these papers as references, a practical agent architecture that maximally exploits *agent‑applicable* research would have:

1. **Task Decomposition Layer**  
   - Implement ReCAP/ReAcTree‑style **hierarchical decomposition** into subgoals, each with its own focused context. [cs224r.stanford](https://cs224r.stanford.edu/projects/pdfs/CS224R_RECAP.pdf)
   - Represent plans as a context tree / agent tree with behavior‑tree control flow. [arxiv](https://arxiv.org/html/2511.02424v1)

2. **Memory Subsystem**  
   - **Semantic memory**: MemInsight‑style attribute‑rich store for facts & experiences. [arxiv](https://arxiv.org/html/2503.21760v2)
   - **Temporal memory**: TSM‑style semantically ordered timeline. [arxiv](https://arxiv.org/pdf/2601.07468.pdf)
   - **Procedural memory**: Mem^p‑style scripts and reusable workflows. [arxiv](https://arxiv.org/html/2508.06433v2)
   - **Agentic memory controller**: A‑Mem/Memoria‑style system that evolves memories and links them over time. [arxiv](https://arxiv.org/html/2502.12110v11)

3. **Process Supervision & Safety**  
   - A process supervisor agent to watch intermediate reasoning steps and correct early. [aclanthology](https://aclanthology.org/2025.emnlp-main.506.pdf)
   - A decomposition monitor to detect when benign subtasks compose into malicious goals. [arxiv](https://arxiv.org/pdf/2506.10949.pdf)

4. **Strategy & Experience Layer**  
   - EGUR‑style experience module that stores successful reasoning **strategies** (not just answers) and replays/adapts them on similar tasks. [arxiv](https://www.arxiv.org/pdf/2511.11519.pdf)
   - Use Recursive Knowledge Synthesis and ReDel patterns for multi‑LLM and multi‑agent coordination. [arxiv](https://arxiv.org/html/2408.02248v1)

