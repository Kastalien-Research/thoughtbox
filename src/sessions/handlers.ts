/**
 * Session Handlers
 *
 * Handler functions for each session operation.
 */

import {
  type ThoughtboxStorage,
  type Session,
  type SessionFilter,
  type ThoughtData,
  type SessionAnalysis,
  type ExtractedLearning,
} from "../persistence/index.js";
import { ThoughtHandler } from "../thought-handler.js";
import type { DiscoveryRegistry } from "../discovery-registry.js";

export interface SessionHandlerDeps {
  storage: ThoughtboxStorage;
  thoughtHandler: ThoughtHandler;
  discoveryRegistry?: DiscoveryRegistry;
}

export class SessionHandlers {
  private storage: ThoughtboxStorage;
  private thoughtHandler: ThoughtHandler;
  private discoveryRegistry: DiscoveryRegistry | null;

  constructor(deps: SessionHandlerDeps) {
    this.storage = deps.storage;
    this.thoughtHandler = deps.thoughtHandler;
    this.discoveryRegistry = deps.discoveryRegistry || null;
  }

  /**
   * List sessions with optional filtering
   */
  async handleList(args: {
    limit?: number;
    offset?: number;
    tags?: string[];
  }): Promise<{
    sessions: Session[];
    count: number;
    hasMore: boolean;
  }> {
    const limit = args.limit ?? 10;
    const offset = args.offset ?? 0;

    // Fetch one extra to detect hasMore
    const filter: SessionFilter = {
      limit: limit + 1,
      offset,
      tags: args.tags,
    };

    const sessions = await this.storage.listSessions(filter);
    const hasMore = sessions.length > limit;
    const returnSessions = hasMore ? sessions.slice(0, limit) : sessions;

    return {
      sessions: returnSessions,
      count: returnSessions.length,
      hasMore,
    };
  }

  /**
   * Get full session details including all thoughts
   */
  async handleGet(args: { sessionId: string }): Promise<{
    session: Session;
    thoughts: ThoughtData[];
    branches: Record<string, ThoughtData[]>;
  }> {
    const session = await this.storage.getSession(args.sessionId);
    if (!session) {
      throw new Error(`Session ${args.sessionId} not found`);
    }

    const thoughts = await this.storage.getThoughts(args.sessionId);

    // Group thoughts by branch
    const branches: Record<string, ThoughtData[]> = {};
    const mainThoughts: ThoughtData[] = [];

    for (const thought of thoughts) {
      if (thought.branchId) {
        if (!branches[thought.branchId]) {
          branches[thought.branchId] = [];
        }
        branches[thought.branchId].push(thought);
      } else {
        mainThoughts.push(thought);
      }
    }

    // Update lastAccessedAt
    try {
      await this.storage.updateSession(args.sessionId, {
        lastAccessedAt: new Date(),
      });
    } catch {
      // Non-critical, ignore errors
    }

    return {
      session,
      thoughts: mainThoughts,
      branches,
    };
  }

  /**
   * Search sessions by query
   */
  async handleSearch(args: {
    query: string;
    limit?: number;
  }): Promise<{
    sessions: Session[];
    count: number;
    query: string;
  }> {
    const sessions = await this.storage.listSessions({
      search: args.query,
      limit: args.limit ?? 10,
    });

    return {
      sessions,
      count: sessions.length,
      query: args.query,
    };
  }

  /**
   * Resume a session - loads it into ThoughtHandler for continuation
   */
  async handleResume(args: { sessionId: string }): Promise<{
    success: boolean;
    sessionId: string;
    session: Session;
    thoughtCount: number;
    lastThought: ThoughtData | null;
    message: string;
  }> {
    // Load session into ThoughtHandler
    await this.thoughtHandler.loadSession(args.sessionId);

    // Get session details for response
    const session = await this.storage.getSession(args.sessionId);
    if (!session) {
      throw new Error(`Session ${args.sessionId} not found`);
    }

    const thoughts = await this.storage.getThoughts(args.sessionId);
    const lastThought = thoughts.length > 0 ? thoughts[thoughts.length - 1] : null;

    return {
      success: true,
      sessionId: args.sessionId,
      session,
      thoughtCount: thoughts.length,
      lastThought,
      message: `Session resumed. Continue reasoning from thought ${thoughts.length + 1}. Use thoughtbox tool with thoughtNumber: ${thoughts.length + 1} to continue.`,
    };
  }

