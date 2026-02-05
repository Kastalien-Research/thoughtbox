/**
 * Anchor Parser
 *
 * Parses semantic anchor syntax from thought text: @keyword:SN or @keyword:SN-SN
 * Implements SPEC-003: Cross-Session Reference System
 *
 * Design Decision D1: Convention-only (no validation during creation)
 */

export interface Anchor {
  /** Raw anchor text as it appears: "@keyword:S25" */
  raw: string;

  /** Keyword used for session search: "keyword" */
  keyword: string;

  /** Thought reference: "S25" or "S25-S30" */
  thoughtRef: string;

  /** Parsed thought numbers: [25] or [25,26,27,28,29,30] */
  thoughtNumbers: number[];
}

export class AnchorParser {
  // Matches @keyword:SN or @keyword:SN-SN
  private anchorPattern = /@([\w-]+):(S\d+(?:-S\d+)?)/g;

  /**
   * Parse all anchors from text
   * Returns array of parsed anchors (may be empty)
   */
  parse(text: string): Anchor[] {
    const anchors: Anchor[] = [];
    let match;

    // Reset regex state
    this.anchorPattern.lastIndex = 0;

    while ((match = this.anchorPattern.exec(text)) !== null) {
      const keyword = match[1];
      const thoughtRef = match[2];
      const thoughtNumbers = this.parseThoughtRef(thoughtRef);

      anchors.push({
        raw: match[0],
        keyword,
        thoughtRef,
        thoughtNumbers,
      });
    }

    return anchors;
  }

  /**
   * Parse thought reference into numbers
   * "S25" → [25]
   * "S25-S30" → [25, 26, 27, 28, 29, 30]
   */
  private parseThoughtRef(ref: string): number[] {
    if (ref.includes("-")) {
      // Range: S25-S30
      const [start, end] = ref
        .split("-")
        .map((s) => parseInt(s.replace("S", "")));

      if (isNaN(start) || isNaN(end) || end < start) {
        return [];
      }

      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    } else {
      // Single: S25
      const num = parseInt(ref.replace("S", ""));
      return isNaN(num) ? [] : [num];
    }
  }
}
