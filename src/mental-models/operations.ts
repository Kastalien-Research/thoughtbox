/**
 * Mental Models Registry and Operations Catalog
 *
 * TODO: Reimagine mental models to be more useful to agents.
 * Current implementation provides generic reasoning scaffolds that may not
 * deliver sufficient value in practice. Consider:
 * - More agent-specific patterns (tool selection, error recovery, context management)
 * - Integration with thoughtbox tool for guided reasoning workflows
 * - Concrete examples tailored to MCP server use cases
 * - Shorter, more actionable prompts vs. comprehensive guides
 */

import {
  MentalModelDefinition,
  TagDefinition,
  OperationDefinition,
} from "./types.js";

// Import all mental model content
import { RUBBER_DUCK_CONTENT } from "./contents/rubber-duck.js";
import { FIVE_WHYS_CONTENT } from "./contents/five-whys.js";
import { PRE_MORTEM_CONTENT } from "./contents/pre-mortem.js";
import { ASSUMPTION_SURFACING_CONTENT } from "./contents/assumption-surfacing.js";
import { STEELMANNING_CONTENT } from "./contents/steelmanning.js";
import { TRADE_OFF_MATRIX_CONTENT } from "./contents/trade-off-matrix.js";
import { FERMI_ESTIMATION_CONTENT } from "./contents/fermi-estimation.js";
import { ABSTRACTION_LADDERING_CONTENT } from "./contents/abstraction-laddering.js";
import { DECOMPOSITION_CONTENT } from "./contents/decomposition.js";
import { ADVERSARIAL_THINKING_CONTENT } from "./contents/adversarial-thinking.js";
import { OPPORTUNITY_COST_CONTENT } from "./contents/opportunity-cost.js";
import { CONSTRAINT_RELAXATION_CONTENT } from "./contents/constraint-relaxation.js";
import { TIME_HORIZON_SHIFTING_CONTENT } from "./contents/time-horizon-shifting.js";
import { IMPACT_EFFORT_GRID_CONTENT } from "./contents/impact-effort-grid.js";
import { INVERSION_CONTENT } from "./contents/inversion.js";

/**
 * Tag definitions with descriptions
 */
export const TAG_DEFINITIONS: TagDefinition[] = [
  {
    name: "debugging",
    description: "Finding and fixing issues in code, logic, or systems",
  },
  {
    name: "planning",
    description: "Breaking down work, sequencing tasks, project organization",
  },
  {
    name: "decision-making",
    description: "Choosing between options under uncertainty",
  },
  {
    name: "risk-analysis",
    description: "Identifying what could go wrong and how to prevent it",
  },
  {
    name: "estimation",
    description: "Making reasonable guesses with limited information",
  },
  {
    name: "prioritization",
    description: "Deciding what to do first, resource allocation",
  },
  {
    name: "communication",
    description: "Explaining clearly to humans, documentation",
  },
  {
    name: "architecture",
    description: "System design, component relationships, structure",
  },
  {
    name: "validation",
    description: "Checking assumptions, testing hypotheses, verification",
  },
];

/**
 * Mental models registry
 */
export const MENTAL_MODELS: MentalModelDefinition[] = [
  {
    name: "rubber-duck",
    title: "Rubber Duck Debugging",
    description:
      "Explain a problem step-by-step to find issues through articulation",
    tags: ["debugging", "communication"],
    content: RUBBER_DUCK_CONTENT,
  },
  {
    name: "five-whys",
    title: "Five Whys",
    description:
      "Iteratively ask why to drill down from symptoms to root cause",
    tags: ["debugging", "validation"],
    content: FIVE_WHYS_CONTENT,
  },
  {
    name: "pre-mortem",
    title: "Pre-mortem Analysis",
    description:
      "Imagine failure has occurred, then work backward to identify causes",
    tags: ["risk-analysis", "planning"],
    content: PRE_MORTEM_CONTENT,
  },
  {
    name: "assumption-surfacing",
    title: "Assumption Surfacing",
    description: "Explicitly identify and examine hidden assumptions",
    tags: ["validation", "planning"],
    content: ASSUMPTION_SURFACING_CONTENT,
  },
  {
    name: "steelmanning",
    title: "Steelmanning",
    description:
      "Present the strongest version of opposing views before deciding",
    tags: ["decision-making", "validation"],
    content: STEELMANNING_CONTENT,
  },
  {
    name: "trade-off-matrix",
    title: "Trade-off Matrix",
    description: "Map competing concerns explicitly to make balanced decisions",
    tags: ["decision-making", "prioritization"],
    content: TRADE_OFF_MATRIX_CONTENT,
  },
  {
    name: "fermi-estimation",
    title: "Fermi Estimation",
    description:
      "Make reasonable order-of-magnitude estimates with limited data",
    tags: ["estimation"],
    content: FERMI_ESTIMATION_CONTENT,
  },
  {
    name: "abstraction-laddering",
    title: "Abstraction Laddering",
    description:
      "Move up and down levels of abstraction to find the right framing",
    tags: ["architecture", "communication"],
    content: ABSTRACTION_LADDERING_CONTENT,
  },
  {
    name: "decomposition",
    title: "Decomposition",
    description: "Break complex problems into smaller, tractable pieces",
    tags: ["planning", "architecture"],
    content: DECOMPOSITION_CONTENT,
  },
  {
    name: "adversarial-thinking",
    title: "Adversarial Thinking",
    description: "Adopt an attacker mindset to identify vulnerabilities",
    tags: ["risk-analysis", "validation"],
    content: ADVERSARIAL_THINKING_CONTENT,
  },
  {
    name: "opportunity-cost",
    title: "Opportunity Cost Analysis",
    description: "Consider what you give up by choosing one option over others",
    tags: ["decision-making", "prioritization"],
    content: OPPORTUNITY_COST_CONTENT,
  },
  {
    name: "constraint-relaxation",
    title: "Constraint Relaxation",
    description:
      "Temporarily remove constraints to explore solution space, then reapply",
    tags: ["planning", "architecture"],
    content: CONSTRAINT_RELAXATION_CONTENT,
  },
  {
    name: "time-horizon-shifting",
    title: "Time Horizon Shifting",
    description:
      "Evaluate decisions across multiple time scales (1 week, 1 year, 10 years)",
    tags: ["planning", "decision-making"],
    content: TIME_HORIZON_SHIFTING_CONTENT,
  },
  {
    name: "impact-effort-grid",
    title: "Impact/Effort Grid",
    description: "Prioritize by plotting options on impact vs effort axes",
    tags: ["prioritization"],
    content: IMPACT_EFFORT_GRID_CONTENT,
  },
  {
    name: "inversion",
    title: "Inversion",
    description:
      "Instead of seeking success, identify and avoid paths to failure",
    tags: ["risk-analysis", "planning"],
    content: INVERSION_CONTENT,
  },
];

