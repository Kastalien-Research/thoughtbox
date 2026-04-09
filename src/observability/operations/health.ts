/**
 * Health Check Operation
 *
 * Checks health of Thoughtbox and OTEL event storage.
 */

import type { OtelEventStorage } from '../../otel/otel-storage.js';

export interface HealthArgs {
  services?: string[];
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'unknown';
  version?: string;
  error?: string;
  event_count?: number;
}

export interface HealthResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: Record<string, ServiceHealth>;
}

export async function checkHealth(
  args: HealthArgs,
  thoughtboxUrl: string,
  otelStorage: OtelEventStorage | null,
): Promise<HealthResult> {
  const requestedServices = args.services ?? ['thoughtbox', 'supabase'];
  const services: Record<string, ServiceHealth> = {};

  const checks = await Promise.allSettled(
    requestedServices.map(async (service) => {
      switch (service) {
        case 'thoughtbox':
          // If responding to this request, the server is healthy.
          // External URL checks fail from Cloud Run (no loopback route).
          return { name: service, health: { status: 'healthy' as const } };
        case 'supabase':
          return { name: service, health: await checkOtelStorage(otelStorage) };
        default:
          return { name: service, health: { status: 'unknown' as const, error: `Unknown service: ${service}` } };
      }
    })
  );

  for (const check of checks) {
    if (check.status === 'fulfilled') {
      services[check.value.name] = check.value.health;
    } else {
      services['unknown'] = { status: 'unhealthy', error: check.reason?.message ?? 'Unknown error' };
    }
  }

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

async function checkOtelStorage(
  storage: OtelEventStorage | null,
): Promise<ServiceHealth> {
  if (!storage) {
    return { status: 'unknown', error: 'No OTEL storage configured' };
  }
  return storage.checkHealth();
}
