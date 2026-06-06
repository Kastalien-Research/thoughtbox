export const meta = {
  name: 'tv-remote-salvage',
  description:
    'Re-gate and judge the 18 EXISTING tv-remote candidate branches (no regeneration). Fixes the BASE bug from the first run: restores the ruler from feat/tv-remote-tournament and fails loudly if it is absent, then judges gate-survivors and ranks them.',
  phases: [
    { title: 'Gate', detail: 'hermetic re-gate of existing branches against the canonical harness' },
    { title: 'Judge', detail: 'panel scores deduped survivors on a spec rubric' },
    { title: 'Rank', detail: 'synthesize a ranked comparison and name the winner' },
  ],
}

// The bundle (spec + harness + tooling) lives here; candidates forked from main
// and carry only their implementation. The gate restores the ruler from BASE.
const BASE = 'feat/tv-remote-tournament'
const SPEC = '.specs/agent-governance-substrate/SPEC-TV-REMOTE-WEDGE.md'
const HARNESS = '.claude/workflows/tv-remote/acceptance.mjs'
const WAVE = (args && args.waveSize) || 4 // gentle: gate builds are RAM-heavy
const LENSES = ['spec-fidelity', 'design-quality', 'simplicity-and-safety']
const JWAVE = Math.max(1, Math.floor(12 / LENSES.length))
// Only the candidates with real implementations (19-24 were empty/partial).
const CANDS = Array.from({ length: 18 }, (_, k) => ({ i: k + 1, branch: `tournament/candidate-${k + 1}` }))

const GATE_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['pass', 'buildPassed', 'rulerPresent', 'phases', 'diffHash', 'rawTail'],
  properties: {
    pass: { type: 'boolean', description: 'true iff rulerPresent AND buildPassed AND all phases A-E true' },
    buildPassed: { type: 'boolean' },
    rulerPresent: { type: 'boolean', description: 'true iff the harness + spec were actually present after restore from BASE' },
    phases: {
      type: 'object', additionalProperties: false, required: ['A', 'B', 'C', 'D', 'E'],
      properties: { A: { type: 'boolean' }, B: { type: 'boolean' }, C: { type: 'boolean' }, D: { type: 'boolean' }, E: { type: 'boolean' } },
    },
    diffHash: { type: 'string' },
    rawTail: { type: 'string', description: 'verbatim last ~40 lines of output' },
  },
}
const JUDGE_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['score', 'rationale', 'grafts', 'risks'],
  properties: {
    score: { type: 'number' }, rationale: { type: 'string' },
    grafts: { type: 'array', items: { type: 'string' } }, risks: { type: 'array', items: { type: 'string' } },
  },
}

function chunk(arr, n) { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o }

