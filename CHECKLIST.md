# Session Storage Task Integration - Verification Checklist

## Functional Requirements

- [ ] Can create session and link to task
- [ ] Can link existing session to task
- [ ] Can query sessions by task ID
- [ ] Can unlink session from task
- [ ] Session deletion doesn't break task storage
- [ ] Task deletion handles session references gracefully

## Technical Requirements

- [ ] ThoughtboxStorage interface has linkToTask() method
- [ ] ThoughtboxStorage interface has unlinkFromTask() method
- [ ] ThoughtboxStorage interface has getSessionsByTask() method
- [ ] FileSystemStorage implements all three methods
- [ ] InMemoryStorage implements all three methods
- [ ] SQL schema includes task_id column
- [ ] SQL schema includes task_role column
- [ ] SQL index on task_id exists
- [ ] TaskHandler uses new linkToTask() method
- [ ] No TODO comments remain in task handler

## Quality Checks

- [ ] TypeScript compiles without errors
- [ ] No new ESLint warnings
- [ ] SQL indexes work (query performance acceptable)
- [ ] Backward compatibility (sessions without tasks work)
- [ ] Reference integrity maintained
- [ ] Error messages are clear and actionable

## Testing

- [ ] Demo script runs successfully
- [ ] Can spawn session from task
- [ ] Can link existing session to task
- [ ] Session queries by task return correct results
- [ ] Session deletion cleans up task references
- [ ] Task deletion cleans up session references
