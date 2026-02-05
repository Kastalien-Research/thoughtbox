/**
 * Thought Query Handler
 *
 * Implements resource templates for querying the thought graph:
 * - thoughtbox://thoughts/{sessionId}/{type} - Filter by thought type
 * - thoughtbox://thoughts/{sessionId}/range/{start}-{end} - Get thought range
 * - thoughtbox://references/{sessionId}/{thoughtNumber} - Find references to a thought
 * - thoughtbox://revisions/{sessionId}/{thoughtNumber} - Get revision history
 *
 * SPEC-001: Resource Templates for Thought Graph Queries
 */

import type { ThoughtboxStorage, ThoughtNode, ThoughtData } from "../persistence/index.js";

export interface QueryResult {
  sessionId: string;
  query: string;
  thoughts: Array<{
    thoughtNumber: number;
    thought: string;
    timestamp: string;
    type?: string;
    isRevision?: boolean;
    branchId?: string | null;
  }>;
  count: number;
}

export class ThoughtQueryHandler {
  constructor(private storage: ThoughtboxStorage) {}

  /**
   * Main entry point - parse URI and route to appropriate query
   */
  async handleQuery(uri: string): Promise<QueryResult> {
    const parsed = this.parseURI(uri);

    switch (parsed.template) {
      case "thoughts-by-type":
        return this.queryByType(parsed.params.sessionId, parsed.params.type);

      case "thought-range":
        return this.getRange(
          parsed.params.sessionId,
          parsed.params.start,
          parsed.params.end
        );

      case "thought-references":
        return this.getReferences(
          parsed.params.sessionId,
          parsed.params.thoughtNumber
        );

      case "revision-history":
        return this.getRevisionHistory(
          parsed.params.sessionId,
          parsed.params.thoughtNumber
        );

      default:
        throw new Error(`Unknown template: ${parsed.template}`);
    }
  }

  /**
   * Query thoughts by type (H/E/C/Q/R/P/O/A/X)
   */
  private async queryByType(sessionId: string, type: string): Promise<QueryResult> {
    // Validate type
    const validTypes = ["H", "E", "C", "Q", "R", "P", "O", "A", "X"];
    if (!validTypes.includes(type)) {
      throw new Error(
        `Invalid type '${type}'. Valid types: ${validTypes.join(", ")}`
      );
    }

    const linkedExport = await this.storage.toLinkedExport(sessionId);
    const typePattern = new RegExp(`^S\\d+\\|${type}\\|`);

    const matchingNodes = linkedExport.nodes.filter((node) =>
      typePattern.test(node.data.thought)
    );

    return {
      sessionId,
      query: `type:${type}`,
      thoughts: matchingNodes.map(this.nodeToThought),
      count: matchingNodes.length,
    };
  }

  /**
   * Get thought range [start, end] inclusive
   */
  private async getRange(
    sessionId: string,
    start: number,
    end: number
  ): Promise<QueryResult> {
    if (start < 1 || end < start) {
      throw new Error(`Invalid range: ${start}-${end}. Start must be >= 1 and end >= start`);
    }

    const linkedExport = await this.storage.toLinkedExport(sessionId);

    const rangeNodes = linkedExport.nodes.filter(
      (node) =>
        node.data.thoughtNumber >= start && node.data.thoughtNumber <= end
    );

    return {
      sessionId,
      query: `range:${start}-${end}`,
      thoughts: rangeNodes.map(this.nodeToThought),
      count: rangeNodes.length,
    };
  }

  /**
   * Find all thoughts that reference a specific thought number
   */
  private async getReferences(
    sessionId: string,
    thoughtNumber: number
  ): Promise<QueryResult> {
    const linkedExport = await this.storage.toLinkedExport(sessionId);

    // Parse cipher references: [SN], SN-SN patterns, or S1,S2 in refs field
    const refPatterns = [
      new RegExp(`\\[S${thoughtNumber}\\]`), // [S42]
      new RegExp(`S\\d+-S${thoughtNumber}\\b`), // S10-S42
      new RegExp(`S${thoughtNumber}-S\\d+\\b`), // S42-S50
      new RegExp(`\\bS${thoughtNumber}\\b`), // S42 (standalone)
    ];

    const referencingNodes = linkedExport.nodes.filter((node) =>
      refPatterns.some((pattern) => pattern.test(node.data.thought))
    );

    return {
      sessionId,
      query: `references:S${thoughtNumber}`,
      thoughts: referencingNodes.map(this.nodeToThought),
      count: referencingNodes.length,
    };
  }