function gatePrompt(branch) {
  return [
    'You are an OBJECTIVE, HERMETIC GATE RUNNER. Run commands and report results verbatim. Do not fix, improve, or judge. Any deviation corrupts the tournament.',
    '',
    'SAFETY: operate ONLY inside your own worktree cwd. Never `cd` to the primary repo checkout and never run a bare `git checkout <branch>` (it can move the primary working tree). Detached SHA checkout in your worktree is fine.',
    'Steps (you are in your own isolated worktree):',
    '1. `SHA=$(git rev-parse ' + branch + ')` then `git checkout "$SHA"` (detached).',
    '2. Restore the ruler + tooling from ' + BASE + ': `git checkout ' + BASE + ' -- ' + HARNESS + ' ' + SPEC + ' package.json pnpm-lock.yaml scripts/`',
    '3. FAIL LOUD: `test -f ' + HARNESS + ' && test -f ' + SPEC + '`. If either is missing, set rulerPresent=false, pass=false, and STOP — do not guess a verdict. Otherwise rulerPresent=true.',
    '4. `rm -f .tournament-result.json`; `pnpm install --frozen-lockfile`; `pnpm build` (record buildPassed).',
    '5. `R=$(mktemp); TB_RESULT_PATH="$R" node ' + HARNESS + '; cat "$R"`. Read phases A-E ONLY from "$R". Missing/empty file => pass=false.',
    '6. `git diff ' + BASE + '...$SHA | shasum -a 256 | cut -d" " -f1` => diffHash.',
    '',
    '`pass` is true ONLY if rulerPresent AND build succeeded AND all A-E are true in the result file. Never infer a pass you did not observe.',
  ].join('\n')
}
function judgePrompt(s, lens) {
  const r = {
    'spec-fidelity': 'Satisfies the spec beyond passing the harness? Check c1-c8: real interception, server-computed verdicts from stored constraints (not hardcoded), dual-backend routing through the storage switch, fail-open, lesson retrieval, traces linked to constraints.',
    'design-quality': 'Constraint/lesson model + retrieval well-factored and consistent with SPEC-ENVIRONMENTAL-LEARNING-GATES (reversibility selects the rung; validators over gates)? Enforcement cleanly placed?',
    'simplicity-and-safety': 'Simplest thing that works? Minimal new surface, no dead code, no broken existing tests/hooks, no regressions to the shipped {blocked,...} consumers, no new deps.',
  }
  return [
    'Judge ONE candidate on ONE lens. Be skeptical; default low.',
    'Lens: ' + lens + ' — ' + r[lens],
    'Read ' + SPEC + ' (on ' + BASE + '), then the diff: `git diff ' + BASE + '...' + s.branch + '`. It passed the objective gate; grade the quality dimension, watching for a thin implementation that satisfied the harness without honoring spec intent.',
    'Return score 0-10, terse rationale with file:line, grafts, risks.',
  ].join('\n')
}
function synthPrompt(ranked, spread) {
  const t = ranked.map((r, n) => `${n + 1}. candidate ${r.i} (${r.branch}) score ${r.score.toFixed(2)}${r.dupes ? ` [+${r.dupes} dup]` : ''}`).join('\n')
  return ['Write a concise ranked merge-decision report (markdown).', `Score spread: ${spread.toFixed(2)} (if small, the field converged — say so).`, 'Ranked survivors:', t, '', 'For the top 3: distinguishing design choice, why it ranked there, ideas to graft from runners-up. End with: which branch to check out and what to graft before merge.'].join('\n')
}
async function judgeOne(s) {
  const votes = await parallel(LENSES.map((l) => () => agent(judgePrompt(s, l), { label: `judge:${s.i}:${l}`, phase: 'Judge', schema: JUDGE_SCHEMA })))
  const v = votes.filter(Boolean)
  return { ...s, score: v.length ? v.reduce((a, x) => a + x.score, 0) / v.length : 0, votes: v }
}

phase('Gate')
const gated = []
for (const wave of chunk(CANDS, WAVE)) {
  const batch = await parallel(wave.map((c) => () => agent(gatePrompt(c.branch), { label: `gate:${c.i}`, phase: 'Gate', isolation: 'worktree', schema: GATE_SCHEMA }).then((g) => ({ ...c, gate: g }))))
  gated.push(...batch.filter(Boolean))
  log(`gate wave done — ${gated.length}/${CANDS.length}`)
}
const survivors = gated.filter((c) => c.gate && c.gate.pass)
log(`${survivors.length}/${gated.length} survivors`)
if (survivors.length === 0) {
  return { winner: null, reason: 'no candidate passed the corrected gate', gated: gated.map((g) => ({ i: g.i, pass: g.gate && g.gate.pass, rulerPresent: g.gate && g.gate.rulerPresent })) }
}

phase('Judge')
const byHash = new Map(); const unique = []
for (const s of survivors) {
  const h = s.gate.diffHash
  if (h && byHash.has(h)) { byHash.get(h).dupes += 1; continue }
  const rec = { ...s, dupes: 0 }; if (h) byHash.set(h, rec); unique.push(rec)
}
log(`${unique.length} unique survivors (${survivors.length - unique.length} folded)`)
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
  winner: ranked[0] ? { candidate: ranked[0].i, branch: ranked[0].branch, score: ranked[0].score } : null,
  ranked: ranked.map((r) => ({ candidate: r.i, branch: r.branch, score: Number(r.score.toFixed(2)), nearIdentical: r.dupes })),
  scoreSpread: Number(spread.toFixed(2)), survivors: survivors.length, judged: ranked.length,
  report,
}
