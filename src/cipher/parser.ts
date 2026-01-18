/**
 * Cipher Parser
 *
 * Deterministic extraction of thought structure from cipher-encoded content.
 * This is protocol processing, not inference - the parser extracts what the
 * cipher explicitly encodes.
 *
 * @module src/cipher/parser
 */

/**
 * Thought type markers from the cipher protocol
 */
export type ThoughtType = "H" | "E" | "C" | "Q" | "R" | "P" | "O" | "A" | "X" | "I";

export const THOUGHT_TYPE_NAMES: Record<ThoughtType, string> = {
  H: "hypothesis",
  E: "evidence",
  C: "conclusion",
  Q: "question",
  R: "revision",
  P: "plan",
  O: "observation",
  A: "assumption",
  X: "rejected",
  I: "insight", // Common in traces, adding for completeness
};

/**
 * Confidence level extracted from markers
 */
export interface ConfidenceMarker {
  level: "high" | "medium" | "low" | "specific";
  value?: number; // For (p=N) format
  raw: string; // Original marker
}

/**
 * Reference to another thought
 */
export interface ThoughtReference {
  thoughtNumber: number;
  type: "reference" | "revision" | "invalidation" | "builds-on" | "range-start" | "range-end";
}

/**
 * Result of parsing cipher-encoded content
 */
export interface ParsedCipher {
  /** Extracted thought number (from S47, etc.) */
  thoughtNumber?: number;

  /** Thought type marker (H, E, C, etc.) */
  type?: ThoughtType;

  /** All referenced thoughts */
  references: ThoughtReference[];

  /** Thought this revises (from ^[SN] or explicit refs field) */
  revises?: number;

  /** Thought this invalidates (from ×[SN]) */
  invalidates?: number;

  /** Thought this builds on (from +[SN]) */
  buildsOn?: number;

  /** Confidence markers found */
  confidence?: ConfidenceMarker;

  /** The content portion (after structure extraction) */
  content: string;

  /** Whether the step format was detected */
  usedStepFormat: boolean;

  /** Original raw input */
  raw: string;
}

/**
 * Regex patterns for cipher parsing
 */
const PATTERNS = {
  // Full step format: S47|H|S45|content or S47|H|—|content
  stepFormat: /^(S\d+)\|([HECQRPOAXI])\|([^|]*)\|(.*)$/s,

  // Thought ID: S47, S1, etc.
  thoughtId: /^S(\d+)$/,

  // Reference patterns in content
  simpleRef: /\[S(\d+)\]/g,
  rangeRef: /\[S(\d+)-S(\d+)\]/g,
  revisionRef: /\^?\[S(\d+)\]/g, // ^[S5] - revises
  invalidationRef: /[×x]\[S(\d+)\]/g, // ×[S5] - invalidates (× or x)
  buildsOnRef: /\+\[S(\d+)\]/g, // +[S5] - builds on

  // Confidence markers
  highConfidence: /\(!\)/g,
  mediumConfidence: /\(~\)/g,
  lowConfidence: /\(\?\)/g,
  specificConfidence: /\(p=([0-9.]+)\)/g,

  // Refs field patterns (in the |REFS| section)
  refsFieldSimple: /S(\d+)/g,
  refsFieldRange: /S(\d+)-S(\d+)/g,
  emptyRefs: /^[—\-]$/, // em-dash or hyphen means no refs
};

/**
 * Parse cipher-encoded thought content
 *
 * @param input - Raw thought content (may or may not use cipher format)
 * @returns Parsed structure with all extracted information
 */
export function parseCipher(input: string): ParsedCipher {
  const result: ParsedCipher = {
    references: [],
    content: input,
    usedStepFormat: false,
    raw: input,
  };

  // Try to match full step format first: S47|H|S45|content
  const stepMatch = input.match(PATTERNS.stepFormat);

  if (stepMatch) {
    result.usedStepFormat = true;
    const [, idPart, typePart, refsPart, contentPart] = stepMatch;

    // Extract thought number from ID
    const idMatch = idPart.match(PATTERNS.thoughtId);
    if (idMatch) {
      result.thoughtNumber = parseInt(idMatch[1], 10);
    }

    // Extract type
    if (isValidThoughtType(typePart)) {
      result.type = typePart;
    }

    // Parse refs field
    if (!PATTERNS.emptyRefs.test(refsPart)) {
      parseRefsField(refsPart, result);
    }

    // Content is everything after the last |
    result.content = contentPart;
  }

  // Scan content for inline references (even if step format was used)
  extractInlineReferences(result.content, result);

  // Extract confidence markers
  extractConfidence(result.content, result);

  return result;
}

/**
 * Parse the refs field (the third | section)
 */
function parseRefsField(refsField: string, result: ParsedCipher): void {
  // Check for range: S1-S3
  const rangeMatch = refsField.match(/S(\d+)-S(\d+)/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    result.references.push({ thoughtNumber: start, type: "range-start" });
    result.references.push({ thoughtNumber: end, type: "range-end" });
    // Add all numbers in range as references
    for (let i = start; i <= end; i++) {
      if (i !== start && i !== end) {
        result.references.push({ thoughtNumber: i, type: "reference" });
      }
    }
    return;
  }

  // Check for comma-separated refs: S1,S3,S5
  const simpleRefs = refsField.matchAll(/S(\d+)/g);
  for (const match of simpleRefs) {
    const num = parseInt(match[1], 10);
    result.references.push({ thoughtNumber: num, type: "reference" });
  }
}

