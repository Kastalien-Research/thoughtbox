/**
 * Anchor Resolver
 *
 * Resolves semantic anchors to actual sessions using multi-strategy search.
 * Implements SPEC-003: Cross-Session Reference System
 *
 * Design Decision D4: Multi-strategy search with confidence scoring
 * Design Decision D5: Return candidates, client handles disambiguation
 * Design Decision D6: Lazy tag indexing for performance
 */

import type { Anchor } from "./anchor-parser.js";
import type { ThoughtboxStorage, Session } from "../persistence/index.js";

export interface SessionCandidate {
  sessionId: string;
  title: string;
  thoughtCount: number;
  createdAt: string;
  matchReason: "alias" | "tag" | "title";
  confidence: number; // 0.0 to 1.0
}

export interface ResolvedAnchor {
  anchor: Anchor;
  status: "resolved" | "ambiguous" | "unresolved";
  candidates: SessionCandidate[];
  selected?: {
    sessionId: string;
    thoughts: Array<{ thoughtNumber: number; thought: string }>;
  };
}

export class AnchorResolver {
  // D6: Lazy tag index (built on first search)
  private tagIndex: Map<string, string[]> | null = null;

  // D2: In-memory resolution cache
  private resolutionCache: Map<string, SessionCandidate[]> = new Map();

  constructor(
    private storage: ThoughtboxStorage,
    private aliasConfig?: Record<string, string>
  ) {}

  /**
   * Resolve anchor to session candidates
   */
  async resolve(anchor: Anchor): Promise<ResolvedAnchor> {
    // Check cache first (D2)
    const cacheKey = anchor.keyword;
    if (this.resolutionCache.has(cacheKey)) {
      return this.buildResult(anchor, this.resolutionCache.get(cacheKey)!);
    }

    // D4: Multi-strategy search
    const candidates: SessionCandidate[] = [];

    // Strategy 1: Alias exact match (confidence: 1.0)
    if (this.aliasConfig && this.aliasConfig[anchor.keyword]) {
      const aliasCandidate = await this.resolveViaAlias(
        anchor.keyword,
        this.aliasConfig[anchor.keyword]
      );
      if (aliasCandidate) {
        candidates.push(aliasCandidate);
      }
    }

    // Strategy 2: Tag exact match (confidence: 0.95)
    const tagCandidates = await this.resolveViaTag(anchor.keyword);
    candidates.push(...tagCandidates);

    // Strategy 3: Title word overlap (confidence: 0.60-0.90)
    if (candidates.length === 0 || candidates[0].confidence < 0.90) {
      const titleCandidates = await this.resolveViaTitle(anchor.keyword);
      candidates.push(...titleCandidates);
    }

    // Sort by confidence descending
    candidates.sort((a, b) => b.confidence - a.confidence);

    // Cache result
    this.resolutionCache.set(cacheKey, candidates);

    return this.buildResult(anchor, candidates);
  }

  /**
   * Build ResolvedAnchor from candidates
   * D5: Return candidates, client handles selection
   */
  private buildResult(
    anchor: Anchor,
    candidates: SessionCandidate[]
  ): ResolvedAnchor {
    // Filter by confidence threshold (D4)
    const qualified = candidates.filter((c) => c.confidence >= 0.60);

    if (qualified.length === 0) {
      return { anchor, status: "unresolved", candidates: [] };
    }

    if (qualified.length === 1 || qualified[0].confidence >= 0.95) {
      // Single high-confidence match - mark as resolved
      return {
        anchor,
        status: "resolved",
        candidates: qualified,
        selected: {
          sessionId: qualified[0].sessionId,
          thoughts: [], // Client can fetch thoughts via resource template if needed
        },
      };
    }

    // Multiple candidates - mark as ambiguous
    return {
      anchor,
      status: "ambiguous",
      candidates: qualified,
    };
  }

  /**
   * Strategy 1: Resolve via alias (D3: project-level aliases)
   */
  private async resolveViaAlias(
    keyword: string,
    sessionId: string
  ): Promise<SessionCandidate | null> {
    const session = await this.storage.getSession(sessionId);
    if (!session) return null;

    return {
      sessionId: session.id,
      title: session.title,
      thoughtCount: session.thoughtCount,
      createdAt: session.createdAt.toISOString(),
      matchReason: "alias",
      confidence: 1.0,
    };
  }

  /**
   * Strategy 2: Resolve via tag exact match
   * D6: Uses lazy tag index for O(1) lookup
   */
  private async resolveViaTag(keyword: string): Promise<SessionCandidate[]> {
    // Build index if needed
    if (!this.tagIndex) {
      await this.buildTagIndex();
    }

    const sessionIds = this.tagIndex!.get(keyword) || [];
    const candidates: SessionCandidate[] = [];

    for (const sessionId of sessionIds) {
      const session = await this.storage.getSession(sessionId);
      if (session) {
        candidates.push({
          sessionId: session.id,
          title: session.title,
          thoughtCount: session.thoughtCount,
          createdAt: session.createdAt.toISOString(),
          matchReason: "tag",
          confidence: 0.95,
        });
      }
    }

    return candidates;
  }

  /**
   * Strategy 3: Resolve via title fuzzy match
   * D4: Word overlap with confidence scoring
   */
  private async resolveViaTitle(keyword: string): Promise<SessionCandidate[]> {
    const allSessions = await this.storage.listSessions({ limit: 1000 });
    const candidates: SessionCandidate[] = [];

    for (const session of allSessions) {
      const similarity = this.calculateTitleSimilarity(keyword, session.title);

      if (similarity >= 0.60) {
        candidates.push({
          sessionId: session.id,
          title: session.title,
          thoughtCount: session.thoughtCount,
          createdAt: session.createdAt.toISOString(),
          matchReason: "title",
          confidence: similarity * 0.85, // Scale to 0.60-0.90 range
        });
      }
    }

    return candidates;
  }

  /**
   * D6: Build tag index for fast lookups
   */
  private async buildTagIndex(): Promise<void> {
    const index = new Map<string, string[]>();
    const allSessions = await this.storage.listSessions({ limit: 10000 });

    for (const session of allSessions) {
      if (session.tags) {
        for (const tag of session.tags) {
          if (!index.has(tag)) {
            index.set(tag, []);
          }
          index.get(tag)!.push(session.id);
        }
      }
    }

    this.tagIndex = index;
  }

  /**
   * D4: Title word overlap similarity
   * Returns confidence score 0.0-1.0
   */
  private calculateTitleSimilarity(keyword: string, title: string): number {
    // Normalize and split
    const keywordWords = keyword.toLowerCase().split(/[-_\s]+/);
    const titleWords = title.toLowerCase().split(/\s+/);

    // Count matches (word from keyword found in title)
    const matches = keywordWords.filter((kw) =>
      titleWords.some((tw) => tw.includes(kw) || kw.includes(tw))
    );

    // Similarity = matches / total keyword words
    return matches.length / keywordWords.length;
  }

  /**
   * Clear cache (useful when sessions are added/removed)
   */
  clearCache(): void {
    this.resolutionCache.clear();
    this.tagIndex = null;
  }
}
