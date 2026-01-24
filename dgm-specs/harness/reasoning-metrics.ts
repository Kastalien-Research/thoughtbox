/**
 * Metrics Calculation for Reasoning Quality Evaluation
 *
 * Calculates correctness, process transparency, and overall scores.
 */

import type {
  ReasoningTask,
  TaskScore,
  ProcessMetrics,
  ControlTrace,
  TreatmentTrace,
  LLMJudgeMetric,
} from './reasoning-types.js';

/**
 * Evaluate correctness for exact-match tasks
 */
function evaluateExactMatch(correctAnswer: string, actualAnswer: string): number {
  // Normalize whitespace and case for comparison
  const normalize = (s: string) => s.trim().toLowerCase();
  return normalize(correctAnswer) === normalize(actualAnswer) ? 100 : 0;
}

/**
 * Evaluate correctness using a rubric
 * Returns percentage of total possible points
 */
function evaluateRubric(
  rubric: Record<string, number>,
  actualAnswer: string
): number {
  // For now, this is a simplified scoring based on keywords
  // In a full implementation, you might want LLM-based rubric evaluation
  const totalPoints = Object.values(rubric).reduce((sum, points) => sum + points, 0);
  let earnedPoints = 0;

  // Check if answer mentions each rubric dimension (naive keyword matching)
  for (const [dimension, points] of Object.entries(rubric)) {
    // Convert dimension name to searchable keywords
    const keywords = dimension.split('-').map(k => k.toLowerCase());
    const answerLower = actualAnswer.toLowerCase();

    // Award points if any keyword appears in the answer
    if (keywords.some(kw => answerLower.includes(kw))) {
      earnedPoints += points;
    }
  }

  return (earnedPoints / totalPoints) * 100;
}

/**
 * Evaluate correctness based on task configuration
 */
export function evaluateCorrectness(
  task: ReasoningTask,
  actualAnswer: string
): number {
  if (task.correctAnswer) {
    return evaluateExactMatch(task.correctAnswer, actualAnswer);
  } else if (task.scoringRubric) {
    return evaluateRubric(task.scoringRubric, actualAnswer);
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
 */
export function calculateTaskScore(
  task: ReasoningTask,
  finalAnswer: string,
  llmJudge: LLMJudgeMetric,
  processMetrics: ProcessMetrics
): TaskScore {
  const correctness = evaluateCorrectness(task, finalAnswer);
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
