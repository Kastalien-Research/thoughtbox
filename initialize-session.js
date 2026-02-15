#!/usr/bin/env node

/**
 * Initialize a Thoughtbox Session for Codebase Discovery Analysis
 *
 * This script demonstrates how to use the thoughtbox_gateway to:
 * 1. Start a new session with title "Codebase Discovery Analysis"
 * 2. Load the cipher notation system
 * 3. Record initial thoughts for codebase exploration
 */

import { GatewayHandler } from './dist/gateway/gateway-handler.js';
import { ToolRegistry, DisclosureStage } from './dist/tool-registry.js';
import { InitToolHandler } from './dist/init/tool-handler.js';
import { ThoughtHandler } from './dist/thought-handler.js';
import { NotebookHandler } from './dist/notebook/index.js';
import { SessionHandler } from './dist/sessions/index.js';
import { MentalModelsHandler } from './dist/mental-models/index.js';
import { FileSystemStorage } from './dist/persistence/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initializeSession() {
  console.log('Initializing Thoughtbox Session...\n');

  // Create storage
  const storagePath = path.join(__dirname, '.thoughtbox');
  const storage = new FileSystemStorage(storagePath);

  // Create tool registry
  const toolRegistry = new ToolRegistry();

  // Create handlers
  const initToolHandler = new InitToolHandler({
    storage,
    toolRegistry,
  });

  const thoughtHandler = new ThoughtHandler({
    storage,
    toolRegistry,
  });

  const notebookHandler = new NotebookHandler({
    storage,
    toolRegistry,
  });

  const sessionHandler = new SessionHandler({
    storage,
    toolRegistry,
  });

  const mentalModelsHandler = new MentalModelsHandler({
    storage,
    toolRegistry,
  });

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
    // Step 1: Start a new session
    console.log('Step 1: Starting new session with title "Codebase Discovery Analysis"');
    console.log('-'.repeat(70));

    const startNewResult = await gatewayHandler.handle({
      operation: 'start_new',
      args: {
        project: 'thoughtbox',
        task: 'codebase-analysis',
        aspect: 'discovery',
        domain: 'architecture',
      },
    });

    console.log('Result:');
    startNewResult.content.forEach(block => {
      if (block.type === 'text') {
        console.log(block.text);
      }
    });

    if (startNewResult.isError) {
      console.error('Error starting session');
      process.exit(1);
    }

    // Step 2: Load the cipher notation system
    console.log('\n' + '='.repeat(70));
    console.log('Step 2: Loading cipher notation system');
    console.log('-'.repeat(70));

    const cipherResult = await gatewayHandler.handle({
      operation: 'cipher',
      args: {},
    });

    console.log('Cipher loaded successfully');
    console.log('Preview of cipher content:');
    if (cipherResult.content[0]?.type === 'text') {
      const cipherText = cipherResult.content[0].text;
      console.log(cipherText.substring(0, 500) + '...\n[truncated]\n');
    }

    // Step 3: Record initial thoughts for codebase discovery
    console.log('='.repeat(70));
    console.log('Step 3: Recording initial thoughts for codebase discovery');
    console.log('-'.repeat(70));

    const initialThought = await gatewayHandler.handle({
      operation: 'thought',
      args: {
        thought: 'The Thoughtbox codebase is an MCP server providing cognitive enhancement tools. Key components include: gateway routing, structured reasoning with thoughts, mental models for reasoning frameworks, and persistent storage. The architecture uses TypeScript with progressive disclosure stages for feature unlock.',
        nextThoughtNeeded: true,
        sessionTitle: 'Codebase Discovery Analysis',
        sessionTags: ['project:thoughtbox', 'task:analysis', 'type:codebase-discovery'],
        verbose: true,
      },
    });

    console.log('Initial thought recorded successfully');
    if (initialThought.content[0]?.type === 'text') {
      console.log(initialThought.content[0].text.substring(0, 500) + '...\n');
    }

    // Step 4: Read thoughts back
    console.log('='.repeat(70));
    console.log('Step 4: Reading recorded thoughts');
    console.log('-'.repeat(70));

    const readThoughts = await gatewayHandler.handle({
      operation: 'read_thoughts',
      args: {
        last: 1,
      },
    });

    console.log('Thoughts retrieved:');
    if (readThoughts.content[0]?.type === 'text') {
      console.log(readThoughts.content[0].text);
    }

    // Step 5: Get session structure
    console.log('\n' + '='.repeat(70));
    console.log('Step 5: Getting session structure');
    console.log('-'.repeat(70));

    const structure = await gatewayHandler.handle({
      operation: 'get_structure',
      args: {},
    });

    console.log('Session structure:');
    if (structure.content[0]?.type === 'text') {
      console.log(structure.content[0].text);
    }

    console.log('\n' + '='.repeat(70));
    console.log('Session initialization complete!');
    console.log('='.repeat(70));
    console.log('\nYou can now use the session to:');
    console.log('- Record more thoughts with the "thought" operation');
    console.log('- Branch exploration with branchId and branchFromThought');
    console.log('- Revise thoughts with isRevision and revisesThought');
    console.log('- Analyze patterns with the "deep_analysis" operation');
    console.log('- Export findings with session operations');

  } catch (error) {
    console.error('Error during initialization:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeSession();
