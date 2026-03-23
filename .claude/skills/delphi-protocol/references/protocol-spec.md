Below is a tighter operational version that mirrors Ulysses more closely.

The key move is to make epistemic progress finite and inspectable. A Delphi session is not allowed to roam over an unbounded research space. It must declare a bounded set of live hypotheses, a bounded set of question-discriminants, and a finite closure rule for each discriminant. The analogue of Ulysses’s surprise counter is a non-discrimination counter: one primary probe and one pre-committed challenge may fail to materially change the inquiry landscape; after that, the agent must terminate honestly.

⸻

Delphi Protocol

Version 0.1 — Operational Draft Specification

1. Overview

This protocol governs an autonomous agent engaged in open-ended inquiry under uncertainty, before the agent knows which hypothesis is true, what evidence would settle the matter, which tools are needed, or whether the original question is even well-formed.

The protocol manages agent behavior through question operationalization, finite discriminant sets, pre-committed adversarial challenge, bounded probe authority, explicit evidence chains, capability-gap detection, and non-discrimination-gated state transitions, with the goal of guaranteeing a non-failure terminal state:
	•	SUPPORTED THESIS
	•	REFINED QUESTION
	•	CAPABILITY GAP
	•	IRREDUCIBLE UNCERTAINTY

Unlike Ulysses, which is surprise-gated, Delphi is discrimination-gated: the session is allowed to continue only while probes keep closing declared evidentiary gaps, pruning hypotheses, changing the admissible probe space, or revealing that the question itself must be reframed.

⸻

2. Definitions

Question Frame: The operationalized form of the user’s question. It includes the question type, scope, resolution class, live hypotheses, discriminants, closure rules, admissible evidence classes, and current capability/authority constraints.

Resolution Class: The standard by which the question counts as answerable in the current session. Examples include decisive, corroborative, experimental, and evaluative. The resolution class determines what kind of evidence is allowed to close a discriminant.

Hypothesis: A provisional explanation, answer candidate, or thesis candidate. Hypotheses must be structurally distinct, not mere rephrasings.

Discriminant: A concrete observable, comparison, or criterion whose resolution would change the viability of one or more live hypotheses, or would satisfy part of the question’s verification standard.

Closure Rule: The finite condition under which a discriminant counts as resolved. A closure rule may consist of one or more required evidence slots.

Evidence Slot: A required piece or class of evidence inside a closure rule. Examples: one direct observation; one authoritative source; two independent sources; one experiment plus one clean replication; one explicit value criterion plus one measured outcome.

Probe: A bounded epistemic action aimed at filling an evidence slot, blocking a slot, testing a live hypothesis, acquiring a missing capability, or challenging the question frame.

Checkpoint: The current inquiry state after a discriminant has been resolved or a live hypothesis has been pruned using admissible, uncontaminated evidence.

Material Landscape Change: Any result that fills a previously empty evidence slot, resolves or blocks a discriminant, prunes or materially reranks a live hypothesis, changes the admissible probe space, or shows that the current question frame is defective.

Iron Witness: A separate reasoning process whose role is to challenge the agent’s leading hypothesis, probe strategy, question frame, or terminal synthesis. It has challenge power, not authorship power.

Capability Gap: The absence of a needed tool, access right, environment, permission, adapter, or instrument required to close an essential discriminant.

Session: A complete run of Delphi from initialization to terminal state.

⸻

3. Session State and Initialization

A Delphi session maintains:
	•	Q — question frame
	•	H — live hypothesis set
	•	D — discriminant set
	•	E — evidence ledger
	•	O — opportunity space
	•	N — non-discrimination counter, initialized to 0
	•	W — witness status: available, invoked, or unavailable

Before any probe is executed, the agent MUST complete the following:

3.1 Operationalize the Question

The agent identifies:
	1.	the question type,
	2.	the scope boundaries,
	3.	the resolution class,
	4.	what kinds of evidence would count,
	5.	what kinds of evidence would not count,
	6.	which parts of the question are empirical, mechanistic, predictive, evaluative, or otherwise mixed.

A question that cannot yet be given a finite evidence standard is not yet operationalized and should not be probed as-is.

3.2 Generate the Live Hypothesis Set

