/**
 * Init Flow Request Handler
 *
 * State machine-based handler for init resource navigation.
 * Determines state from URI parameters and delegates rendering.
 */

import type {
  SessionIndex,
  InitState,
  InitParams,
  ResourceContent,
  StateTransition,
  RenderContext,
} from './types.js';
import type { IInitHandler, IResponseRenderer } from './interfaces.js';
import { MarkdownRenderer } from './renderers/markdown.js';

/**
 * State transition rules for the init flow
 * Defines valid state transitions based on parameter presence
 */
const STATE_TRANSITIONS: StateTransition[] = [
  // Entry point (no params)
  { from: 'entry', to: 'entry', requires: [] },
  
  // Continue mode paths
  { from: 'entry', to: 'project-selection', requires: ['mode'] },
  { from: 'project-selection', to: 'task-selection', requires: ['mode', 'project'] },
  { from: 'task-selection', to: 'aspect-selection', requires: ['mode', 'project', 'task'] },
  { from: 'aspect-selection', to: 'context-loaded', requires: ['mode', 'project', 'task', 'aspect'] },
  
  // New work mode
  { from: 'entry', to: 'new-work', requires: ['mode'] },
];

/**
 * Init flow handler with state machine logic
 */
export class InitHandler implements IInitHandler {
  private index: SessionIndex;
  private renderer: IResponseRenderer;

  constructor(index: SessionIndex, renderer?: IResponseRenderer) {
    this.index = index;
    this.renderer = renderer || new MarkdownRenderer();
  }

  /**
   * Handle init resource request
   */
  handle(params: InitParams): ResourceContent {
    // Validate parameters
    const validation = this.validate(params);
    if (validation !== true) {
      return this.renderError(validation);
    }

    // Determine current state
    const state = this.getState(params);

    // Build render context
    const context: RenderContext = {
      state,
      params,
      index: this.index,
    };

    // Delegate to renderer based on state
    let rendered;
    switch (state) {
      case 'entry':
        rendered = this.renderer.renderEntry(context);
        break;
      case 'project-selection':
        rendered = this.renderer.renderProjectSelection(context);
        break;
      case 'task-selection':
        rendered = this.renderer.renderTaskSelection(context);
        break;
      case 'aspect-selection':
        rendered = this.renderer.renderAspectSelection(context);
        break;
      case 'context-loaded':
        rendered = this.renderer.renderContextLoaded(context);
        break;
      case 'new-work':
        rendered = this.renderer.renderNewWork(context);
        break;
      default:
        return this.renderError('Unknown state: ' + state);
    }

    // Build URI from params
    const uri = this.buildUri(params);

    return {
      uri,
      mimeType: this.renderer.mimeType,
      text: rendered.markdown,
    };
  }

  /**
   * Determine current state from parameters
   */
  getState(params: InitParams): InitState {
    // No params = entry point
    if (!params.mode && !params.project && !params.task && !params.aspect) {
      return 'entry';
    }

    // New work mode
    if (params.mode === 'new') {
      return 'new-work';
    }

    // Continue mode - determine state by parameter presence
    if (params.mode === 'continue') {
      if (params.project && params.task && params.aspect) {
        return 'context-loaded';
      }
      if (params.project && params.task) {
        return 'aspect-selection';
      }
      if (params.project) {
        return 'task-selection';
      }
      return 'project-selection';
    }

    // Invalid state
    return 'entry';
  }

  /**
   * Validate that parameters are valid for current state
   */
  validate(params: InitParams): true | string {
    const state = this.getState(params);

    // Validate mode parameter
    if (params.mode && params.mode !== 'new' && params.mode !== 'continue') {
      return 'Invalid mode: ' + params.mode + '. Must be new or continue.';
    }

    // State-specific validation
    switch (state) {
      case 'entry':
        return true;

      case 'project-selection':
        return true;

      case 'task-selection':
        if (!params.project) {
          return 'Missing required parameter: project';
        }
        // Validate project exists
        if (!this.index.byProject.has(params.project)) {
          return 'Project not found: ' + params.project;
        }
        return true;

      case 'aspect-selection':
        if (!params.project || !params.task) {
          return 'Missing required parameters: project, task';
        }
        // Validate project:task exists
        const taskKey = params.project + ':' + params.task;
        if (!this.index.byTask.has(taskKey)) {
          return 'Task not found: ' + params.project + '/' + params.task;
        }
        return true;

      case 'context-loaded':
        if (!params.project || !params.task || !params.aspect) {
          return 'Missing required parameters: project, task, aspect';
        }
        // Validate project:task exists (aspect can be new)
        const taskKey2 = params.project + ':' + params.task;
        if (!this.index.byTask.has(taskKey2)) {
          return 'Task not found: ' + params.project + '/' + params.task;
        }
        return true;

      case 'new-work':
        return true;

      default:
        return 'Invalid state: ' + state;
    }
  }

  /**
   * Get session index
   */
  getIndex(): SessionIndex {
    return this.index;
  }

  /**
   * Refresh handler with updated index
   * (For incremental index updates after exports)
   */
  async refresh(): Promise<IInitHandler> {
    // This would rebuild the index, but for now we just return self
    // In production, this could trigger an index rebuild or incremental update
    return this;
  }

  // =========================================================================
  // Private Helpers
  // =========================================================================

  /**
   * Build URI from parameters using path segments
   */
  private buildUri(params: InitParams): string {
    const segments: string[] = ['thoughtbox://init'];

    if (params.mode) {
      segments.push(encodeURIComponent(params.mode));
    }
    if (params.project) {
      segments.push(encodeURIComponent(params.project));
    }
    if (params.task) {
      segments.push(encodeURIComponent(params.task));
    }
    if (params.aspect) {
      segments.push(encodeURIComponent(params.aspect));
    }

    return segments.join('/');
  }

  /**
   * Render error message
   */
  private renderError(message: string): ResourceContent {
    const rendered = this.renderer.renderError
      ? this.renderer.renderError(message)
      : { markdown: '# Error\n\n' + message };

    return {
      uri: 'thoughtbox://init',
      mimeType: this.renderer.mimeType,
      text: rendered.markdown,
    };
  }
}

/**
 * Helper function to parse URI path segments into InitParams
 * URI format: thoughtbox://init/{mode}/{project}/{task}/{aspect}
 * Useful for testing and manual URI construction
 */
export function parseInitUri(uri: string): InitParams {
  const url = new URL(uri);
  const params: InitParams = {};

  // Path is like /init or /init/continue/project/task/aspect
  // Split and filter empty segments
  const segments = url.pathname.split('/').filter(s => s.length > 0);

  // segments[0] is 'init', skip it
  if (segments.length > 1) {
    const mode = decodeURIComponent(segments[1]);
    if (mode === 'new' || mode === 'continue') {
      params.mode = mode;
    }
  }

  if (segments.length > 2) {
    params.project = decodeURIComponent(segments[2]);
  }

  if (segments.length > 3) {
    params.task = decodeURIComponent(segments[3]);
  }

  if (segments.length > 4) {
    params.aspect = decodeURIComponent(segments[4]);
  }

  return params;
}

/**
 * Helper function to check if state is terminal
 * Terminal states indicate context is loaded and tools are available
 */
export function isTerminalState(state: InitState): boolean {
  return state === 'context-loaded' || state === 'new-work';
}

/**
 * Helper function to get next possible states from current state
 * Useful for navigation hints and UI construction
 */
export function getNextStates(state: InitState): InitState[] {
  return STATE_TRANSITIONS
    .filter(t => t.from === state)
    .map(t => t.to);
}
