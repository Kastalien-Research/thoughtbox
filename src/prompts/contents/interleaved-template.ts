/**
 * Interleaved Thinking Resource Templates
 *
 * Provides mode-specific IRCoT-style reasoning guides that can be accessed
 * via resource templates (thoughtbox://interleaved/{mode})
 */

/**
 * Valid modes for interleaved thinking guides
 */
export type InterleavedMode = "research" | "analysis" | "development" | "operations";

/**
 * Abstract capability categories used in mode configurations
 */
export type CapabilityKind =
  | "thoughtbox_workspace"
  | "retrieval_search"
  | "code_repo"
  | "sandbox_execute"
  | "external_actions";

/**
 * Configuration for each mode
 */
export interface ModeConfig {
  mode: InterleavedMode;
  title: string;
  description: string;
  requiredCapabilities: CapabilityKind[];
  optionalCapabilities: CapabilityKind[];
  phases: string[];
  notes: string[];
}

/**
 * Mode-specific configurations
 */
export const MODE_CONFIG: Record<InterleavedMode, ModeConfig> = {
  research: {
    mode: "research",
    title: "Research Mode",
    description: "For literature review, information gathering, and synthesis tasks",
    requiredCapabilities: ["thoughtbox_workspace", "retrieval_search"],
    optionalCapabilities: [],
    phases: [
      "Tooling Inventory - Ground yourself in available search and retrieval capabilities",
      "Tooling Sufficiency Assessment - Verify you have what you need for the research task",
      "Strategy in Thoughtbox - Plan your research approach using thoughtbox for structured reasoning",
      "Interleaved Execution Loop - Alternate between thoughtbox reasoning and information retrieval",
      "Final Answer - Synthesize findings and deliver comprehensive response"
    ],
    notes: [
      "Research requires reliable access to external information sources",
      "Use thoughtbox to track source quality and synthesis progress",
      "Gate your work at sufficiency assessment - if you lack search capabilities, be honest",
      "Prioritize breadth in initial passes, depth in later iterations"
    ]
  },

  analysis: {
    mode: "analysis",
    title: "Analysis Mode",
    description: "For deep examination, pattern recognition, and interpretation tasks",
    requiredCapabilities: ["thoughtbox_workspace"],
    optionalCapabilities: ["retrieval_search"],
    phases: [
      "Tooling Inventory - Confirm you have thoughtbox and any supplementary tools needed",
      "Tooling Sufficiency Assessment - Determine if additional context is required",
      "Strategy in Thoughtbox - Outline your analytical framework and approach",
      "Interleaved Execution Loop - Alternate between thoughtbox reasoning and focused investigation",
      "Final Answer - Present insights, patterns, and conclusions"
    ],
    notes: [
      "Analysis can often proceed with thoughtbox alone",
      "External retrieval is optional - use only if context is insufficient",
      "Focus on identifying patterns, relationships, and implications",
      "Use thoughtbox to maintain analytical rigor and track assumptions"
    ]
  },

  development: {
    mode: "development",
    title: "Development Mode",
    description: "For code implementation, debugging, and system building tasks",
    requiredCapabilities: ["thoughtbox_workspace", "code_repo", "sandbox_execute"],
    optionalCapabilities: ["retrieval_search"],
    phases: [
      "Tooling Inventory - Verify access to codebase, execution environment, and thoughtbox",
      "Tooling Sufficiency Assessment - Confirm you can read, write, and test code",
      "Strategy in Thoughtbox - Design your implementation approach and test strategy",
      "Interleaved Execution Loop - Alternate between thoughtbox planning, coding, and validation",
      "Final Answer - Deliver working, tested implementation with documentation"
    ],
    notes: [
      "Development requires ability to modify code and verify changes",
      "Use thoughtbox for design decisions and debugging strategy",
      "Gate your work if you cannot execute or test code - don't proceed blind",
      "Prioritize incremental validation - test early and often"
    ]
  },

  operations: {
    mode: "operations",
    title: "Operations Mode",
    description: "For agents that take real-world actions (emails, API calls, data mutations) where auditability of decisions and consequences is critical",
    requiredCapabilities: ["thoughtbox_workspace", "external_actions"],
    optionalCapabilities: ["retrieval_search"],
    phases: [
      "Tooling Inventory - Identify all tools that produce external side effects",
      "Constraint Assessment - Identify irreversible actions and escalation boundaries",
      "Strategy in Thoughtbox - Plan the operation using structured decision frames",
      "Auditable Execution Loop - Alternate between decision, action, and report cycles",
      "Session Summary - Produce final status with action manifest and assumption state"
    ],
    notes: [
      "Every decision that leads to an external action MUST be recorded as a decision frame thought BEFORE the action is taken",
      "Every external action MUST be followed by an action report thought linking the result back to the decision",
      "Assumptions about external state must be declared explicitly and tracked for changes",
      "Belief snapshots are required before any irreversible action",
      "If an assumption flips, immediately record which prior decisions depended on it"
    ]
  }
};

