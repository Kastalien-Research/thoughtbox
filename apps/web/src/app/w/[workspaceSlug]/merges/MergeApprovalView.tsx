'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  fetchMerges,
  approveMerge,
  type MergeRecord,
  type MergeVerdict,
  type VerdictConfidence,
} from '@/lib/merge/api'

const CONFIDENCE_BADGE: Record<VerdictConfidence, string> = {
  high: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30',
  medium: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30',
  low: 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30',
}

function formatUtc(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`
}

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id
}

function VerdictView({ verdict }: { verdict: MergeVerdict }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-start gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${CONFIDENCE_BADGE[verdict.confidence]}`}
        >
          {verdict.confidence} confidence
        </span>
        <p className="text-foreground/90 flex-1 min-w-[200px]">{verdict.decision}</p>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
        {verdict.mergedBranchIds.length > 0 && (
          <span className="text-emerald-400">
            merged: <span className="font-mono">{verdict.mergedBranchIds.join(', ')}</span>
          </span>
        )}
        {verdict.rejectedBranchIds.length > 0 && (
          <span className="text-rose-400">
            rejected: <span className="font-mono">{verdict.rejectedBranchIds.join(', ')}</span>
          </span>
        )}
      </div>

      {verdict.dissent.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">
            Dissent
          </h4>
          <ul className="space-y-1.5">
            {verdict.dissent.map((d) => (
              <li
                key={d.branchId}
                className="rounded-lg border border-foreground/10 bg-background/40 p-2 text-xs"
              >
                <span className="font-mono text-foreground/60">{d.branchId}</span>
                <p className="text-foreground/80 mt-0.5">{d.summary}</p>
                <p className="text-foreground/50 mt-0.5">
                  Not merged: {d.reasonNotMerged}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {verdict.conditions.length > 0 && (
        <div className="text-xs">
          <span className="font-semibold uppercase tracking-wider text-foreground/50">
            Conditions:{' '}
          </span>
          <span className="text-foreground/80">{verdict.conditions.join('; ')}</span>
        </div>
      )}

      {verdict.reopenTriggers.length > 0 && (
        <div className="text-xs">
          <span className="font-semibold uppercase tracking-wider text-foreground/50">
            Reopen triggers:{' '}
          </span>
          <span className="text-foreground/80">{verdict.reopenTriggers.join('; ')}</span>
        </div>
      )}
    </div>
  )
}

function ApproveControls({
  mergeId,
  onApproved,
}: {
  mergeId: string
  onApproved: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setPending(true)
    setError(null)
    const result = await approveMerge(mergeId)
    setPending(false)
    if (result.ok) {
      onApproved()
    } else {
      setError(result.error)
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
      >
        Approve merge…
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-foreground/70">
        Approval is final and recorded against your account. Merge commits are
        immutable — reverting requires new commits on top.
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Approving…' : 'Confirm approval'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-lg px-3 py-2 text-sm text-foreground/70 hover:text-foreground disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  )
}

function MergeCard({
  merge,
  onApproved,
}: {
  merge: MergeRecord
  onApproved: () => void
}) {
  const isPending = merge.status === 'pending_approval'
  const isBlocked = merge.status === 'blocked'

  return (
    <div
      className={`rounded-2xl border p-5 space-y-4 ${
        isBlocked
          ? 'border-rose-500/30 bg-rose-500/[0.04]'
          : 'border-foreground/10 bg-foreground/[0.03]'
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-sm text-foreground" title={merge.id}>
            {shortId(merge.id)}
          </span>
          {isBlocked && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30">
              blocked — evidence failed
            </span>
          )}
        </div>
        <span className="text-xs text-foreground/50 font-mono">
          requested by {merge.requested_by} · {formatUtc(merge.created_at)}
        </span>
      </div>

      <div className="text-xs text-foreground/70 flex flex-wrap gap-x-6 gap-y-1">
        <span>
          branches:{' '}
          <span className="font-mono">{merge.parent_branch_ids.join(', ') || '—'}</span>
        </span>
        {merge.base_ref && (
          <span>
            base: <span className="font-mono">{merge.base_ref}</span>
          </span>
        )}
        {merge.evidence_notebook_id && (
          <span title={merge.evidence_hash ?? undefined}>
            evidence:{' '}
            <span className="font-mono">{shortId(merge.evidence_notebook_id)}</span>
          </span>
        )}
      </div>

      {merge.verdict ? (
        <VerdictView verdict={merge.verdict} />
      ) : (
        <p className="text-sm text-foreground/50">No verdict recorded.</p>
      )}

      {isPending && (
        <div className="border-t border-foreground/10 pt-4">
          <ApproveControls mergeId={merge.id} onApproved={onApproved} />
        </div>
      )}
    </div>
  )
}

export function MergeApprovalView({ workspaceId }: { workspaceId: string }) {
  const [pending, setPending] = useState<MergeRecord[] | null>(null)
  const [blocked, setBlocked] = useState<MergeRecord[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [pendingList, blockedList] = await Promise.all([
        fetchMerges(workspaceId, 'pending_approval'),
        fetchMerges(workspaceId, 'blocked'),
      ])
      setPending(pendingList)
      setBlocked(blockedList)
    } catch {
      setError(
        'Could not load merges. The merge API routes may not be deployed yet.',
      )
      setPending([])
      setBlocked([])
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const loading = pending === null && error === null

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] px-5 py-4 text-sm text-amber-500">
          {error}
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/70 mb-3">
          Pending your approval {pending ? `(${pending.length})` : ''}
        </h2>
        {loading ? (
          <p className="text-sm text-foreground/50">Loading…</p>
        ) : (pending ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-foreground/15 px-5 py-10 text-center text-sm text-foreground/50">
            No merges awaiting approval.
          </div>
        ) : (
          <div className="space-y-4">
            {pending!.map((merge) => (
              <MergeCard key={merge.id} merge={merge} onApproved={load} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/70 mb-3">
          Blocked {blocked ? `(${blocked.length})` : ''}
        </h2>
        {loading ? (
          <p className="text-sm text-foreground/50">Loading…</p>
        ) : (blocked ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-foreground/15 px-5 py-10 text-center text-sm text-foreground/50">
            No blocked merges.
          </div>
        ) : (
          <div className="space-y-4">
            {blocked!.map((merge) => (
              <MergeCard key={merge.id} merge={merge} onApproved={load} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
