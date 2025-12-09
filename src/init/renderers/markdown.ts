/**
 * Markdown Response Renderer
 *
 * Renders init flow responses as markdown for agent consumption.
 * Implements clean, navigable CLI-style interfaces.
 */

import type {
  SessionIndex,
  SessionMetadata,
  ProjectSummary,
  TaskSummary,
  RenderContext,
  RenderedOutput,
  STANDARD_ASPECTS,
} from '../types.js';
import type { IResponseRenderer } from '../interfaces.js';

/**
 * Markdown renderer for init flow responses
 */
export class MarkdownRenderer implements IResponseRenderer {
  readonly name = 'markdown';
  readonly mimeType = 'text/markdown';

  renderEntry(context: RenderContext): RenderedOutput {
    const markdown = `# Thoughtbox Initialization

Welcome to Thoughtbox, your structured reasoning companion.

## Getting Started

Choose how you'd like to begin:

- \`thoughtbox://init/continue\` — Continue previous work (browse past sessions)
- \`thoughtbox://init/new\` — Start new work (create fresh session context)

## About

Thoughtbox helps you think through complex problems with structured reasoning tools:

- **thoughtbox** — Step-by-step reasoning with branching and revision
- **notebook** — Literate programming notebooks with executable code
- **mental_models** — Structured reasoning frameworks

The init flow helps you load relevant context from prior sessions before beginning new work.
`;

    return { markdown };
  }

  renderProjectSelection(context: RenderContext): RenderedOutput {
    const { index } = context;

    if (index.projects.length === 0) {
      return {
        markdown: `# No Projects Found

You don't have any exported sessions yet. Start by creating a new reasoning session:

- \`thoughtbox://init/new\` — Start new work

Sessions are automatically exported when you complete a reasoning chain using the \`thoughtbox\` tool.
`,
      };
    }

    const projectList = index.projects
      .map(p => this.formatProjectOption(p))
      .join('\n');

    const markdown = `# Select Project

Choose a project to continue working on:

${projectList}

---

**Tip:** Projects are organized by tags. Use \`project:{name}\` tags when creating sessions to enable this navigation.
`;

    return { markdown };
  }

  renderTaskSelection(context: RenderContext): RenderedOutput {
    const { params, index } = context;
    const projectName = params.project!;

    const project = index.projects.find(p => p.name === projectName);
    if (!project) {
      return this.renderError(`Project "${projectName}" not found`);
    }

    if (project.tasks.length === 0) {
      return {
        markdown: `# Project: ${projectName}

This project has sessions without specific tasks. Sessions can be tagged with \`task:{name}\` to enable task-based navigation.

**Available Sessions:** ${project.sessionCount}

Navigate to:
- \`thoughtbox://init/new/${encodeURIComponent(projectName)}\` — Start new task in this project
`,
      };
    }

    const taskList = project.tasks
      .map(t => this.formatTaskOption(projectName, t))
      .join('\n');

    const markdown = `# Project: ${projectName}

**Total Sessions:** ${project.sessionCount}  
**Last Activity:** ${this.formatRelativeTime(project.lastWorked)}

## Select Task

${taskList}

---

**New Task:** \`thoughtbox://init/new/${encodeURIComponent(projectName)}\`
`;

    return { markdown };
  }

  renderAspectSelection(context: RenderContext): RenderedOutput {
    const { params, index } = context;
    const projectName = params.project!;
    const taskName = params.task!;

    const taskKey = `${projectName}:${taskName}`;
    const sessionIds = index.byTask.get(taskKey);

    if (!sessionIds || sessionIds.size === 0) {
      return this.renderError(`No sessions found for ${projectName}/${taskName}`);
    }

    // Get unique aspects used in this task
    const sessions = Array.from(sessionIds)
      .map(id => index.byId.get(id)!)
      .filter(Boolean);

    const usedAspects = Array.from(
      new Set(sessions.map(s => s.aspect).filter(Boolean))
    ) as string[];

    const aspectList = usedAspects
      .map(aspect => {
        const count = sessions.filter(s => s.aspect === aspect).length;
        const uri = `thoughtbox://init/continue/${encodeURIComponent(projectName)}/${encodeURIComponent(taskName)}/${encodeURIComponent(aspect)}`;
        return `- \`${uri}\` — **${aspect}** (${count} session${count > 1 ? 's' : ''})`;
      })
      .join('\n');

    const markdown = `# Select Aspect

**Project:** ${projectName}  
**Task:** ${taskName}

## Previous Aspects

${aspectList}

## Standard Aspects

You can also specify a standard aspect type:

${this.formatStandardAspects(projectName, taskName)}

---

**Aspects categorize the type of work:** understanding, design, implementing, debugging, reviewing, documenting.
`;

    return { markdown };
  }

