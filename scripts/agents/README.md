## Agent Helpers

### Generic profile runner
Run any non-hub `.claude/agents/*.md` profile:
```bash
npx tsx scripts/agents/run-agent.ts \
  --agent dependency-verifier \
  --prompt "Validate claim X"
```

### Convenience wrappers
```bash
# Agentic dev team — canonical roles
npx tsx scripts/agents/triage-fix.ts --prompt "..."
npx tsx scripts/agents/dependency-verifier.ts --prompt "..."
npx tsx scripts/agents/research-taste.ts --prompt "..."
npx tsx scripts/agents/coordination-momentum.ts --prompt "..."
npx tsx scripts/agents/verification-judge.ts --prompt "..."

# Agentic dev team — continual improvement variants
npx tsx scripts/agents/hook-health.ts --prompt "..."
npx tsx scripts/agents/assumption-auditor.ts --prompt "..."
npx tsx scripts/agents/cost-governor.ts --prompt "..."
npx tsx scripts/agents/regression-sentinel.ts --prompt "..."

# Adversarial agents (self-improving via shared playbook)
npx tsx scripts/agents/devils-advocate.ts --prompt "Review specs/continual-improvement/01-unified-loop-controller.md"
npx tsx scripts/agents/silent-failure-hunter.ts --prompt "Scan all hooks in .claude/hooks/ and specs/continual-improvement/hooks/"

# Utility agents
npx tsx scripts/agents/architecture-diagrammer.ts --prompt "..."
npx tsx scripts/agents/meta-agent.ts --prompt "..."
npx tsx scripts/agents/fact-checking-agent.ts --prompt "..."
```

### Extra SDK helpers

```bash
npx tsx scripts/agents/agent-harness.ts --prompt "..."
npx tsx scripts/agents/spec-implementer.ts --file specs/continual-improvement/04-cross-session-continuity.md --plan-only
npx tsx scripts/agents/ulc-meta-loop.ts --budget 2
```
