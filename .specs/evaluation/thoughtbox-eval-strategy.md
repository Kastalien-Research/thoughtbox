# Thoughtbox Evaluation Strategy

**Date:** 2026-03-22
**Status:** Draft
**Context:** LangSmith-based evaluation framework for measuring causal lift of Thoughtbox

---

The right way to frame it is: for Thoughtbox, the thing you are evaluating is the model+Thoughtbox composite, not the server in isolation. Thoughtbox is a local-first MCP server centered on auditable reasoning, hub-based multi-agent workflows, branching/revision/critique patterns, knowledge-graph memory, notebooks, and observability. Because of that, the top-line question is causal lift: on which task families does giving a model Thoughtbox improve outcomes, by how much, at what cost, latency, and variance? Thoughtbox is also currently optimized for Claude Code and uses client-specific adaptations plus stage-based tool disclosure/gateway behavior, so client should be treated as part of the experimental configuration, not background noise.

LangSmith is a strong fit for this because it gives you the right primitives: offline evaluation on datasets/examples, experiments that capture outputs, evaluator scores, and traces, side-by-side experiment comparison, pairwise evaluation, single-run and pairwise annotation queues, online evaluation on production runs or threads, and dataset creation from historical traces or filtered experiment results. Examples can also carry arbitrary metadata, which is the key to making Thoughtbox measurable rather than anecdotal.

## 1. Define the causal comparisons first

For every serious experiment, keep at least four conditions:

1. Same model, no Thoughtbox.
2. Same model, plain scratchpad or notes baseline.
3. Same model, Thoughtbox full.
4. Same model, Thoughtbox ablations: no critique, no knowledge graph, no hub, no notebook, no branching.

That setup answers the question that actually matters: is the gain coming from Thoughtbox specifically, or just from letting the model externalize more reasoning?

## 2. Build six datasets, not one

Mirror Thoughtbox's actual affordances rather than collapsing everything into a giant benchmark. Thoughtbox has a documented hub workflow, explicit reasoning patterns, persistent memory, notebooks, and observability, so dataset design should reflect those surfaces directly.

### thoughtbox_core_outcomes

End-user tasks where only the final result matters: debugging, architecture choice, planning, incident analysis, decision memos, synthesis.

### thoughtbox_reasoning_patterns

Tasks engineered to require one of the specific reasoning patterns Thoughtbox exposes: backward planning, branching between alternatives, revision after late evidence, or critique loops.

### thoughtbox_hub_coordination

Tasks that benefit from decomposition and review, not one-shot reasoning. These are where you want to see whether structured collaboration actually helps.

### thoughtbox_memory_longitudinal

Multi-session tasks where earlier decisions should matter and irrelevant old context should be ignored.

### thoughtbox_notebook_verification

Tasks where a computed check or small executable program should verify or falsify the answer.

### thoughtbox_negative_controls

Simple or direct tasks where Thoughtbox should mostly stay out of the way. This is critical, because a reasoning substrate that helps on hard tasks but bloats easy tasks will look good in demos and bad in production.

The move that makes this scientific is to label expected capability use on every example. Since LangSmith examples can include inputs, reference outputs, and metadata, add fields like `task_family`, `difficulty`, `should_use_thoughtbox`, `should_branch`, `should_revise`, `should_critique`, `should_use_memory`, `should_use_notebook`, `should_use_hub`, and `negative_control`. That lets you compute precision/recall for each Thoughtbox affordance instead of just staring at one global answer-quality number.

## 3. What to measure

Two scoreboards.

### Product scoreboard

This is the one that decides whether Thoughtbox is winning.

- `task_success`
- `pairwise_win_rate_vs_no_tool`
- `pairwise_win_rate_vs_scratchpad`
- `constraint_satisfaction`
- `artifact_executability` or test pass rate
- `cost_per_success`
- `p95_end_to_end_latency`

### Diagnostic scoreboard

This tells you why it won or lost.

- `tool_use_precision` and `tool_use_recall`
- `branch_synthesis_rate`
- `critique_delta`
- `revision_correctness`
- `memory_contamination_rate`
- `memory_recall_success`
- `hub_workflow_completion`
- `coordination_overhead`
- `notebook_verification_gain`
- `overthinking_tax`
- `auditability_score`
- `server_error_rate`

A few of those are especially important for Thoughtbox:

- **critique_delta** = quality lift from critique-enabled versus critique-disabled runs on the same slice.
- **overthinking_tax** = extra cost/latency on negative-control tasks when Thoughtbox is used anyway.
- **branch_synthesis_rate** = fraction of branch-worthy tasks where the model actually reconciles branches into a final conclusion instead of just exploring them.
- **memory_contamination_rate** = fraction of runs where stale or irrelevant prior context affects the answer.
- **coordination_yield** = quality gain divided by added coordination cost on hub tasks.

