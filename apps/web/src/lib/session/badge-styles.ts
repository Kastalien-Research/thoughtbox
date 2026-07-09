import type { ThoughtDisplayType } from '@/lib/session/view-models'

type SessionStatus = 'active' | 'completed' | 'abandoned'

export const BADGE_BASE =
  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide'

export const STATUS_BADGE: Record<SessionStatus, string> = {
  active: 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/20',
  completed: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20',
  abandoned: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/20',
}

export const STATUS_LABEL: Record<SessionStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  abandoned: 'Abandoned',
}

export const THOUGHT_TYPE_BADGE: Record<ThoughtDisplayType, string> = {
  decision_frame: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20',
  action_report: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/20',
  progress: 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/20',
  belief_snapshot: 'bg-pink-500/15 text-pink-300 ring-1 ring-pink-500/20',
  assumption_update: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20',
  context_snapshot: 'bg-background text-foreground ring-1 ring-ring/20',
  reasoning: 'bg-background text-foreground ring-1 ring-ring',
  finding: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20',
  synthesis: 'bg-teal-500/15 text-teal-300 ring-1 ring-teal-500/20',
  question: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/20',
  conclusion: 'bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20',
}

export const THOUGHT_TYPE_LABEL: Record<ThoughtDisplayType, string> = {
  decision_frame: 'Decision',
  action_report: 'Action',
  progress: 'Progress',
  belief_snapshot: 'Beliefs',
  assumption_update: 'Assumption',
  context_snapshot: 'Context',
  reasoning: 'Reasoning',
  finding: 'Finding',
  synthesis: 'Synthesis',
  question: 'Question',
  conclusion: 'Conclusion',
}

export const REVISION_BADGE =
  'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20'

export const LANE_DOT_COLOR: Record<string, string> = {
  'primary': 'bg-primary',
}
