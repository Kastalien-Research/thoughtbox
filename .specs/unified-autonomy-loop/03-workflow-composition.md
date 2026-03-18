# Workflow Composition (MAP-Elites)

**Phase 3 of the Unified Autonomous Loop**

## Purpose
Traditional automations use hardcoded scripts per task. SICA-style loops usually give an agent a bare environment and instruct it to "solve the problem," which can lead to unpredictable, expensive wandering. 

We solve this using a **MAP-Elites Workflow Library** & **Thoughtbox Branching**. Instead of writing from scratch, the system retrieves proven tactical sub-routines (workflows) from a curated population and dynamically recombines them based on the task constraints.

## 1. Task Characterization (5D Behavior Space)
Once a proposal is approved via `agentops`, it must be mapped to the behavioral grid. 

The task is scored (1-5) on five axes:
1. **Scope**: (1) Point question -> (5) Entire field mapping
2. **Domain Structure**: (1) Established single field -> (5) Cross-domain analogy
3. **Evidence Type**: (1) Empirical data -> (5) First principles theory
4. **Time Horizon**: (1) True right now -> (5) Speculative futures
5. **Fidelity Requirement**: (1) Ballpark guess -> (5) Rigorous/Publication-grade

## 2. Retrieval 
The system queries the MAP-Elites library—a set of `workflow-[uuid].yaml` definitions—for the 3-5 workflows that occupy the same geographic region (or adjacent regions) of this 5D behavior space.

*Note: The system contains seed workflows like "Quick Landscape Scan", "Fact-Checking Pipeline", and "Adversarial Stress-Test" to start.*

## 3. Novel Composition via Thoughtbox
The agent does *not* execute the retrieved workflows blindly. 

Using **Thoughtbox Branching** (`branchFromThought`):
1. The agent reads the *rationale* attached to the steps of the retrieved workflows.
2. It identifies step subsets that are highly contextual for the approved proposal.
3. It spawns thought branches simulating different workflow compositions.
4. It resolves the synthesis into a single, concrete step-by-step Novel Workflow Plan, capturing the lineage (the parent workflow IDs) that contributed to it.

## 4. Hypothesis Registration
The generated Novel Workflow Plan is moved to `dgm-specs/hypotheses/active/` to ensure robust tracking and accountability for the subsequent execution phase. The pipeline is now ready for autonomous deployment.