/**
 * Extract references from content body
 */
function extractInlineReferences(content: string, result: ParsedCipher): void {
  // Revision markers: ^[S5]
  const revisionMatches = content.matchAll(/\^\[S(\d+)\]/g);
  for (const match of revisionMatches) {
    const num = parseInt(match[1], 10);
    result.revises = num;
    result.references.push({ thoughtNumber: num, type: "revision" });
  }

  // Invalidation markers: ×[S5] or x[S5]
  const invalidationMatches = content.matchAll(/[×x]\[S(\d+)\]/g);
  for (const match of invalidationMatches) {
    const num = parseInt(match[1], 10);
    result.invalidates = num;
    result.references.push({ thoughtNumber: num, type: "invalidation" });
  }

  // Builds-on markers: +[S5]
  const buildsOnMatches = content.matchAll(/\+\[S(\d+)\]/g);
  for (const match of buildsOnMatches) {
    const num = parseInt(match[1], 10);
    result.buildsOn = num;
    result.references.push({ thoughtNumber: num, type: "builds-on" });
  }

  // Range references: [S1-S3]
  const rangeMatches = content.matchAll(/\[S(\d+)-S(\d+)\]/g);
  for (const match of rangeMatches) {
    const start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);
    for (let i = start; i <= end; i++) {
      // Avoid duplicates
      if (!result.references.some((r) => r.thoughtNumber === i)) {
        result.references.push({ thoughtNumber: i, type: "reference" });
      }
    }
  }

  // Simple references: [S5] (but not if already captured as ^, ×, or +)
  const simpleMatches = content.matchAll(/(?<![×x^+])\[S(\d+)\]/g);
  for (const match of simpleMatches) {
    const num = parseInt(match[1], 10);
    // Avoid duplicates
    if (!result.references.some((r) => r.thoughtNumber === num)) {
      result.references.push({ thoughtNumber: num, type: "reference" });
    }
  }
}

/**
 * Extract confidence markers from content
 */
function extractConfidence(content: string, result: ParsedCipher): void {
  // Check for specific probability first: (p=0.7)
  const specificMatch = content.match(/\(p=([0-9.]+)\)/);
  if (specificMatch) {
    result.confidence = {
      level: "specific",
      value: parseFloat(specificMatch[1]),
      raw: specificMatch[0],
    };
    return;
  }

  // High confidence: (!)
  if (content.includes("(!)")) {
    result.confidence = { level: "high", raw: "(!)" };
    return;
  }

  // Medium confidence: (~)
  if (content.includes("(~)")) {
    result.confidence = { level: "medium", raw: "(~)" };
    return;
  }

  // Low confidence: (?)
  if (content.includes("(?)")) {
    result.confidence = { level: "low", raw: "(?)" };
    return;
  }
}

/**
 * Type guard for valid thought types
 */
function isValidThoughtType(type: string): type is ThoughtType {
  return ["H", "E", "C", "Q", "R", "P", "O", "A", "X", "I"].includes(type);
}

/**
 * Check if content appears to use cipher notation
 * (Heuristic for deciding whether to apply parsing)
 */
export function usesCipherNotation(content: string): boolean {
  // Check for step format
  if (PATTERNS.stepFormat.test(content)) {
    return true;
  }

  // Check for common cipher patterns
  const cipherIndicators = [
    /\[S\d+\]/, // References
    /\^\[S\d+\]/, // Revision markers
    /[×x]\[S\d+\]/, // Invalidation markers
    /\+\[S\d+\]/, // Builds-on markers
    /\(!\)|\(\?\)|\(~\)/, // Confidence markers
    /\b(bc|tf|hw|impl|hyp|ev|assm|obs|conf|contra)\b/, // Abbreviated vocabulary
    /[→←∴∵∧∨¬⊕⊖≈≠]/, // Logical operators
  ];

  return cipherIndicators.some((pattern) => pattern.test(content));
}

/**
 * Get unique referenced thought numbers (deduplicated)
 */
export function getReferencedThoughts(parsed: ParsedCipher): number[] {
  const unique = new Set(parsed.references.map((r) => r.thoughtNumber));
  return Array.from(unique).sort((a, b) => a - b);
}

/**
 * Get the "previous" thought number for linking
 * (Either explicitly referenced or thoughtNumber - 1)
 */
export function inferPreviousThought(parsed: ParsedCipher): number | null {
  // If this is a revision, link to the revised thought
  if (parsed.revises) {
    return parsed.revises;
  }

  // If there's an explicit reference in the refs field, use the first one
  const explicitRefs = parsed.references.filter(
    (r) => r.type === "reference" || r.type === "range-end"
  );
  if (explicitRefs.length > 0) {
    return Math.max(...explicitRefs.map((r) => r.thoughtNumber));
  }

  // Otherwise, if we have a thought number, previous is N-1
  if (parsed.thoughtNumber && parsed.thoughtNumber > 1) {
    return parsed.thoughtNumber - 1;
  }

  return null;
}
