import type { AuditManifest, AuditGapType } from '@/lib/session/audit-manifest'

const GAP_TYPE_LABEL: Record<AuditGapType, string> = {
  decision_without_action: 'Decision without action',
  critique_override: 'Critique override',
}

const GAP_TYPE_BADGE: Record<AuditGapType, string> = {
  decision_without_action:
    'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30',
  critique_override: 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30',
}

/**
 * AUDIT-003: renders the persisted session audit manifest inside the
 * session summary card — aggregate counts plus detected accountability gaps.
 */
export function AuditManifestSection({ manifest }: { manifest: AuditManifest }) {
  const { decisions, actions, critiques, gaps, assumptionFlips } = manifest

  return (
    <div className="border-t border-foreground/10 pt-4 space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground/70">
          Audit Manifest
        </span>
        <span className="text-[11px] text-foreground/40 font-mono">
          generated {formatGeneratedAt(manifest.generatedAt)}
        </span>
      </div>

      {/* Aggregate stats */}
      <div className="flex flex-wrap gap-6">
        <AuditStat label="Decisions" value={String(decisions.total)} />
        <AuditStat label="Actions" value={String(actions.total)} />
        <AuditStat label="Assumption Flips" value={String(assumptionFlips)} />
        <AuditStat label="Critiques" value={String(critiques.generated)} />
      </div>

      {/* Decision confidence */}
      {decisions.total > 0 && (
        <BreakdownRow
          label="Decision Confidence"
          parts={[
            { label: 'High', count: decisions.byConfidence.high, color: 'text-emerald-400' },
            { label: 'Medium', count: decisions.byConfidence.medium, color: 'text-amber-400' },
            { label: 'Low', count: decisions.byConfidence.low, color: 'text-rose-400' },
          ]}
        />
      )}

      {/* Action outcomes + reversibility */}
      {actions.total > 0 && (
        <>
          <BreakdownRow
            label="Action Outcomes"
            parts={[
              { label: 'Successful', count: actions.successful, color: 'text-emerald-400' },
              { label: 'Failed', count: actions.failed, color: 'text-rose-400' },
            ]}
          />
          <BreakdownRow
            label="Reversibility"
            parts={[
              { label: 'Reversible', count: actions.reversible, color: 'text-emerald-400' },
              { label: 'Partial', count: actions.partiallyReversible, color: 'text-amber-400' },
              { label: 'Irreversible', count: actions.irreversible, color: 'text-rose-400' },
            ]}
          />
        </>
      )}

      {/* Critique handling */}
      {critiques.generated > 0 && (
        <BreakdownRow
          label="Critique Handling"
          parts={[
            { label: 'Addressed', count: critiques.addressed, color: 'text-emerald-400' },
            { label: 'Overridden', count: critiques.overridden, color: 'text-rose-400' },
          ]}
        />
      )}

      {/* Detected gaps */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
          Detected Gaps ({gaps.length})
        </span>
        {gaps.length === 0 ? (
          <p className="text-xs text-emerald-400">No gaps detected.</p>
        ) : (
          <ul className="space-y-1.5">
            {gaps.map((gap, i) => (
              <li
                key={`${gap.type}-${gap.thoughtNumber}-${i}`}
                className="flex flex-wrap items-baseline gap-2 text-xs"
              >
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${GAP_TYPE_BADGE[gap.type]}`}
                >
                  {GAP_TYPE_LABEL[gap.type]}
                </span>
                <span className="font-mono text-foreground/50 tabular-nums">
                  #{gap.thoughtNumber}
                </span>
                <span className="text-foreground/80">{gap.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function AuditStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
        {label}
      </span>
      <span className="text-sm font-mono text-foreground tabular-nums">{value}</span>
    </div>
  )
}

function BreakdownRow({
  label,
  parts,
}: {
  label: string
  parts: Array<{ label: string; count: number; color: string }>
}) {
  const visible = parts.filter((p) => p.count > 0)
  if (visible.length === 0) return null
  return (
    <div className="flex flex-wrap gap-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
        {label}
      </span>
      {visible.map((part) => (
        <span key={part.label} className={`text-xs font-medium ${part.color}`}>
          {part.label} ({part.count})
        </span>
      ))}
    </div>
  )
}

/**
 * Deterministic UTC formatting — avoids SSR/client hydration mismatch that
 * locale/timezone-dependent formatting would cause in this client component.
 */
function formatGeneratedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`
}