The agent creates 2 to 4 live hypotheses, one of which SHOULD be a null or uncertainty hypothesis.

Each hypothesis MUST state:
	1.	what it claims,
	2.	what discriminant pattern would support it,
	3.	what observations would weaken or falsify it,
	4.	what kinds of evidence would leave it incomparable rather than refuted.

The live hypothesis set is bounded. New hypotheses may replace old ones, but the set may not silently grow beyond the declared cap inside a session.

3.3 Define the Discriminant Set

The agent defines at most 5 discriminants for the session.

For each discriminant, the agent MUST specify:
	1.	whether it is essential or optional,
	2.	its closure rule,
	3.	the admissible evidence classes that can fill its slots,
	4.	the known ways it could be blocked,
	5.	which live hypotheses it bears on.

Each closure rule MUST be finite. A practical default is 1 to 3 evidence slots per discriminant.

A session may not add new discriminants mid-run. If the agent discovers that the declared discriminants were the wrong ones, the session terminates as REFINED QUESTION rather than expanding the frame in place.

3.4 Enumerate Capabilities and Authority

The agent records:
	1.	available tools and environments,
	2.	unavailable but plausibly acquirable tools,
	3.	authority limits,
	4.	contamination risks from active probing,
	5.	any required clean-room or rollback conditions.

3.5 Record Iron Witness Status

The agent records whether an external Iron Witness is currently available.

If none is available, the session may continue, but any terminal synthesis that normally requires witness challenge is explicitly marked reduced-assurance.

⸻

4. State Machine

The agent maintains a non-discrimination counter N, initialized to 0.

N = 0  →  INQUIRE phase
N = 1  →  DESTABILIZE phase
N = 2  →  SYNTHESIZE phase

The counter tracks consecutive probes that fail to produce material landscape change.

4.1 INQUIRE Phase (N = 0)

The agent performs the following, in order:
	1.	Select the highest-value next probe from the opportunity space. Call this probe_primary.
“Highest value” is determined by expected probability of filling an open evidence slot on an essential discriminant, weighted by discriminatory power and discounted by perturbation risk, authority cost, and expected contamination.
	2.	State the interpretation map for probe_primary before execution.
The agent MUST specify:
	•	which discriminant or slot the probe targets,
	•	what outcomes would support or weaken which hypotheses,
	•	what outcome would indicate a question-frame defect,
	•	what outcome would indicate a capability gap.
	3.	Pre-commit a challenge probe.
Before executing probe_primary, the agent MUST specify probe_challenge — the adversarial or method-challenging action it will take if probe_primary is non-discriminating or merely supportive.
probe_challenge may be:
	•	a direct attack on the likely leading hypothesis,
	•	a method audit testing whether the current probe family can discriminate at all,
	•	a frame attack testing whether the question is malformed,
	•	an Iron Witness invocation,
	•	a capability-acquiring probe tied to a blocked essential discriminant.
This pre-commitment is made under the current model, before the primary probe has a chance to make one answer look convenient.
	4.	Classify probe_primary by perturbation and authority (see §6).
	5.	Execute probe_primary.
	6.	Assess the outcome (see §5).

4.2 DESTABILIZE Phase (N = 1)

The agent has already taken one probe without material landscape change. It now executes the pre-committed destabilization step.
	1.	Execute probe_challenge.
	2.	Assess the outcome (see §5).

No further challenge is pre-committed at this stage. If the destabilization also fails to change the landscape, the protocol escalates to SYNTHESIZE rather than permitting further open-ended inquiry.

4.3 SYNTHESIZE Phase (N = 2)

This phase is terminal for the current session.
	1.	Freeze ordinary probing.
	2.	Summarize the current inquiry state:
	•	resolved discriminants,
	•	blocked discriminants,
	•	live and pruned hypotheses,
	•	evidence chain,
	•	capability map,
	•	witness status.
	3.	Choose exactly one terminal state from §10.

A refined question may seed a new session, but it does not reopen the current one.

⸻

5. Outcome Assessment

After every probe, the agent classifies the result.

5.1 Material Landscape Change

