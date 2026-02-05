/**
 * Mock Collaborative Session Events
 *
 * Generates realistic multi-agent collaboration events for testing the
 * Observatory visualization. Simulates a code review task with multiple
 * specialized agents working in parallel.
 */

import { thoughtEmitter } from "./emitter.js";

/**
 * Emit a complete mock collaborative session
 * Simulates: Orchestrator planning → spawning 3 agents → parallel work → synthesis
 */
export function emitMockCollabSession() {
  const sessionId = 'demo-collab-session';
  const taskId = 'task-code-review-demo';

  // Step 1: Orchestrator spawns (t=0)
  thoughtEmitter.emitAgentSpawned({
    agentId: 'agent-orchestrator-1',
    agentRole: 'orchestrator',
    timestamp: new Date().toISOString()
  });

  // Step 2: Orchestrator creates task (t=500ms)
  setTimeout(() => {
    thoughtEmitter.emitTaskCreated({
      taskId,
      title: 'Code Review: Authentication Module',
      subtasks: [
        { id: 'st-security', title: 'Security', status: 'pending' },
        { id: 'st-performance', title: 'Performance', status: 'pending' },
        { id: 'st-style', title: 'Style', status: 'pending' }
      ],
      progress: 0,
      timestamp: new Date().toISOString()
    });
  }, 500);

  // Step 3: Orchestrator plans (t=1s)
  setTimeout(() => {
    thoughtEmitter.emitAgentActive({
      agentId: 'agent-orchestrator-1',
      agentRole: 'orchestrator',
      timestamp: new Date().toISOString()
    });

    thoughtEmitter.emitThoughtAdded({
      sessionId,
      thought: {
        id: `${sessionId}-thought-1`,
        thoughtNumber: 1,
        totalThoughts: 5,
        thought: 'S1|P|—|Task decomposition: spawn 3 specialist agents for parallel code review (security, performance, style)',
        timestamp: new Date().toISOString(),
        nextThoughtNeeded: true
      },
      parentId: null,
      agentId: 'agent-orchestrator-1',
      agentRole: 'orchestrator',
      taskId
    });
  }, 1000);

  // Step 4: Spawn specialist agents (t=2s)
  setTimeout(() => {
    thoughtEmitter.emitAgentSpawned({
      agentId: 'agent-reviewer-security',
      agentRole: 'reviewer',
      taskId,
      timestamp: new Date().toISOString()
    });

    thoughtEmitter.emitAgentSpawned({
      agentId: 'agent-reviewer-perf',
      agentRole: 'reviewer',
      taskId,
      timestamp: new Date().toISOString()
    });

    thoughtEmitter.emitAgentSpawned({
      agentId: 'agent-reviewer-style',
      agentRole: 'reviewer',
      taskId,
      timestamp: new Date().toISOString()
    });
  }, 2000);

  // Step 5: Security agent works (t=3s)
  setTimeout(() => {
    thoughtEmitter.emitAgentActive({
      agentId: 'agent-reviewer-security',
      agentRole: 'reviewer',
      timestamp: new Date().toISOString()
    });

    thoughtEmitter.emitThoughtAdded({
      sessionId,
      thought: {
        id: `${sessionId}-thought-2`,
        thoughtNumber: 2,
        totalThoughts: 5,
        thought: 'S2|E|S1|Security review: Found SQL injection vulnerability in user input handler at line 42. Recommend parameterized queries.',
        timestamp: new Date().toISOString(),
        nextThoughtNeeded: true
      },
      parentId: `${sessionId}-thought-1`,
      agentId: 'agent-reviewer-security',
      agentRole: 'reviewer',
      taskId
    });

    // Update task progress
    thoughtEmitter.emitTaskUpdated({
      taskId,
      title: 'Code Review: Authentication Module',
      subtasks: [
        { id: 'st-security', title: 'Security', status: 'completed', assignedTo: 'agent-reviewer-security' },
        { id: 'st-performance', title: 'Performance', status: 'in_progress' },
        { id: 'st-style', title: 'Style', status: 'pending' }
      ],
      progress: 0.33,
      timestamp: new Date().toISOString()
    });
  }, 3000);

  // Step 6: Performance agent works (t=3.5s, parallel)
  setTimeout(() => {
    thoughtEmitter.emitAgentActive({
      agentId: 'agent-reviewer-perf',
      agentRole: 'reviewer',
      timestamp: new Date().toISOString()
    });

    thoughtEmitter.emitThoughtAdded({
      sessionId,
      thought: {
        id: `${sessionId}-thought-3`,
        thoughtNumber: 3,
        totalThoughts: 5,
        thought: 'S3|E|S1|Performance analysis: Hash computation in hot path. Move to async background job. Est 40% latency reduction.',
        timestamp: new Date().toISOString(),
        nextThoughtNeeded: true
      },
      parentId: `${sessionId}-thought-1`,
      agentId: 'agent-reviewer-perf',
      agentRole: 'reviewer',
      taskId
    });

    thoughtEmitter.emitTaskUpdated({
      taskId,
      title: 'Code Review: Authentication Module',
      subtasks: [
        { id: 'st-security', title: 'Security', status: 'completed', assignedTo: 'agent-reviewer-security' },
        { id: 'st-performance', title: 'Performance', status: 'completed', assignedTo: 'agent-reviewer-perf' },
        { id: 'st-style', title: 'Style', status: 'in_progress' }
      ],
      progress: 0.66,
      timestamp: new Date().toISOString()
    });
  }, 3500);

  // Step 7: Style agent works (t=4s, parallel)
  setTimeout(() => {
    thoughtEmitter.emitAgentActive({
      agentId: 'agent-reviewer-style',
      agentRole: 'reviewer',
      timestamp: new Date().toISOString()
    });

    thoughtEmitter.emitThoughtAdded({
      sessionId,
      thought: {
        id: `${sessionId}-thought-4`,
        thoughtNumber: 4,
        totalThoughts: 5,
        thought: 'S4|E|S1|Style validation: Inconsistent error handling patterns. 3 functions use throw, 2 use return codes. Recommend standardization.',
        timestamp: new Date().toISOString(),
        nextThoughtNeeded: true
      },
      parentId: `${sessionId}-thought-1`,
      agentId: 'agent-reviewer-style',
      agentRole: 'reviewer',
      taskId
    });

    thoughtEmitter.emitTaskUpdated({
      taskId,
      title: 'Code Review: Authentication Module',
      subtasks: [
        { id: 'st-security', title: 'Security', status: 'completed', assignedTo: 'agent-reviewer-security' },
        { id: 'st-performance', title: 'Performance', status: 'completed', assignedTo: 'agent-reviewer-perf' },
        { id: 'st-style', title: 'Style', status: 'completed', assignedTo: 'agent-reviewer-style' }
      ],
      progress: 1.0,
      timestamp: new Date().toISOString()
    });
  }, 4000);

  // Step 8: Orchestrator synthesizes (t=5s)
  setTimeout(() => {
    thoughtEmitter.emitAgentActive({
      agentId: 'agent-orchestrator-1',
      agentRole: 'orchestrator',
      timestamp: new Date().toISOString()
    });

    thoughtEmitter.emitThoughtAdded({
      sessionId,
      thought: {
        id: `${sessionId}-thought-5`,
        thoughtNumber: 5,
        totalThoughts: 5,
        thought: 'S5|C|S2-S4|Synthesis: Critical security issue (SQL injection) requires immediate fix. Performance optimization valuable but not blocking. Style inconsistency should be addressed with linting rules.',
        timestamp: new Date().toISOString(),
        nextThoughtNeeded: false
      },
      parentId: `${sessionId}-thought-1`,
      agentId: 'agent-orchestrator-1',
      agentRole: 'orchestrator',
      taskId
    });

    thoughtEmitter.emitTaskCompleted({
      taskId,
      timestamp: new Date().toISOString()
    });
  }, 5000);

  console.log('[Test] Mock collaborative session events queued');
}

