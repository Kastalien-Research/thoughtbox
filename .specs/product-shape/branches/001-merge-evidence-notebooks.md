# Branch 001: Notebook-Backed Merge Evidence

Status: exploratory branch
Created: 2026-05-26
Parent: `../PRODUCT-INTENT-AND-DIVERGENCE.md`

## Question

If a reasoning merge means a finalized decision or "collapse to certainty",
what evidence should be attached to the merge?

## Current Hypothesis

Notebooks are the likely merge-evidence primitive.

A merge should not only point to prose justification. It should point to a
replayable evidence packet that can contain prose, executable checks, validators,
citations, simulations, dissenting branch summaries, and structured outputs.

## Proposed Object: Merge Evidence Notebook

A Merge Evidence Notebook is a notebook generated or assembled at merge time.
It consumes the relevant branch heads and emits a structured merge verdict.

Inputs:

- Hub id / workspace id.
- Base node or prior checkpoint.
- Candidate branch heads.
- Relevant thought-node ranges.
- Claims extracted from each branch.
- Diffs between branches where applicable.
- Tests, citations, logs, artifacts, reviewer notes, or validator results.
- Open objections and dissenting branches.

Executable cells:

- Claim extraction and normalization.
- Evidence sufficiency checks.
- Test or validator invocation.
- Contradiction scan.
- Optional simulation/eval cells.
- Merge verdict generation.

Structured output:

```json
{
  "decision": "string",
  "confidence": "low|medium|high",
  "mergedBranchIds": ["branch-id"],
  "rejectedBranchIds": ["branch-id"],
  "supersededNodeIds": ["node-id"],
  "evidenceRefs": ["artifact-or-cell-ref"],
  "dissent": [
    {
      "branchId": "branch-id",
      "summary": "string",
      "reasonNotMerged": "string"
    }
  ],
  "conditions": ["string"],
  "reopenTriggers": ["string"]
}
```

## Merge Commit Shape

A reasoning merge commit should store:

- Parent branch heads.
- Merge evidence notebook artifact id.
- Structured merge verdict.
- Hash of the evidence notebook snapshot.
- Agent/user/reviewer attribution.
- Timestamp.
- Optional tag/checkpoint name.

## Git Analogy

The merge commit is immutable history. If later evidence changes the decision,
Thoughtbox should create a new commit that supersedes or reverts the earlier
merge rather than rewriting it.

## Open Questions

- Which notebook modes are valid merge evidence: `adr_evidence`, `runbook`,
  `eval`, `simulation`, `failure_capsule`, or a new `merge_evidence` mode?
- Does every merge require executable evidence, or can some merges be
  prose-only with explicit lower confidence?
- Who can approve a merge: the active agent, a peer agent, a human, a protocol
  validator, or a policy per Hub?
- Should merge evidence notebooks be generated automatically by Code Mode or
  authored deliberately by agents?
- Should a failed merge notebook block the merge or only mark the merge as
  contested?
