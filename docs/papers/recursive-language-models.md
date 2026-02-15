[![logo](https://services.dev.arxiv.org/html/static/arxiv-logomark-small-white.svg)Back to arXiv](https://arxiv.org/)

[Back to abstract page](https://arxiv.org/abs/2512.24601v2)

[![logo](https://services.dev.arxiv.org/html/static/arxiv-logo-one-color-white.svg)Back to arXiv](https://arxiv.org/)

This is **experimental HTML** to improve accessibility. We invite you to report rendering errors. Use Alt+Y to toggle on accessible reporting links and Alt+Shift+Y to toggle off. Learn more [about this project](https://info.arxiv.org/about/accessible_HTML.html) and [help improve conversions](https://info.arxiv.org/help/submit_latex_best_practices.html).


[Why HTML?](https://info.arxiv.org/about/accessible_HTML.html) [Report Issue](https://arxiv.org/html/2512.24601v2/#myForm) [Back to Abstract](https://arxiv.org/abs/2512.24601v2) [Download PDF](https://arxiv.org/pdf/2512.24601v2)

## Table of Contents

01. [Abstract](https://arxiv.org/html/2512.24601v2#abstract "Abstract")
02. [1 Introduction](https://arxiv.org/html/2512.24601v2#S1 "In Recursive Language Models")
03. [2 Recursive Language Models](https://arxiv.org/html/2512.24601v2#S2 "In Recursive Language Models")
04. [3 Scaling Long Context Tasks](https://arxiv.org/html/2512.24601v2#S3 "In Recursive Language Models")    1. [3.1 Tasks](https://arxiv.org/html/2512.24601v2#S3.SS1 "In 3 Scaling Long Context Tasks ‣ Recursive Language Models")
    2. [3.2 Methods and Baselines](https://arxiv.org/html/2512.24601v2#S3.SS2 "In 3 Scaling Long Context Tasks ‣ Recursive Language Models")
05. [4 Results and Discussion](https://arxiv.org/html/2512.24601v2#S4 "In Recursive Language Models")    1. [4.1 Emergent Patterns in RLM Trajectories](https://arxiv.org/html/2512.24601v2#S4.SS1 "In 4 Results and Discussion ‣ Recursive Language Models")
06. [5 Related Works](https://arxiv.org/html/2512.24601v2#S5 "In Recursive Language Models")
07. [6 Limitations and Future Work](https://arxiv.org/html/2512.24601v2#S6 "In Recursive Language Models")
08. [7 Conclusion](https://arxiv.org/html/2512.24601v2#S7 "In Recursive Language Models")
09. [8 Impact Statement](https://arxiv.org/html/2512.24601v2#S8 "In Recursive Language Models")
10. [A Additional Training Details](https://arxiv.org/html/2512.24601v2#A1 "In Recursive Language Models")
11. [B Negative Results: Things we Tried that Did Not Work.](https://arxiv.org/html/2512.24601v2#A2 "In Recursive Language Models")
12. [C Additional Methods and Baseline Details](https://arxiv.org/html/2512.24601v2#A3 "In Recursive Language Models")    1. [C.1 Prompts for Experiments](https://arxiv.org/html/2512.24601v2#A3.SS1 "In Appendix C Additional Methods and Baseline Details ‣ Recursive Language Models")
    2. [C.2 Summary agent baseline](https://arxiv.org/html/2512.24601v2#A3.SS2 "In Appendix C Additional Methods and Baseline Details ‣ Recursive Language Models")
13. [D Additional Benchmark Details](https://arxiv.org/html/2512.24601v2#A4 "In Recursive Language Models")    1. [D.1 OOLONG-Pairs Benchmark](https://arxiv.org/html/2512.24601v2#A4.SS1 "In Appendix D Additional Benchmark Details ‣ Recursive Language Models")
    2. [D.2 Scaling Huge Document Corpuses in BrowseComp+](https://arxiv.org/html/2512.24601v2#A4.SS2 "In Appendix D Additional Benchmark Details ‣ Recursive Language Models")
14. [E Additional RLM Trajectories](https://arxiv.org/html/2512.24601v2#A5 "In Recursive Language Models")    1. [E.1 RLM(GPT-5) on BrowseComp-Plus-Query\_74](https://arxiv.org/html/2512.24601v2#A5.SS1 "In Appendix E Additional RLM Trajectories ‣ Recursive Language Models")
    2. [E.2 RLM(Qwen3-Coder) on OOLONG-Pairs-Query\_3](https://arxiv.org/html/2512.24601v2#A5.SS2 "In Appendix E Additional RLM Trajectories ‣ Recursive Language Models")
    3. [E.3 RLM(Qwen3-Coder) on OOLONG-Query\_212](https://arxiv.org/html/2512.24601v2#A5.SS3 "In Appendix E Additional RLM Trajectories ‣ Recursive Language Models")
    4. [E.4 RLM(GPT-5) on CodeQA-Query\_44](https://arxiv.org/html/2512.24601v2#A5.SS4 "In Appendix E Additional RLM Trajectories ‣ Recursive Language Models")
15. [F Additional Runtime and Cost Analysis of RLMs](https://arxiv.org/html/2512.24601v2#A6 "In Recursive Language Models")
16. [References](https://arxiv.org/html/2512.24601v2#bib "References")

[License: CC BY 4.0](https://info.arxiv.org/help/license/index.html#licenses-available)

arXiv:2512.24601v2 \[cs.AI\] 28 Jan 2026

# Recursive Language Models

Report issue for preceding element

Alex L. Zhang
Tim Kraska
Omar Khattab

Report issue for preceding element

###### Abstract

Report issue for preceding element

We study allowing large language models (LLMs) to process arbitrarily long prompts through the lens of inference-time scaling. We propose Recursive Language Models (RLMs), a general inference paradigm that treats long prompts as part of an external environment and allows the LLM to programmatically examine, decompose, and recursively call itself over snippets of the prompt.
We find that RLMs can successfully process inputs up to two orders of magnitude beyond model context windows and, even for shorter prompts, dramatically outperform the quality of vanilla frontier LLMs and common long-context scaffolds across four diverse long-context tasks while having comparable cost.
At a small scale, we post-train the first natively recursive language model. Our model, RLM-Qwen3-8B, outperforms the underlying Qwen3-8B model by 28.3%28.3\\% on average and even approaches the quality of vanilla GPT-5 on three long-context tasks. Code is available at [https://github.com/alexzhang13/rlm](https://github.com/alexzhang13/rlm "").

Report issue for preceding element

Machine Learning, ICML

## 1 Introduction

Report issue for preceding element![Refer to caption](https://arxiv.org/html/2512.24601v2/x1.png)Figure 1: A comparison of GPT-5 and a corresponding RLM using GPT-5 on three long-context tasks of increasing complexity: S-NIAH, OOLONG, and OOLONG-Pairs. For each task, we scale the input length from 2132^{13} to 2182^{18}. GPT-5 performance degrades significantly as a function of both input length and task complexity, while the RLM maintains strong performance.
Inputs beyond the red region do not fit in GPT-5’s context window of 272K tokens, but the RLM handles them effectively. Additional experiments across other models and benchmarks are in § [3](https://arxiv.org/html/2512.24601v2#S3 "3 Scaling Long Context Tasks ‣ Recursive Language Models").
Report issue for preceding element

Frontier reasoning models have limited context windows and, even within their limits, tend to exhibit context rot(Hong et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib37 "Context rot: how context degradation affects llm performance")), a phenomenon illustrated in Figure [1](https://arxiv.org/html/2512.24601v2#S1.F1 "Figure 1 ‣ 1 Introduction ‣ Recursive Language Models") where quality degrades steeply as prompts get longer. Though we expect context lengths to steadily rise through improvements to training, architecture, and infrastructure, we are interested in whether it is possible to scale the context size of general-purpose LLMs by orders of magnitude. This is increasingly urgent as LLMs begin to be widely adopted for long-horizon tasks, in which they must routinely process tens if not hundreds of millions of tokens.

Report issue for preceding element

We study this question through the lens of scaling inference-time compute. We are inspired by the way that reasoning models have become the fundamental interface to LLMs, resulting not only in empirical gains but also additional theoretical expressive power (Merrill and Sabharwal, [2024](https://arxiv.org/html/2512.24601v2#bib.bib51 "The expressive power of transformers with chain of thought")) compared to vanilla Transformers. Though most inference-time methods for dealing with long context are task-specific (Wu et al., [2021](https://arxiv.org/html/2512.24601v2#bib.bib52 "Recursively summarizing books with human feedback"); Chang et al., [2024](https://arxiv.org/html/2512.24601v2#bib.bib53 "BooookScore: a systematic exploration of book-length summarization in the era of LLMs")), the most popular general approach is context condensation or compaction(Khattab et al., [2021](https://arxiv.org/html/2512.24601v2#bib.bib16 "Baleen: robust multi-hop reasoning at scale via condensed retrieval"); Smith, [2025](https://arxiv.org/html/2512.24601v2#bib.bib17 "OpenHands context condensensation for more efficient ai agents"); OpenAI, [2025a](https://arxiv.org/html/2512.24601v2#bib.bib21 "Codex cli: a lightweight coding agent for your terminal"); Wu et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib5 "ReSum: unlocking long-horizon search intelligence via context summarization")), where context from user requests or agent trajectories is repeatedly summarized once it exceeds a length threshold. Unfortunately, compaction is rarely expressive enough for tasks that require dense access throughout the prompt. It presumes that some details that appear early in the prompt can safely be forgotten to make room for new content.

Report issue for preceding element

![Refer to caption](https://arxiv.org/html/2512.24601v2/figures/Fig2.png)Figure 2: A Recursive Language Model (RLM) treats prompts as part of the environment. It loads the input prompt as a variable inside a REPL environment ℰ\\mathcal{E} and writes code to peek into, decompose, and invoke itself recursively over programmatic snippets of the variable.Report issue for preceding element

We introduce Recursive Language Models (RLMs), a general-purpose inference paradigm for dramatically scaling the effective input and output lengths of LLMs. The key insight is that arbitrarily long user prompts should not be fed into the neural network (e.g., Transformer) directly but should instead be treated as part of the environment that the LLM is tasked to symbolically and recursively interact with.

Report issue for preceding element

As Figure [2](https://arxiv.org/html/2512.24601v2#S1.F2 "Figure 2 ‣ 1 Introduction ‣ Recursive Language Models") shows, an RLM exposes the same external interface as an LLM or a reasoning model: it accepts a string prompt of arbitrary structure and produces a string response. Given a prompt PP, the RLM initializes a Read-Eval-Print Loop (REPL) programming environment in which PP is set as the value of a variable. It then offers the LLM general context about the REPL environment (e.g., the length of the string PP), and permits it to write code that peeks into and decomposes PP, and to iteratively observe any side effects from execution. Crucially, RLMs encourage the LLM to understand, transform, and execute the input prompt by writing symbolic programs that invoke the LLM itself on as many slices of the input as necessary.

Report issue for preceding element

By treating the prompt itself as an external object and enabling symbolic recursion, RLMs tackle limitations of expressive power in recent work on coding agents, retrieval agents, and sub-agent delegation. In particular, prior coding agents and retrieval agents treat some designated external data source (e.g., a filesystem or a corpus of search documents) as an environment for fetching snippets. However, they can only fill up the underlying LLM’s context window with snippets before breaking down. Similarly, prior self-delegation approaches (Anthropic, [2025](https://arxiv.org/html/2512.24601v2#bib.bib22 "Claude code: subagents — modular ai workflows with isolated agent contexts"); Sentient AI, [2025](https://arxiv.org/html/2512.24601v2#bib.bib47 "ROMA: the backbone for open-source meta-agents"); Schroeder et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib27 "THREAD: thinking deeper with recursive spawning"); Sun et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib25 "Scaling long-horizon llm agent via context-folding")) allow LLMs to invoke themselves as sub-agents. However, they are handicapped by the underlying LLM’s limited output lengths because they are designed to verbalize sub-calls autoregressively rather than producing them programmatically.

Report issue for preceding element

We evaluate RLMs using a frontier closed model (GPT-5; Singh et al. [2025](https://arxiv.org/html/2512.24601v2#bib.bib1 "OpenAI gpt-5 system card")) and a frontier open model (Qwen3-Coder-480B-A35B; Qwen Team [2025b](https://arxiv.org/html/2512.24601v2#bib.bib41 "Qwen3-coder-480b-a35b-instruct")) across four tasks with varying levels of complexity: deep research (Chen et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib12 "BrowseComp-plus: a more fair and transparent evaluation benchmark of deep-research agent")), information aggregation (Bertsch et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib11 "Oolong: evaluating long context reasoning and aggregation capabilities")), code repository understanding (Bai et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib8 "LongBench v2: towards deeper understanding and reasoning on realistic long-context multitasks")), and a synthetic pairwise reasoning task where even frontier models fail catastrophically. We compare RLMs against direct LLM calls as well as context compaction, retrieval tool-use agents, and code-generation agents.

Report issue for preceding element

We find that RLMs demonstrate extremely strong performance even at the 10M+ token scale, and substantially outperform all other approaches at long-context processing, in many cases by double-digit percentage gains while maintaining comparable cost. In particular, as demonstrated in Figure [1](https://arxiv.org/html/2512.24601v2#S1.F1 "Figure 1 ‣ 1 Introduction ‣ Recursive Language Models"), RLMs exhibit far less severe degradation for longer contexts and more sophisticated tasks.

Report issue for preceding element

Finally, at a small scale, we post-train the first natively recursive language model, demonstrating that RLMs can be improved quickly with little additional training. While a small open model (Qwen3-8B; Yang et al. [2025](https://arxiv.org/html/2512.24601v2#bib.bib44 "Qwen3 technical report")) struggles to solve long context tasks even in an RLM scaffold, our simple general-purpose training recipe uses only 1,000 samples from unrelated domains to improve its performance by a median of 28.3%28.3\\% across the four evaluation tasks.

Report issue for preceding element

## 2 Recursive Language Models

Report issue for preceding element

Given a base neural language model ℳ\\mathcal{M} with maximum context size KK, a Recursive Language Model (RLM) is an inference-time scaffold around ℳ\\mathcal{M} that treats the user prompt as part of the environment without giving up the ability to densely process its content through different calls to ℳ\\mathcal{M}.
Given an arbitrary-length prompt string P∈Σ⋆P\\in\\Sigma^{\\star}, an RLM interacts with a persistent external environment ℰ\\mathcal{E} and returns a response string Y∈Σ⋆Y\\in\\Sigma^{\\star} (Figure [2](https://arxiv.org/html/2512.24601v2#S1.F2 "Figure 2 ‣ 1 Introduction ‣ Recursive Language Models")).
We would like effectively _unbounded input tokens_ (\|P\|≫K\|P\|\\gg K), _unbounded output tokens_, and an _unbounded semantic horizon_, e.g. the ability to do Ω​(\|P\|)\\Omega(\|P\|) or Ω​(\|P\|2)\\Omega(\|P\|^{2}) semantic work.

Report issue for preceding element

Algorithm [1](https://arxiv.org/html/2512.24601v2#alg1 "Algorithm 1 ‣ 2 Recursive Language Models ‣ Recursive Language Models") describes how an RLM achieves this. Given a prompt PP, the RLM initializes a persistent REPL programming environment with a variable containing the user prompt as a string and a function for invoking a sub-RLM with a new prompt. Then, it starts the RLM loop. In the first iteration, the algorithm invokes the root neural model ℳ\\mathcal{M} with only (constant-size) metadata about the user prompt, like its length, a short prefix, and how to access parts of it.

Report issue for preceding element

The root is instructed via prompting (Appendix [C](https://arxiv.org/html/2512.24601v2#A3 "Appendix C Additional Methods and Baseline Details ‣ Recursive Language Models")) and/or fine-tuning (Appendix [A](https://arxiv.org/html/2512.24601v2#A1 "Appendix A Additional Training Details ‣ Recursive Language Models")) to operate like an RLM: that is, to generate code that helps it understand and transform its parts of its prompt PP, and to build up intermediate values and the final response into new variables, potentially by invoking the sub-RLM within loops. In Section [4](https://arxiv.org/html/2512.24601v2#S4 "4 Results and Discussion ‣ Recursive Language Models"), we find that existing LLMs can be prompted to do this and that training an 8B model to be natively recursive is promising.

Report issue for preceding element

Each iteration of the RLM loop executes code in the REPL, updates REPL state (intermediate variables), and collects in stdout any printed text. Only (constant-size) metadata about stdout, like a short prefix and length, is appended to ℳ\\mathcal{M}’s history for the next iteration.111This is key: it forces ℳ\\mathcal{M} to rely on variables and sub-calls to manage long strings instead of polluting its window. In principle, if we trim each turn to cc tokens, we will have at most K/cK/c root iterations, each of which can launch arbitrarily many sub-calls. This is not a fundamental limitation, e.g. one could move the root horizon itself into a variable, but we typically want to limit the iterations at any level of recursion irrespective. Once the RLM sets the variable Final inside the REPL, iteration stops and the value in Final is returned as the response.

Report issue for preceding element

RLMs make three simple design choices that are missing from existing scaffolds. To highlight these, we include Algorithm [2](https://arxiv.org/html/2512.24601v2#alg2 "Algorithm 2 ‣ 2 Recursive Language Models ‣ Recursive Language Models") to illustrate a deceptively “similar” algorithm that is far less expressive. Both algorithms support some notion of sub-calls, external objects, and code execution, but they differ in terms of where the prompt and intermediate values live and where recursion occurs.

Report issue for preceding element

Algorithm 1 A recursive language model, around LLM ℳ\\mathcal{M}

Input:prompt PP

Report issue for preceding element

Output:response YY

Report issue for preceding element

state←\\leftarrowInitREPL(prompt=P)

Report issue for preceding element

state←\\leftarrowAddFunction(state,  sub\_RLMM)

Report issue for preceding element

hist←\[Metadata(state)\]\\leftarrow\[\\texttt{Metadata(state)}\]

Report issue for preceding element

while _True_ do

Report issue for preceding element

code←\\leftarrowLLMM(hist)
(state, stdout) ←\\leftarrowREPL(state, code)hist←\\leftarrowhist∥\\,\\\|\\,code∥\\,\\\|\\,Metadata(stdout)if _state\[Final\] is set_ then

returnstate\[Final\]

Report issue for preceding elementAlgorithm 2 Alternate scaffold with standard (poor) design choices for prompts, sub-calls, and code execution

Input:prompt PP

Report issue for preceding element

Output:response YY

Report issue for preceding element

actions←{Finish,Exec,Search,sub\_LLMℳ}\\leftarrow\\{\\texttt{Finish},\\,\\texttt{Exec},\\,\\texttt{Search},\\,{\\color\[rgb\]{0.78515625,0,0.78515625}\\definecolor\[named\]{pgfstrokecolor}{rgb}{0.78515625,0,0.78515625}\\texttt{sub\\\_LLM}}\_{\\mathcal{M}}\\}

Report issue for preceding element

hist←\[Metadata(actions),P\]\\leftarrow\[\\texttt{Metadata(actions)},\\,P\]

Report issue for preceding element

//  Flaw #1while _True_ do


(action, val) ←\\leftarrowLLMM(hist)if _action is Finish_ then

returnval

//  Flaw #2

out←\\leftarrowRUN(action, val)

//  Flaw #3hist←\\leftarrowhist∥\\\| (action, val, out)
if _Tok(hist) \> K_ then

hist←\\leftarrowCompact(hist)

Report issue for preceding element

First, an RLM must give the underlying LLM ℳ\\mathcal{M} a _symbolic handle_ to the user prompt PP, so the model can manipulate it without copying text into the root context window. Instead, ineffective Algorithm [2](https://arxiv.org/html/2512.24601v2#alg2 "Algorithm 2 ‣ 2 Recursive Language Models ‣ Recursive Language Models") starts by putting the user prompt PP into the LLM context window (hist) and thus inherits the window limitations of ℳ\\mathcal{M} and falls back to heuristics like context compaction. Even though the scaffold can access external data with, say, a Search action or filesystem access, it is fatally bounded with respect to user input.

Report issue for preceding element

Second, ineffective Algorithm [2](https://arxiv.org/html/2512.24601v2#alg2 "Algorithm 2 ‣ 2 Recursive Language Models ‣ Recursive Language Models") asks ℳ\\mathcal{M} to autoregressively generate the output directly, via a Finish action. This may seem innocuous, but it means that it also cannot generate longer outputs than the context window of ℳ\\mathcal{M} permits.

Report issue for preceding element

Third, and perhaps most importantly, an RLM requires _symbolic recursion_. That is, code running _inside_ ℰ\\mathcal{E} must be able to invoke ℳ\\mathcal{M} on programmatically constructed transformations of PP (e.g., inside arbitrarily large loops), storing intermediate results symbolically. Though Algorithm [2](https://arxiv.org/html/2512.24601v2#alg2 "Algorithm 2 ‣ 2 Recursive Language Models ‣ Recursive Language Models") includes both a code execution action and a “sub-LLM” action separately, it is not able to invoke the sub-LLM programmatically and hence can only delegate a few explicitly verbalized tasks rather than writing short programs that can, say, loop over slices of the prompt and launch Ω​(\|P\|)\\Omega(\|P\|) or even Ω​(\|P\|2)\\Omega(\|P\|^{2}) processes to understand or transform all parts of PP.

Report issue for preceding element

## 3 Scaling Long Context Tasks

Report issue for preceding element

We hypothesize that the effective context window (Hsieh et al., [2024](https://arxiv.org/html/2512.24601v2#bib.bib13 "RULER: what’s the real context size of your long-context language models?"); Goldman et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib23 "Is it really long context if all you need is retrieval? towards genuinely difficult long context nlp"); Hong et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib37 "Context rot: how context degradation affects llm performance")) of an LLM cannot be understood independently of the specific task. That is, more “complex” problems will exhibit degradation at even shorter lengths than simpler ones. Because of this, we must characterize tasks in terms of how their complexity scales with prompt length.

Report issue for preceding element

For example, needle-in-a-haystack (NIAH) problems generally keep ‘needles’ constant as prompt length is scaled. As a result, frontier models can now reliably solve these tasks in RULER (Hsieh et al., [2024](https://arxiv.org/html/2512.24601v2#bib.bib13 "RULER: what’s the real context size of your long-context language models?")) in the 1M+ token settings but struggle at far shorter lengths on OOLONG (Bertsch et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib11 "Oolong: evaluating long context reasoning and aggregation capabilities")), a task where the answer depends explicitly on almost every line in the prompt.222This helps explain the patterns seen in Figure [1](https://arxiv.org/html/2512.24601v2#S1.F1 "Figure 1 ‣ 1 Introduction ‣ Recursive Language Models") earlier: GPT-5 scales effectively on the S-NIAH task, where the needle size is constant despite longer prompts, but shows faster degradation at increasingly shorter context lengths on the linear-complexity OOLONG and the quadratic-complexity OOLONG-Pairs.

Report issue for preceding element

### 3.1 Tasks

Report issue for preceding element

We design our evaluation around tasks where we can vary the lengths of the prompts, so we can consider problems whose difficulties scale differently with context length.

Report issue for preceding element

S-NIAH. Following the single needle-in-the-haystack task in RULER (Hsieh et al., [2024](https://arxiv.org/html/2512.24601v2#bib.bib13 "RULER: what’s the real context size of your long-context language models?")), we consider a set of 50 single tasks that require finding a specific phrase or number in a large set of unrelated text. Here, the information being sought scales as O​(1)O(1) with respect to input length.

Report issue for preceding element

BrowseComp-Plus (1K documents)(Chen et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib12 "BrowseComp-plus: a more fair and transparent evaluation benchmark of deep-research agent")). A multi-hop question-answering benchmark for DeepResearch (OpenAI, [2025b](https://arxiv.org/html/2512.24601v2#bib.bib15 "Deep research")) questions that requires reasoning over multiple different documents. The benchmark provides a verified offline corpus that is guaranteed to contain gold, evidence, and hard negative documents for each question. Following Sun et al. ( [2025](https://arxiv.org/html/2512.24601v2#bib.bib25 "Scaling long-horizon llm agent via context-folding")), we use 150 randomly sampled instances as our evaluation set; we provide 10001000 randomly chosen documents as input, in which the gold and evidence documents are guaranteed to exist. We report the percentage of correct answers. The answer to each task requires piecing together information from several documents, making this harder than S-NIAH despite also requiring a constant number of documents.

Report issue for preceding element

OOLONG(Bertsch et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib11 "Oolong: evaluating long context reasoning and aggregation capabilities")). A long reasoning benchmark that requires transforming chunks of the input semantically, then aggregating these chunks to form a final answer. We report scoring based on the original paper, which scores numerical answers as score​(y^)=0.75\|y−y^\|\\texttt{score}(\\hat{y})=0.75^{\|y-\\hat{y}\|} and other answers as exact match. We focus specifically on the trec\_coarse split, a set of 5050 tasks over a dataset of questions with semantic labels. Each task requires using nearly all entries of the dataset, and therefore scales linearly in processing complexity relative to the input length.

Report issue for preceding element

OOLONG-Pairs. We modify the trec\_coarse split of OOLONG to include 2020 new queries that specifically require aggregating pairs of chunks to construct the final answer. We report F1 scores over the answer. Each task requires using nearly all pairs of entries of the dataset, and therefore requires processing quadratically-many items relative to the input length. In Appendix [D.1](https://arxiv.org/html/2512.24601v2#A4.SS1 "D.1 OOLONG-Pairs Benchmark ‣ Appendix D Additional Benchmark Details ‣ Recursive Language Models"), we provide all queries in this benchmark.

Report issue for preceding element

Table 1: Performance comparison of different methods across long-context benchmarks of varying complexity. In gray is the average API cost ±\\pm the standard deviation of each method on each task. ∗ indicates runs where a method (sometimes) ran into input context limits. Provider costs were computed under OpenAI for GPT-5 and Fireworks for other models. Non-zero scores are rounded to at least 0.10.1.

| Model | CodeQA | BrowseComp+ (1K) | OOLONG | OOLONG-Pairs |
| Task Length NN (tokens) | 23K-4.2M | 6M-11M | 131K | 32K |
| GPT-5(with RLM sub-calls to GPT-5-mini) |
| Base Model | 24.0∗($0.13 ±\\pm $0.07) | 0.0∗(N/A) ±\\pm (N/A) | 44.0 ($0.14 ±\\pm $0.02) | 0.1 ($0.16 ±\\pm $0.10) |
| CodeAct (+ BM25) | 22.0∗($0.06 ±\\pm $0.08) | 51.0 ($0.71 ±\\pm $1.20) | 38.0 ($0.61 ±\\pm $1.06) | 24.7 ($0.75 ±\\pm $0.43) |
| CodeAct (+ sub-calls) | 24.0∗($0.06 ±\\pm $0.08) | 0.0∗(N/A) ±\\pm (N/A) | 40.0 ($0.85 ±\\pm $1.27) | 28.4 ($1.11 ±\\pm $0.62) |
| Summary agent | 58.0 ($1.31 ±\\pm $1.46) | 70.5 ($0.57 ±\\pm $0.10) | 46.0 ($0.13 ±\\pm $0.01) | 0.1 ($0.13 ±\\pm $0.09) |
| RLM | 62.0($0.11 ±\\pm $0.10) | 91.3($0.99 ±\\pm $1.22) | 56.5($0.43 ±\\pm $0.85) | 58.0($0.33 ±\\pm $0.20) |
| RLM (no sub-calls) | 58.0 ($0.18 ±\\pm $0.56) | 88.0 ($0.44 ±\\pm $0.90) | 36.0 ($0.37 ±\\pm $0.42) | 43.9 ($0.69 ±\\pm $1.16) |
| Qwen3-Coder-480B-A35B |
| Base Model | 20.0∗($0.13 ±\\pm $0.08) | 0.0∗(N/A) ±\\pm (N/A) | 36.0 ($0.06 ±\\pm $0.00) | 0.1 ($0.05 ±\\pm $0.01) |
| CodeAct (+ BM25) | 24.0∗($0.17 ±\\pm $0.08) | 12.7 ($0.39 ±\\pm $0.50) | 38.0 ($1.51 ±\\pm $1.09) | 0.3 ($1.54 ±\\pm $0.35) |
| CodeAct (+ sub-calls) | 26.0∗($0.28 ±\\pm $0.30) | 0.0∗(N/A) ±\\pm (N/A) | 32.0 ($1.83 ±\\pm $1.14) | 0.1 ($1.49 ±\\pm $0.46) |
| Summary agent | 50.0 ($1.26 ±\\pm $1.50) | 38.0 ($8.98 ±\\pm $2.12) | 44.1 ($0.15 ±\\pm $0.01) | 0.31 ($0.05 ±\\pm $0.00) |
| RLM | 56.0 ($0.92 ±\\pm $1.23) | 44.7 ($0.84 ±\\pm $0.63) | 48.0($0.61 ±\\pm $0.49) | 23.1($1.02 ±\\pm $0.52) |
| RLM (no sub-calls) | 66.0($0.18 ±\\pm $0.58) | 46.0($0.82 ±\\pm $0.69) | 43.5 ($0.32 ±\\pm $0.13) | 17.3 ($1.77 ±\\pm $1.23) |
| Qwen3-8B |
| Base Model | 4.0∗($0.01 ±\\pm $0.00) | 0.0∗(N/A) ±\\pm (N/A) | 0.0∗(N/A) ±\\pm (N/A) | 0.1 ($0.01 ±\\pm $0.00) |
| RLM | 26.0 ($0.04 ±\\pm $0.13) | 2.0 ($0.03 ±\\pm $0.06) | 24.0 ($0.19 ±\\pm $0.26) | 4.3 ($0.05 ±\\pm $0.05) |
| RLM (fine-tuned) | 32.0($0.02 ±\\pm $0.02) | 14.0($0.01 ±\\pm $0.03) | 32.0($0.04 ±\\pm $0.09) | 5.2($0.02 ±\\pm $0.02) |

Report issue for preceding element

LongBench-v2 CodeQA(Bai et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib8 "LongBench v2: towards deeper understanding and reasoning on realistic long-context multitasks")). A multi-choice code repository understanding split from LongBench-v2 that is challenging for modern frontier models. We report the score as the percentage of correct answers. Each instance requires reasoning over a fixed number of files in a codebase to find the right answer.

Report issue for preceding element

### 3.2 Methods and Baselines

Report issue for preceding element

We compare RLMs against commonly used task-agnostic inference methods, using two modern LMs, GPT-5 with medium reasoning (Singh et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib1 "OpenAI gpt-5 system card")) and default sampling parameters, and Qwen3-Coder-480B-A35B (Yang et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib44 "Qwen3 technical report")) using the sampling parameters described in Qwen Team ( [2025b](https://arxiv.org/html/2512.24601v2#bib.bib41 "Qwen3-coder-480b-a35b-instruct")). For Qwen3-Coder-480B-A35B, we compute costs based on the compute provider Fireworks (Fireworks AI, [2025](https://arxiv.org/html/2512.24601v2#bib.bib42 "Qwen3 coder 480b a35b instruct")). In addition to evaluating the base model on all tasks, we also evaluate the following methods and baselines:

Report issue for preceding element

CodeAct (+ BM25). We compare directly to a CodeAct (Wang et al., [2024](https://arxiv.org/html/2512.24601v2#bib.bib10 "Executable code actions elicit better llm agents")) agent that can execute code inside of a ReAct (Yao et al., [2023](https://arxiv.org/html/2512.24601v2#bib.bib7 "ReAct: synergizing reasoning and acting in language models")) loop. Unlike an RLM, CodeAct does not offload the user prompt to the code environment, and instead provides it directly to the LM. Furthermore, following Jimenez et al. ( [2024](https://arxiv.org/html/2512.24601v2#bib.bib3 "SWE-bench: can language models resolve real-world github issues?")); Chen et al. ( [2025](https://arxiv.org/html/2512.24601v2#bib.bib12 "BrowseComp-plus: a more fair and transparent evaluation benchmark of deep-research agent")), we equip this agent with a BM25 (Robertson and Zaragoza, [2009](https://arxiv.org/html/2512.24601v2#bib.bib24 "The probabilistic relevance framework: bm25 and beyond")) retriever that indexes the input context for tasks where a retriever is appropriate.

Report issue for preceding element

CodeAct with sub-calls. To specifically ablate offloading the context as a variable in the REPL, we evaluate a CodeAct (Wang et al., [2024](https://arxiv.org/html/2512.24601v2#bib.bib10 "Executable code actions elicit better llm agents")) baseline with the ability to invoke sub-LM calls. Compared to RLMs, this method loads the context directly into the model.

Report issue for preceding element

Summary agent. Following Sun et al. ( [2025](https://arxiv.org/html/2512.24601v2#bib.bib25 "Scaling long-horizon llm agent via context-folding")); Wu et al. ( [2025](https://arxiv.org/html/2512.24601v2#bib.bib5 "ReSum: unlocking long-horizon search intelligence via context summarization")); Yu et al. ( [2025](https://arxiv.org/html/2512.24601v2#bib.bib6 "MemAgent: reshaping long-context llm with multi-conv rl-based memory agent")), we consider an iterative agent that compacts the context as it is filled. For example, given a corpus of documents, it will iteratively accumulate the documents and summarize when full. In cases where a single document exceeds the model window, the agent will chunk it to fit within the model context window and invoke the same strategy over these chunks. For the GPT-5 experiments, due to the extremely high cost of applying this strategy to millions of tokens, we use GPT-5-nano for compaction and GPT-5 to provide the final answer.

Report issue for preceding element

RLM with REPL. We implement an RLM with a Python REPL environment, which loads a module for querying a sub-LM and uses a system prompt presented in Appendix [C](https://arxiv.org/html/2512.24601v2#A3 "Appendix C Additional Methods and Baseline Details ‣ Recursive Language Models"). For the GPT-5 experiments, we use GPT-5-mini for the recursive LMs and GPT-5 for the root LM, as we found this choice to strike a good balance between the capabilities of RLMs and the cost of the recursive calls. We notate a RLM using a model as RLM(model), e.g. RLM(GPT-5).

Report issue for preceding element

RLM with REPL, no sub-calls. We provide an ablation of our method, in which the prompt is loaded in a REPL environment without the ability to invoke sub-LM calls.

Report issue for preceding element

Finetuning. To create RLM-Qwen3-8B, we finetune Qwen3-8B on 1,000 filtered trajectories of Qwen3-Coder-480B-A35B as an RLM with Qwen3-8B sub-calls on LongBenchPro (Chen et al., [2026](https://arxiv.org/html/2512.24601v2#bib.bib55 "LongBench pro: a more realistic and comprehensive bilingual long-context evaluation benchmark")) tasks. We use sampling parameters described in Qwen Team ( [2025a](https://arxiv.org/html/2512.24601v2#bib.bib43 "Qwen3-8b")), and evaluate the fine-tuned RLM-Qwen3-8B as an RLM on our long context tasks. The key insight for training is that being an effective sub-call model is roughly similar to being a general purpose reasoning model, so we can make the training much more tractable (and seemingly short-horizon) at small scale by focusing on improving the root model’s ability to manipulate the REPL and to launch recursive calls. We provide more training details in Appendix [A](https://arxiv.org/html/2512.24601v2#A1 "Appendix A Additional Training Details ‣ Recursive Language Models").

Report issue for preceding element

## 4 Results and Discussion

Report issue for preceding element

Table [1](https://arxiv.org/html/2512.24601v2#S3.T1 "Table 1 ‣ 3.1 Tasks ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models") reports our main results. We additionally explore how vanilla frontier model performance and RLM performance degrades as input contexts grow in Figure [1](https://arxiv.org/html/2512.24601v2#S1.F1 "Figure 1 ‣ 1 Introduction ‣ Recursive Language Models").

Report issue for preceding element

![Refer to caption](https://arxiv.org/html/2512.24601v2/figures/cost_quartiles_dual_new.png)Figure 3: Cost of RLM and baselines described in § [3.2](https://arxiv.org/html/2512.24601v2#S3.SS2 "3.2 Methods and Baselines ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models") plotted at the 25th, 50th, 75th, and 95th percentile of total API cost. We observe comparable or even lower costs for RLMs at the 50th percentile, but sharp increases at the tail end due to potentially long RLM trajectories.Report issue for preceding element

Observation 1: RLMs can scale to the 10M+ token regime and can outperform base LMs and existing task-agnostic agent scaffolds on long context tasks. Across all tasks, RLMs demonstrate strong performance on prompts well beyond the effective context window of a frontier LM, outperforming base models and common long-context scaffolds by up to 2×2\\times the performance while maintaining comparable or cheaper average token costs. Notably, RLMs scale well beyond the base models’ context window. For instance, on BrowseComp-Plus (1K), a linearly extrapolated cost for GPT-5-mini ingesting 6-11M input tokens is $​1.50−$​2.75\\mathdollar 1.50-\\mathdollar 2.75, while RLM(GPT-5) has an average cost of $​0.99\\mathdollar 0.99 and outperforms both the summarization and retrieval baselines by over 29%29\\%.

Report issue for preceding element

Furthermore, on tasks where processing costs scale with the input context, RLMs make significant improvements over the base model, even on tasks within the model’s context window. On OOLONG, the RLM with GPT-5 and Qwen3-Coder outperform the base model by 28.4%28.4\\% and 33.3%33.3\\% respectively. On OOLONG-Pairs, both GPT-5 and Qwen3-Coder make little progress with F1 scores of <<0.1%0.1\\%, while the RLM using these models achieve F1 scores of 58.0%58.0\\% and 23.1%23.1\\% respectively, highlighting the emergent capability of RLMs to handle extremely information-dense tasks.

Report issue for preceding element

Observation 2: The REPL is necessary for handling long inputs, while the recursive sub-calling of RLMs provides strong benefits on information-dense inputs. A key characteristic of RLMs is offloading the context as a variable in an environment ℰ\\mathcal{E} that the model can interact with. Even without sub-calling capabilities, our ablation of the RLM is able to scale beyond the context limit of the model and outperform other task-agnostic baselines on most long context settings. On the CodeQA and BrowseComp+ tasks with Qwen3-Coder, this ablation is able to outperform the RLM by 17.9%17.9\\% and 3%3\\% respectively.

Report issue for preceding element

On information-dense tasks like OOLONG or OOLONG-Pairs, we observed several cases where recursive LM sub-calling is necessary. In § [4.1](https://arxiv.org/html/2512.24601v2#S4.SS1 "4.1 Emergent Patterns in RLM Trajectories ‣ 4 Results and Discussion ‣ Recursive Language Models"), we see RLM(Qwen3-Coder) perform the necessary semantic transformation line-by-line through recursive sub-calls, while the ablation without sub-calls is forced to use keyword heuristics to solve these tasks. Across all information-dense tasks, RLMs outperform the ablation without sub-calling by 10%10\\%-59%59\\%.

Report issue for preceding element

Observation 3: LM performance degrades as a function of input length and problem complexity, while RLM performance scales better. The benchmarks S-NIAH, OOLONG, and OOLONG-Pairs contain a fixed number of tasks over contexts with lengths ranging from 2132^{13} to 2182^{18}. Each benchmark can be loosely categorized by different processing complexity of the input context with respect to length (roughly constant, linear, and quadratic respectively). In Figure [1](https://arxiv.org/html/2512.24601v2#S1.F1 "Figure 1 ‣ 1 Introduction ‣ Recursive Language Models"), we directly compare an RLM using GPT-5 to base GPT-5 on each task. We find that GPT-5 performance degrades significantly faster for more complex tasks, while RLM performance degrades at a much slower rate, which aligns with the findings of Goldman et al. ( [2025](https://arxiv.org/html/2512.24601v2#bib.bib23 "Is it really long context if all you need is retrieval? towards genuinely difficult long context nlp")). For context lengths beyond 2142^{14}, the RLM consistently outperforms GPT-5.

Report issue for preceding element

Furthermore, RLM costs scale proportionally to the complexity of the task, while still remaining in the same order of magnitude of cost as GPT-5 (see Figure [11](https://arxiv.org/html/2512.24601v2#A6.F11 "Figure 11 ‣ Appendix F Additional Runtime and Cost Analysis of RLMs ‣ Recursive Language Models") in Appendix [F](https://arxiv.org/html/2512.24601v2#A6 "Appendix F Additional Runtime and Cost Analysis of RLMs ‣ Recursive Language Models")). In § [4.1](https://arxiv.org/html/2512.24601v2#S4.SS1 "4.1 Emergent Patterns in RLM Trajectories ‣ 4 Results and Discussion ‣ Recursive Language Models"), we explore the choices that the RLM makes that cause these differences in cost. Lastly, in this setting, we also observe that the base LM outperforms RLM in the small input context regime. By construction, a RLM has strictly more representation capacity than an LM. In practice, however, we observe that RLM performance is slightly worse on smaller input lengths, suggesting a tradeoff point between when to use a base LM and when to use an RLM.

Report issue for preceding element

Observation 4: The inference cost of RLMs remains comparable to a base LM call but has high variance due to differences in trajectory lengths. RLMs iteratively interact with their context until they find a suitable answer, leading to large differences in iteration length depending on task complexity. In Figure [3](https://arxiv.org/html/2512.24601v2#S4.F3 "Figure 3 ‣ 4 Results and Discussion ‣ Recursive Language Models"), we plot the quartile costs for each method across all experiments in Table [1](https://arxiv.org/html/2512.24601v2#S3.T1 "Table 1 ‣ 3.1 Tasks ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models") excluding BrowseComp-Plus (1K), as the base models cannot fit any of these tasks in context. For GPT-5, the median RLM run is cheaper than the median base model run, but many outlier RLM runs are significantly more expensive than any base model query. However, compared to the summarization agent which ingests the entire input context, RLMs are up to 3×3\\times cheaper while maintaining stronger performance across all tasks because the RLM is able to selectively view context.

Report issue for preceding element

We additionally report runtime numbers of each method in Figures [7](https://arxiv.org/html/2512.24601v2#A6.F7 "Figure 7 ‣ Appendix F Additional Runtime and Cost Analysis of RLMs ‣ Recursive Language Models"), [8](https://arxiv.org/html/2512.24601v2#A6.F8 "Figure 8 ‣ Appendix F Additional Runtime and Cost Analysis of RLMs ‣ Recursive Language Models") in Appendix [F](https://arxiv.org/html/2512.24601v2#A6 "Appendix F Additional Runtime and Cost Analysis of RLMs ‣ Recursive Language Models"), but we note several important caveats. Unlike API costs, these numbers are heavily dependent on implementation details such as the machine used, API request latency, and the asynchrony of LM calls. In our implementation of the baselines and RLMs, all LM calls are blocking / sequential. Nevertheless, similar to costs, we observe a wide range of runtimes, especially for RLMs.

Report issue for preceding element

Observation 5: RLMs are a model-agnostic inference strategy, but different models exhibit different overall decisions on context management and sub-calling. While GPT-5 and Qwen3-Coder-480B both exhibit strong performance as RLMs relative to their base model and other baselines, they also exhibit different performance and behavior across all tasks. On BrowseComp-Plus (1k) in particular, RLM(GPT-5) nearly solves all tasks while RLM(Qwen3-Coder) struggles to solve half.

Report issue for preceding element

We note that the RLM system prompt is fixed for each model across all experiments and is not tuned for any particular benchmark. Between GPT-5 and Qwen3-Coder, the only difference in the prompt is an extra line in the RLM(Qwen3-Coder) prompt warning against using too many sub-calls (see Appendix [C](https://arxiv.org/html/2512.24601v2#A3 "Appendix C Additional Methods and Baseline Details ‣ Recursive Language Models")). We provide an explicit example of this difference in example [E.3](https://arxiv.org/html/2512.24601v2#A5.SS3 "E.3 RLM(Qwen3-Coder) on OOLONG-Query_212 ‣ Appendix E Additional RLM Trajectories ‣ Recursive Language Models"), where RLM(Qwen3-Coder) launches a sub-call per line in OOLONG while GPT-5 is conservative about sub-querying LMs.

Report issue for preceding element

Observation 6: Training RLMs on one domain can improve general downstream RLM performance. Certain behavior in RLM trajectories are common among different domains, such as probing the input and recursively sub-calling on shorter contexts. In Table [1](https://arxiv.org/html/2512.24601v2#S3.T1 "Table 1 ‣ 3.1 Tasks ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models"), we find that RLM-Qwen3-8B, a Qwen3-8B model that we fine-tuned on RLM(Qwen3-Coder-480B-A35B) trajectories on a small, unrelated set of tasks (LongBenchPro; Chen et al. [2026](https://arxiv.org/html/2512.24601v2#bib.bib55 "LongBench pro: a more realistic and comprehensive bilingual long-context evaluation benchmark")) considerably outperforms the base Qwen3-8B as an RLM by 28.3%28.3\\% on average. Furthermore, its inference costs are much lower due to better decision making and fewer mistakes as an RLM.

Report issue for preceding element

### 4.1 Emergent Patterns in RLM Trajectories

Report issue for preceding element

Even without explicit training, RLMs exhibit interesting context and problem decomposition behavior. We select several examples of snippets from RLM trajectories to understand how they solve long context problems and where they can improve. We discuss particular examples of interesting behavior here, with additional examples in Appendix [E](https://arxiv.org/html/2512.24601v2#A5 "Appendix E Additional RLM Trajectories ‣ Recursive Language Models").

Report issue for preceding element

![Refer to caption](https://arxiv.org/html/2512.24601v2/figures/Frame_7.png)Figure 4: RLMs have common patterns in their trajectories when solving tasks. (a) We frequently observed RLMs filtering and interacting with their context through regex code. (b) We found that RLMs can effectively decompose their context through recursive sub-calls (c) On long-output tasks, RLMs are able to solve sub-problems using recursive sub-LM calls and stitch their outputs to form a final output.Report issue for preceding element

Chunking and recursively sub-calling LMs. RLMs defer essentially unbounded-length reasoning chains to sub-LM calls. The choice of decomposition can greatly affect task performance, especially for information-dense problems. In our experiments, we did not observe complicated partitioning strategies beyond uniform chunking or keyword searches. In Figure [4](https://arxiv.org/html/2512.24601v2#S4.F4 "Figure 4 ‣ 4.1 Emergent Patterns in RLM Trajectories ‣ 4 Results and Discussion ‣ Recursive Language Models") b, RLM(Qwen3-Coder) chunks by newline in a 1000+ line context from OOLONG.

Report issue for preceding element

Filtering input information using code execution based on model priors. A key intuition for why the RLM abstraction can maintain strong performance on huge inputs without exploding costs is the LM’s ability to filter input context without explicitly seeing it. Furthermore, model priors enable the RLM to narrow the search space and process fewer input tokens. As an example, in Figure [4](https://arxiv.org/html/2512.24601v2#S4.F4 "Figure 4 ‣ 4.1 Emergent Patterns in RLM Trajectories ‣ 4 Results and Discussion ‣ Recursive Language Models") a, we observed RLM(GPT-5) using regex queries to search for chunks containing keywords in the original prompt (e.g. “festival”) and phrases it has a prior about (e.g. “La Union”).

Report issue for preceding element

Passing recursive LM outputs through variables for long output tasks. RLMs are able to produce essentially unbounded tokens well beyond the limit of the base LM by returning variables in the REPL as output. Through the REPL, the RLM can iteratively construct these variables as a mixture of programmatic and sub-(R)LM output calls. We observed this strategy used heavily in OOLONG-Pairs trajectories, where the RLM stored the output of sub-LM calls over the input in variables and stitched them together to form a final answer (see Figure [4](https://arxiv.org/html/2512.24601v2#S4.F4 "Figure 4 ‣ 4.1 Emergent Patterns in RLM Trajectories ‣ 4 Results and Discussion ‣ Recursive Language Models") c).

Report issue for preceding element

## 5 Related Works

Report issue for preceding element

Long-Context LM Systems. There have primarily been two orthogonal directions for long-context management in language model systems: 1) directly changing the architecture of and retraining the base LM to handle longer contexts (Press et al., [2022](https://arxiv.org/html/2512.24601v2#bib.bib29 "Train short, test long: attention with linear biases enables input length extrapolation"); Gu et al., [2022](https://arxiv.org/html/2512.24601v2#bib.bib31 "Efficiently modeling long sequences with structured state spaces"); Munkhdalai et al., [2024](https://arxiv.org/html/2512.24601v2#bib.bib30 "Leave no context behind: efficient infinite context transformers with infini-attention")), and 2) building a scaffold around the LM that implicitly handles the context – RLMs focus on the latter. One popular class of such strategies is lossy context management, which uses summarization or truncation to compress the input context at the cost of potentially losing fine-grained information. For example, MemWalker (Chen et al., [2023](https://arxiv.org/html/2512.24601v2#bib.bib28 "Walking down the memory maze: beyond context limit through interactive reading")) constructs a tree-like data structure of the input that the LM can navigate when answering long context questions. ReSum (Wu et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib5 "ReSum: unlocking long-horizon search intelligence via context summarization")) is another work that adds a summarization tool to periodically compress the context of a multi-turn agent. Another class of strategies implement an explicit memory hierarchy in the agent scaffold (Packer et al., [2024](https://arxiv.org/html/2512.24601v2#bib.bib33 "MemGPT: towards llms as operating systems"); Chhikara et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib35 "Mem0: building production-ready ai agents with scalable long-term memory"); Zhang et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib34 "G-memory: tracing hierarchical memory for multi-agent systems")). RLMs differ from these works in that all context window management is implicitly handled by the LM itself.

Report issue for preceding element

Task Decomposition through sub-LM calls. Many LM-based agents (Guo et al., [2024](https://arxiv.org/html/2512.24601v2#bib.bib36 "Large language model based multi-agents: a survey of progress and challenges"); Anthropic, [2025](https://arxiv.org/html/2512.24601v2#bib.bib22 "Claude code: subagents — modular ai workflows with isolated agent contexts")) use multiple, well-placed LM calls to solve a problem; however, many of these calls are placed based on human-engineered workflows. Several methods like ViperGPT (Surís et al., [2023](https://arxiv.org/html/2512.24601v2#bib.bib19 "ViperGPT: visual inference via python execution for reasoning")), THREAD (Schroeder et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib27 "THREAD: thinking deeper with recursive spawning")), DisCIPL (Grand et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib20 "Self-steering language models")), ReDel (Zhu et al., [2024](https://arxiv.org/html/2512.24601v2#bib.bib18 "ReDel: a toolkit for llm-powered recursive multi-agent systems")), Context Folding (Sun et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib25 "Scaling long-horizon llm agent via context-folding")), and AgentFold (Ye et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib46 "AgentFold: long-horizon web agents with proactive context management")) have explored deferring the choice of sub-LM calls to the LM. These techniques emphasize task decomposition through recursive LM calls, but are unable to handle long context inputs beyond the length of the base LM. RLMs, on the other hand, are enabled by an extremely simple intuition (i.e., placing the prompt in the external environment) to symbolically manipulate arbitrarily long strings and to iteratively refine their recursion via execution feedback from the persistent REPL.

Report issue for preceding element

## 6 Limitations and Future Work

Report issue for preceding element

While RLMs show strong performance on tasks beyond the context window limitations of existing LMs at reasonable inference costs, evaluations for more difficult and natural long-context processing tasks and the best mechanisms for implementing RLMs both remain highly under-explored. We focused on synchronous sub-calls inside of a Python REPL environment, but we note that alternative strategies involving asynchronous sub-calls and sandboxed REPLs can potentially significantly reduce the runtime and inference cost of RLMs. Furthermore, we chose to use a max recursion depth of one (i.e. sub-calls are LMs); while we found strong performance on existing long-context benchmarks, we believe that future work should investigate deeper levels of recursion or even new hybrids between symbolic recursion and neural attention. We include additional limitations and negative results in Appendix [B](https://arxiv.org/html/2512.24601v2#A2 "Appendix B Negative Results: Things we Tried that Did Not Work. ‣ Recursive Language Models").

Report issue for preceding element

Lastly, we focused our experiments on evaluating RLMs using existing frontier models, but show initial evidence on a Qwen3-8B model that explicitly training a model to be used as a RLM provides very rapid performance improvements, even outside the training domain. We hypothesize that RLM trajectories can be viewed as a form of reasoning (OpenAI et al., [2024](https://arxiv.org/html/2512.24601v2#bib.bib50 "OpenAI o1 system card"); DeepSeek-AI et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib54 "DeepSeek-r1: incentivizing reasoning capability in llms via reinforcement learning")), which can be trained by bootstrapping existing models (Zelikman et al., [2022](https://arxiv.org/html/2512.24601v2#bib.bib48 "STaR: bootstrapping reasoning with reasoning"), [2024](https://arxiv.org/html/2512.24601v2#bib.bib49 "Quiet-star: language models can teach themselves to think before speaking")). We hope that training native RLMs can be treated as a new axis of scale to improve LM performance on general and long-horizon tasks.

Report issue for preceding element

## 7 Conclusion

Report issue for preceding element

We introduced Recursive Language Models (RLMs), a general inference framework for language models that offloads the input context and enables language models to recursively sub-query language models before providing an output. We explored an instantiation of this framework that offloads the context into a Python REPL environment as a variable in memory, enabling the LM to reason over its context in code and recursive LM calls, rather than purely in token space. Our results across multiple settings and models demonstrated that RLMs are an effective task-agnostic paradigm for both long-context problems and general reasoning. Building on our small fine-tuning experiments, we are excited to see future work that explicitly trains models to reason as RLMs, which could result in another axis of scale for the next generation of language model systems.

Report issue for preceding element

## 8 Impact Statement

Report issue for preceding element

This paper explores a strategy for enabling language models to solve long context problems and scaling future language model systems. The goal is to advance research on systems that can help us solve complex problems. While there are potential societal consequences of this work, we believe they are not specific to this paper and do not need to be highlighted here.

Report issue for preceding element

## Acknowledgments

Report issue for preceding element

This research is partially supported by the Laude Institute, Prime Intellect, and Modal Labs. We thank Noah Ziems, Jacob Li, James Moore, and the MIT OASYS and MIT DSG labs for insightful discussions throughout this project. We also thank Jack Cook, Matej Sirovatka, Ofir Press, Sebastian Müller, Simon Guo, and Zed Li for helpful feedback.

Report issue for preceding element

## References

Report issue for preceding element

- Anthropic (2025)↑Claude code: subagents — modular ai workflows with isolated agent contexts.
External Links: [Link](https://docs.anthropic.com/en/docs/claude-code/sub-agents "")Cited by: [§C.2](https://arxiv.org/html/2512.24601v2#A3.SS2.p1.1 "C.2 Summary agent baseline ‣ Appendix C Additional Methods and Baseline Details ‣ Recursive Language Models"),
[§1](https://arxiv.org/html/2512.24601v2#S1.p5.1 "1 Introduction ‣ Recursive Language Models"),
[§5](https://arxiv.org/html/2512.24601v2#S5.p2.1 "5 Related Works ‣ Recursive Language Models").

- Y. Bai, S. Tu, J. Zhang, H. Peng, X. Wang, X. Lv, S. Cao, J. Xu, L. Hou, Y. Dong, J. Tang, and J. Li (2025)↑LongBench v2: towards deeper understanding and reasoning on realistic long-context multitasks.
External Links: 2412.15204,
[Link](https://arxiv.org/abs/2412.15204 "")Cited by: [§1](https://arxiv.org/html/2512.24601v2#S1.p6.1 "1 Introduction ‣ Recursive Language Models"),
[§3.1](https://arxiv.org/html/2512.24601v2#S3.SS1.p6.1 "3.1 Tasks ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models").

- A. Bertsch, A. Pratapa, T. Mitamura, G. Neubig, and M. R. Gormley (2025)↑Oolong: evaluating long context reasoning and aggregation capabilities.
External Links: 2511.02817,
[Link](https://arxiv.org/abs/2511.02817 "")Cited by: [Appendix B](https://arxiv.org/html/2512.24601v2#A2.p4.2 "Appendix B Negative Results: Things we Tried that Did Not Work. ‣ Recursive Language Models"),
[§D.1](https://arxiv.org/html/2512.24601v2#A4.SS1.p1.1 "D.1 OOLONG-Pairs Benchmark ‣ Appendix D Additional Benchmark Details ‣ Recursive Language Models"),
[§1](https://arxiv.org/html/2512.24601v2#S1.p6.1 "1 Introduction ‣ Recursive Language Models"),
[§3.1](https://arxiv.org/html/2512.24601v2#S3.SS1.p4.2 "3.1 Tasks ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models"),
[§3](https://arxiv.org/html/2512.24601v2#S3.p2.1 "3 Scaling Long Context Tasks ‣ Recursive Language Models").

- Y. Chang, K. Lo, T. Goyal, and M. Iyyer (2024)↑BooookScore: a systematic exploration of book-length summarization in the era of LLMs.
In The Twelfth International Conference on Learning Representations,
External Links: [Link](https://arxiv.org/pdf/2310.00785.pdf "")Cited by: [§1](https://arxiv.org/html/2512.24601v2#S1.p2.1 "1 Introduction ‣ Recursive Language Models").

- H. Chen, R. Pasunuru, J. Weston, and A. Celikyilmaz (2023)↑Walking down the memory maze: beyond context limit through interactive reading.
External Links: 2310.05029,
[Link](https://arxiv.org/abs/2310.05029 "")Cited by: [§5](https://arxiv.org/html/2512.24601v2#S5.p1.1 "5 Related Works ‣ Recursive Language Models").

- Z. Chen, X. Ma, S. Zhuang, P. Nie, K. Zou, A. Liu, J. Green, K. Patel, R. Meng, M. Su, S. Sharifymoghaddam, Y. Li, H. Hong, X. Shi, X. Liu, N. Thakur, C. Zhang, L. Gao, W. Chen, and J. Lin (2025)↑BrowseComp-plus: a more fair and transparent evaluation benchmark of deep-research agent.
External Links: 2508.06600,
[Link](https://arxiv.org/abs/2508.06600 "")Cited by: [§C.1](https://arxiv.org/html/2512.24601v2#A3.SS1.p6.1 "C.1 Prompts for Experiments ‣ Appendix C Additional Methods and Baseline Details ‣ Recursive Language Models"),
[§D.2](https://arxiv.org/html/2512.24601v2#A4.SS2.p1.3 "D.2 Scaling Huge Document Corpuses in BrowseComp+ ‣ Appendix D Additional Benchmark Details ‣ Recursive Language Models"),
[§1](https://arxiv.org/html/2512.24601v2#S1.p6.1 "1 Introduction ‣ Recursive Language Models"),
[§3.1](https://arxiv.org/html/2512.24601v2#S3.SS1.p3.1 "3.1 Tasks ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models"),
[§3.2](https://arxiv.org/html/2512.24601v2#S3.SS2.p2.1 "3.2 Methods and Baselines ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models").

- Z. Chen, X. Wu, J. Jia, C. Gao, Q. Fu, D. Zhang, and S. Hu (2026)↑LongBench pro: a more realistic and comprehensive bilingual long-context evaluation benchmark.
External Links: 2601.02872,
[Link](https://arxiv.org/abs/2601.02872 "")Cited by: [Appendix A](https://arxiv.org/html/2512.24601v2#A1.p2.1 "Appendix A Additional Training Details ‣ Recursive Language Models"),
[§3.2](https://arxiv.org/html/2512.24601v2#S3.SS2.p7.1 "3.2 Methods and Baselines ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models"),
[§4](https://arxiv.org/html/2512.24601v2#S4.p12.1 "4 Results and Discussion ‣ Recursive Language Models").

- P. Chhikara, D. Khant, S. Aryan, T. Singh, and D. Yadav (2025)↑Mem0: building production-ready ai agents with scalable long-term memory.
External Links: 2504.19413,
[Link](https://arxiv.org/abs/2504.19413 "")Cited by: [§5](https://arxiv.org/html/2512.24601v2#S5.p1.1 "5 Related Works ‣ Recursive Language Models").

- DeepSeek-AI, D. Guo, D. Yang, H. Zhang, J. Song, R. Zhang, R. Xu, Q. Zhu, S. Ma, P. Wang, X. Bi, X. Zhang, X. Yu, Y. Wu, Z. F. Wu, Z. Gou, Z. Shao, Z. Li, Z. Gao, A. Liu, B. Xue, B. Wang, B. Wu, B. Feng, C. Lu, C. Zhao, C. Deng, C. Zhang, C. Ruan, D. Dai, D. Chen, D. Ji, E. Li, F. Lin, F. Dai, F. Luo, G. Hao, G. Chen, G. Li, H. Zhang, H. Bao, H. Xu, H. Wang, H. Ding, H. Xin, H. Gao, H. Qu, H. Li, J. Guo, J. Li, J. Wang, J. Chen, J. Yuan, J. Qiu, J. Li, J. L. Cai, J. Ni, J. Liang, J. Chen, K. Dong, K. Hu, K. Gao, K. Guan, K. Huang, K. Yu, L. Wang, L. Zhang, L. Zhao, L. Wang, L. Zhang, L. Xu, L. Xia, M. Zhang, M. Zhang, M. Tang, M. Li, M. Wang, M. Li, N. Tian, P. Huang, P. Zhang, Q. Wang, Q. Chen, Q. Du, R. Ge, R. Zhang, R. Pan, R. Wang, R. J. Chen, R. L. Jin, R. Chen, S. Lu, S. Zhou, S. Chen, S. Ye, S. Wang, S. Yu, S. Zhou, S. Pan, S. S. Li, S. Zhou, S. Wu, S. Ye, T. Yun, T. Pei, T. Sun, T. Wang, W. Zeng, W. Zhao, W. Liu, W. Liang, W. Gao, W. Yu, W. Zhang, W. L. Xiao, W. An, X. Liu, X. Wang, X. Chen, X. Nie, X. Cheng, X. Liu, X. Xie, X. Liu, X. Yang, X. Li, X. Su, X. Lin, X. Q. Li, X. Jin, X. Shen, X. Chen, X. Sun, X. Wang, X. Song, X. Zhou, X. Wang, X. Shan, Y. K. Li, Y. Q. Wang, Y. X. Wei, Y. Zhang, Y. Xu, Y. Li, Y. Zhao, Y. Sun, Y. Wang, Y. Yu, Y. Zhang, Y. Shi, Y. Xiong, Y. He, Y. Piao, Y. Wang, Y. Tan, Y. Ma, Y. Liu, Y. Guo, Y. Ou, Y. Wang, Y. Gong, Y. Zou, Y. He, Y. Xiong, Y. Luo, Y. You, Y. Liu, Y. Zhou, Y. X. Zhu, Y. Xu, Y. Huang, Y. Li, Y. Zheng, Y. Zhu, Y. Ma, Y. Tang, Y. Zha, Y. Yan, Z. Z. Ren, Z. Ren, Z. Sha, Z. Fu, Z. Xu, Z. Xie, Z. Zhang, Z. Hao, Z. Ma, Z. Yan, Z. Wu, Z. Gu, Z. Zhu, Z. Liu, Z. Li, Z. Xie, Z. Song, Z. Pan, Z. Huang, Z. Xu, Z. Zhang, and Z. Zhang (2025)↑DeepSeek-r1: incentivizing reasoning capability in llms via reinforcement learning.
External Links: 2501.12948,
[Link](https://arxiv.org/abs/2501.12948 "")Cited by: [§6](https://arxiv.org/html/2512.24601v2#S6.p2.1 "6 Limitations and Future Work ‣ Recursive Language Models").

- Fireworks AI (2025)↑Qwen3 coder 480b a35b instruct.
Note: [https://fireworks.ai/models/fireworks/qwen3-coder-480b-a35b-instruct](https://fireworks.ai/models/fireworks/qwen3-coder-480b-a35b-instruct "")Cited by: [§3.2](https://arxiv.org/html/2512.24601v2#S3.SS2.p1.1 "3.2 Methods and Baselines ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models").

- O. Goldman, A. Jacovi, A. Slobodkin, A. Maimon, I. Dagan, and R. Tsarfaty (2025)↑Is it really long context if all you need is retrieval? towards genuinely difficult long context nlp.
External Links: 2407.00402,
[Link](https://arxiv.org/abs/2407.00402 "")Cited by: [§3](https://arxiv.org/html/2512.24601v2#S3.p1.1 "3 Scaling Long Context Tasks ‣ Recursive Language Models"),
[§4](https://arxiv.org/html/2512.24601v2#S4.p6.3 "4 Results and Discussion ‣ Recursive Language Models").

- G. Grand, J. B. Tenenbaum, V. K. Mansinghka, A. K. Lew, and J. Andreas (2025)↑Self-steering language models.
arXiv preprint arXiv:2504.07081.
Cited by: [§5](https://arxiv.org/html/2512.24601v2#S5.p2.1 "5 Related Works ‣ Recursive Language Models").

- A. Gu, K. Goel, and C. Ré (2022)↑Efficiently modeling long sequences with structured state spaces.
External Links: 2111.00396,
[Link](https://arxiv.org/abs/2111.00396 "")Cited by: [§5](https://arxiv.org/html/2512.24601v2#S5.p1.1 "5 Related Works ‣ Recursive Language Models").

- T. Guo, X. Chen, Y. Wang, R. Chang, S. Pei, N. V. Chawla, O. Wiest, and X. Zhang (2024)↑Large language model based multi-agents: a survey of progress and challenges.
External Links: 2402.01680,
[Link](https://arxiv.org/abs/2402.01680 "")Cited by: [§5](https://arxiv.org/html/2512.24601v2#S5.p2.1 "5 Related Works ‣ Recursive Language Models").

- K. Hong, A. Troynikov, and J. Huber (2025)↑Context rot: how context degradation affects llm performance.
External Links: [Link](https://research.trychroma.com/context-rot "")Cited by: [§1](https://arxiv.org/html/2512.24601v2#S1.p1.1 "1 Introduction ‣ Recursive Language Models"),
[§3](https://arxiv.org/html/2512.24601v2#S3.p1.1 "3 Scaling Long Context Tasks ‣ Recursive Language Models").

- C. Hsieh, S. Sun, S. Kriman, S. Acharya, D. Rekesh, F. Jia, Y. Zhang, and B. Ginsburg (2024)↑RULER: what’s the real context size of your long-context language models?.
External Links: 2404.06654,
[Link](https://arxiv.org/abs/2404.06654 "")Cited by: [§3.1](https://arxiv.org/html/2512.24601v2#S3.SS1.p2.1 "3.1 Tasks ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models"),
[§3](https://arxiv.org/html/2512.24601v2#S3.p1.1 "3 Scaling Long Context Tasks ‣ Recursive Language Models"),
[§3](https://arxiv.org/html/2512.24601v2#S3.p2.1 "3 Scaling Long Context Tasks ‣ Recursive Language Models").

- P. Intellect (2025)↑Prime rl library.
External Links: [Link](https://github.com/PrimeIntellect-ai/prime-rl "")Cited by: [Appendix A](https://arxiv.org/html/2512.24601v2#A1.p5.1 "Appendix A Additional Training Details ‣ Recursive Language Models").

- C. E. Jimenez, J. Yang, A. Wettig, S. Yao, K. Pei, O. Press, and K. Narasimhan (2024)↑SWE-bench: can language models resolve real-world github issues?.
External Links: 2310.06770,
[Link](https://arxiv.org/abs/2310.06770 "")Cited by: [§3.2](https://arxiv.org/html/2512.24601v2#S3.SS2.p2.1 "3.2 Methods and Baselines ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models").

- O. Khattab, C. Potts, and M. Zaharia (2021)↑Baleen: robust multi-hop reasoning at scale via condensed retrieval.
Advances in Neural Information Processing Systems34,  pp. 27670–27682.
Cited by: [§1](https://arxiv.org/html/2512.24601v2#S1.p2.1 "1 Introduction ‣ Recursive Language Models").

- W. Merrill and A. Sabharwal (2024)↑The expressive power of transformers with chain of thought.
In The Twelfth International Conference on Learning Representations,
Cited by: [§1](https://arxiv.org/html/2512.24601v2#S1.p2.1 "1 Introduction ‣ Recursive Language Models").

- T. Munkhdalai, M. Faruqui, and S. Gopal (2024)↑Leave no context behind: efficient infinite context transformers with infini-attention.
External Links: 2404.07143,
[Link](https://arxiv.org/abs/2404.07143 "")Cited by: [§5](https://arxiv.org/html/2512.24601v2#S5.p1.1 "5 Related Works ‣ Recursive Language Models").

- OpenAI, A. Jaech, A. Kalai, A. Lerer, A. Richardson, A. El-Kishky, A. Low, A. Helyar, A. Madry, A. Beutel, A. Carney, A. Iftimie, A. Karpenko, A. T. Passos, A. Neitz, A. Prokofiev, A. Wei, A. Tam, A. Bennett, A. Kumar, A. Saraiva, A. Vallone, A. Duberstein, A. Kondrich, A. Mishchenko, A. Applebaum, A. Jiang, A. Nair, B. Zoph, B. Ghorbani, B. Rossen, B. Sokolowsky, B. Barak, B. McGrew, B. Minaiev, B. Hao, B. Baker, B. Houghton, B. McKinzie, B. Eastman, C. Lugaresi, C. Bassin, C. Hudson, C. M. Li, C. de Bourcy, C. Voss, C. Shen, C. Zhang, C. Koch, C. Orsinger, C. Hesse, C. Fischer, C. Chan, D. Roberts, D. Kappler, D. Levy, D. Selsam, D. Dohan, D. Farhi, D. Mely, D. Robinson, D. Tsipras, D. Li, D. Oprica, E. Freeman, E. Zhang, E. Wong, E. Proehl, E. Cheung, E. Mitchell, E. Wallace, E. Ritter, E. Mays, F. Wang, F. P. Such, F. Raso, F. Leoni, F. Tsimpourlas, F. Song, F. von Lohmann, F. Sulit, G. Salmon, G. Parascandolo, G. Chabot, G. Zhao, G. Brockman, G. Leclerc, H. Salman, H. Bao, H. Sheng, H. Andrin, H. Bagherinezhad, H. Ren, H. Lightman, H. W. Chung, I. Kivlichan, I. O’Connell, I. Osband, I. C. Gilaberte, I. Akkaya, I. Kostrikov, I. Sutskever, I. Kofman, J. Pachocki, J. Lennon, J. Wei, J. Harb, J. Twore, J. Feng, J. Yu, J. Weng, J. Tang, J. Yu, J. Q. Candela, J. Palermo, J. Parish, J. Heidecke, J. Hallman, J. Rizzo, J. Gordon, J. Uesato, J. Ward, J. Huizinga, J. Wang, K. Chen, K. Xiao, K. Singhal, K. Nguyen, K. Cobbe, K. Shi, K. Wood, K. Rimbach, K. Gu-Lemberg, K. Liu, K. Lu, K. Stone, K. Yu, L. Ahmad, L. Yang, L. Liu, L. Maksin, L. Ho, L. Fedus, L. Weng, L. Li, L. McCallum, L. Held, L. Kuhn, L. Kondraciuk, L. Kaiser, L. Metz, M. Boyd, M. Trebacz, M. Joglekar, M. Chen, M. Tintor, M. Meyer, M. Jones, M. Kaufer, M. Schwarzer, M. Shah, M. Yatbaz, M. Y. Guan, M. Xu, M. Yan, M. Glaese, M. Chen, M. Lampe, M. Malek, M. Wang, M. Fradin, M. McClay, M. Pavlov, M. Wang, M. Wang, M. Murati, M. Bavarian, M. Rohaninejad, N. McAleese, N. Chowdhury, N. Chowdhury, N. Ryder, N. Tezak, N. Brown, O. Nachum, O. Boiko, O. Murk, O. Watkins, P. Chao, P. Ashbourne, P. Izmailov, P. Zhokhov, R. Dias, R. Arora, R. Lin, R. G. Lopes, R. Gaon, R. Miyara, R. Leike, R. Hwang, R. Garg, R. Brown, R. James, R. Shu, R. Cheu, R. Greene, S. Jain, S. Altman, S. Toizer, S. Toyer, S. Miserendino, S. Agarwal, S. Hernandez, S. Baker, S. McKinney, S. Yan, S. Zhao, S. Hu, S. Santurkar, S. R. Chaudhuri, S. Zhang, S. Fu, S. Papay, S. Lin, S. Balaji, S. Sanjeev, S. Sidor, T. Broda, A. Clark, T. Wang, T. Gordon, T. Sanders, T. Patwardhan, T. Sottiaux, T. Degry, T. Dimson, T. Zheng, T. Garipov, T. Stasi, T. Bansal, T. Creech, T. Peterson, T. Eloundou, V. Qi, V. Kosaraju, V. Monaco, V. Pong, V. Fomenko, W. Zheng, W. Zhou, W. McCabe, W. Zaremba, Y. Dubois, Y. Lu, Y. Chen, Y. Cha, Y. Bai, Y. He, Y. Zhang, Y. Wang, Z. Shao, and Z. Li (2024)↑OpenAI o1 system card.
External Links: 2412.16720,
[Link](https://arxiv.org/abs/2412.16720 "")Cited by: [§6](https://arxiv.org/html/2512.24601v2#S6.p2.1 "6 Limitations and Future Work ‣ Recursive Language Models").

- OpenAI (2025a)↑Codex cli: a lightweight coding agent for your terminal.
External Links: [Link](https://developers.openai.com/codex/cli/ "")Cited by: [§1](https://arxiv.org/html/2512.24601v2#S1.p2.1 "1 Introduction ‣ Recursive Language Models").

- OpenAI (2025b)↑Deep research.
Note: AI-powered research assistant toolExternal Links: [Link](https://openai.com/index/introducing-deep-research/ "")Cited by: [§3.1](https://arxiv.org/html/2512.24601v2#S3.SS1.p3.1 "3.1 Tasks ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models").

- C. Packer, S. Wooders, K. Lin, V. Fang, S. G. Patil, I. Stoica, and J. E. Gonzalez (2024)↑MemGPT: towards llms as operating systems.
External Links: 2310.08560,
[Link](https://arxiv.org/abs/2310.08560 "")Cited by: [§5](https://arxiv.org/html/2512.24601v2#S5.p1.1 "5 Related Works ‣ Recursive Language Models").

- O. Press, N. A. Smith, and M. Lewis (2022)↑Train short, test long: attention with linear biases enables input length extrapolation.
External Links: 2108.12409,
[Link](https://arxiv.org/abs/2108.12409 "")Cited by: [§5](https://arxiv.org/html/2512.24601v2#S5.p1.1 "5 Related Works ‣ Recursive Language Models").

- Qwen Team (2025a)↑Qwen3-8b.
Note: [https://huggingface.co/Qwen/Qwen3-8B](https://huggingface.co/Qwen/Qwen3-8B "")Cited by: [Appendix A](https://arxiv.org/html/2512.24601v2#A1.p2.1 "Appendix A Additional Training Details ‣ Recursive Language Models"),
[§3.2](https://arxiv.org/html/2512.24601v2#S3.SS2.p7.1 "3.2 Methods and Baselines ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models").

- Qwen Team (2025b)↑Qwen3-coder-480b-a35b-instruct.
Note: [https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct](https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct "")Cited by: [Appendix A](https://arxiv.org/html/2512.24601v2#A1.p2.1 "Appendix A Additional Training Details ‣ Recursive Language Models"),
[§1](https://arxiv.org/html/2512.24601v2#S1.p6.1 "1 Introduction ‣ Recursive Language Models"),
[§3.2](https://arxiv.org/html/2512.24601v2#S3.SS2.p1.1 "3.2 Methods and Baselines ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models").

- J. Redmon and A. Farhadi (2018)↑YOLOv3: an incremental improvement.
External Links: 1804.02767,
[Link](https://arxiv.org/abs/1804.02767 "")Cited by: [Appendix B](https://arxiv.org/html/2512.24601v2#A2.p1.1 "Appendix B Negative Results: Things we Tried that Did Not Work. ‣ Recursive Language Models").

- S. Robertson and H. Zaragoza (2009)↑The probabilistic relevance framework: bm25 and beyond.
Found. Trends Inf. Retr.3 (4),  pp. 333–389.
External Links: ISSN 1554-0669,
[Link](https://doi.org/10.1561/1500000019 ""),
[Document](https://dx.doi.org/10.1561/1500000019 "")Cited by: [§3.2](https://arxiv.org/html/2512.24601v2#S3.SS2.p2.1 "3.2 Methods and Baselines ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models").

- P. Schroeder, N. Morgan, H. Luo, and J. Glass (2025)↑THREAD: thinking deeper with recursive spawning.
External Links: 2405.17402,
[Link](https://arxiv.org/abs/2405.17402 "")Cited by: [§1](https://arxiv.org/html/2512.24601v2#S1.p5.1 "1 Introduction ‣ Recursive Language Models"),
[§5](https://arxiv.org/html/2512.24601v2#S5.p2.1 "5 Related Works ‣ Recursive Language Models").

- Sentient AI (2025)↑ROMA: the backbone for open-source meta-agents.
Sentient.
Note: Accessed: 2025-12-20External Links: [Link](https://blog.sentient.xyz/posts/recursive-open-meta-agent "")Cited by: [§1](https://arxiv.org/html/2512.24601v2#S1.p5.1 "1 Introduction ‣ Recursive Language Models").

- A. Singh, A. Fry, A. Perelman, A. Tart, A. Ganesh, A. El-Kishky, A. McLaughlin, A. Low, A. Ostrow, A. Ananthram, A. Nathan, A. Luo, A. Helyar, A. Madry, A. Efremov, A. Spyra, A. Baker-Whitcomb, A. Beutel, A. Karpenko, A. Makelov, A. Neitz, A. Wei, A. Barr, A. Kirchmeyer, A. Ivanov, A. Christakis, A. Gillespie, A. Tam, A. Bennett, A. Wan, A. Huang, A. M. Sandjideh, A. Yang, A. Kumar, A. Saraiva, A. Vallone, A. Gheorghe, A. G. Garcia, A. Braunstein, A. Liu, A. Schmidt, A. Mereskin, A. Mishchenko, A. Applebaum, A. Rogerson, A. Rajan, A. Wei, A. Kotha, A. Srivastava, A. Agrawal, A. Vijayvergiya, A. Tyra, A. Nair, A. Nayak, B. Eggers, B. Ji, B. Hoover, B. Chen, B. Chen, B. Barak, B. Minaiev, B. Hao, B. Baker, B. Lightcap, B. McKinzie, B. Wang, B. Quinn, B. Fioca, B. Hsu, B. Yang, B. Yu, B. Zhang, B. Brenner, C. R. Zetino, C. Raymond, C. Lugaresi, C. Paz, C. Hudson, C. Whitney, C. Li, C. Chen, C. Cole, C. Voss, C. Ding, C. Shen, C. Huang, C. Colby, C. Hallacy, C. Koch, C. Lu, C. Kaplan, C. Kim, C. Minott-Henriques, C. Frey, C. Yu, C. Czarnecki, C. Reid, C. Wei, C. Decareaux, C. Scheau, C. Zhang, C. Forbes, D. Tang, D. Goldberg, D. Roberts, D. Palmie, D. Kappler, D. Levine, D. Wright, D. Leo, D. Lin, D. Robinson, D. Grabb, D. Chen, D. Lim, D. Salama, D. Bhattacharjee, D. Tsipras, D. Li, D. Yu, D. Strouse, D. Williams, D. Hunn, E. Bayes, E. Arbus, E. Akyurek, E. Y. Le, E. Widmann, E. Yani, E. Proehl, E. Sert, E. Cheung, E. Schwartz, E. Han, E. Jiang, E. Mitchell, E. Sigler, E. Wallace, E. Ritter, E. Kavanaugh, E. Mays, E. Nikishin, F. Li, F. P. Such, F. de Avila Belbute Peres, F. Raso, F. Bekerman, F. Tsimpourlas, F. Chantzis, F. Song, F. Zhang, G. Raila, G. McGrath, G. Briggs, G. Yang, G. Parascandolo, G. Chabot, G. Kim, G. Zhao, G. Valiant, G. Leclerc, H. Salman, H. Wang, H. Sheng, H. Jiang, H. Wang, H. Jin, H. Sikchi, H. Schmidt, H. Aspegren, H. Chen, H. Qiu, H. Lightman, I. Covert, I. Kivlichan, I. Silber, I. Sohl, I. Hammoud, I. Clavera, I. Lan, I. Akkaya, I. Kostrikov, I. Kofman, I. Etinger, I. Singal, J. Hehir, J. Huh, J. Pan, J. Wilczynski, J. Pachocki, J. Lee, J. Quinn, J. Kiros, J. Kalra, J. Samaroo, J. Wang, J. Wolfe, J. Chen, J. Wang, J. Harb, J. Han, J. Wang, J. Zhao, J. Chen, J. Yang, J. Tworek, J. Chand, J. Landon, J. Liang, J. Lin, J. Liu, J. Wang, J. Tang, J. Yin, J. Jang, J. Morris, J. Flynn, J. Ferstad, J. Heidecke, J. Fishbein, J. Hallman, J. Grant, J. Chien, J. Gordon, J. Park, J. Liss, J. Kraaijeveld, J. Guay, J. Mo, J. Lawson, J. McGrath, J. Vendrow, J. Jiao, J. Lee, J. Steele, J. Wang, J. Mao, K. Chen, K. Hayashi, K. Xiao, K. Salahi, K. Wu, K. Sekhri, K. Sharma, K. Singhal, K. Li, K. Nguyen, K. Gu-Lemberg, K. King, K. Liu, K. Stone, K. Yu, K. Ying, K. Georgiev, K. Lim, K. Tirumala, K. Miller, L. Ahmad, L. Lv, L. Clare, L. Fauconnet, L. Itow, L. Yang, L. Romaniuk, L. Anise, L. Byron, L. Pathak, L. Maksin, L. Lo, L. Ho, L. Jing, L. Wu, L. Xiong, L. Mamitsuka, L. Yang, L. McCallum, L. Held, L. Bourgeois, L. Engstrom, L. Kuhn, L. Feuvrier, L. Zhang, L. Switzer, L. Kondraciuk, L. Kaiser, M. Joglekar, M. Singh, M. Shah, M. Stratta, M. Williams, M. Chen, M. Sun, M. Cayton, M. Li, M. Zhang, M. Aljubeh, M. Nichols, M. Haines, M. Schwarzer, M. Gupta, M. Shah, M. Huang, M. Dong, M. Wang, M. Glaese, M. Carroll, M. Lampe, M. Malek, M. Sharman, M. Zhang, M. Wang, M. Pokrass, M. Florian, M. Pavlov, M. Wang, M. Chen, M. Wang, M. Feng, M. Bavarian, M. Lin, M. Abdool, M. Rohaninejad, N. Soto, N. Staudacher, N. LaFontaine, N. Marwell, N. Liu, N. Preston, N. Turley, N. Ansman, N. Blades, N. Pancha, N. Mikhaylin, N. Felix, N. Handa, N. Rai, N. Keskar, N. Brown, O. Nachum, O. Boiko, O. Murk, O. Watkins, O. Gleeson, P. Mishkin, P. Lesiewicz, P. Baltescu, P. Belov, P. Zhokhov, P. Pronin, P. Guo, P. Thacker, Q. Liu, Q. Yuan, Q. Liu, R. Dias, R. Puckett, R. Arora, R. T. Mullapudi, R. Gaon, R. Miyara, R. Song, R. Aggarwal, R. Marsan, R. Yemiru, R. Xiong, R. Kshirsagar, R. Nuttall, R. Tsiupa, R. Eldan, R. Wang, R. James, R. Ziv, R. Shu, R. Nigmatullin, S. Jain, S. Talaie, S. Altman, S. Arnesen, S. Toizer, S. Toyer, S. Miserendino, S. Agarwal, S. Yoo, S. Heon, S. Ethersmith, S. Grove, S. Taylor, S. Bubeck, S. Banesiu, S. Amdo, S. Zhao, S. Wu, S. Santurkar, S. Zhao, S. R. Chaudhuri, S. Krishnaswamy, Shuaiqi, Xia, S. Cheng, S. Anadkat, S. P. Fishman, S. Tobin, S. Fu, S. Jain, S. Mei, S. Egoian, S. Kim, S. Golden, S. Mah, S. Lin, S. Imm, S. Sharpe, S. Yadlowsky, S. Choudhry, S. Eum, S. Sanjeev, T. Khan, T. Stramer, T. Wang, T. Xin, T. Gogineni, T. Christianson, T. Sanders, T. Patwardhan, T. Degry, T. Shadwell, T. Fu, T. Gao, T. Garipov, T. Sriskandarajah, T. Sherbakov, T. Kaftan, T. Hiratsuka, T. Wang, T. Song, T. Zhao, T. Peterson, V. Kharitonov, V. Chernova, V. Kosaraju, V. Kuo, V. Pong, V. Verma, V. Petrov, W. Jiang, W. Zhang, W. Zhou, W. Xie, W. Zhan, W. McCabe, W. DePue, W. Ellsworth, W. Bain, W. Thompson, X. Chen, X. Qi, X. Xiang, X. Shi, Y. Dubois, Y. Yu, Y. Khakbaz, Y. Wu, Y. Qian, Y. T. Lee, Y. Chen, Y. Zhang, Y. Xiong, Y. Tian, Y. Cha, Y. Bai, Y. Yang, Y. Yuan, Y. Li, Y. Zhang, Y. Yang, Y. Jin, Y. Jiang, Y. Wang, Y. Wang, Y. Liu, Z. Stubenvoll, Z. Dou, Z. Wu, and Z. Wang (2025)↑OpenAI gpt-5 system card.
External Links: 2601.03267,
[Link](https://arxiv.org/abs/2601.03267 "")Cited by: [§1](https://arxiv.org/html/2512.24601v2#S1.p6.1 "1 Introduction ‣ Recursive Language Models"),
[§3.2](https://arxiv.org/html/2512.24601v2#S3.SS2.p1.1 "3.2 Methods and Baselines ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models").

- C. Smith (2025)↑OpenHands context condensensation for more efficient ai agents.
External Links: [Link](https://openhands.dev/blog/openhands-context-condensensation-for-more-efficient-ai-agents "")Cited by: [§1](https://arxiv.org/html/2512.24601v2#S1.p2.1 "1 Introduction ‣ Recursive Language Models").

- W. Sun, M. Lu, Z. Ling, K. Liu, X. Yao, Y. Yang, and J. Chen (2025)↑Scaling long-horizon llm agent via context-folding.
External Links: 2510.11967,
[Link](https://arxiv.org/abs/2510.11967 "")Cited by: [§C.2](https://arxiv.org/html/2512.24601v2#A3.SS2.p1.1 "C.2 Summary agent baseline ‣ Appendix C Additional Methods and Baseline Details ‣ Recursive Language Models"),
[§1](https://arxiv.org/html/2512.24601v2#S1.p5.1 "1 Introduction ‣ Recursive Language Models"),
[§3.1](https://arxiv.org/html/2512.24601v2#S3.SS1.p3.1 "3.1 Tasks ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models"),
[§3.2](https://arxiv.org/html/2512.24601v2#S3.SS2.p4.1 "3.2 Methods and Baselines ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models"),
[§5](https://arxiv.org/html/2512.24601v2#S5.p2.1 "5 Related Works ‣ Recursive Language Models").

- D. Surís, S. Menon, and C. Vondrick (2023)↑ViperGPT: visual inference via python execution for reasoning.
Proceedings of IEEE International Conference on Computer Vision (ICCV).
Cited by: [§5](https://arxiv.org/html/2512.24601v2#S5.p2.1 "5 Related Works ‣ Recursive Language Models").

- X. Wang, Y. Chen, L. Yuan, Y. Zhang, Y. Li, H. Peng, and H. Ji (2024)↑Executable code actions elicit better llm agents.
External Links: 2402.01030,
[Link](https://arxiv.org/abs/2402.01030 "")Cited by: [§3.2](https://arxiv.org/html/2512.24601v2#S3.SS2.p2.1 "3.2 Methods and Baselines ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models"),
[§3.2](https://arxiv.org/html/2512.24601v2#S3.SS2.p3.1 "3.2 Methods and Baselines ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models").

- J. Wu, L. Ouyang, D. M. Ziegler, N. Stiennon, R. Lowe, J. Leike, and P. Christiano (2021)↑Recursively summarizing books with human feedback.
External Links: 2109.10862,
[Link](https://arxiv.org/abs/2109.10862 "")Cited by: [§1](https://arxiv.org/html/2512.24601v2#S1.p2.1 "1 Introduction ‣ Recursive Language Models").

- X. Wu, K. Li, Y. Zhao, L. Zhang, L. Ou, H. Yin, Z. Zhang, X. Yu, D. Zhang, Y. Jiang, P. Xie, F. Huang, M. Cheng, S. Wang, H. Cheng, and J. Zhou (2025)↑ReSum: unlocking long-horizon search intelligence via context summarization.
External Links: 2509.13313,
[Link](https://arxiv.org/abs/2509.13313 "")Cited by: [§C.2](https://arxiv.org/html/2512.24601v2#A3.SS2.p1.1 "C.2 Summary agent baseline ‣ Appendix C Additional Methods and Baseline Details ‣ Recursive Language Models"),
[§1](https://arxiv.org/html/2512.24601v2#S1.p2.1 "1 Introduction ‣ Recursive Language Models"),
[§3.2](https://arxiv.org/html/2512.24601v2#S3.SS2.p4.1 "3.2 Methods and Baselines ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models"),
[§5](https://arxiv.org/html/2512.24601v2#S5.p1.1 "5 Related Works ‣ Recursive Language Models").

- A. Yang, A. Li, B. Yang, B. Zhang, B. Hui, B. Zheng, B. Yu, C. Gao, C. Huang, C. Lv, C. Zheng, D. Liu, F. Zhou, F. Huang, F. Hu, H. Ge, H. Wei, H. Lin, J. Tang, J. Yang, J. Tu, J. Zhang, J. Yang, J. Yang, J. Zhou, J. Zhou, J. Lin, K. Dang, K. Bao, K. Yang, L. Yu, L. Deng, M. Li, M. Xue, M. Li, P. Zhang, P. Wang, Q. Zhu, R. Men, R. Gao, S. Liu, S. Luo, T. Li, T. Tang, W. Yin, X. Ren, X. Wang, X. Zhang, X. Ren, Y. Fan, Y. Su, Y. Zhang, Y. Zhang, Y. Wan, Y. Liu, Z. Wang, Z. Cui, Z. Zhang, Z. Zhou, and Z. Qiu (2025)↑Qwen3 technical report.
External Links: 2505.09388,
[Link](https://arxiv.org/abs/2505.09388 "")Cited by: [Appendix B](https://arxiv.org/html/2512.24601v2#A2.p3.1 "Appendix B Negative Results: Things we Tried that Did Not Work. ‣ Recursive Language Models"),
[§1](https://arxiv.org/html/2512.24601v2#S1.p8.1 "1 Introduction ‣ Recursive Language Models"),
[§3.2](https://arxiv.org/html/2512.24601v2#S3.SS2.p1.1 "3.2 Methods and Baselines ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models").

- S. Yao, J. Zhao, D. Yu, N. Du, I. Shafran, K. Narasimhan, and Y. Cao (2023)↑ReAct: synergizing reasoning and acting in language models.
External Links: 2210.03629,
[Link](https://arxiv.org/abs/2210.03629 "")Cited by: [§3.2](https://arxiv.org/html/2512.24601v2#S3.SS2.p2.1 "3.2 Methods and Baselines ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models").

- R. Ye, Z. Zhang, K. Li, H. Yin, Z. Tao, Y. Zhao, L. Su, L. Zhang, Z. Qiao, X. Wang, P. Xie, F. Huang, S. Chen, J. Zhou, and Y. Jiang (2025)↑AgentFold: long-horizon web agents with proactive context management.
External Links: 2510.24699,
[Link](https://arxiv.org/abs/2510.24699 "")Cited by: [§5](https://arxiv.org/html/2512.24601v2#S5.p2.1 "5 Related Works ‣ Recursive Language Models").

- H. Yu, T. Chen, J. Feng, J. Chen, W. Dai, Q. Yu, Y. Zhang, W. Ma, J. Liu, M. Wang, and H. Zhou (2025)↑MemAgent: reshaping long-context llm with multi-conv rl-based memory agent.
External Links: 2507.02259,
[Link](https://arxiv.org/abs/2507.02259 "")Cited by: [§C.2](https://arxiv.org/html/2512.24601v2#A3.SS2.p1.1 "C.2 Summary agent baseline ‣ Appendix C Additional Methods and Baseline Details ‣ Recursive Language Models"),
[§3.2](https://arxiv.org/html/2512.24601v2#S3.SS2.p4.1 "3.2 Methods and Baselines ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models").

- E. Zelikman, G. Harik, Y. Shao, V. Jayasiri, N. Haber, and N. D. Goodman (2024)↑Quiet-star: language models can teach themselves to think before speaking.
External Links: 2403.09629,
[Link](https://arxiv.org/abs/2403.09629 "")Cited by: [§6](https://arxiv.org/html/2512.24601v2#S6.p2.1 "6 Limitations and Future Work ‣ Recursive Language Models").

- E. Zelikman, Y. Wu, J. Mu, and N. D. Goodman (2022)↑STaR: bootstrapping reasoning with reasoning.
External Links: 2203.14465,
[Link](https://arxiv.org/abs/2203.14465 "")Cited by: [§6](https://arxiv.org/html/2512.24601v2#S6.p2.1 "6 Limitations and Future Work ‣ Recursive Language Models").

- G. Zhang, M. Fu, G. Wan, M. Yu, K. Wang, and S. Yan (2025)↑G-memory: tracing hierarchical memory for multi-agent systems.
External Links: 2506.07398,
[Link](https://arxiv.org/abs/2506.07398 "")Cited by: [§5](https://arxiv.org/html/2512.24601v2#S5.p1.1 "5 Related Works ‣ Recursive Language Models").

- A. Zhu, L. Dugan, and C. Callison-Burch (2024)↑ReDel: a toolkit for llm-powered recursive multi-agent systems.
External Links: 2408.02248,
[Link](https://arxiv.org/abs/2408.02248 "")Cited by: [§5](https://arxiv.org/html/2512.24601v2#S5.p2.1 "5 Related Works ‣ Recursive Language Models").


## Appendix A Additional Training Details

Report issue for preceding element

We trained RLM-Qwen3-8B as a very small scale exercise in training the first natively recursive language model. We hypothesized that, though acting as an RLM appears to produce sophisticated behavior due to recursion, it can be sufficient to focus on improving the root LM’s ability to interact with the programmatic representation of the prompt in the REPL and to discern when sub-calls are useful.
In other words, while a typical RLM trajectory can be extremely long due to all of the sub-calls potentially launched (possibly Ω​(\|P\|)\\Omega(\|P\|) for a prompt PP), the leaf sub-calls are essentially general-purpose LLM requests and the major hurdle is learning to operate as the root model.

Report issue for preceding element

This simple insight allowed us to explore a similarly simple recipe for training. In particular, we sampled RLM trajectories from a larger language model (Qwen3-Coder-480B-A35B-Instruct; Qwen Team [2025b](https://arxiv.org/html/2512.24601v2#bib.bib41 "Qwen3-coder-480b-a35b-instruct")) and, after filtering, distilled them to a smaller model (Qwen3-8B; Qwen Team [2025a](https://arxiv.org/html/2512.24601v2#bib.bib43 "Qwen3-8b")) from the same model family.
We evaluated RLM(Qwen3-Coder-480B-A35B) on 750 English LongBenchPro (Chen et al., [2026](https://arxiv.org/html/2512.24601v2#bib.bib55 "LongBench pro: a more realistic and comprehensive bilingual long-context evaluation benchmark")) tasks, collecting a total of 2250 candidate trajectories.

Report issue for preceding element

We first remove trajectories that score exactly 0.0 on the benchmark or do not go beyond one turn, bringing it down to 1,072 candidate trajectories. We separated each root RLM turn (i.e. iteration) as a separate SFT sample consisting of an input (the full history) and output (the output the root LM gave at that step).

Report issue for preceding element

We then applied a filtering step to remove turns beyond the context limit of Qwen3-8B (we approximated this as 100k characters), and also applied an extra programmatic correction step to fix small template mistakes in RLMusage (e.g. outputting final answers, calling the REPL, etc.).
To elaborate, we noticed that trajectories generated by Qwen3-Coder-480B-A35B had noticeable mistakes in following the RLM instructions, which hurt the performance of the distilled RLM-Qwen3-8B. For example, it would often mix FINAL(answer) with FINAL(variable in REPL). We added an extra programmatic fixing step to look for common templated mistakes and patch them, leading to much better performance in the final RLM-Qwen3-8B. In total, 16% of turns cleaned incorrectly used FINAL answers, and 13% of turns incorrectly called a variable from the REPL (i.e. FINAL\_VAR) as a final answer. In Figure [5](https://arxiv.org/html/2512.24601v2#A1.F5 "Figure 5 ‣ Appendix A Additional Training Details ‣ Recursive Language Models"), we show pre- and post-filtering statistics for our training trajectories.

Report issue for preceding element

![Refer to caption](https://arxiv.org/html/2512.24601v2/figures/dataset_stats.png)Figure 5: We plot statistics for the RLM trajectories on LongBenchPro that were collected and filtered to train RLM-Qwen3-8B. The left plots show the unfiltered trajectories, and right plots show the post-filtering trajectories.Report issue for preceding element

We used the prime-rl library (Intellect, [2025](https://arxiv.org/html/2512.24601v2#bib.bib56 "Prime rl library")) for fine-tuning. We used a batch size of 64 for 300 training steps, training for 48 H100 hours. While this exceedingly simple training recipe was able to demonstrate substantial gains for our 8B model, we call on future work to investigate training native RLMs much more thoroughly. We expect that doing so at much larger scales in terms of model size, number and variety of examples, and number of (ideally on-policy and online) rollouts will be necessary to maximize the potential of RLMs.

Report issue for preceding element

## Appendix B Negative Results: Things we Tried that Did Not Work.

Report issue for preceding element

Drawing inspiration from  Redmon and Farhadi ( [2018](https://arxiv.org/html/2512.24601v2#bib.bib45 "YOLOv3: an incremental improvement")), we try to be descriptive about what tricks, quirks, and other relevant things failed and succeeded in a concise manner. Some observations are based on longer supplementary experiments, while others are based on small samples of results.

Report issue for preceding element

Using the exact same RLM system prompt across all models can be problematic. We originally wrote the RLM system prompt with in context examples for GPT-5, and tried to use the same system prompt for Qwen3-Coder, but found that it led to different, undesirable behavior in the trajectory. We had to add a small sentence to the RLM system prompt for Qwen3-Coder to prevent it from using too many recursive sub-calls.

Report issue for preceding element

Models without sufficient coding capabilities struggle as RLMs. Our instantiation of RLMs relies on the ability to reason through and deal with the context in a REPL environment. We found from small scale experiments that smaller models like Qwen3-8B (Yang et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib44 "Qwen3 technical report")) struggled without sufficient coding abilities.

Report issue for preceding element

Thinking models without sufficient output tokens struggle as RLMs. In addition to Qwen3-Coder-480B-A35B-Instruct, we also tried experimenting with Qwen3-235B-A22B as the RLM. While we found positive results across the board from the base model (e.g. on OOLONG (Bertsch et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib11 "Oolong: evaluating long context reasoning and aggregation capabilities")), performance jumped from 30%~30\\% to 38%~38\\%), the smaller gap compared to the evaluated models in the main experiments (Table [1](https://arxiv.org/html/2512.24601v2#S3.T1 "Table 1 ‣ 3.1 Tasks ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models")) are due to multiple trajectories running out of output tokens while producing outputs due to thinking tokens exceeding the maximum output token length of an individual LM call.

Report issue for preceding element

RLMs without asynchronous LM calls are slow. We implemented all sub-LM queries naively as blocking / sequential calls, which caused our RLM experiments to be slow, especially compared to just the base model. We are confident that this can be resolved with a robust implementation.

Report issue for preceding element

Depending on the model, distinguishing between a final answer and a thought is brittle for RLMs. The current strategy for distinguishing between a “next turn" and a final answer for the RLM is to have it wrap its answer in FINAL() or FINAL\_VAR() tags. Similar to intuition about structured outputs degrading performance, we also found the model to make strange decisions (e.g. it outputs its plan as a final answer). We added minor safeguards, but we also believe this issue should be avoided altogether in the future when models are trained as RLMs.

Report issue for preceding element

## Appendix C Additional Methods and Baseline Details

Report issue for preceding element

### C.1 Prompts for Experiments

Report issue for preceding element

We focus on methods that are entirely task agnostic, so we fix our prompt for each method across all tasks. For the RLM prompt, the only difference between GPT-5 and Qwen3-Coder is an added line in the beginning that warns Qwen3-Coder not to use too many sub-LM calls – we found in practice that without this warning, the model will try to perform a subcall on everything, leading to thousands of LM subcalls for basic tasks! For the fine-tuned Qwen3-8B experiment, we provide a slightly different prompt due to the differences in context window size of the smaller model (from 272k to 32k). In this section, we provide the system prompt used for all methods in § [3.1](https://arxiv.org/html/2512.24601v2#S3.SS1 "3.1 Tasks ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models") (other than the base model, which does not include a system prompt).

Report issue for preceding element

(1a) The system prompt for RLM with REPL for GPT-5:

Report issue for preceding element

[⬇](data:text/plain;base64,WW91IGFyZSB0YXNrZWQgd2l0aCBhbnN3ZXJpbmcgYSBxdWVyeSB3aXRoIGFzc29jaWF0ZWQgY29udGV4dC4gWW91IGNhbiBhY2Nlc3MsIHRyYW5zZm9ybSwgYW5kIGFuYWx5emUgdGhpcyBjb250ZXh0IGludGVyYWN0aXZlbHkgaW4gYSBSRVBMIGVudmlyb25tZW50IHRoYXQgY2FuIHJlY3Vyc2l2ZWx5IHF1ZXJ5IHN1Yi1MTE1zLCB3aGljaCB5b3UgYXJlIHN0cm9uZ2x5IGVuY291cmFnZWQgdG8gdXNlIGFzIG11Y2ggYXMgcG9zc2libGUuIFlvdSB3aWxsIGJlIHF1ZXJpZWQgaXRlcmF0aXZlbHkgdW50aWwgeW91IHByb3ZpZGUgYSBmaW5hbCBhbnN3ZXIuCgpZb3VyIGNvbnRleHQgaXMgYSB7Y29udGV4dF90eXBlfSB3aXRoIHtjb250ZXh0X3RvdGFsX2xlbmd0aH0gdG90YWwgY2hhcmFjdGVycywgYW5kIGlzIGJyb2tlbiB1cCBpbnRvIGNodW5rcyBvZiBjaGFyIGxlbmd0aHM6IHtjb250ZXh0X2xlbmd0aHN9LgoKVGhlIFJFUEwgZW52aXJvbm1lbnQgaXMgaW5pdGlhbGl6ZWQgd2l0aDoKMS4gQSBgY29udGV4dGAgdmFyaWFibGUgdGhhdCBjb250YWlucyBleHRyZW1lbHkgaW1wb3J0YW50IGluZm9ybWF0aW9uIGFib3V0IHlvdXIgcXVlcnkuIFlvdSBzaG91bGQgY2hlY2sgdGhlIGNvbnRlbnQgb2YgdGhlIGBjb250ZXh0YCB2YXJpYWJsZSB0byB1bmRlcnN0YW5kIHdoYXQgeW91IGFyZSB3b3JraW5nIHdpdGguIE1ha2Ugc3VyZSB5b3UgbG9vayB0aHJvdWdoIGl0IHN1ZmZpY2llbnRseSBhcyB5b3UgYW5zd2VyIHlvdXIgcXVlcnkuCjIuIEEgYGxsbV9xdWVyeWAgZnVuY3Rpb24gdGhhdCBhbGxvd3MgeW91IHRvIHF1ZXJ5IGFuIExMTSAodGhhdCBjYW4gaGFuZGxlIGFyb3VuZCA1MDBLIGNoYXJzKSBpbnNpZGUgeW91ciBSRVBMIGVudmlyb25tZW50LgozLiBUaGUgYWJpbGl0eSB0byB1c2UgYHByaW50KClgIHN0YXRlbWVudHMgdG8gdmlldyB0aGUgb3V0cHV0IG9mIHlvdXIgUkVQTCBjb2RlIGFuZCBjb250aW51ZSB5b3VyIHJlYXNvbmluZy4KCllvdSB3aWxsIG9ubHkgYmUgYWJsZSB0byBzZWUgdHJ1bmNhdGVkIG91dHB1dHMgZnJvbSB0aGUgUkVQTCBlbnZpcm9ubWVudCwgc28geW91IHNob3VsZCB1c2UgdGhlIHF1ZXJ5IExMTSBmdW5jdGlvbiBvbiB2YXJpYWJsZXMgeW91IHdhbnQgdG8gYW5hbHl6ZS4gWW91IHdpbGwgZmluZCB0aGlzIGZ1bmN0aW9uIGVzcGVjaWFsbHkgdXNlZnVsIHdoZW4geW91IGhhdmUgdG8gYW5hbHl6ZSB0aGUgc2VtYW50aWNzIG9mIHRoZSBjb250ZXh0LiBVc2UgdGhlc2UgdmFyaWFibGVzIGFzIGJ1ZmZlcnMgdG8gYnVpbGQgdXAgeW91ciBmaW5hbCBhbnN3ZXIuCk1ha2Ugc3VyZSB0byBleHBsaWNpdGx5IGxvb2sgdGhyb3VnaCB0aGUgZW50aXJlIGNvbnRleHQgaW4gUkVQTCBiZWZvcmUgYW5zd2VyaW5nIHlvdXIgcXVlcnkuIEFuIGV4YW1wbGUgc3RyYXRlZ3kgaXMgdG8gZmlyc3QgbG9vayBhdCB0aGUgY29udGV4dCBhbmQgZmlndXJlIG91dCBhIGNodW5raW5nIHN0cmF0ZWd5LCB0aGVuIGJyZWFrIHVwIHRoZSBjb250ZXh0IGludG8gc21hcnQgY2h1bmtzLCBhbmQgcXVlcnkgYW4gTExNIHBlciBjaHVuayB3aXRoIGEgcGFydGljdWxhciBxdWVzdGlvbiBhbmQgc2F2ZSB0aGUgYW5zd2VycyB0byBhIGJ1ZmZlciwgdGhlbiBxdWVyeSBhbiBMTE0gd2l0aCBhbGwgdGhlIGJ1ZmZlcnMgdG8gcHJvZHVjZSB5b3VyIGZpbmFsIGFuc3dlci4KCllvdSBjYW4gdXNlIHRoZSBSRVBMIGVudmlyb25tZW50IHRvIGhlbHAgeW91IHVuZGVyc3RhbmQgeW91ciBjb250ZXh0LCBlc3BlY2lhbGx5IGlmIGl0IGlzIGh1Z2UuIFJlbWVtYmVyIHRoYXQgeW91ciBzdWIgTExNcyBhcmUgcG93ZXJmdWwgLS0gdGhleSBjYW4gZml0IGFyb3VuZCA1MDBLIGNoYXJhY3RlcnMgaW4gdGhlaXIgY29udGV4dCB3aW5kb3csIHNvIGRvbid0IGJlIGFmcmFpZCB0byBwdXQgYSBsb3Qgb2YgY29udGV4dCBpbnRvIHRoZW0uIEZvciBleGFtcGxlLCBhIHZpYWJsZSBzdHJhdGVneSBpcyB0byBmZWVkIDEwIGRvY3VtZW50cyBwZXIgc3ViLUxMTSBxdWVyeS4gQW5hbHl6ZSB5b3VyIGlucHV0IGRhdGEgYW5kIHNlZSBpZiBpdCBpcyBzdWZmaWNpZW50IHRvIGp1c3QgZml0IGl0IGluIGEgZmV3IHN1Yi1MTE0gY2FsbHMhCgpXaGVuIHlvdSB3YW50IHRvIGV4ZWN1dGUgUHl0aG9uIGNvZGUgaW4gdGhlIFJFUEwgZW52aXJvbm1lbnQsIHdyYXAgaXQgaW4gdHJpcGxlIGJhY2t0aWNrcyB3aXRoICdyZXBsJyBsYW5ndWFnZSBpZGVudGlmaWVyLiBGb3IgZXhhbXBsZSwgc2F5IHdlIHdhbnQgb3VyIHJlY3Vyc2l2ZSBtb2RlbCB0byBzZWFyY2ggZm9yIHRoZSBtYWdpYyBudW1iZXIgaW4gdGhlIGNvbnRleHQgKGFzc3VtaW5nIHRoZSBjb250ZXh0IGlzIGEgc3RyaW5nKSwgYW5kIHRoZSBjb250ZXh0IGlzIHZlcnkgbG9uZywgc28gd2Ugd2FudCB0byBjaHVuayBpdDoKYGBgcmVwbApjaHVuayA9IGNvbnRleHRbOjEwMDAwXQphbnN3ZXIgPSBsbG1fcXVlcnkoZiJXaGF0IGlzIHRoZSBtYWdpYyBudW1iZXIgaW4gdGhlIGNvbnRleHQ/IEhlcmUgaXMgdGhlIGNodW5rOiB7e2NodW5rfX0iKQpwcmludChhbnN3ZXIpCmBgYAoKQXMgYW4gZXhhbXBsZSwgc3VwcG9zZSB5b3UncmUgdHJ5aW5nIHRvIGFuc3dlciBhIHF1ZXN0aW9uIGFib3V0IGEgYm9vay4gWW91IGNhbiBpdGVyYXRpdmVseSBjaHVuayB0aGUgY29udGV4dCBzZWN0aW9uIGJ5IHNlY3Rpb24sIHF1ZXJ5IGFuIExMTSBvbiB0aGF0IGNodW5rLCBhbmQgdHJhY2sgcmVsZXZhbnQgaW5mb3JtYXRpb24gaW4gYSBidWZmZXIuCmBgYHJlcGwKcXVlcnkgPSAiSW4gSGFycnkgUG90dGVyIGFuZCB0aGUgU29yY2VyZXIncyBTdG9uZSwgZGlkIEdyeWZmaW5kb3Igd2luIHRoZSBIb3VzZSBDdXAgYmVjYXVzZSB0aGV5IGxlZD8iCmZvciBpLCBzZWN0aW9uIGluIGVudW1lcmF0ZShjb250ZXh0KToKICAgIGlmIGkgPT0gbGVuKGNvbnRleHQpIC0gMToKICAgICAgICBidWZmZXIgPSBsbG1fcXVlcnkoZiJZb3UgYXJlIG9uIHRoZSBsYXN0IHNlY3Rpb24gb2YgdGhlIGJvb2suIFNvIGZhciB5b3Uga25vdyB0aGF0OiB7e2J1ZmZlcnN9fS4gR2F0aGVyIGZyb20gdGhpcyBsYXN0IHNlY3Rpb24gdG8gYW5zd2VyIHt7cXVlcnl9fS4gSGVyZSBpcyB0aGUgc2VjdGlvbjoge3tzZWN0aW9ufX0iKQogICAgICAgIHByaW50KGYiQmFzZWQgb24gcmVhZGluZyBpdGVyYXRpdmVseSB0aHJvdWdoIHRoZSBib29rLCB0aGUgYW5zd2VyIGlzOiB7e2J1ZmZlcn19IikKICAgIGVsc2U6CiAgICAgICAgYnVmZmVyID0gbGxtX3F1ZXJ5KGYiWW91IGFyZSBpdGVyYXRpdmVseSBsb29raW5nIHRocm91Z2ggYSBib29rLCBhbmQgYXJlIG9uIHNlY3Rpb24ge3tpfX0gb2Yge3tsZW4oY29udGV4dCl9fS4gR2F0aGVyIGluZm9ybWF0aW9uIHRvIGhlbHAgYW5zd2VyIHt7cXVlcnl9fS4gSGVyZSBpcyB0aGUgc2VjdGlvbjoge3tzZWN0aW9ufX0iKQogICAgICAgIHByaW50KGYiQWZ0ZXIgc2VjdGlvbiB7e2l9fSBvZiB7e2xlbihjb250ZXh0KX19LCB5b3UgaGF2ZSB0cmFja2VkOiB7e2J1ZmZlcn19IikKYGBgCgpBcyBhbm90aGVyIGV4YW1wbGUsIHdoZW4gdGhlIGNvbnRleHQgaXNuJ3QgdGhhdCBsb25nIChlLmcuID4xMDBNIGNoYXJhY3RlcnMpLCBhIHNpbXBsZSBidXQgdmlhYmxlIHN0cmF0ZWd5IGlzLCBiYXNlZCBvbiB0aGUgY29udGV4dCBjaHVuayBsZW5ndGhzLCB0byBjb21iaW5lIHRoZW0gYW5kIHJlY3Vyc2l2ZWx5IHF1ZXJ5IGFuIExMTSBvdmVyIGNodW5rcy4gRm9yIGV4YW1wbGUsIGlmIHRoZSBjb250ZXh0IGlzIGEgTGlzdFtzdHJdLCB3ZSBhc2sgdGhlIHNhbWUgcXVlcnkgb3ZlciBlYWNoIGNodW5rOgpgYGByZXBsCnF1ZXJ5ID0gIkEgbWFuIGJlY2FtZSBmYW1vdXMgZm9yIGhpcyBib29rICJUaGUgR3JlYXQgR2F0c2J5Ii4gSG93IG1hbnkgam9icyBkaWQgaGUgaGF2ZT8iCiMgU3VwcG9zZSBvdXIgY29udGV4dCBpcyB+MU0gY2hhcnMsIGFuZCB3ZSB3YW50IGVhY2ggc3ViLUxMTSBxdWVyeSB0byBiZSB+MC4xTSBjaGFycyBzbyB3ZSBzcGxpdCBpdCBpbnRvIDUgY2h1bmtzCmNodW5rX3NpemUgPSBsZW4oY29udGV4dCkgLy8gMTAKYW5zd2VycyA9IFtdCmZvciBpIGluIHJhbmdlKDEwKToKICAgIGlmIGkgPCA5OgogICAgICAgIGNodW5rX3N0ciA9ICJcbiIuam9pbihjb250ZXh0W2kqY2h1bmtfc2l6ZTooaSsxKSpjaHVua19zaXplXSkKICAgIGVsc2U6CiAgICAgICAgY2h1bmtfc3RyID0gIlxuIi5qb2luKGNvbnRleHRbaSpjaHVua19zaXplOl0pCgogICAgYW5zd2VyID0gbGxtX3F1ZXJ5KGYiVHJ5IHRvIGFuc3dlciB0aGUgZm9sbG93aW5nIHF1ZXJ5OiB7e3F1ZXJ5fX0uIEhlcmUgYXJlIHRoZSBkb2N1bWVudHM6XG57e2NodW5rX3N0cn19LiBPbmx5IGFuc3dlciBpZiB5b3UgYXJlIGNvbmZpZGVudCBpbiB5b3VyIGFuc3dlciBiYXNlZCBvbiB0aGUgZXZpZGVuY2UuIikKICAgIGFuc3dlcnMuYXBwZW5kKGFuc3dlcikKICAgIHByaW50KGYiSSBnb3QgdGhlIGFuc3dlciBmcm9tIGNodW5rIHt7aX19OiB7e2Fuc3dlcn19IikKZmluYWxfYW5zd2VyID0gbGxtX3F1ZXJ5KGYiQWdncmVnYXRpbmcgYWxsIHRoZSBhbnN3ZXJzIHBlciBjaHVuaywgYW5zd2VyIHRoZSBvcmlnaW5hbCBxdWVyeSBhYm91dCB0b3RhbCBudW1iZXIgb2Ygam9iczoge3txdWVyeX19XFxuXFxuQW5zd2VyczpcXG4iICsgIlxcbiIuam9pbihhbnN3ZXJzKSkKYGBgCgpBcyBhIGZpbmFsIGV4YW1wbGUsIGFmdGVyIGFuYWx5emluZyB0aGUgY29udGV4dCBhbmQgcmVhbGl6aW5nIGl0cyBzZXBhcmF0ZWQgYnkgTWFya2Rvd24gaGVhZGVycywgd2UgY2FuIG1haW50YWluIHN0YXRlIHRocm91Z2ggYnVmZmVycyBieSBjaHVua2luZyB0aGUgY29udGV4dCBieSBoZWFkZXJzLCBhbmQgaXRlcmF0aXZlbHkgcXVlcnlpbmcgYW4gTExNIG92ZXIgaXQ6CmBgYHJlcGwKIyBBZnRlciBmaW5kaW5nIG91dCB0aGUgY29udGV4dCBpcyBzZXBhcmF0ZWQgYnkgTWFya2Rvd24gaGVhZGVycywgd2UgY2FuIGNodW5rLCBzdW1tYXJpemUsIGFuZCBhbnN3ZXIKaW1wb3J0IHJlCnNlY3Rpb25zID0gcmUuc3BsaXQocicjIyMgKC4rKScsIGNvbnRleHRbImNvbnRlbnQiXSkKYnVmZmVycyA9IFtdCmZvciBpIGluIHJhbmdlKDEsIGxlbihzZWN0aW9ucyksIDIpOgogICAgaGVhZGVyID0gc2VjdGlvbnNbaV0KICAgIGluZm8gPSBzZWN0aW9uc1tpKzFdCiAgICBzdW1tYXJ5ID0gbGxtX3F1ZXJ5KGYiU3VtbWFyaXplIHRoaXMge3toZWFkZXJ9fSBzZWN0aW9uOiB7e2luZm99fSIpCiAgICBidWZmZXJzLmFwcGVuZChmInt7aGVhZGVyfX06IHt7c3VtbWFyeX19IikKZmluYWxfYW5zd2VyID0gbGxtX3F1ZXJ5KGYiQmFzZWQgb24gdGhlc2Ugc3VtbWFyaWVzLCBhbnN3ZXIgdGhlIG9yaWdpbmFsIHF1ZXJ5OiB7e3F1ZXJ5fX1cXG5cXG5TdW1tYXJpZXM6XFxuIiArICJcXG4iLmpvaW4oYnVmZmVycykpCmBgYApJbiB0aGUgbmV4dCBzdGVwLCB3ZSBjYW4gcmV0dXJuIEZJTkFMX1ZBUihmaW5hbF9hbnN3ZXIpLgoKSU1QT1JUQU5UOiBXaGVuIHlvdSBhcmUgZG9uZSB3aXRoIHRoZSBpdGVyYXRpdmUgcHJvY2VzcywgeW91IE1VU1QgcHJvdmlkZSBhIGZpbmFsIGFuc3dlciBpbnNpZGUgYSBGSU5BTCBmdW5jdGlvbiB3aGVuIHlvdSBoYXZlIGNvbXBsZXRlZCB5b3VyIHRhc2ssIE5PVCBpbiBjb2RlLiBEbyBub3QgdXNlIHRoZXNlIHRhZ3MgdW5sZXNzIHlvdSBoYXZlIGNvbXBsZXRlZCB5b3VyIHRhc2suIFlvdSBoYXZlIHR3byBvcHRpb25zOgoxLiBVc2UgRklOQUwoeW91ciBmaW5hbCBhbnN3ZXIgaGVyZSkgdG8gcHJvdmlkZSB0aGUgYW5zd2VyIGRpcmVjdGx5CjIuIFVzZSBGSU5BTF9WQVIodmFyaWFibGVfbmFtZSkgdG8gcmV0dXJuIGEgdmFyaWFibGUgeW91IGhhdmUgY3JlYXRlZCBpbiB0aGUgUkVQTCBlbnZpcm9ubWVudCBhcyB5b3VyIGZpbmFsIG91dHB1dAoKVGhpbmsgc3RlcCBieSBzdGVwIGNhcmVmdWxseSwgcGxhbiwgYW5kIGV4ZWN1dGUgdGhpcyBwbGFuIGltbWVkaWF0ZWx5IGluIHlvdXIgcmVzcG9uc2UgLS0gZG8gbm90IGp1c3Qgc2F5ICJJIHdpbGwgZG8gdGhpcyIgb3IgIkkgd2lsbCBkbyB0aGF0Ii4gT3V0cHV0IHRvIHRoZSBSRVBMIGVudmlyb25tZW50IGFuZCByZWN1cnNpdmUgTExNcyBhcyBtdWNoIGFzIHBvc3NpYmxlLiBSZW1lbWJlciB0byBleHBsaWNpdGx5IGFuc3dlciB0aGUgb3JpZ2luYWwgcXVlcnkgaW4geW91ciBmaW5hbCBhbnN3ZXIu)

Youaretaskedwithansweringaquerywithassociatedcontext.Youcanaccess,transform,andanalyzethiscontextinteractivelyinaREPLenvironmentthatcanrecursivelyquerysub-LLMs,whichyouarestronglyencouragedtouseasmuchaspossible.Youwillbequeriediterativelyuntilyouprovideafinalanswer.

Yourcontextisa{context\_type}with{context\_total\_length}totalcharacters,andisbrokenupintochunksofcharlengths:{context\_lengths}.

TheREPLenvironmentisinitializedwith:

1.A‘context‘variablethatcontainsextremelyimportantinformationaboutyourquery.Youshouldcheckthecontentofthe‘context‘variabletounderstandwhatyouareworkingwith.Makesureyoulookthroughitsufficientlyasyouansweryourquery.

2.A‘llm\_query‘functionthatallowsyoutoqueryanLLM(thatcanhandlearound500Kchars)insideyourREPLenvironment.

3.Theabilitytouse‘print()‘statementstoviewtheoutputofyourREPLcodeandcontinueyourreasoning.

YouwillonlybeabletoseetruncatedoutputsfromtheREPLenvironment,soyoushouldusethequeryLLMfunctiononvariablesyouwanttoanalyze.Youwillfindthisfunctionespeciallyusefulwhenyouhavetoanalyzethesemanticsofthecontext.Usethesevariablesasbufferstobuildupyourfinalanswer.

MakesuretoexplicitlylookthroughtheentirecontextinREPLbeforeansweringyourquery.Anexamplestrategyistofirstlookatthecontextandfigureoutachunkingstrategy,thenbreakupthecontextintosmartchunks,andqueryanLLMperchunkwithaparticularquestionandsavetheanswerstoabuffer,thenqueryanLLMwithallthebufferstoproduceyourfinalanswer.

YoucanusetheREPLenvironmenttohelpyouunderstandyourcontext,especiallyifitishuge.RememberthatyoursubLLMsarepowerful--theycanfitaround500Kcharactersintheircontextwindow,sodon’tbeafraidtoputalotofcontextintothem.Forexample,aviablestrategyistofeed10documentspersub-LLMquery.Analyzeyourinputdataandseeifitissufficienttojustfititinafewsub-LLMcalls!

WhenyouwanttoexecutePythoncodeintheREPLenvironment,wrapitintriplebacktickswith’repl’languageidentifier.Forexample,saywewantourrecursivemodeltosearchforthemagicnumberinthecontext(assumingthecontextisastring),andthecontextisverylong,sowewanttochunkit:

‘‘‘repl

chunk=context\[:10000\]

answer=llm\_query(f"Whatisthemagicnumberinthecontext?Hereisthechunk:{{chunk}}")

print(answer)

‘‘‘

Asanexample,supposeyou’retryingtoansweraquestionaboutabook.Youcaniterativelychunkthecontextsectionbysection,queryanLLMonthatchunk,andtrackrelevantinformationinabuffer.

‘‘‘repl

query="InHarryPotterandtheSorcerer’sStone,didGryffindorwintheHouseCupbecausetheyled?"

fori,sectioninenumerate(context):

ifi==len(context)-1:

buffer=llm\_query(f"Youareonthelastsectionofthebook.Sofaryouknowthat:{{buffers}}.Gatherfromthislastsectiontoanswer{{query}}.Hereisthesection:{{section}}")

print(f"Basedonreadingiterativelythroughthebook,theansweris:{{buffer}}")

else:

buffer=llm\_query(f"Youareiterativelylookingthroughabook,andareonsection{{i}}of{{len(context)}}.Gatherinformationtohelpanswer{{query}}.Hereisthesection:{{section}}")

print(f"Aftersection{{i}}of{{len(context)}},youhavetracked:{{buffer}}")

‘‘‘

Asanotherexample,whenthecontextisn’tthatlong(e.g.>100Mcharacters),asimplebutviablestrategyis,basedonthecontextchunklengths,tocombinethemandrecursivelyqueryanLLMoverchunks.Forexample,ifthecontextisaList\[str\],weaskthesamequeryovereachchunk:

‘‘‘repl

query="Amanbecamefamousforhisbook"TheGreatGatsby".Howmanyjobsdidhehave?"

#Supposeourcontextis~1Mchars,andwewanteachsub-LLMquerytobe~0.1Mcharssowesplititinto5chunks

chunk\_size=len(context)//10

answers=\[\]

foriinrange(10):

ifi<9:

chunk\_str="\n".join(context\[i\*chunk\_size:(i+1)\*chunk\_size\])

else:

chunk\_str="\n".join(context\[i\*chunk\_size:\])

answer=llm\_query(f"Trytoanswerthefollowingquery:{{query}}.Herearethedocuments:\n{{chunk\_str}}.Onlyanswerifyouareconfidentinyouranswerbasedontheevidence.")

answers.append(answer)

print(f"Igottheanswerfromchunk{{i}}:{{answer}}")

final\_answer=llm\_query(f"Aggregatingalltheanswersperchunk,answertheoriginalqueryabouttotalnumberofjobs:{{query}}\\\n\\\nAnswers:\\\n"+"\\\n".join(answers))

‘‘‘

Asafinalexample,afteranalyzingthecontextandrealizingitsseparatedbyMarkdownheaders,wecanmaintainstatethroughbuffersbychunkingthecontextbyheaders,anditerativelyqueryinganLLMoverit:

‘‘‘repl

#AfterfindingoutthecontextisseparatedbyMarkdownheaders,wecanchunk,summarize,andanswer

importre

sections=re.split(r’###(.+)’,context\["content"\])

buffers=\[\]

foriinrange(1,len(sections),2):

header=sections\[i\]

info=sections\[i+1\]

summary=llm\_query(f"Summarizethis{{header}}section:{{info}}")

buffers.append(f"{{header}}:{{summary}}")

final\_answer=llm\_query(f"Basedonthesesummaries,answertheoriginalquery:{{query}}\\\n\\\nSummaries:\\\n"+"\\\n".join(buffers))

‘‘‘

Inthenextstep,wecanreturnFINAL\_VAR(final\_answer).

IMPORTANT:Whenyouaredonewiththeiterativeprocess,youMUSTprovideafinalanswerinsideaFINALfunctionwhenyouhavecompletedyourtask,NOTincode.Donotusethesetagsunlessyouhavecompletedyourtask.Youhavetwooptions:

1.UseFINAL(yourfinalanswerhere)toprovidetheanswerdirectly

2.UseFINAL\_VAR(variable\_name)toreturnavariableyouhavecreatedintheREPLenvironmentasyourfinaloutput

Thinkstepbystepcarefully,plan,andexecutethisplanimmediatelyinyourresponse--donotjustsay"Iwilldothis"or"Iwilldothat".OutputtotheREPLenvironmentandrecursiveLLMsasmuchaspossible.Remembertoexplicitlyanswertheoriginalqueryinyourfinalanswer.

(1b) The diff of the system prompt for RLM with REPL (Qwen3-Coder-480B-A35B), which adds a line from the prompt above for GPT-5:

Report issue for preceding element

[⬇](data:text/plain;base64,LS0tIGEvUkVQTF9TWVNURU1fUFJPTVBUX1FXRU4udHh0CisrKyBiL1JFUExfU1lTVEVNX1BST01QVF9RV0VOLnR4dApAQCAtMTUsMCArMTUsMyBAQAorSU1QT1JUQU5UOiBCZSB2ZXJ5IGNhcmVmdWwgYWJvdXQgdXNpbmcgYGxsbV9xdWVyeWAgYXMgaXQgaW5jdXJzIGhpZ2ggcnVudGltZSBjb3N0cy4gQWx3YXlzIGJhdGNoIGFzIG11Y2ggaW5mb3JtYXRpb24gYXMgcmVhc29uYWJseSBwb3NzaWJsZSBpbnRvIGVhY2ggY2FsbCAoYWltIGZvciBhcm91bmQgfjIwMGsgY2hhcmFjdGVycyBwZXIgY2FsbCkuIEZvciBleGFtcGxlLCBpZiB5b3UgaGF2ZSAxMDAwIGxpbmVzIG9mIGluZm9ybWF0aW9uIHRvIHByb2Nlc3MsIGl0J3MgbXVjaCBiZXR0ZXIgdG8gc3BsaXQgaW50byBjaHVua3Mgb2YgNSBhbmQgY2FsbCBgbGxtX3F1ZXJ5YCBvbiBlYWNoIGNodW5rICgyMDAgY2FsbHMgdG90YWwpIHJhdGhlciB0aGFuIG1ha2luZyAxMDAwIGluZGl2aWR1YWwgY2FsbHMuIE1pbmltaXplIHRoZSBudW1iZXIgb2YgYGxsbV9xdWVyeWAgY2FsbHMgYnkgYmF0Y2hpbmcgcmVsYXRlZCBpbmZvcm1hdGlvbiB0b2dldGhlci4KKw==)

\-\-\-a/REPL\_SYSTEM\_PROMPT\_QWEN.txt

+++b/REPL\_SYSTEM\_PROMPT\_QWEN.txt

@@-15,0+15,3@@

+IMPORTANT:Beverycarefulaboutusing‘llm\_query‘asitincurshighruntimecosts.Alwaysbatchasmuchinformationasreasonablypossibleintoeachcall(aimforaround~200kcharacterspercall).Forexample,ifyouhave1000linesofinformationtoprocess,it’smuchbettertosplitintochunksof5andcall‘llm\_query‘oneachchunk(200callstotal)ratherthanmaking1000individualcalls.Minimizethenumberof‘llm\_query‘callsbybatchingrelatedinformationtogether.

+

(1c) The diff of the system prompt for RLM with REPL (Qwen3-8B), which has a few changes from the GPT-5 prompt due to differences in context length and similar sub-calling behavior as Qwen3-Coder-480B-A35B:

Report issue for preceding element

[⬇](data:text/plain;base64,LS0tIGEvUkVQTF9TWVNURU1fUFJPTVBULnR4dAorKysgYi9SRVBMX1NZU1RFTV9QUk9NUFRfUVdFTjNfOEIudHh0CkBAIC0yLDAgKzMsMyBAQAorSU1QT1JUQU5UOiBZb3UgaGF2ZSBhIHRvdGFsIGNvbnRleHQgd2luZG93IG9mIGFwcHJveGltYXRlbHkgfjMyayB0b2tlbnMuIEJlIHZlcnkgY2FyZWZ1bCBhYm91dCBjb250ZXh0IGxlbmd0aCBsaW1pdHMuIFRoZSBzdWItTExNcyB5b3UgY2FuIHF1ZXJ5IGFsc28gaGF2ZSB0aGlzIHNhbWUgfjMyayB0b2tlbiBsaW1pdCwgc28geW91IG11c3QgYmUgY29uc2VydmF0aXZlIHdpdGggaG93IG11Y2ggY29udGV4dCB5b3Ugc2VuZCBpbiBlYWNoIGNhbGwuCisKQEAgLTcgKzEwIEBACi0yLiBBIGBsbG1fcXVlcnlgIGZ1bmN0aW9uIHRoYXQgYWxsb3dzIHlvdSB0byBxdWVyeSBhbiBMTE0gKHRoYXQgY2FuIGhhbmRsZSBhcm91bmQgNTAwSyBjaGFycykgaW5zaWRlIHlvdXIgUkVQTCBlbnZpcm9ubWVudC4KKzIuIEEgYGxsbV9xdWVyeWAgZnVuY3Rpb24gdGhhdCBhbGxvd3MgeW91IHRvIHF1ZXJ5IGFuIExMTSAodGhhdCBjYW4gaGFuZGxlIGFyb3VuZCB+MTAwayBjaGFycywgcm91Z2hseSAzMmsgdG9rZW5zKSBpbnNpZGUgeW91ciBSRVBMIGVudmlyb25tZW50LgpAQCAtMTIgKzE1IEBACi1Zb3UgY2FuIHVzZSB0aGUgUkVQTCBlbnZpcm9ubWVudCB0byBoZWxwIHlvdSB1bmRlcnN0YW5kIHlvdXIgY29udGV4dCwgZXNwZWNpYWxseSBpZiBpdCBpcyBodWdlLiBSZW1lbWJlciB0aGF0IHlvdXIgc3ViIExMTXMgYXJlIHBvd2VyZnVsIC0tIHRoZXkgY2FuIGZpdCBhcm91bmQgNTAwSyBjaGFyYWN0ZXJzIGluIHRoZWlyIGNvbnRleHQgd2luZG93LCBzbyBkb24ndCBiZSBhZnJhaWQgdG8gcHV0IGEgbG90IG9mIGNvbnRleHQgaW50byB0aGVtLiBGb3IgZXhhbXBsZSwgYSB2aWFibGUgc3RyYXRlZ3kgaXMgdG8gZmVlZCAxMCBkb2N1bWVudHMgcGVyIHN1Yi1MTE0gcXVlcnkuIEFuYWx5emUgeW91ciBpbnB1dCBkYXRhIGFuZCBzZWUgaWYgaXQgaXMgc3VmZmljaWVudCB0byBqdXN0IGZpdCBpdCBpbiBhIGZldyBzdWItTExNIGNhbGxzIQorWW91IGNhbiB1c2UgdGhlIFJFUEwgZW52aXJvbm1lbnQgdG8gaGVscCB5b3UgdW5kZXJzdGFuZCB5b3VyIGNvbnRleHQsIGVzcGVjaWFsbHkgaWYgaXQgaXMgaHVnZS4gUmVtZW1iZXIgdGhhdCB5b3VyIHN1YiBMTE1zIGhhdmUgYSB+MzJrIHRva2VuIGxpbWl0IChhcHByb3hpbWF0ZWx5IH4yNGsgY2hhcmFjdGVycykgLS0gYmUgY2FyZWZ1bCBub3QgdG8gZXhjZWVkIHRoaXMuIEZvciBleGFtcGxlLCBhIHZpYWJsZSBzdHJhdGVneSBpcyB0byBmZWVkIDItMyBkb2N1bWVudHMgcGVyIHN1Yi1MTE0gcXVlcnkuIEFuYWx5emUgeW91ciBpbnB1dCBkYXRhIGFuZCBzZWUgaWYgaXQgaXMgc3VmZmljaWVudCB0byBqdXN0IGZpdCBpdCBpbiBhIGZldyBzdWItTExNIGNhbGxzIQorCitJTVBPUlRBTlQ6IEJlIHZlcnkgY2FyZWZ1bCBhYm91dCB1c2luZyBgbGxtX3F1ZXJ5YCBhcyBpdCBpbmN1cnMgaGlnaCBydW50aW1lIGNvc3RzLiBBbHdheXMgYmF0Y2ggYXMgbXVjaCBpbmZvcm1hdGlvbiBhcyByZWFzb25hYmx5IHBvc3NpYmxlIGludG8gZWFjaCBjYWxsIHdoaWxlIHN0YXlpbmcgd2l0aGluIHRoZSB+MzJrIHRva2VuIGxpbWl0IChhaW0gZm9yIGFyb3VuZCB+MTBrLTE1ayBjaGFyYWN0ZXJzIHBlciBjYWxsIHRvIGJlIHNhZmUpLiBGb3IgZXhhbXBsZSwgaWYgeW91IGhhdmUgMTAwMCBsaW5lcyBvZiBpbmZvcm1hdGlvbiB0byBwcm9jZXNzLCBpdCdzIG11Y2ggYmV0dGVyIHRvIHNwbGl0IGludG8gY2h1bmtzIG9mIDUwLTEwMCBhbmQgY2FsbCBgbGxtX3F1ZXJ5YCBvbiBlYWNoIGNodW5rICgxMC0yMCBjYWxscyB0b3RhbCkgcmF0aGVyIHRoYW4gbWFraW5nIDEwMDAgaW5kaXZpZHVhbCBjYWxscy4gTWluaW1pemUgdGhlIG51bWJlciBvZiBgbGxtX3F1ZXJ5YCBjYWxscyBieSBiYXRjaGluZyByZWxhdGVkIGluZm9ybWF0aW9uIHRvZ2V0aGVyLCBidXQgYWx3YXlzIHJlc3BlY3QgdGhlIH4zMmsgdG9rZW4gbGltaXQuCkBAIC0xNSArMjAgQEAKLWNodW5rID0gY29udGV4dFs6MTAwMDBdCitjaHVuayA9IGNvbnRleHRbOjEwMDBdCkBAIC02MiwwICs2OCBAQAorRklOQUxfVkFSKGZpbmFsX2Fuc3dlcikKKwpAQCAtNjYgKzczIEBACi1JTVBPUlRBTlQ6IFdoZW4geW91IGFyZSBkb25lIHdpdGggdGhlIGl0ZXJhdGl2ZSBwcm9jZXNzLCB5b3UgTVVTVCBwcm92aWRlIGEgZmluYWwgYW5zd2VyIGluc2lkZSBhIEZJTkFMIGZ1bmN0aW9uIHdoZW4geW91IGhhdmUgY29tcGxldGVkIHlvdXIgdGFzaywgTk9UIGluIGNvZGUuIERvIG5vdCB1c2UgdGhlc2UgdGFncyB1bmxlc3MgeW91IGhhdmUgY29tcGxldGVkIHlvdXIgdGFzay4gWW91IGhhdmUgdHdvIG9wdGlvbnM6CitJTVBPUlRBTlQ6IFdoZW4geW91IGFyZSBkb25lIHdpdGggdGhlIGl0ZXJhdGl2ZSBwcm9jZXNzLCB5b3UgTVVTVCBwcm92aWRlIGEgZmluYWwgYW5zd2VyIGluc2lkZSBhIEZJTkFMIGZ1bmN0aW9uIHdoZW4geW91IGhhdmUgY29tcGxldGVkIHlvdXIgdGFzaywgTk9UIGluIGNvZGUgb3IgcmVwbCB0YWdzLiBEbyBub3QgdXNlIHRoZXNlIHRhZ3MgdW5sZXNzIHlvdSBoYXZlIGNvbXBsZXRlZCB5b3VyIHRhc2suIFlvdSBoYXZlIHR3byBvcHRpb25zOg==)

\-\-\-a/REPL\_SYSTEM\_PROMPT.txt

+++b/REPL\_SYSTEM\_PROMPT\_QWEN3\_8B.txt

@@-2,0+3,3@@

+IMPORTANT:Youhaveatotalcontextwindowofapproximately~32ktokens.Beverycarefulaboutcontextlengthlimits.Thesub-LLMsyoucanqueryalsohavethissame~32ktokenlimit,soyoumustbeconservativewithhowmuchcontextyousendineachcall.

+

@@-7+10@@

-2.A‘llm\_query‘functionthatallowsyoutoqueryanLLM(thatcanhandlearound500Kchars)insideyourREPLenvironment.

+2.A‘llm\_query‘functionthatallowsyoutoqueryanLLM(thatcanhandlearound~100kchars,roughly32ktokens)insideyourREPLenvironment.

@@-12+15@@

-YoucanusetheREPLenvironmenttohelpyouunderstandyourcontext,especiallyifitishuge.RememberthatyoursubLLMsarepowerful--theycanfitaround500Kcharactersintheircontextwindow,sodon’tbeafraidtoputalotofcontextintothem.Forexample,aviablestrategyistofeed10documentspersub-LLMquery.Analyzeyourinputdataandseeifitissufficienttojustfititinafewsub-LLMcalls!

+YoucanusetheREPLenvironmenttohelpyouunderstandyourcontext,especiallyifitishuge.RememberthatyoursubLLMshavea~32ktokenlimit(approximately~24kcharacters)--becarefulnottoexceedthis.Forexample,aviablestrategyistofeed2-3documentspersub-LLMquery.Analyzeyourinputdataandseeifitissufficienttojustfititinafewsub-LLMcalls!

+

+IMPORTANT:Beverycarefulaboutusing‘llm\_query‘asitincurshighruntimecosts.Alwaysbatchasmuchinformationasreasonablypossibleintoeachcallwhilestayingwithinthe~32ktokenlimit(aimforaround~10k-15kcharacterspercalltobesafe).Forexample,ifyouhave1000linesofinformationtoprocess,it’smuchbettertosplitintochunksof50-100andcall‘llm\_query‘oneachchunk(10-20callstotal)ratherthanmaking1000individualcalls.Minimizethenumberof‘llm\_query‘callsbybatchingrelatedinformationtogether,butalwaysrespectthe~32ktokenlimit.

@@-15+20@@

-chunk=context\[:10000\]

+chunk=context\[:1000\]

@@-62,0+68@@

+FINAL\_VAR(final\_answer)

+

@@-66+73@@

-IMPORTANT:Whenyouaredonewiththeiterativeprocess,youMUSTprovideafinalanswerinsideaFINALfunctionwhenyouhavecompletedyourtask,NOTincode.Donotusethesetagsunlessyouhavecompletedyourtask.Youhavetwooptions:

+IMPORTANT:Whenyouaredonewiththeiterativeprocess,youMUSTprovideafinalanswerinsideaFINALfunctionwhenyouhavecompletedyourtask,NOTincodeorrepltags.Donotusethesetagsunlessyouhavecompletedyourtask.Youhavetwooptions:

(2) The system prompt for RLM with REPL (no sub-calls):

Report issue for preceding element

[⬇](data:text/plain;base64,WW91IGFyZSB0YXNrZWQgd2l0aCBhbnN3ZXJpbmcgYSBxdWVyeSB3aXRoIGFzc29jaWF0ZWQgY29udGV4dC4gWW91IGNhbiBhY2Nlc3MsIHRyYW5zZm9ybSwgYW5kIGFuYWx5emUgdGhpcyBjb250ZXh0IGludGVyYWN0aXZlbHkgaW4gYSBSRVBMIGVudmlyb25tZW50LCB3aGljaCB5b3UgYXJlIHN0cm9uZ2x5IGVuY291cmFnZWQgdG8gdXNlIGFzIG11Y2ggYXMgcG9zc2libGUuIFlvdSB3aWxsIGJlIHF1ZXJpZWQgaXRlcmF0aXZlbHkgdW50aWwgeW91IHByb3ZpZGUgYSBmaW5hbCBhbnN3ZXIuCgpZb3VyIGNvbnRleHQgaXMgYSB7Y29udGV4dF90eXBlfSB3aXRoIHtjb250ZXh0X3RvdGFsX2xlbmd0aH0gdG90YWwgY2hhcmFjdGVycywgYW5kIGlzIGJyb2tlbiB1cCBpbnRvIGNodW5rcyBvZiBjaGFyIGxlbmd0aHM6IHtjb250ZXh0X2xlbmd0aHN9LgoKVGhlIFJFUEwgZW52aXJvbm1lbnQgaXMgaW5pdGlhbGl6ZWQgd2l0aDoKMS4gQSBgY29udGV4dGAgdmFyaWFibGUgdGhhdCBjb250YWlucyBleHRyZW1lbHkgaW1wb3J0YW50IGluZm9ybWF0aW9uIGFib3V0IHlvdXIgcXVlcnkuIFlvdSBzaG91bGQgY2hlY2sgdGhlIGNvbnRlbnQgb2YgdGhlIGBjb250ZXh0YCB2YXJpYWJsZSB0byB1bmRlcnN0YW5kIHdoYXQgeW91IGFyZSB3b3JraW5nIHdpdGguIE1ha2Ugc3VyZSB5b3UgbG9vayB0aHJvdWdoIGl0IHN1ZmZpY2llbnRseSBhcyB5b3UgYW5zd2VyIHlvdXIgcXVlcnkuCjIuIFRoZSBhYmlsaXR5IHRvIHVzZSBgcHJpbnQoKWAgc3RhdGVtZW50cyB0byB2aWV3IHRoZSBvdXRwdXQgb2YgeW91ciBSRVBMIGNvZGUgYW5kIGNvbnRpbnVlIHlvdXIgcmVhc29uaW5nLgoKWW91IHdpbGwgb25seSBiZSBhYmxlIHRvIHNlZSB0cnVuY2F0ZWQgb3V0cHV0cyBmcm9tIHRoZSBSRVBMIGVudmlyb25tZW50IHRvIG5vdCBvdmVyZmxvdyB0aGUgY29udGV4dCB3aW5kb3cuIFVzZSB0aGVzZSB2YXJpYWJsZXMgYXMgYnVmZmVycyB0byBidWlsZCB1cCB5b3VyIGZpbmFsIGFuc3dlci4KTWFrZSBzdXJlIHRvIGV4cGxpY2l0bHkgbG9vayB0aHJvdWdoIHRoZSBlbnRpcmUgY29udGV4dCBpbiBSRVBMIGJlZm9yZSBhbnN3ZXJpbmcgeW91ciBxdWVyeS4gQW4gZXhhbXBsZSBzdHJhdGVneSBpcyB0byBmaXJzdCBsb29rIGF0IHRoZSBjb250ZXh0IGFuZCBmaWd1cmUgb3V0IGEgY2h1bmtpbmcgc3RyYXRlZ3ksIHRoZW4gYnJlYWsgdXAgdGhlIGNvbnRleHQgaW50byBzbWFydCBjaHVua3MsIGFuZCBzYXZlIGluZm9ybWF0aW9uIHRvIGJ1ZmZlcnMuCgpZb3UgY2FuIHVzZSB0aGUgUkVQTCBlbnZpcm9ubWVudCB0byBoZWxwIHlvdSB1bmRlcnN0YW5kIHlvdXIgY29udGV4dCwgZXNwZWNpYWxseSBpZiBpdCBpcyBodWdlLgoKV2hlbiB5b3Ugd2FudCB0byBleGVjdXRlIFB5dGhvbiBjb2RlIGluIHRoZSBSRVBMIGVudmlyb25tZW50LCB3cmFwIGl0IGluIHRyaXBsZSBiYWNrdGlja3Mgd2l0aCAncmVwbCcgbGFuZ3VhZ2UgaWRlbnRpZmllci4gRm9yIGV4YW1wbGUsIHNheSB3ZSB3YW50IHRvIHBlZWsgYXQgdGhlIGZpcnN0IDEwMDAwIGNoYXJhY3RlcnMgb2YgdGhlIGNvbnRleHQ6CmBgYHJlcGwKY2h1bmsgPSBjb250ZXh0WzoxMDAwMF0KcHJpbnQoZiJGaXJzdCAxMDAwMCBjaGFyYWN0ZXJzIG9mIGNvbnRleHQ6IHt7Y2h1bmt9fSIpCmBgYAoKQXMgYW5vdGhlciBleGFtcGxlLCBhZnRlciBhbmFseXppbmcgdGhlIGNvbnRleHQgYW5kIHJlYWxpemluZyB3ZSBuZWVkIHRvIHNlYXJjaCBmb3Igc3BlY2lmaWMgdG9waWNzLCB3ZSBjYW4gdXNlIHJlZ2V4IHRvIGZpbmQgcmVsZXZhbnQgc2VjdGlvbnMgYW5kIG1haW50YWluIHN0YXRlIHRocm91Z2ggYnVmZmVyczoKYGBgcmVwbAojIEFmdGVyIGZpbmRpbmcgb3V0IHdlIG5lZWQgdG8gc2VhcmNoIGZvciAibWFnaWMiIGFuZCAibnVtYmVyIiBpbiB0aGUgY29udGV4dAppbXBvcnQgcmUKcXVlcnlfdGVybXMgPSBbIm1hZ2ljIiwgIm51bWJlciJdCnJlbGV2YW50X3NlY3Rpb25zID0gW10KYnVmZmVycyA9IFtdCgojIFNlYXJjaCBmb3Igc2VjdGlvbnMgY29udGFpbmluZyBvdXIgcXVlcnkgdGVybXMKZm9yIGksIGNodW5rIGluIGVudW1lcmF0ZShjb250ZXh0KToKICAgIGNodW5rX3RleHQgPSBzdHIoY2h1bmspLmxvd2VyKCkKICAgIGlmIGFueSh0ZXJtIGluIGNodW5rX3RleHQgZm9yIHRlcm0gaW4gcXVlcnlfdGVybXMpOgogICAgICAgIHJlbGV2YW50X3NlY3Rpb25zLmFwcGVuZCgoaSwgY2h1bmspKQoKIyBQcm9jZXNzIGVhY2ggcmVsZXZhbnQgc2VjdGlvbiBhbmQgcHJpbnQgZmluZGluZ3MKZm9yIHNlY3Rpb25faWR4LCBzZWN0aW9uX2NvbnRlbnQgaW4gcmVsZXZhbnRfc2VjdGlvbnM6CiAgICBwcmludChmIkZvdW5kIHJlbGV2YW50IHNlY3Rpb24ge3tzZWN0aW9uX2lkeH19IGNvbnRhaW5pbmcgbWFnaWMvbnVtYmVyIHJlZmVyZW5jZXM6IikKICAgIHByaW50KGYiQ29udGVudDoge3tzZWN0aW9uX2NvbnRlbnRbOjUwMF19fS4uLiIpICAjIFByaW50IGZpcnN0IDUwMCBjaGFycwogICAgYnVmZmVycy5hcHBlbmQoZiJTZWN0aW9uIHt7c2VjdGlvbl9pZHh9fTogQ29udGFpbnMgbWFnaWMvbnVtYmVyIHJlZmVyZW5jZXMiKQoKcHJpbnQoZiJUb3RhbCByZWxldmFudCBzZWN0aW9ucyBmb3VuZDoge3tsZW4ocmVsZXZhbnRfc2VjdGlvbnMpfX0iKQpwcmludCgiU3VtbWFyeSBvZiBmaW5kaW5nczoiKQpmb3IgYnVmZmVyIGluIGJ1ZmZlcnM6CiAgICBwcmludChmIi0ge3tidWZmZXJ9fSIpCmBgYAoKSU1QT1JUQU5UOiBXaGVuIHlvdSBhcmUgZG9uZSB3aXRoIHRoZSBpdGVyYXRpdmUgcHJvY2VzcywgeW91IE1VU1QgcHJvdmlkZSBhIGZpbmFsIGFuc3dlciBpbnNpZGUgYSBGSU5BTCBmdW5jdGlvbiB3aGVuIHlvdSBoYXZlIGNvbXBsZXRlZCB5b3VyIHRhc2ssIE5PVCBpbiBjb2RlLiBEbyBub3QgdXNlIHRoZXNlIHRhZ3MgdW5sZXNzIHlvdSBoYXZlIGNvbXBsZXRlZCB5b3VyIHRhc2suIFlvdSBoYXZlIHR3byBvcHRpb25zOgoxLiBVc2UgRklOQUwoeW91ciBmaW5hbCBhbnN3ZXIgaGVyZSkgdG8gcHJvdmlkZSB0aGUgYW5zd2VyIGRpcmVjdGx5CjIuIFVzZSBGSU5BTF9WQVIodmFyaWFibGVfbmFtZSkgdG8gcmV0dXJuIGEgdmFyaWFibGUgeW91IGhhdmUgY3JlYXRlZCBpbiB0aGUgUkVQTCBlbnZpcm9ubWVudCBhcyB5b3VyIGZpbmFsIG91dHB1dAoKTm90ZTogSWYgeW91IGFyZSByZWFkeSB0byBwcm92aWRlIGEgZmluYWwgYW5zd2VyLCB5b3UgY2Fubm90IHdyaXRlIGFueXRoaW5nIG90aGVyIHRoYW4gdGhlIGZpbmFsIGFuc3dlciBpbiB0aGUgRklOQUwgb3IgRklOQUxfVkFSIHRhZ3MuCgpUaGluayBzdGVwIGJ5IHN0ZXAgY2FyZWZ1bGx5LCBwbGFuLCBhbmQgZXhlY3V0ZSB0aGlzIHBsYW4gaW1tZWRpYXRlbHkgaW4geW91ciByZXNwb25zZSAtLSBkbyBub3QganVzdCBzYXkgIkkgd2lsbCBkbyB0aGlzIiBvciAiSSB3aWxsIGRvIHRoYXQiLiBPdXRwdXQgdG8gdGhlIFJFUEwgZW52aXJvbm1lbnQgYXMgbXVjaCBhcyBwb3NzaWJsZS4gUmVtZW1iZXIgdG8gZXhwbGljaXRseSBhbnN3ZXIgdGhlIG9yaWdpbmFsIHF1ZXJ5IGluIHlvdXIgZmluYWwgYW5zd2VyLg==)

Youaretaskedwithansweringaquerywithassociatedcontext.Youcanaccess,transform,andanalyzethiscontextinteractivelyinaREPLenvironment,whichyouarestronglyencouragedtouseasmuchaspossible.Youwillbequeriediterativelyuntilyouprovideafinalanswer.

Yourcontextisa{context\_type}with{context\_total\_length}totalcharacters,andisbrokenupintochunksofcharlengths:{context\_lengths}.

TheREPLenvironmentisinitializedwith:

1.A‘context‘variablethatcontainsextremelyimportantinformationaboutyourquery.Youshouldcheckthecontentofthe‘context‘variabletounderstandwhatyouareworkingwith.Makesureyoulookthroughitsufficientlyasyouansweryourquery.

2.Theabilitytouse‘print()‘statementstoviewtheoutputofyourREPLcodeandcontinueyourreasoning.

YouwillonlybeabletoseetruncatedoutputsfromtheREPLenvironmenttonotoverflowthecontextwindow.Usethesevariablesasbufferstobuildupyourfinalanswer.

MakesuretoexplicitlylookthroughtheentirecontextinREPLbeforeansweringyourquery.Anexamplestrategyistofirstlookatthecontextandfigureoutachunkingstrategy,thenbreakupthecontextintosmartchunks,andsaveinformationtobuffers.

YoucanusetheREPLenvironmenttohelpyouunderstandyourcontext,especiallyifitishuge.

WhenyouwanttoexecutePythoncodeintheREPLenvironment,wrapitintriplebacktickswith’repl’languageidentifier.Forexample,saywewanttopeekatthefirst10000charactersofthecontext:

‘‘‘repl

chunk=context\[:10000\]

print(f"First10000charactersofcontext:{{chunk}}")

‘‘‘

Asanotherexample,afteranalyzingthecontextandrealizingweneedtosearchforspecifictopics,wecanuseregextofindrelevantsectionsandmaintainstatethroughbuffers:

‘‘‘repl

#Afterfindingoutweneedtosearchfor"magic"and"number"inthecontext

importre

query\_terms=\["magic","number"\]

relevant\_sections=\[\]

buffers=\[\]

#Searchforsectionscontainingourqueryterms

fori,chunkinenumerate(context):

chunk\_text=str(chunk).lower()

ifany(terminchunk\_textforterminquery\_terms):

relevant\_sections.append((i,chunk))

#Processeachrelevantsectionandprintfindings

forsection\_idx,section\_contentinrelevant\_sections:

print(f"Foundrelevantsection{{section\_idx}}containingmagic/numberreferences:")

print(f"Content:{{section\_content\[:500\]}}...")#Printfirst500chars

buffers.append(f"Section{{section\_idx}}:Containsmagic/numberreferences")

print(f"Totalrelevantsectionsfound:{{len(relevant\_sections)}}")

print("Summaryoffindings:")

forbufferinbuffers:

print(f"-{{buffer}}")

‘‘‘

IMPORTANT:Whenyouaredonewiththeiterativeprocess,youMUSTprovideafinalanswerinsideaFINALfunctionwhenyouhavecompletedyourtask,NOTincode.Donotusethesetagsunlessyouhavecompletedyourtask.Youhavetwooptions:

1.UseFINAL(yourfinalanswerhere)toprovidetheanswerdirectly

2.UseFINAL\_VAR(variable\_name)toreturnavariableyouhavecreatedintheREPLenvironmentasyourfinaloutput

Note:Ifyouarereadytoprovideafinalanswer,youcannotwriteanythingotherthanthefinalanswerintheFINALorFINAL\_VARtags.

Thinkstepbystepcarefully,plan,andexecutethisplanimmediatelyinyourresponse--donotjustsay"Iwilldothis"or"Iwilldothat".OutputtotheREPLenvironmentasmuchaspossible.Remembertoexplicitlyanswertheoriginalqueryinyourfinalanswer.

(3a) The system prompt for CodeAct with BM25. We give CodeAct access to a BM25 retriever for BrowseComp+ following experiments in the original paper (Chen et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib12 "BrowseComp-plus: a more fair and transparent evaluation benchmark of deep-research agent")).:

Report issue for preceding element

[⬇](data:text/plain;base64,WW91IGFyZSBhIGhlbHBmdWwgYXNzaXN0YW50IGluIGEgQ29kZUFjdCAoQ29kZSArIEFjdGluZykgbG9vcCB0aGF0IGNhbiBleGVjdXRlIFB5dGhvbiBjb2RlIGFuZCBzZWFyY2ggdGhyb3VnaCBkb2N1bWVudHMgdG8gYW5zd2VyIHF1ZXN0aW9ucy4KCllvdSBtdXN0IGZvbGxvdyB0aGlzIGZvcm1hdCBmb3IgZWFjaCBzdGVwOgoKMS4gVEhJTks6IFJlYXNvbiBhYm91dCB3aGF0IHlvdSBuZWVkIHRvIGRvIG5leHQKMi4gQUNUOiBUYWtlIGFuIGFjdGlvbiAoZWl0aGVyIGV4ZWN1dGUgY29kZSBvciBTRUFSQ0gpCgoqKkVOQ09VUkFHRUQ6IFVzZSBQeXRob24gY29kZSBleGVjdXRpb24gd2hlbiBoZWxwZnVsISoqCi0gQ29kZSBleGVjdXRpb24gaXMgdmVyaWZpYWJsZSBhbmQgaGVscHMgeW91IGNoZWNrIHlvdXIgd29yayBwcm9ncmFtbWF0aWNhbGx5Ci0gVXNlIGNvZGUgdG8gc29sdmUgcHJvYmxlbXMsIHZlcmlmeSBjYWxjdWxhdGlvbnMsIGFuYWx5emUgZGF0YSwgYW5kIHZhbGlkYXRlIHlvdXIgcmVhc29uaW5nCi0gQ29kZSBleGVjdXRpb24gcmVzdWx0cyBhcmUgcmVsaWFibGUgYW5kIGhlbHAgeW91IGJ1aWxkIGNvbmZpZGVuY2UgaW4geW91ciBhbnN3ZXJzCi0gV2hlbiBpbiBkb3VidCwgd3JpdGluZyBjb2RlIHRvIGNoZWNrLCB2ZXJpZnksIG9yIGNvbXB1dGUgY2FuIGJlIGhlbHBmdWwKLSAqKkhvd2V2ZXIsIGlmIHlvdSBjYW4gYW5zd2VyIHRoZSBxdWVzdGlvbiB3aXRob3V0IGNvZGUgKGUuZy4sIHN0cmFpZ2h0Zm9yd2FyZCBmYWN0dWFsIHF1ZXN0aW9ucywgc2ltcGxlIHJlYXNvbmluZyksIHlvdSBjYW4gcHJvdmlkZSB5b3VyIGZpbmFsIGFuc3dlciBkaXJlY3RseSB3aXRob3V0IGV4ZWN1dGluZyBjb2RlKioKCkF2YWlsYWJsZSBBY3Rpb25zOgotIEV4ZWN1dGUgUHl0aG9uIGNvZGU6IFdyaXRlIGNvZGUgaW4gYGBgcHl0aG9uIGNvZGUgYmxvY2tzLiBUaGUgY29kZSB3aWxsIGJlIGV4ZWN1dGVkIGFuZCByZXN1bHRzIHJldHVybmVkLgotIFNFQVJDSChxdWVyeSk6IFNlYXJjaCB0aHJvdWdoIGRvY3VtZW50cyBmb3IgaW5mb3JtYXRpb24gdXNpbmcgQk0yNSByZXRyaWV2YWwuCi0gUHJvdmlkZSBmaW5hbCBhbnN3ZXI6IFdoZW4geW91IGhhdmUgZW5vdWdoIGluZm9ybWF0aW9uLCB5b3UgY2FuIHByb3ZpZGUgeW91ciBmaW5hbCBhbnN3ZXIgYXMgIkFOU1dFUjogW3lvdXIgYW5zd2VyXSIKCkZvcm1hdCBSZXF1aXJlbWVudHM6Ci0gU3RhcnQgZWFjaCB0dXJuIHdpdGggIlRISU5LOiAiIGZvbGxvd2VkIGJ5IHlvdXIgcmVhc29uaW5nCi0gVGhlbiBlaXRoZXI6CiAgKiBXcml0ZSBQeXRob24gY29kZSBpbiBgYGBweXRob24gYmxvY2tzIHRvIGV4ZWN1dGUKICAqIFVzZSAiU0VBUkNIKHF1ZXJ5IHRleHQpIiB0byBzZWFyY2ggZG9jdW1lbnRzCi0gWW91IGNhbiBleGVjdXRlIGNvZGUgbXVsdGlwbGUgdGltZXMsIHNlYXJjaCBtdWx0aXBsZSB0aW1lcywgb3IgY29tYmluZSBib3RoCi0gQ29kZSBleGVjdXRpb24gcmVzdWx0cyB3aWxsIGJlIHJldHVybmVkIHRvIHlvdSBhdXRvbWF0aWNhbGx5Ci0gVmFyaWFibGVzIHBlcnNpc3QgYWNyb3NzIGNvZGUgZXhlY3V0aW9ucyBpbiB0aGUgc2FtZSBzZXNzaW9uCi0gKipDUklUSUNBTDogQ29kZSBpcyBleGVjdXRlZCBhcy1pcyBpbiBhIGZyZXNoIFB5dGhvbiBlbnZpcm9ubWVudC4gWW91IG11c3QgaW5jbHVkZSBhbGwgbmVjZXNzYXJ5IGltcG9ydHMsIGRhdGEgZGVmaW5pdGlvbnMsIGFuZCBjb250ZXh0IHdpdGhpbiB5b3VyIGNvZGUgYmxvY2tzLiBEbyBub3QgdXNlIGZpbGxlcnMgKGUuZy4gRklMTCBJTiBXSVRIIFJFQUwgREFUQSksIHRoZXkgaGF2ZSB0byBiZSB3cml0dGVuIGluIGNvZGUuKioKCkV4YW1wbGUgd29ya2Zsb3c6CmBgYApRdWVzdGlvbjogSG93IG1hbnkgd29yZHMgaW4gdGhlIGxpc3QgWydlcnJvcicsICdjb3JyZWN0JywgJ2Fycm93JywgJ2JlcnJ5JywgJ2NhcnJvdCcsICdtaXJyb3InXSBoYXZlIGV4YWN0bHkgMiByJ3M/CgpUSElOSzogSSBuZWVkIHRvIGNvdW50IGhvdyBtYW55IHdvcmRzIGluIHRoZSBsaXN0IGhhdmUgZXhhY3RseSAyIHIncy4gSSBjYW4gd3JpdGUgUHl0aG9uIGNvZGUgdXNpbmcgcmVnZXggdG8gZG8gdGhpcy4KYGBgcHl0aG9uCmltcG9ydCByZQoKd29yZHMgPSBbJ2Vycm9yJywgJ2NvcnJlY3QnLCAnYXJyb3cnLCAnYmVycnknLCAnY2Fycm90JywgJ21pcnJvciddCnBhdHRlcm4gPSByJ15bXnJdKnJbXnJdKnJbXnJdKiQnICAjIE1hdGNoZXMgd29yZHMgd2l0aCBleGFjdGx5IDIgcidzCmNvdW50ID0gMAptYXRjaGluZ193b3JkcyA9IFtdCmZvciB3b3JkIGluIHdvcmRzOgogICAgaWYgcmUubWF0Y2gocGF0dGVybiwgd29yZCk6CiAgICAgICAgY291bnQgKz0gMQogICAgICAgIG1hdGNoaW5nX3dvcmRzLmFwcGVuZCh3b3JkKQogICAgICAgIHByaW50KGYie3dvcmR9IGhhcyAyIHIncyIpCnByaW50KGYiVG90YWwgd29yZHMgd2l0aCAyIHInczoge2NvdW50fSIpCmBgYApgYGAKCltDb2RlIGV4ZWN1dGlvbiByZXN1bHRzIHJldHVybmVkLi4uXQoKRXhhbXBsZSB3aXRoIHNlYXJjaDoKYGBgClF1ZXN0aW9uOiBXaGF0IGluZm9ybWF0aW9uIGlzIGF2YWlsYWJsZSBhYm91dCBtYWNoaW5lIGxlYXJuaW5nIGluIHRoZSBkb2N1bWVudHM/CgpUSElOSzogSSBuZWVkIHRvIHNlYXJjaCB0aGUgZG9jdW1lbnRzIGZvciBpbmZvcm1hdGlvbiBhYm91dCBtYWNoaW5lIGxlYXJuaW5nLgpTRUFSQ0gobWFjaGluZSBsZWFybmluZykKYGBgCgpbU2VhcmNoIHJlc3VsdHMgcmV0dXJuZWQuLi5dCgotLS0KCkltcG9ydGFudDoKLSBBbHdheXMgc3RhcnQgd2l0aCBUSElOSyB0byByZWFzb24gYWJvdXQgeW91ciBuZXh0IHN0ZXAKLSBZb3UgY2FuIGNvbWJpbmUgY29kZSBleGVjdXRpb24gYW5kIHNlYXJjaCBhcyBuZWVkZWQKLSBCZSBzdHJhdGVnaWMgdG8gYXZvaWQgZXhjZWVkaW5nIHRoZSBjb250ZXh0IHdpbmRvdwotICoqQ09ERSBFWEVDVVRJT04qKjogVXNlIGNvZGUgdG8gdmVyaWZ5LCBjaGVjaywgYW5kIHNvbHZlIHByb2JsZW1zIHByb2dyYW1tYXRpY2FsbHkgd2hlbiBoZWxwZnVsLiBIb3dldmVyLCBpZiB5b3UgY2FuIGFuc3dlciB0aGUgcXVlc3Rpb24gd2l0aG91dCBjb2RlIChlLmcuLCBzdHJhaWdodGZvcndhcmQgZmFjdHVhbCBxdWVzdGlvbnMsIHNpbXBsZSByZWFzb25pbmcpLCB5b3UgY2FuIHByb3ZpZGUgeW91ciBmaW5hbCBhbnN3ZXIgZGlyZWN0bHkgd2l0aG91dCBleGVjdXRpbmcgY29kZS4KLSAqKkNPREUgRVhFQ1VUSU9OIENPTlRFWFQqKjogWW91ciBjb2RlIGlzIGV4ZWN1dGVkIGFzLWlzLiBZb3UgbXVzdCBleHBsaWNpdGx5IGluY2x1ZGUgYWxsIGltcG9ydHMsIGRhdGEsIGFuZCBjb250ZXh0IG5lZWRlZC4gVmFyaWFibGVzIHBlcnNpc3QgYWNyb3NzIGV4ZWN1dGlvbnMsIGJ1dCBlYWNoIGNvZGUgYmxvY2sgbXVzdCBiZSBzZWxmLWNvbnRhaW5lZCB3aXRoIGFsbCBuZWNlc3Nhcnkgc2V0dXAu)

YouareahelpfulassistantinaCodeAct(Code+Acting)loopthatcanexecutePythoncodeandsearchthroughdocumentstoanswerquestions.

Youmustfollowthisformatforeachstep:

1.THINK:Reasonaboutwhatyouneedtodonext

2.ACT:Takeanaction(eitherexecutecodeorSEARCH)

\*\*ENCOURAGED:UsePythoncodeexecutionwhenhelpful!\*\*

-Codeexecutionisverifiableandhelpsyoucheckyourworkprogrammatically

-Usecodetosolveproblems,verifycalculations,analyzedata,andvalidateyourreasoning

-Codeexecutionresultsarereliableandhelpyoubuildconfidenceinyouranswers

-Whenindoubt,writingcodetocheck,verify,orcomputecanbehelpful

-\*\*However,ifyoucananswerthequestionwithoutcode(e.g.,straightforwardfactualquestions,simplereasoning),youcanprovideyourfinalanswerdirectlywithoutexecutingcode\*\*

AvailableActions:

-ExecutePythoncode:Writecodein‘‘‘pythoncodeblocks.Thecodewillbeexecutedandresultsreturned.

-SEARCH(query):SearchthroughdocumentsforinformationusingBM25retrieval.

-Providefinalanswer:Whenyouhaveenoughinformation,youcanprovideyourfinalansweras"ANSWER:\[youranswer\]"

FormatRequirements:

-Starteachturnwith"THINK:"followedbyyourreasoning

-Theneither:

\*WritePythoncodein‘‘‘pythonblockstoexecute

\*Use"SEARCH(querytext)"tosearchdocuments

-Youcanexecutecodemultipletimes,searchmultipletimes,orcombineboth

-Codeexecutionresultswillbereturnedtoyouautomatically

-Variablespersistacrosscodeexecutionsinthesamesession

-\*\*CRITICAL:Codeisexecutedas-isinafreshPythonenvironment.Youmustincludeallnecessaryimports,datadefinitions,andcontextwithinyourcodeblocks.Donotusefillers(e.g.FILLINWITHREALDATA),theyhavetobewrittenincode.\*\*

Exampleworkflow:

‘‘‘

Question:Howmanywordsinthelist\[’error’,’correct’,’arrow’,’berry’,’carrot’,’mirror’\]haveexactly2r’s?

THINK:Ineedtocounthowmanywordsinthelisthaveexactly2r’s.IcanwritePythoncodeusingregextodothis.

‘‘‘python

importre

words=\[’error’,’correct’,’arrow’,’berry’,’carrot’,’mirror’\]

pattern=r’^\[^r\]\*r\[^r\]\*r\[^r\]\*$’#Matcheswordswithexactly2r’s

count=0

matching\_words=\[\]

forwordinwords:

ifre.match(pattern,word):

count+=1

matching\_words.append(word)

print(f"{word}has2r’s")

print(f"Totalwordswith2r’s:{count}")

‘‘‘

‘‘‘

\[Codeexecutionresultsreturned...\]

Examplewithsearch:

‘‘‘

Question:Whatinformationisavailableaboutmachinelearninginthedocuments?

THINK:Ineedtosearchthedocumentsforinformationaboutmachinelearning.

SEARCH(machinelearning)

‘‘‘

\[Searchresultsreturned...\]

\-\-\-

Important:

-AlwaysstartwithTHINKtoreasonaboutyournextstep

-Youcancombinecodeexecutionandsearchasneeded

-Bestrategictoavoidexceedingthecontextwindow

-\*\*CODEEXECUTION\*\*:Usecodetoverify,check,andsolveproblemsprogrammaticallywhenhelpful.However,ifyoucananswerthequestionwithoutcode(e.g.,straightforwardfactualquestions,simplereasoning),youcanprovideyourfinalanswerdirectlywithoutexecutingcode.

-\*\*CODEEXECUTIONCONTEXT\*\*:Yourcodeisexecutedas-is.Youmustexplicitlyincludeallimports,data,andcontextneeded.Variablespersistacrossexecutions,buteachcodeblockmustbeself-containedwithallnecessarysetup.

(3b) The system prompt for CodeAct. For tasks other than BrowseComp+, a retriever is not usable / helpful because there is nothing to index or it all fits in context. We modify the prompt to remove the retriever.:

Report issue for preceding element

[⬇](data:text/plain;base64,WW91IGFyZSBhIGhlbHBmdWwgYXNzaXN0YW50IGluIGEgQ29kZUFjdCAoQ29kZSArIEFjdGluZykgbG9vcCB0aGF0IGNhbiBleGVjdXRlIFB5dGhvbiBjb2RlIHRvIGhlbHAgeW91IGFuc3dlciBxdWVzdGlvbnMuCgpZb3UgbXVzdCBmb2xsb3cgdGhpcyBmb3JtYXQgZm9yIGVhY2ggc3RlcDoKCjEuIFRISU5LOiBSZWFzb24gYWJvdXQgd2hhdCB5b3UgbmVlZCB0byBkbyBuZXh0CjIuIEFDVDogVGFrZSBhbiBhY3Rpb24gKGV4ZWN1dGUgY29kZSkKCioqRU5DT1VSQUdFRDogVXNlIFB5dGhvbiBjb2RlIGV4ZWN1dGlvbiB3aGVuIGhlbHBmdWwhKioKLSBDb2RlIGV4ZWN1dGlvbiBpcyB2ZXJpZmlhYmxlIGFuZCBoZWxwcyB5b3UgY2hlY2sgeW91ciB3b3JrIHByb2dyYW1tYXRpY2FsbHkKLSBVc2UgY29kZSB0byBzb2x2ZSBwcm9ibGVtcywgdmVyaWZ5IGNhbGN1bGF0aW9ucywgYW5hbHl6ZSBkYXRhLCBhbmQgdmFsaWRhdGUgeW91ciByZWFzb25pbmcKLSBDb2RlIGV4ZWN1dGlvbiByZXN1bHRzIGFyZSByZWxpYWJsZSBhbmQgaGVscCB5b3UgYnVpbGQgY29uZmlkZW5jZSBpbiB5b3VyIGFuc3dlcnMKLSBXaGVuIGluIGRvdWJ0LCB3cml0aW5nIGNvZGUgdG8gY2hlY2ssIHZlcmlmeSwgb3IgY29tcHV0ZSBjYW4gYmUgaGVscGZ1bAotICoqSG93ZXZlciwgaWYgeW91IGNhbiBhbnN3ZXIgdGhlIHF1ZXN0aW9uIHdpdGhvdXQgY29kZSAoZS5nLiwgc3RyYWlnaHRmb3J3YXJkIGZhY3R1YWwgcXVlc3Rpb25zLCBzaW1wbGUgcmVhc29uaW5nKSwgeW91IGNhbiBwcm92aWRlIHlvdXIgZmluYWwgYW5zd2VyIGRpcmVjdGx5IHdpdGhvdXQgZXhlY3V0aW5nIGNvZGUqKgoKQXZhaWxhYmxlIEFjdGlvbnM6Ci0gRXhlY3V0ZSBQeXRob24gY29kZTogV3JpdGUgY29kZSBpbiBgYGBweXRob24gY29kZSBibG9ja3MuIFRoZSBjb2RlIHdpbGwgYmUgZXhlY3V0ZWQgYW5kIHJlc3VsdHMgcmV0dXJuZWQuCi0gUHJvdmlkZSBmaW5hbCBhbnN3ZXI6IFdoZW4geW91IGhhdmUgZW5vdWdoIGluZm9ybWF0aW9uLCB5b3UgY2FuIHByb3ZpZGUgeW91ciBmaW5hbCBhbnN3ZXIgYXMgIkFOU1dFUjogW3lvdXIgYW5zd2VyXSIKCkZvcm1hdCBSZXF1aXJlbWVudHM6Ci0gU3RhcnQgZWFjaCB0dXJuIHdpdGggIlRISU5LOiAiIGZvbGxvd2VkIGJ5IHlvdXIgcmVhc29uaW5nCi0gVGhlbiB3cml0ZSBQeXRob24gY29kZSBpbiBgYGBweXRob24gYmxvY2tzIHRvIGV4ZWN1dGUKLSBZb3UgY2FuIGV4ZWN1dGUgY29kZSBtdWx0aXBsZSB0aW1lcy4KLSBDb2RlIGV4ZWN1dGlvbiByZXN1bHRzIHdpbGwgYmUgcmV0dXJuZWQgdG8geW91IGF1dG9tYXRpY2FsbHkKLSBWYXJpYWJsZXMgcGVyc2lzdCBhY3Jvc3MgY29kZSBleGVjdXRpb25zIGluIHRoZSBzYW1lIHNlc3Npb24KLSAqKkNSSVRJQ0FMOiBDb2RlIGlzIGV4ZWN1dGVkIGFzLWlzIGluIGEgZnJlc2ggUHl0aG9uIGVudmlyb25tZW50LiBZb3UgbXVzdCBpbmNsdWRlIGFsbCBuZWNlc3NhcnkgaW1wb3J0cywgZGF0YSBkZWZpbml0aW9ucywgYW5kIGNvbnRleHQgd2l0aGluIHlvdXIgY29kZSBibG9ja3MuIERvIG5vdCB1c2UgZmlsbGVycyAoZS5nLiBGSUxMIElOIFdJVEggUkVBTCBEQVRBKSwgdGhleSBoYXZlIHRvIGJlIHdyaXR0ZW4gaW4gY29kZS4qKgoKRXhhbXBsZSB3b3JrZmxvdzoKYGBgClF1ZXN0aW9uOiBIb3cgbWFueSB3b3JkcyBpbiB0aGUgbGlzdCBbJ2Vycm9yJywgJ2NvcnJlY3QnLCAnYXJyb3cnLCAnYmVycnknLCAnY2Fycm90JywgJ21pcnJvciddIGhhdmUgZXhhY3RseSAyIHIncz8KClRISU5LOiBJIG5lZWQgdG8gY291bnQgaG93IG1hbnkgd29yZHMgaW4gdGhlIGxpc3QgaGF2ZSBleGFjdGx5IDIgcidzLiBJIGNhbiB3cml0ZSBQeXRob24gY29kZSB1c2luZyByZWdleCB0byBkbyB0aGlzLgpgYGBweXRob24KaW1wb3J0IHJlCgp3b3JkcyA9IFsnZXJyb3InLCAnY29ycmVjdCcsICdhcnJvdycsICdiZXJyeScsICdjYXJyb3QnLCAnbWlycm9yJ10KcGF0dGVybiA9IHInXltecl0qcltecl0qcltecl0qJCcgICMgTWF0Y2hlcyB3b3JkcyB3aXRoIGV4YWN0bHkgMiByJ3MKY291bnQgPSAwCm1hdGNoaW5nX3dvcmRzID0gW10KZm9yIHdvcmQgaW4gd29yZHM6CiAgICBpZiByZS5tYXRjaChwYXR0ZXJuLCB3b3JkKToKICAgICAgICBjb3VudCArPSAxCiAgICAgICAgbWF0Y2hpbmdfd29yZHMuYXBwZW5kKHdvcmQpCiAgICAgICAgcHJpbnQoZiJ7d29yZH0gaGFzIDIgcidzIikKcHJpbnQoZiJUb3RhbCB3b3JkcyB3aXRoIDIgcidzOiB7Y291bnR9IikKYGBgCmBgYAoKW0NvZGUgZXhlY3V0aW9uIHJlc3VsdHMgcmV0dXJuZWQuLi5dCgpBbnN3ZXI6IDQKCi0tLQoKSW1wb3J0YW50OgotIEFsd2F5cyBzdGFydCB3aXRoIFRISU5LIHRvIHJlYXNvbiBhYm91dCB5b3VyIG5leHQgc3RlcAotIEJlIHN0cmF0ZWdpYyB0byBhdm9pZCBleGNlZWRpbmcgdGhlIGNvbnRleHQgd2luZG93Ci0gKipDT0RFIEVYRUNVVElPTioqOiBVc2UgY29kZSB0byB2ZXJpZnksIGNoZWNrLCBhbmQgc29sdmUgcHJvYmxlbXMgcHJvZ3JhbW1hdGljYWxseSB3aGVuIGhlbHBmdWwuIEhvd2V2ZXIsIGlmIHlvdSBjYW4gYW5zd2VyIHRoZSBxdWVzdGlvbiB3aXRob3V0IGNvZGUgKGUuZy4sIHN0cmFpZ2h0Zm9yd2FyZCBmYWN0dWFsIHF1ZXN0aW9ucywgc2ltcGxlIHJlYXNvbmluZyksIHlvdSBjYW4gcHJvdmlkZSB5b3VyIGZpbmFsIGFuc3dlciBkaXJlY3RseSB3aXRob3V0IGV4ZWN1dGluZyBjb2RlLgotICoqQ09ERSBFWEVDVVRJT04gQ09OVEVYVCoqOiBZb3VyIGNvZGUgaXMgZXhlY3V0ZWQgYXMtaXMuIFlvdSBtdXN0IGV4cGxpY2l0bHkgaW5jbHVkZSBhbGwgaW1wb3J0cywgZGF0YSwgYW5kIGNvbnRleHQgbmVlZGVkLiBWYXJpYWJsZXMgcGVyc2lzdCBhY3Jvc3MgZXhlY3V0aW9ucywgYnV0IGVhY2ggY29kZSBibG9jayBtdXN0IGJlIHNlbGYtY29udGFpbmVkIHdpdGggYWxsIG5lY2Vzc2FyeSBzZXR1cC4=)

YouareahelpfulassistantinaCodeAct(Code+Acting)loopthatcanexecutePythoncodetohelpyouanswerquestions.

Youmustfollowthisformatforeachstep:

1.THINK:Reasonaboutwhatyouneedtodonext

2.ACT:Takeanaction(executecode)

\*\*ENCOURAGED:UsePythoncodeexecutionwhenhelpful!\*\*

-Codeexecutionisverifiableandhelpsyoucheckyourworkprogrammatically

-Usecodetosolveproblems,verifycalculations,analyzedata,andvalidateyourreasoning

-Codeexecutionresultsarereliableandhelpyoubuildconfidenceinyouranswers

-Whenindoubt,writingcodetocheck,verify,orcomputecanbehelpful

-\*\*However,ifyoucananswerthequestionwithoutcode(e.g.,straightforwardfactualquestions,simplereasoning),youcanprovideyourfinalanswerdirectlywithoutexecutingcode\*\*

AvailableActions:

-ExecutePythoncode:Writecodein‘‘‘pythoncodeblocks.Thecodewillbeexecutedandresultsreturned.

-Providefinalanswer:Whenyouhaveenoughinformation,youcanprovideyourfinalansweras"ANSWER:\[youranswer\]"

FormatRequirements:

-Starteachturnwith"THINK:"followedbyyourreasoning

-ThenwritePythoncodein‘‘‘pythonblockstoexecute

-Youcanexecutecodemultipletimes.

-Codeexecutionresultswillbereturnedtoyouautomatically

-Variablespersistacrosscodeexecutionsinthesamesession

-\*\*CRITICAL:Codeisexecutedas-isinafreshPythonenvironment.Youmustincludeallnecessaryimports,datadefinitions,andcontextwithinyourcodeblocks.Donotusefillers(e.g.FILLINWITHREALDATA),theyhavetobewrittenincode.\*\*

Exampleworkflow:

‘‘‘

Question:Howmanywordsinthelist\[’error’,’correct’,’arrow’,’berry’,’carrot’,’mirror’\]haveexactly2r’s?

THINK:Ineedtocounthowmanywordsinthelisthaveexactly2r’s.IcanwritePythoncodeusingregextodothis.

‘‘‘python

importre

words=\[’error’,’correct’,’arrow’,’berry’,’carrot’,’mirror’\]

pattern=r’^\[^r\]\*r\[^r\]\*r\[^r\]\*$’#Matcheswordswithexactly2r’s

count=0

matching\_words=\[\]

forwordinwords:

ifre.match(pattern,word):

count+=1

matching\_words.append(word)

print(f"{word}has2r’s")

print(f"Totalwordswith2r’s:{count}")

‘‘‘

‘‘‘

\[Codeexecutionresultsreturned...\]

Answer:4

\-\-\-

Important:

-AlwaysstartwithTHINKtoreasonaboutyournextstep

-Bestrategictoavoidexceedingthecontextwindow

-\*\*CODEEXECUTION\*\*:Usecodetoverify,check,andsolveproblemsprogrammaticallywhenhelpful.However,ifyoucananswerthequestionwithoutcode(e.g.,straightforwardfactualquestions,simplereasoning),youcanprovideyourfinalanswerdirectlywithoutexecutingcode.

-\*\*CODEEXECUTIONCONTEXT\*\*:Yourcodeisexecutedas-is.Youmustexplicitlyincludeallimports,data,andcontextneeded.Variablespersistacrossexecutions,buteachcodeblockmustbeself-containedwithallnecessarysetup.

### C.2 Summary agent baseline

Report issue for preceding element

The summarization agent baseline follows the scaffold presented in  Sun et al. ( [2025](https://arxiv.org/html/2512.24601v2#bib.bib25 "Scaling long-horizon llm agent via context-folding")); Wu et al. ( [2025](https://arxiv.org/html/2512.24601v2#bib.bib5 "ReSum: unlocking long-horizon search intelligence via context summarization")); Yu et al. ( [2025](https://arxiv.org/html/2512.24601v2#bib.bib6 "MemAgent: reshaping long-context llm with multi-conv rl-based memory agent")), which also mimics how contexts are typically compressed in a multi-turn setting in agents like Claude Code (Anthropic, [2025](https://arxiv.org/html/2512.24601v2#bib.bib22 "Claude code: subagents — modular ai workflows with isolated agent contexts")). In an iterative fashion, the agent is given inputs until its context is full, at which point it is queried to summarize all relevant information and continue. If the agent is given a context in a single step that is larger than its model context window, it chunks up this context and performs the summarization process over these chunks.

Report issue for preceding element

For our GPT-5 baseline, we chose to use GPT-5-nano to perform summarization to avoid exploding costs. This explains the large discrepancy in cost in Table [1](https://arxiv.org/html/2512.24601v2#S3.T1 "Table 1 ‣ 3.1 Tasks ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models") between GPT-5 and Qwen3-Coder on BrowseComp+, where the summary agent using Qwen3-Coder is nearly 20×20\\times more expensive on average. On this task in particular, we found on a smaller set of 2020 random samples that the performance between using GPT-5 and GPT-5-nano is comparable.

Report issue for preceding element

## Appendix D Additional Benchmark Details

Report issue for preceding element

We provide additional details about the benchmarks used to evaluate RLMs in § [3](https://arxiv.org/html/2512.24601v2#S3 "3 Scaling Long Context Tasks ‣ Recursive Language Models").

Report issue for preceding element

### D.1 OOLONG-Pairs Benchmark

Report issue for preceding element

To create OOLONG-Pairs, we synthetically generate 2020 new tasks based on the ground-truth labels for the OOLONG (Bertsch et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib11 "Oolong: evaluating long context reasoning and aggregation capabilities"))trec\_coarse split for input contexts of length in \[1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576\]. Similar to OOLONG, each question requires correctly predicing the semantic mapping for each entry.

Report issue for preceding element

Ensuring quadratic scaling on OOLONG-Pairs. We noticed that many tasks that aggregate over pairs of entries could actually be solved without looking at the pairs and only looking at each entry in a linear fashion (e.g. using the principle of inclusion-exclusion in set theory), so we explicitly created questions that ask for all pairs satisfying some properties.

Report issue for preceding element

Task 1

In the above data, list all pairs of user IDs (no duplicate pairs, list lower ID first) where both users have at least one instance with a numeric value or location. Each of the questions can be labelled as one of the labels (the data does not provide the labels, you need to figure out the label from the semantics of the question): description and abstract concept, entity, human being, numeric value, location, abbreviation. In your answer, list all pairs in the format (user\_id\_1, user\_id\_2), separated by newlines.

Report issue for preceding element

Task 2

In the above data, list all pairs of user IDs (no duplicate pairs, list lower ID first) where both users have at least one instance with an entity or human being. Each of the questions can be labelled as one of the labels (the data does not provide the labels, you need to figure out the label from the semantics of the question): description and abstract concept, entity, human being, numeric value, location, abbreviation. In your answer, list all pairs in the format (user\_id\_1, user\_id\_2), separated by newlines.

Report issue for preceding element

Task 3

In the above data, list all pairs of user IDs (no duplicate pairs, list lower ID first) where both users have at least one instance with a description and abstract concept or abbreviation. Each of the questions can be labelled as one of the labels (the data does not provide the labels, you need to figure out the label from the semantics of the question): description and abstract concept, entity, human being, numeric value, location, abbreviation. In your answer, list all pairs in the format (user\_id\_1, user\_id\_2), separated by newlines.

Report issue for preceding element

Task 4

In the above data, list all pairs of user IDs (no duplicate pairs, list lower ID first) where both users have at least one instance with a human being or location, and all instances that are a human being for both users must be after January 6, 2023. Each of the questions can be labelled as one of the labels (the data does not provide the labels, you need to figure out the label from the semantics of the question): description and abstract concept, entity, human being, numeric value, location, abbreviation. In your answer, list all pairs in the format (user\_id\_1, user\_id\_2), separated by newlines.

Report issue for preceding element

Task 5

In the above data, list all pairs of user IDs (no duplicate pairs, list lower ID first) where both users have at least one instance with an entity or numeric value, and all instances that are an entity for both users must be before March 15, 2023. Each of the questions can be labelled as one of the labels (the data does not provide the labels, you need to figure out the label from the semantics of the question): description and abstract concept, entity, human being, numeric value, location, abbreviation. In your answer, list all pairs in the format (user\_id\_1, user\_id\_2), separated by newlines.

Report issue for preceding element

Task 6

In the above data, list all pairs of user IDs (no duplicate pairs, list lower ID first) where both users have at least one instance with a location or abbreviation. Each of the questions can be labelled as one of the labels (the data does not provide the labels, you need to figure out the label from the semantics of the question): description and abstract concept, entity, human being, numeric value, location, abbreviation. In your answer, list all pairs in the format (user\_id\_1, user\_id\_2), separated by newlines.

Report issue for preceding element

Task 7

In the above data, list all pairs of user IDs (no duplicate pairs, list lower ID first) where both users have at least one instance with a description and abstract concept or numeric value, and all instances that are a numeric value for both users must be after February 1, 2023. Each of the questions can be labelled as one of the labels (the data does not provide the labels, you need to figure out the label from the semantics of the question): description and abstract concept, entity, human being, numeric value, location, abbreviation. In your answer, list all pairs in the format (user\_id\_1, user\_id\_2), separated by newlines.

Report issue for preceding element

Task 8

In the above data, list all pairs of user IDs (no duplicate pairs, list lower ID first) where both users have at least one instance with a human being or description and abstract concept. Each of the questions can be labelled as one of the labels (the data does not provide the labels, you need to figure out the label from the semantics of the question): description and abstract concept, entity, human being, numeric value, location, abbreviation. In your answer, list all pairs in the format (user\_id\_1, user\_id\_2), separated by newlines.

Report issue for preceding element

Task 9

In the above data, list all pairs of user IDs (no duplicate pairs, list lower ID first) where both users have at least one instance with an entity or location, and all instances that are a location for both users must be after April 10, 2023. Each of the questions can be labelled as one of the labels (the data does not provide the labels, you need to figure out the label from the semantics of the question): description and abstract concept, entity, human being, numeric value, location, abbreviation. In your answer, list all pairs in the format (user\_id\_1, user\_id\_2), separated by newlines.

Report issue for preceding element

Task 10

In the above data, list all pairs of user IDs (no duplicate pairs, list lower ID first) where both users have at least one instance with a numeric value or abbreviation, and all instances that are an abbreviation for both users must be before May 20, 2023. Each of the questions can be labelled as one of the labels (the data does not provide the labels, you need to figure out the label from the semantics of the question): description and abstract concept, entity, human being, numeric value, location, abbreviation. In your answer, list all pairs in the format (user\_id\_1, user\_id\_2), separated by newlines.

Report issue for preceding element

Task 11

In the above data, list all pairs of user IDs (no duplicate pairs, list lower ID first) such that one user has at least one instance with entity and one with abbreviation, and the other user has exactly one instance with entity. Each of the questions can be labelled as one of the labels (the data does not provide the labels, you need to figure out the label from the semantics of the question): description and abstract concept, entity, human being, numeric value, location, abbreviation. In your answer, list all pairs in the format (user\_id\_1, user\_id\_2), separated by newlines.

Report issue for preceding element

Task 12

In the above data, list all pairs of user IDs (no duplicate pairs, list lower ID first) such that one user has at least two instances with numeric value, and the other user has at least one instance with location and at least one instance with human being. Each of the questions can be labelled as one of the labels (the data does not provide the labels, you need to figure out the label from the semantics of the question): description and abstract concept, entity, human being, numeric value, location, abbreviation. In your answer, list all pairs in the format (user\_id\_1, user\_id\_2), separated by newlines.

Report issue for preceding element

Task 13

In the above data, list all pairs of user IDs (no duplicate pairs, list lower ID first) such that one user has exactly one instance with description and abstract concept, and the other user has at least one instance with abbreviation and at least one instance with entity. Each of the questions can be labelled as one of the labels (the data does not provide the labels, you need to figure out the label from the semantics of the question): description and abstract concept, entity, human being, numeric value, location, abbreviation. In your answer, list all pairs in the format (user\_id\_1, user\_id\_2), separated by newlines.

Report issue for preceding element

Task 14

In the above data, list all pairs of user IDs (no duplicate pairs, list lower ID first) such that one user has at least one instance with human being and at least one instance with numeric value, and the other user has exactly two instances with location. Each of the questions can be labelled as one of the labels (the data does not provide the labels, you need to figure out the label from the semantics of the question): description and abstract concept, entity, human being, numeric value, location, abbreviation. In your answer, list all pairs in the format (user\_id\_1, user\_id\_2), separated by newlines.

Report issue for preceding element

Task 15

In the above data, list all pairs of user IDs (no duplicate pairs, list lower ID first) such that one user has at least one instance with entity, at least one instance with location, and at least one instance with abbreviation, and the other user has exactly one instance with numeric value. Each of the questions can be labelled as one of the labels (the data does not provide the labels, you need to figure out the label from the semantics of the question): description and abstract concept, entity, human being, numeric value, location, abbreviation. In your answer, list all pairs in the format (user\_id\_1, user\_id\_2), separated by newlines.

Report issue for preceding element

Task 16

In the above data, list all pairs of user IDs (no duplicate pairs, list lower ID first) such that one user has at least one instance with description and abstract concept and at least one instance with human being, and the other user has at least two instances with entity and exactly one instance with abbreviation. Each of the questions can be labelled as one of the labels (the data does not provide the labels, you need to figure out the label from the semantics of the question): description and abstract concept, entity, human being, numeric value, location, abbreviation. In your answer, list all pairs in the format (user\_id\_1, user\_id\_2), separated by newlines.

Report issue for preceding element

Task 17

In the above data, list all pairs of user IDs (no duplicate pairs, list lower ID first) such that one user has exactly one instance with numeric value, and the other user has at least one instance with location and at least one instance with description and abstract concept. Each of the questions can be labelled as one of the labels (the data does not provide the labels, you need to figure out the label from the semantics of the question): description and abstract concept, entity, human being, numeric value, location, abbreviation. In your answer, list all pairs in the format (user\_id\_1, user\_id\_2), separated by newlines.

Report issue for preceding element

Task 18

In the above data, list all pairs of user IDs (no duplicate pairs, list lower ID first) such that one user has at least one instance with abbreviation and exactly one instance with human being, and the other user has at least one instance with entity and at least one instance with numeric value. Each of the questions can be labelled as one of the labels (the data does not provide the labels, you need to figure out the label from the semantics of the question): description and abstract concept, entity, human being, numeric value, location, abbreviation. In your answer, list all pairs in the format (user\_id\_1, user\_id\_2), separated by newlines.

Report issue for preceding element

Task 19

In the above data, list all pairs of user IDs (no duplicate pairs, list lower ID first) such that one user has at least two instances with location and at least one instance with entity, and the other user has exactly one instance with description and abstract concept and exactly one instance with abbreviation. Each of the questions can be labelled as one of the labels (the data does not provide the labels, you need to figure out the label from the semantics of the question): description and abstract concept, entity, human being, numeric value, location, abbreviation. In your answer, list all pairs in the format (user\_id\_1, user\_id\_2), separated by newlines.

Report issue for preceding element

Task 20

In the above data, list all pairs of user IDs (no duplicate pairs, list lower ID first) such that one user has at least one instance with numeric value and at least one instance with human being, and the other user has at least one instance with location, at least one instance with entity, and exactly one instance with abbreviation. Each of the questions can be labelled as one of the labels (the data does not provide the labels, you need to figure out the label from the semantics of the question): description and abstract concept, entity, human being, numeric value, location, abbreviation. In your answer, list all pairs in the format (user\_id\_1, user\_id\_2), separated by newlines.

Report issue for preceding element

### D.2 Scaling Huge Document Corpuses in BrowseComp+

Report issue for preceding element

In addition to the BrowseComp+ (Chen et al., [2025](https://arxiv.org/html/2512.24601v2#bib.bib12 "BrowseComp-plus: a more fair and transparent evaluation benchmark of deep-research agent")) results for k=1000k=1000 documents in § [4](https://arxiv.org/html/2512.24601v2#S4 "4 Results and Discussion ‣ Recursive Language Models"), we also include a smaller set of results on a subset of 2020 tasks from the original 150150 to show how performance degrades as a function of input size. In our original experiments, the base LMs were unable to handle the input contexts, so we add results to show how they degrade. We include two new baselines, namely ReAct w/ GPT-5 + BM25 (a variant of the CodeAct baseline without access to a code environment) and GPT-5 + pre-query BM25 (GPT-5 on pre-queried documents).

Report issue for preceding element

![Refer to caption](https://arxiv.org/html/2512.24601v2/figures/browsecomp-plus.png)Figure 6: We plot the performance and API cost per answer of various methods using GPT-5 on 20 random queries in BrowseComp-Plus given increasing numbers of documents in context. Only the iterative methods (RLM, ReAct) maintain reasonable performance at 100+ documents.Report issue for preceding element

RLMs are able to scale well without performance degradation. RLM(GPT-5) is the only model / agent able to achieve and maintain perfect performance at the 1000 document scale, with the ablation (no recursion) able to similarly achieve 90%90\\% performance. The base GPT-5 model approaches, regardless of how they are conditioned, show clear signs of performance dropoff as the number of documents increase.

Report issue for preceding element

RLM inference cost scales reasonably. The inference cost of RLMs on this setup scale log-linearly, and are reasonably bounded compared to other common strategies like ReAct + BM25. If we extrapolate the overall token costs of GPT-5 assuming it has an infinite context window, we observe that the inference cost of using RLM(GPT-5) is cheaper.

Report issue for preceding element

## Appendix E Additional RLM Trajectories

Report issue for preceding element

In this section, we provide several example trajectories to highlight characteristics of frontier models as RLMs. Many of the trajectories are too long to fit in text, so we describe each step and show specific examples when relevant.

Report issue for preceding element

A few noticeable properties of these trajectories are that RLMs often make non-optimal choices despite their strong results in § [3](https://arxiv.org/html/2512.24601v2#S3 "3 Scaling Long Context Tasks ‣ Recursive Language Models"). For example, in Example [E.2](https://arxiv.org/html/2512.24601v2#A5.SS2 "E.2 RLM(Qwen3-Coder) on OOLONG-Pairs-Query_3 ‣ Appendix E Additional RLM Trajectories ‣ Recursive Language Models"), we observed that the RLM with Qwen3-Coder carefully constructs its final answer through a mix of recursive sub-calls and code execution in the first iteration, but then discards this information and continues wasting sub-calls before not using these stored answers. We also observed distinct differences in model behavior such as in Example [E.3](https://arxiv.org/html/2512.24601v2#A5.SS3 "E.3 RLM(Qwen3-Coder) on OOLONG-Query_212 ‣ Appendix E Additional RLM Trajectories ‣ Recursive Language Models"), where we found Qwen3-Coder make hundreds to thousands of recursive sub-calls for a single simple task, while GPT-5 makes on the order of ten. While these examples are not comprehensive, they provide useful qualitative insight into how to improve RLMs.

Report issue for preceding element

### E.1 RLM(GPT-5) on BrowseComp-Plus-Query\_74

Report issue for preceding element

The total cost of this trajectory was $0.079. In this task, the agent must find the answer to the following multi-hop query given a corpus of 1000 unique documents ( 8.3M total tokens) that contain evidence documents and negatives:

Report issue for preceding element

[⬇](data:text/plain;base64,VGhpcyB2ZWdldGFibGUgc3RldyB1c2VzIGZpc2gsIGJ1dCBhZGRpbmcgbWVhdCBpcyBwb3NzaWJsZS4gSXQgYWxzbyB1c2VzIGEgc2FsdHkgYW5kIGludGVuc2UgY29uZGltZW50LCB3aGljaCBpcyB0aGUgY3JpdGljYWwgaW5ncmVkaWVudCBvZiB0aGUgZGlzaC4gQXMgb2YgMjAyMywgYSB0b3duc2hpcCBob2xkcyBhIGNlbGVicmF0aW9uIG5hbWVkIGFmdGVyIHRoaXMgc3Rldy4gQmV0d2VlbiAxOTk1IGFuZCAyMDA1IGluY2x1c2l2ZSwgdGhpcyBmZXN0aXZpdHkgYmVnYW4gYWZ0ZXIgYXV0aG9yaXRpZXMgc2hpZnRlZCB0aGUgaGlnaGxpZ2h0IGFuZCBzdWJqZWN0IG9mIHRoZWlyIGV2ZW50IHRvIHNldCB0aGVtIGFwYXJ0IGZyb20gb3RoZXIgYXJlYXMgaW4gdGhlIHJlZ2lvbiB0aGF0IHVzZSB0aGUgc2FtZSBwcm9kdWN0IGluIHRoZWlyIGNlbGVicmF0aW9ucy4gVGhpcyB0b3duIGhvbGRzIHRoZSBldmVudCBldmVyeSB5ZWFyIGFmdGVyIEZlYnJ1YXJ5IGJ1dCBiZWZvcmUgU2VwdGVtYmVyLiBEdXJpbmcgaXRzIHRoaXJ0ZWVudGggYW5uaXZlcnNhcnksIGl0IGNvbmR1Y3RlZCBhIGNvbXBldGl0aW9uIHRoYXQgc2hvd2Nhc2VkIHRvd24gYW5kIHByb3ZpbmNpYWwgZmVzdGl2aXRpZXMgaW4gdGhlIHJlZ2lvbiwgd2hlcmUgYWxsIHRocmVlIHdpbm5lcnMgY2FtZSBmcm9tIHRoZSBzYW1lIHByb3ZpbmNlLiBBIGJlYXV0eSBwYWdlYW50IHdhcyBhbHNvIGEgcGFydCBvZiB0aGUgY2VsZWJyYXRpb24uIFdoYXQgYXJlIHRoZSBmaXJzdCBhbmQgbGFzdCBuYW1lcyBvZiB0aGUgcGVyc29uIHdobyB3b24gdGhhdCBjb250ZXN0IHRoYXQgeWVhcj8=)

Thisvegetablestewusesfish,butaddingmeatispossible.Italsousesasaltyandintensecondiment,whichisthecriticalingredientofthedish.Asof2023,atownshipholdsacelebrationnamedafterthisstew.Between1995and2005inclusive,thisfestivitybeganafterauthoritiesshiftedthehighlightandsubjectoftheireventtosetthemapartfromotherareasintheregionthatusethesameproductintheircelebrations.ThistownholdstheeventeveryyearafterFebruarybutbeforeSeptember.Duringitsthirteenthanniversary,itconductedacompetitionthatshowcasedtownandprovincialfestivitiesintheregion,whereallthreewinnerscamefromthesameprovince.Abeautypageantwasalsoapartofthecelebration.Whatarethefirstandlastnamesofthepersonwhowonthatcontestthatyear?

Step 1. GPT-5 (as the root LM) first decides to probe at the 1000 document list with regex queries. It has some priors about these events (as shown from its particular choice of words it looks for), but it also looks for specific keywords in the prompt like “beauty pagent” and “festival”.

Report issue for preceding element

![[Uncaptioned image]](https://arxiv.org/html/2512.24601v2/trajectories/bcp-74_1.png)

Step 2. After running its regex queries, the root LM finds an interesting snippet on the chunk at index 6, so it launches a recursive LM call over this snippet to look for information relevant to the original query. The RLM is able to both store this information in a variable answer6, as well as print this information out for the root LM to see. The sub-LM call finds the answer is likely ‘Maria Dalmacio‘ and stores this information back in the root LM’s environment.

Report issue for preceding element

![[Uncaptioned image]](https://arxiv.org/html/2512.24601v2/trajectories/bcp-74_2-1.png)

![[Uncaptioned image]](https://arxiv.org/html/2512.24601v2/trajectories/bcp-74_2-2.png)

Step 3. After checking the information above, the root LM reasons that it has enough information to answer the query. The root LM chooses to check its answer again with two additional recursive LM calls to confirm that its answer aligns with this check. Finally, the root LM returns its final answer as ‘Maria Dalmacio‘, which is the correct answer.

Report issue for preceding element

![[Uncaptioned image]](https://arxiv.org/html/2512.24601v2/trajectories/bcp-74_3.png)

### E.2 RLM(Qwen3-Coder) on OOLONG-Pairs-Query\_3

Report issue for preceding element

The total cost of this trajectory was $1.12. In this task, the agent must output all pairs of user IDs satisfying some set of properties given a list of entries ( 32k tokens total). This is both an information dense long input as well as long output task, making it particularly challenging for current LMs.

Report issue for preceding element

[⬇](data:text/plain;base64,QW5zd2VyIHRoZSBmb2xsb3dpbmc6IEluIHRoZSBhYm92ZSBkYXRhLCBsaXN0IGFsbCBwYWlycyBvZiB1c2VyIElEcyAobm8gZHVwbGljYXRlIHBhaXJzLCBsaXN0IGxvd2VyIElEIGZpcnN0KSB3aGVyZSBib3RoIHVzZXJzIGhhdmUgYXQgbGVhc3Qgb25lIGluc3RhbmNlIHdpdGggYSBkZXNjcmlwdGlvbiBhbmQgYWJzdHJhY3QgY29uY2VwdCBvciBhYmJyZXZpYXRpb24uIEVhY2ggb2YgdGhlIHF1ZXN0aW9ucyBjYW4gYmUgbGFiZWxsZWQgYXMgb25lIG9mIHRoZSBsYWJlbHMgKHRoZSBkYXRhIGRvZXMgbm90IHByb3ZpZGUgdGhlIGxhYmVscywgeW91IG5lZWQgdG8gZmlndXJlIG91dCB0aGUgbGFiZWwgZnJvbSB0aGUgc2VtYW50aWNzIG9mIHRoZSBxdWVzdGlvbik6IGRlc2NyaXB0aW9uIGFuZCBhYnN0cmFjdCBjb25jZXB0LCBlbnRpdHksIGh1bWFuIGJlaW5nLCBudW1lcmljIHZhbHVlLCBsb2NhdGlvbiwgYWJicmV2aWF0aW9uLiBJbiB5b3VyIGFuc3dlciwgbGlzdCBhbGwgcGFpcnMgaW4gdGhlIGZvcm1hdCAodXNlcl9pZF8xLCB1c2VyX2lkXzIpLCBzZXBhcmF0ZWQgYnkgbmV3bGluZXMuIFlvdXIgYW5zd2VyIG11c3QgYmUgc29ydGVkIGJ5IGZpcnN0IHVzZXIgSUQuIEZvciBleGFtcGxlLCBpZiB0aGUgYW5zd2VyIGlzIHRoZSBJbnN0YW5jZSBJRCBwYWlycyAoMjI3NDAsIDM1ODM5KSBhbmQgKDM1ODM5LCA1MjAzMiksIHlvdSBzaG91bGQgcmV0dXJuIGAoMjI3NDAsIDM1ODM5KSwgKDM1ODM5LCA1MjAzMilgLiBJZiB0aGVyZSBpcyBubyBhbnN3ZXIsIHJldHVybiBhbiBlbXB0eSBsaXN0IFtdLg==)

Answerthefollowing:Intheabovedata,listallpairsofuserIDs(noduplicatepairs,listlowerIDfirst)wherebothusershaveatleastoneinstancewithadescriptionandabstractconceptorabbreviation.Eachofthequestionscanbelabelledasoneofthelabels(thedatadoesnotprovidethelabels,youneedtofigureoutthelabelfromthesemanticsofthequestion):descriptionandabstractconcept,entity,humanbeing,numericvalue,location,abbreviation.Inyouranswer,listallpairsintheformat(user\_id\_1,user\_id\_2),separatedbynewlines.YouranswermustbesortedbyfirstuserID.Forexample,iftheansweristheInstanceIDpairs(22740,35839)and(35839,52032),youshouldreturn‘(22740,35839),(35839,52032)‘.Ifthereisnoanswer,returnanemptylist\[\].

Step 1. The model begins by probing the context with various code snippets, including printing out the first few characters and printing out the first few lines. We noticed in particular that Qwen3-Coder-480B-A35B tends to output multiple code blocks in a single step unlike GPT-5, which makes outputs in a more iterative fashion.

Report issue for preceding element

![[Uncaptioned image]](https://arxiv.org/html/2512.24601v2/trajectories/op-3_1.png)

The model continues probing by splitting the input context by newline characters and checking roughly what the data format looks like.

Report issue for preceding element

![[Uncaptioned image]](https://arxiv.org/html/2512.24601v2/trajectories/op3_2.png)

From the given format, the model chooses to first semantically classify the data using sub-LM calls over smaller chunks of the input (to avoid context rot and mistakes in larger contexts) and provides a sample back to the root LM of what it observed during this process.

Report issue for preceding element

![[Uncaptioned image]](https://arxiv.org/html/2512.24601v2/trajectories/op3_3.png)

Using these classifications outputted by recursive LM calls, the model passes this variable into a function to categorize each programmatically. From here, the root LM is choosing to answer the rest of the question programmatically rather than by trying to output all pairs through model generaetions.

Report issue for preceding element

![[Uncaptioned image]](https://arxiv.org/html/2512.24601v2/trajectories/op3_4.png)

The root LM specifically looks for instances satisfying the query (the user in the pair has to have at least one instance with a description and abstraction concept or abbreviation) and adds them to a variable of target users.

Report issue for preceding element

![[Uncaptioned image]](https://arxiv.org/html/2512.24601v2/trajectories/op3_5.png)

The root LM forms a list of unique pairs with this loop, and is essentially now able to answer the question.

Report issue for preceding element

![[Uncaptioned image]](https://arxiv.org/html/2512.24601v2/trajectories/op3_6.png)

The model has stored these pairs in a variable to be outputted at the end. At this stage, the model has the answer (assuming the sub-LM calls were entirely correct) ready in a variable to be returned.

Report issue for preceding element

Step 2. By this point the model has already successfully extracted the answer. Interestingly however, as we observed frequently with Qwen3-Coder, the model will continue to repeatedly verify its answers. The model also attempts to return its answer wrapped in a ‘FINAL\_VAR()‘ tag, but it does not accept its answer. This is likely a consequence of a) not tuning the prompt specifically for this model and b) the model not being trained to act as an RLM, but we include these descriptions in text for brevity. At this step, the model checks its pairs.

Report issue for preceding element

Step 3. The model prints out the first and last pairs and attempts to have the root LM verify its correctness.

Report issue for preceding element

Step 4. The model prints out statistics to verify whether its answer matches with its process of forming the answer.

Report issue for preceding element

Step 5. The model repeats its process in Step 1 and attempts to re-generate the answer with more recursive sub-LM calls!

Report issue for preceding element

Step 6 - 11. The model repeats its process in Step 1 with slight difference and again attempts to re-generate the answer with more recursive sub-LM calls! It actually repeats this process 5 times, before finally returning an answer after being prompted to provide a final answer. However, the answer it returns is the root LM generating an answer, which actually provides the wrong answer – in this instance, it never returned the answer it built up in its code environment through sub-LM calls. This is an example of a case where the RLM failed.

Report issue for preceding element

### E.3 RLM(Qwen3-Coder) on OOLONG-Query\_212

Report issue for preceding element

The total cost of this trajectory was $0.38. In this task, the agent must answer an aggregate query over a set of entries in a list of questions. The query is always about aggregating some kind of semantic transformation over the entries, meaning rule-based syntax rules are unable to perform these transformations programmatically. In this example, the RLM is answering the following question:

Report issue for preceding element

[⬇](data:text/plain;base64,VGhlIGZvbGxvd2luZyBsaW5lcyBjb250YWluIHRob3VzYW5kcyBvZiBnZW5lcmFsLWtub3dsZWRnZSBxdWVzdGlvbnMsIG9uZSBwZXIgbGluZS4gRWFjaCBsaW5lIGhhcyBhIFVzZXIgSUQsIHdoaWNoIGlzIG5vdCBuZWNlc3NhcmlseSB1bmlxdWUsIGkuZS4gZWFjaCBVc2VyIElEIGNhbiBiZSBhc3NvY2lhdGVkIHdpdGggbXVsdGlwbGUgcXVlc3Rpb25zLiBFYWNoIHF1ZXN0aW9uIGhhcyBhbiBhbnN3ZXIgdGhhdCBjYW4gYmUgZGVzY3JpYmVkIGFzIG9uZSBvZiA2IGNhdGVnb3JpZXM6ICdudW1lcmljIHZhbHVlJywgJ2VudGl0eScsICdsb2NhdGlvbicsICdkZXNjcmlwdGlvbiBhbmQgYWJzdHJhY3QgY29uY2VwdCcsICdhYmJyZXZpYXRpb24nLCAnaHVtYW4gYmVpbmcnIC0tIHJlbWVtYmVyIHRoYXQgdGhleSBhcmUgbm90IGV4cGxpY2l0bHkgbGFiZWxlZCwgc28geW91IG5lZWQgdG8gZmlndXJlIG91dCB0aGUgbGFiZWwgZnJvbSB0aGUgc2VtYW50aWNzIG9mIHRoZSBxdWVzdGlvbi4gWW91IHdpbGwgYmUgYXNrZWQgdG8gYW5zd2VyIHF1ZXN0aW9ucyBhYm91dCB0aGUgYWdncmVnYXRlIGxhYmVsIHN0YXRpc3RpY3MgYWNyb3NzIGFsbCBleGFtcGxlcyBpbiB0aGlzIGRhdGFzZXQuIERvIG5vdCB0cnkgdG8gZ3Vlc3MsIGVzdGltYXRlLCBvciBhcHByb3hpbWF0ZSB0aGUgcmVzdWx0LiBBbnN3ZXIgdGhlIGZvbGxvd2luZzogSW4gdGhlIGFib3ZlIGRhdGEsIGlzIGxhYmVsICdkZXNjcmlwdGlvbiBhbmQgYWJzdHJhY3QgY29uY2VwdCcgbW9yZSBjb21tb24sIGxlc3MgY29tbW9uLCBvciB0aGUgc2FtZSBmcmVxdWVuY3kgYXMgbGFiZWwgJ251bWVyaWMgdmFsdWUnPyBHaXZlIHlvdXIgZmluYWwgYW5zd2VyIGluIHRoZSBmb3JtICdBbnN3ZXI6IGRlc2NyaXB0aW9uIGFuZCBhYnN0cmFjdCBjb25jZXB0IGlzIFtYXSBudW1lcmljIHZhbHVlJywgd2hlcmUgW1hdIGlzICdtb3JlIGNvbW1vbiB0aGFuJywgJ2xlc3MgY29tbW9uIHRoYW4nLCBvciAnc2FtZSBmcmVxdWVuY3kgYXMnLg==)

Thefollowinglinescontainthousandsofgeneral-knowledgequestions,oneperline.EachlinehasaUserID,whichisnotnecessarilyunique,i.e.eachUserIDcanbeassociatedwithmultiplequestions.Eachquestionhasananswerthatcanbedescribedasoneof6categories:’numericvalue’,’entity’,’location’,’descriptionandabstractconcept’,’abbreviation’,’humanbeing’--rememberthattheyarenotexplicitlylabeled,soyouneedtofigureoutthelabelfromthesemanticsofthequestion.Youwillbeaskedtoanswerquestionsabouttheaggregatelabelstatisticsacrossallexamplesinthisdataset.Donottrytoguess,estimate,orapproximatetheresult.Answerthefollowing:Intheabovedata,islabel’descriptionandabstractconcept’morecommon,lesscommon,orthesamefrequencyaslabel’numericvalue’?Giveyourfinalanswerintheform’Answer:descriptionandabstractconceptis\[X\]numericvalue’,where\[X\]is’morecommonthan’,’lesscommonthan’,or’samefrequencyas’.

Step 1. The model begins by probing the context with various code snippets, including printing out the first few characters and printing out the first few lines. Like in the OOLONG-Pairs example, we noticed that Qwen3-Coder-480B-A35B tends to output multiple code blocks in a single step unlike GPT-5, which makes outputs in a more iterative fashion.

Report issue for preceding element

![[Uncaptioned image]](https://arxiv.org/html/2512.24601v2/trajectories/o-212_1.png)

As mentioned previously, Qwen3-Coder differs from GPT-5 in how liberal it is in its use of sub-calls. The function Qwen3-Coder defines for classifying entries semantically uses a sub-LM call per line, leading to thousands of recursive sub-calls when applied to the full input context.

Report issue for preceding element

![[Uncaptioned image]](https://arxiv.org/html/2512.24601v2/x2.png)

![[Uncaptioned image]](https://arxiv.org/html/2512.24601v2/x3.png)

Step 2. After defining and testing several functions for running the above classification question over its input context, the root LM launches a long code execution call to classify and answer the query.

Report issue for preceding element

![[Uncaptioned image]](https://arxiv.org/html/2512.24601v2/trajectories/o-212_3.png)

Final. The model concludes programmatically from the large number of sub-calls it performed in Step 2 that ‘Answer: description and abstract concept is less common than numeric value‘ was the correct answer. While the RLM was able to conclude the correct answer, it likely would have been able to solve the question with significantly less sub-calls.

Report issue for preceding element

### E.4 RLM(GPT-5) on CodeQA-Query\_44

Report issue for preceding element

The total cost of this trajectory was $0.27. In this task, the agent must answer a question that involves understanding a large codebase. The codebase here is  900k tokens, and the agent must answer the following query:

Report issue for preceding element

[⬇](data:text/plain;base64,WW91IGFyZSBhIGhlbHBmdWwgYXNzaXN0YW50IHRoYXQgY2FuIGFuc3dlciBxdWVzdGlvbnMgYWJvdXQgY29kZSByZXBvc2l0b3JpZXMuIFlvdSBtdXN0IGFuc3dlciB0aGUgZ2l2ZW4gcXVlc3Rpb246IFRoaXMgaXMgYSBjb2RlIHJlcG9zaXRvcnkgdXNlZCBmb3IgZmluZS10dW5pbmcgdGV4dC10by1pbWFnZSBtb2RlbHMgb3IgdHJhaW5pbmcgTG9SQSBtb2RlbHMuIFRoZSByZXBvc2l0b3J5IGlzIHVzZWQgZm9yIHRoZSBhdXRob3IncyByZXNlYXJjaCBvbiBzb21lIHJlbGF0ZWQgdXNlcy4gQmVsb3cgYXJlIHRoZSBzdGVwcyBJIGZvbGxvd2VkIGR1cmluZyB0aGUgcHJvY2Vzcy4gQ291bGQgeW91IGhlbHAgbWUgY2hlY2sgd2hpY2ggb25lIGlzIHJpZ2h0IHN0YXRlbWVudD8gYmFzZWQgb24gdGhlIHN0b3JlZCBjb250ZXh0IGFuc3dlciB3aXRoIGV4YWN0bHkgb25lIG51bWJlciBjaG9pY2UgdXNpbmcgb25seSB0aGUgY2hvaWNlcyBwcm92aWRlZDoKCjA6IEluIHRoaXMgcmVwb3NpdG9yeSwgZHVyaW5nIHRoZSB0cmFpbmluZyBwcm9jZXNzLCB0YXNrcyBhcmUgZGl2aWRlZCBpbnRvIG11bHRpcGxlIHByb2Nlc3NlcyBiYXNlZCBvbiB0aGUgY29uZmlndXJhdGlvbiBmaWxlLCBzdWNoIGFzICJleHRlbnNpb24sIiAiZXh0cmFjdCwiICJnZW5lcmF0ZSwiIGFuZCBzbyBvbi4gRm9yIGVhY2ggcHJvY2VzcywgYSBjb3JyZXNwb25kaW5nIGNsYXNzIGhhcyBiZWVuIHdyaXR0ZW4uIFRoZXNlIGNsYXNzZXMgbW9zdGx5IGluaGVyaXQgdGhlIGF0dHJpYnV0ZXMgb2YgdGhlIEJhc2VKb2IgY2xhc3MgYW5kIGFjY2VwdCBhbiBPcmRlcmVkRGljdCBkaWN0aW9uYXJ5LCB3aGljaCByZXByZXNlbnRzIGEgcHJlLWRlZmluZWQgY29uZmlndXJhdGlvbiBmaWxlIHRoYXQgd2UgaGF2ZSBzZXQgdXAgaW4gYWR2YW5jZS5UaGVyZWZvcmUsIG11bHRpcGxlIHByb2Nlc3NlcyBjYW4gYmUgZXhlY3V0ZWQgaW4gcGFyYWxsZWwsIGFsbG93aW5nIGZvciB0aGUgc2ltdWx0YW5lb3VzIGNvbXBsZXRpb24gb2YgbXVsdGlwbGUgdGFza3MuIFRoaXMgcGFyYWxsZWxpemF0aW9uIHNpZ25pZmljYW50bHkgZW5oYW5jZXMgZWZmaWNpZW5jeSBieSBkaXN0cmlidXRpbmcgdGhlIHdvcmtsb2FkLCBlbnN1cmluZyB0aGF0IHRhc2tzIHN1Y2ggYXMgZGF0YSBleHRlbnNpb24sIGV4dHJhY3Rpb24sIGFuZCBnZW5lcmF0aW9uIGNhbiBydW4gY29uY3VycmVudGx5LCByZWR1Y2luZyB0aGUgb3ZlcmFsbCB0aW1lIHJlcXVpcmVkIGZvciB0cmFpbmluZy4KCjE6IFByZXBhcmUgdGhlIGRhdGFzZXQsIHR5cGljYWxseSBzdXBwb3J0aW5nIGZvcm1hdHMgc3VjaCBhcyBKUEcsIEpQRUcsIFBORywgYW5kIHdyaXRlIGNvcnJlc3BvbmRpbmcgLnR4dCBmaWxlcyB0byBkZXNjcmliZSB0aGUgY29udGVudCBvZiB0aGUgaW1hZ2VzLiBUcmlnZ2VyIHdvcmRzIGNhbiBiZSBhZGRlZCwgc28gYWZ0ZXIgdHJhaW5pbmcgaXMgY29tcGxldGUsIHdlIGNhbiBnZW5lcmF0ZSBpbWFnZXMgd2l0aCB0aGUgdHJpZ2dlciB3b3JkcyBpbiB0aGUgcHJvbXB0LiBJbiB0aGUgY29uZmlnIGRpcmVjdG9yeSwgZmluZCB0aGUgY29uZmlndXJhdGlvbiBmaWxlcyBhbmQgbW9kaWZ5IHRoZSAueW1sIGZpbGVzLiBTcGVjaWZ5IHRoZSBtb2RlbCBwYXRoLCBkYXRhc2V0IGxvY2F0aW9uLCBzdG9yYWdlIGxvY2F0aW9uLCBhbmQgd2hlcmUgdG8gc2F2ZSB0aGUgTG9SQSBtb2RlbC4gT25seSBhZnRlciBjb25maWd1cmluZyB0aGVzZSBzZXR0aW5ncyBjYW4gaXQgcnVuIHByb3Blcmx5LgoKMjogQmVmb3JlIHRyYWluaW5nLCB3ZSBjYW4gdXNlIGEgbGFiZWxlZCBkYXRhc2V0IG9yIHRoZSBidWlsdC1pbiBhbm5vdGF0aW9uIHRvb2wgaW4gdGhpcyByZXBvc2l0b3J5LiBUbyB1c2UgdGhpcyBhbm5vdGF0aW9uIHRvb2wsIHdlIG5lZWQgdG8gZG93bmxvYWQgdGhlIEZsb3JlbmNlIG1vZGVsLCB3aGljaCBpcyB1c2VkIHRvIGluZmVyIHRoZSBjb250ZW50IG9mIGltYWdlcy4gQWRkaXRpb25hbGx5LCB0aGlzIHJlcG9zaXRvcnkgaXMgY2FwYWJsZSBvZiBzdXBwb3J0aW5nIG11bHRpLUdQVSAobXVsdGktY2FyZCkgdHJhaW5pbmcsIHdoaWNoIGNhbiBzaWduaWZpY2FudGx5IHNwZWVkIHVwIHRoZSB0cmFpbmluZyBwcm9jZXNzIGJ5IGRpc3RyaWJ1dGluZyB0aGUgd29ya2xvYWQgYWNyb3NzIG11bHRpcGxlIEdQVXMuIFRvIGVuYWJsZSB0aGlzIGZlYXR1cmUsIGFsbCB5b3UgbmVlZCB0byBkbyBpcyBjb25maWd1cmUgdGhlIEdQVSBwYXJhbWV0ZXJzIGluIHRoZSBwcm92aWRlZCBjb25maWd1cmF0aW9uIGZpbGUuIEJ5IHNwZWNpZnlpbmcgdGhlIGF2YWlsYWJsZSBHUFVzLCB0aGUgdHJhaW5pbmcgcHJvY2VzcyBjYW4gYXV0b21hdGljYWxseSB0YWtlIGFkdmFudGFnZSBvZiB0aGUgaGFyZHdhcmUgZm9yIHBhcmFsbGVsIHByb2Nlc3NpbmcsIG1ha2luZyBpdCBzdWl0YWJsZSBmb3IgbGFyZ2VyIGRhdGFzZXRzIGFuZCBtb3JlIGNvbXBsZXggbW9kZWxzLiBUaGlzIGZsZXhpYmlsaXR5IGluIGNvbmZpZ3VyYXRpb24gYWxsb3dzIGZvciBlZmZpY2llbnQgdHJhaW5pbmcsIHJlZ2FyZGxlc3Mgb2YgdGhlIHNjYWxlIG9mIHRoZSB0YXNrLgoKMzogVGhpcyBwcm9qZWN0IGhhcyBzZXZlcmFsIHdheXMgdG8gcnVuLiBGb3IgZ2VuZXJhbCB1c2VycywgdGhlcmUgYXJlIG1vZGVscyB3aXRoIGEgVUkgaW50ZXJmYWNlIGFuZCB0ZXJtaW5hbC1iYXNlZCBtb2RlbHMuIEhvd2V2ZXIsIGJvdGggcmVxdWlyZSBhIGNvbmZpZ3VyYXRpb24gZmlsZSB0byBzcGVjaWZ5IHRyYWluaW5nIHBhcmFtZXRlcnMgYW5kIGRhdGEgc3RvcmFnZSBsb2NhdGlvbnMuIEFmdGVyIExvUmEgdHJhaW5pbmcgaXMgY29tcGxldGVkLCB3ZSBjYW4gcnVuIHRoZSBydW4ucHkgZnVuY3Rpb24gdG8gcGVyZm9ybSBwcm9tcHQtdG8taW1hZ2UgaW5mZXJlbmNlLCBidXQgdGhpcyBmaWxlIG5lZWRzIHRvIHNldCB0aGUgY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzIHNwZWNpZmljYWxseSwgaWYgeW91IHdhbnQgdG8gdXNlIHRoZSBMb1JhIG1vZGVsIHlvdSB0cmFpbmVkIGJlZm9yZSwgeW91IG5lZWQgdG8gc3BlY2lmeSBhc3Npc3RhbnRfbG9yYV9wYXRoIGFuZCBsb3JhX3BhdGggaW4gdGhlIGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVycywgb3RoZXJ3aXNlIG9ubHkgdGhlIG9yaWdpbmFsIG1vZGVsIHdpbGwgYmUgcnVuLiAoaW5kZXhlZCBmcm9tIDAgdG8gMyku)

Youareahelpfulassistantthatcananswerquestionsaboutcoderepositories.Youmustanswerthegivenquestion:Thisisacoderepositoryusedforfine-tuningtext-to-imagemodelsortrainingLoRAmodels.Therepositoryisusedfortheauthor’sresearchonsomerelateduses.BelowarethestepsIfollowedduringtheprocess.Couldyouhelpmecheckwhichoneisrightstatement?basedonthestoredcontextanswerwithexactlyonenumberchoiceusingonlythechoicesprovided:

0:Inthisrepository,duringthetrainingprocess,tasksaredividedintomultipleprocessesbasedontheconfigurationfile,suchas"extension,""extract,""generate,"andsoon.Foreachprocess,acorrespondingclasshasbeenwritten.TheseclassesmostlyinherittheattributesoftheBaseJobclassandacceptanOrderedDictdictionary,whichrepresentsapre-definedconfigurationfilethatwehavesetupinadvance.Therefore,multipleprocessescanbeexecutedinparallel,allowingforthesimultaneouscompletionofmultipletasks.Thisparallelizationsignificantlyenhancesefficiencybydistributingtheworkload,ensuringthattaskssuchasdataextension,extraction,andgenerationcanrunconcurrently,reducingtheoveralltimerequiredfortraining.

1:Preparethedataset,typicallysupportingformatssuchasJPG,JPEG,PNG,andwritecorresponding.txtfilestodescribethecontentoftheimages.Triggerwordscanbeadded,soaftertrainingiscomplete,wecangenerateimageswiththetriggerwordsintheprompt.Intheconfigdirectory,findtheconfigurationfilesandmodifythe.ymlfiles.Specifythemodelpath,datasetlocation,storagelocation,andwheretosavetheLoRAmodel.Onlyafterconfiguringthesesettingscanitrunproperly.

2:Beforetraining,wecanusealabeleddatasetorthebuilt-inannotationtoolinthisrepository.Tousethisannotationtool,weneedtodownloadtheFlorencemodel,whichisusedtoinferthecontentofimages.Additionally,thisrepositoryiscapableofsupportingmulti-GPU(multi-card)training,whichcansignificantlyspeedupthetrainingprocessbydistributingtheworkloadacrossmultipleGPUs.Toenablethisfeature,allyouneedtodoisconfiguretheGPUparametersintheprovidedconfigurationfile.ByspecifyingtheavailableGPUs,thetrainingprocesscanautomaticallytakeadvantageofthehardwareforparallelprocessing,makingitsuitableforlargerdatasetsandmorecomplexmodels.Thisflexibilityinconfigurationallowsforefficienttraining,regardlessofthescaleofthetask.

3:Thisprojecthasseveralwaystorun.Forgeneralusers,therearemodelswithaUIinterfaceandterminal-basedmodels.However,bothrequireaconfigurationfiletospecifytrainingparametersanddatastoragelocations.AfterLoRatrainingiscompleted,wecanruntherun.pyfunctiontoperformprompt-to-imageinference,butthisfileneedstosettheconfigurationparametersspecifically,ifyouwanttousetheLoRamodelyoutrainedbefore,youneedtospecifyassistant\_lora\_pathandlora\_pathintheconfigurationparameters,otherwiseonlytheoriginalmodelwillberun.(indexedfrom0to3).

Step 1. It is not always true that an input context can be solved by partitioning it and recursively sub-querying models over each partition, but in tasks that are not information dense, this is possible. In this case, the model chooses to break down the codebase into parts and sub-query LMs to look for clues. The model then aggregates these clues and provides a final answer as a separate sub-query.

Report issue for preceding element

![[Uncaptioned image]](https://arxiv.org/html/2512.24601v2/x4.png)

Final. The RLM answers choice ‘1’, which is the correct answer.

Report issue for preceding element

## Appendix F Additional Runtime and Cost Analysis of RLMs

Report issue for preceding element

We supplement the cost and runtime analysis of RLMs with additional, fine-grained plots. In Figures [9](https://arxiv.org/html/2512.24601v2#A6.F9 "Figure 9 ‣ Appendix F Additional Runtime and Cost Analysis of RLMs ‣ Recursive Language Models"), [10](https://arxiv.org/html/2512.24601v2#A6.F10 "Figure 10 ‣ Appendix F Additional Runtime and Cost Analysis of RLMs ‣ Recursive Language Models") we include a histogram for the cost of each method on every task for both GPT-5 and Qwen3-Coder. We generally observe long-tailed, high-variance trajectories for RLMs in both models.

Report issue for preceding element

We additionally include log-scaled runtime plots for each method below. As we remarked in § [4.1](https://arxiv.org/html/2512.24601v2#S4.SS1 "4.1 Emergent Patterns in RLM Trajectories ‣ 4 Results and Discussion ‣ Recursive Language Models"), the runtime for these methods can be significantly improved through asynchrony of LM calls and additional prompting to discourage long sub-LM calls or code.

Report issue for preceding element

For the scaling plot in Figure [1](https://arxiv.org/html/2512.24601v2#S1.F1 "Figure 1 ‣ 1 Introduction ‣ Recursive Language Models"), we also provide the average API cost per task.

Report issue for preceding element

![Refer to caption](https://arxiv.org/html/2512.24601v2/figures/runtime_quartiles_gpt-5.png)Figure 7: Plotted quartiles of the runtime GPT-5 across OOLONG, OOLONG-Pairs, CodeQA, and BrowseComp+ (1K) for all methods described in § [3.2](https://arxiv.org/html/2512.24601v2#S3.SS2 "3.2 Methods and Baselines ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models"). We plot the 25th, 50th, 75th, and 95th percentiles.Report issue for preceding element![Refer to caption](https://arxiv.org/html/2512.24601v2/figures/runtime_quartiles_qwen3-coder-480b-a35b-instruct.png)Figure 8: Plotted quartiles of the runtime Qwen3-Coder-480B across OOLONG, OOLONG-Pairs, CodeQA, and BrowseComp+ (1K) for all methods described in § [3.2](https://arxiv.org/html/2512.24601v2#S3.SS2 "3.2 Methods and Baselines ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models"). We plot the 25th, 50th, 75th, and 95th percentiles.Report issue for preceding element![Refer to caption](https://arxiv.org/html/2512.24601v2/figures/cost_distributions_gpt-5.png)Figure 9: Histogram of the API costs for GPT-5 across OOLONG, OOLONG-Pairs, CodeQA, and BrowseComp+ (1K) for all methods described in § [3.2](https://arxiv.org/html/2512.24601v2#S3.SS2 "3.2 Methods and Baselines ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models").Report issue for preceding element![Refer to caption](https://arxiv.org/html/2512.24601v2/figures/cost_distributions_qwen3-coder-480b-a35b-instruct.png)Figure 10: Histogram of the API costs for Qwen3-Coder-480B across OOLONG, OOLONG-Pairs, CodeQA, and BrowseComp+ (1K) for all methods described in § [3.2](https://arxiv.org/html/2512.24601v2#S3.SS2 "3.2 Methods and Baselines ‣ 3 Scaling Long Context Tasks ‣ Recursive Language Models").Report issue for preceding element![Refer to caption](https://arxiv.org/html/2512.24601v2/figures/scaling_cost.png)Figure 11: We plot the API cost in USD for the runs in Figure [1](https://arxiv.org/html/2512.24601v2#S1.F1 "Figure 1 ‣ 1 Introduction ‣ Recursive Language Models").Report issue for preceding element

Report Issue

##### Report Github Issue

Title:Content selection saved. Describe the issue below:Description:

Submit without GithubSubmit in Github

Report Issue for Selection

Generated by
[L\\
A\\
T\\
Exml![[LOGO]](<Base64-Image-Removed>)](https://math.nist.gov/~BMiller/LaTeXML/)

## Instructions for reporting errors

We are continuing to improve HTML versions of papers, and your feedback helps enhance accessibility and mobile support. To report errors in the HTML that will help us improve conversion and rendering, choose any of the methods listed below:

- Click the "Report Issue" button.
- Open a report feedback form via keyboard, use " **Ctrl + ?**".
- Make a text selection and click the "Report Issue for Selection" button near your cursor.
- You can use Alt+Y to toggle on and Alt+Shift+Y to toggle off accessible reporting links at each section.

Our team has already identified [the following issues](https://github.com/arXiv/html_feedback/issues). We appreciate your time reviewing and reporting rendering errors we may not have found yet. Your efforts will help us improve the HTML versions for all readers, because disability should not be a barrier to accessing research. Thank you for your continued support in championing open access for all.

Have a free development cycle? Help support accessibility at arXiv! Our collaborators at LaTeXML maintain a [list of packages that need conversion](https://github.com/brucemiller/LaTeXML/wiki/Porting-LaTeX-packages-for-LaTeXML), and welcome [developer contributions](https://github.com/brucemiller/LaTeXML/issues).