The nice thing about these metrics is that they separate "the model failed the task" from "the model did not use Thoughtbox productively."

## 4. How to use LangSmith evaluators

LangSmith supports code evaluators, LLM-as-judge, human review, and pairwise evaluation, and it supports annotation queues for both single-run and pairwise review. That means you do not need to force one evaluator type to do all the work.

### Code evaluators (for anything crisp)

- schema validity
- test pass/fail
- hub state-machine completeness
- graph integrity
- latency and token/cost totals
- tool-call counts
- persistence checks
- notebook result matches final answer

### LLM-as-judge (for anything semantic)

- final answer quality
- usefulness/actionability
- branch quality
- revision quality
- memory relevance
- trace auditability
- whether the chosen mental model matched the task

### Pairwise evaluation

Default for open-ended tasks like plans, designs, or analyses. For those, "which would you ship?" is usually a better question than "give this a 1-5."

### Human annotation queues

For the slices where judges disagree, the runs are high-value, or you need reliable gold preference labels for alignment. Pairwise annotation queues are especially good for deciding whether Thoughtbox is actually producing more trustworthy work or just longer work.

### Summary evaluators

For experiment-level metrics like pass rate, pairwise win rate, cost per success, critique delta by slice, and overthinking tax. Some of the metrics you care about only make sense at the whole-experiment level, not per example.

LangSmith's experiment and comparison views also help with the quality/cost frontier because they surface cost, token counts, latency, status, and metadata-based filtering, so you can inspect where Thoughtbox is helping or hurting rather than averaging everything together.

## 5. The dataset flywheel

Run three data feeds in parallel.

### Synthetic scenario factory

Generate tasks, hidden rubrics, distractors, contradictory evidence, and late-turn updates with a stronger model. Human-audit a sample and all hard negatives.

### Production-trace feed

Use LangSmith to turn historical traces into datasets, especially top-performing runs, failures, user-edited outputs, and judge-disagreement cases. LangSmith explicitly supports creating datasets from traces and exporting filtered traces back into datasets.

### Regression feed

Every server bug, bad hub workflow, stale-memory failure, notebook error, or embarrassing production miss becomes a permanent benchmark example.

Thoughtbox's persistence model makes replay-style benchmarks especially attractive. Since it persists sessions and thoughts across project/session directories, you can mine prior sessions, strip out the final resolution, and create "resume this reasoning" or "revise this after new evidence" tasks. That is unusually valuable for memory and longitudinal consistency testing.

## 6. Online evals matter more than usual here

For Thoughtbox, a lot of value only shows up over a whole interaction, not a single turn. LangSmith's multi-turn online evaluators are designed around thread-level measures like semantic intent, semantic outcome, and trajectory, and they work on traced conversations/threads rather than isolated prompts.

Trace each end-user session as a thread and attach rich metadata at the root run:

- model
- client
- prompt version
- Thoughtbox version
- feature flags
- dataset slice
- ablation condition

At each child tool run, log:

- operation name
- workspace/problem IDs
- thought IDs touched
- success/failure
- latency
- normalized error type

Then put an online loop on top:

1. Sample production threads.
2. Run multi-turn evaluators.
3. Send low-confidence or low-score traces to annotation queues.
4. Promote confirmed failures into offline regression datasets.
5. Monitor trends in dashboards by model, client, feature flag, and task family.

## 7. Keep server-only testing separate

LangSmith should own the composite question: "does the model become more useful with Thoughtbox?"
But server-only testing should still exist outside LangSmith.

Thoughtbox already has benchmark scripts, agentic tests, behavioral-contract tests, and a variance-oriented behavioral test script in the repo. Keep using those for protocol correctness, latency, restart recovery, persistence integrity, session isolation, and load/concurrency, then pipe the results into the broader reporting stack.

Also, because agentic behavior is noisy, treat variance as first-class: rerun each stochastic condition a few times and report distributions, not just means.

## 8. The first dashboard to ship

If you only get twelve numbers:

1. task success
2. pairwise win rate vs no Thoughtbox
3. pairwise win rate vs scratchpad baseline
4. cost per success
5. p95 latency
6. unnecessary Thoughtbox-use rate
7. critique delta
8. branch-synthesis rate
9. revision correctness
10. memory contamination rate
11. hub workflow completion
12. server error rate

The main idea is simple: every example should answer both "did the model solve the task?" and "did Thoughtbox help in the specific way it claims to help?" Once you do that, Thoughtbox stops being a cool substrate and becomes a measurable product surface.
