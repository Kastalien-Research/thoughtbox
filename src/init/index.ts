/**
 * Init flow entry — indexer/handler implementations are not shipped in this cut.
 * Operations catalog remains for Code Mode discovery; MCP resources show the fallback copy.
 */

import type { IInitHandler } from "./interfaces.js";
import type { IndexBuildError, IndexBuildStats, SessionIndex } from "./types.js";

export type { IInitHandler } from "./interfaces.js";
export type {
  InitParams,
  InitState,
  ResourceContent,
  SessionIndex,
  IndexBuildStats,
  IndexBuildError,
} from "./types.js";

export { INIT_OPERATIONS, getOperation, getOperationsCatalog } from "./operations.js";

export async function createInitFlow(_options: {
  exportsDir?: string;
} = {}): Promise<{
  index: SessionIndex;
  handler: IInitHandler | null;
  stats: IndexBuildStats;
  errors: IndexBuildError[];
}> {
  return {
    index: {},
    handler: null,
    stats: {
      sessionsIndexed: 0,
      projectsFound: 0,
      tasksFound: 0,
      buildTimeMs: 0,
    },
    errors: [],
  };
}
