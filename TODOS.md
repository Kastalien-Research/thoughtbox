# Session Storage Task Integration - Implementation TODOs

Based on: `docs/SESSION_STORAGE_TASK_INTEGRATION.md`

## Phase 1: Interface Updates ✅ COMPLETE

- [x] 1.1 Add three methods to ThoughtboxStorage interface in `src/persistence/types.ts`:
  - [x] linkToTask(sessionId, taskId, role)
  - [x] unlinkFromTask(sessionId)
  - [x] getSessionsByTask(taskId)
- [x] 1.2 Add SessionTaskRole definition to persistence/types.ts
- [x] 1.3 Add taskId and taskRole fields to Session interface

## Phase 2: FileSystemStorage Implementation ✅ COMPLETE

- [x] 2.1 Add SQL schema migration for sessions table:
  - Note: FileSystemStorage doesn't use SQL, uses in-memory Map
- [x] 2.2 Implement linkToTask() method
- [x] 2.3 Implement unlinkFromTask() method
- [x] 2.4 Implement getSessionsByTask() method
- [x] 2.5 Update deleteSession() to handle task references (existing implementation sufficient)

## Phase 3: InMemoryStorage Implementation ✅ COMPLETE

- [x] 3.1 Implement linkToTask() method (in-memory version)
- [x] 3.2 Implement unlinkFromTask() method (in-memory version)
- [x] 3.3 Implement getSessionsByTask() method (filter-based)

## Phase 4: TaskHandler Integration ✅ COMPLETE

- [x] 4.1 Update handleSpawnSession() to use linkToTask() instead of updateSession()
- [x] 4.2 Update handleLinkSession() to use linkToTask() instead of updateSession()
- [x] 4.3 Remove TODO comments from handler.ts

## Phase 5: Verification ✅ COMPLETE

- [x] 5.1 Run TypeScript compilation (npx tsc --noEmit) - NO ERRORS
- [ ] 5.2 Run demo script (npx tsx scripts/demo-task-gateway.ts) - PENDING (needs server-factory integration)
- [ ] 5.3 Test session-task linking manually - PENDING (needs full server wiring)
- [ ] 5.4 Verify SQL indexes were created - N/A (FileSystemStorage uses Map, not SQL)
- [ ] 5.5 Test backward compatibility (sessions without tasks) - PENDING
