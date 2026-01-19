# SPEC-SIL-007: Proctored Execution Environment

> **Status**: Draft
> **Priority**: HIGH
> **Week**: 4 (Autonomous Loop)
> **Phase**: Gaming Prevention
> **Estimated Effort**: 8-10 hours

## Summary

Implement a proctored execution environment using Docker containers with network isolation, resource limits, and comprehensive logging to detect gaming attempts.

## Problem Statement

Without proctoring, agents can:
- Fabricate test outputs
- Access solutions via network
- Manipulate timing measurements
- Output pre-memorized solutions

Proctored execution provides:
- Isolated sandbox environment
- Comprehensive execution logging
- Log consistency verification
- Timing analysis for anomaly detection

## Scope

### In Scope
- Docker container creation with security constraints
- Network isolation
- Resource limits (CPU, memory)
- Full execution logging
- Log consistency verification
- Timing analysis

### Out of Scope
- Container orchestration (Kubernetes)
- Cross-machine execution
- GPU isolation

## Requirements

### R1: Container Configuration
```typescript
interface SandboxConfig {
  image: string;
  networkDisabled: boolean;
  memoryLimit: number;
  cpuQuota: number;
  readonlyRoot: boolean;
  timeout: number;
}
```

### R2: Execution Logging
```typescript
interface ExecutionLogs {
  stdout: string;
  stderr: string;
  exitCode: number;
  startTime: string;
  endTime: string;
  resourceUsage: ResourceMetrics;
}
```

### R3: Verification Result
```typescript
interface ProctoredResult {
  passed: boolean;
  logs: ExecutionLogs;
  verification: {
    consistent: boolean;
    flags: VerificationFlag[];
  };
}
```

### R4: Timing Analysis
```typescript
interface TimingAnalysis {
  actualDuration: number;
  expectedDuration: number;
  anomalyScore: number;
  suspicious: boolean;
}
```

## Technical Approach

### Implementation

```typescript
// benchmarks/proctor.ts

import Docker from 'dockerode';
import { EventEmitter } from 'events';

interface TestCase {
  id: string;
  name: string;
  code: string;
  expectedDuration: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ResourceMetrics {
  cpuUsed: number;
  memoryPeakMb: number;
  diskReadBytes: number;
  diskWriteBytes: number;
}

interface ExecutionLogs {
  stdout: string;
  stderr: string;
  exitCode: number;
  startTime: string;
  endTime: string;
  resourceUsage: ResourceMetrics;
}

interface VerificationFlag {
  type: 'missing_start' | 'missing_end' | 'timing_anomaly' | 'resource_anomaly';
  message: string;
  severity: 'warning' | 'critical';
}

interface Verification {
  consistent: boolean;
  flags: VerificationFlag[];
  timingAnalysis: TimingAnalysis;
}

interface TimingAnalysis {
  actualDuration: number;
  expectedDuration: number;
  ratio: number;
  anomalyScore: number;
  suspicious: boolean;
}

interface ProctoredResult {
  passed: boolean;
  logs: ExecutionLogs;
  verification: Verification;
}

interface SandboxConfig {
  image: string;
  networkDisabled: boolean;
  memoryLimitMb: number;
  cpuPercent: number;
  readonlyRoot: boolean;
  timeoutSeconds: number;
}

const DEFAULT_CONFIG: SandboxConfig = {
  image: 'thoughtbox-sandbox:latest',
  networkDisabled: true,
  memoryLimitMb: 512,
  cpuPercent: 50,
  readonlyRoot: true,
  timeoutSeconds: 300
};

export class ProctoredExecutor extends EventEmitter {
  private docker: Docker;
  private config: SandboxConfig;

  constructor(config: Partial<SandboxConfig> = {}) {
    super();
    this.docker = new Docker();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute code in a proctored sandbox environment.
   */
  async executeProctored(
    code: string,
    testCase: TestCase
  ): Promise<ProctoredResult> {
    const startTime = new Date().toISOString();

    // Create container with security constraints
    const container = await this.createSandbox(testCase);

    try {
      // Write code to container
      await this.injectCode(container, code, testCase);

      // Execute with timeout
      const execResult = await this.runWithTimeout(container, testCase);

      const endTime = new Date().toISOString();

      // Collect logs
      const logs: ExecutionLogs = {
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        exitCode: execResult.exitCode,
        startTime,
        endTime,
        resourceUsage: await this.collectResourceMetrics(container)
      };

      // Verify execution
      const verification = this.verifyExecution(logs, testCase);

      // Determine pass/fail
      const passed = verification.consistent &&
                     logs.exitCode === 0 &&
                     !verification.flags.some(f => f.severity === 'critical');

      return { passed, logs, verification };

    } finally {
      // Always cleanup
      await this.cleanup(container);
    }
  }

  /**
   * Create sandbox container with security constraints.
   */
  private async createSandbox(testCase: TestCase): Promise<Docker.Container> {
    const container = await this.docker.createContainer({
      Image: this.config.image,
      NetworkDisabled: this.config.networkDisabled,
      HostConfig: {
        Memory: this.config.memoryLimitMb * 1024 * 1024,
        CpuPeriod: 100000,
        CpuQuota: this.config.cpuPercent * 1000,
        ReadonlyRootfs: this.config.readonlyRoot,
        // Bind mount for code injection
        Binds: ['/tmp/proctor-workspace:/workspace:rw'],
        // Security options
        SecurityOpt: ['no-new-privileges'],
        CapDrop: ['ALL']
      },
      Env: [
        `TEST_NAME=${testCase.name}`,
        `TEST_ID=${testCase.id}`
      ],
      WorkingDir: '/workspace',
      Cmd: ['node', 'run-test.js']
    });

    await container.start();
    return container;
  }

  /**
   * Inject code into the container workspace.
   */
  private async injectCode(
    container: Docker.Container,
    code: string,
    testCase: TestCase
  ): Promise<void> {
    // Create test runner script
    const runnerScript = `
