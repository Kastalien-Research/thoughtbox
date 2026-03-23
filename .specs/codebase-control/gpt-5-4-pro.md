Here is the paragon.

The ideal codebase for control-theoretic agentic AI is not an “agent framework.” It is a closed-loop autonomy stack. It treats an agent as a partially observed, stochastic, hybrid control system whose actuators include tool calls, messages, memory operations, and compute allocation; whose sensors include user language, tool outputs, receipts, logs, and environment events; and whose job is to optimize a real objective under real constraints.

At its core, it formalizes five things.
- State: not just “conversation history,” but the believed world state, task progress, user model, tool reliability, permission state, budget state, memory freshness, and risk exposure.
- Observations: user requests, tool outputs, execution results, external events, and telemetry.
- Actions: external operations, internal reasoning choices, questions to the user, memory writes, verification steps, escalations, and deliberate no-ops.
- Disturbances: ambiguity, hidden variables, nonstationarity, tool outages, adversarial content, delays, model error, and shifting user intent.
- Objective: not just task success, but success weighted against latency, token cost, user burden, privacy risk, irreversibility, policy violations, and uncertainty.

Everything in the repo is organized around that.

The top level is split by mathematical responsibility, not by vibes. It has a specification layer, an environment/plant layer, a belief-state layer, a dynamics/modeling layer, a controller layer, a safety shield, a memory subsystem, an execution runtime, a learning subsystem, a simulator, an evaluation harness, and deep telemetry. Model vendors and tool adapters sit at the edge. The core logic never depends on a specific LLM.

The first thing this codebase does is compile messy natural-language tasks into control problems. A user says something vague, and the system turns it into a task contract: goals, terminal conditions, deadlines, soft costs, hard constraints, approval boundaries, observability requirements, and allowed actuators. It knows the difference between “solve this,” “explore this,” “recommend this,” and “execute this.” It knows which actions are reversible, which are expensive, which require confirmation, and which are forbidden.

Critically, it can tell when a task is under-observed or under-actuated. It does not blindly stumble forward. It can say, in system terms, “I cannot know X with the current sensors,” or “I cannot affect Y with the current tools,” or “goal G is infeasible under constraints C.” In other words, it has first-class observability and controllability diagnostics. That alone would eliminate a lot of fake agent competence.

The second thing it does is maintain a typed belief state. This is the real heart of the system. Every fact the agent believes has a timestamp, provenance, confidence, freshness, and sometimes a contradiction set. The belief state is partitioned into at least these pieces:
- world state: what is believed about files, APIs, documents, browser pages, databases, calendars, devices, or other external systems
- task state: what subgoals are satisfied, what dependencies remain, what blockers exist
- user state: inferred preferences, urgency, tolerance for interruption, risk tolerance, style constraints
- self state: current mode, active controller, uncertainty level, compute budget, latency budget, memory health
- actuator state: which tools are available, healthy, authenticated, rate-limited, or degraded
- safety state: current approval requirements, policy boundaries, irreversible action exposure

This belief state is updated by an observer, not by a prompt. The observer fuses structured tool outputs, natural-language evidence, runtime telemetry, and execution receipts. In some places it uses filtering logic that looks like Bayesian estimation, Kalman-style updates, particle-style tracking, or ensemble-based uncertainty reduction. In others it uses deterministic parsers and symbolic checks. The important point is that it is an explicit estimation module, separate from planning.

The third thing it does is maintain a world model. This world model is hybrid.

Part of it is symbolic: tools have typed preconditions, effects, side effects, idempotence properties, costs, and permission requirements. Workflows have state machines. Some environments have explicit schemas. Some tasks have temporal logic or workflow constraints. This symbolic part gives you structure, invariants, and auditability.

Part of it is learned: there are residual models for what the symbolic layer misses, learned reliability models for tools, learned user-response models, learned latency models, learned terminal cost models, and learned value approximators for long horizons. The codebase expects its model to be wrong in places, so it keeps uncertainty estimates and uses ensembles or calibrated confidence models rather than pretending everything is precise.

This is where control theory actually matters. The system does not just plan against a single guessed future. It can plan in different modes:
- nominal when uncertainty is low
- robust when uncertainty is high and actions must remain safe across a set of possible worlds
- dual-control when the right action is partly about completing the task and partly about learning the state of the world

That last one matters a lot in agentic AI. Sometimes the right move is not “act” but “observe better.” The codebase knows that asking a targeted question, doing a cheap lookup, or running a low-risk probe can be the optimal control action.

The fourth thing it does is use hierarchical control.

There is a slow layer that chooses the mission framing, operating mode, and major subgoals. There is a medium-speed layer that runs receding-horizon planning over the next few steps. There is a fast reflex layer that handles tool failures, parse errors, interrupts, policy trips, and immediate hazards. Skills are encoded as reusable closed-loop options with initiation conditions, termination conditions, expected observations, failure signatures, and recovery branches.

The planning layer is not open-loop. It behaves like MPC for hybrid systems. It proposes candidate action sequences, scores them against the task objective and constraints, commits only to the first action, observes what actually happened, and replans. Long-horizon tasks are broken into subproblems with terminal conditions, but the system never forgets that the environment is changing and partially observed.

One of the best parts of the ideal codebase is that it treats its own cognition as a controllable resource. Reasoning depth is not fixed. Model choice is not fixed. Verification effort is not fixed. Retrieval depth is not fixed. Tree-search width is not fixed. The stack has a meta-controller that decides:
- which model to use
- whether to use one-shot inference or structured search
- how many candidate plans to sample
- whether to invoke a verifier
- whether to retrieve memory
- whether to ask the user
- whether to escalate
- how much compute to spend now versus later

