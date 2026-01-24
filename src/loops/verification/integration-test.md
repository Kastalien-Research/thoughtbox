---
type: verification
speed: medium-slow
scope: collection
interface_version: loop-interface@1.0
description: Verify that components work together correctly.
---
# Integration Test Loop

Verify that components work together correctly.

**Version**: 1.0.0
**Interface**: loop-interface@1.0

## Classification

- **Type**: verification
- **Speed**: medium-slow (~1-5 minutes)
- **Scope**: collection (multiple components)

## Interface

### Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| components | List<Component> | yes | Components to test together |
| integration_points | List<IntegrationPoint> | no | Specific integrations to verify |
| test_scenarios | List<Scenario> | no | Custom test scenarios |
| environment | Environment | no | Test environment config |

### Outputs

| Name | Type | Description |
|------|------|-------------|
| passed | Boolean | Overall pass/fail |
| results | List<TestResult> | Result for each test |
| failures | List<Failure> | Failed tests with details |
| coverage | IntegrationCoverage | What integrations were tested |
| recommendations | List<Recommendation> | Suggested fixes or improvements |

### State

| Field | Type | Description |
|-------|------|-------------|
| tests_run | List<Test> | Tests executed |
| setup_state | SetupState | Test environment state |

## Types

```typescript
type Component = {
  name: string
  type: "service" | "module" | "api" | "database"
  entry_point: string
  dependencies: List<string>
}

type IntegrationPoint = {
  from: string  // Component name
  to: string    // Component name
  type: "api_call" | "event" | "data_flow" | "import"
  contract: Contract
}

type Scenario = {
  name: string
  description: string
  steps: List<Step>
  expected_outcome: Outcome
  cleanup: List<Action>
}

type TestResult = {
  test_name: string
  passed: boolean
  duration_ms: number
  output: string
  error?: Error
}
```

## OODA Phases

### OBSERVE

Analyze integration landscape:

```
1. MAP component dependencies:
   
   dependency_graph = {}
   
   FOR component in components:
     dependencies = analyze_dependencies(component)
     dependency_graph[component.name] = dependencies
   
   # Detect integration points if not provided
   IF not integration_points:
     integration_points = infer_integration_points(
       components,
       dependency_graph
     )

2. IDENTIFY test scenarios:
   
   IF test_scenarios:
     scenarios = test_scenarios
   ELSE:
     scenarios = []
     
     # Generate scenarios from integration points
     FOR point in integration_points:
       scenarios.append(generate_scenario(point))
     
     # Add cross-cutting scenarios
     scenarios.extend([
       happy_path_scenario(components),
       error_propagation_scenario(components),
       concurrent_access_scenario(components)
     ])

3. ASSESS environment:
   
   IF environment:
     env_ready = verify_environment(environment)
   ELSE:
     # Detect or create test environment
     environment = detect_test_environment()
     IF not environment:
       environment = create_isolated_environment(components)
   
   IF not env_ready:
     env_issues = diagnose_environment(environment)

4. LOAD existing tests:
   
   existing_tests = find_integration_tests(components)
   
   FOR test in existing_tests:
     relevant_scenarios = match_to_scenarios(test, scenarios)
     IF relevant_scenarios:
       test.covers = relevant_scenarios
       tests_available.append(test)

SIGNALS:
  integration_points: all integrations to test
  scenarios: test scenarios to run
  environment: test environment status
  existing_tests: relevant tests found
```

### ORIENT

Plan test execution:

```
1. ORDER tests by dependency:
   
   # Test foundation components first
   test_order = topological_sort(
     scenarios,
     by=lambda s: dependency_depth(s.components)
   )

2. GROUP related tests:
   
   test_groups = {
     "unit_integration": [],   # Single integration point
     "flow_integration": [],   # Multi-step flows
     "stress_integration": [], # Concurrent/load tests
     "error_handling": []      # Error scenarios
   }
   
   FOR scenario in scenarios:
     group = classify_scenario(scenario)
     test_groups[group].append(scenario)

3. ESTIMATE resources:
   
   FOR scenario in scenarios:
     scenario.estimated_duration = estimate_duration(scenario)
     scenario.resource_requirements = estimate_resources(scenario)
   
   total_duration = sum(s.estimated_duration for s in scenarios)
   
   IF total_duration > time_budget:
     # Prioritize critical paths
     scenarios = prioritize_scenarios(scenarios, time_budget)

4. PLAN setup/teardown:
   
   setup_actions = []
   teardown_actions = []
   
   FOR component in components:
     IF needs_setup(component):
       setup_actions.append(generate_setup(component))
     IF needs_teardown(component):
       teardown_actions.append(generate_teardown(component))
```

### DECIDE

Commit to test execution strategy:

```
1. VALIDATE prerequisites:
   
   blockers = []
   
   IF not environment.ready:
     blockers.append("Environment not ready")
   
   FOR component in components:
     IF not component.accessible:
       blockers.append(f"{component.name} not accessible")
   
   IF blockers:
     decision = "BLOCK"
     rationale = blockers

2. SELECT execution mode:
   
   IF len(scenarios) < 10:
     execution_mode = "sequential"
   ELIF all(s.independent for s in scenarios):
     execution_mode = "parallel"
   ELSE:
     execution_mode = "mixed"
     # Sequential for dependent, parallel for independent

3. SET failure handling:
   
   failure_strategy = {
     "fail_fast": False,      # Continue on failure
     "retry_count": 1,        # Retry flaky tests once
     "quarantine": [],        # Known flaky tests
     "critical_paths": [...]  # Must pass
   }
```

