/**
 * Operations Catalog for Hub Toolhost
 *
 * Defines all 27 hub operations organized by category with stage metadata.
 * Includes hub vocabulary for agent onboarding.
 */

export interface OperationDefinition {
  name: string;
  title: string;
  description: string;
  category: string;
  stage: number;
  inputSchema: any;
  example?: any;
}

// =============================================================================
// Hub Vocabulary
// =============================================================================

export const HUB_VOCABULARY = {
  workspace: "A shared collaboration space where agents coordinate. Contains problems, proposals, consensus markers, and channels. Agents must join a workspace before participating.",
  problem: "A unit of work to be solved. Problems can have dependencies, sub-problems, and status tracking (open → in-progress → resolved → closed). Agents claim problems to work on them.",
  proposal: "A proposed solution to a problem. Includes a source branch reference for code changes. Other agents review and approve proposals before they can be merged.",
  consensus: "A decision marker that records agreement among agents. Tied to a thought reference for traceability. Other agents endorse consensus markers to show agreement.",
  channel: "A message stream scoped to a problem within a workspace. Used for discussion, status updates, and coordination between agents working on related problems.",
  agent: "A registered participant in the hub. Has a unique ID, name, and optional profile. Must register before joining workspaces.",
  profile: "An optional role specialization (MANAGER, ARCHITECT, DEBUGGER, SECURITY, RESEARCHER, REVIEWER) that provides domain-specific mental models and behavioral priming.",
};

// =============================================================================
// Operations by Category
// =============================================================================

const IDENTITY_OPERATIONS: OperationDefinition[] = [
  {
    name: "register",
    title: "Register Agent",
    description: "Register as an agent in the hub. Required before any other hub operation. Returns a unique agentId.",
    category: "identity",
    stage: 0,
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Display name for this agent",
        },
        profile: {
          type: "string",
          enum: ["MANAGER", "ARCHITECT", "DEBUGGER", "SECURITY", "RESEARCHER", "REVIEWER"],
          description: "Optional role profile for behavioral priming",
        },
        clientInfo: {
          type: "string",
          description: "Optional client identifier (e.g., 'claude-code-v1')",
        },
      },
      required: ["name"],
    },
    example: {
      name: "Architect Agent",
      profile: "ARCHITECT",
    },
  },
  {
    name: "quick_join",
    title: "Quick Join",
    description: "Register and join a workspace in a single call. Combines register + join_workspace for efficient onboarding.",
    category: "identity",
    stage: 0,
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Display name for this agent",
        },
        workspaceId: {
          type: "string",
          description: "Workspace to join immediately after registration",
        },
        profile: {
          type: "string",
          enum: ["MANAGER", "ARCHITECT", "DEBUGGER", "SECURITY", "RESEARCHER", "REVIEWER"],
          description: "Optional role profile",
        },
        clientInfo: {
          type: "string",
          description: "Optional client identifier",
        },
      },
      required: ["name", "workspaceId"],
    },
    example: {
      name: "Debugger",
      workspaceId: "ws-abc123",
      profile: "DEBUGGER",
    },
  },
  {
    name: "list_workspaces",
    title: "List Workspaces",
    description: "List all available workspaces. Does not require registration.",
    category: "identity",
    stage: 0,
    inputSchema: {
      type: "object",
      properties: {},
    },
    example: {},
  },
];

const AGENT_OPERATIONS: OperationDefinition[] = [
  {
    name: "whoami",
    title: "Who Am I",
    description: "Get current agent identity, role, and workspace memberships.",
    category: "agent",
    stage: 1,
    inputSchema: {
      type: "object",
      properties: {},
    },
    example: {},
  },
  {
    name: "create_workspace",
    title: "Create Workspace",
    description: "Create a new collaboration workspace. The creating agent becomes the coordinator.",
    category: "agent",
    stage: 1,
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Workspace name",
        },
        description: {
          type: "string",
          description: "Workspace purpose and scope",
        },
      },
      required: ["name", "description"],
    },
    example: {
      name: "Operations Catalogs",
      description: "Implement operations catalogs for all handler domains",
    },
  },
  {
    name: "join_workspace",
    title: "Join Workspace",
    description: "Join an existing workspace. Returns current workspace state including problems and proposals.",
    category: "agent",
    stage: 1,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: {
          type: "string",
          description: "ID of the workspace to join",
        },
      },
      required: ["workspaceId"],
    },
    example: {
      workspaceId: "ws-abc123",
    },
  },
  {
    name: "get_profile_prompt",
    title: "Get Profile Prompt",
    description: "Get the behavioral prompt for a specific profile role. Includes domain-specific mental models and guidelines.",
    category: "agent",
    stage: 1,
    inputSchema: {
      type: "object",
      properties: {
        profile: {
          type: "string",
          enum: ["MANAGER", "ARCHITECT", "DEBUGGER", "SECURITY", "RESEARCHER", "REVIEWER"],
          description: "Profile to retrieve",
        },
      },
      required: ["profile"],
    },
    example: {
      profile: "ARCHITECT",
    },
  },
];

