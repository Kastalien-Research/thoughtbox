'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { fetchMerges, type MergeRecord } from '@/lib/merge/api'
import {
  buildRepoTimeline,
  maxBranchCount,
  type RepoBranch,
  type RepoSession,
} from '@/lib/repo/timeline'

// Same lane palette as the session timeline rail (seed pattern).
const LANE_COLORS = ['#a371f7', '#58a6ff', '#d29922', '#db61a2', '#f85149']
const MAIN_COLOR = '#3fb950'
const MERGE_COLOR = '#a371f7'

const ROW_HEIGHT = 64
const LANE_WIDTH = 26
const LANE_OFFSET = 24
const DOT_R = 6

function laneX(lane: number): number {
  return LANE_OFFSET + lane * LANE_WIDTH
}

function branchColor(index: number): string {
  return LANE_COLORS[index % LANE_COLORS.length]
}

function formatUtc(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return `${date.toISOString().slice(0, 10)}`
}

type Props = {
  workspaceId: string
  workspaceSlug: string
  sessions: RepoSession[]
  branches: RepoBranch[]
}

export function RepoGraphView({
  workspaceId,
  workspaceSlug,
  sessions,
  branches,
}: Props) {
  const [merges, setMerges] = useState<MergeRecord[]>([])
  const [mergesUnavailable, setMergesUnavailable] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchMerges(workspaceId)
      .then((list) => {
        if (!cancelled) setMerges(list)
      })
      .catch(() => {
        // Merge routes are landing separately — graph degrades to sessions.
        if (!cancelled) setMergesUnavailable(true)
      })
    return () => {
      cancelled = true
    }
  }, [workspaceId])

  const items = useMemo(
    () => buildRepoTimeline(sessions, branches, merges),
    [sessions, branches, merges],
  )

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-foreground/15 px-6 py-16 text-center">
        <p className="font-medium text-foreground">Nothing here yet</p>
        <p className="mt-1 text-sm text-foreground/60">
          Sessions and merges will appear as agents work in this workspace.
        </p>
      </div>
    )
  }

  const lanes = maxBranchCount(items)
  const svgWidth = LANE_OFFSET + (lanes + 1) * LANE_WIDTH
  const svgHeight = items.length * ROW_HEIGHT

  return (
    <div className="space-y-4">
      {mergesUnavailable && (
        <p className="text-xs text-foreground/40">
          Merge commits unavailable — the merge API is not deployed yet.
        </p>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-foreground/60">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: MAIN_COLOR }}
          />
          session
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rotate-45"
            style={{ backgroundColor: MERGE_COLOR }}
          />
          merge commit
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-current"
            style={{ color: LANE_COLORS[1] }}
          />
          agent branch
        </span>
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] overflow-x-auto">
        <div className="flex min-w-[560px]">
          {/* Rail */}
          <svg
            width={svgWidth}
            height={svgHeight}
            className="shrink-0"
            aria-hidden="true"
          >
            {/* Main lane line */}
            <line
              x1={laneX(0)}
              y1={ROW_HEIGHT / 2}
              x2={laneX(0)}
              y2={svgHeight - ROW_HEIGHT / 2}
              stroke={MAIN_COLOR}
              strokeWidth="2"
              strokeOpacity={0.35}
            />

            {items.map((item, i) => {
              const y = i * ROW_HEIGHT + ROW_HEIGHT / 2
              if (item.kind === 'merge') {
                return (
                  <rect
                    key={`merge-${item.merge.id}`}
                    x={laneX(0) - DOT_R}
                    y={y - DOT_R}
                    width={DOT_R * 2}
                    height={DOT_R * 2}
                    transform={`rotate(45 ${laneX(0)} ${y})`}
                    fill={MERGE_COLOR}
                  />
                )
              }
              return (
                <g key={`session-${item.session.id}`}>
                  {/* Branch forks: out and back (reasoning branches live inside the session) */}
                  {item.branches.map((branch, bi) => {
                    const bx = laneX(bi + 1)
                    const color = branchColor(bi)
                    return (
                      <g key={branch.branchId}>
                        <path
                          d={`M ${laneX(0)} ${y - 8} C ${bx} ${y - 8}, ${bx} ${y - 8}, ${bx} ${y} C ${bx} ${y + 8}, ${bx} ${y + 8}, ${laneX(0)} ${y + 8}`}
                          fill="none"
                          stroke={color}
                          strokeWidth="1.5"
                          strokeOpacity={0.6}
                        />
                        <circle cx={bx} cy={y} r={3.5} fill={color} />
                      </g>
                    )
                  })}
                  <circle cx={laneX(0)} cy={y} r={DOT_R} fill={MAIN_COLOR} />
                </g>
              )
            })}
          </svg>

          {/* Rows */}
          <div className="flex-1 min-w-0">
            {items.map((item, i) => (
              <div
                key={
                  item.kind === 'session'
                    ? `s-${item.session.id}`
                    : `m-${item.merge.id}`
                }
                className={`flex items-center gap-3 px-4 ${i > 0 ? 'border-t border-foreground/5' : ''}`}
                style={{ height: `${ROW_HEIGHT}px` }}
              >
                {item.kind === 'session' ? (
                  <>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/w/${workspaceSlug}/sessions/${item.session.id}`}
                        className="block truncate text-sm font-medium text-foreground hover:underline"
                      >
                        {item.session.title || item.session.id}
                      </Link>
                      <p className="text-xs text-foreground/50 font-mono">
                        {item.session.thoughtCount} thoughts
                        {item.branches.length > 0 &&
                          ` · ${item.branches.length} branch${item.branches.length > 1 ? 'es' : ''}`}
                        {' · '}
                        {formatUtc(item.at)}
                      </p>
                    </div>
                    {item.branches.length > 0 && (
                      <div className="hidden sm:flex flex-wrap gap-1.5 justify-end max-w-[45%]">
                        {item.branches.slice(0, 4).map((branch, bi) => (
                          <span
                            key={branch.branchId}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono ring-1 ring-foreground/15 text-foreground/70"
                            title={`${branch.thoughtCount} thoughts${branch.agentIds.length ? ` · agents: ${branch.agentIds.join(', ')}` : ''}`}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: branchColor(bi) }}
                            />
                            {branch.branchId} ({branch.thoughtCount})
                          </span>
                        ))}
                        {item.branches.length > 4 && (
                          <span className="text-[10px] text-foreground/40">
                            +{item.branches.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/w/${workspaceSlug}/merges`}
                      className="block truncate text-sm font-medium text-foreground hover:underline"
                    >
                      {item.merge.verdict?.decision || 'Merge commit'}
                    </Link>
                    <p className="text-xs text-foreground/50 font-mono">
                      merge · {item.merge.status} ·{' '}
                      {item.merge.parent_branch_ids.join(' + ') || 'no branches'}
                      {' · '}
                      {formatUtc(item.at)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
