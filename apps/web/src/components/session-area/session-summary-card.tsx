'use client'

import { useState } from 'react'
import type { ThoughtDisplayType } from '@/lib/session/view-models'
import type { SessionSummary } from '@/lib/session/compute-session-summary'
import type { AuditManifest } from '@/lib/session/audit-manifest'
import { AuditManifestSection } from './audit-manifest-section'
import {
  BADGE_BASE,
  THOUGHT_TYPE_BADGE,
  THOUGHT_TYPE_LABEL,
} from '@/lib/session/badge-styles'

type Props = SessionSummary & {
  durationLabel: string
  defaultExpanded: boolean
  auditManifest?: AuditManifest | null
}

export function SessionSummaryCard({
  typeCounts,
  totalThoughts,
  branchCount,
  revisionCount,
  confidenceDistribution,
  tags,
  durationLabel,
  defaultExpanded,
  auditManifest,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const nonZeroTypes = (Object.entries(typeCounts) as [ThoughtDisplayType, number][])
    .filter(([, count]) => count > 0)

  return (
    <div className="mb-6 rounded-2xl border border-foreground/10 bg-foreground/[0.03] overflow-hidden">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-foreground hover:bg-foreground/5 transition-colors focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:outline-none"
      >
        <span className="uppercase tracking-wider text-xs font-semibold text-foreground/70">
          Session Overview
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className={`transition-transform motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {/* Body — collapsible */}
      <div
        className="grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none"
        style={{
          gridTemplateRows: expanded ? '1fr' : '0fr',
        }}
      >
        <div className="overflow-hidden">
          <div className="border-t border-foreground/10 px-5 py-4 space-y-4">
            {/* Stats row */}
            <div className="flex flex-wrap gap-6">
              <Stat label="Thoughts" value={String(totalThoughts)} />
              <Stat label="Branches" value={String(branchCount)} />
              <Stat label="Revisions" value={String(revisionCount)} />
              <Stat label="Duration" value={durationLabel} />
            </div>

            {/* Type breakdown */}
            {nonZeroTypes.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {nonZeroTypes.map(([type, count]) => (
                  <span
                    key={type}
                    className={`${BADGE_BASE} ${THOUGHT_TYPE_BADGE[type]}`}
                  >
                    {THOUGHT_TYPE_LABEL[type]} ({count})
                  </span>
                ))}
              </div>
            )}

            {/* Confidence distribution */}
            {confidenceDistribution && (
              <div className="flex flex-wrap gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                  Confidence
                </span>
                <ConfidenceBadge
                  label="High"
                  count={confidenceDistribution.high}
                  color="text-emerald-400"
                />
                <ConfidenceBadge
                  label="Medium"
                  count={confidenceDistribution.medium}
                  color="text-amber-400"
                />
                <ConfidenceBadge
                  label="Low"
                  count={confidenceDistribution.low}
                  color="text-rose-400"
                />
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium bg-background text-foreground ring-1 ring-foreground/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Audit manifest (AUDIT-003) — present once the session closes */}
            {auditManifest && <AuditManifestSection manifest={auditManifest} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
        {label}
      </span>
      <span className="text-sm font-mono text-foreground tabular-nums">{value}</span>
    </div>
  )
}

function ConfidenceBadge({
  label,
  count,
  color,
}: {
  label: string
  count: number
  color: string
}) {
  if (count === 0) return null
  return (
    <span className={`text-xs font-medium ${color}`}>
      {label} ({count})
    </span>
  )
}