/**
 * Validates if a mode string is a valid InterleavedMode
 */
export function isValidMode(mode: string): mode is InterleavedMode {
  return mode === "research" || mode === "analysis" || mode === "development" || mode === "operations";
}

/**
 * Generates mode-specific interleaved thinking guide content
 */
export function interleavedGuide(mode: InterleavedMode): string {
  const config = MODE_CONFIG[mode];

  return `# Thoughtbox Interleaved Thinking - ${config.title}

${config.description}

## Overview

This guide implements the IRCoT (Interleaved Retrieval and Chain-of-Thought) pattern, adapted for Thoughtbox as your canonical reasoning workspace. Use this approach when ${getModeUsageGuidance(mode)}.

## Required Capabilities

Your environment must provide these capability kinds:

${config.requiredCapabilities.map(cap => `- **${cap}** - ${getCapabilityDescription(cap)}`).join('\n')}

${config.optionalCapabilities.length > 0 ? `## Optional Capabilities

These may enhance your work but are not strictly required:

${config.optionalCapabilities.map(cap => `- **${cap}** - ${getCapabilityDescription(cap)}`).join('\n')}
` : ''}

## Process Phases

${config.phases.map((phase, idx) => `### Phase ${idx + 1}: ${phase.split(' - ')[0]}

${phase.split(' - ')[1]}
`).join('\n')}

${mode === "operations" ? getOperationsExecutionPattern() : getGenericExecutionPattern()}

## Mode-Specific Guidance

${config.notes.map(note => `- ${note}`).join('\n')}

## Honesty Requirements

**CRITICAL**: Do not proceed if you lack required capabilities.

- If you cannot access thoughtbox, this entire approach fails
- If you lack required mode-specific capabilities, acknowledge this limitation
- Never fabricate tool capabilities or fake execution results
- It is better to admit constraints than to produce unreliable work

## Self-Check Procedure

Before beginning, verify:

1. [ ] I have access to thoughtbox tool
${config.requiredCapabilities
  .filter(cap => cap !== "thoughtbox_workspace")
  .map(cap => `2. [ ] I have access to ${cap} capabilities`)
  .join('\n')}
3. [ ] I understand the task requirements
4. [ ] I have a strategy for validation

If any check fails, communicate the limitation clearly before proceeding.

## References

- **Pattern**: IRCoT (Interleaved Retrieval and Chain-of-Thought)
- **Paper**: https://arxiv.org/abs/2212.10509
- **Workspace**: Thoughtbox MCP Server
- **Mode**: ${config.mode}

---

*This guide is generated dynamically via the thoughtbox://interleaved/${mode} resource template.*
`;
}

/**
 * Helper function to provide mode-specific usage guidance
 */
