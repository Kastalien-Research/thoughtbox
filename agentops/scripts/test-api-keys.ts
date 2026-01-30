#!/usr/bin/env tsx
/**
 * Test API key availability and authentication for AgentOps Phase 1
 * Usage: npx tsx agentops/scripts/test-api-keys.ts
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

interface TestResult {
  provider: string;
  available: boolean;
  authenticated?: boolean;
  model?: string;
  error?: string;
}

async function testAnthropicKey(): Promise<TestResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.AGENTOPS_LLM_MODEL;

  if (!apiKey) {
    return {
      provider: 'Anthropic',
      available: false,
      error: 'ANTHROPIC_API_KEY not set',
    };
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    });

    return {
      provider: 'Anthropic',
      available: true,
      authenticated: true,
      model: model || 'claude-3-5-sonnet-20241022',
    };
  } catch (error) {
    return {
      provider: 'Anthropic',
      available: true,
      authenticated: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function testOpenAIKey(): Promise<TestResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.AGENTOPS_LLM_MODEL;

  if (!apiKey) {
    return {
      provider: 'OpenAI',
      available: false,
      error: 'OPENAI_API_KEY not set',
    };
  }

  try {
    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model: model || 'gpt-4-turbo',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    });

    return {
      provider: 'OpenAI',
      available: true,
      authenticated: true,
      model: model || 'gpt-4-turbo',
    };
  } catch (error) {
    return {
      provider: 'OpenAI',
      available: true,
      authenticated: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  console.log('🔍 Testing API Keys for AgentOps Phase 1\n');

  // Check environment variables
  console.log('Environment Variables:');
  console.log(`  AGENTOPS_LLM_PROVIDER: ${process.env.AGENTOPS_LLM_PROVIDER || '(not set)'}`);
  console.log(`  AGENTOPS_LLM_MODEL: ${process.env.AGENTOPS_LLM_MODEL || '(not set)'}`);
  console.log(`  LANGSMITH_API_KEY: ${process.env.LANGSMITH_API_KEY ? '✓ set' : '✗ not set (optional)'}\n`);

  // Test providers
  const selectedProvider = process.env.AGENTOPS_LLM_PROVIDER;
  const results: TestResult[] = [];

  if (!selectedProvider || selectedProvider === 'anthropic') {
    console.log('Testing Anthropic...');
    const result = await testAnthropicKey();
    results.push(result);
    printResult(result);
  }

  if (!selectedProvider || selectedProvider === 'openai') {
    console.log('\nTesting OpenAI...');
    const result = await testOpenAIKey();
    results.push(result);
    printResult(result);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Summary:');
  const authenticated = results.filter(r => r.authenticated);
  if (authenticated.length === 0) {
    console.log('❌ No providers authenticated successfully');
    process.exit(1);
  } else {
    console.log(`✅ ${authenticated.length} provider(s) ready for Phase 1`);
    authenticated.forEach(r => {
      console.log(`   - ${r.provider}: ${r.model}`);
    });
  }
}

function printResult(result: TestResult) {
  if (!result.available) {
    console.log(`  ✗ ${result.error}`);
  } else if (result.authenticated) {
    console.log(`  ✓ Authenticated successfully`);
    console.log(`    Model: ${result.model}`);
  } else {
    console.log(`  ✗ Authentication failed`);
    console.log(`    Error: ${result.error}`);
  }
}

main().catch(console.error);
