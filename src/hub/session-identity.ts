/**
 * Session-scoped agent identity registry.
 *
 * Tracks, per MCP session key, every agentId registered via
 * tb.hub.register/quick_join plus the session default (the first
 * registration). Shared between the hub tool handler (which writes
 * registrations) and other namespaces that follow the explicit-agentId
 * convention — currently tb.claims (SPEC-AGX-SUBSTRATE B2) — so one
 * registration grants an identity across all of them.
 */
export class SessionIdentityRegistry {
  private defaults = new Map<string, string | null>();
  private registries = new Map<string, Set<string>>();

  /** All agentIds registered within a session (for multi-agent flows). */
  agents(sessionKey: string): Set<string> {
    let registry = this.registries.get(sessionKey);
    if (!registry) {
      registry = new Set();
      this.registries.set(sessionKey, registry);
    }
    return registry;
  }

  /** The session default agentId (first registration), or null. */
  defaultAgent(sessionKey: string): string | null {
    return this.defaults.get(sessionKey) ?? null;
  }

  /** Record a registration; the first one becomes the session default. */
  register(sessionKey: string, agentId: string): void {
    this.agents(sessionKey).add(agentId);
    if (!this.defaults.get(sessionKey)) {
      this.defaults.set(sessionKey, agentId);
    }
  }

  /**
   * Resolve the acting agentId for a call: an explicit agentId must have
   * been registered in this session; otherwise the session default (which
   * is null before the first registration) is used.
   */
  resolve(sessionKey: string, explicitAgentId?: unknown): string | null {
    if (explicitAgentId && typeof explicitAgentId === 'string') {
      if (!this.agents(sessionKey).has(explicitAgentId)) {
        throw new Error(
          `Agent ${explicitAgentId} not registered in this session. Call register first.`,
        );
      }
      return explicitAgentId;
    }
    return this.defaultAgent(sessionKey);
  }
}
