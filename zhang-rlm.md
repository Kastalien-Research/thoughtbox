# Recursive Language Models: Technical deep-dive for implementation

**The Zhang et al. "Recursive Language Models" paper (arXiv:2512.24601) introduces a fundamentally different approach to long-context processing than embedding-based retrieval**. Rather than dependency graphs or database storage, RLMs treat input context as a Python variable within a REPL environment, allowing the model to programmatically examine, decompose, and recursively call itself over snippets. This achieves up to **100x context scaling** beyond model limits while outperforming base models by **2x** on information-dense tasks—at comparable or lower cost.

The core insight: long prompts should never be fed directly into the Transformer. Instead, they become objects in an external environment the LLM can symbolically interact with. This sidesteps context rot entirely by ensuring no single LLM call ever receives the full massive context.

## The REPL-based architecture differs from RAG fundamentally

RLMs do **not** use dependency graphs, databases, or pointer-based retrieval. The mechanism is considerably simpler:

The context `C` is loaded as a Python string variable inside a persistent REPL (Read-Eval-Print Loop) environment. The "root LM" (depth=0) receives only the **query** plus metadata about the context (total length, chunk sizes), never the context itself. The LLM then writes Python code to interact with this variable—slicing, regex filtering, chunking—and can spawn "recursive LM" calls (depth=1) over any substring.

The formal interface replaces `llm.completion(prompt, model)` with `rlm.completion(query, context, model)`. Under the hood:

```python
# Simplified RLM flow
context = "..."  # Loaded as variable, never in prompt
while not done:
    code = root_lm.generate()  # Model outputs Python code
    output = exec(code)        # REPL executes, returns truncated output
    if "FINAL(" in code or "FINAL_VAR(" in code:
        return extract_answer()
```

The root LM can call `llm_query(sub_query, sub_context)` inside its code to spawn sub-LM calls with isolated contexts. These sub-LMs handle ~500K characters each, meaning the model can partition arbitrarily large contexts into manageable recursive calls.

## Five emergent patterns define how RLMs navigate context

Without explicit training, frontier models exhibit consistent strategies when operating as RLMs:

**Peeking**: The root LM starts blind to context contents—it only knows the size. Models consistently begin by printing small slices (`context[:2000]`) to understand structure before deciding on strategy. This adaptive probing prevents wasted computation on irrelevant context regions.

**Grepping/Filtering**: Rather than semantic retrieval, RLMs use programmatic filtering. Regex queries narrow search space based on model priors about likely keywords. For a query about "festival celebrations," GPT-5 might search `re.findall(r'festival|celebration|La Union', context)` to identify relevant chunks before deeper analysis.

**Partition + Map**: For information-dense tasks requiring semantic understanding (not just keyword matching), models chunk context and launch parallel sub-LM calls. On OOLONG benchmarks, Qwen3-Coder partitions 3000+ lines into chunks, asking each sub-LM to label entries semantically, then aggregates results.

**Summarization**: RLMs naturally generalize context-condensation approaches—they summarize subsets for the outer LM to make higher-level decisions, but crucially can return to original context when summaries prove insufficient.

**Long-output stitching**: For tasks requiring unbounded output (generating BibTeX for all papers in a list), RLMs store sub-LM outputs in REPL variables and concatenate them via `FINAL_VAR(answer_var)`, bypassing single-call output limits.

## Implementation details from the official codebase

The reference implementation at `github.com/alexzhang13/rlm` provides the production-ready architecture. Key components:

**RLM initialization** accepts backend configuration (OpenAI, Anthropic, LiteLLM), environment type (local, Docker, Modal sandbox, Prime Intellect sandbox), and optional logging:

```python
from rlm import RLM
from rlm.logger import RLMLogger

logger = RLMLogger(log_dir="./logs")
rlm = RLM(
    backend="openai",
    backend_kwargs={"model_name": "gpt-5-nano"},
    environment="local",  # or "modal", "prime", "docker"
    recursive_model="gpt-5-mini",  # cheaper model for sub-calls
    logger=logger,
    verbose=True
)

result = rlm.completion(
    query="Summarize the key findings",
    context=massive_document  # Stored as variable, not tokenized
)
```

**The system prompt** (fixed across all experiments) instructs the root LM about the REPL environment, context variable, and `llm_query` function. Critical excerpt:

> "Your context is a {context_type} with {context_total_length} total characters... The REPL environment is initialized with: 1) A `context` variable containing extremely important information. 2) A `llm_query` function that allows you to query an LLM (that can handle around 500K chars) inside your REPL environment. 3) The ability to use `print()` statements to view truncated output..."

