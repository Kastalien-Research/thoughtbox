/**
 * Metrics Calculation for Reasoning Quality Evaluation
 *
 * Calculates correctness, process transparency, and overall scores.
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  ReasoningTask,
  TaskScore,
  ProcessMetrics,
  ControlTrace,
  TreatmentTrace,
  LLMJudgeMetric,
} from './reasoning-types.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Extract final answer from full reasoning using LLM
 *
 * Uses Haiku to semantically extract the answer, avoiding brittle regex.
 * Cost: ~$0.001 per extraction (negligible compared to agent runs)
 */
async function extractAnswerWithLLM(
  task: ReasoningTask,
  fullReasoning: string
): Promise<string> {
  const prompt = `Extract ONLY the final answer from the following reasoning.

TASK:
${task.prompt}

FULL REASONING:
${fullReasoning}

Instructions:
- Respond with ONLY the final answer (e.g., "Alice", "yes", "ClickHouse", etc.)
- Do NOT include explanation, justification, or additional text
- Extract the conclusive answer, not intermediate steps
- If multiple possible answers, extract the one the reasoning concludes with

Final Answer:`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 100,  // Answers should be short
      temperature: 0.0,  // Deterministic
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in extraction response');
    }

    return textContent.text.trim();
  } catch (error) {
    console.error('LLM extraction failed:', error);
    // Fallback: return last paragraph of reasoning
    const paragraphs = fullReasoning.split(/\n\n+/).filter(p => p.trim().length > 0);
    return paragraphs[paragraphs.length - 1] || '';
  }
}

/**
 * Evaluate correctness for exact-match tasks using LLM-extracted answer
 */
async function evaluateExactMatch(
  task: ReasoningTask,
  fullReasoning: string
): Promise<number> {
  const extractedAnswer = await extractAnswerWithLLM(task, fullReasoning);
  const correctAnswer = task.correctAnswer!;

  // Normalize whitespace and case for comparison
  const normalize = (s: string) => s.trim().toLowerCase();
  const match = normalize(correctAnswer) === normalize(extractedAnswer);

  // Also check if correct answer is contained in extracted answer (partial match)
  const partialMatch = !match && normalize(extractedAnswer).includes(normalize(correctAnswer));

  if (match) return 100;
  if (partialMatch) return 75;  // Partial credit if answer is present but has extra text
  return 0;
}

/**
 * Grade a single rubric dimension using LLM
 *
 * Uses Haiku to semantically evaluate whether reasoning addressed a dimension.
 * Returns a score from 1-10.
 */
async function gradeDimension(
  dimension: string,
  fullReasoning: string,
  task: ReasoningTask
): Promise<number> {
  // Convert dimension-name to readable description
  const dimensionDesc = dimension.split('-').join(' ');

  const prompt = `Evaluate whether the following reasoning adequately addresses this criterion:

CRITERION: ${dimensionDesc}

TASK:
${task.prompt}

REASONING:
${fullReasoning}

Did the reasoning address "${dimensionDesc}"?

Rate from 1-10 where:
- 1-3: Not addressed or superficial treatment
- 4-6: Partially addressed with some depth
- 7-9: Well addressed with good detail
- 10: Exceptionally thorough treatment

Respond with ONLY a number from 1-10, no explanation.

Score:`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 10,  // Just need a number
      temperature: 0.0,  // Deterministic
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      console.warn(`No text content in dimension grading for: ${dimension}`);
      return 5;  // Neutral score on error
    }

    const scoreText = textContent.text.trim();
    const score = parseInt(scoreText, 10);

    if (isNaN(score) || score < 1 || score > 10) {
      console.warn(`Invalid score "${scoreText}" for dimension: ${dimension}`);
      return 5;  // Neutral score on parse error
    }

    return score;

  } catch (error) {
    console.error(`LLM grading failed for dimension ${dimension}:`, error);
    return 5;  // Neutral score on error
  }
}

