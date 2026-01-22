/**
 * Simple Task Handler for Multi-Agent Collaboration Visualization
 *
 * Minimal implementation to support Observatory visualization.
 * Full implementation per SPEC-REASONING-TASKS will come later.
 */

import { thoughtEmitter } from "../observatory/emitter.js";
import type { AgentRole } from "../observatory/emitter.js";

/**
 * Minimal task for visualization
 */
interface SimpleTask {
  id: string;
  title: string;
  subtasks: Array<{
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed';
    assignedTo?: string;
  }>;
  progress: number;
  createdAt: string;
}

/**
 * In-memory task storage (simple for now)
 */
const tasks = new Map<string, SimpleTask>();
const agents = new Map<string, { role: AgentRole; taskId?: string }>();

/**
 * Simple task handler for collaborative visualization
 */
export class SimpleTaskHandler {
  /**
   * Handle task operations
   */
  async handle(args: Record<string, any>): Promise<any> {
    const action = args.action as string;

    switch (action) {
      case 'create':
        return this.createTask(args);

      case 'update':
        return this.updateTask(args);

      case 'complete':
        return this.completeTask(args);

      case 'register_agent':
        return this.registerAgent(args);

      case 'get':
        return this.getTask(args);

      case 'list':
        return this.listTasks();

      default:
        throw new Error(`Unknown task action: ${action}`);
    }
  }

  private createTask(args: any): any {
    const taskId = args.taskId || `task-${Date.now()}`;
    const task: SimpleTask = {
      id: taskId,
      title: args.title || 'Untitled Task',
      subtasks: args.subtasks || [],
      progress: 0,
      createdAt: new Date().toISOString()
    };

    tasks.set(taskId, task);

    // Emit observatory event
    thoughtEmitter.emitTaskCreated({
      taskId,
      title: task.title,
      subtasks: task.subtasks,
      progress: task.progress,
      timestamp: task.createdAt
    });

    return {
      success: true,
      taskId,
      task
    };
  }

  private updateTask(args: any): any {
    const taskId = args.taskId;
    const task = tasks.get(taskId);

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Update fields
    if (args.subtasks) {
      task.subtasks = args.subtasks;
    }

    if (args.progress !== undefined) {
      task.progress = args.progress;
    }

    // Emit observatory event
    thoughtEmitter.emitTaskUpdated({
      taskId,
      title: task.title,
      subtasks: task.subtasks,
      progress: task.progress,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      task
    };
  }

  private completeTask(args: any): any {
    const taskId = args.taskId;
    const task = tasks.get(taskId);

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.progress = 1.0;
    task.subtasks.forEach(st => st.status = 'completed');

    // Emit observatory event
    thoughtEmitter.emitTaskCompleted({
      taskId,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      task
    };
  }

  private registerAgent(args: any): any {
    const agentId = args.agentId;
    const agentRole = args.agentRole as AgentRole;
    const taskId = args.taskId;

    agents.set(agentId, { role: agentRole, taskId });

    // Emit observatory event
    thoughtEmitter.emitAgentSpawned({
      agentId,
      agentRole,
      taskId,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      agentId,
      role: agentRole
    };
  }

  private getTask(args: any): any {
    const taskId = args.taskId;
    const task = tasks.get(taskId);

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    return { task };
  }

  private listTasks(): any {
    return {
      tasks: Array.from(tasks.values())
    };
  }
}