function getModeUsageGuidance(mode: InterleavedMode): string {
  switch (mode) {
    case "research":
      return "you need to gather, evaluate, and synthesize information from multiple sources";
    case "analysis":
      return "you need to deeply examine patterns, relationships, or implications in existing information";
    case "development":
      return "you need to design, implement, and validate code or system changes";
    case "operations":
      return "you need to take real-world actions (API calls, emails, data changes) where every decision and action must be auditable";
  }
}

/**
 * Helper function to describe capability kinds
 */
function getCapabilityDescription(capability: CapabilityKind): string {
  switch (capability) {
    case "thoughtbox_workspace":
      return "Structured reasoning workspace for step-by-step thinking";
    case "retrieval_search":
      return "Ability to search and retrieve external information";
    case "code_repo":
      return "Access to read and write code in a repository";
    case "sandbox_execute":
      return "Ability to execute and test code safely";
    case "external_actions":
      return "Ability to perform actions with real-world consequences (API calls, emails, data mutations)";
  }
}

/**
 * Generic execution pattern for research, analysis, and development modes
 */
function getGenericExecutionPattern(): string {
  return `## Execution Pattern

\`\`\`
WHILE task not complete:
  1. Use thoughtbox for structured reasoning step
  2. Identify next action based on current understanding
  3. Execute action using appropriate tool
  4. Observe results
  5. Return to thoughtbox to integrate findings
  6. Reassess approach and next steps
END WHILE
\`\`\``;
}

/**
 * Operations-specific execution pattern with auditable decision→action→report loop
 */
function getOperationsExecutionPattern(): string {
  return `## Execution Pattern — Auditable Operations Loop

The operations execution loop has a strict structure. Every external action is bookended by a decision thought (before) and a report thought (after). Set the \`thoughtType\` field on each thought to enable programmatic filtering.

\`\`\`
WHILE task not complete:
  1. DECISION FRAME (thoughtbox call, thoughtType: "decision_frame")
     Record a thought with the following structure in the thought content:
     - DECISION: What decision is being made (one sentence)
     - OPTIONS: What options were considered (bulleted list)
     - SELECTED: Which option was chosen
     - SELECTION_RULE: Why this option over others (the reasoning)
     - EVIDENCE: What observations or data informed this decision
     - CONFIDENCE: How confident (high / medium / low) and why
     - ASSUMPTIONS: What assumptions this decision depends on
     - NEXT_EXPECTED: What you expect to observe after acting

  2. EXECUTE ACTION (external tool call)
     Perform the external action using the appropriate tool.

  3. ACTION REPORT (thoughtbox call, thoughtType: "action_report")
     Record a thought with the following structure in the thought content:
     - ACTION: What was done (tool name, target, key parameters)
     - RESULT: What happened (success/failure, response summary)
     - EXPECTED_VS_ACTUAL: Did the result match NEXT_EXPECTED from the decision frame?
     - SIDE_EFFECTS: Any observable consequences (data changed, message sent, state modified)
     - REVERSIBLE: Can this action be undone? (yes/no/partial)
     - ASSUMPTION_UPDATE: Did any assumptions change? If so, which ones and what depends on them?

  4. BELIEF CHECK (if needed, thoughtType: "belief_snapshot")
     If assumptions changed or results were unexpected, record a belief snapshot:
     - ENTITIES: Key objects and their current known state
     - CONSTRAINTS: What rules or limits are active
     - OPEN_QUESTIONS: What is unknown or uncertain
     - RISKS: What could go wrong from here
     - NEXT_EXPECTED: What you expect to observe next

  5. ASSUMPTION UPDATE (if needed, thoughtType: "assumption_update")
     If any assumption flipped status, record:
     - ASSUMPTION: What was believed
     - NEW_STATUS: believed / uncertain / refuted
     - TRIGGER: What observation caused the change
     - DOWNSTREAM: Which prior decisions depended on this assumption

  6. Return to step 1
END WHILE
\`\`\``;
}