/**
 * Emit a more complex session with branching exploration
 */
export function emitMockBranchingSession() {
  const sessionId = 'demo-branching-session';
  const taskId = 'task-architecture-design';

  // Architect spawns
  thoughtEmitter.emitAgentSpawned({
    agentId: 'agent-architect-1',
    agentRole: 'architect',
    timestamp: new Date().toISOString()
  });

  thoughtEmitter.emitTaskCreated({
    taskId,
    title: 'Design: Authentication Architecture',
    subtasks: [
      { id: 'st-explore', title: 'Explore Options', status: 'in_progress' },
      { id: 'st-decide', title: 'Make Decision', status: 'pending' }
    ],
    progress: 0.25,
    timestamp: new Date().toISOString()
  });

  // Main thought
  setTimeout(() => {
    thoughtEmitter.emitThoughtAdded({
      sessionId,
      thought: {
        id: `${sessionId}-thought-1`,
        thoughtNumber: 1,
        totalThoughts: 5,
        thought: 'S1|Q|—|Choose auth strategy: JWT vs Sessions vs OAuth? Explore each in parallel branches.',
        timestamp: new Date().toISOString(),
        nextThoughtNeeded: true
      },
      parentId: null,
      agentId: 'agent-architect-1',
      agentRole: 'architect',
      taskId
    });
  }, 1000);

  // Spawn researcher agents for each branch
  setTimeout(() => {
    ['jwt', 'sessions', 'oauth'].forEach((approach, idx) => {
      thoughtEmitter.emitAgentSpawned({
        agentId: `agent-researcher-${approach}`,
        agentRole: 'researcher',
        taskId,
        timestamp: new Date().toISOString()
      });
    });
  }, 2000);

  // Each researcher explores in parallel (branched thoughts)
  setTimeout(() => {
    thoughtEmitter.emitThoughtAdded({
      sessionId,
      thought: {
        id: `${sessionId}-thought-2-jwt`,
        thoughtNumber: 2,
        totalThoughts: 5,
        thought: 'S2|E|S1|JWT: Stateless, scales horizontally. Cons: Token revocation complex, size overhead.',
        timestamp: new Date().toISOString(),
        branchId: 'jwt-exploration',
        branchFromThought: 1,
        nextThoughtNeeded: true
      },
      parentId: `${sessionId}-thought-1`,
      agentId: 'agent-researcher-jwt',
      agentRole: 'researcher',
      taskId
    });

    thoughtEmitter.emitThoughtAdded({
      sessionId,
      thought: {
        id: `${sessionId}-thought-2-sessions`,
        thoughtNumber: 3,
        totalThoughts: 5,
        thought: 'S3|E|S1|Sessions: Simple, secure. Cons: Server-side storage required, harder to scale.',
        timestamp: new Date().toISOString(),
        branchId: 'session-exploration',
        branchFromThought: 1,
        nextThoughtNeeded: true
      },
      parentId: `${sessionId}-thought-1`,
      agentId: 'agent-researcher-sessions',
      agentRole: 'researcher',
      taskId
    });
  }, 3500);

  console.log('[Test] Mock branching session events queued');
}
