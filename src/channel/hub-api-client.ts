/**
 * Hub API Client
 *
 * HTTP client for executing Hub operations against the Thoughtbox server.
 * Used by the Channel's reply tools (hub_reply, hub_action).
 *
 * Communicates via JSON-RPC over the /mcp endpoint, maintaining an MCP
 * session for agent identity continuity.
 */

export interface HubApiClientConfig {
  /** Base URL of the Thoughtbox HTTP server */
  baseUrl: string;
  /** Agent name for registration */
  agentName: string;
  /** Agent profile (MANAGER, ARCHITECT, etc.) */
  agentProfile?: string;
  /** Workspace ID */
  workspaceId: string;
}

export class HubApiClient {
  private config: HubApiClientConfig;
  private mcpSessionId: string | null = null;
  private agentId: string | null = null;
  private requestId = 0;

  constructor(config: HubApiClientConfig) {
    this.config = config;
  }

  /**
   * Register the agent and join the workspace.
   * Must be called before any other operations.
   */
  async initialize(): Promise<string> {
    // Register via quick_join
    const result = await this.callMcp("tools/call", {
      name: "thoughtbox_execute",
      arguments: {
        code: `async () => {
          // Check if already registered by listing workspaces
          const workspaces = await tb.session.list({ limit: 1 });
          return workspaces;
        }`,
      },
    });

    // For now, use direct hub operations via the SSE endpoint's hub-handler
    // The Channel registers via the /hub/register endpoint
    const registerResult = await this.callHubEndpoint("register", {
      name: this.config.agentName,
      profile: this.config.agentProfile,
    });

    if (registerResult && typeof registerResult === "object" && "agentId" in registerResult) {
      this.agentId = (registerResult as { agentId: string }).agentId;
    }

    // Join workspace
    if (this.agentId) {
      await this.callHubEndpoint("join_workspace", {
        workspaceId: this.config.workspaceId,
      });
    }

    return this.agentId ?? "";
  }

  /**
   * Post a message to a problem's channel.
   */
  async postMessage(problemId: string, content: string): Promise<unknown> {
    return this.callHubEndpoint("post_message", {
      workspaceId: this.config.workspaceId,
      problemId,
      content,
    });
  }

  /**
   * Claim a problem.
   */
  async claimProblem(problemId: string): Promise<unknown> {
    return this.callHubEndpoint("claim_problem", {
      workspaceId: this.config.workspaceId,
      problemId,
    });
  }

  /**
   * Update problem status.
   */
  async updateProblemStatus(
    problemId: string,
    status: string,
    resolution?: string,
  ): Promise<unknown> {
    return this.callHubEndpoint("update_problem", {
      workspaceId: this.config.workspaceId,
      problemId,
      status,
      ...(resolution ? { resolution } : {}),
    });
  }

  /**
   * Endorse a consensus marker.
   */
  async endorseConsensus(consensusId: string): Promise<unknown> {
    return this.callHubEndpoint("endorse_consensus", {
      workspaceId: this.config.workspaceId,
      consensusId,
    });
  }

  /**
   * Review a proposal.
   */
  async reviewProposal(
    proposalId: string,
    verdict: "approve" | "request-changes" | "reject",
    reasoning: string,
  ): Promise<unknown> {
    return this.callHubEndpoint("review_proposal", {
      workspaceId: this.config.workspaceId,
      proposalId,
      verdict,
      reasoning,
    });
  }

  /** Get the resolved agent ID */
  getAgentId(): string | null {
    return this.agentId;
  }

  /**
   * Call a Hub operation via the /hub/api endpoint.
   */
  private async callHubEndpoint(
    operation: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    const url = `${this.config.baseUrl}/hub/api`;
    const body = {
      operation,
      agentId: this.agentId,
      ...args,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Hub API error (${response.status}): ${text}`);
    }

    return response.json();
  }

  /**
   * Call the MCP endpoint (for tools that go through the full MCP protocol).
   */
  private async callMcp(
    method: string,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const url = `${this.config.baseUrl}/mcp`;
    this.requestId++;

    const body = {
      jsonrpc: "2.0",
      id: this.requestId,
      method,
      params,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.mcpSessionId) {
      headers["mcp-session-id"] = this.mcpSessionId;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    // Capture session ID from response
    const sessionHeader = response.headers.get("mcp-session-id");
    if (sessionHeader) {
      this.mcpSessionId = sessionHeader;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`MCP error (${response.status}): ${text}`);
    }

    const result = await response.json();
    if (result && typeof result === "object" && "error" in result) {
      throw new Error(
        `MCP RPC error: ${JSON.stringify((result as { error: unknown }).error)}`,
      );
    }

    return (result as { result?: unknown }).result;
  }
}
