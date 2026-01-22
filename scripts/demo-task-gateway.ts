/**
 * Task Gateway Integration Demo
 *
 * Demonstrates all task operations through the thoughtbox_gateway tool.
 * Run after Phase 3 integration is complete.
 *
 * Usage:
 *   npx tsx scripts/demo-task-gateway.ts
 */

import { FileSystemTaskStorage } from '../src/tasks/storage.js';
import { TaskHandler } from '../src/tasks/handler.js';
import { InMemoryStorage } from '../src/persistence/storage.js';
import type { SessionStorage } from '../src/tasks/handler.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Task Gateway Integration Demo');
  console.log('='.repeat(60));

  // Initialize storage
  const taskStorage = new FileSystemTaskStorage({
    basePath: process.env.HOME + '/.thoughtbox',
    project: 'demo-tasks',
  });

  await taskStorage.initialize();
  console.log('✓ Task storage initialized');

  // Mock session storage for demo
  const sessionStorage = new InMemoryStorage() as any;
  await sessionStorage.initialize();
  console.log('✓ Session storage initialized (mock)');

  // Initialize handler
  const taskHandler = new TaskHandler(taskStorage, sessionStorage);
  console.log('✓ Task handler initialized\n');

  // =========================================================================
  // Demo 1: Create a task
  // =========================================================================
  console.log('Demo 1: Create Task');
  console.log('-'.repeat(60));

  const task = await taskHandler.handleCreateTask({
    title: 'Implement reasoning tasks feature',
    description: 'Add task orchestration to thoughtbox',
    completionCriteria: [
      'Types and data model implemented',
      'Storage layer working',
      'Gateway integration complete',
      'Session linking functional',
    ],
    priority: 'high',
    assignedTo: 'agent-alpha',
  }, 'agent-alpha');

  console.log(`Created task: ${task.id}`);
  console.log(`  Title: ${task.title}`);
  console.log(`  Status: ${task.status}`);
  console.log(`  Criteria: ${task.completionCriteria.length}`);
  console.log(`  Assigned: ${task.assignedTo}\n`);

  // =========================================================================
  // Demo 2: List tasks
  // =========================================================================
  console.log('Demo 2: List Tasks');
  console.log('-'.repeat(60));

  const tasks = await taskHandler.handleListTasks({ status: 'pending' });
  console.log(`Found ${tasks.length} pending tasks:`);
  for (const summary of tasks) {
    console.log(`  - ${summary.title} (${summary.completionProgress})`);
  }
  console.log();

  // =========================================================================
  // Demo 3: Claim task
  // =========================================================================
  console.log('Demo 3: Claim Task');
  console.log('-'.repeat(60));

  const claimed = await taskHandler.handleClaim({ taskId: task.id }, 'agent-alpha');
  console.log(`Claimed task: ${claimed.id}`);
  console.log(`  Status: ${claimed.status}`);
  console.log(`  Assigned: ${claimed.assignedTo}\n`);

  // =========================================================================
  // Demo 4: Add note
  // =========================================================================
  console.log('Demo 4: Add Note');
  console.log('-'.repeat(60));

  await taskHandler.handleAddNote({
    taskId: task.id,
    content: 'Started work on types and storage layer',
  }, 'agent-alpha');
  console.log('✓ Note added\n');

  // =========================================================================
  // Demo 5: Check completion criteria
  // =========================================================================
  console.log('Demo 5: Check Completion Criteria');
  console.log('-'.repeat(60));

  // Check first two criteria
  await taskHandler.handleCheckCriterion({
    taskId: task.id,
    criterionIndex: 0,
  }, 'agent-alpha');
  console.log('✓ Criterion 0: Types and data model implemented');

  await taskHandler.handleCheckCriterion({
    taskId: task.id,
    criterionIndex: 1,
  }, 'agent-alpha');
  console.log('✓ Criterion 1: Storage layer working\n');

  // =========================================================================
  // Demo 6: Update task
  // =========================================================================
  console.log('Demo 6: Update Task');
  console.log('-'.repeat(60));

  const updated = await taskHandler.handleUpdateTask({
    taskId: task.id,
    description: task.description + '\n\nProgress: 2/4 criteria completed',
  }, 'agent-alpha');
  console.log(`Updated task: ${updated.id}`);
  console.log(`  Description updated\n`);

  // =========================================================================
  // Demo 7: Get task details
  // =========================================================================
  console.log('Demo 7: Get Task Details');
  console.log('-'.repeat(60));

  const retrieved = await taskHandler.handleGetTask(task.id, 'agent-alpha');
  console.log(`Task: ${retrieved.title}`);
  console.log(`  Status: ${retrieved.status}`);
  console.log(`  Priority: ${retrieved.priority}`);
  console.log(`  Progress: ${retrieved.completionCriteria.filter(c => c.checked).length}/${retrieved.completionCriteria.length}`);
  console.log(`  Notes: ${retrieved.notes.length}`);
  console.log();

  // =========================================================================
  // Demo 8: Try to complete (should fail - not all criteria checked)
  // =========================================================================
  console.log('Demo 8: Try Complete (should fail)');
  console.log('-'.repeat(60));

  try {
    await taskHandler.handleComplete({ taskId: task.id }, 'agent-alpha');
    console.log('ERROR: Should have failed!');
  } catch (error: any) {
    console.log('✓ Expected error:', error.error);
    console.log(`  Code: ${error.code}`);
    console.log(`  Suggestion: ${error.suggestion}\n`);
  }

  // =========================================================================
  // Demo 9: Complete remaining criteria
  // =========================================================================
  console.log('Demo 9: Complete Remaining Criteria');
  console.log('-'.repeat(60));

  await taskHandler.handleCheckCriterion({
    taskId: task.id,
    criterionIndex: 2,
  }, 'agent-alpha');
  console.log('✓ Criterion 2: Gateway integration complete');

  await taskHandler.handleCheckCriterion({
    taskId: task.id,
    criterionIndex: 3,
  }, 'agent-alpha');
  console.log('✓ Criterion 3: Session linking functional\n');

  // =========================================================================
  // Demo 10: Complete task
  // =========================================================================
  console.log('Demo 10: Complete Task');
  console.log('-'.repeat(60));

  const completed = await taskHandler.handleComplete({ taskId: task.id }, 'agent-alpha');
  console.log(`Completed task: ${completed.id}`);
  console.log(`  Status: ${completed.status}`);
  console.log(`  Completed at: ${completed.completedAt?.toISOString()}\n`);

  // =========================================================================
  // Demo 11: Archive task
  // =========================================================================
  console.log('Demo 11: Archive Task');
  console.log('-'.repeat(60));

  await taskHandler.handleArchive({ taskId: task.id }, 'agent-alpha');
  console.log(`✓ Task archived\n`);

  // =========================================================================
  // Demo 12: Verify final state
  // =========================================================================
  console.log('Demo 12: Verify Final State');
  console.log('-'.repeat(60));

  const final = await taskHandler.handleGetTask(task.id, 'agent-alpha');
  console.log(`Task: ${final.title}`);
  console.log(`  Status: ${final.status}`);
  console.log(`  Created: ${final.createdAt.toISOString()}`);
  console.log(`  Completed: ${final.completedAt?.toISOString()}`);
  console.log(`  Updated: ${final.updatedAt.toISOString()}`);
  console.log();

  console.log('='.repeat(60));
  console.log('✓ All demos completed successfully!');
  console.log('='.repeat(60));
}

main().catch(error => {
  console.error('Demo failed:', error);
  process.exit(1);
});