  /**
   * Export a session to various formats
   */
  async handleExport(args: {
    sessionId: string;
    format?: "markdown" | "cipher" | "json";
    includeMetadata?: boolean;
  }): Promise<{
    sessionId: string;
    format: string;
    content: string;
  }> {
    const format = args.format ?? "markdown";
    const includeMetadata = args.includeMetadata ?? true;

    const session = await this.storage.getSession(args.sessionId);
    if (!session) {
      throw new Error(`Session ${args.sessionId} not found`);
    }

    const thoughts = await this.storage.getThoughts(args.sessionId);

    let content: string;

    switch (format) {
      case "json":
        content = JSON.stringify({ session, thoughts }, null, 2);
        break;

      case "cipher":
        content = this.exportAsCipher(session, thoughts, includeMetadata);
        break;

      case "markdown":
      default:
        content = this.exportAsMarkdown(session, thoughts, includeMetadata);
        break;
    }

    return {
      sessionId: args.sessionId,
      format,
      content,
    };
  }

  /**
   * Export session as readable markdown
   */
  private exportAsMarkdown(
    session: Session,
    thoughts: ThoughtData[],
    includeMetadata: boolean
  ): string {
    const lines: string[] = [];

    if (includeMetadata) {
      lines.push(`# ${session.title}`);
      lines.push("");
      if (session.tags && session.tags.length > 0) {
        lines.push(`**Tags:** ${session.tags.join(", ")}`);
      }
      lines.push(`**Created:** ${session.createdAt}`);
      lines.push(`**Thoughts:** ${thoughts.length}`);
      lines.push("");
      lines.push("---");
      lines.push("");
    }

    // Group by branch
    const mainThoughts = thoughts.filter((t) => !t.branchId);
    const branchMap: Record<string, ThoughtData[]> = {};

    for (const t of thoughts) {
      if (t.branchId) {
        if (!branchMap[t.branchId]) {
          branchMap[t.branchId] = [];
        }
        branchMap[t.branchId].push(t);
      }
    }

    // Main thoughts
    lines.push("## Main Thread");
    lines.push("");
    for (const t of mainThoughts) {
      const prefix = t.isRevision ? `[R${t.revisesThought}]` : "";
      lines.push(`### Thought ${t.thoughtNumber}/${t.totalThoughts} ${prefix}`);
      lines.push("");
      lines.push(t.thought);
      lines.push("");
    }

    // Branches
    for (const [branchId, branchThoughts] of Object.entries(branchMap)) {
      lines.push(`## Branch: ${branchId}`);
      lines.push("");
      for (const t of branchThoughts) {
        lines.push(`### Thought ${t.thoughtNumber}/${t.totalThoughts}`);
        lines.push("");
        lines.push(t.thought);
        lines.push("");
      }
    }

    return lines.join("\n");
  }

  /**
   * Export session using cipher notation for compression
   */
  private exportAsCipher(
    session: Session,
    thoughts: ThoughtData[],
    includeMetadata: boolean
  ): string {
    const lines: string[] = [];

    if (includeMetadata) {
      lines.push(`# ${session.title}`);
      lines.push(`T:${session.tags?.join(",") || ""} N:${thoughts.length}`);
      lines.push("");
    }

    // Use cipher-style compression
    // H = Hypothesis, E = Evidence, C = Conclusion, Q = Question
    // R = Revision, B = Branch, P = Progress, X = Synthesis

    for (const t of thoughts) {
      const num = `[${t.thoughtNumber}/${t.totalThoughts}]`;
      const branch = t.branchId ? `B:${t.branchId}` : "";
      const revision = t.isRevision ? `R${t.revisesThought}` : "";
      const prefix = [num, branch, revision].filter(Boolean).join(" ");

      // Compress thought - first 200 chars with key marker if detectable
      const compressed = this.compressThought(t.thought);
      lines.push(`${prefix} ${compressed}`);
    }

    return lines.join("\n");
  }

