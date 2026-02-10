/**
 * Knowledge Graph Operations Handler
 *
 * Processes knowledge gateway operations and routes to storage layer.
 *
 * @see dgm-specs/SPEC-KNOWLEDGE-MEMORY.md
 */

import type {
  KnowledgeStorage,
  CreateEntityParams,
  CreateRelationParams,
  AddObservationParams,
  EntityFilter,
  GraphTraversalParams,
  RelationType,
} from './types.js';
import { getOperation as getKnowledgeOperation } from './operations.js';

export type KnowledgeAction =
  | 'create_entity'
  | 'get_entity'
  | 'list_entities'
  | 'add_observation'
  | 'create_relation'
  | 'query_graph'
  | 'knowledge_prime'
  | 'stats';

export interface KnowledgeOperationArgs {
  action: KnowledgeAction;
  [key: string]: any;
}

export class KnowledgeHandler {
  private storage: KnowledgeStorage;

  constructor(storage: KnowledgeStorage) {
    this.storage = storage;
  }

  /**
   * Process knowledge operation
   */
  async processOperation(args: KnowledgeOperationArgs): Promise<{
    content: Array<any>;
    isError?: boolean;
  }> {
    try {
      let result: { content: Array<any>; isError?: boolean };
      switch (args.action) {
        case 'create_entity':
          result = await this.handleCreateEntity(args);
          break;
        case 'get_entity':
          result = await this.handleGetEntity(args);
          break;
        case 'list_entities':
          result = await this.handleListEntities(args);
          break;
        case 'add_observation':
          result = await this.handleAddObservation(args);
          break;
        case 'create_relation':
          result = await this.handleCreateRelation(args);
          break;
        case 'query_graph':
          result = await this.handleQueryGraph(args);
          break;
        case 'knowledge_prime':
          result = await this.handlePrime(args);
          break;
        case 'stats':
          result = await this.handleStats(args);
          break;
        default:
          throw new Error(`Unknown knowledge action: ${(args as any).action}`);
      }

      // Embed per-operation resource block for agent discoverability
      const opDef = getKnowledgeOperation(args.action);
      if (opDef) {
        result.content.push({
          type: 'resource',
          resource: {
            uri: `thoughtbox://knowledge/operations/${args.action}`,
            mimeType: 'application/json',
            text: JSON.stringify(opDef, null, 2),
          },
        });
      }

      return result;
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            action: args.action,
          }, null, 2),
        }],
        isError: true,
      };
    }
  }

  private async handleCreateEntity(args: any): Promise<{ content: Array<any> }> {
    // Validate required params
    if (!args.name || !args.type || !args.label) {
      throw new Error('Missing required parameters: name, type, label');
    }

    const params: CreateEntityParams = {
      name: args.name,
      type: args.type,
      label: args.label,
      properties: args.properties,
      created_by: args.created_by,
      visibility: args.visibility,
    };

    const entity = await this.storage.createEntity(params);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          entity_id: entity.id,
          name: entity.name,
          type: entity.type,
          created_at: entity.created_at.toISOString(),
        }, null, 2),
      }],
    };
  }

  private async handleGetEntity(args: any): Promise<{ content: Array<any> }> {
    if (!args.entity_id) {
      throw new Error('Missing required parameter: entity_id');
    }

    const entity = await this.storage.getEntity(args.entity_id);
    if (!entity) {
      throw new Error(`Entity not found: ${args.entity_id}`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(entity, null, 2),
      }],
    };
  }

  private async handleListEntities(args: any): Promise<{ content: Array<any> }> {
    const filter: EntityFilter = {
      types: args.types,
      visibility: args.visibility,
      name_pattern: args.name_pattern,
      created_after: args.created_after ? new Date(args.created_after) : undefined,
      created_before: args.created_before ? new Date(args.created_before) : undefined,
      limit: args.limit,
      offset: args.offset,
    };

    const entities = await this.storage.listEntities(filter);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          count: entities.length,
          entities: entities.map(e => ({
            id: e.id,
            name: e.name,
            type: e.type,
            label: e.label,
            created_at: e.created_at.toISOString(),
          })),
        }, null, 2),
      }],
    };
  }

  private async handleAddObservation(args: any): Promise<{ content: Array<any> }> {
    if (!args.entity_id || !args.content) {
      throw new Error('Missing required parameters: entity_id, content');
    }

    const params: AddObservationParams = {
      entity_id: args.entity_id,
      content: args.content,
      source_session: args.source_session,
      added_by: args.added_by,
    };

    const observation = await this.storage.addObservation(params);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          observation_id: observation.id,
          entity_id: observation.entity_id,
          added_at: observation.added_at.toISOString(),
        }, null, 2),
      }],
    };
  }

  private async handleCreateRelation(args: any): Promise<{ content: Array<any> }> {
    if (!args.from_id || !args.to_id || !args.relation_type) {
      throw new Error('Missing required parameters: from_id, to_id, relation_type');
    }

    const params: CreateRelationParams = {
      from_id: args.from_id,
      to_id: args.to_id,
      type: args.relation_type as RelationType,
      properties: args.properties,
      created_by: args.created_by,
    };

    const relation = await this.storage.createRelation(params);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          relation_id: relation.id,
          from_id: relation.from_id,
          to_id: relation.to_id,
          type: relation.type,
          created_at: relation.created_at.toISOString(),
        }, null, 2),
      }],
    };
  }

  private async handleQueryGraph(args: any): Promise<{ content: Array<any> }> {
    if (!args.start_entity_id) {
      throw new Error('Missing required parameter: start_entity_id');
    }

    const params: GraphTraversalParams = {
      start_entity_id: args.start_entity_id,
      relation_types: args.relation_types,
      max_depth: args.max_depth,
      filter: args.filter,
    };

    const result = await this.storage.traverseGraph(params);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          entity_count: result.entities.length,
          relation_count: result.relations.length,
          max_depth: result.depth,
          entities: result.entities.map(e => ({
            id: e.id,
            name: e.name,
            type: e.type,
            label: e.label,
          })),
          relations: result.relations.map(r => ({
            id: r.id,
            from_id: r.from_id,
            to_id: r.to_id,
            type: r.type,
          })),
        }, null, 2),
      }],
    };
  }

  private async handlePrime(args: any): Promise<{ content: Array<any> }> {
    const limit = args.limit ?? 15;
    const types = args.types as string[] | undefined;
    let since: Date | undefined;
    if (args.since) {
      const parsed = new Date(args.since);
      if (isNaN(parsed.getTime())) {
        throw new Error(`Invalid date for 'since': ${args.since}`);
      }
      since = parsed;
    }

    const entities = await this.storage.listEntities({
      types: types as any,
      created_after: since,
      limit,
    });

    if (entities.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No knowledge graph entities found for this project.',
        }],
      };
    }

    // Build compact markdown summary
    const lines = entities.map(e => {
      const typeTag = e.type;
      return `- **${e.name}** [${typeTag}]: ${e.label}`;
    });

    const stats = await this.storage.getStats();
    const entityCounts = stats.entity_counts ?? {};
    const relationCounts = stats.relation_counts ?? {};
    const totalEntities = Object.values(entityCounts).reduce((a: number, b: number) => a + b, 0);
    const totalRelations = Object.values(relationCounts).reduce((a: number, b: number) => a + b, 0);

    const header = `## Prior Knowledge (${entities.length} of ${totalEntities} entities, ${totalRelations} relations)`;
    const text = [header, '', ...lines].join('\n');

    return {
      content: [{
        type: 'text',
        text,
      }],
    };
  }

  private async handleStats(args: any): Promise<{ content: Array<any> }> {
    const stats = await this.storage.getStats();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(stats, null, 2),
      }],
    };
  }
}
