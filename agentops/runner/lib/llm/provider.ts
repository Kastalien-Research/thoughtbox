/**
 * LLM Provider Implementation
 * Handles Anthropic and OpenAI API calls
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { LLMConfig, LLMResponse, LLMProvider } from './types.js';
import { calculateCost } from './pricing.js';

/**
 * Get LLM configuration from environment
 */
export function getLLMConfig(): LLMConfig | null {
  const provider =
    (process.env.AGENTOPS_LLM_PROVIDER as LLMProvider) || 'anthropic';
  const model =
    process.env.AGENTOPS_LLM_MODEL || 'claude-3-5-sonnet-20241022';

  // Try provider-specific key first
  if (provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      return { provider: 'anthropic', model, apiKey };
    }
  }

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      return { provider: 'openai', model, apiKey };
    }
  }

  // Fallback: try any available key
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    return {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      apiKey: anthropicKey,
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return {
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      apiKey: openaiKey,
    };
  }

  return null;
}

/**
 * Call LLM with prompt and context
 */
export async function callLLM(
  config: LLMConfig,
  prompt: string,
  context: string
): Promise<LLMResponse> {
  if (config.provider === 'anthropic') {
    return callAnthropic(config, prompt, context);
  } else if (config.provider === 'openai') {
    return callOpenAI(config, prompt, context);
  } else {
    throw new Error(`Unknown LLM provider: ${config.provider}`);
  }
}

/**
 * Call Anthropic API
 */
async function callAnthropic(
  config: LLMConfig,
  prompt: string,
  context: string
): Promise<LLMResponse> {
  const client = new Anthropic({ apiKey: config.apiKey });

  const fullPrompt = `${prompt}\n\n<context>\n${context}\n</context>`;

  const response = await client.messages.create({
    model: config.model,
    max_tokens: 4096,
    messages: [{ role: 'user', content: fullPrompt }],
  });

  const content =
    response.content[0].type === 'text' ? response.content[0].text : '';

  // Calculate cost with accurate model-specific pricing
  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const { costUsd, metadata } = calculateCost(config.model, inputTokens, outputTokens);

  return {
    content,
    usage: {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd_calculated: costUsd,
      cost_metadata: metadata,
    },
  };
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  config: LLMConfig,
  prompt: string,
  context: string
): Promise<LLMResponse> {
  const client = new OpenAI({ apiKey: config.apiKey });

  const fullPrompt = `${prompt}\n\nContext:\n${context}`;

  const response = await client.chat.completions.create({
    model: config.model,
    messages: [{ role: 'user', content: fullPrompt }],
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content || '';

  // Calculate cost (OpenAI models use hardcoded fallback for now)
  const promptTokens = response.usage?.prompt_tokens || 0;
  const completionTokens = response.usage?.completion_tokens || 0;
  const costUsd = promptTokens * 0.00001 + completionTokens * 0.00003;

  return {
    content,
    usage: {
      input_tokens: promptTokens,
      output_tokens: completionTokens,
      cost_usd_calculated: costUsd,
      cost_metadata: {
        model: config.model,
        inputPricePerMToken: 10.0,
        outputPricePerMToken: 30.0,
        pricingSource: 'https://openai.com/pricing',
        pricingDate: '2026-01-29',
      },
    },
  };
}