  /**
   * Compress a thought using cipher-style notation
   */
  private compressThought(thought: string): string {
    // Detect thought type from content
    const lower = thought.toLowerCase();
    let marker = "";

    if (lower.includes("hypothesis") || lower.includes("assume")) {
      marker = "H:";
    } else if (lower.includes("evidence") || lower.includes("found") || lower.includes("observed")) {
      marker = "E:";
    } else if (lower.includes("conclusion") || lower.includes("therefore") || lower.includes("thus")) {
      marker = "C:";
    } else if (lower.includes("question") || lower.includes("?")) {
      marker = "Q:";
    } else if (lower.includes("synthesis") || lower.includes("combining")) {
      marker = "X:";
    }

    // Take first 150 chars, clean up
    const truncated = thought.substring(0, 150).replace(/\n/g, " ").trim();
    const suffix = thought.length > 150 ? "..." : "";

    return `${marker}${truncated}${suffix}`;
  }

  /**
   * Analyze session structure and quality metrics
   */
  async handleAnalyze(args: { sessionId: string }): Promise<SessionAnalysis> {
    const session = await this.storage.getSession(args.sessionId);
    if (!session) {
      throw new Error(`Session ${args.sessionId} not found`);
    }

    const thoughts = await this.storage.getThoughts(args.sessionId);

    if (thoughts.length === 0) {
      return {
        sessionId: args.sessionId,
        metadata: {
          title: session.title,
          tags: session.tags,
          thoughtCount: 0,
          branchCount: session.branchCount,
          revisionCount: 0,
          duration: 0,
          createdAt: session.createdAt.toISOString(),
          lastUpdatedAt: session.updatedAt.toISOString(),
        },
        structure: {
          linearityScore: 1,
          revisionRate: 0,
          maxDepth: 0,
          thoughtDensity: 0,
        },
        quality: {
          critiqueRequests: 0,
          hasConvergence: false,
          isComplete: false,
        },
      };
    }

    // Compute objective metrics
    const revisionCount = thoughts.filter((t) => t.isRevision).length;
    const branchThoughts = thoughts.filter((t) => t.branchFromThought);

    // Duration: first to last thought
    const timestamps = thoughts
      .map((t) => new Date(t.timestamp).getTime())
      .filter((t) => !isNaN(t));
    const duration = timestamps.length > 1
      ? Math.max(...timestamps) - Math.min(...timestamps)
      : 0;

    // Linearity: 1 if no branches/revisions, decreases with complexity
    const complexityFactors = revisionCount + branchThoughts.length;
    const linearityScore = Math.max(0, 1 - (complexityFactors / thoughts.length));

    // Revision rate
    const revisionRate = thoughts.length > 0 ? revisionCount / thoughts.length : 0;

    // Max depth: count distinct branch IDs
    const branchIds = new Set(thoughts.filter((t) => t.branchId).map((t) => t.branchId));
    const maxDepth = branchIds.size;

    // Thought density: thoughts per minute
    const durationMinutes = duration / 60000;
    const thoughtDensity = durationMinutes > 0 ? thoughts.length / durationMinutes : 0;

    // Quality indicators
    // Note: local ThoughtData doesn't have a 'critique' field, so we set this to 0
    const critiqueRequests = 0;
    const lastThought = thoughts[thoughts.length - 1];

    // True convergence: main-chain thoughts exist AFTER branch thoughts
    let lastBranchIndex = -1;
    for (let i = thoughts.length - 1; i >= 0; i--) {
      if (thoughts[i].branchId) {
        lastBranchIndex = i;
        break;
      }
    }
    const hasMainAfterBranch = lastBranchIndex >= 0 &&
      thoughts.slice(lastBranchIndex + 1).some((t) => !t.branchId);
    const hasConvergence = hasMainAfterBranch;
    const isComplete = !lastThought.nextThoughtNeeded;

    return {
      sessionId: args.sessionId,
      metadata: {
        title: session.title,
        tags: session.tags,
        thoughtCount: thoughts.length,
        branchCount: session.branchCount,
        revisionCount,
        duration,
        createdAt: session.createdAt.toISOString(),
        lastUpdatedAt: session.updatedAt.toISOString(),
      },
      structure: {
        linearityScore: Math.round(linearityScore * 100) / 100,
        revisionRate: Math.round(revisionRate * 100) / 100,
        maxDepth,
        thoughtDensity: Math.round(thoughtDensity * 100) / 100,
      },
      quality: {
        critiqueRequests,
        hasConvergence,
        isComplete,
      },
    };
  }

