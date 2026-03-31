/**
 * Signal Collection Types
 * Types for external signals (repo commits, arXiv papers, RSS feeds, HTML newsrooms)
 */

export interface SignalItem {
  source: string;        // "repo_commits" | "arxiv" | "openai_rss" | "html_newsroom" | etc
  title: string;
  url: string;
  published_at?: string; // ISO 8601
  summary?: string;
  tags?: string[];
}

export interface SignalCollection {
  signals: SignalItem[];
  metadata: {
    collected_at: string;
    sources_attempted: string[];
    sources_succeeded: string[];
    sources_failed: Array<{ source: string; error: string }>;
    total_signals: number;
    // NEW: Per-source observability
    signals_by_source: Record<string, number>;
    elapsed_ms_by_source: Record<string, number>;
  };
}
