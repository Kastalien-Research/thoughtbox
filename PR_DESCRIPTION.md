# Improve Agent Discoverability with Embedded Schemas

## Problem

Codex (an AI agent with full MCP spec support) had significant trouble using the Thoughtbox MCP server during initialization:
- Would call init and then stop, unable to proceed
- Got confused by contradictory messaging about "new tools" and "waiting for next turn"
- Had no way to discover operation parameters without trial-and-error
- Unclear whether to use individual tools or gateway (messaging framed gateway as fallback)

**Root Cause:** Confusing messaging that claimed "new tools are available" when operations are actually routed through the gateway, combined with artificial "STOP HERE" turn boundaries that blocked agent progress.

## Solution

### 1. Fixed Confusing Messaging (CRITICAL)

**Removed:**
- ❌ "⚠️ STOP HERE - DO NOT CALL ANY MORE TOOLS IN THIS TURN"
- ❌ "New tools (`thoughtbox_cipher`, `session`) are now available"
- ❌ "Wait for the user to send another message"
- ❌ "If newly unlocked tools don't appear, use gateway"

**Added:**
- ✅ "The gateway now supports additional operations: cipher, session, deep_analysis"
- ✅ Clear next action with working code example
- ✅ Terminology glossary (operations vs tools vs resources)
- ✅ Frame gateway as primary interface, not fallback

### 2. Added Embedded Operation Schemas (HIGH VALUE)

**New File:** `src/resources/operation-schemas-content.ts`

Created two comprehensive schema resources that embed automatically in responses:

**Stage 1 Schema** (after `start_new`/`load_context`):
- Documents: `cipher`, `session`, `deep_analysis`
- Complete parameter schemas (required/optional)
- Working code examples for each operation
- Explanation of 3 different nesting patterns

**Stage 2 Schema** (after `cipher`):
- Documents: `thought`, `read_thoughts`, `get_structure`, `notebook`, `mental_models`, `knowledge`
- Full schemas with all parameter details
- Examples for each operation including cipher notation
- Common mistakes section with corrections
- Clear workflow guidance

### 3. Documentation Improvements

**Added clarifying comments:**
- `ConnectionStage` = WHERE you are (per-session navigation state)
- `DisclosureStage` = WHAT operations are available (global operation visibility)
- Gateway terminology glossary in tool description

### 4. Workflow Automation

**Added critical rule to CLAUDE.md:**
- Claude must ALWAYS rebuild Docker after modifying `src/**/*.ts`
- No asking - automatic rebuild for testing
- Clear instruction to user: "run `/mcp` to reconnect"

## Changes

### Modified Files
- `src/init/tool-handler.ts` - Fixed messaging in `buildLoadedContextMarkdown()` and `buildNewWorkSuggestionsMarkdown()`
- `src/gateway/gateway-handler.ts` - Updated `handleCipher()` response with Stage 2 schema
- `src/tool-descriptions.ts` - Fixed tool descriptions, added terminology glossary
- `src/init/state-manager.ts` - Added explanatory comments
- `src/tool-registry.ts` - Added explanatory comments
- `CLAUDE.md` - Added critical Docker rebuild rule

### New Files
- `src/resources/operation-schemas-content.ts` - Embedded schema resources (503 lines)
- `AGENT_USABILITY_FIXES.md` - Complete implementation documentation

### Stats
- 7 files changed
- 817 additions, 44 deletions
- 3 commits

## Testing

✅ **Manual Testing:**
- Initialized new session with `start_new` → Stage 1 schema appears correctly
- Called `cipher` → Stage 2 schema appears correctly
- Executed `thought` operation → Works successfully
- No confusing messaging observed
- Clear examples in all responses

✅ **Build:**
- TypeScript compilation successful
- No cyclic dependencies
- All embedded content valid

## Expected Impact

**Before:** Agents got stuck during initialization, confused by contradictory instructions and lack of schema documentation

**After:** Clear path from `start_new` → `cipher` → `thought` with embedded schemas providing proactive discovery at each stage

**Agent Experience:**
1. Agent calls `start_new` → Gets clear instructions and full Stage 1 schema
2. Agent calls `cipher` → Gets notation system and full Stage 2 schema
3. Agent calls `thought` → Has working examples to follow
4. No artificial barriers or confusing messaging

## Related Issues

Fixes reported usability issues with Codex agent during Thoughtbox initialization.

## Checklist

- [x] Code compiles without errors
- [x] No cyclic dependencies
- [x] Conventional commit messages used
- [x] Manual testing completed successfully
- [x] Documentation updated (CLAUDE.md, AGENT_USABILITY_FIXES.md)
- [x] Schema resources validated with actual operations
- [x] All examples are copy-paste valid TypeScript

## Breaking Changes

None. This is purely additive messaging and documentation improvements.

## Migration Guide

No migration needed. Existing agents will benefit immediately from clearer messaging and embedded schemas.

---

**Ready to merge:** ✅ All changes tested and validated with live MCP server