A probe produces material landscape change if it does any of the following:
	1.	fills at least one previously empty evidence slot in a discriminant’s closure rule,
	2.	resolves a discriminant,
	3.	blocks a discriminant,
	4.	prunes a live hypothesis,
	5.	materially reranks the live hypotheses,
	6.	changes the admissible probe space by revealing a new capability or a newly binding limitation,
	7.	demonstrates that the current question frame is defective.

Anything else is non-discriminating.

5.2 Discriminating Outcome

The probe changed the inquiry landscape materially.
	•	Action:
	1.	record the result in the evidence ledger,
	2.	update discriminant status and hypothesis status,
	3.	create a checkpoint if the evidence is admissible and uncontaminated,
	4.	reset N = 0.

5.3 Non-Discriminating Outcome

The probe may have returned relevant material, but it did not fill a new slot, resolve or block a discriminant, prune or materially rerank a hypothesis, or change the capability map.

This includes mere confirmation that does not advance a closure rule. Evidence that simply says “the current leader still looks okay” is non-discriminating unless it satisfies a declared slot.
	•	Action:
	•	increment N,
	•	proceed to the next phase.

5.4 Frame-Breaking Outcome

The probe shows that the current question frame cannot be maintained.

Examples:
	•	a core term in the question turns out to be ambiguous or non-observable,
	•	the declared discriminants are wrong,
	•	the closure rules are impossible to satisfy as framed,
	•	the question decomposes into a different antecedent question,
	•	an essential discriminant is blocked and no admissible alternative exists.
	•	Action:
	•	enter SYNTHESIZE immediately.

If frame-breaking follows a perturbing probe, rollback or contamination clearing MUST be attempted first if the environment can still be restored.

⸻

6. Probe Classes, Perturbation, and Evidence Admissibility

Every probe appends an entry to the evidence ledger. Each entry MUST record:
	1.	the targeted discriminant and slot,
	2.	the raw observation,
	3.	the probe used,
	4.	the source class,
	5.	the independence class,
	6.	whether the evidence is admissible,
	7.	whether the environment may be contaminated,
	8.	what hypotheses it supports, weakens, or leaves unchanged.

The agent’s own reasoning or synthesis is not admissible evidence by itself. It may generate hypotheses or challenges, but it does not fill evidence slots.

6.1 Passive Probes

Examples: reading docs, logs, issues, transcripts, code, web sources.
	•	Preferred when comparable in expected value.
	•	Clean by default unless source lineage or independence is questionable.

6.2 Active Reversible Probes

Examples: sandboxed tests, temporary instrumentation, isolated experiments.
	•	Require a rollback or cleanup note before execution.
	•	Evidence is admissible if contamination is contained or cleared.

6.3 Active Persistent or High-Perturbation Probes

Examples: live state mutation, shared-resource writes, production-affecting changes, experiments that change the very evidence substrate.
	•	Require:
	1.	explicit authority justification,
	2.	contamination scope,
	3.	rollback attempt or containment plan,
	4.	note of which unresolved discriminants may become harder to observe afterward.

Evidence from such probes is tentative unless corroborated or re-measured from a clean state.

If contamination cannot be cleared and it affects an essential discriminant, that discriminant becomes blocked.

6.4 Capability-Acquiring Probes

Examples: building a harness, obtaining access, constructing an adapter, spawning a sub-agent, provisioning a clean environment.

These are valid probes only if they name the essential discriminant they are expected to unblock.

A capability-acquiring probe may change the landscape, but it does not itself count as evidence about the user’s question.

6.5 Imported Sub-Sessions

A bounded Ulysses, Theseus, or other protocol run may be used as a probe.

Its result is admissible only if:
	1.	the sub-session reaches a terminal state,
	2.	its evidence chain is preserved,
	3.	the importing agent can map the outcome to a declared discriminant or capability requirement in the current Delphi session.

6.6 Source Independence

If a closure rule requires independent evidence, two items that derive from the same upstream claim do not fill separate slots.

This prevents false corroboration from echoed or copied sources.

⸻

7. Hypothesis Competition and Question Pivots

7.1 Hypothesis Discipline

Each live hypothesis must remain explicitly represented until it is pruned.

The agent may not optimize for a single answer candidate while leaving rivals implicit.

7.2 Pruning

