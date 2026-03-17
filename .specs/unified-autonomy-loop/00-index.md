# Unified Autonomous Improvement Architecture

**Status**: Draft
**Scope**: End-to-end unification of Thoughtbox's self-improvement loops.

## Overview

This directory contains the specification for unifying Thoughtbox's disparate self-improving and autonomous architectures into a cohesive system. Previously, the project maintained separate architectural threads:
1. **`agentops/`**: Human-in-the-loop orchestration, issue creation, and PR lifecycle.
2. **`dgm-specs/` & `self-improvement/`**: Darwin Gödel Machine evolutionary concepts, Distbook execution, tiered evaluation, and cost-reduction plans.
3. **`quality-diversity/map-elites-research`**: Evolutionary cognitive framework prioritizing a "Taste Agent" (for selecting what to do) and a MAP-Elites Workflow Library (for determining how to do it).

The unified loop merges these together to eliminate redundancies, reduce API costs (abandoning `$7,000/run` overheads seen in early SICA approaches), and prevent reward-hacking logic, all while utilizing `agentops` for strict human oversight.

## Document Structure

The unified pipeline is divided into the following specifications, describing the phases of the lifecycle:

1. **[`01-discovery-and-taste.md`](./01-discovery-and-taste.md)**: Idea generation, scraping, and rigorous filtration using the pure-inference Taste Agent heuristics.
2. **[`02-orchestration-agentops.md`](./02-orchestration-agentops.md)**: GitHub Actions integration, Daily Dev Briefs, labeling patterns (`smoke`/`approved`), and user authorization.
3. **[`03-workflow-composition.md`](./03-workflow-composition.md)**: Mapping tasks to a 5D MAP-Elites behavioral space and dynamically composing execution workflows using Thoughtbox branching.
4. **[`04-execution-evaluation.md`](./04-execution-evaluation.md)**: Proctored execution via Distbook + Docker, Tiered evaluation strategies, anti-gaming contamination detection, and evolutionary compounding.
5. **[`05-tool-pedagogy-optimization.md`](./05-tool-pedagogy-optimization.md)**: Asynchronous, scheduled evolution of the MCP tool API surface (schemas, output formatting) based on LangSmith trace analysis of organic CLI usage.

## Key Consolidations

- **Orchestration**: We have abandoned Temporal in favor of strict GitHub Actions + Issues tracking via `agentops`.
- **Filtering**: We have replaced the concept of simple LLM relevance-scoring with the rigorous **Taste Agent** heuristics (Compression, Dead-End calculation, Simplicity Audit).
- **Execution**: Standardized on **Distbook** acting as an MCP endpoint running *inside* a network-disabled Docker environment for secure sandboxing.
