/**
 * Health Check Operation
 *
 * Probes the Thoughtbox storage backend and OTEL event storage and reports
 * per-component status. Components that cannot be probed report `unknown` —
 * never an unconditional `healthy`.
 */

import type { OtelEventStorage } from '../../otel/otel-storage.js';
import type { ThoughtboxStorage } from '../../persistence/types.js';

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
  storage: ThoughtboxStorage,
  otelStorage: OtelEventStorage | null,
): Promise<HealthResult> {
  const requestedServices = args.services ?? ['thoughtbox', 'supabase'];
  const services: Record<string, ServiceHealth> = {};

  const checks = await Promise.allSettled(
    requestedServices.map(async (service) => {
      switch (service) {
        case 'thoughtbox':
          return { name: service, health: await checkThoughtboxStorage(storage) };
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

async function checkThoughtboxStorage(
  storage: ThoughtboxStorage,
): Promise<ServiceHealth> {
  try {
    await storage.listSessions({ limit: 1 });
    return { status: 'healthy' };
  } catch (err) {
    return {
      status: 'unhealthy',
      error: err instanceof Error ? err.message : 'Storage probe failed',
    };
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