**Answer extraction** uses two mechanisms: `FINAL(answer)` for direct string output, or `FINAL_VAR(variable_name)` to return the contents of a REPL variable (essential for long-output tasks where the answer was built up programmatically).

**Recursion depth**: The paper uses max depth=1 (root calls LMs, not other RLMs). The authors note deeper recursion is trivial to implement but unnecessary for current benchmarks. For Thoughtbox, depth=1 should suffice for most use cases.

## Retrieval comparison reveals when RLMs beat embedding-based approaches

The paper directly compares against BM25 retrieval in ReAct loops. On **BrowseComp-Plus** (multi-hop questions over 1000 documents, ~8M tokens):

| Method | Accuracy | Cost/Query |
|--------|----------|------------|
| GPT-5 + Pre-query BM25 | ~45% | ~$0.50 |
| ReAct + GPT-5 + BM25 | ~75% | ~$0.71 |
| RLM(GPT-5) | **91.33%** | $0.99 |

RLMs excel because multi-hop questions require associating information across documents—you can't know a retrieved document is correct until you've found the connecting documents. BM25 retrieves in isolation; RLMs can iteratively narrow context based on partial findings.

On **OOLONG** (semantic aggregation over 3000+ entries), retrieval fails entirely because tasks require processing *every* entry (e.g., "count entries matching semantic label X"). There's nothing to retrieve—you need comprehensive coverage. RLM(GPT-5-mini) scored **56.5** vs GPT-5's **44.0** despite fitting in GPT-5's context window, demonstrating RLMs prevent context rot even for in-window contexts.

The **cost comparison** is particularly relevant: RLMs achieve **3x cheaper** costs than summarization baselines that must ingest full context, because RLMs selectively view only relevant portions.

## Quantitative results show consistent 28-114% improvements

Performance summary across benchmarks (from Table 1):

| Benchmark | Task Type | GPT-5 Base | RLM(GPT-5) | Improvement |
|-----------|-----------|------------|------------|-------------|
| OOLONG | Linear aggregation | 44.00 | 56.50 | +28.4% |
| OOLONG-Pairs | Quadratic aggregation | 0.04 | 58.00 | +1450x |
| BrowseComp+ (1K) | Multi-hop retrieval | 0.00* | 91.33 | ∞ (base fails) |
| CodeQA | Repository understanding | 24.00* | 62.00 | +158% |

*Asterisks indicate context exceeded model limits; base model truncated or failed.

The OOLONG-Pairs result is striking: base GPT-5 achieves F1 of **0.04** (essentially random) on tasks requiring pairwise reasoning across entries, while RLM achieves **58.0**. The recursive decomposition enables quadratically-scaling problems that are otherwise intractable.

## Limitations inform implementation tradeoffs

**No training**: Current results use off-the-shelf frontier models. The authors hypothesize RLM-specific training (learning optimal partitioning strategies via RL) would yield significant further gains. For Thoughtbox, fine-tuning on domain-specific context-navigation trajectories could be valuable future work.

**High variance costs**: While median RLM costs are comparable to base models, tail costs can be significantly higher due to long trajectories on complex tasks. The 95th percentile cost is ~3x the median. Implementing timeout/iteration limits is essential.

**Synchronous sub-calls**: The reference implementation makes blocking sequential sub-LM calls. Asynchronous parallelization would dramatically reduce latency for partition+map strategies. This is explicitly listed as low-hanging optimization fruit.

**Model capability floor**: Smaller models (Qwen3-8B) struggle as RLMs due to insufficient coding ability to manipulate context effectively. The approach requires models capable of generating correct Python code reliably.

**Depth=1 only evaluated**: The paper doesn't explore deeper recursion (RLMs calling RLMs). For hierarchically structured contexts (e.g., documents → sections → paragraphs → sentences), deeper recursion might enable more efficient navigation.

## Practical guidance for Thoughtbox implementation

When implementing a similar system:

The RLM approach **does not require** building dependency graphs or database storage systems. The elegant insight is that a Python variable *is* the data structure—the LLM's code-writing ability provides the "pointers" via string slicing and variable assignment.

For production deployment, consider:
- **Use isolated sandboxes** (Modal or Docker) for code execution to prevent security issues from LLM-generated code
- **Implement cost caps** and iteration limits to bound tail latency
- **Log trajectories** using the `RLMLogger` for debugging and identifying inefficient model strategies  
- **Use cheaper sub-models** for recursive calls (GPT-5-mini for sub-calls when GPT-5 is root)
- **Consider domain-specific system prompts** hinting at expected context structure

The minimal implementation at `github.com/alexzhang13/rlm-minimal` provides a stripped-down starting point (~200 lines) suitable for prototyping before adopting the full library.