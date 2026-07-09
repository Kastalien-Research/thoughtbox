/**
 * Thought graph queries (folded from the SPEC-001 resource templates).
 *
 * Formerly served as four resource templates
 * (thoughtbox://thoughts/{sessionId}/{type}, .../range/{start}-{end},
 * thoughtbox://references/..., thoughtbox://revisions/...); now exposed as
 * the session_query_thoughts operation on tb.session.
 */

import type {
  ThoughtboxStorage,
  ThoughtNode,
} from "../persistence/index.js";

export interface ThoughtQueryResult {
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

export interface ThoughtQueryArgs {
  sessionId: string;
  /** Cipher char (H/E/C/Q/R/P/O/A/X) or full thoughtType name */
  type?: string;
  /** Range query: inclusive start (requires end) */
  start?: number;
  /** Range query: inclusive end (requires start) */
  end?: number;
  /** Find thoughts whose text references S{n} */
  referencesThought?: number;
  /** Revision history for thought n (original + its revisions) */
  revisionsOf?: number;
}

export class ThoughtQuery {
  constructor(private storage: ThoughtboxStorage) {}

  async query(args: ThoughtQueryArgs): Promise<ThoughtQueryResult> {
    const { sessionId } = args;
    if (!sessionId) throw new Error("session_query_thoughts requires sessionId");

    const modes = [
      args.type !== undefined,
      args.start !== undefined || args.end !== undefined,
      args.referencesThought !== undefined,
      args.revisionsOf !== undefined,
    ].filter(Boolean).length;
    if (modes !== 1) {
      throw new Error(
        "session_query_thoughts requires exactly one of: type, start+end, referencesThought, revisionsOf"
      );
    }

    if (args.type !== undefined) return this.queryByType(sessionId, args.type);
    if (args.referencesThought !== undefined) {
      return this.getReferences(sessionId, args.referencesThought);
    }
    if (args.revisionsOf !== undefined) {
      return this.getRevisionHistory(sessionId, args.revisionsOf);
    }
    if (args.start === undefined || args.end === undefined) {
      throw new Error("Range query requires both start and end");
    }
    return this.getRange(sessionId, args.start, args.end);
  }

  /**
   * Query thoughts by type.
   * Accepts cipher chars (H/E/C/Q/R/P/O/A/X) or full thoughtType names
   * (reasoning, decision_frame, action_report, belief_snapshot,
   *  assumption_update, context_snapshot, progress, action_receipt,
   *  finding, synthesis, question, conclusion).
   */
  private async queryByType(sessionId: string, type: string): Promise<ThoughtQueryResult> {
    const isCipherChar = type.length === 1 && /^[HECQRPOAX]$/.test(type);
    const linkedExport = await this.storage.toLinkedExport(sessionId);

    // When the caller supplies a full type name, match only on thoughtType
    // to avoid cipher collisions (action_report and assumption_update both
    // map to "A"). When a cipher char is supplied, match on cipher prefix.
    const cipherPattern = isCipherChar
      ? new RegExp(`^S\\d+\\|${type}\\|`)
      : null;

    const matchingNodes = linkedExport.nodes.filter((node) => {
      if (cipherPattern && cipherPattern.test(node.data.thought)) return true;
      if (!isCipherChar && node.data.thoughtType === type) return true;
      return false;
    });

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
  ): Promise<ThoughtQueryResult> {
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
  ): Promise<ThoughtQueryResult> {
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
  ): Promise<ThoughtQueryResult> {
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
   * Convert ThoughtNode to simplified thought data.
   * Arrow function to preserve `this` when used as .map() callback.
   */
  private nodeToThought = (node: ThoughtNode): {
    thoughtNumber: number;
    thought: string;
    timestamp: string;
    type?: string;
    isRevision: boolean;
    branchId?: string | null;
  } => ({
    thoughtNumber: node.data.thoughtNumber,
    thought: node.data.thought,
    timestamp: node.data.timestamp,
    type: this.extractType(node.data.thought),
    isRevision: node.data.isRevision || false,
    branchId: node.branchId || null,
  });

  /**
   * Extract thought type from cipher notation
   */
  private extractType(thought: string): string | undefined {
    const match = thought.match(/^S\d+\|([HECQRPOAX])\|/);
    return match ? match[1] : undefined;
  }
}
