'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  loadEntityDetail,
  type EntityDetail,
} from '../lib/graphQueries'

const TYPE_BADGE: Record<string, string> = {
  Insight: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30',
  Concept: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30',
  Workflow: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30',
  Decision: 'bg-pink-500/10 text-pink-400 ring-1 ring-pink-500/30',
  Agent: 'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/30',
}

const DEFAULT_BADGE = 'bg-foreground/10 text-foreground/70 ring-1 ring-foreground/20'

function formatUtc(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`
}

type Props = {
  entityId: string
  workspaceSlug: string
  onSelectEntity: (entityId: string) => void
  onClose: () => void
}

export function EntityDetailPanel({
  entityId,
  workspaceSlug,
  onSelectEntity,
  onClose,
}: Props) {
  const [detail, setDetail] = useState<EntityDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setDetail(null)
    setError(null)

    const supabase = createClient()
    loadEntityDetail(supabase, entityId)
      .then((result) => {
        if (!cancelled) setDetail(result)
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load entity details.')
      })

    return () => {
      cancelled = true
    }
  }, [entityId])

  const entity = detail?.entity
  const properties =
    entity && typeof entity.properties === 'object' && entity.properties !== null
      ? Object.entries(entity.properties as Record<string, unknown>)
      : []

  return (
    <div className="h-full overflow-y-auto rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
          Entity
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="text-foreground/50 hover:text-foreground text-sm leading-none"
        >
          ✕
        </button>
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}
      {!error && !detail && (
        <p className="text-sm text-foreground/50">Loading…</p>
      )}

      {entity && (
        <>
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold text-foreground break-words">
              {entity.label || entity.name}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_BADGE[entity.type] ?? DEFAULT_BADGE}`}
              >
                {entity.type}
              </span>
              <span className="text-[11px] font-mono text-foreground/40 break-all">
                {entity.name}
              </span>
            </div>
          </div>

          {properties.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1.5">
                Properties
              </h3>
              <dl className="space-y-1">
                {properties.map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <dt className="font-mono text-foreground/50 inline">{key}: </dt>
                    <dd className="inline text-foreground/80 break-words">
                      {typeof value === 'string'
                        ? value
                        : JSON.stringify(value, null, 1)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1.5">
              Observations ({detail!.observations.length})
            </h3>
            {detail!.observations.length === 0 ? (
              <p className="text-xs text-foreground/50">No observations.</p>
            ) : (
              <ul className="space-y-2.5">
                {detail!.observations.map((obs) => (
                  <li
                    key={obs.id}
                    className="rounded-lg border border-foreground/10 bg-background/40 p-2.5 text-xs"
                  >
                    <p className="text-foreground/90 whitespace-pre-wrap break-words">
                      {obs.content}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-foreground/40">
                      {obs.added_by && <span>{obs.added_by}</span>}
                      <span className="font-mono">{formatUtc(obs.added_at)}</span>
                      {obs.source_session && (
                        <Link
                          href={`/w/${workspaceSlug}/sessions/${obs.source_session}`}
                          className="text-blue-400 hover:underline"
                        >
                          source session
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1.5">
              Relations ({detail!.relations.length})
            </h3>
            {detail!.relations.length === 0 ? (
              <p className="text-xs text-foreground/50">No relations.</p>
            ) : (
              <ul className="space-y-1">
                {detail!.relations.map((rel) => (
                  <li key={`${rel.direction}-${rel.id}`} className="text-xs flex items-baseline gap-1.5">
                    <span className="font-mono text-foreground/40 shrink-0">
                      {rel.direction === 'out' ? '→' : '←'} {rel.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectEntity(rel.entityId)}
                      className="text-blue-400 hover:underline text-left break-words"
                    >
                      {rel.entityLabel}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