  renderContextLoaded(context: RenderContext): RenderedOutput {
    const { params, index } = context;
    const projectName = params.project!;
    const taskName = params.task!;
    const aspect = params.aspect!;

    // Find relevant sessions
    const taskKey = `${projectName}:${taskName}`;
    const sessionIds = index.byTask.get(taskKey);

    if (!sessionIds || sessionIds.size === 0) {
      return this.renderError(`No sessions found for ${projectName}/${taskName}`);
    }

    const sessions = Array.from(sessionIds)
      .map(id => index.byId.get(id)!)
      .filter(Boolean)
      .filter(s => s.aspect === aspect)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    const sessionPreviews = sessions
      .slice(0, 5) // Show max 5 most recent
      .map(s => this.formatSessionPreview(s))
      .join('\n\n');

    const suggestions = this.generateSuggestions(sessions, projectName, taskName, aspect);

    const markdown = `# Context Loaded

**Project:** ${projectName}  
**Task:** ${taskName}  
**Aspect:** ${aspect}

## Prior Sessions (${sessions.length} total)

${sessionPreviews || '*No prior sessions with this aspect yet.*'}

## Tools Available

The following tools are now available for your work:

- \`thoughtbox\` — Step-by-step reasoning with branching and revision
- \`notebook\` — Literate programming notebooks with executable code
- \`mental_models\` — Structured reasoning frameworks
- \`export_reasoning_chain\` — Persist completed sessions

## Suggested Start

${suggestions}

---

**Ready to begin.** Start a new reasoning session with appropriate tags:

\`\`\`json
{
  "thought": "Your first thought...",
  "thoughtNumber": 1,
  "totalThoughts": 5,
  "nextThoughtNeeded": true,
  "sessionTitle": "${taskName}: ${aspect}",
  "sessionTags": ["project:${projectName}", "task:${taskName}", "aspect:${aspect}"]
}
\`\`\`
`;

    return { markdown };
  }

  renderNewWork(context: RenderContext): RenderedOutput {
    const { params } = context;

    const projectExample = params.project || 'my-project';
    const taskExample = params.task || 'feature-x';

    const markdown = `# Start New Work

You're creating a fresh session context. Consider organizing your work with structured tags:

## Recommended Tag Structure

\`\`\`json
{
  "sessionTitle": "Descriptive title for your reasoning session",
  "sessionTags": [
    "project:${projectExample}",
    "task:${taskExample}",
    "aspect:understanding"
  ]
}
\`\`\`

## Tag Conventions

- **project:{name}** — Groups sessions by project/codebase
- **task:{name}** — Groups sessions by discrete work unit  
- **aspect:{name}** — Categorizes the type of work

## Standard Aspects

- **understanding** — Exploring problem space, reading code, gathering context
- **design** — Architectural decisions, API design, planning approach
- **implementing** — Writing code, building features
- **debugging** — Investigating issues, fixing bugs
- **reviewing** — Validating work, code review, testing
- **documenting** — Writing docs, explaining decisions

## Benefits

Structured tags enable:
- Context continuity across multiple sessions
- Quick navigation through related work
- Discovery of prior reasoning on similar problems
- Cross-agent context sharing (same tags in different conversations)

---

**Begin when ready.** Use the \`thoughtbox\` tool with appropriate tags to start your reasoning session.
`;

    return { markdown };
  }

  renderError(message: string): RenderedOutput {
    const markdown = `# Error

${message}

Navigate back to:
- \`thoughtbox://init\` — Start over
`;
    return { markdown };
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  private formatProjectOption(project: ProjectSummary): string {
    const uri = `thoughtbox://init/continue/${encodeURIComponent(project.name)}`;
    const timeAgo = this.formatRelativeTime(project.lastWorked);
    return `- \`${uri}\` — **${project.name}** (${project.sessionCount} sessions, last worked ${timeAgo})`;
  }

  private formatTaskOption(projectName: string, task: TaskSummary): string {
    const uri = `thoughtbox://init/continue/${encodeURIComponent(projectName)}/${encodeURIComponent(task.name)}`;
    const timeAgo = this.formatRelativeTime(task.lastWorked);
    const aspectsStr = task.aspects.length > 0 ? ` — aspects: ${task.aspects.join(', ')}` : '';
    return `- \`${uri}\` — **${task.name}** (${task.sessionCount} sessions, last worked ${timeAgo}${aspectsStr})`;
  }

  private formatStandardAspects(projectName: string, taskName: string): string {
    const aspects = [
      'understanding',
      'design',
      'implementing',
      'debugging',
      'reviewing',
      'documenting',
    ];

    return aspects
      .map(aspect => {
        const uri = `thoughtbox://init/continue/${encodeURIComponent(projectName)}/${encodeURIComponent(taskName)}/${aspect}`;
        return `- \`${uri}\` — ${aspect}`;
      })
      .join('\n');
  }

  private formatSessionPreview(session: SessionMetadata): string {
    const timeAgo = this.formatRelativeTime(session.updatedAt);
    const uri = `thoughtbox://sessions/${session.id}`;
    const conclusion = session.lastConclusion
      ? `\n> ${session.lastConclusion}`
      : '';

    return `### ${session.title} (${timeAgo})

**Thoughts:** ${session.thoughtCount} | **Created:** ${session.createdAt.toLocaleDateString()}
${conclusion}

[View full session: \`${uri}\`]`;
  }

  private generateSuggestions(
    sessions: SessionMetadata[],
    project: string,
    task: string,
    aspect: string
  ): string {
    if (sessions.length === 0) {
      return `This is your first session with **${aspect}** aspect for this task. Consider starting with:

- What are you trying to accomplish?
- What context do you need to gather?
- What are the key questions or decisions?`;
    }

    const mostRecent = sessions[0];
    const timeAgo = this.formatRelativeTime(mostRecent.updatedAt);

    return `Based on your prior work (last session ${timeAgo}):

- Review the conclusion from "${mostRecent.title}" above
- Continue from where you left off, or
- Start a fresh reasoning chain tagged with the current scope

Consider what has changed since your last session and what new context might be relevant.`;
  }

  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
  }
}
