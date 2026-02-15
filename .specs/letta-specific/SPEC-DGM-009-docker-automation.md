# SPEC-DGM-009: Thoughtbox Docker Rebuild Automation

**Status**: Draft  
**Priority**: P2 - Required for Thoughtbox Self-Modification  
**Complexity**: Low  
**Dependencies**: SPEC-DGM-006 (DGM Loop)  
**Target**: Thoughtbox build/deploy automation

## Overview

Automate Docker image building, container lifecycle management, and health validation for Thoughtbox when DGM modifies its codebase. Minimize downtime and ensure MCP connections remain stable across updates.

## Motivation

**Problem**: When DGM modifies Thoughtbox source:
1. Docker image must be rebuilt
2. Container must be restarted
3. MCP connections must reconnect
4. Health must be validated
5. This takes 30-60 seconds during which Thoughtbox is unavailable

**Goal**: Automate this process with minimal manual intervention and maximum reliability.

## Requirements

### Functional Requirements

#### FR-001: Build Trigger Detection
**Priority**: MUST  
**Description**: Detect when Thoughtbox needs rebuilding

**Triggers**:
```typescript
interface RebuildTrigger {
  // After DGM accepts Thoughtbox modification
  onAcceptance: boolean;
  
  // On Git branch change
  onBranchSwitch: boolean;
  
  // Manual command
  manual: boolean;
}

// Detection logic
function needsRebuild(impl: Implementation): boolean {
  return (
    impl.proposal.target === 'thoughtbox' ||
    impl.proposal.target === 'both'
  );
}
```

**Acceptance Criteria**:
- [ ] Rebuild triggered automatically after acceptance
- [ ] Manual rebuild available (`letta /dgm rebuild thoughtbox`)
- [ ] Skipped when only Letta Code modified
- [ ] Clear notification when rebuilding

---

#### FR-002: Zero-Downtime Update
**Priority**: SHOULD  
**Description**: Minimize MCP connection disruption during updates

**Strategy**:
```typescript
async function zeroDowntimeUpdate(newImage: string): Promise<void> {
  // 1. Build new image with different tag
  await docker.build('thoughtbox:next', './thoughtbox');
  
  // 2. Start new container on different port
  await docker.run({
    name: 'thoughtbox-next',
    image: 'thoughtbox:next',
    ports: { '3001': '3000' },
    env: { THOUGHTBOX_TRANSPORT: 'http' }
  });
  
  // 3. Wait for healthy
  await waitForHealthy('http://localhost:3001/health', { timeout: 30000 });
  
  // 4. Update MCP client connection
  await mcpClient.reconnect('http://localhost:3001/mcp');
  
  // 5. Stop old container
  await docker.stop('thoughtbox');
  await docker.rm('thoughtbox');
  
  // 6. Rename new container
  await docker.rename('thoughtbox-next', 'thoughtbox');
  
  // 7. Update port mapping (or use reverse proxy)
  // ... implementation details
}
```

**Acceptance Criteria**:
- [ ] MCP connection downtime <5 seconds
- [ ] In-flight requests complete gracefully
- [ ] Fallback to old version if new fails health check
- [ ] Clear status messages during process

---

#### FR-003: Health Validation
**Priority**: MUST  
**Description**: Comprehensive health checks before considering update successful

**Health Checks**:
```typescript
interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
  timeout: number;
  critical: boolean;  // If false, warn but don't fail
}

const healthChecks: HealthCheck[] = [
  {
    name: 'HTTP endpoint responds',
    check: async () => {
      const res = await fetch('http://localhost:3000/health');
      return res.ok;
    },
    timeout: 5000,
    critical: true
  },
  {
    name: 'MCP protocol initialization',
    check: async () => {
      const client = new McpClient({ url: 'http://localhost:3000/mcp' });
      await client.connect();
      const caps = client.getCapabilities();
      await client.disconnect();
      return caps.tools !== undefined;
    },
    timeout: 10000,
    critical: true
  },
  {
    name: 'Observatory accessible (if enabled)',
    check: async () => {
      const res = await fetch('http://localhost:8080');
      return res.ok;
    },
    timeout: 5000,
    critical: false  // Observatory is optional
  },
  {
    name: 'Tool list non-empty',
    check: async () => {
      const client = new McpClient({ url: 'http://localhost:3000/mcp' });
      await client.connect();
      const tools = await client.listTools();
      await client.disconnect();
      return tools.length > 0;
    },
    timeout: 10000,
    critical: true
  }
];
```

**Acceptance Criteria**:
- [ ] All critical checks must pass
- [ ] Non-critical checks logged but don't fail
- [ ] Timeout enforced per check
- [ ] Clear error messages on failure
- [ ] Rollback triggered if health checks fail

---

#### FR-004: Rollback on Failure
**Priority**: MUST  
**Description**: Automatic rollback to previous version on failed update

**Process**:
```typescript
async function rebuildWithRollback(impl: Implementation): Promise<void> {
  // Save current state
  const currentContainer = await docker.inspect('thoughtbox');
  const currentImage = currentContainer.Image;
  
  try {
    // Attempt update
    await zeroDowntimeUpdate('thoughtbox:latest');
    
    // Run health checks
    const healthy = await runHealthChecks();
    
    if (!healthy) {
      throw new Error('Health checks failed');
    }
    
    console.log('✅ Thoughtbox updated successfully');
    
  } catch (error) {
    console.error('❌ Update failed, rolling back...');
    
    // Rollback
    await docker.stop('thoughtbox');
    await docker.rm('thoughtbox');
    
    await docker.run({
      name: 'thoughtbox',
      image: currentImage,  // Previous image
      ports: { '3000': '3000' }
    });
    
    await waitForHealthy('http://localhost:3000/health');
    
    console.log('⚠️ Rolled back to previous version');
    throw error;  // Propagate to DGM loop
  }
}
```