That is a control problem too. Cheap cognition for low-risk, high-frequency situations. Expensive cognition for high-stakes, low-confidence, or irreversible situations. The codebase explicitly optimizes not just external actions, but internal deliberation policy.

Then comes the safety shield, and in the paragon codebase this is real, not decorative.

Every action that leaves the model and touches the world goes through a typed gate. The gate checks preconditions, permissions, policy rules, privacy constraints, spend limits, rate limits, side-effect class, reversibility, and approval requirements. Where possible, the system simulates or dry-runs the action, produces a diff, estimates impact, and only then allows execution. Irreversible or high-blast-radius actions are wrapped in stronger controls. Safe alternatives are automatically considered. The system can maintain hard invariants with barrier-style conditions or explicit guards, and chance constraints where only probabilistic guarantees are realistic.

Just as important, the system performs post-action verification. It never assumes that an issued action succeeded. It waits for receipts. It checks whether the predicted state transition actually happened. If not, it computes a residual between expected and realized behavior, downgrades the relevant model or tool reliability estimate, and may switch modes from execute to recover or identify. It believes observations, not intentions.

Because agentic systems often fail like unstable controllers, this codebase has explicit anti-instability machinery. It detects:
- oscillatory replanning
- repeated tool thrashing
- retry windup
- confirmation spirals
- self-reinforcing memory errors
- mode flapping
- “I’m almost done” loops with no state progress

And it dampens them with hysteresis, cooldowns, retry budgets, state-based mode transitions, action masking, and progress monitors. It measures whether uncertainty is actually going down, whether blockers are actually clearing, and whether the task energy is actually decreasing. If not, it does not keep “thinking harder” forever.

Memory is also treated properly. The ideal codebase has four distinct memory classes.

Working memory is the live control state for the active episode. Episodic memory stores trajectories, receipts, failure traces, and previous runs. Semantic memory stores persistent facts with provenance and expiry rules. Procedural memory stores reusable skills, controllers, prompts, heuristics, and learned policies. Separate controllers decide what gets written, what gets retrieved, what gets compacted, and what gets forgotten. Memory writes are gated by novelty, estimated future utility, confidence, and policy. Retrieval is driven by value, not nostalgia. Provenance is never optional.

Human interaction is built in as optimal intervention, not as hand-wavy “ask clarifying questions.” The system computes the value of information before interrupting a user. If the uncertainty is relevant and user input is the only reliable sensor, it asks. If another sensor or tool can answer more cheaply, it probes that first. When approval is needed, the request comes with the exact diff, predicted consequences, risk summary, and rollback story. Explanations are generated from controller state and belief state, not bolted on afterward.

The ideal codebase also handles multi-agent settings cleanly, but as distributed control rather than group chat cosplay. Each agent has local state, local skills, and explicit capabilities. A coordinator handles shared objective decomposition, task allocation, communication budget, and consensus on shared facts. Handoffs include uncertainty summaries, safety context, open assumptions, and expected terminal conditions. Communication itself is optimized because bandwidth, latency, and cognitive interference are real resources.

On the learning side, this codebase ingests every run as a trajectory, not just a transcript. Offline, it learns better dynamics models, better reliability estimates, better reward or cost shaping, better user models, and better terminal value approximators. It supports behavior cloning for low-level skills, system identification from rollouts, safe policy improvement, preference learning, and shadow-mode evaluation before deployment. Online learning is allowed, but only where the risk envelope supports it. The codebase sharply separates failures due to bad state estimation, bad dynamics, bad objective specification, bad controller choice, bad execution, and bad safety gating. That means it can actually improve the right subsystem instead of smearing updates everywhere.

A paragon codebase also ships with a digital twin. Every external tool or environment has a simulator, stub, or surrogate model with hidden state, latency, failure injection, and controllable perturbations. There are benchmark suites for partial observability, delayed effects, tool outages, conflicting user instructions, adversarial content, and long-horizon dependencies. Evaluation is closed-loop. It measures not just success rate, but:
- constraint violation rate
- recovery time
- calibration of uncertainty
- robustness under shift
- regret
- latency and token cost
- user interruption load
- plan churn
- unnecessary action count
- reversibility usage
- failure attribution quality

This is where the codebase stops being a demo and becomes an engineering system.

For developers, the observability story is excellent. Every run can be replayed step by step. You can inspect belief state snapshots, candidate plans, rejected actions, safety filter decisions, expected versus realized transitions, and model residuals. You can run counterfactual replays with different controllers or costs. You can see whether a failure came from poor estimation, poor modeling, a brittle skill, a bad prompt, a blind verifier, or a misweighted objective. Prompts are versioned artifacts with contracts and regression tests, not magic strings buried in runtime code. Config changes, model changes, controller changes, and safety-policy changes all have lineage.

The runtime loop of the whole system is simple and strict:
1. ingest new observations
2. update belief state and uncertainty
3. update local model and tool reliability estimates
4. check goal progress, constraints, and observability gaps
5. choose operating mode, horizon, and cognition budget
6. generate candidate action sequences
7. safety-filter and rank them
8. execute the first action transactionally
9. verify the realized effect
10. log the trajectory and adapt

If safe progress is impossible, then “ask,” “wait,” “abstain,” “defer,” or “escalate” are treated as fully legitimate control actions, not failures.

So the one-sentence description is this:

The ideal codebase for control-theoretic agentic AI is an observer + world model + hierarchical MPC + safety shield + memory controller + learning system wrapped around LLMs and tools, with explicit state, explicit uncertainty, explicit objectives, explicit constraints, explicit receipts, and explicit failure attribution.

Everything else—prompts, tools, heuristics, model choices—plugs into that skeleton instead of becoming the skeleton.