/**
 * Daily Dev Brief Command
 * Generates daily digest with proposals and creates GitHub issue
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { GitHubClient, getGitHubContext } from './lib/github.js';
import {
  loadTemplate,
  renderTemplate,
  formatProposalsSummary,
  validateProposalsPayload,
} from './lib/template.js';
import { createTracingClient } from './lib/trace.js';
import { getLLMConfig } from './lib/llm/provider.js';
import { collectSignals } from './lib/sources/collect.js';
import { synthesizeProposals } from './lib/synthesis.js';
import { agentopsPath } from './lib/paths.js';
import type { ProposalsPayload, RunSummary, TemplateContext } from './types.js';
import type { SignalCollection } from './lib/sources/types.js';

export interface DailyBriefOptions {
  dryRun?: boolean;
  fixturesMode?: boolean;
  outputDir?: string;
}

const MIN_REAL_SIGNALS = 1;

function requireRealSignals(signals: SignalCollection): void {
  if (signals.metadata.sources_succeeded.length === 0) {
    throw new Error('Real daily brief requires at least one signal source to return data');
  }
  if (signals.signals.length < MIN_REAL_SIGNALS) {
    throw new Error(
      `Real daily brief requires at least ${MIN_REAL_SIGNALS} collected signal(s); got ${signals.signals.length}`
    );
  }
}

function runStatusForSignals(signals: SignalCollection | null): RunSummary['status'] {
  if (!signals) return 'SUCCEEDED';
  if (
    signals.metadata.sources_failed.length > 0 ||
    signals.metadata.sources_empty.length > 0
  ) {
    return 'PARTIAL';
  }
  return 'SUCCEEDED';
}

export async function runDailyDevBrief(
  options: DailyBriefOptions = {}
): Promise<void> {
  const startTime = Date.now();

  // Generate run ID
  const runId = `run_${new Date().toISOString().replace(/[:.]/g, '-')}_${Math.random().toString(36).substring(2, 8)}`;

  console.log(`\n🧠 Daily Thoughtbox Dev Brief`);
  console.log(`Run ID: ${runId}`);
  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  // Initialize tracing
  const tracer = createTracingClient(runId);
  tracer.startSpan('daily-dev-brief');

  try {
    // === Phase 1: Load proposals ===
    tracer.startSpan('load-proposals');
    console.log('📥 Loading proposals...');

    let proposalsData: ProposalsPayload;
    let digestBullets: string;
    let llmCost = 0;
    let collectedSignalsData: SignalCollection | null = null;
    const executionMode = options.fixturesMode ? 'fixture' : 'real';

    if (options.fixturesMode) {
      console.log('⚙️  FIXTURE MODE: Skipping signal collection and LLM calls');
      const fixturesPath = agentopsPath('fixtures/proposals.example.json');
      proposalsData = JSON.parse(await fs.readFile(fixturesPath, 'utf-8'));
      proposalsData.run_id = runId;
      proposalsData.generated_at = new Date().toISOString();

      digestBullets = [
        'Fixture mode: path and template wiring validation only',
        'RLM sampling implementation in progress',
        'Benchmarking context documents added',
        'AgentOps specs ready for bootstrap',
      ].map(item => `- ${item}`).join('\n');
    } else {
      const llmConfig = getLLMConfig();
      if (!llmConfig) {
        throw new Error(
          'Real AgentOps daily brief requires LLM configuration: set ANTHROPIC_API_KEY or OPENAI_API_KEY'
        );
      }

      tracer.startSpan('collect_signals');
      console.log('📡 Collecting signals...');
      const signals = await collectSignals();
      requireRealSignals(signals);
      collectedSignalsData = signals;
      console.log(`✅ Collected ${signals.signals.length} signals`);
      tracer.endSpan('collect_signals', 'ok');

      tracer.startSpan('synthesize');
      console.log('🤖 Synthesizing proposals...');

      const ghContext = options.dryRun
        ? { sha: 'dry-run-sha', ref: 'main', runId: 'dry-run-id', runNumber: '0', token: '' }
        : getGitHubContext();
      const [owner = 'Kastalien-Research', repo = 'thoughtbox'] =
        (process.env.GITHUB_REPOSITORY || 'Kastalien-Research/thoughtbox').split('/');

      const synthesis = await synthesizeProposals(
        signals,
        {
          owner,
          repo,
          ref: ghContext.ref.replace('refs/heads/', ''),
          sha: ghContext.sha,
        },
        { fixturesMode: false }
      );
      tracer.endSpan('synthesize', 'ok');

      llmCost = synthesis.llmCost;

      proposalsData = {
        run_id: runId,
        repo_ref: ghContext.ref.replace('refs/heads/', ''),
        git_sha: ghContext.sha,
        generated_at: new Date().toISOString(),
        proposals: synthesis.result.proposals,
      };

      digestBullets = synthesis.result.digest
        .map(item => `- [${item.title}](${item.url}) — ${item.why_it_matters}`)
        .join('\n');

      console.log(`✅ Generated ${proposalsData.proposals.length} proposals (est. cost: $${llmCost.toFixed(4)})`);
    }

    // Validate
    tracer.startSpan('validate');
    const errors = validateProposalsPayload(
      proposalsData,
      collectedSignalsData?.signals
    );
    if (errors.length > 0) {
      throw new Error(`Invalid proposals:\n${errors.join('\n')}`);
    }
    tracer.endSpan('validate', 'ok');

    console.log(`✅ Loaded ${proposalsData.proposals.length} proposals`);
    tracer.endSpan('load-proposals', 'ok');

    // === Phase 3: Render issue body ===
    tracer.startSpan('render-template');
    console.log('🎨 Rendering issue template...');

    const templatePath = agentopsPath('templates/daily_thoughtbox_dev_brief_issue.md');
    const template = await loadTemplate(templatePath);

    // Get GitHub context
    const ghContext = options.dryRun
      ? {
          sha: 'dry-run-sha',
          ref: 'main',
          runId: 'dry-run-id',
          runNumber: '0',
        }
      : getGitHubContext();

    // Build template context
    const dateLocal = new Date().toLocaleDateString('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const context: TemplateContext = {
      DATE_LOCAL: dateLocal,
      RUN_ID: runId,
      JOB_NAME: 'thoughtbox_daily_proposals',
      JOB_VERSION: '0.1.0',
      GIT_SHA: ghContext.sha,
      REPO_REF: ghContext.ref.replace('refs/heads/', ''),
      TRACE_URL: tracer.getTraceUrl(runId),
      ARTIFACT_INDEX_URL: options.dryRun
        ? '(dry run - no artifacts)'
        : `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${ghContext.runId}`,
      BUDGET_SUMMARY: 'max_cost=$10, max_minutes=30',
      SOURCES_SUMMARY:
        'Git log (last 7 days), open issues, open PRs, test failures, performance metrics',
      DIGEST_BULLETS: digestBullets,
      PROPOSALS_SUMMARY: formatProposalsSummary(proposalsData.proposals),
      PROPOSALS_JSON: JSON.stringify(proposalsData, null, 2),
      HUMAN_QUESTIONS_OR_NONE: 'None',
    };

    let issueBody = renderTemplate(template, context);

    if (options.fixturesMode) {
      issueBody = `> **FIXTURE MODE**: Generated with example data for path and template validation only.\n\n` + issueBody;
    }

    console.log('✅ Issue body rendered');
    tracer.endSpan('render-template', 'ok');

    // === Phase 4: Save artifacts ===
    tracer.startSpan('save-artifacts');
    console.log('💾 Saving artifacts...');

    const outputDir = options.outputDir || agentopsPath('runs', runId);
    await fs.mkdir(outputDir, { recursive: true });

    await fs.writeFile(
      path.join(outputDir, 'digest.md'),
      `# Daily Digest\n\n${digestBullets}`,
      'utf-8'
    );
    await fs.writeFile(
      path.join(outputDir, 'proposals.json'),
      JSON.stringify(proposalsData, null, 2),
      'utf-8'
    );
    await fs.writeFile(
      path.join(outputDir, 'issue_body.md'),
      issueBody,
      'utf-8'
    );

    // Save raw signals for reproducibility
    if (collectedSignalsData) {
      await fs.writeFile(
        path.join(outputDir, 'signals.json'),
        JSON.stringify(
          {
            collected_at: collectedSignalsData.metadata.collected_at,
            total_collected: collectedSignalsData.signals.length,
            signals: collectedSignalsData.signals,
            metadata: collectedSignalsData.metadata,
          },
          null,
          2
        )
      );
    }

    // Create run summary
    const endTime = Date.now();
    const runSummary: RunSummary = {
      run_id: runId,
      job_name: 'thoughtbox_daily_proposals',
      job_version: '0.1.0',
      execution_mode: executionMode,
      status: runStatusForSignals(collectedSignalsData),
      trigger: {
        type: options.dryRun ? 'manual' : 'schedule',
        source: 'github_actions',
        event: options.dryRun ? 'workflow_dispatch' : 'cron',
      },
      repo: {
        url: `https://github.com/${process.env.GITHUB_REPOSITORY || 'org/repo'}`,
        ref: context.REPO_REF,
        git_sha: context.GIT_SHA,
      },
      started_at: new Date(startTime).toISOString(),
      ended_at: new Date(endTime).toISOString(),
      budgets: {
        max_llm_cost_usd: 10.0,
        max_wall_clock_minutes: 30,
        max_tool_calls: 200,
      },
      metrics: {
        llm_cost_usd: llmCost,
        wall_clock_seconds: Math.floor((endTime - startTime) / 1000),
        sources_scanned: collectedSignalsData?.metadata.total_signals || 0,
        items_shortlisted: collectedSignalsData?.metadata.total_signals || 0,
        proposals_emitted: proposalsData.proposals.length,
      },
      signal_collection: collectedSignalsData ? {
        sources_attempted: collectedSignalsData.metadata.sources_attempted,
        sources_succeeded: collectedSignalsData.metadata.sources_succeeded,
        sources_failed: collectedSignalsData.metadata.sources_failed,
        sources_empty: collectedSignalsData.metadata.sources_empty,
      } : undefined,
      artifact_index: [
        { name: 'digest_md', path: 'digest.md' },
        { name: 'proposals_json', path: 'proposals.json' },
        { name: 'issue_body_md', path: 'issue_body.md' },
        ...(collectedSignalsData ? [{ name: 'signals_json', path: 'signals.json' }] : []),
        { name: 'run_summary_json', path: 'run_summary.json' },
      ],
      links: {
        trace: tracer.getTraceUrl(runId),
        workflow_run: context.ARTIFACT_INDEX_URL,
      },
      errors: collectedSignalsData
        ? [
            ...collectedSignalsData.metadata.sources_failed.map((failure) => ({
              phase: 'collect_signals',
              message: `${failure.source}: ${failure.error}`,
              timestamp: new Date(endTime).toISOString(),
            })),
            ...collectedSignalsData.metadata.sources_empty.map((empty) => ({
              phase: 'collect_signals',
              message: `${empty.source}: ${empty.reason}`,
              timestamp: new Date(endTime).toISOString(),
            })),
          ]
        : [],
    };

    await fs.writeFile(
      path.join(outputDir, 'run_summary.json'),
      JSON.stringify(runSummary, null, 2),
      'utf-8'
    );

    console.log(`✅ Artifacts saved to ${outputDir}`);
    tracer.endSpan('save-artifacts', 'ok');

    // === Phase 5: Create GitHub issue (if not dry run) ===
    if (!options.dryRun) {
      tracer.startSpan('create-issue');
      console.log('📮 Creating GitHub issue...');

      const gh = new GitHubClient(
        ghContext.token,
        process.env.GITHUB_REPOSITORY!.split('/')[0],
        process.env.GITHUB_REPOSITORY!.split('/')[1]
      );

      const issue = await gh.createIssue(
        `🧠 Thoughtbox Dev Brief — ${dateLocal}`,
        issueBody,
        ['agentops', 'dev-brief']
      );

      console.log(`✅ Issue created: ${issue.html_url}`);
      runSummary.links.issue = issue.html_url;

      // Update run summary with issue link
      await fs.writeFile(
        path.join(outputDir, 'run_summary.json'),
        JSON.stringify(runSummary, null, 2),
        'utf-8'
      );

      tracer.endSpan('create-issue', 'ok');
    } else {
      console.log('ℹ️  Dry run: skipping GitHub issue creation');
    }

    tracer.endSpan('daily-dev-brief', 'ok');

    console.log('\n✨ Daily dev brief completed successfully!');
    console.log(`📊 Run summary: ${path.join(outputDir, 'run_summary.json')}`);

    // Print trace summary
    console.log('\n📈 Trace summary:');
    tracer.getSummary().forEach((span) => {
      console.log(`  - ${span.name}: ${span.duration}ms (${span.status})`);
    });
  } catch (error) {
    tracer.endSpan('daily-dev-brief', 'error', (error as Error).message);
    console.error('\n❌ Error:', (error as Error).message);
    throw error;
  }
}
