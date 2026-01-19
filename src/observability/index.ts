/**
 * Observability Module
 *
 * Exports for the observability_gateway MCP tool.
 */

export {
  ObservabilityGatewayHandler,
  observabilityToolInputSchema,
  type ObservabilityGatewayConfig,
  type ObservabilityInput,
  type ObservabilityOperation,
} from './gateway-handler.js';

export { PrometheusClient, type PrometheusConfig } from './prometheus-client.js';