const startMarker = 'TEST_START:${testCase.name}';
const endMarker = 'TEST_END:${testCase.name}';

console.log(startMarker);
const startTime = Date.now();

try {
  ${code}
  const duration = Date.now() - startTime;
  console.log(endMarker);
  console.log('DURATION:' + duration);
  process.exit(0);
} catch (error) {
  console.error('ERROR:', error.message);
  console.log(endMarker);
  process.exit(1);
}
    `;

    // Execute tar command to inject file
    const exec = await container.exec({
      Cmd: ['sh', '-c', `echo '${Buffer.from(runnerScript).toString('base64')}' | base64 -d > /workspace/run-test.js`],
      AttachStdout: true,
      AttachStderr: true
    });

    await exec.start({ Detach: false });
  }

  /**
   * Run test with timeout.
   */
  private async runWithTimeout(
    container: Docker.Container,
    testCase: TestCase
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        container.kill().catch(() => {});
        reject(new Error(`Execution timeout after ${this.config.timeoutSeconds}s`));
      }, this.config.timeoutSeconds * 1000);

      try {
        const exec = await container.exec({
          Cmd: ['node', 'run-test.js'],
          AttachStdout: true,
          AttachStderr: true
        });

        const stream = await exec.start({ Detach: false });

        let stdout = '';
        let stderr = '';

        stream.on('data', (chunk: Buffer) => {
          // Docker multiplexes stdout/stderr
          const header = chunk.slice(0, 8);
          const streamType = header[0]; // 1 = stdout, 2 = stderr
          const payload = chunk.slice(8).toString();

          if (streamType === 1) stdout += payload;
          else stderr += payload;
        });

        stream.on('end', async () => {
          clearTimeout(timeout);
          const inspectResult = await exec.inspect();
          resolve({
            stdout,
            stderr,
            exitCode: inspectResult.ExitCode || 0
          });
        });

      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Collect resource usage metrics from container.
   */
  private async collectResourceMetrics(container: Docker.Container): Promise<ResourceMetrics> {
    try {
      const stats = await container.stats({ stream: false });

      return {
        cpuUsed: stats.cpu_stats?.cpu_usage?.total_usage || 0,
        memoryPeakMb: (stats.memory_stats?.max_usage || 0) / (1024 * 1024),
        diskReadBytes: stats.blkio_stats?.io_service_bytes_recursive?.[0]?.value || 0,
        diskWriteBytes: stats.blkio_stats?.io_service_bytes_recursive?.[1]?.value || 0
      };
    } catch {
      return { cpuUsed: 0, memoryPeakMb: 0, diskReadBytes: 0, diskWriteBytes: 0 };
    }
  }

  /**
   * Verify execution logs for consistency and detect gaming.
   */
  private verifyExecution(logs: ExecutionLogs, testCase: TestCase): Verification {
    const flags: VerificationFlag[] = [];

    // Check 1: Test markers present
    const startMarker = `TEST_START:${testCase.name}`;
    const endMarker = `TEST_END:${testCase.name}`;

    if (!logs.stdout.includes(startMarker)) {
      flags.push({
        type: 'missing_start',
        message: 'Test start marker not found in output',
        severity: 'critical'
      });
    }

    if (!logs.stdout.includes(endMarker)) {
      flags.push({
        type: 'missing_end',
        message: 'Test end marker not found in output',
        severity: 'critical'
      });
    }

    // Check 2: Timing analysis
    const timingAnalysis = this.analyzeTime(logs, testCase);

    if (timingAnalysis.suspicious) {
      flags.push({
        type: 'timing_anomaly',
        message: `Solve time (${timingAnalysis.actualDuration}ms) suspiciously fast vs expected (${timingAnalysis.expectedDuration}ms)`,
        severity: timingAnalysis.ratio < 0.05 ? 'critical' : 'warning'
      });
    }

    // Check 3: Resource usage anomalies
    if (logs.resourceUsage.memoryPeakMb < 1) {
      flags.push({
        type: 'resource_anomaly',
        message: 'Suspiciously low memory usage - may not have executed properly',
        severity: 'warning'
      });
    }

    const consistent = !flags.some(f => f.severity === 'critical');

    return { consistent, flags, timingAnalysis };
  }

  /**
   * Analyze execution timing for anomalies.
   */
  private analyzeTime(logs: ExecutionLogs, testCase: TestCase): TimingAnalysis {
    // Extract duration from logs
    const durationMatch = logs.stdout.match(/DURATION:(\d+)/);
    const actualDuration = durationMatch ? parseInt(durationMatch[1], 10) : 0;
    const expectedDuration = testCase.expectedDuration;

    const ratio = actualDuration / expectedDuration;

    // Anomaly score: 0 = normal, 1 = highly anomalous
    // Very fast completion is suspicious
    const anomalyScore = ratio < 0.1 ? 1 - (ratio * 10) : 0;

    return {
      actualDuration,
      expectedDuration,
      ratio,
      anomalyScore,
      suspicious: ratio < 0.1  // 10% of expected time = suspicious
    };
  }

  /**
   * Cleanup container.
   */
  private async cleanup(container: Docker.Container): Promise<void> {
    try {
      await container.stop({ t: 5 });
    } catch {
      // Already stopped
    }
    try {
      await container.remove({ force: true });
    } catch {
      // Best effort cleanup
    }
  }

  /**
   * Build the sandbox Docker image.
   */
  async buildSandboxImage(): Promise<void> {
    const dockerfile = `
