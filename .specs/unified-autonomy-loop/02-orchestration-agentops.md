# Orchestration & AgentOps

**Phase 2 of the Unified Autonomous Loop**

## Purpose
While the Darwin Gödel Machine loops operate fully autonomously, Thoughtbox utilizes a human-in-the-loop authorization gate before modifying code or burning large execution budgets. This is managed by the `agentops` infrastructure, exclusively utilizing GitHub Actions and Issues, meaning we do not need complex orchestration layers like Temporal.

## 1. The Daily Dev Brief
The highly filtered proposals coming from the Discovery & Taste Agent Phase are posted by the GitHub Actions cron to the Thoughtbox repository as a GitHub Issue labeled `dev-brief`.

The issue acts as durable state. It contains:
- The human-readable rationale (the outputs of the Taste Agent).
- A machine-readable `AGENTOPS_META` payload encompassing the serialized proposals.

## 2. Human Authorization Gates
Maintainers act as the absolute arbiters over what moves from Phase 2 to Phase 3. 

They interact directly with the GitHub Issue by applying labels:

- **`smoke:proposal-N`**: Authorizes a dry run. The system will compose a workflow and run evaluation logic, but it will *not* commit code to a real branch, and it will intentionally fail early to validate the harness.
- **`approved:proposal-N`**: Fully authorizes real implementation and execution of proposal N. 
- **`hold`** / **`rejected`**: Prunes the execution tree entirely.

## 3. The Implementation Trigger
Applying the `approved:proposal-N` label fires the `agentops_on_approval_label.yml` workflow. 

This workflow parses the machine-readable metadata in the issue to extract:
1. The exact parameters of defined proposal N.
2. The relevant issue dependencies (via the `bd` tracking tools, if appropriate).
3. The exact target repository references or task parameters.

The workflow then transitions the state out of orchestration and invokes the **Workflow Composition** and **Execution** agent routines.