const PROBLEM_OPERATIONS: OperationDefinition[] = [
  {
    name: "create_problem",
    title: "Create Problem",
    description: "Define a new problem to be solved within a workspace.",
    category: "problems",
    stage: 2,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        title: { type: "string", description: "Problem title" },
        description: { type: "string", description: "Detailed problem description" },
      },
      required: ["workspaceId", "title", "description"],
    },
    example: {
      workspaceId: "ws-abc123",
      title: "Missing operations catalog for gateway",
      description: "Gateway operations have no self-service schema discovery",
    },
  },
  {
    name: "claim_problem",
    title: "Claim Problem",
    description: "Claim a problem to work on. Auto-generates a branch name if not provided. Sets status to in-progress.",
    category: "problems",
    stage: 2,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        problemId: { type: "string", description: "Problem ID to claim" },
        branchId: { type: "string", description: "Optional thought branch name (auto-generated if omitted)" },
      },
      required: ["workspaceId", "problemId"],
    },
    example: {
      workspaceId: "ws-abc123",
      problemId: "prob-001",
    },
  },
  {
    name: "update_problem",
    title: "Update Problem",
    description: "Update problem status or resolution. Status transitions: open → in-progress → resolved → closed.",
    category: "problems",
    stage: 2,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        problemId: { type: "string", description: "Problem ID" },
        status: { type: "string", enum: ["open", "in-progress", "resolved", "closed"], description: "New status" },
        resolution: { type: "string", description: "Resolution summary (for resolved/closed)" },
      },
      required: ["workspaceId", "problemId", "status"],
    },
    example: {
      workspaceId: "ws-abc123",
      problemId: "prob-001",
      status: "resolved",
      resolution: "Operations catalog implemented and registered",
    },
  },
  {
    name: "list_problems",
    title: "List Problems",
    description: "List all problems in a workspace with their status and assignments.",
    category: "problems",
    stage: 2,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
      },
      required: ["workspaceId"],
    },
    example: {
      workspaceId: "ws-abc123",
    },
  },
  {
    name: "add_dependency",
    title: "Add Dependency",
    description: "Add a dependency between problems. The problem cannot be claimed until its dependency is resolved.",
    category: "problems",
    stage: 2,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        problemId: { type: "string", description: "Problem that depends on another" },
        dependsOnProblemId: { type: "string", description: "Problem that must be resolved first" },
      },
      required: ["workspaceId", "problemId", "dependsOnProblemId"],
    },
    example: {
      workspaceId: "ws-abc123",
      problemId: "prob-002",
      dependsOnProblemId: "prob-001",
    },
  },
  {
    name: "remove_dependency",
    title: "Remove Dependency",
    description: "Remove a dependency between problems.",
    category: "problems",
    stage: 2,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        problemId: { type: "string", description: "Problem to remove dependency from" },
        dependsOnProblemId: { type: "string", description: "Dependency to remove" },
      },
      required: ["workspaceId", "problemId", "dependsOnProblemId"],
    },
    example: {
      workspaceId: "ws-abc123",
      problemId: "prob-002",
      dependsOnProblemId: "prob-001",
    },
  },
  {
    name: "ready_problems",
    title: "Ready Problems",
    description: "List problems that are ready to claim (no unresolved dependencies, status is open).",
    category: "problems",
    stage: 2,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
      },
      required: ["workspaceId"],
    },
    example: {
      workspaceId: "ws-abc123",
    },
  },
  {
    name: "blocked_problems",
    title: "Blocked Problems",
    description: "List problems that are blocked by unresolved dependencies.",
    category: "problems",
    stage: 2,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
      },
      required: ["workspaceId"],
    },
    example: {
      workspaceId: "ws-abc123",
    },
  },
  {
    name: "create_sub_problem",
    title: "Create Sub-Problem",
    description: "Create a sub-problem under an existing parent problem. Sub-problems inherit workspace scope.",
    category: "problems",
    stage: 2,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        parentId: { type: "string", description: "Parent problem ID" },
        title: { type: "string", description: "Sub-problem title" },
        description: { type: "string", description: "Sub-problem description" },
      },
      required: ["workspaceId", "parentId", "title", "description"],
    },
    example: {
      workspaceId: "ws-abc123",
      parentId: "prob-001",
      title: "Create gateway/operations.ts",
      description: "Extract schemas from gateway-handler.ts into operations catalog",
    },
  },
];

