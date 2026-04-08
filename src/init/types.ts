/**
 * Minimal init types — session index UI was removed from the tree; init flow
 * degrades to “no index” until a full indexer is restored.
 */

export type InitState = string;

export interface InitParams {
  mode?: "new" | "continue";
  project?: string;
  task?: string;
  aspect?: string;
}

export interface ResourceContent {
  uri: string;
  mimeType: string;
  text: string;
}

/** Placeholder — real index lived in index-builder (removed). */
export type SessionIndex = Record<string, never>;

export interface IndexBuildStats {
  sessionsIndexed: number;
  projectsFound: number;
  tasksFound: number;
  buildTimeMs: number;
}

export interface IndexBuildError {
  message: string;
  path?: string;
}