**Acceptance Criteria**:
- [ ] Previous image tagged before update
- [ ] Rollback automatic on any failure
- [ ] Rollback completes within 30 seconds
- [ ] MCP clients reconnect automatically
- [ ] User notified of rollback

---

#### FR-005: Build Optimization
**Priority**: SHOULD  
**Description**: Optimize Docker build time for fast iteration

**Optimizations**:
```dockerfile
# Multi-stage build with caching
FROM node:20-alpine AS builder

# Cache dependencies separately
COPY package*.json ./
RUN npm ci --only=production

# Copy source (changes more frequently)
COPY src/ ./src/
COPY tsconfig.json ./

# Build
RUN npm run build

# Runtime stage (smaller image)
FROM node:20-alpine
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Use BuildKit for parallel builds
# DOCKER_BUILDKIT=1 docker build ...
```

**Acceptance Criteria**:
- [ ] Build time <60 seconds (warm cache)
- [ ] Build time <3 minutes (cold cache)
- [ ] Layer caching utilized
- [ ] Final image <200MB
- [ ] BuildKit enabled by default

---

### Non-Functional Requirements

#### NFR-001: Performance
- Rebuild + restart: <2 minutes
- Zero-downtime update: <10 seconds disruption
- Health check: <30 seconds
- Rollback: <30 seconds

#### NFR-002: Reliability
- Health checks before considering success
- Rollback on any validation failure
- Preserve logs from failed updates
- Retry transient failures (network issues)

#### NFR-003: Observability
- Build logs saved
- Container logs tailed during startup
- Health check results detailed
- Metrics: build time, update frequency, failure rate

---

## Architecture

### Docker Manager

```typescript
// letta-code-thoughtbox/src/dgm/docker-manager.ts
export class DockerManager {
  async rebuild(target: 'thoughtbox'): Promise<void> {
    // 1. Build image
    // 2. Test image
    // 3. Deploy
  }
  
  async zeroDowntimeUpdate(newImage: string): Promise<void> {
    // Strategy from FR-002
  }
  
  async rollback(): Promise<void> {
    // Strategy from FR-004
  }
  
  async healthCheck(): Promise<HealthStatus> {
    // Run all health checks
  }
  
  async getLogs(container: string): Promise<string> {
    // Get container logs
  }
}
```

---

## Integration with DGM Loop

```typescript
// In dgm-improvement-loop.ts
async function acceptVariant(impl: Implementation, metrics: MetricScores) {
  // ... add to archive ...
  
  // Rebuild Docker if Thoughtbox modified
  if (impl.proposal.target === 'thoughtbox' || impl.proposal.target === 'both') {
    console.log('\n🐳 Rebuilding Thoughtbox...');
    
    try {
      await dockerManager.rebuild('thoughtbox');
      console.log('✅ Thoughtbox rebuilt successfully');
    } catch (error) {
      console.error('❌ Docker rebuild failed:', error.message);
      
      // Mark variant as problematic but keep in archive
      await archiveManager.update(variant.id, {
        status: 'active-with-issues',
        issues: [`Docker rebuild failed: ${error.message}`]
      });
      
      throw error;  // Propagate to DGM loop
    }
  }
}
```

---

## Testing Strategy

### Unit Tests
```typescript
test('needsRebuild detects Thoughtbox modifications', () => {
  const impl = { proposal: { target: 'thoughtbox' } };
  expect(needsRebuild(impl)).toBe(true);
  
  const impl2 = { proposal: { target: 'letta-code' } };
  expect(needsRebuild(impl2)).toBe(false);
});

test('healthCheck validates all checks', async () => {
  mockDocker.healthy();
  const status = await dockerManager.healthCheck();
  expect(status.healthy).toBe(true);
  expect(status.checks.every(c => c.passed)).toBe(true);
});
```

### Integration Tests
```typescript
test('Full rebuild cycle completes', async () => {
  // Modify Thoughtbox
  await fs.writeFile('thoughtbox/src/test-file.ts', '...');
  await git.commit('test modification');
  
  // Rebuild
  await dockerManager.rebuild('thoughtbox');
  
  // Verify
  const healthy = await dockerManager.healthCheck();
  expect(healthy.healthy).toBe(true);
  
  // Can connect via MCP
  const client = new McpClient({ url: 'http://localhost:3000/mcp' });
  await client.connect();
  expect(client.isConnected()).toBe(true);
});
```

---

## Success Criteria

- [ ] Rebuild triggered automatically on Thoughtbox modifications
- [ ] Build completes in <2 minutes
- [ ] Health checks comprehensive
- [ ] Zero-downtime updates work
- [ ] Rollback automatic on failures
- [ ] MCP clients reconnect automatically
- [ ] Logs preserved for debugging
- [ ] Build optimization working (caching)

---

## References

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Thoughtbox Dockerfile](../../thoughtbox/Dockerfile)
- [Docker Skill](../../.letta/skills/docker/SKILL.md)

---

**Previous**: [SPEC-DGM-008: CI/CD Safety](./SPEC-DGM-008-cicd-safety-mechanisms.md)  
**Next**: [Inventory and Summary](./inventory.md)
