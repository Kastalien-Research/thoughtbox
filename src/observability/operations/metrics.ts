/**
 * Metrics Query Operations
 *
 * Wraps Prometheus instant and range queries.
 */

import type { PrometheusClient, PrometheusQueryResult } from '../prometheus-client.js';

export interface MetricsArgs {
  query: string;
  time?: string;
}

export interface MetricsRangeArgs {
  query: string;
  start: string;
  end: string;
  step?: string;
}

export async function queryMetrics(
  args: MetricsArgs,
  prometheusClient: PrometheusClient
): Promise<PrometheusQueryResult> {
  if (!args.query) {
    throw new Error('Missing required argument: query');
  }

  return prometheusClient.query(args.query, args.time);
}

export async function queryMetricsRange(
  args: MetricsRangeArgs,
  prometheusClient: PrometheusClient
): Promise<PrometheusQueryResult> {
  if (!args.query) {
    throw new Error('Missing required argument: query');
  }
  if (!args.start) {
    throw new Error('Missing required argument: start');
  }
  if (!args.end) {
    throw new Error('Missing required argument: end');
  }

  return prometheusClient.queryRange(args.query, args.start, args.end, args.step);
}
