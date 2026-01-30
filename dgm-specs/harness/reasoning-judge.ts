/**
 * LLM-as-Judge for Reasoning Quality Evaluation
 *
 * Uses Claude Haiku to evaluate the quality of reasoning across multiple dimensions.
 * Cost-effective at ~$0.001 per judgment vs ~$0.015 for Sonnet.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { LLMJudgeMetric, ReasoningTask } from './reasoning-types.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Judge prompt template for evaluating reasoning quality
 */
function createJudgePrompt(task: ReasoningTask, reasoning: string): string {
  return `You are evaluating the quality of reasoning for a task. Rate the response across four dimensions on a scale of 1-10.

TASK:
${task.prompt}

RESPONSE TO EVALUATE:
${reasoning}

EVALUATION CRITERIA:

1. **Thoroughness** (1-10): How complete is the reasoning?
   - 10: Explores all relevant angles, considers edge cases, addresses all parts of the problem
   - 5: Covers main points but misses some important considerations
   - 1: Superficial or incomplete reasoning

2. **Coherence** (1-10): How well-structured and logical is the reasoning?
   - 10: Clear logical flow, well-organized, easy to follow
   - 5: Mostly logical but some jumps or unclear transitions
   - 1: Disorganized, hard to follow, or contains logical errors

3. **Insight** (1-10): How deep is the analysis?
   - 10: Shows deep understanding, identifies non-obvious connections, goes beyond surface level
   - 5: Adequate understanding but stays at surface level
   - 1: Shallow or misses key insights

4. **Specificity** (1-10): How concrete vs generic is the reasoning?
   - 10: Uses specific examples, concrete details, precise language
   - 5: Mix of specific and generic statements
   - 1: Mostly generic or vague statements

Respond with ONLY a JSON object in this exact format:
{
  "thoroughness": <score 1-10>,
  "coherence": <score 1-10>,
  "insight": <score 1-10>,
  "specificity": <score 1-10>,
  "justification": "<brief explanation of your scores>"
}`;
}

/**
 * Parse judge response and normalize scores to 0-100 scale
 */
function parseJudgeResponse(response: string): Omit<LLMJudgeMetric, 'rawResponse'> {
  try {
    // Extract JSON from response (might have markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate scores are in range
    const scores = ['thoroughness', 'coherence', 'insight', 'specificity'];
    for (const score of scores) {
      if (typeof parsed[score] !== 'number' || parsed[score] < 1 || parsed[score] > 10) {
        throw new Error(`Invalid score for ${score}: ${parsed[score]}`);
      }
    }

    // Normalize from 1-10 scale to 0-100 scale
    const normalize = (score: number) => ((score - 1) / 9) * 100;

    return {
      thoroughness: normalize(parsed.thoroughness),
      coherence: normalize(parsed.coherence),
      insight: normalize(parsed.insight),
      specificity: normalize(parsed.specificity),
      overall: (
        normalize(parsed.thoroughness) +
        normalize(parsed.coherence) +
        normalize(parsed.insight) +
        normalize(parsed.specificity)
      ) / 4,
    };
  } catch (error) {
    console.error('Failed to parse judge response:', error);
    // Return zeros on parse failure
    return {
      thoroughness: 0,
      coherence: 0,
      insight: 0,
      specificity: 0,
      overall: 0,
    };
  }
}

/**
 * Evaluate reasoning quality using LLM-as-judge
 *
 * @param task - The reasoning task
 * @param reasoning - The agent's reasoning to evaluate
 * @returns Quality metrics on 0-100 scale
 */
export async function judgeLLMQuality(
  task: ReasoningTask,
  reasoning: string
): Promise<LLMJudgeMetric> {
  const prompt = createJudgePrompt(task, reasoning);

  let rawResponse = '';
  let retries = 0;
  const maxRetries = 1;

  while (retries <= maxRetries) {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        temperature: 0.0,  // Deterministic for consistency
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      // Extract text content
      const textContent = message.content.find(block => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in response');
      }

      rawResponse = textContent.text;
      const scores = parseJudgeResponse(rawResponse);

      return {
        ...scores,
        rawResponse,
      };
    } catch (error) {
      console.error(`Judge call failed (attempt ${retries + 1}/${maxRetries + 1}):`, error);
      retries++;

      if (retries > maxRetries) {
        // Return zeros on final failure
        return {
          thoroughness: 0,
          coherence: 0,
          insight: 0,
          specificity: 0,
          overall: 0,
          rawResponse: `Error: ${error}`,
        };
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Should never reach here, but TypeScript needs it
  return {
    thoroughness: 0,
    coherence: 0,
    insight: 0,
    specificity: 0,
    overall: 0,
    rawResponse: 'Unexpected error',
  };
}

/**
 * Format judge metrics for display
 */
export function formatJudgeMetrics(metrics: LLMJudgeMetric): string {
  return `
  Quality Scores (0-100):
    Thoroughness: ${metrics.thoroughness.toFixed(1)}
    Coherence:    ${metrics.coherence.toFixed(1)}
    Insight:      ${metrics.insight.toFixed(1)}
    Specificity:  ${metrics.specificity.toFixed(1)}
    Overall:      ${metrics.overall.toFixed(1)}
  `.trim();
}