  /**
   * Extract learnings from a session for DGM evolution
   */
  async handleExtractLearnings(args: {
    sessionId: string;
    keyMoments?: Array<{ thoughtNumber: number; type: string; significance?: number; summary?: string }>;
    targetTypes?: Array<'pattern' | 'anti-pattern' | 'signal'>;
  }): Promise<{
    sessionId: string;
    extractedCount: number;
    note?: string;
    learnings: ExtractedLearning[];
  }> {
    const keyMoments = args.keyMoments ?? [];
    const targetTypes = args.targetTypes ?? ['signal'];

    const analysis = await this.handleAnalyze({ sessionId: args.sessionId });
    const thoughts = await this.storage.getThoughts(args.sessionId);

    const learnings: ExtractedLearning[] = [];
    const now = new Date().toISOString();

    // Extract patterns from client-identified key moments
    if (targetTypes.includes('pattern')) {
      const patternMoments = keyMoments.filter(
        (m) => m.type === 'decision' || m.type === 'insight' || m.type === 'pivot'
      );

      for (const moment of patternMoments.slice(0, 5)) {
        const thought = thoughts.find((t) => t.thoughtNumber === moment.thoughtNumber);
        if (!thought) continue;

        learnings.push({
          type: 'pattern',
          content: `### ${analysis.metadata.title}: Thought ${moment.thoughtNumber}

- **Context**: ${moment.type} in reasoning session
- **Significance**: ${moment.significance ?? 'unrated'}/10
- **Pattern**: ${thought.thought.substring(0, 500)}
- **Summary**: ${moment.summary ?? 'No summary provided'}
- **Source**: Session ${analysis.sessionId}
- **BCs**: specificity=5, applicability=5, complexity=3, maturity=1
`,
          targetPath: `.claude/rules/evolution/experiments/${analysis.sessionId.substring(0, 8)}-thought-${moment.thoughtNumber}.md`,
          metadata: {
            sourceSession: analysis.sessionId,
            sourceThoughts: [moment.thoughtNumber],
            extractedAt: now,
            behaviorCharacteristics: {
              specificity: 5,
              applicability: 5,
              complexity: 3,
              maturity: 1,
            },
          },
        });
      }
    }

    // Extract anti-patterns from revisions
    if (targetTypes.includes('anti-pattern')) {
      const revisions = keyMoments.filter((m) => m.type === 'revision');

      for (const revision of revisions.slice(0, 3)) {
        const thought = thoughts.find((t) => t.thoughtNumber === revision.thoughtNumber);
        if (!thought) continue;

        learnings.push({
          type: 'anti-pattern',
          content: `### Anti-Pattern: Revision in ${analysis.metadata.title}

- **Original thought**: ${thought.revisesThought}
- **What changed**: ${thought.thought.substring(0, 300)}
- **Summary**: ${revision.summary ?? 'No summary provided'}
- **Lesson**: Initial reasoning was incorrect/incomplete
- **Source**: Session ${analysis.sessionId}
`,
          targetPath: `.claude/rules/evolution/experiments/anti-${analysis.sessionId.substring(0, 8)}-thought-${thought.revisesThought}.md`,
          metadata: {
            sourceSession: analysis.sessionId,
            sourceThoughts: [revision.thoughtNumber, thought.revisesThought || 0],
            extractedAt: now,
          },
        });
      }
    }

    // Generate objective fitness signal
    if (targetTypes.includes('signal')) {
      const signal = {
        timestamp: now,
        session: analysis.sessionId,
        signal: analysis.quality.isComplete ? 'success' : 'incomplete',
        metrics: {
          thoughts: analysis.metadata.thoughtCount,
          branches: analysis.metadata.branchCount,
          revisions: analysis.metadata.revisionCount,
          duration: analysis.metadata.duration,
          linearityScore: analysis.structure.linearityScore,
          critiqueUsage: analysis.quality.critiqueRequests,
        },
      };

      learnings.push({
        type: 'signal',
        content: JSON.stringify(signal),
        targetPath: `.claude/rules/evolution/signals.jsonl`,
        metadata: {
          sourceSession: analysis.sessionId,
          sourceThoughts: [],
          extractedAt: now,
        },
      });
    }

    return {
      sessionId: args.sessionId,
      extractedCount: learnings.length,
      note: keyMoments.length === 0 && targetTypes.includes('pattern')
        ? "No patterns extracted. Provide keyMoments to extract patterns."
        : undefined,
      learnings,
    };
  }

