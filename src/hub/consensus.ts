/**
 * Consensus Module — Consensus marking and endorsement
 *
 * ADR-002 Section 2.2: Consensus Operations
 */

import { randomUUID } from 'node:crypto';
import type { HubStorage, ConsensusMarker } from './hub-types.js';

export interface ConsensusManager {
  markConsensus(
    agentId: string,
    args: { workspaceId: string; name: string; description: string; thoughtRef: number; branchId?: string },
  ): Promise<{ consensusId: string; marker: ConsensusMarker }>;

  endorseConsensus(
    agentId: string,
    args: { workspaceId: string; consensusId: string },
  ): Promise<{ marker: ConsensusMarker }>;

  listConsensus(
    args: { workspaceId: string },
  ): Promise<{ markers: ConsensusMarker[] }>;
}

export function createConsensusManager(storage: HubStorage): ConsensusManager {
  return {
    async markConsensus(agentId, { workspaceId, name, description, thoughtRef, branchId }) {
      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) throw new Error(`Workspace not found: ${workspaceId}`);

      const agent = workspace.agents.find(a => a.agentId === agentId);
      if (!agent || agent.role !== 'coordinator') {
        throw new Error('Only coordinator can mark consensus');
      }

      const marker: ConsensusMarker = {
        id: randomUUID(),
        workspaceId,
        name,
        description,
        thoughtRef,
        branchId,
        agreedBy: [agentId],
        createdAt: new Date().toISOString(),
      };

      await storage.saveConsensusMarker(marker);
      return { consensusId: marker.id, marker };
    },

    async endorseConsensus(agentId, { workspaceId, consensusId }) {
      const marker = await storage.getConsensusMarker(workspaceId, consensusId);
      if (!marker) throw new Error(`Consensus marker not found: ${consensusId}`);

      if (!marker.agreedBy.includes(agentId)) {
        marker.agreedBy.push(agentId);
        await storage.saveConsensusMarker(marker);
      }

      return { marker };
    },

    async listConsensus({ workspaceId }) {
      const markers = await storage.listConsensusMarkers(workspaceId);
      return { markers };
    },
  };
}
