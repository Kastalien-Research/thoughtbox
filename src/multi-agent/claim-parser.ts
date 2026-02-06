/**
 * Claim Parser — Extract structured claims from thought text
 *
 * Follows the AnchorParser pattern from src/references/anchor-parser.ts.
 * Parses CLAIM:, PREMISE:, REFUTE: prefixes and turnstile (⊢) notation.
 *
 * @module src/multi-agent/claim-parser
 */

/**
 * A structured claim extracted from thought text.
 */
export interface ExtractedClaim {
  /** Type of claim: 'claim', 'premise', or 'refute' */
  type: 'claim' | 'premise' | 'refute';
  /** The claim content text */
  content: string;
  /** Whether this claim is negated (contains ¬) */
  negated: boolean;
  /** References to other thoughts ([S1], [S2], etc.) */
  references: string[];
  /** The raw matched text */
  raw: string;
}

/**
 * A formal derivation parsed from turnstile notation.
 * Format: P₁, P₂ ⊢ C
 */
export interface Derivation {
  /** Premise strings */
  premises: string[];
  /** Conclusion string */
  conclusion: string;
  /** The raw matched text */
  raw: string;
}

/**
 * Result of parsing a thought for claims.
 */
export interface ParseResult {
  claims: ExtractedClaim[];
  derivations: Derivation[];
}

/**
 * Patterns for extracting claims.
 */
const CLAIM_PATTERN = /^(CLAIM|PREMISE|REFUTE):\s*(.+)$/gm;
const REF_PATTERN = /\[S\d+(?:-S\d+)?\]/g;
const NEGATION_PATTERN = /¬/;

/**
 * Pattern for turnstile derivation: P₁, P₂ ⊢ C
 * Supports subscript numbers (₀-₉) and regular numbers.
 */
const TURNSTILE_PATTERN = /(.+?)\s*⊢\s*(.+)/;

/**
 * Parse all claims and derivations from thought text.
 *
 * @param text - The thought text to parse
 * @returns Extracted claims and derivations
 */
export function parseClaims(text: string): ParseResult {
  const claims: ExtractedClaim[] = [];
  const derivations: Derivation[] = [];

  // Extract CLAIM/PREMISE/REFUTE prefixed lines
  let match: RegExpExecArray | null;

  // Reset regex state for each call
  CLAIM_PATTERN.lastIndex = 0;

  while ((match = CLAIM_PATTERN.exec(text)) !== null) {
    const typeStr = match[1].toLowerCase() as 'claim' | 'premise' | 'refute';
    const content = match[2].trim();
    const references = extractReferences(content);
    const negated = NEGATION_PATTERN.test(content);

    claims.push({
      type: typeStr,
      content,
      negated,
      references,
      raw: match[0],
    });
  }

  // Extract turnstile derivations
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    const turnstileMatch = TURNSTILE_PATTERN.exec(trimmed);
    if (turnstileMatch) {
      const premisesStr = turnstileMatch[1].trim();
      const conclusion = turnstileMatch[2].trim();

      // Split premises by comma, handling subscript numbers
      const premises = premisesStr
        .split(/,\s*/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

      derivations.push({
        premises,
        conclusion,
        raw: trimmed,
      });
    }
  }

  return { claims, derivations };
}

/**
 * Extract [SN] references from text.
 */
function extractReferences(text: string): string[] {
  const matches = text.match(REF_PATTERN);
  return matches ?? [];
}

/**
 * Normalize a claim content string for comparison.
 * Strips whitespace, lowercases, and removes references.
 */
export function normalizeClaim(content: string): string {
  return content
    .replace(REF_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
