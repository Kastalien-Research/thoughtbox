import { z } from 'zod';
import {
  GATEWAY_OPERATIONS,
  getOperation as getGatewayOperation,
} from '../gateway/operations.js';
import {
  INIT_OPERATIONS,
  getOperation as getInitOperation,
} from '../init/operations.js';
import {
  SESSION_OPERATIONS,
  getOperation as getSessionOperation,
} from '../sessions/operations.js';
import {
  NOTEBOOK_OPERATIONS,
  getOperation as getNotebookOperation,
} from '../notebook/operations.js';
import {
  HUB_OPERATIONS,
  getOperation as getHubOperation,
} from '../hub/operations.js';
import {
  KNOWLEDGE_OPERATIONS,
  getOperation as getKnowledgeOperation,
} from '../knowledge/operations.js';
import {
  MENTAL_MODELS_OPERATIONS,
} from '../mental-models/operations.js';

export const operationsToolInputSchema = z.object({
  operation: z.enum(['list', 'get', 'search']),
  args: z.object({
    name: z.string().optional(),
    query: z.string().optional(),
    module: z.enum([
      'gateway', 'init', 'session', 'notebook',
      'hub', 'knowledge', 'mental-models',
    ]).optional(),
  }).optional(),
});

export type OperationsToolInput = z.infer<typeof operationsToolInputSchema>;

interface OperationSummary {
  name: string;
  title: string;
  description: string;
  category: string;
  module: string;
}

type ModuleName = 'gateway' | 'init' | 'session' | 'notebook'
  | 'hub' | 'knowledge' | 'mental-models';

interface ModuleCatalog {
  module: ModuleName;
  operations: Array<{ name: string; title: string; description: string; category: string }>;
  getOperation: (name: string) => any;
}

const MODULE_CATALOGS: ModuleCatalog[] = [
  {
    module: 'gateway',
    operations: GATEWAY_OPERATIONS,
    getOperation: getGatewayOperation,
  },
  {
    module: 'init',
    operations: INIT_OPERATIONS,
    getOperation: getInitOperation,
  },
  {
    module: 'session',
    operations: SESSION_OPERATIONS,
    getOperation: getSessionOperation,
  },
  {
    module: 'notebook',
    operations: NOTEBOOK_OPERATIONS,
    getOperation: getNotebookOperation,
  },
  {
    module: 'hub',
    operations: HUB_OPERATIONS,
    getOperation: getHubOperation,
  },
  {
    module: 'knowledge',
    operations: KNOWLEDGE_OPERATIONS,
    getOperation: getKnowledgeOperation,
  },
  {
    module: 'mental-models',
    operations: MENTAL_MODELS_OPERATIONS,
    getOperation: (name: string) =>
      MENTAL_MODELS_OPERATIONS.find((op) => op.name === name),
  },
];

function getCatalogs(moduleFilter?: string): ModuleCatalog[] {
  if (!moduleFilter) return MODULE_CATALOGS;
  return MODULE_CATALOGS.filter((c) => c.module === moduleFilter);
}

export function handleList(moduleFilter?: string): object {
  const catalogs = getCatalogs(moduleFilter);
  let totalOperations = 0;
  const modules = catalogs.map((catalog) => {
    const ops = catalog.operations.map((op) => ({
      name: op.name,
      title: op.title,
      description: op.description,
      category: op.category,
    }));
    totalOperations += ops.length;
    return { module: catalog.module, operations: ops };
  });
  return { modules, totalOperations };
}

export function handleGet(
  name: string,
  moduleFilter?: string,
): object {
  const catalogs = getCatalogs(moduleFilter);
  for (const catalog of catalogs) {
    const op = catalog.getOperation(name);
    if (op) {
      return {
        name: op.name,
        title: op.title,
        module: catalog.module,
        category: op.category,
        description: op.description,
        inputSchema: op.inputSchema ?? op.inputs,
        example: op.example,
      };
    }
  }
  return { error: `Operation "${name}" not found`, suggestion: 'Use list to see available operations' };
}

export function handleSearch(
  query: string,
  moduleFilter?: string,
): object {
  const lowerQuery = query.toLowerCase();
  const catalogs = getCatalogs(moduleFilter);
  const matches: OperationSummary[] = [];

  for (const catalog of catalogs) {
    for (const op of catalog.operations) {
      const haystack = `${op.name} ${op.title} ${op.description}`.toLowerCase();
      if (haystack.includes(lowerQuery)) {
        matches.push({
          name: op.name,
          title: op.title,
          description: op.description,
          category: op.category,
          module: catalog.module,
        });
      }
    }
  }

  return { query, matches, totalMatches: matches.length };
}

export function handleOperationsTool(input: OperationsToolInput): object {
  const { operation, args } = input;

  switch (operation) {
    case 'list':
      return handleList(args?.module);
    case 'get': {
      if (!args?.name) {
        return { error: 'name is required for get operation' };
      }
      return handleGet(args.name, args.module);
    }
    case 'search': {
      if (!args?.query) {
        return { error: 'query is required for search operation' };
      }
      return handleSearch(args.query, args.module);
    }
  }
}