FROM node:20-alpine
RUN apk add --no-cache dumb-init
WORKDIR /workspace
USER node
ENTRYPOINT ["dumb-init", "--"]
    `;

    const stream = await this.docker.buildImage(
      { context: '.', src: ['Dockerfile'] },
      { t: this.config.image }
    );

    return new Promise((resolve, reject) => {
      this.docker.modem.followProgress(stream, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

// Singleton for easy access
let executorInstance: ProctoredExecutor | null = null;

export function getProctoredExecutor(config?: Partial<SandboxConfig>): ProctoredExecutor {
  if (!executorInstance) {
    executorInstance = new ProctoredExecutor(config);
  }
  return executorInstance;
}
```

## Files

### New Files
| File | Purpose |
|------|---------|
| `benchmarks/proctor.ts` | Proctored execution environment |
| `benchmarks/proctor.test.ts` | Unit tests |
| `docker/sandbox/Dockerfile` | Sandbox image definition |

## Acceptance Criteria

- [ ] Creates isolated Docker container
- [ ] Network disabled in sandbox
- [ ] Resource limits enforced
- [ ] Full execution logging captured
- [ ] Log consistency verification working
- [ ] Timing anomaly detection working
- [ ] Proper cleanup on completion/error

## Test Cases

```typescript
describe('ProctoredExecutor', () => {
  it('creates container with network disabled', async () => {
    const executor = new ProctoredExecutor();
    const result = await executor.executeProctored('console.log("test")', mockTestCase);
    // Would verify via Docker API inspection
    expect(result.passed).toBe(true);
  });

  it('detects missing test markers', async () => {
    const executor = new ProctoredExecutor();
    const result = await executor.executeProctored('', mockTestCase);
    expect(result.verification.flags).toContainEqual(
      expect.objectContaining({ type: 'missing_start' })
    );
  });

  it('flags suspiciously fast execution', async () => {
    const executor = new ProctoredExecutor();
    // Code that completes too fast
    const result = await executor.executeProctored(
      'console.log("instant")',
      { ...mockTestCase, expectedDuration: 60000 }
    );
    expect(result.verification.timingAnalysis.suspicious).toBe(true);
  });

  it('enforces timeout', async () => {
    const executor = new ProctoredExecutor({ timeoutSeconds: 1 });
    await expect(
      executor.executeProctored('while(true){}', mockTestCase)
    ).rejects.toThrow('timeout');
  });
});
```

## Gates

### Entry Gate
- Docker available in execution environment
- SPEC-SIL-002 (Config) complete for sandbox settings

### Exit Gate
- All verification checks working
- Timing analysis catching anomalies
- Clean container lifecycle

## Dependencies

- dockerode package
- Docker daemon available

## Blocked By

- SPEC-SIL-002 (Benchmark Config for proctoring settings)

## Blocks

- SPEC-SIL-010 (Main Loop uses proctored execution)

---

**Created**: 2026-01-19
**Source**: PLAN Week 4, Section 4.1
