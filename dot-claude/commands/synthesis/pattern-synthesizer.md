# Pattern Synthesizer

Extract, analyze, and synthesize patterns across multiple codebases, repositories, and knowledge sources to create reusable solutions.

## Variables

PATTERN_DOMAIN: $ARGUMENTS
SOURCES: ["current_codebase", "github", "web", "mem0"]
SYNTHESIS_DEPTH: "surface" | "deep" | "architectural"

## Execution Strategy

### 1. Pattern Discovery

```
=> research_patterns: Search GitHub for similar implementations
=> analyze_current: Extract patterns from current codebase
=> web_research: Find documented best practices
=> memory_recall: Retrieve stored patterns from mem0
```

### 2. Pattern Classification

- **Structural Patterns**: How code is organized
- **Behavioral Patterns**: How components interact
- **Creational Patterns**: How objects/modules are created
- **Integration Patterns**: How systems connect
- **Evolution Patterns**: How patterns change over time

### 3. Cross-Pattern Analysis

```
-> correlate_patterns: Find relationships between patterns
-> identify_variants: Catalog different implementations
-> assess_quality: Evaluate effectiveness and maintainability
-> extract_principles: Derive underlying design principles
```

### 4. Synthesis & Abstraction

```
-> abstract_commonalities: Extract common elements
-> create_meta_pattern: Design higher-order pattern
-> generate_implementations: Create multiple concrete variants
-> document_usage: Write usage guidelines and examples
```

## Pattern Types

### Code Patterns

- Function composition strategies
- Error handling approaches
- State management patterns
- Async operation patterns
- Testing strategies

### Architecture Patterns

- Service communication
- Data flow design
- Module boundaries
- Scaling strategies
- Deployment patterns

### Workflow Patterns

- Development processes
- CI/CD strategies
- Code review practices
- Documentation approaches
- Team coordination

### Meta-Patterns

- Pattern selection criteria
- Pattern evolution paths
- Pattern combination strategies
- Context-sensitive adaptations

## Synthesis Outputs

### Pattern Catalog

```markdown
## Pattern: Resilient MCP Communication

### Context

- Distributed systems with unreliable networks
- Multiple MCP servers with varying response times
- Need for graceful degradation

### Forces

- Reliability vs Performance
- Simplicity vs Robustness
- Local vs Remote execution

### Solution Structure

[Code examples and diagrams]

### Variants

1. Circuit Breaker Pattern
2. Retry with Exponential Backoff
3. Failover Chain
4. Bulk Circuit Breaker

### Decision Matrix

[When to use each variant]

### Implementation Guide

[Step-by-step instructions]

### Evolution Path

[How pattern adapts to changing requirements]
```

### Meta-Pattern Framework

```typescript
interface PatternSynthesis {
	domain: string
	extractedPatterns: Pattern[]
	relationships: PatternRelationship[]
	synthesizedPattern: MetaPattern
	implementationGuides: ImplementationGuide[]
	evolutionPaths: EvolutionPath[]
}

interface MetaPattern {
	name: string
	context: Context
	forces: Force[]
	solution: SolutionStructure
	variants: PatternVariant[]
	decisionCriteria: DecisionMatrix
	qualityAttributes: QualityMetrics
}
```

### Reusable Components

- Pattern templates
- Implementation scaffolds
- Testing frameworks
- Documentation generators
- Migration utilities

## Advanced Features

### Cross-Domain Synthesis

- Adapt patterns from other domains
- Translate between paradigms
- Bridge different scales (micro to macro)
- Connect technical and business patterns

### Temporal Pattern Analysis

- Track pattern evolution over time
- Predict pattern lifecycle stages
- Identify emerging patterns early
- Understand deprecation signals

### Context-Aware Adaptation

- Adjust patterns for specific constraints
- Optimize for different quality attributes
- Scale patterns across team sizes
- Adapt for different domains

## Example Usage

```bash
# Synthesize error handling patterns
/pattern-synthesizer "error handling in async operations"

Discovers and synthesizes:
- Promise-based error handling
- Async/await with try-catch
- Result type patterns
- Error boundary strategies
- Logging and monitoring integration

Output: Meta-pattern for resilient async operations
```

```bash
# Architectural pattern synthesis
/pattern-synthesizer "microservices communication" --depth architectural

Analyzes:
- API gateway patterns
- Service mesh implementations
- Event-driven architectures
- Sync vs async communication
- Circuit breaker implementations

Output: Comprehensive communication strategy framework
```

## Integration with Other Commands

### With Knowledge Graph

- Map pattern relationships
- Visualize pattern dependencies
- Track pattern usage across codebase

### With Implementation Variants

- Generate concrete implementations
- Test pattern effectiveness
- Compare pattern performance

### With Swarm Intelligence

- Coordinate pattern research
- Validate patterns across domains
- Synthesize complex pattern combinations

## Quality Metrics

### Pattern Quality

- Clarity and understandability
- Flexibility and adaptability
- Performance characteristics
- Maintenance overhead
- Team adoption rate

### Synthesis Quality

- Completeness of analysis
- Accuracy of abstraction
- Usefulness of meta-pattern
- Implementation guidance quality
- Future evolution consideration

The Pattern Synthesizer enables systematic learning from the collective intelligence of the development community, creating reusable knowledge that evolves with understanding and context.