/**
 * Get all unique tag names
 */
export function getTagNames(): string[] {
  return TAG_DEFINITIONS.map((t) => t.name);
}

/**
 * Get all model names
 */
export function getModelNames(): string[] {
  return MENTAL_MODELS.map((m) => m.name);
}

/**
 * Get model count
 */
export function getModelCount(): number {
  return MENTAL_MODELS.length;
}

/**
 * Get a specific model by name
 */
export function getModel(name: string): MentalModelDefinition | undefined {
  return MENTAL_MODELS.find((m) => m.name === name);
}

/**
 * Get models filtered by tag
 */
export function getModelsByTag(tag: string): MentalModelDefinition[] {
  return MENTAL_MODELS.filter((m) => m.tags.includes(tag));
}

/**
 * Operations catalog for the mental_models toolhost
 */
export const MENTAL_MODELS_OPERATIONS: OperationDefinition[] = [
  {
    name: "get_model",
    title: "Get Mental Model",
    description:
      "Retrieve the full prompt content for a specific mental model",
    category: "retrieval",
    inputs: {
      type: "object",
      properties: {
        model: {
          type: "string",
          description: "Name of the mental model to retrieve",
        },
      },
      required: ["model"],
    },
    example: {
      model: "five-whys",
    },
  },
  {
    name: "list_models",
    title: "List Mental Models",
    description:
      "List all available mental models, optionally filtered by tag",
    category: "discovery",
    inputs: {
      type: "object",
      properties: {
        tag: {
          type: "string",
          description: "Optional tag to filter models by",
        },
      },
    },
    example: {
      tag: "debugging",
    },
  },
  {
    name: "list_tags",
    title: "List Tags",
    description: "List all available tags with their descriptions",
    category: "discovery",
    inputs: {
      type: "object",
      properties: {},
    },
    example: {},
  },
  {
    name: "get_capability_graph",
    title: "Get Capability Graph",
    description:
      "Get a structured representation of all Thoughtbox capabilities (tools, operations, mental models) for initializing a knowledge graph. Use with memory_create_entities and memory_create_relations to make the server's capabilities salient.",
    category: "discovery",
    inputs: {
      type: "object",
      properties: {},
    },
    example: {},
  },
];

/**
 * Get operation names for enum
 */
export function getOperationNames(): string[] {
  return MENTAL_MODELS_OPERATIONS.map((op) => op.name);
}

/**
 * Generate dynamic tool description
 */
export function generateToolDescription(): string {
  const tags = getTagNames();
  const modelCount = getModelCount();

  return `Access ${modelCount} mental models for structured reasoning. Each model provides a complete prompt with process steps, examples, and pitfalls.

Mental models are process scaffolds that tell you HOW to think about a problem, not WHAT to think. They're infrastructure for your reasoning.

Operations:
- get_model: Retrieve a specific mental model prompt
- list_models: List available models (optionally filtered by tag)
- list_tags: List all available tags with descriptions
- get_capability_graph: Get structured data for knowledge graph initialization

Available tags: ${tags.join(", ")}

Use list_models with a tag filter to discover relevant models for your task. For example, use tag "debugging" when stuck on an issue, or "decision-making" when choosing between options.`;
}

/**
 * Get operations catalog as JSON
 */
export function getOperationsCatalog(): string {
  return JSON.stringify(
    {
      version: "1.0.0",
      operations: MENTAL_MODELS_OPERATIONS,
      tags: TAG_DEFINITIONS,
      models: MENTAL_MODELS.map((m) => ({
        name: m.name,
        title: m.title,
        description: m.description,
        tags: m.tags,
      })),
    },
    null,
    2
  );
}
