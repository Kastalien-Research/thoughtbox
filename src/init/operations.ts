/**
 * Init Navigation Catalog
 *
 * Init has NO callable executor: there is no tb.init module and the Code Mode
 * catalog intentionally excludes init (see src/code-mode/search-tool.ts).
 * Every step below is performed by READING a thoughtbox://init URI; the
 * InitHandler read handler renders markdown that links to the next step.
 *
 * Entries therefore describe resource-navigation contracts (URI templates and
 * path parameters), not tool-call schemas.
 */

export interface InitNavigationStep {
  name: string;
  title: string;
  description: string;
  category: string;
  kind: "resource-navigation";
  uriTemplate: string;
  pathParams: Record<string, string>;
  exampleUri: string;
}

export const INIT_NAVIGATION_STEPS: InitNavigationStep[] = [
  {
    name: "list_sessions",
    title: "List Sessions",
    description:
      "Browse prior reasoning sessions by reading thoughtbox://init/continue. The response lists project URIs; append path segments to narrow to a project (thoughtbox://init/continue/{project}) and then a task (thoughtbox://init/continue/{project}/{task}). Sessions appear with title, thought count, and last-activity metadata. There is no callable list operation and no query filters — navigation is by URI path segments only. For a programmatic listing, use tb.session.list in thoughtbox_execute.",
    category: "navigation",
    kind: "resource-navigation",
    uriTemplate: "thoughtbox://init/continue/{project}/{task}",
    pathParams: {
      project: "Optional. Project name taken from the project list response.",
      task: "Optional. Task name taken from the task list response.",
    },
    exampleUri: "thoughtbox://init/continue",
  },
  {
    name: "load_context",
    title: "Load Context",
    description:
      "Load context for continuing prior work by reading thoughtbox://init/continue/{project}/{task}/{aspect}. The response renders recent sessions matching that scope, with conclusions and thoughtbox://sessions/{sessionId} URIs for full content. There is no callable load operation and no sessionId argument — scope comes entirely from the URI path segments. To restore a specific session programmatically, use tb.session.resume in thoughtbox_execute.",
    category: "session-setup",
    kind: "resource-navigation",
    uriTemplate: "thoughtbox://init/continue/{project}/{task}/{aspect}",
    pathParams: {
      project: "Required. Project name from the project list response.",
      task: "Required. Task name from the task list response.",
      aspect:
        "Required. Aspect name (e.g. understanding, design, implementing, debugging, reviewing, documenting).",
    },
    exampleUri: "thoughtbox://init/continue/my-project/feature-x/implementing",
  },
  {
    name: "start_new",
    title: "Start New Work",
    description:
      "Start new work by reading thoughtbox://init/new. The response renders tag conventions (project:/task:/aspect:) for organizing the new session. Reading this URI only provides guidance — session creation itself happens via tb.thought in thoughtbox_execute.",
    category: "session-setup",
    kind: "resource-navigation",
    uriTemplate: "thoughtbox://init/new",
    pathParams: {},
    exampleUri: "thoughtbox://init/new",
  },
];

/**
 * Get navigation step definition by name
 */
export function getNavigationStep(name: string): InitNavigationStep | undefined {
  return INIT_NAVIGATION_STEPS.find((step) => step.name === name);
}

/**
 * Get all navigation step names
 */
export function getNavigationStepNames(): string[] {
  return INIT_NAVIGATION_STEPS.map((step) => step.name);
}

/**
 * Get init navigation catalog as JSON resource
 */
export function getNavigationCatalog(): string {
  return JSON.stringify(
    {
      version: "2.0.0",
      kind: "resource-navigation",
      note: "Init steps are performed by reading thoughtbox://init URIs — there is no callable init tool and no tb.init module. The Code Mode catalog intentionally excludes init.",
      steps: INIT_NAVIGATION_STEPS,
      categories: [
        {
          name: "navigation",
          description: "Browse the project/task/aspect hierarchy by reading URIs",
        },
        {
          name: "session-setup",
          description: "Load prior context or start new work by reading URIs",
        },
      ],
    },
    null,
    2
  );
}
