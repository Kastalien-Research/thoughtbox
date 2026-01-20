/**
 * Mental Models Toolhost Type Definitions
 */

/**
 * Definition of a mental model with its content and metadata
 */
export interface MentalModelDefinition {
  /** Unique identifier (kebab-case, e.g., "five-whys") */
  name: string;
  /** Human-readable title (e.g., "Five Whys") */
  title: string;
  /** Brief description for listings */
  description: string;
  /** Tags categorizing use cases */
  tags: string[];
  /** Full prompt content (markdown) */
  content: string;
}

/**
 * Definition of a tag category
 */
export interface TagDefinition {
  /** Tag identifier (e.g., "decision-making") */
  name: string;
  /** Description of when to use models with this tag */
  description: string;
}

/**
 * Operation definition for the operations catalog
 */
export interface OperationDefinition {
  name: string;
  title: string;
  description: string;
  category: string;
  inputs: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  example?: Record<string, any>;
}

/**
 * Response from get_model operation
 */
export interface GetModelResponse {
  name: string;
  title: string;
  tags: string[];
  content: string;
}

/**
 * Response from list_models operation
 */
export interface ListModelsResponse {
  models: Array<{
    name: string;
    title: string;
    description: string;
    tags: string[];
  }>;
  count: number;
  filter?: string | string[];
}

/**
 * Response from list_tags operation
 */
export interface ListTagsResponse {
  tags: TagDefinition[];
  count: number;
}
