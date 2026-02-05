/**
 * Alerts Operation
 *
 * Gets active/firing alerts from Prometheus.
 */

import type { PrometheusClient } from '../prometheus-client.js';

export interface AlertsArgs {
  state?: 'firing' | 'pending' | 'all';
}

export interface AlertInfo {
  name: string;
  state: 'firing' | 'pending' | 'inactive';
  severity?: string;
  summary?: string;
  description?: string;
  activeAt?: string;
  value?: string;
}

export interface AlertsResult {
  alerts: AlertInfo[];
  firing: number;
  pending: number;
}

export async function getAlerts(
  args: AlertsArgs,
  prometheusClient: PrometheusClient
): Promise<AlertsResult> {
  const stateFilter = args.state ?? 'all';

  const result = await prometheusClient.alerts();

  if (result.status !== 'success' || !result.data) {
    throw new Error(result.error ?? 'Failed to fetch alerts');
  }

  const allAlerts = result.data.alerts.map((alert) => ({
    name: alert.labels.alertname ?? 'unknown',
    state: alert.state,
    severity: alert.labels.severity,
    summary: alert.annotations.summary,
    description: alert.annotations.description,
    activeAt: alert.activeAt,
    value: alert.value,
  }));

  // Filter by state if requested
  let filtered = allAlerts;
  if (stateFilter !== 'all') {
    filtered = allAlerts.filter((a) => a.state === stateFilter);
  }

  const firingCount = allAlerts.filter((a) => a.state === 'firing').length;
  const pendingCount = allAlerts.filter((a) => a.state === 'pending').length;

  return {
    alerts: filtered,
    firing: firingCount,
    pending: pendingCount,
  };
}
