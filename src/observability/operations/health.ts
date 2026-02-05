/**
 * Health Check Operation
 *
 * Checks health of thoughtbox and related services.
 */

import type { PrometheusClient } from '../prometheus-client.js';

export interface HealthArgs {
  services?: string[];
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'unknown';
  uptime?: string;
  version?: string;
  upstream_available?: boolean;
  active_connections?: number;
  targets_up?: number;
  targets_total?: number;
  database?: string;
  error?: string;
}

export interface HealthResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: Record<string, ServiceHealth>;
}

export async function checkHealth(
  args: HealthArgs,
  prometheusClient: PrometheusClient,
  thoughtboxUrl: string,
  grafanaUrl: string
): Promise<HealthResult> {
  const requestedServices = args.services ?? ['thoughtbox', 'sidecar', 'prometheus', 'grafana'];
  const services: Record<string, ServiceHealth> = {};

  const checks = await Promise.allSettled(
    requestedServices.map(async (service) => {
      switch (service) {
        case 'thoughtbox':
          return { name: service, health: await checkThoughtbox(thoughtboxUrl) };
        case 'sidecar':
          return { name: service, health: await checkSidecar(prometheusClient) };
        case 'prometheus':
          return { name: service, health: await checkPrometheus(prometheusClient) };
        case 'grafana':
          return { name: service, health: await checkGrafana(grafanaUrl) };
        default:
          return { name: service, health: { status: 'unknown' as const, error: `Unknown service: ${service}` } };
      }
    })
  );

  for (const check of checks) {
    if (check.status === 'fulfilled') {
      services[check.value.name] = check.value.health;
    } else {
      // Extract service name from error context if possible
      services['unknown'] = { status: 'unhealthy', error: check.reason?.message ?? 'Unknown error' };
    }
  }

  // Determine overall status
  const healthStatuses = Object.values(services).map((s) => s.status);
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (healthStatuses.every((s) => s === 'healthy')) {
    overallStatus = 'healthy';
  } else if (healthStatuses.some((s) => s === 'unhealthy')) {
    overallStatus = 'unhealthy';
  } else {
    overallStatus = 'degraded';
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services,
  };
}

async function checkThoughtbox(url: string): Promise<ServiceHealth> {
  try {
    const response = await fetch(`${url}/health`, {
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        status: 'healthy',
        version: data.version ?? 'unknown',
      };
    }
    return { status: 'unhealthy', error: `HTTP ${response.status}` };
  } catch (err) {
    return { status: 'unhealthy', error: err instanceof Error ? err.message : 'Connection failed' };
  }
}

async function checkSidecar(prometheusClient: PrometheusClient): Promise<ServiceHealth> {
  try {
    // Query sidecar metrics from Prometheus
    const upstreamResult = await prometheusClient.query('mcp_upstream_available');
    const connectionsResult = await prometheusClient.query('mcp_active_connections');

    const upstreamValue = upstreamResult.data?.result?.[0]?.value?.[1];
    const connectionsValue = connectionsResult.data?.result?.[0]?.value?.[1];

    // If we got metrics, sidecar is working
    if (upstreamValue !== undefined) {
      return {
        status: upstreamValue === '1' ? 'healthy' : 'unhealthy',
        upstream_available: upstreamValue === '1',
        active_connections: connectionsValue ? parseInt(connectionsValue, 10) : 0,
      };
    }

    // No metrics means sidecar might not be sending data yet
    return { status: 'unknown', error: 'No metrics available' };
  } catch (err) {
    return { status: 'unknown', error: err instanceof Error ? err.message : 'Query failed' };
  }
}

async function checkPrometheus(prometheusClient: PrometheusClient): Promise<ServiceHealth> {
  try {
    const isHealthy = await prometheusClient.isHealthy();
    if (!isHealthy) {
      return { status: 'unhealthy', error: 'Health check failed' };
    }

    const targets = await prometheusClient.targets();
    const activeTargets = targets.data?.activeTargets ?? [];
    const upCount = activeTargets.filter((t) => t.health === 'up').length;

    return {
      status: 'healthy',
      targets_up: upCount,
      targets_total: activeTargets.length,
    };
  } catch (err) {
    return { status: 'unhealthy', error: err instanceof Error ? err.message : 'Connection failed' };
  }
}

async function checkGrafana(url: string): Promise<ServiceHealth> {
  try {
    // Grafana health endpoint: GET /api/health
    // Returns: { "commit": "...", "database": "ok", "version": "11.0.0" }
    const response = await fetch(`${url}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        status: data.database === 'ok' ? 'healthy' : 'unhealthy',
        version: data.version ?? 'unknown',
        database: data.database ?? 'unknown',
      };
    }
    return { status: 'unhealthy', error: `HTTP ${response.status}` };
  } catch (err) {
    return { status: 'unhealthy', error: err instanceof Error ? err.message : 'Connection failed' };
  }
}