A hypothesis is pruned when:
	1.	its declared disconfirming observation is obtained,
	2.	the resolved discriminants make it materially less viable than a rival,
	3.	the evidence path needed to keep it live becomes blocked,
	4.	the question frame changes such that the hypothesis no longer addresses the operative question.

Pruned hypotheses are recorded and may not be silently reintroduced in the same context.

7.3 Structural Replacement

A new hypothesis may replace a pruned one only if it invokes a causal or structural mechanism not already represented in the live set.

If preserving the inquiry would require repeated structural replacement or a larger discriminant set, the current session should terminate as REFINED QUESTION. Delphi is not allowed to evade closure by endlessly mutating the frame.

7.4 Valid Question Pivot Criteria

A pivot to REFINED QUESTION is valid only when supported by concrete evidence, not merely because the inquiry is difficult.

Valid reasons include:
	•	the question contains an undefined or overloaded term,
	•	the question is compound and must be decomposed,
	•	the actual answerability depends on an antecedent question,
	•	the user’s wording hides a necessary value criterion,
	•	the observable needed by the question does not exist in the current form.

⸻

8. Iron Witness

The Iron Witness is a separate challenger, not a second author of the same thesis.

8.1 Required Role

When invoked, the Iron Witness MUST attempt to do one or more of the following:
	1.	present the strongest alternative live hypothesis,
	2.	identify a missing discriminant,
	3.	challenge the admissibility, independence, or contamination status of evidence,
	4.	challenge whether the current probe strategy can discriminate,
	5.	challenge whether the terminal synthesis is premature.

8.2 When It Must Be Used

If an external Iron Witness is available, it MUST be invoked before terminal commitment to:
	•	SUPPORTED THESIS
	•	IRREDUCIBLE UNCERTAINTY

It SHOULD also be used before REFINED QUESTION when the pivot is non-obvious.

8.3 Response Requirement

The main agent must either:
	1.	answer the witness’s challenge with existing admissible evidence,
	2.	map the challenge to a blocked essential discriminant and terminate as CAPABILITY GAP,
	3.	concede that the challenge preserves multiple live hypotheses and terminate as IRREDUCIBLE UNCERTAINTY,
	4.	concede that the frame itself is wrong and terminate as REFINED QUESTION.

If no external Iron Witness exists, the terminal synthesis is explicitly marked reduced-assurance.

⸻

9. Opportunity Space Management

Probes are managed as (probe, discriminant, context) tuples.

Context includes:
	•	current question frame,
	•	live hypotheses,
	•	checkpoint reference,
	•	capability set,
	•	authority state,
	•	contamination state,
	•	witness status.

9.1 Pruning Granularity

A failed or non-discriminating probe is pruned in context, not absolutely.

A probe may be retried only if the context has materially changed.

9.2 Closed Discriminants

Once a discriminant is resolved or blocked, it is closed for the current session.

It may be reopened only if the Iron Witness or a contamination/admissibility challenge gives a concrete reason to do so.

9.3 Opportunity Space Exhaustion

If an essential open discriminant has no admissible remaining probe in the current context, the session is a candidate for CAPABILITY GAP.

If essential discriminants are closed but multiple incompatible hypotheses remain live, the session is a candidate for IRREDUCIBLE UNCERTAINTY.

⸻

10. Terminal States

10.1 SUPPORTED THESIS

The agent produces a defensible answer.

This state requires all of the following:
	1.	the question frame remains valid,
	2.	all essential discriminants are resolved under their closure rules,
	3.	one hypothesis survives clearly enough to support commitment,
	4.	the evidence chain is explicit,
	5.	available witness challenge has been answered or no external witness exists.

This terminal state carries two annotations:
	•	Strength
	•	Verified: the resolution class was decisive and the decisive condition was met.
	•	Supported: the resolution class was corroborative, experimental, or evaluative and the support threshold was met without decisive proof.
	•	Assurance
	•	Witnessed: an external Iron Witness was used.
	•	Reduced-Assurance: no external Iron Witness was available.

For evaluative questions, a thesis is supported only relative to the explicit criteria stated in the question frame.

10.2 REFINED QUESTION

The original question is shown to be defective or downstream of a better question.