  /**
   * Get complete revision history for a thought
   */
  private async getRevisionHistory(
    sessionId: string,
    thoughtNumber: number
  ): Promise<QueryResult> {
    const linkedExport = await this.storage.toLinkedExport(sessionId);

    // Find original thought
    const original = linkedExport.nodes.find(
      (n) => n.data.thoughtNumber === thoughtNumber
    );

    if (!original) {
      throw new Error(
        `Thought ${thoughtNumber} not found in session ${sessionId}`
      );
    }

    const revisions: ThoughtNode[] = [original];

    // Find all revisions of this thought
    // Revisions have revisesNode pointing to what they revise
    // Need to find nodes where revisesNode === original.id
    for (const node of linkedExport.nodes) {
      if (node.revisesNode === original.id) {
        revisions.push(node);
      }
    }

    // Sort by timestamp
    revisions.sort(
      (a, b) =>
        new Date(a.data.timestamp).getTime() -
        new Date(b.data.timestamp).getTime()
    );

    return {
      sessionId,
      query: `revisions:S${thoughtNumber}`,
      thoughts: revisions.map(this.nodeToThought),
      count: revisions.length,
    };
  }

  /**
   * Parse resource template URI
   */
  private parseURI(uri: string): {
    template: string;
    params: Record<string, any>;
  } {
    const patterns: Record<string, RegExp> = {
      "thoughts-by-type": /^thoughtbox:\/\/thoughts\/([^\/]+)\/([HECQRPOAX])$/,
      "thought-range": /^thoughtbox:\/\/thoughts\/([^\/]+)\/range\/(\d+)-(\d+)$/,
      "thought-references": /^thoughtbox:\/\/references\/([^\/]+)\/(\d+)$/,
      "revision-history": /^thoughtbox:\/\/revisions\/([^\/]+)\/(\d+)$/,
    };

    for (const [template, pattern] of Object.entries(patterns)) {
      const match = uri.match(pattern);
      if (match) {
        return {
          template,
          params: this.extractParams(template, match),
        };
      }
    }

    throw new Error(`No template matches URI: ${uri}`);
  }

  /**
   * Extract parameters from regex match based on template type
   */
  private extractParams(
    template: string,
    match: RegExpMatchArray
  ): Record<string, any> {
    switch (template) {
      case "thoughts-by-type":
        return {
          sessionId: match[1],
          type: match[2],
        };

      case "thought-range":
        return {
          sessionId: match[1],
          start: parseInt(match[2]),
          end: parseInt(match[3]),
        };

      case "thought-references":
      case "revision-history":
        return {
          sessionId: match[1],
          thoughtNumber: parseInt(match[2]),
        };

      default:
        throw new Error(`Unknown template: ${template}`);
    }
  }

  /**
   * Convert ThoughtNode to simplified thought data
   */
  private nodeToThought(node: ThoughtNode): {
    thoughtNumber: number;
    thought: string;
    timestamp: string;
    type?: string;
    isRevision: boolean;
    branchId?: string | null;
  } {
    return {
      thoughtNumber: node.data.thoughtNumber,
      thought: node.data.thought,
      timestamp: node.data.timestamp,
      type: this.extractType(node.data.thought),
      isRevision: node.data.isRevision || false,
      branchId: node.branchId || null,
    };
  }

  /**
   * Extract thought type from cipher notation
   */
  private extractType(thought: string): string | undefined {
    const match = thought.match(/^S\d+\|([HECQRPOAX])\|/);
    return match ? match[1] : undefined;
  }
}
