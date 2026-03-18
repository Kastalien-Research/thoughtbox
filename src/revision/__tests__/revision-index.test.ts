import { describe, it, expect } from 'vitest';
import { RevisionIndexBuilder } from '../revision-index.js';
import type { ThoughtNode } from '../../persistence/types.js';

function makeNode(id: string, thoughtNumber: number, revisesNode: string | null = null, timestamp: string = new Date().toISOString()): ThoughtNode {
  return {
    id,
    data: {
      thought: `Thought ${thoughtNumber}`,
      thoughtNumber,
      totalThoughts: 10,
      nextThoughtNeeded: true,
      timestamp,
      thoughtType: 'reasoning',
    },
    prev: null,
    next: [],
    revisesNode,
    branchOrigin: null,
    branchId: null,
  };
}

describe('RevisionIndexBuilder', () => {
  const builder = new RevisionIndexBuilder();

  describe('buildIndex', () => {
    it('initializes metadata for original thoughts', () => {
      const nodes = [makeNode('session:1', 1)];
      const index = builder.buildIndex(nodes);

      const meta = index.get(1);
      expect(meta).toBeDefined();
      expect(meta?.isOriginal).toBe(true);
      expect(meta?.isRevision).toBe(false);
      expect(meta?.revisesThought).toBeNull();
      expect(meta?.revisionDepth).toBe(0);
      expect(meta?.revisionChainId).toBe('chain-session-1');
    });

    it('identifies revisions and extracts revisesThought', () => {
      const nodes = [
        makeNode('session:1', 1),
        makeNode('session:2', 2, 'session:1'),
      ];
      const index = builder.buildIndex(nodes);

      const meta2 = index.get(2);
      expect(meta2?.isOriginal).toBe(false);
      expect(meta2?.isRevision).toBe(true);
      expect(meta2?.revisesThought).toBe(1);
    });

    it('builds reverse pointers in revisedBy', () => {
      const nodes = [
        makeNode('session:1', 1),
        makeNode('session:2', 2, 'session:1'),
        makeNode('session:3', 3, 'session:1'),
      ];
      const index = builder.buildIndex(nodes);

      const meta1 = index.get(1);
      expect(meta1?.revisedBy).toEqual([2, 3]);
    });

    it('calculates revision depth correctly for nested revisions', () => {
      const nodes = [
        makeNode('session:1', 1),
        makeNode('session:2', 2, 'session:1'),
        makeNode('session:3', 3, 'session:2'),
      ];
      const index = builder.buildIndex(nodes);

      expect(index.get(1)?.revisionDepth).toBe(0);
      expect(index.get(2)?.revisionDepth).toBe(1);
      expect(index.get(3)?.revisionDepth).toBe(2);
    });

    it('generates chain IDs based on direct parent for nested revisions', () => {
       const nodes = [
        makeNode('session:1', 1),
        makeNode('session:2', 2, 'session:1'),
        makeNode('session:3', 3, 'session:2'),
      ];
      const index = builder.buildIndex(nodes);

      expect(index.get(1)?.revisionChainId).toBe('chain-session-1');
      expect(index.get(2)?.revisionChainId).toBe('chain-session-1');
      // S3 revises S2, so chainId uses S2's thought number
      expect(index.get(3)?.revisionChainId).toBe('chain-session-2');
    });

    it('throws error on circular revisions', () => {
      const nodes = [
        makeNode('session:1', 1, 'session:2'),
        makeNode('session:2', 2, 'session:1'),
      ];
      expect(() => builder.buildIndex(nodes)).toThrow(/Circular revision detected/);
    });
  });

  describe('getRevisionChain', () => {
    it('returns the partial chain based on direct revisions', () => {
      const t1 = '2023-01-01T00:00:00Z';
      const t2 = '2023-01-01T01:00:00Z';
      const t3 = '2023-01-01T02:00:00Z';

      const n1 = makeNode('s:1', 1, null, t1);
      const n2 = makeNode('s:2', 2, 's:1', t2);
      const n3 = makeNode('s:3', 3, 's:2', t3);

      const nodes = [n1, n2, n3];
      const index = builder.buildIndex(nodes);

      // S1 is revised by S2. S2 is revised by S3.
      // revisedBy for S1 is [2]
      // revisedBy for S2 is [3]

      const chainFrom1 = builder.getRevisionChain(1, nodes, index);
      expect(chainFrom1).toHaveLength(2); // S1 and S2
      expect(chainFrom1[0].data.thoughtNumber).toBe(1);
      expect(chainFrom1[1].data.thoughtNumber).toBe(2);

      // S2 is a revision of S1, so S1 is the root.
      // S3 is a revision of S2, BUT the current implementation (getRevisionChain)
      // finds the absolute root (S1) and then only adds DIRECT revisions of that root.
      // rootMeta.revisedBy for S1 is [2]. S3 is NOT in S1's revisedBy.

      const chainFrom2 = builder.getRevisionChain(2, nodes, index);
      expect(chainFrom2).toHaveLength(2); // S1 and S2
      expect(chainFrom2[0].data.thoughtNumber).toBe(1);
      expect(chainFrom2[1].data.thoughtNumber).toBe(2);
    });

    it('sorts the chain chronologically', () => {
       const t1 = '2023-01-01T00:00:00Z';
      const t2 = '2023-01-01T01:00:00Z';

      const n1 = makeNode('s:1', 1, null, t1);
      const n2 = makeNode('s:2', 2, 's:1', t2);

      // Even if nodes are passed out of order
      const nodes = [n2, n1];
      const index = builder.buildIndex(nodes);

      const chain = builder.getRevisionChain(1, nodes, index);
      expect(chain[0].data.thoughtNumber).toBe(1);
      expect(chain[1].data.thoughtNumber).toBe(2);
    });
  });
});