### ACT

Execute integration tests:

```
1. SETUP environment:
   
   FOR action in setup_actions:
     result = execute_setup(action)
     IF not result.success:
       EMIT setup_failed { action, error: result.error }
       RETURN { passed: False, failures: [setup_failure] }
   
   setup_state = capture_state(environment)

2. RUN tests:
   
   results = []
   failures = []
   
   IF execution_mode == "sequential":
     FOR scenario in test_order:
       result = run_scenario(scenario)
       results.append(result)
       tests_run.append(scenario)
       
       IF not result.passed:
         failures.append({
           scenario: scenario.name,
           error: result.error,
           output: result.output,
           duration: result.duration_ms
         })
         
         IF scenario in failure_strategy.critical_paths:
           IF failure_strategy.fail_fast:
             BREAK
   
   ELIF execution_mode == "parallel":
     # Run independent tests concurrently
     results = parallel_execute(scenarios, max_concurrency=4)
     failures = filter(results, passed == False)
   
   ELIF execution_mode == "mixed":
     # Execute in waves
     FOR wave in partition_by_dependencies(scenarios):
       wave_results = parallel_execute(wave)
       results.extend(wave_results)
       failures.extend(filter(wave_results, passed == False))

3. ANALYZE failures:
   
   FOR failure in failures:
     failure.analysis = analyze_failure(
       scenario: failure.scenario,
       error: failure.error,
       logs: collect_logs(failure.scenario.components)
     )
     
     failure.root_cause = identify_root_cause(failure.analysis)
     
     IF can_suggest_fix(failure.root_cause):
       recommendations.append({
         failure: failure.scenario,
         fix: generate_fix_suggestion(failure.root_cause)
       })

4. TEARDOWN:
   
   FOR action in teardown_actions:
     execute_teardown(action)
   
   restore_state(setup_state)

5. CALCULATE coverage:
   
   coverage = {
     integration_points_tested: len(set(
       point for scenario in tests_run 
       for point in scenario.integration_points
     )),
     integration_points_total: len(integration_points),
     coverage_percentage: tested / total,
     untested: [
       point for point in integration_points
       if point not in tested_points
     ]
   }

6. EMIT results:
   
   passed = len(failures) == 0
   
   IF passed:
     EMIT integration_passed {
       tests_run: len(tests_run),
       duration_ms: total_duration,
       coverage: coverage.coverage_percentage
     }
   ELSE:
     EMIT integration_failed {
       tests_run: len(tests_run),
       failures: len(failures),
       critical_failures: count_critical(failures)
     }

7. RETURN:
   
   RETURN {
     passed: passed,
     results: results,
     failures: failures,
     coverage: coverage,
     recommendations: recommendations
   }
```

## Termination Conditions

- **Success**: All tests pass
- **Failure**: Any test fails (configurable with fail_fast)
- **Timeout**: Test execution exceeds time budget

## Composition

### Can contain (nested loops)
- None (executes external tests)

### Can be contained by
- `orchestration/queue-processor` (milestone verification)
- `verification/acceptance-gate` (as verification step)
- Workflow commands (`/spec-orchestrator`)

### Parallelizable
- Conditional: Independent test scenarios can run in parallel
- No: Tests with shared state must be sequential

## Signals Emitted

| Signal | When | Payload |
|--------|------|---------|
| `setup_started` | Environment setup begins | `{ components }` |
| `setup_failed` | Setup fails | `{ action, error }` |
| `test_started` | Individual test starts | `{ scenario }` |
| `test_passed` | Individual test passes | `{ scenario, duration }` |
| `test_failed` | Individual test fails | `{ scenario, error }` |
| `integration_passed` | All tests pass | `{ tests_run, coverage }` |
| `integration_failed` | Tests fail | `{ failures, critical }` |

## Scenario Templates

### API Integration Scenario

```yaml
name: "User API → Auth Service Integration"
steps:
  - action: "POST /api/users/login"
    with:
      email: "test@example.com"
      password: "test123"
  - verify:
      status: 200
      body.token: exists
  - action: "GET /api/users/me"
    with:
      headers:
        Authorization: "Bearer ${previous.body.token}"
  - verify:
      status: 200
      body.email: "test@example.com"
cleanup:
  - action: "DELETE test user"
```

### Event Flow Scenario

```yaml
name: "Order → Payment → Notification Flow"
steps:
  - action: "Create order"
  - wait_for_event: "OrderCreated"
  - verify: "Payment service received order"
  - action: "Complete payment"
  - wait_for_event: "PaymentCompleted"
  - verify: "Notification sent to user"
expected_duration_ms: 5000
```

## Example Usage

```markdown
## Integration Verification

Execute @loops/verification/integration-test.md with:
  INPUT:
    components: [auth_service, user_api, notification_service]
    integration_points: discovered_integrations
    environment: { type: "docker", config: "docker-compose.test.yml" }
  
  ON setup_failed:
    HALT with environment error
  
  ON test_failed:
    LOG failure details
    IF failure.critical:
      HALT workflow
  
  ON integration_passed:
    PROCEED to next phase
  
  ON integration_failed:
    FOR each recommendation:
      ATTEMPT fix
    RE-RUN failed tests
```
