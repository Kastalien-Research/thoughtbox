/**
 * Task Definitions and Loader for Reasoning Quality Evaluation
 *
 * Loads and validates reasoning tasks from JSON files.
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ReasoningTask } from './reasoning-types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TASKS_DIR = join(__dirname, '..', 'tasks', 'reasoning', 'prototype');

/**
 * Validate a task object has all required fields
 */
function validateTask(task: unknown, filename: string): task is ReasoningTask {
  if (typeof task !== 'object' || task === null) {
    throw new Error(`${filename}: Task must be an object`);
  }

  const t = task as Partial<ReasoningTask>;

  // Required fields
  if (typeof t.id !== 'string' || !t.id) {
    throw new Error(`${filename}: Missing or invalid 'id'`);
  }
  if (typeof t.name !== 'string' || !t.name) {
    throw new Error(`${filename}: Missing or invalid 'name'`);
  }
  if (typeof t.category !== 'string' || !t.category) {
    throw new Error(`${filename}: Missing or invalid 'category'`);
  }
  if (typeof t.prompt !== 'string' || !t.prompt) {
    throw new Error(`${filename}: Missing or invalid 'prompt'`);
  }
  if (typeof t.expectedThoughtboxBenefit !== 'string' || !t.expectedThoughtboxBenefit) {
    throw new Error(`${filename}: Missing or invalid 'expectedThoughtboxBenefit'`);
  }
  if (typeof t.estimatedTokens !== 'number' || t.estimatedTokens <= 0) {
    throw new Error(`${filename}: Missing or invalid 'estimatedTokens'`);
  }

  // Must have either correctAnswer OR scoringRubric
  const hasCorrectAnswer = typeof t.correctAnswer === 'string' && t.correctAnswer;
  const hasRubric = typeof t.scoringRubric === 'object' && t.scoringRubric !== null;

  if (!hasCorrectAnswer && !hasRubric) {
    throw new Error(
      `${filename}: Task must have either 'correctAnswer' or 'scoringRubric'`
    );
  }

  // Validate category
  const validCategories = ['complex-reasoning', 'debugging', 'planning', 'decision-making'];
  if (!validCategories.includes(t.category)) {
    throw new Error(
      `${filename}: Invalid category '${t.category}'. Must be one of: ${validCategories.join(', ')}`
    );
  }

  return true;
}

/**
 * Load a single task from JSON file
 */
function loadTask(filename: string): ReasoningTask {
  const filepath = join(TASKS_DIR, filename);
  try {
    const content = readFileSync(filepath, 'utf-8');
    const task = JSON.parse(content);
    validateTask(task, filename);
    return task as ReasoningTask;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`${filename}: Invalid JSON - ${error.message}`);
    }
    throw error;
  }
}

/**
 * Load all prototype tasks
 */
export function loadPrototypeTasks(): ReasoningTask[] {
  try {
    const files = readdirSync(TASKS_DIR)
      .filter(f => f.endsWith('.json'))
      .sort();

    const tasks = files.map(loadTask);

    // Validate no duplicate IDs
    const ids = new Set<string>();
    for (const task of tasks) {
      if (ids.has(task.id)) {
        throw new Error(`Duplicate task ID: ${task.id}`);
      }
      ids.add(task.id);
    }

    return tasks;
  } catch (error) {
    console.error('Failed to load prototype tasks:', error);
    throw error;
  }
}

/**
 * Get a specific task by ID
 */
export function getTaskById(id: string): ReasoningTask | undefined {
  const tasks = loadPrototypeTasks();
  return tasks.find(t => t.id === id);
}

/**
 * Get tasks by category
 */
export function getTasksByCategory(category: ReasoningTask['category']): ReasoningTask[] {
  const tasks = loadPrototypeTasks();
  return tasks.filter(t => t.category === category);
}

/**
 * Export prototype tasks for convenience
 */
export const PROTOTYPE_TASKS = loadPrototypeTasks();

/**
 * Calculate total estimated cost for all prototype tasks
 * Assumes: 2 runs per task (control + treatment) + 2 judge calls (control + treatment)
 * Cost estimates (approximate):
 * - Sonnet 4.5: $15 per million input tokens, $75 per million output tokens
 * - Haiku: $0.80 per million input tokens, $4.00 per million output tokens
 */
export function estimatePrototypeCost(): {
  perTask: number;
  total: number;
  breakdown: string;
} {
  const tasks = PROTOTYPE_TASKS;
  const avgTokensPerTask = tasks.reduce((sum, t) => sum + t.estimatedTokens, 0) / tasks.length;

  // Each task: 2 agent runs (control + treatment)
  // Each agent run: ~50% input, ~50% output (rough estimate)
  const agentInputTokens = avgTokensPerTask * 0.5;
  const agentOutputTokens = avgTokensPerTask * 0.5;

  // Each judge call: ~2000 input, ~500 output (estimate)
  const judgeInputTokens = 2000;
  const judgeOutputTokens = 500;

  // Costs per million tokens
  const sonnetInputCost = 15;
  const sonnetOutputCost = 75;
  const haikuInputCost = 0.80;
  const haikuOutputCost = 4.00;

  // Cost per task
  const agentCost =
    (agentInputTokens * 2 * sonnetInputCost / 1_000_000) +
    (agentOutputTokens * 2 * sonnetOutputCost / 1_000_000);

  const judgeCost =
    (judgeInputTokens * 2 * haikuInputCost / 1_000_000) +
    (judgeOutputTokens * 2 * haikuOutputCost / 1_000_000);

  const perTask = agentCost + judgeCost;
  const total = perTask * tasks.length;

  const breakdown = `
Cost Breakdown (per task):
  Agent runs (2×): $${agentCost.toFixed(3)}
  Judge calls (2×): $${judgeCost.toFixed(3)}
  Total per task: $${perTask.toFixed(3)}

Prototype Suite (${tasks.length} tasks):
  Total cost: $${total.toFixed(2)}
  `.trim();

  return { perTask, total, breakdown };
}
