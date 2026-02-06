/**
 * Filesystem Hub Storage — Persists hub state to JSON files
 *
 * ADR-002 Section 10.17: Storage Persistence Tests
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  HubStorage,
  AgentIdentity,
  Workspace,
  Problem,
  Proposal,
  ConsensusMarker,
  Channel,
} from './hub-types.js';

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

async function readJson<T>(path: string): Promise<T | null> {
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

async function writeJson(path: string, data: unknown): Promise<void> {
  const dir = path.substring(0, path.lastIndexOf('/'));
  await ensureDir(dir);
  await writeFile(path, JSON.stringify(data, null, 2), 'utf-8');
}

export function createFileSystemHubStorage(dataDir: string): HubStorage {
  const hubDir = join(dataDir, 'hub');
  const agentsPath = join(hubDir, 'agents.json');

  function workspaceDir(workspaceId: string): string {
    return join(hubDir, 'workspaces', workspaceId);
  }

  return {
    // Agent registry
    async getAgents() {
      const agents = await readJson<AgentIdentity[]>(agentsPath);
      return agents ?? [];
    },

    async saveAgent(agent) {
      const agents = await this.getAgents();
      const idx = agents.findIndex(a => a.agentId === agent.agentId);
      if (idx >= 0) {
        agents[idx] = agent;
      } else {
        agents.push(agent);
      }
      await writeJson(agentsPath, agents);
    },

    async getAgent(agentId) {
      const agents = await this.getAgents();
      return agents.find(a => a.agentId === agentId) ?? null;
    },

    // Workspace operations
    async getWorkspace(workspaceId) {
      return readJson<Workspace>(join(workspaceDir(workspaceId), 'workspace.json'));
    },

    async saveWorkspace(workspace) {
      await writeJson(join(workspaceDir(workspace.id), 'workspace.json'), workspace);
    },

    async listWorkspaces() {
      const wsRoot = join(hubDir, 'workspaces');
      try {
        const dirs = await readdir(wsRoot);
        const results: Workspace[] = [];
        for (const dir of dirs) {
          const ws = await readJson<Workspace>(join(wsRoot, dir, 'workspace.json'));
          if (ws) results.push(ws);
        }
        return results;
      } catch {
        return [];
      }
    },

    // Problem operations
    async getProblem(workspaceId, problemId) {
      return readJson<Problem>(join(workspaceDir(workspaceId), 'problems', `${problemId}.json`));
    },

    async saveProblem(problem) {
      await writeJson(
        join(workspaceDir(problem.workspaceId), 'problems', `${problem.id}.json`),
        problem,
      );
    },

    async listProblems(workspaceId) {
      const dir = join(workspaceDir(workspaceId), 'problems');
      try {
        const files = await readdir(dir);
        const results: Problem[] = [];
        for (const file of files) {
          if (file.endsWith('.json')) {
            const prob = await readJson<Problem>(join(dir, file));
            if (prob) results.push(prob);
          }
        }
        return results;
      } catch {
        return [];
      }
    },

    // Proposal operations
    async getProposal(workspaceId, proposalId) {
      return readJson<Proposal>(join(workspaceDir(workspaceId), 'proposals', `${proposalId}.json`));
    },

    async saveProposal(proposal) {
      await writeJson(
        join(workspaceDir(proposal.workspaceId), 'proposals', `${proposal.id}.json`),
        proposal,
      );
    },

    async listProposals(workspaceId) {
      const dir = join(workspaceDir(workspaceId), 'proposals');
      try {
        const files = await readdir(dir);
        const results: Proposal[] = [];
        for (const file of files) {
          if (file.endsWith('.json')) {
            const prop = await readJson<Proposal>(join(dir, file));
            if (prop) results.push(prop);
          }
        }
        return results;
      } catch {
        return [];
      }
    },

    // Consensus operations
    async getConsensusMarker(workspaceId, markerId) {
      return readJson<ConsensusMarker>(join(workspaceDir(workspaceId), 'consensus', `${markerId}.json`));
    },

    async saveConsensusMarker(marker) {
      await writeJson(
        join(workspaceDir(marker.workspaceId), 'consensus', `${marker.id}.json`),
        marker,
      );
    },

    async listConsensusMarkers(workspaceId) {
      const dir = join(workspaceDir(workspaceId), 'consensus');
      try {
        const files = await readdir(dir);
        const results: ConsensusMarker[] = [];
        for (const file of files) {
          if (file.endsWith('.json')) {
            const marker = await readJson<ConsensusMarker>(join(dir, file));
            if (marker) results.push(marker);
          }
        }
        return results;
      } catch {
        return [];
      }
    },

    // Channel operations
    async getChannel(workspaceId, problemId) {
      return readJson<Channel>(join(workspaceDir(workspaceId), 'channels', `${problemId}.json`));
    },

    async saveChannel(channel) {
      await writeJson(
        join(workspaceDir(channel.workspaceId), 'channels', `${channel.id}.json`),
        channel,
      );
    },
  };
}