/**
 * Evaluate correctness using a rubric on full reasoning
 *
 * Uses LLM to semantically evaluate each rubric dimension.
 * For rubric tasks, we evaluate the FULL reasoning, not an extracted snippet.
 */
async function evaluateRubric(
  task: ReasoningTask,
  rubric: Record<string, number>,
  fullReasoning: string
): Promise<number> {
  const totalPoints = Object.values(rubric).reduce((sum, points) => sum + points, 0);

  // Grade all dimensions in parallel
  const dimensionScores = await Promise.all(
    Object.entries(rubric).map(async ([dimension, points]) => {
      const score = await gradeDimension(dimension, fullReasoning, task);
      // Normalize from 1-10 to 0-points (proportional)
      const earnedPoints = ((score - 1) / 9) * points;  // Map 1-10 to 0-points
      return earnedPoints;
    })
  );

  const earnedPoints = dimensionScores.reduce((sum, points) => sum + points, 0);

  return (earnedPoints / totalPoints) * 100;
}

/**
 * Evaluate correctness based on task configuration
 *
 * Two-track approach:
 * - Exact-match tasks: Use LLM extraction (semantic, robust)
 * - Rubric tasks: Evaluate full reasoning directly (no extraction needed)
 */
export async function evaluateCorrectness(
  task: ReasoningTask,
  fullReasoning: string
): Promise<number> {
  if (task.correctAnswer) {
    // Exact-match task: Extract answer using LLM
    return await evaluateExactMatch(task, fullReasoning);
  } else if (task.scoringRubric) {
    // Rubric task: Evaluate full reasoning with LLM grading
    return await evaluateRubric(task, task.scoringRubric, fullReasoning);
  } else {
    // No correctness criteria defined, return 50 as neutral
    console.warn(`Task ${task.id} has no correctness criteria`);
    return 50;
  }
}

/**
 * Calculate process metrics from control trace
 *
 * Measures how transparent and structured the reasoning process is.
 * This is intentionally a lower weight (10%) since quality judging is the primary signal.
 */
