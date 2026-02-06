/**
 * Channels Module — Channel messaging and subscription
 *
 * ADR-002 Section 2.2: Channel Operations
 */

import { randomUUID } from 'node:crypto';
import type { HubStorage, ChannelMessage } from './hub-types.js';

type SubscriptionCallback = (uri: string) => void;

export interface ChannelsManager {
  postMessage(
    agentId: string,
    args: { workspaceId: string; problemId: string; content: string; ref?: ChannelMessage['ref'] },
  ): Promise<{ messageId: string; channelMessageCount: number }>;

  readChannel(
    args: { workspaceId: string; problemId: string; since?: string },
  ): Promise<{ messages: ChannelMessage[] }>;

  getChannelResourceUri(workspaceId: string, problemId: string): string;

  subscribe(uri: string, callback: SubscriptionCallback): () => void;
}

export function createChannelsManager(storage: HubStorage): ChannelsManager {
  const subscribers = new Map<string, Set<SubscriptionCallback>>();

  function notifySubscribers(uri: string): void {
    const callbacks = subscribers.get(uri);
    if (callbacks) {
      for (const cb of callbacks) {
        cb(uri);
      }
    }
  }

  return {
    async postMessage(agentId, { workspaceId, problemId, content, ref }) {
      const channel = await storage.getChannel(workspaceId, problemId);
      if (!channel) throw new Error(`Channel not found for problem: ${problemId}`);

      const message: ChannelMessage = {
        id: randomUUID(),
        agentId,
        content,
        timestamp: new Date().toISOString(),
        ...(ref ? { ref } : {}),
      };

      channel.messages.push(message);
      await storage.saveChannel(channel);

      const uri = `thoughtbox://hub/${workspaceId}/channels/${problemId}`;
      notifySubscribers(uri);

      return { messageId: message.id, channelMessageCount: channel.messages.length };
    },

    async readChannel({ workspaceId, problemId, since }) {
      const channel = await storage.getChannel(workspaceId, problemId);
      if (!channel) throw new Error(`Channel not found for problem: ${problemId}`);

      let messages = channel.messages;
      if (since) {
        messages = messages.filter(m => m.timestamp > since);
      }

      return { messages };
    },

    getChannelResourceUri(workspaceId, problemId) {
      return `thoughtbox://hub/${workspaceId}/channels/${problemId}`;
    },

    subscribe(uri, callback) {
      if (!subscribers.has(uri)) {
        subscribers.set(uri, new Set());
      }
      subscribers.get(uri)!.add(callback);

      return () => {
        const callbacks = subscribers.get(uri);
        if (callbacks) {
          callbacks.delete(callback);
          if (callbacks.size === 0) {
            subscribers.delete(uri);
          }
        }
      };
    },
  };
}
