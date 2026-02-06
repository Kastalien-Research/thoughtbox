/**
 * Bootstrap state persistence
 * Location: .agentops-bootstrap/state.json
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { BootstrapState } from '../types.js';

const STATE_DIR = '.agentops-bootstrap';
const STATE_FILE = 'state.json';
const SUMMARY_FILE = 'summary.md';

export class StateManager {
  private stateDir: string;
  private stateFile: string;
  private summaryFile: string;

  constructor(rootDir: string = process.cwd()) {
    this.stateDir = path.join(rootDir, STATE_DIR);
    this.stateFile = path.join(this.stateDir, STATE_FILE);
    this.summaryFile = path.join(this.stateDir, SUMMARY_FILE);
  }

  /**
   * Initialize state directory and create new session
   */
  async init(): Promise<BootstrapState> {
    await fs.mkdir(this.stateDir, { recursive: true });

    const state: BootstrapState = {
      sessionId: this.generateSessionId(),
      phase: 'design',
      phaseStatus: {
        design: { complete: false },
        validate: { complete: false },
        orchestrate: { complete: false },
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      checkpoints: [],
    };

    await this.save(state);
    await this.updateSummary(state, 'Session initialized');

    return state;
  }

  /**
   * Load existing state from disk
   */
  async load(): Promise<BootstrapState | null> {
    try {
      const data = await fs.readFile(this.stateFile, 'utf-8');
      return JSON.parse(data) as BootstrapState;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  }

  /**
   * Check if state exists
   */
  async exists(): Promise<boolean> {
    try {
      await fs.access(this.stateFile);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Save state to disk
   */
  async save(state: BootstrapState): Promise<void> {
    state.lastUpdated = new Date().toISOString();
    await fs.writeFile(this.stateFile, JSON.stringify(state, null, 2), 'utf-8');
  }

  /**
   * Add checkpoint to state
   */
  async checkpoint(
    state: BootstrapState,
    description: string
  ): Promise<BootstrapState> {
    state.checkpoints.push({
      phase: state.phase,
      timestamp: new Date().toISOString(),
      description,
    });
    await this.save(state);
    await this.updateSummary(state, description);
    return state;
  }

  /**
   * Advance to next phase
   */
  async advancePhase(
    state: BootstrapState,
    nextPhase: 'validate' | 'orchestrate' | 'complete'
  ): Promise<BootstrapState> {
    // Mark current phase as complete
    if (state.phase !== 'complete') {
      state.phaseStatus[state.phase].complete = true;
      state.phaseStatus[state.phase].timestamp = new Date().toISOString();
    }

    // Advance to next phase
    state.phase = nextPhase;
    await this.save(state);
    await this.updateSummary(state, `Advanced to phase: ${nextPhase}`);

    return state;
  }

  /**
   * Update human-readable summary
   */
  private async updateSummary(
    state: BootstrapState,
    event: string
  ): Promise<void> {
    const summary = this.generateSummary(state, event);
    await fs.writeFile(this.summaryFile, summary, 'utf-8');
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(state: BootstrapState, latestEvent: string): string {
    const lines = [
      '# AgentOps Bootstrap Progress',
      '',
      `**Session ID:** ${state.sessionId}`,
      `**Current Phase:** ${state.phase}`,
      `**Created:** ${state.createdAt}`,
      `**Last Updated:** ${state.lastUpdated}`,
      '',
      '## Phase Status',
      '',
      `- [${state.phaseStatus.design.complete ? 'x' : ' '}] Design ${
        state.phaseStatus.design.timestamp
          ? `(completed: ${state.phaseStatus.design.timestamp})`
          : ''
      }`,
      `- [${state.phaseStatus.validate.complete ? 'x' : ' '}] Validate ${
        state.phaseStatus.validate.timestamp
          ? `(completed: ${state.phaseStatus.validate.timestamp})`
          : ''
      }`,
      `- [${state.phaseStatus.orchestrate.complete ? 'x' : ' '}] Orchestrate ${
        state.phaseStatus.orchestrate.timestamp
          ? `(completed: ${state.phaseStatus.orchestrate.timestamp})`
          : ''
      }`,
      '',
      '## Recent Checkpoints',
      '',
    ];

    // Add last 5 checkpoints
    const recentCheckpoints = state.checkpoints.slice(-5);
    for (const cp of recentCheckpoints) {
      lines.push(
        `- \`${cp.timestamp}\` [${cp.phase}] ${cp.description}`
      );
    }

    lines.push('');
    lines.push(`## Latest Event`);
    lines.push('');
    lines.push(`- ${latestEvent}`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `bootstrap_${timestamp}_${random}`;
  }
}
