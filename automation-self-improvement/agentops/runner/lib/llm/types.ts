/**
 * LLM Provider Types
 * Types for LLM configuration and responses
 */

import type { Proposal } from '../../types.js';

export type LLMProvider = 'anthropic' | 'openai';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cost_usd_calculated: number;  // Renamed for honesty
    cost_metadata: {                // NEW: pricing transparency
      model: string;
      inputPricePerMToken: number;
      outputPricePerMToken: number;
      pricingSource: string;
      pricingDate: string;
    };
  };
}

export interface SynthesisResult {
  digest: Array<{
    title: string;
    url: string;
    published_at: string;
    why_it_matters: string;
    tags: string[];
  }>;
  proposals: Proposal[];
}