export function calculateProcessMetricsControl(trace: ControlTrace): ProcessMetrics {
  const messages = trace.assistantMessages;
  const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
  const avgLength = messages.length > 0 ? totalLength / messages.length : 0;
  const fullText = messages.map(m => m.content).join('\n');

  // Check for structured thinking patterns (bullets, numbering, sections)
  const hasStructuredThinking = messages.some(msg =>
    /^[-*•]\s/m.test(msg.content) ||  // Bullet points
    /^\d+\.\s/m.test(msg.content) ||  // Numbered lists
    /^#{1,3}\s/m.test(msg.content)    // Headers
  );

  // Check for explicit reasoning markers (shows deliberate thinking)
  const hasReasoningMarkers = /(?:let me think|let's|first|second|consider|note that|importantly|however)/i.test(fullText);

  // Check for step-by-step breakdown
  const hasStepByStep = /step \d+/i.test(fullText) || /^\d+\.\s+/m.test(fullText);

  // Build transparency score with more nuanced criteria
  let transparencyScore = 30;  // Lower baseline (not everyone gets high score)

  // Structured thinking (max +25)
  if (hasStructuredThinking) {
    if (hasStepByStep) transparencyScore += 25;
    else transparencyScore += 15;
  }

  // Explicit reasoning (max +20)
  if (hasReasoningMarkers) transparencyScore += 20;

  // Message count (max +15)
  if (messages.length >= 5) transparencyScore += 15;
  else if (messages.length >= 3) transparencyScore += 10;
  else if (messages.length >= 2) transparencyScore += 5;

  // Average detail level (max +15)
  if (avgLength > 1000) transparencyScore += 15;
  else if (avgLength > 500) transparencyScore += 10;
  else if (avgLength > 200) transparencyScore += 5;

  // Cap at 100
  transparencyScore = Math.min(100, transparencyScore);

  return {
    messageCount: messages.length,
    avgMessageLength: avgLength,
    hasStructuredThinking,
    transparencyScore,
  };
}

/**
 * Calculate process metrics from treatment trace (with Thoughtbox)
 *
 * Awards additional transparency for actual Thoughtbox usage.
 */
export function calculateProcessMetricsTreatment(trace: TreatmentTrace): ProcessMetrics {
  const baseMetrics = calculateProcessMetricsControl(trace);

  // Add Thoughtbox-specific metrics
  if (trace.thoughtboxSession) {
    const session = trace.thoughtboxSession;

    baseMetrics.thoughtboxUsage = {
      thoughtsRecorded: session.thoughts.length,
      mentalModelsUsed: session.mentalModelsUsed,
      branchesCreated: session.branchesCreated,
      sessionId: session.sessionId,
    };

    // Boost transparency score based on Thoughtbox usage (more graduated)
    let boost = 0;

    // Thoughts recorded (max +15)
    if (session.thoughts.length >= 5) boost += 15;
    else if (session.thoughts.length >= 3) boost += 10;
    else if (session.thoughts.length >= 1) boost += 5;

    // Mental models used (max +10)
    if (session.mentalModelsUsed.length >= 2) boost += 10;
    else if (session.mentalModelsUsed.length >= 1) boost += 5;

    // Branches created (max +10)
    if (session.branchesCreated >= 2) boost += 10;
    else if (session.branchesCreated >= 1) boost += 5;

    baseMetrics.transparencyScore = Math.min(100, baseMetrics.transparencyScore + boost);
  }

  return baseMetrics;
}

/**
 * Compute overall score using weighted combination
 *
 * Weights:
 * - Correctness: 70%
 * - Quality (LLM judge): 20%
 * - Process transparency: 10%
 */
export function computeOverallScore(
  correctness: number,
  qualityScore: number,
  processScore: number
): TaskScore {
  const weights = {
    correctness: 0.70,
    quality: 0.20,
    process: 0.10,
  };

  const overallScore =
    correctness * weights.correctness +
    qualityScore * weights.quality +
    processScore * weights.process;

  return {
    correctness,
    qualityScore,
    processScore,
    overallScore,
  };
}

/**
 * Calculate complete task score from all metrics
 *
 * Now uses fullReasoning for both correctness and quality evaluation.
 */
export async function calculateTaskScore(
  task: ReasoningTask,
  fullReasoning: string,
  llmJudge: LLMJudgeMetric,
  processMetrics: ProcessMetrics
): Promise<TaskScore> {
  const correctness = await evaluateCorrectness(task, fullReasoning);
  const qualityScore = llmJudge.overall;
  const processScore = processMetrics.transparencyScore;

  return computeOverallScore(correctness, qualityScore, processScore);
}

/**
 * Format task score for display
 */
export function formatTaskScore(score: TaskScore): string {
  return `
  Score Breakdown:
    Correctness:  ${score.correctness.toFixed(1)} (70% weight)
    Quality:      ${score.qualityScore.toFixed(1)} (20% weight)
    Process:      ${score.processScore.toFixed(1)} (10% weight)
    Overall:      ${score.overallScore.toFixed(1)}
  `.trim();
}

/**
 * Calculate delta between treatment and control scores
 */
export function calculateScoreDelta(
  treatment: TaskScore,
  control: TaskScore
): TaskScore {
  return {
    correctness: treatment.correctness - control.correctness,
    qualityScore: treatment.qualityScore - control.qualityScore,
    processScore: treatment.processScore - control.processScore,
    overallScore: treatment.overallScore - control.overallScore,
  };
}

/**
 * Format score delta for display
 */
export function formatScoreDelta(delta: TaskScore): string {
  const format = (val: number) => (val >= 0 ? '+' : '') + val.toFixed(1);

  return `
  Delta (Treatment - Control):
    Correctness:  ${format(delta.correctness)}
    Quality:      ${format(delta.qualityScore)}
    Process:      ${format(delta.processScore)}
    Overall:      ${format(delta.overallScore)}
  `.trim();
}
