# Example: Debugging with Mental Models

This example demonstrates using rubber duck debugging and five-whys to systematically find and fix a production bug.

## Scenario

Production alert: "User authentication failures spiking - 15% of login attempts failing with 'Invalid session' error." Normal failure rate is <1%.

---

## Step 1: Start with Five Whys Framework

```javascript
mental_models({
  operation: "get_model",
  args: { model: "five-whys" }
})
```

---

## Step 2: Define the Problem Precisely

```javascript
thoughtbox({
  thought: "PROBLEM STATEMENT: Login failures increased from <1% to 15% starting at 14:32 UTC. Error: 'Invalid session'. Affects all regions equally. No deployment in last 24 hours.",
  thoughtNumber: 1,
  totalThoughts: 12,
  nextThoughtNeeded: true
})
```

---

## Step 3: Apply Five Whys with Backward Thinking

Start from the symptom and work backward:

```javascript
// WHY 1: Why are sessions invalid?
thoughtbox({
  thought: "WHY 1: Why are sessions invalid? → Session tokens are being rejected by validation service. Tokens exist in Redis but fail signature check.",
  thoughtNumber: 8,
  totalThoughts: 12,
  nextThoughtNeeded: true
})
```

```javascript
// WHY 2: Why do they fail signature check?
thoughtbox({
  thought: "WHY 2: Why do signatures fail? → JWT signature uses HMAC with secret key. Either tokens are corrupted OR secret key has changed.",
  thoughtNumber: 7,
  totalThoughts: 12,
  nextThoughtNeeded: true
})
```

```javascript
// WHY 3: Why would secret key change?
thoughtbox({
  thought: "WHY 3: Why would secret key change? → Key is loaded from environment variable JWT_SECRET. Checking: some pods have different value than others!",
  thoughtNumber: 6,
  totalThoughts: 12,
  nextThoughtNeeded: true
})
```

```javascript
// WHY 4: Why do pods have different secrets?
thoughtbox({
  thought: "WHY 4: Why different secrets across pods? → JWT_SECRET comes from Kubernetes secret. Checking secret versioning... Secret was rotated at 14:30 UTC!",
  thoughtNumber: 5,
  totalThoughts: 12,
  nextThoughtNeeded: true
})
```

```javascript
// WHY 5: Why did rotation break things?
thoughtbox({
  thought: "WHY 5: Why did secret rotation break authentication? → Old pods still running with old secret. New pods have new secret. Tokens created by old pods can't be validated by new pods and vice versa.",
  thoughtNumber: 4,
  totalThoughts: 12,
  nextThoughtNeeded: true
})
```

---

## Step 4: Apply Rubber Duck for Code Review

Now that we have a hypothesis, apply rubber duck to verify:

```javascript
mental_models({
  operation: "get_model",
  args: { model: "rubber-duck" }
})
```

```javascript
thoughtbox({
  thought: "RUBBER DUCK: Walking through the authentication flow... User sends request → Load balancer routes to pod → Pod validates JWT → If valid, process request.",
  thoughtNumber: 3,
  totalThoughts: 12,
  nextThoughtNeeded: true
})
```

```javascript
thoughtbox({
  thought: "RUBBER DUCK: Load balancer has sticky sessions disabled. So requests from same user can hit different pods. If pods have different secrets, validation will randomly fail based on routing.",
  thoughtNumber: 2,
  totalThoughts: 12,
  nextThoughtNeeded: true
})
```

```javascript
thoughtbox({
  thought: "RUBBER DUCK: Expected behavior - 50% of pods have old secret, 50% have new. Random routing means ~50% of requests go to mismatched pod. But we see 15% failure, not 50%. Why?",
  thoughtNumber: 1,
  totalThoughts: 12,
  nextThoughtNeeded: true
})
```

---

## Step 5: Create Validation Notebook

Test the hypothesis:

```javascript
notebook({
  operation: "create",
  args: {
    title: "JWT Signature Debug",
    language: "typescript"
  }
})
```

```javascript
notebook({
  operation: "add_cell",
  args: {
    notebookId: "...",
    cellType: "markdown",
    content: `# JWT Signature Mismatch Investigation

