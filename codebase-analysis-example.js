#!/usr/bin/env node

/**
 * Comprehensive Codebase Discovery Analysis Example
 *
 * Demonstrates the full workflow for analyzing a codebase using Thoughtbox:
 * 1. Initialize a session
 * 2. Record structured thoughts about codebase architecture
 * 3. Create branching analyses for different aspects
 * 4. Record revisions to refine understanding
 * 5. Export and analyze findings
 */

import { GatewayHandler } from './dist/gateway/gateway-handler.js';
import { ToolRegistry } from './dist/tool-registry.js';
import { InitToolHandler } from './dist/init/tool-handler.js';
import { ThoughtHandler } from './dist/thought-handler.js';
import { NotebookHandler } from './dist/notebook/index.js';
import { SessionHandler } from './dist/sessions/index.js';
import { MentalModelsHandler } from './dist/mental-models/index.js';
import { FileSystemStorage } from './dist/persistence/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runAnalysis() {
  console.log('='.repeat(80));
  console.log('THOUGHTBOX CODEBASE DISCOVERY ANALYSIS');
  console.log('='.repeat(80));
  console.log();

  // Create storage
  const storagePath = path.join(__dirname, '.thoughtbox');
  const storage = new FileSystemStorage({
    basePath: storagePath,
    project: 'thoughtbox-analysis'
  });

  // Create tool registry
  const toolRegistry = new ToolRegistry();

  // Create handlers
  const initToolHandler = new InitToolHandler({ storage, toolRegistry });
  const thoughtHandler = new ThoughtHandler({ storage, toolRegistry });
  const notebookHandler = new NotebookHandler({ storage, toolRegistry });
  const sessionHandler = new SessionHandler({ storage, toolRegistry });
  const mentalModelsHandler = new MentalModelsHandler({ storage, toolRegistry });

  // Create gateway handler
  const gatewayHandler = new GatewayHandler({
    toolRegistry,
    initToolHandler,
    thoughtHandler,
    notebookHandler,
    sessionHandler,
    mentalModelsHandler,
    storage,
  });

  try {
    // SECTION 1: Initialize Session
    console.log('SECTION 1: SESSION INITIALIZATION');
    console.log('-'.repeat(80));

    const startResult = await gatewayHandler.handle({
      operation: 'start_new',
      args: {
        project: 'thoughtbox',
        task: 'codebase-discovery',
        aspect: 'gateway-architecture',
        domain: 'architecture',
      },
    });

    // Parse response - it might be text or JSON
    let sessionData = null;
    try {
      sessionData = JSON.parse(startResult.content[0].text);
    } catch {
      // If not JSON, just extract the text
      sessionData = { text: startResult.content[0].text };
    }

    console.log('✓ New session started');
    console.log(`  Response: ${startResult.content[0].text.substring(0, 100)}`);
    console.log();

    // Load cipher
    console.log('Loading cipher notation system...');
    const cipherResult = await gatewayHandler.handle({
      operation: 'cipher',
      args: {},
    });
    console.log('✓ Cipher loaded');
    console.log();

    // SECTION 2: Record Core Architecture Understanding
    console.log('SECTION 2: CORE ARCHITECTURE ANALYSIS');
    console.log('-'.repeat(80));

    const thoughts = [
      {
        num: 1,
        content: `Gateway Handler Architecture: The thoughtbox_gateway is a single always-enabled routing tool that implements progressive disclosure stages (STAGE_0_ENTRY → STAGE_1_INIT_COMPLETE → STAGE_2_CIPHER_LOADED → STAGE_3_DOMAIN_ACTIVE). This pattern solves the MCP tool list refresh problem by providing a single stable entry point that internally gates access to underlying handlers.`,
        next: true
      },
      {
        num: 2,
        content: `Handler Delegation: The gateway routes operations to specialized handlers: InitToolHandler (navigation), ThoughtHandler (reasoning), NotebookHandler (literate programming), SessionHandler (session management), MentalModelsHandler (reasoning frameworks). Each handler manages a specific domain of functionality.`,
        next: true
      },
      {
        num: 3,
        content: `Storage Layer: FileSystemStorage implements ThoughtboxStorage interface with structured persistence using time-partitioned directories (monthly/weekly/daily granularity). Sessions are stored in projects/[project]/sessions/[partition]/[session-id]/ with manifest.json and numbered thought files.`,
        next: true
      },
      {
        num: 4,
        content: `Thought Structure: Each thought is a node in a linked structure supporting: main chain (sequential thoughts), branches (parallel explorations), and revisions (refinements). ThoughtHandler uses LinkedThoughtStore for in-memory indexing with write-through persistence.`,
        next: false
      }
    ];

    let sessionId = null;
    for (const thought of thoughts) {
      const result = await gatewayHandler.handle({
        operation: 'thought',
        args: {
          thought: thought.content,
          nextThoughtNeeded: thought.next,
          thoughtNumber: thought.num,
          sessionTitle: 'Codebase Discovery: Gateway Architecture',
          sessionTags: ['component:gateway', 'analysis:architecture', 'scope:implementation'],
          verbose: true,
        },
      });

      if (!result.isError) {
        const thoughtResult = JSON.parse(result.content[0].text);
        sessionId = thoughtResult.sessionId;
        console.log(`✓ Thought ${thought.num} recorded`);
        console.log(`  "${thought.content.substring(0, 60)}..."`);
      }
    }
    console.log();

    // SECTION 3: Branch Analysis
    console.log('SECTION 3: PARALLEL ANALYSIS (BRANCHES)');
    console.log('-'.repeat(80));

    const branches = [
      {
        id: 'error-handling',
        from: 2,
        content: `Error Handling in Delegation: The gateway transforms handler responses to ToolResponse format, catching errors from downstream handlers. Stage validation occurs before routing, preventing invalid operation access. Each handler returns isError flag for graceful error propagation.`,
      },
      {
        id: 'stage-progression',
        from: 1,
        content: `Stage Progression Logic: Operations have required stages and advancement targets. advanceSessionStage() moves per-session state forward while also updating global ToolRegistry stage. This prevents sub-agents from bypassing progressive disclosure while maintaining backward compatibility.`,
      },
      {
        id: 'performance',
        from: 3,
        content: `Performance Considerations: FileSystemStorage uses LinkedThoughtStore for O(1) thought lookups by number. Time-based partitioning keeps directory listings manageable. JSON serialization preserves full structure for complex branching patterns without additional indexing overhead.`,
      }
    ];

    let branchCount = 0;
    for (const branch of branches) {
      const result = await gatewayHandler.handle({
        operation: 'thought',
        args: {
          thought: branch.content,
          nextThoughtNeeded: false,
          branchId: branch.id,
          branchFromThought: branch.from,
          verbose: false,
        },
      });

      if (!result.isError) {
        branchCount++;
        console.log(`✓ Branch '${branch.id}' created from thought ${branch.from}`);
        console.log(`  "${branch.content.substring(0, 50)}..."`);
      }
    }
    console.log();

    // SECTION 4: Revisions and Refinements
    console.log('SECTION 4: REVISIONS AND REFINEMENTS');
    console.log('-'.repeat(80));

    const revisions = [
      {
        thoughtNum: 3,
        revised: 1,
        content: `REFINED: The gateway pattern actually provides triple benefits: (1) bypasses tool refresh issues, (2) enables granular stage-based access control, (3) allows dynamic tool discovery through operation-based triggers. The stage mechanism is enforced at gateway level, making it defense-in-depth.`,
      },
      {
        thoughtNum: 4,
        revised: 2,
        content: `REFINED: Handler coordination uses dependency injection pattern - each handler receives storage, toolRegistry, and optional discoveryRegistry. This loose coupling allows handlers to evolve independently while maintaining consistent interface through gateway routing.`,
      }
    ];

    for (const rev of revisions) {
      const result = await gatewayHandler.handle({
        operation: 'thought',
        args: {
          thought: rev.content,
          nextThoughtNeeded: false,
          isRevision: true,
          revisesThought: rev.revised,
          verbose: false,
        },
      });

      if (!result.isError) {
        console.log(`✓ Revision of thought ${rev.revised} recorded`);
        console.log(`  "${rev.content.substring(0, 50)}..."`);
      }
    }
    console.log();

    // SECTION 5: Analyze Session Structure
    console.log('SECTION 5: SESSION ANALYSIS');
    console.log('-'.repeat(80));

    const structure = await gatewayHandler.handle({
      operation: 'get_structure',
      args: {},
    });

    if (!structure.isError && structure.content[0]?.type === 'text') {
      const structureData = JSON.parse(structure.content[0].text);
      console.log(`✓ Session Structure Retrieved:`);
      console.log(`  Total thoughts: ${structureData.totalThoughts}`);
      console.log(`  Main chain length: ${structureData.mainChain.length}`);
      console.log(`  Branches: ${structureData.branchCount}`);
      console.log(`  Revisions: ${structureData.revisionCount}`);
      if (structureData.branchCount > 0) {
        console.log(`  Branch IDs: ${Object.keys(structureData.branches).join(', ')}`);
      }
    }
    console.log();

    // SECTION 6: Summary
    console.log('='.repeat(80));
    console.log('ANALYSIS SUMMARY');
    console.log('='.repeat(80));
    console.log();
    console.log('Session Details:');
    console.log(`  • Session ID: ${sessionId}`);
    console.log(`  • Core thoughts: 4`);
    console.log(`  • Branches created: ${branchCount}`);
    console.log(`  • Revisions applied: ${revisions.length}`);
    console.log();
    console.log('Key Findings:');
    console.log(`  1. Gateway pattern provides multi-layer benefit (routing, access control, discovery)`);
    console.log(`  2. Handler delegation enables clean separation of concerns`);
    console.log(`  3. Storage layer uses time-partitioned directory structure for scalability`);
    console.log(`  4. Thought linking (main chain + branches + revisions) supports non-linear reasoning`);
    console.log();
    console.log('Next Steps:');
    console.log(`  • Use 'session.extract_learnings' to summarize insights`);
    console.log(`  • Create additional branches for: error handling, testing, deployment`);
    console.log(`  • Use 'deep_analysis' to identify cognitive patterns`);
    console.log(`  • Export session with 'session.export' for documentation`);
    console.log();
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Analysis failed:', error);
    process.exit(1);
  }
}

// Run the analysis
runAnalysis();
