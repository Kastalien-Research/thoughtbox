# SPEC-05: Migration and Cleanup

## Purpose

Coordinate the cutover from local-file protocol state to Supabase-only, and
clean up the artifacts that are no longer needed.

## Migration Order

1. **Deploy schema** (SPEC-01) — tables and RPC functions in Supabase
2. **Deploy rewritten scripts** (SPEC-02, SPEC-03) — new theseus.sh and
   ulysses.sh that talk to Supabase
3. **Deploy hook update** (SPEC-04) — pre_tool_use.sh with Supabase query
4. **Clean up** — remove local-file references and dead code

Steps 2 and 3 can be deployed in parallel since they're independent.
Step 1 must be first. Step 4 must be last.

## Cleanup Checklist

### Files to remove

- `.theseus/` directory (and any `.theseus/session.json` in existing repos)
- `.ulysses/` directory (and any `.ulysses/session.json` in existing repos)
- `.gitignore` entries for `.theseus/` and `.ulysses/` (if any)

### Files to update

- `.claude/skills/theseus-protocol/SKILL.md` — remove references to
  `.theseus/session.json` and local state directory
- `.claude/skills/ulysses-protocol/SKILL.md` — remove references to
  `.ulysses/session.json` and local state directory
- `.claude/skills/theseus-protocol/references/theseus-gate.md` — already
  updated to reflect Supabase-only architecture
- `.gemini/skills/ulysses-protocol/SKILL.md` — same updates as Claude version
- Any hook documentation that references local protocol state files

### SKILL.md updates

The "Candidate Hooks" tables in both SKILL.md files reference
`.ulysses/session.json` and `.theseus/session.json` as the existence check.
These should be updated to say "queries Supabase for active session" instead.

### Gemini counterpart

The `.gemini/skills/ulysses-protocol/` directory has its own SKILL.md and
Python script (`ulysses.py`). Decision needed:

- **Option A**: Rewrite `ulysses.py` to use Supabase (same as SPEC-03 but
  Python instead of bash)
- **Option B**: Delete `ulysses.py` and have the Gemini SKILL.md reference
  the bash script (same script, both runtimes)

Option B is simpler and avoids maintaining two implementations. Both Claude
and Gemini can run bash.

## Backward Compatibility

There is none. Once the scripts are rewritten, they require Supabase. If
`SUPABASE_URL` is not set, the scripts error out immediately with a clear
message.

This is intentional. The local-file path was never deployed — it was a
development convenience. Removing it simplifies the codebase.

## Verification

After migration:

1. `theseus.sh init src/foo.ts` creates a row in `protocol_sessions`
2. `theseus.sh status` reads from Supabase and prints correctly
3. Writing to a test file during an active Theseus session is blocked by
   `pre_tool_use.sh`
4. Writing to an out-of-scope file is blocked until a visa is filed
5. `ulysses.sh init` creates a row in `protocol_sessions`
6. `ulysses.sh plan "..." "..."` updates `state_json` in Supabase
7. No `.theseus/` or `.ulysses/` directories are created anywhere

## Acceptance Criteria

- [ ] Schema deployed to Supabase
- [ ] Both scripts work end-to-end against Supabase
- [ ] Hook enforcement works for Theseus test lock and scope lock
- [ ] No local state directories created
- [ ] All SKILL.md references updated
- [ ] Gemini counterpart decision made and executed
- [ ] Old local state directories removed from any existing checkouts
