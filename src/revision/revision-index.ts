/**
 * Revision Index Builder
 *
 * Builds revision metadata and reverse indexes for thought nodes.
 * Implements SPEC-002: Revision Chain Exposure and Visualization
 *
 * Design Decision D1: Flat chronological revision chains
 * Design Decision D2: Separate chains for separate thoughts
 */

import type { ThoughtNode, RevisionMetadata } from "../persistence/types.js";

export class RevisionIndexBuilder {
  /**
   * Build revision metadata for all nodes in a session
   * Returns a map of thoughtNumber -> RevisionMetadata
   */
  buildIndex(nodes: ThoughtNode[]): Map<number, RevisionMetadata> {
    const index = new Map<number, RevisionMetadata>();

    // Pass 1: Initialize metadata for each thought
    for (const node of nodes) {
      const isRevision = !!node.revisesNode;
      const revisesThought = this.extractRevisesThought(node);

      const metadata: RevisionMetadata = {
        isOriginal: !isRevision,
        isRevision,
        revisesThought,
        revisedBy: [],
        revisionDepth: 0,
        revisionChainId: this.generateChainId(node, revisesThought),
      };

      index.set(node.data.thoughtNumber, metadata);
    }

    // Pass 2: Build reverse pointers (revisedBy arrays)
    for (const [thoughtNum, metadata] of index.entries()) {
      if (metadata.revisesThought !== null) {
        const original = index.get(metadata.revisesThought);
        if (original) {
          original.revisedBy.push(thoughtNum);
        }
      }
    }

    // Pass 3: Calculate revision depths
    for (const [thoughtNum, _metadata] of index.entries()) {
      // Use recursive helper, memoization happens via the index
      this.calculateDepth(thoughtNum, index, new Set());
    }

    return index;
  }

  /**
   * Extract which thought this node revises (from revisesNode or data)
   */
  private extractRevisesThought(node: ThoughtNode): number | null {
    if (!node.revisesNode) return null;

    // Parse thought number from revisesNode ID format "{sessionId}:{thoughtNumber}"
    const parts = node.revisesNode.split(":");
    if (parts.length !== 2) return null;

    const thoughtNum = parseInt(parts[1]);
    return isNaN(thoughtNum) ? null : thoughtNum;
  }

  /**
   * Generate unique chain ID for grouping related revisions
   * All revisions of S1 get same chainId
   */
  private generateChainId(
    node: ThoughtNode,
    revisesThought: number | null
  ): string {
    // If this revises something, use that thought's number as chain root
    // Otherwise, this IS the root
    const rootThought = revisesThought ?? node.data.thoughtNumber;
    return `chain-${node.id.split(":")[0]}-${rootThought}`;
  }

  /**
   * Calculate revision depth recursively
   * Uses memoization via the index itself
   */
  private calculateDepth(
    thoughtNum: number,
    index: Map<number, RevisionMetadata>,
    visiting: Set<number>
  ): number {
    const metadata = index.get(thoughtNum);
    if (!metadata) return 0;

    // Already calculated
    if (metadata.revisionDepth > 0) return metadata.revisionDepth;

    // Not a revision - depth is 0
    if (!metadata.revisesThought) {
      metadata.revisionDepth = 0;
      return 0;
    }

    // Cycle detection
    if (visiting.has(thoughtNum)) {
      throw new Error(
        `Circular revision detected: thought ${thoughtNum} is part of a revision cycle`
      );
    }

    visiting.add(thoughtNum);

    // Recursive case: depth = 1 + parent's depth
    const parentDepth = this.calculateDepth(
      metadata.revisesThought,
      index,
      visiting
    );

    metadata.revisionDepth = 1 + parentDepth;
    visiting.delete(thoughtNum);

    return metadata.revisionDepth;
  }

  /**
   * Get flat chronological revision chain for a thought
   * Follows design decision D1: flat list, not hierarchical
   */
  getRevisionChain(
    thoughtNumber: number,
    nodes: ThoughtNode[],
    index: Map<number, RevisionMetadata>
  ): ThoughtNode[] {
    const metadata = index.get(thoughtNumber);
    if (!metadata) return [];

    // Collect all nodes in this revision chain
    const chain: ThoughtNode[] = [];

    // Find the original (root) of this chain
    let current = thoughtNumber;
    while (true) {
      const meta = index.get(current);
      if (!meta || !meta.revisesThought) break;
      current = meta.revisesThought;
    }

    // Now current is the original thought
    // Collect it and all its revisions
    const chainRoot = current;
    const rootNode = nodes.find((n) => n.data.thoughtNumber === chainRoot);
    if (rootNode) chain.push(rootNode);

    // Add all revisions
    const rootMeta = index.get(chainRoot);
    if (rootMeta) {
      for (const revThoughtNum of rootMeta.revisedBy) {
        const revNode = nodes.find((n) => n.data.thoughtNumber === revThoughtNum);
        if (revNode) chain.push(revNode);
      }
    }

    // Sort chronologically (design decision D1)
    chain.sort(
      (a, b) =>
        new Date(a.data.timestamp).getTime() -
        new Date(b.data.timestamp).getTime()
    );

    return chain;
  }
}
