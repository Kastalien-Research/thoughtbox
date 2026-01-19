/**
 * Prometheus HTTP API Client
 *
 * Wraps the Prometheus HTTP API for querying metrics and alerts.
 * Used by the observability_gateway tool.
 */

export interface PrometheusConfig {
  url: string;
  timeout?: number;
}

export interface PrometheusQueryResult {
  status: 'success' | 'error';
  data?: {
    resultType: 'vector' | 'matrix' | 'scalar' | 'string';
    result: PrometheusMetric[];
  };
  errorType?: string;
  error?: string;
}

export interface PrometheusMetric {
  metric: Record<string, string>;
  value?: [number, string]; // [timestamp, value] for instant queries
  values?: [number, string][]; // [[timestamp, value], ...] for range queries
}

export interface PrometheusAlert {
  labels: Record<string, string>;
  annotations: Record<string, string>;
  state: 'firing' | 'pending' | 'inactive';
  activeAt?: string;
  value?: string;
}

export interface PrometheusAlertsResult {
  status: 'success' | 'error';
  data?: {
    alerts: PrometheusAlert[];
  };
  errorType?: string;
  error?: string;
}

export interface PrometheusTargetsResult {
  status: 'success' | 'error';
  data?: {
    activeTargets: Array<{
      health: 'up' | 'down' | 'unknown';
      labels: Record<string, string>;
      lastScrape: string;
      scrapeUrl: string;
    }>;
  };
}

export class PrometheusClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: PrometheusConfig) {
    this.baseUrl = config.url.replace(/\/$/, '');
    this.timeout = config.timeout ?? 10000;
  }

  /**
   * Execute an instant query (single point in time)
   */
  async query(promql: string, time?: string): Promise<PrometheusQueryResult> {
    const params = new URLSearchParams({ query: promql });
    if (time) {
      params.set('time', time);
    }

    return this.fetch<PrometheusQueryResult>(`/api/v1/query?${params}`);
  }

  /**
   * Execute a range query (time series)
   */
  async queryRange(
    promql: string,
    start: string,
    end: string,
    step?: string
  ): Promise<PrometheusQueryResult> {
    const params = new URLSearchParams({
      query: promql,
      start,
      end,
      step: step ?? '15s',
    });

    return this.fetch<PrometheusQueryResult>(`/api/v1/query_range?${params}`);
  }

  /**
   * Get active alerts from Prometheus alertmanager integration
   */
  async alerts(): Promise<PrometheusAlertsResult> {
    return this.fetch<PrometheusAlertsResult>('/api/v1/alerts');
  }

  /**
   * Get scrape targets and their health
   */
  async targets(): Promise<PrometheusTargetsResult> {
    return this.fetch<PrometheusTargetsResult>('/api/v1/targets');
  }

  /**
   * Check if Prometheus is reachable
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/-/healthy`, {
        signal: AbortSignal.timeout(this.timeout),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async fetch<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(`Prometheus API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }
}