  /**
   * Manage discovered tools (SPEC-009)
   */
  async handleDiscovery(args: {
    action: 'list' | 'hide' | 'show';
    toolName?: string;
  }): Promise<{
    action: string;
    success: boolean;
    message: string;
    discoveredTools?: string[];
    allDiscoverableTools?: string[];
  }> {
    if (!this.discoveryRegistry) {
      return {
        action: args.action,
        success: false,
        message: "Discovery registry not available. Tool discovery is not enabled.",
      };
    }

    switch (args.action) {
      case 'list': {
        const discovered = this.discoveryRegistry.getDiscoveredTools();
        const allDiscoverable = this.discoveryRegistry.getAllDiscoverableTools();
        return {
          action: 'list',
          success: true,
          message: discovered.length > 0
            ? `${discovered.length} tools currently discovered.`
            : "No tools currently discovered. Call hub tool operations (like session.analyze) to unlock specialized tools.",
          discoveredTools: discovered,
          allDiscoverableTools: allDiscoverable,
        };
      }

      case 'hide': {
        if (!args.toolName) {
          return {
            action: 'hide',
            success: false,
            message: "toolName is required for hide action",
          };
        }
        const hidden = this.discoveryRegistry.hideTool(args.toolName);
        return {
          action: 'hide',
          success: hidden,
          message: hidden
            ? `Tool '${args.toolName}' has been hidden. It will no longer appear in tool listings.`
            : `Failed to hide '${args.toolName}'. It may not be discovered or doesn't exist.`,
          discoveredTools: this.discoveryRegistry.getDiscoveredTools(),
        };
      }

      case 'show': {
        if (!args.toolName) {
          return {
            action: 'show',
            success: false,
            message: "toolName is required for show action",
          };
        }
        const shown = this.discoveryRegistry.showTool(args.toolName);
        return {
          action: 'show',
          success: shown,
          message: shown
            ? `Tool '${args.toolName}' has been re-enabled and is now visible.`
            : `Failed to show '${args.toolName}'. It may already be visible, not exist, or require a stage that isn't active.`,
          discoveredTools: this.discoveryRegistry.getDiscoveredTools(),
        };
      }

      default:
        return {
          action: args.action,
          success: false,
          message: `Unknown action: ${args.action}. Use 'list', 'hide', or 'show'.`,
        };
    }
  }
}
