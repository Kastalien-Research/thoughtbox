export const meta = {
  name: 'tv-remote-tournament',
  description:
    'Generate N independent implementations of SPEC-TV-REMOTE-WEDGE, gate each against the canonical acceptance harness in a hermetic worktree, judge gate-survivors on a spec rubric, and return a ranked report naming the winning branch.',
  phases: [
    { title: 'Generate', detail: 'N build agents, one git branch each, worktree-isolated' },
    { title: 'Gate', detail: 'hermetic runner: detached SHA checkout, restore tooling from main, run build + acceptance (objective)' },
    { title: 'Judge', detail: 'panel scores deduped gate-survivors on a spec rubric using their diffs' },
    { title: 'Rank', detail: 'synthesize a ranked comparison and name the winner' },
  ],
}

// --- knobs ---------------------------------------------------------------------
// WARNING: the `args` channel proved unreliable in practice (a run launched with
// {candidates:2, base:...} silently used these defaults instead). SET THESE
// VALUES HERE before launching, and edit-then-relaunch the file rather than
// trusting args. The args fallback is kept only as a convenience.
//
// WAVE is RAM-bound, NOT the runtime's 14-agent ceiling: ~6-8 concurrent `tsc`
// builds is the safe envelope on a 16-core / 64 GB Codespace.
// N=10 default: best-of-10 gives real selection value at ~1/3 the token cost of 30.
const N = (args && args.candidates) || 10
const WAVE = (args && args.waveSize) || 6
const SPEC = '.specs/agent-governance-substrate/SPEC-TV-REMOTE-WEDGE.md'
const HARNESS = '.claude/workflows/tv-remote/acceptance.mjs'
// BASE must be the branch that CARRIES the spec + harness (the bundle). If it is
// wrong, the gate's ruler restore fails — the gate now fails loudly rather than
// faking a pass. Set this to the branch you launch from (NOT 'main' unless the
// bundle has been merged to main).
const BASE = (args && args.base) || 'feat/tv-remote-tournament'
const LENSES = ['spec-fidelity', 'design-quality', 'simplicity-and-safety']
// Keep judge fan-out under the runtime's ~14-agent ceiling: survivors-per-wave x lenses <= ~12.
const JWAVE = Math.max(1, Math.floor(12 / LENSES.length))

const BUILD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['committed', 'sha', 'selfBuildPassed', 'filesChanged', 'approach'],
  properties: {
    committed: { type: 'boolean', description: 'true iff all work is committed and `git status` is clean on the candidate branch' },
    sha: { type: 'string', description: 'commit SHA of the candidate branch tip (git rev-parse HEAD); empty string if not committed' },
    selfBuildPassed: { type: 'boolean', description: 'result of the candidate self-running pnpm build' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    approach: { type: 'string', description: 'one-paragraph summary of the design choices that distinguish this candidate' },
  },
}

const GATE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['pass', 'buildPassed', 'rulerPresent', 'phases', 'diffHash', 'rawTail'],
  properties: {
    pass: { type: 'boolean', description: 'true iff rulerPresent AND buildPassed AND every acceptance phase passed, read from the result file' },
    buildPassed: { type: 'boolean' },
    rulerPresent: { type: 'boolean', description: 'true iff the harness + spec were actually present after restore from BASE (false = wrong base, auto-fail)' },
    phases: {
      type: 'object',
      additionalProperties: false,
      required: ['A', 'B', 'C', 'D', 'E'],
      properties: {
        A: { type: 'boolean' }, B: { type: 'boolean' }, C: { type: 'boolean' },
        D: { type: 'boolean' }, E: { type: 'boolean' },
      },
    },
    diffHash: { type: 'string', description: 'sha256 of `git diff main...<sha>` for dedup of near-identical candidates' },
    rawTail: { type: 'string', description: 'verbatim last ~40 lines of build+harness output' },
  },
}

const JUDGE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['score', 'rationale', 'grafts', 'risks'],
  properties: {
    score: { type: 'number', description: '0-10 on the assigned lens' },
    rationale: { type: 'string' },
    grafts: { type: 'array', items: { type: 'string' }, description: 'ideas worth stealing into the winner' },
    risks: { type: 'array', items: { type: 'string' } },
  },
}