const PROPOSAL_OPERATIONS: OperationDefinition[] = [
  {
    name: "create_proposal",
    title: "Create Proposal",
    description: "Propose a solution to a problem. References a thought branch containing the work.",
    category: "proposals",
    stage: 2,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        title: { type: "string", description: "Proposal title" },
        description: { type: "string", description: "Proposal description and approach" },
        sourceBranch: { type: "string", description: "Thought branch containing the work" },
        problemId: { type: "string", description: "Optional problem this proposal solves" },
      },
      required: ["workspaceId", "title", "description", "sourceBranch"],
    },
    example: {
      workspaceId: "ws-abc123",
      title: "Gateway operations catalog",
      description: "Added operations.ts with 5 operations",
      sourceBranch: "architect/gateway-ops",
      problemId: "prob-001",
    },
  },
  {
    name: "review_proposal",
    title: "Review Proposal",
    description: "Review a proposal with approve/request-changes/reject verdict.",
    category: "proposals",
    stage: 2,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        proposalId: { type: "string", description: "Proposal ID to review" },
        verdict: { type: "string", enum: ["approve", "request-changes", "reject"], description: "Review verdict" },
        reasoning: { type: "string", description: "Explanation of the verdict" },
      },
      required: ["workspaceId", "proposalId", "verdict", "reasoning"],
    },
    example: {
      workspaceId: "ws-abc123",
      proposalId: "prop-001",
      verdict: "approve",
      reasoning: "Schemas match handler validation code",
    },
  },
  {
    name: "merge_proposal",
    title: "Merge Proposal",
    description: "Merge an approved proposal. Requires at least one approval review.",
    category: "proposals",
    stage: 2,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        proposalId: { type: "string", description: "Proposal ID to merge" },
      },
      required: ["workspaceId", "proposalId"],
    },
    example: {
      workspaceId: "ws-abc123",
      proposalId: "prop-001",
    },
  },
  {
    name: "list_proposals",
    title: "List Proposals",
    description: "List all proposals in a workspace with their review status.",
    category: "proposals",
    stage: 2,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
      },
      required: ["workspaceId"],
    },
    example: {
      workspaceId: "ws-abc123",
    },
  },
];

const CONSENSUS_OPERATIONS: OperationDefinition[] = [
  {
    name: "mark_consensus",
    title: "Mark Consensus",
    description: "Record a consensus decision. Links to a thought reference for traceability.",
    category: "consensus",
    stage: 2,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        name: { type: "string", description: "Consensus decision name" },
        description: { type: "string", description: "What was decided" },
        thoughtRef: { type: "string", description: "Reference to the thought supporting this decision" },
        branchId: { type: "string", description: "Optional branch containing supporting reasoning" },
      },
      required: ["workspaceId", "name", "description", "thoughtRef"],
    },
    example: {
      workspaceId: "ws-abc123",
      name: "Use notebook pattern for operations",
      description: "Follow existing notebook/operations.ts as the template",
      thoughtRef: "thought-5",
    },
  },
  {
    name: "endorse_consensus",
    title: "Endorse Consensus",
    description: "Endorse an existing consensus marker to show agreement.",
    category: "consensus",
    stage: 2,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        markerId: { type: "string", description: "Consensus marker ID to endorse" },
      },
      required: ["workspaceId", "markerId"],
    },
    example: {
      workspaceId: "ws-abc123",
      markerId: "cons-001",
    },
  },
  {
    name: "list_consensus",
    title: "List Consensus",
    description: "List all consensus markers in a workspace with endorsement counts.",
    category: "consensus",
    stage: 2,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
      },
      required: ["workspaceId"],
    },
    example: {
      workspaceId: "ws-abc123",
    },
  },
];

