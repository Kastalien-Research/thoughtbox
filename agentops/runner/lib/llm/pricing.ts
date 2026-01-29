/**
 * LLM Pricing Configuration
 *
 * Pricing Maintenance:
 * 1. Check https://www.anthropic.com/pricing quarterly
 * 2. Update prices if changed
 * 3. Update lastUpdated date
 * 4. Run tests to verify calculations still correct
 * 5. Add new models as they're released
 *
 * Source: https://www.anthropic.com/pricing
 * Last updated: 2026-01-29
 */

export interface ModelPricing {
  inputPricePerMToken: number;
  outputPricePerMToken: number;
  /** For models with tiered pricing (e.g., Sonnet 4.5 >200K tokens) */
  largePricing?: {
    threshold: number;
    inputPricePerMToken: number;
    outputPricePerMToken: number;
  };
  source: string;
  lastUpdated: string;
}

export const ANTHROPIC_PRICING: Record<string, ModelPricing> = {
  'claude-opus-4-5-20251101': {
    inputPricePerMToken: 5.00,
    outputPricePerMToken: 25.00,
    source: 'https://www.anthropic.com/pricing',
    lastUpdated: '2026-01-29',
  },
  'claude-sonnet-4-5-20250929': {
    inputPricePerMToken: 3.00,
    outputPricePerMToken: 15.00,
    largePricing: {
      threshold: 200_000,
      inputPricePerMToken: 6.00,
      outputPricePerMToken: 22.50,
    },
    source: 'https://www.anthropic.com/pricing',
    lastUpdated: '2026-01-29',
  },
  'claude-haiku-4-5-20250919': {
    inputPricePerMToken: 1.00,
    outputPricePerMToken: 5.00,
    source: 'https://www.anthropic.com/pricing',
    lastUpdated: '2026-01-29',
  },
  // Legacy models (commonly used in config)
  'claude-3-5-sonnet-20241022': {
    inputPricePerMToken: 3.00,
    outputPricePerMToken: 15.00,
    source: 'https://www.anthropic.com/pricing',
    lastUpdated: '2026-01-29',
  },
};

/**
 * Calculate cost from token usage with accurate, model-specific pricing
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): {
  costUsd: number;
  metadata: {
    model: string;
    inputPricePerMToken: number;
    outputPricePerMToken: number;
    pricingSource: string;
    pricingDate: string;
  };
} {
  const pricing = ANTHROPIC_PRICING[model];

  if (!pricing) {
    console.warn(`No pricing found for model ${model}, using Sonnet 4.5 pricing as fallback`);
    const fallback = ANTHROPIC_PRICING['claude-sonnet-4-5-20250929'];

    return {
      costUsd: (inputTokens * fallback.inputPricePerMToken + outputTokens * fallback.outputPricePerMToken) / 1_000_000,
      metadata: {
        model,
        inputPricePerMToken: fallback.inputPricePerMToken,
        outputPricePerMToken: fallback.outputPricePerMToken,
        pricingSource: fallback.source,
        pricingDate: fallback.lastUpdated,
      },
    };
  }

  // Check if using large context pricing (Sonnet 4.5 only)
  let inputPrice = pricing.inputPricePerMToken;
  let outputPrice = pricing.outputPricePerMToken;

  if (pricing.largePricing && inputTokens > pricing.largePricing.threshold) {
    inputPrice = pricing.largePricing.inputPricePerMToken;
    outputPrice = pricing.largePricing.outputPricePerMToken;
  }

  return {
    costUsd: (inputTokens * inputPrice + outputTokens * outputPrice) / 1_000_000,
    metadata: {
      model,
      inputPricePerMToken: inputPrice,
      outputPricePerMToken: outputPrice,
      pricingSource: pricing.source,
      pricingDate: pricing.lastUpdated,
    },
  };
}