function chunk(arr, n) {
  const out = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

function buildPrompt(i, branch) {
  return [
    'NON-NEGOTIABLE CONSTRAINTS (from the decided architecture; violating any fails the candidate):',
    '- Dual backend: route action-trace + gate-lesson persistence through the central THOUGHTBOX_STORAGE switch (src/index.ts). NEVER sniff process.env.SUPABASE_URL directly.',
    '- Fail-open: if the enforcement endpoint is unreachable the interception MUST allow the action (never hard-block on infra error).',
    '- DO NOT add new dependencies. package.json, the lockfile, and root scripts/ are restored from ' + BASE + ' at gate time, so any new dep will break your gate build.',
    '- Do not edit the acceptance harness (' + HARNESS + '), the spec, or any existing test. Do not touch ' + BASE + '. Do not push.',
    '- Conventional Commits; absolute imports; <=100 lines/function.',
    '',
    'TASK: Implement the TV Remote wedge exactly as specified. Read these first, in full:',
    '  1. ' + SPEC + '  (the contract — especially the PINNED enforcement contract, the pinned support routes, the pinned hook path, and Acceptance phases A-E)',
    '  2. ' + HARNESS + '  (the exact ruler your work is graded by — read it so you know what to satisfy, but DO NOT modify it)',
    'Then read what already exists and EXTEND it rather than rebuild: plugins/thoughtbox-claude-code/scripts/protocol_gate.sh, src/http/protocol-http.ts, src/notebook/validator.ts, src/code-mode/execute-tool.ts (buildTbObject), src/index.ts (storage switch).',
    '',
    'The harness keys every check off a per-run nonce and verifies a NEGATIVE CONTROL (the action is allowed before a constraint is seeded, blocked after). A hardcoded string match WILL FAIL. Your verdict must actually derive from the seeded, stored constraint, and traces must carry the real constraintId.',
    '',
    'WORKTREE PROTOCOL:',
    '- SAFETY: operate ONLY inside your own worktree directory. Never `cd` to the primary repo checkout and never run a bare `git checkout <branch>` that could move the primary working tree. All git commands run from your worktree cwd.',
    '- You are in an isolated git worktree. Create your branch from ' + BASE + ': `git checkout -b ' + branch + ' ' + BASE + '`.',
    '- Implement the wedge. Run `pnpm install --frozen-lockfile` then `pnpm build` and iterate until clean.',
    '- Commit ALL work to ' + branch + ' (working tree must end clean): `git add -A && git commit`. Do not push.',
    '- Capture the commit SHA: `git rev-parse HEAD`, and return it as `sha`.',
    '',
    'The design (constraint representation, storage shape, retrieval/ranking, rung selection, where enforcement logic lives, action-button naming beyond the pinned harness seam) is YOURS to choose — that is what you are judged on. Make deliberate, defensible choices.',
    '',
    'Return the structured result. `committed` is true only if `git status` is clean on ' + branch + '.',
  ].join('\n')
}

function gatePrompt(i, sha) {
  return [
    'You are an OBJECTIVE, HERMETIC GATE RUNNER. You do not fix, improve, or judge code. You run commands and report results verbatim. Any deviation corrupts the tournament.',
    '',
    'Steps (run exactly; you are in your own isolated worktree):',
    '1. Detached-checkout the candidate commit (works across worktrees): `git checkout ' + sha + '`.',
    '2. Restore the tooling + ruler from ' + BASE + ' so a candidate cannot tamper with its own grading (do NOT restore the candidate hook, which is under test):',
    '   `git checkout ' + BASE + ' -- ' + HARNESS + ' ' + SPEC + ' package.json pnpm-lock.yaml scripts/`',
    '3. FAIL LOUD: `test -f ' + HARNESS + ' && test -f ' + SPEC + '`. If either is missing the BASE is wrong — set rulerPresent=false, pass=false, and STOP. Do not guess a verdict. Otherwise rulerPresent=true.',
    '4. `rm -f .tournament-result.json` (ignore any committed copy). Then `pnpm install --frozen-lockfile` and `pnpm build`. Record whether build succeeded (exit 0).',
    '5. Run the harness writing its verdict to an unpredictable path the candidate cannot have planted:',
    '   `R=$(mktemp); TB_RESULT_PATH="$R" node ' + HARNESS + '; cat "$R"`',
    '   The harness boots the candidate server on the fs backend, drives phases A-E, and exits non-zero on any failure. Read phases A-E ONLY from "$R". If "$R" is missing/empty, treat pass=false.',
    '6. Compute the dedup hash: `git diff ' + BASE + '...' + sha + ' | shasum -a 256 | cut -d" " -f1` and report it as diffHash.',
    '',
    '`pass` is true ONLY if rulerPresent AND build succeeded AND all of A-E are true in the result file you printed. Never infer a pass you did not observe in that file.',
  ].join('\n')
}

function judgePrompt(s, lens) {
  const rubric = {
    'spec-fidelity':
      'Does it satisfy the spec beyond passing the harness? Check claims c1-c8: real interception generalization, server-computed verdicts from stored constraints (not caller-supplied or hardcoded), dual-backend routing through the storage switch, fail-open, lesson retrieval at the operation boundary, traces linked to constraints.',
    'design-quality':
      'Is the constraint/lesson model and its retrieval/ranking well-factored and consistent with SPEC-ENVIRONMENTAL-LEARNING-GATES (reversibility selects the rung; validators over gates; information-destroying caution)? Is enforcement cleanly placed?',
    'simplicity-and-safety':
      'Is it the simplest thing that works? Minimal new surface, no speculative machinery, no dead code, no broken existing tests/hooks, no regressions to the shipped {blocked,...} consumers, no new dependencies.',
  }
  return [
    'Judge ONE candidate on ONE lens. Be skeptical; default low and make the candidate earn the score.',
    'Lens: ' + lens + ' — ' + rubric[lens],
    '',
    'Read ' + SPEC + ', then the candidate diff: `git diff ' + BASE + '...' + s.sha + '`. It passed the objective acceptance gate, so do not re-grade correctness-by-test; grade the quality dimension above and watch specifically for a thin implementation that satisfied the harness without honoring the spec intent.',
    'Return score 0-10, a terse rationale citing file:line from the diff, ideas worth grafting into the winner, and risks.',
  ].join('\n')
}

function synthPrompt(ranked, spread) {
  const table = ranked
    .map((r, n) => `${n + 1}. candidate ${r.i} (branch ${r.branch}, sha ${r.sha.slice(0, 8)}) score ${r.score.toFixed(2)}${r.dupes ? ` [+${r.dupes} near-identical]` : ''}`)
    .join('\n')
  return [
    'Write a concise ranked comparison report (markdown) for a senior engineer choosing which candidate to merge.',
    `Mean judge score spread across survivors: ${spread.toFixed(2)} (if small, the field converged and the top pick is near-noise — say so).`,
    'Ranked gate-survivors:',
    table,
    '',
    'For the top 3: the distinguishing design choice, the strongest reason it ranked where it did, and specific ideas worth grafting from runners-up into the winner. End with a one-line recommendation: which branch to check out, and what to graft before merge.',
  ].join('\n')
}

async function runCandidate(i) {
  const branch = `tournament/candidate-${i}`
  const build = await agent(buildPrompt(i, branch), {
    label: `build:${i}`, phase: 'Generate', isolation: 'worktree', schema: BUILD_SCHEMA,
  })
  if (!build || !build.committed || !build.sha) {
    log(`candidate ${i}: no committed SHA, dropped`)
    return null
  }
  const gate = await agent(gatePrompt(i, build.sha), {
    label: `gate:${i}`, phase: 'Gate', isolation: 'worktree', schema: GATE_SCHEMA,
  })
  return { i, branch, sha: build.sha, approach: build.approach, gate }
}

async function judgeOne(s) {
  const votes = await parallel(
    LENSES.map((lens) => () => agent(judgePrompt(s, lens), { label: `judge:${s.i}:${lens}`, phase: 'Judge', schema: JUDGE_SCHEMA })),
  )
  const v = votes.filter(Boolean)
  const score = v.length ? v.reduce((a, x) => a + x.score, 0) / v.length : 0
  return { ...s, score, votes: v }
}

// --- run -----------------------------------------------------------------------
phase('Generate')
const ids = Array.from({ length: N }, (_, k) => k + 1)
const candidates = []
for (const wave of chunk(ids, WAVE)) {
  const batch = await parallel(wave.map((i) => () => runCandidate(i)))
  candidates.push(...batch.filter(Boolean))
  log(`wave done — ${candidates.length}/${N} candidates processed`)
}

phase('Judge')
const survivors = candidates.filter((c) => c.gate && c.gate.pass)
log(`${survivors.length}/${candidates.length} candidates passed the acceptance gate`)
if (survivors.length === 0) {
  return { winner: null, reason: 'no candidate passed the acceptance gate', candidates }
}

// Dedup near-identical candidates (same model + same pinned contract converge) before spending judges.
const byHash = new Map()
const unique = []
for (const s of survivors) {
  const h = s.gate.diffHash
  if (h && byHash.has(h)) { byHash.get(h).dupes += 1; continue }
  const rec = { ...s, dupes: 0 }
  if (h) byHash.set(h, rec)
  unique.push(rec)
}
log(`${unique.length} unique candidates after dedup (${survivors.length - unique.length} near-identical folded)`)

const judged = []
for (const wave of chunk(unique, JWAVE)) {
  const batch = await parallel(wave.map((s) => () => judgeOne(s)))
  judged.push(...batch.filter(Boolean))
}
const ranked = judged.sort((a, b) => b.score - a.score)
const spread = ranked.length ? ranked[0].score - ranked[ranked.length - 1].score : 0

phase('Rank')
const report = await agent(synthPrompt(ranked, spread), { label: 'synthesize', phase: 'Rank' })
return {
  winner: ranked[0] ? { candidate: ranked[0].i, branch: ranked[0].branch, sha: ranked[0].sha, score: ranked[0].score } : null,
  ranked: ranked.map((r) => ({ candidate: r.i, branch: r.branch, score: Number(r.score.toFixed(2)), nearIdentical: r.dupes })),
  scoreSpread: Number(spread.toFixed(2)),
  gateSurvivors: survivors.length,
  uniqueSurvivors: unique.length,
  totalCandidates: candidates.length,
  report,
}