const CHANNEL_OPERATIONS: OperationDefinition[] = [
  {
    name: "post_message",
    title: "Post Message",
    description: "Post a message to a problem's discussion channel.",
    category: "channels",
    stage: 2,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        problemId: { type: "string", description: "Problem whose channel to post in" },
        content: { type: "string", description: "Message content" },
      },
      required: ["workspaceId", "problemId", "content"],
    },
    example: {
      workspaceId: "ws-abc123",
      problemId: "prob-001",
      content: "Starting work on gateway operations catalog",
    },
  },
  {
    name: "read_channel",
    title: "Read Channel",
    description: "Read messages from a problem's discussion channel.",
    category: "channels",
    stage: 2,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        problemId: { type: "string", description: "Problem whose channel to read" },
      },
      required: ["workspaceId", "problemId"],
    },
    example: {
      workspaceId: "ws-abc123",
      problemId: "prob-001",
    },
  },
  {
    name: "post_system_message",
    title: "Post System Message",
    description: "Post a system message to a problem's channel (automated notifications, status updates).",
    category: "channels",
    stage: 2,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
        problemId: { type: "string", description: "Problem whose channel to post in" },
        content: { type: "string", description: "System message content" },
      },
      required: ["workspaceId", "problemId", "content"],
    },
    example: {
      workspaceId: "ws-abc123",
      problemId: "prob-001",
      content: "Problem status changed to in-progress",
    },
  },
];

const STATUS_OPERATIONS: OperationDefinition[] = [
  {
    name: "workspace_status",
    title: "Workspace Status",
    description: "Get current status of a workspace including agent activity and problem summary.",
    category: "status",
    stage: 2,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
      },
      required: ["workspaceId"],
    },
    example: {
      workspaceId: "ws-abc123",
    },
  },
  {
    name: "workspace_digest",
    title: "Workspace Digest",
    description: "Get a comprehensive digest of workspace state: agents, problems, proposals, and consensus.",
    category: "status",
    stage: 2,
    inputSchema: {
      type: "object",
      properties: {
        workspaceId: { type: "string", description: "Workspace ID" },
      },
      required: ["workspaceId"],
    },
    example: {
      workspaceId: "ws-abc123",
    },
  },
];

// =============================================================================
// Combined Operations
// =============================================================================

export const HUB_OPERATIONS: OperationDefinition[] = [
  ...IDENTITY_OPERATIONS,
  ...AGENT_OPERATIONS,
  ...PROBLEM_OPERATIONS,
  ...PROPOSAL_OPERATIONS,
  ...CONSENSUS_OPERATIONS,
  ...CHANNEL_OPERATIONS,
  ...STATUS_OPERATIONS,
];

/**
 * Get operation definition by name
 */
export function getOperation(name: string): OperationDefinition | undefined {
  return HUB_OPERATIONS.find((op) => op.name === name);
}

/**
 * Get all operation names
 */
export function getOperationNames(): string[] {
  return HUB_OPERATIONS.map((op) => op.name);
}

/**
 * Get operations for a specific stage
 */
export function getOperationsByStage(stage: number): OperationDefinition[] {
  return HUB_OPERATIONS.filter((op) => op.stage === stage);
}

/**
 * Get operations catalog as JSON resource
 */
export function getOperationsCatalog(): string {
  return JSON.stringify(
    {
      version: "1.0.0",
      vocabulary: HUB_VOCABULARY,
      operations: HUB_OPERATIONS.map((op) => ({
        name: op.name,
        title: op.title,
        description: op.description,
        category: op.category,
        stage: op.stage,
        inputs: op.inputSchema,
        example: op.example,
      })),
      categories: [
        {
          name: "identity",
          stage: 0,
          description: "Register as an agent and discover workspaces",
        },
        {
          name: "agent",
          stage: 1,
          description: "Manage identity, create/join workspaces, get profile prompts",
        },
        {
          name: "problems",
          stage: 2,
          description: "Create, claim, update, and track problems with dependencies",
        },
        {
          name: "proposals",
          stage: 2,
          description: "Propose, review, and merge solutions",
        },
        {
          name: "consensus",
          stage: 2,
          description: "Record and endorse team decisions",
        },
        {
          name: "channels",
          stage: 2,
          description: "Post and read messages in problem-scoped channels",
        },
        {
          name: "status",
          stage: 2,
          description: "Workspace health and digest views",
        },
      ],
    },
    null,
    2
  );
}