## Hypothesis
Secret rotation at 14:30 UTC caused pods to have different JWT secrets.
Tokens signed with old secret fail validation on pods with new secret.

## Expected Failure Rate Calculation
If 50% of pods have each secret, random routing should cause ~50% failures.
Actual: 15%

## Additional Factors to Consider
- Session stickiness on some paths?
- Token refresh reducing exposure?
- Caching masking some failures?`
  }
})
```

```javascript
notebook({
  operation: "add_cell",
  args: {
    notebookId: "...",
    cellType: "code",
    content: `// Simulate the failure scenario
interface Pod {
  id: string;
  secret: string;
}

function simulateAuth(
  pods: Pod[],
  tokenSecret: string,
  requests: number
): { success: number; failure: number; rate: number } {
  let success = 0;
  let failure = 0;

  for (let i = 0; i < requests; i++) {
    // Random pod selection (no sticky sessions)
    const pod = pods[Math.floor(Math.random() * pods.length)];

    // Token validates only if secrets match
    if (pod.secret === tokenSecret) {
      success++;
    } else {
      failure++;
    }
  }

  return {
    success,
    failure,
    rate: (failure / requests) * 100
  };
}

// Scenario: 10 pods, 5 with old secret, 5 with new
const pods: Pod[] = [
  ...Array(5).fill(null).map((_, i) => ({ id: \`old-\${i}\`, secret: 'old-secret' })),
  ...Array(5).fill(null).map((_, i) => ({ id: \`new-\${i}\`, secret: 'new-secret' }))
];

// Simulate tokens created with OLD secret
console.log('Tokens with OLD secret:');
const oldTokenResult = simulateAuth(pods, 'old-secret', 10000);
console.log(\`  Failure rate: \${oldTokenResult.rate.toFixed(1)}%\`);

// Simulate tokens created with NEW secret
console.log('Tokens with NEW secret:');
const newTokenResult = simulateAuth(pods, 'new-secret', 10000);
console.log(\`  Failure rate: \${newTokenResult.rate.toFixed(1)}%\`);

// Combined (assuming 50/50 mix of old and new tokens)
const combinedFailure = (oldTokenResult.failure + newTokenResult.failure) / 20000 * 100;
console.log(\`\\nCombined failure rate: \${combinedFailure.toFixed(1)}%\`);`,
    filename: "auth-simulation.ts"
  }
})
```

```javascript
// Run simulation
notebook({
  operation: "run_cell",
  args: { notebookId: "...", cellId: "..." }
})
// Output:
// Tokens with OLD secret:
//   Failure rate: 49.8%
// Tokens with NEW secret:
//   Failure rate: 50.2%
// Combined failure rate: 50.0%
```

---

## Step 6: Revise Hypothesis

Simulation shows 50% expected, but we see 15%. Need to revise:

```javascript
thoughtbox({
  thought: "REVISION: Simulation predicts 50% failure but actual is 15%. Missing factor: Most users have long-lived tokens from before rotation. Only new logins get new tokens. So ~70% tokens are old-secret.",
  thoughtNumber: 9,
  totalThoughts: 12,
  isRevision: true,
  revisesThought: 1,
  nextThoughtNeeded: true
})
```

```javascript
// Add revised simulation
notebook({
  operation: "add_cell",
  args: {
    notebookId: "...",
    cellType: "code",
    content: `// Revised simulation with token age distribution
// Assume 70% of tokens are old (created before rotation)

const oldTokenRequests = 7000;  // 70% of traffic
const newTokenRequests = 3000;  // 30% of traffic

const oldTokenFailures = simulateAuth(pods, 'old-secret', oldTokenRequests).failure;
const newTokenFailures = simulateAuth(pods, 'new-secret', newTokenRequests).failure;

const totalFailures = oldTokenFailures + newTokenFailures;
const totalRequests = oldTokenRequests + newTokenRequests;

console.log('Revised simulation (70% old tokens, 30% new):');
console.log(\`  Old token failures: \${oldTokenFailures} / \${oldTokenRequests}\`);
console.log(\`  New token failures: \${newTokenFailures} / \${newTokenRequests}\`);
console.log(\`  Combined failure rate: \${(totalFailures / totalRequests * 100).toFixed(1)}%\`);

// This still gives ~50%. Need another factor...
console.log('\\nStill ~50%. Need additional factor.');

// Factor: Token refresh happens client-side on failure
// After first failure, client refreshes token, gets new-secret token
// Subsequent requests succeed
// So effective failure = first-request failures only

const estimatedActiveUsers = 1000;
const requestsPerUser = 10;
const firstRequestFailures = simulateAuth(pods, 'old-secret', estimatedActiveUsers).failure * 0.7 +
                              simulateAuth(pods, 'new-secret', estimatedActiveUsers).failure * 0.3;

const effectiveRate = firstRequestFailures / (estimatedActiveUsers * requestsPerUser) * 100;
console.log(\`\\nWith token refresh on failure:\`);
console.log(\`  Effective failure rate: \${effectiveRate.toFixed(1)}%\`);`,
    filename: "revised-simulation.ts"
  }
})
```

---

## Step 7: Root Cause and Fix

```javascript
thoughtbox({
  thought: "ROOT CAUSE CONFIRMED: JWT secret rotation without graceful rollover. Pods have mismatched secrets. Client-side retry masks some failures (15% vs theoretical 50%).",
  thoughtNumber: 10,
  totalThoughts: 12,
  nextThoughtNeeded: true
})
```

```javascript
thoughtbox({
  thought: "IMMEDIATE FIX: Rolling restart all pods to pick up new secret. All pods will have same secret. Tokens signed with old secret will fail - users must re-login once.",
  thoughtNumber: 11,
  totalThoughts: 12,
  nextThoughtNeeded: true
})
```

```javascript
thoughtbox({
  thought: "LONG-TERM FIX: Implement dual-secret validation. JWT validator accepts both old and new secret during rotation window. After window closes (24h), remove old secret.",
  thoughtNumber: 12,
  totalThoughts: 12,
  nextThoughtNeeded: false
})
```

---

## Step 8: Document Findings

```javascript
notebook({
  operation: "add_cell",
  args: {
    notebookId: "...",
    cellType: "markdown",
    content: `# Incident Post-Mortem: Authentication Spike 2024-XX-XX

## Summary
Login failures spiked to 15% due to JWT secret rotation causing signature mismatches across pods.

## Timeline
- 14:30 UTC: JWT_SECRET rotated in Kubernetes
- 14:32 UTC: New pods started with new secret
- 14:35 UTC: Alerts triggered for auth failures
- 15:00 UTC: Root cause identified
- 15:15 UTC: Rolling restart initiated
- 15:30 UTC: All pods on new secret, failures resolved

## Root Cause
Secret rotation updated Kubernetes secret, but only new pods loaded the change. Existing pods retained old secret. JWT tokens signed with mismatched secrets failed validation.

## Five Whys Analysis
1. Why invalid sessions? → Signature validation failed
2. Why signature fail? → Secret key mismatch
3. Why mismatch? → Different pods had different secrets
4. Why different secrets? → Secret rotated without pod restart
5. Why no restart? → No automated secret reload mechanism

## Fix Applied
1. Immediate: Rolling restart to synchronize secrets
2. Permanent: Implement dual-secret validation window

## Action Items
- [ ] Implement dual-secret JWT validation
- [ ] Add monitoring for secret version across pods
- [ ] Document secret rotation procedure
- [ ] Add runbook for secret mismatch incidents`
  }
})
```

```javascript
// Export incident report
notebook({
  operation: "export",
  args: {
    notebookId: "...",
    path: "./incidents/2024-XX-XX-auth-spike.src.md"
  }
})
```

---

## Summary

This example demonstrated:

1. **Five Whys**: Systematically drilled from symptom to root cause
2. **Backward Thinking**: Started from failure, worked back through causal chain
3. **Rubber Duck**: Walked through code flow to understand behavior
4. **Notebook Validation**: Simulated the failure to verify hypothesis
5. **Revision**: Updated analysis when numbers didn't match
6. **Documentation**: Captured findings as incident post-mortem

Key techniques:
- **Precise problem statement**: "15% failures starting 14:32 UTC" not "auth is broken"
- **Quantitative validation**: Simulation revealed missing factor (token age)
- **Multiple mental models**: Five-whys + rubber duck complemented each other
- **Hypothesis testing**: Notebook code verified/refined understanding