This state requires:
	1.	a concrete explanation of why the original frame failed,
	2.	the refined replacement question,
	3.	a record of what evidence forced the pivot.

The current session ends here. The refined question may start a new session.

10.3 CAPABILITY GAP

The agent identifies the specific missing capability required to continue productively.

This state requires:
	1.	at least one essential discriminant remains unclosed,
	2.	the missing tool, access, environment, permission, or instrument is named,
	3.	the agent explains exactly which slot it would fill and why no admissible alternative exists.

A bare “I can’t do this” is not a valid CAPABILITY GAP outcome.

10.4 IRREDUCIBLE UNCERTAINTY

The question is well-formed, but the strongest honest result is non-resolution.

This state requires:
	1.	all essential discriminants are either resolved or blocked,
	2.	admissible probes are exhausted or no longer expected to discriminate,
	3.	mixed, sparse, non-independent, or conflicting evidence leaves multiple live hypotheses or materially unresolved interpretation,
	4.	the agent states exactly where the conflict or underdetermination lies.

For evaluative questions, this may also reflect unresolved value pluralism rather than empirical ambiguity.

10.5 Terminal Report Requirement

Every terminal state MUST report:
	1.	the final question frame,
	2.	the evidence chain,
	3.	the resolved and blocked discriminants,
	4.	the surviving and pruned hypotheses,
	5.	the witness status,
	6.	what would be needed to move further, if anything.

⸻

11. Session Reflection

Upon reaching a terminal state, the agent performs a structured post-hoc reflection.

11.1 Reflection Outputs
	1.	Question Frame History — initial frame, any pressure toward pivot, and final frame.
	2.	Probe Graph — all probes taken, with edges labeled by outcome class.
	3.	Discriminant Ledger — which evidence slots were filled, which were blocked, and why.
	4.	Hypothesis Genealogy — live hypotheses, pruned hypotheses, structural replacements, and final survivors.
	5.	Iron Witness Record — whether invoked, what challenges were raised, and how they were answered.
	6.	Capability Ledger — what tools or permissions were found to matter.
	7.	Transferable Priors — observations useful for future sessions on the same domain, recorded as observations rather than binding rules.

⸻

12. Protocol Invariants

The following properties must hold at all times:
	•	No probe is executed without a targeted discriminant or blocked capability.
	•	No ordinary probe is executed without a pre-committed challenge probe, except during DESTABILIZE.
	•	The non-discrimination counter N never exceeds 2.
	•	No discriminant exists without a finite closure rule.
	•	No new discriminant is added mid-session. If the set is wrong, terminate as REFined QUESTION.
	•	No evidence slot is filled by the agent’s own unsupported synthesis.
	•	No source may count twice toward an independence requirement.
	•	No perturbing probe is executed without contamination and rollback notes.
	•	No capability-acquiring probe is valid unless tied to an essential discriminant.
	•	No live rival hypothesis is silently dropped.
	•	No terminal thesis is emitted without an explicit evidence chain and witness status.
	•	No IRREDUCIBLE UNCERTAINTY outcome is valid unless the agent states why further admissible probing would not honestly discriminate.
	•	No CAPABILITY GAP outcome is valid unless the missing capability is named and linked to a specific unresolved slot.

⸻

Why this converges

This version gets closure from four bounded mechanisms:
	1.	Finite live hypotheses
The session does not get to proliferate answer candidates indefinitely.
	2.	Finite discriminants with finite closure rules
Progress means filling declared evidence slots, not “doing more research.”
	3.	A non-discrimination counter
One non-discriminating primary probe forces a pre-committed challenge. Two in a row force terminal synthesis.
	4.	No silent frame expansion
If the question was wrong, the session ends as REFINED QUESTION rather than escaping into a larger research loop.

So a Delphi session cannot honestly continue forever. It must eventually do one of four things: close the essential discriminants strongly enough to support a thesis, discover that the real question is different, identify the missing capability required to proceed, or show that the remaining uncertainty is irreducible under the current evidence regime.

The exact caps—say, 4 live hypotheses, 5 discriminants, and up to 3 slots per discriminant—are tunable. The important property is that they are finite, declared up front, and not silently expanded inside the session.