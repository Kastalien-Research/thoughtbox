/**
 * Merge-evidence fetch layer — the ONLY file that talks to the merge HTTP
 * API. Built against the frozen interface contract from
 * `.specs/product-shape/branches/001-merge-evidence-notebooks.md` (merge
 * record shape + verdict JSON schema; owner-approved design contract).
 *
 * JOIN POINT (agent merge-core owns `apps/web/src/app/api/merge/`):
 *   - list:    GET  /api/merge?workspaceId=<uuid>[&status=<status>]
 *              expected to return `MergeRecord[]` (bare array or wrapped in
 *              `{ merges: [...] }` — both accepted below).
 *   - approve: POST /api/merge/[id]/approve  (authed human session; the
 *              product rule is human-only approval — no agent surface).
 * If merge-core lands different paths or an envelope shape, this file is
 * the single place to update.
 */

export type MergeStatus =
  | 'pending_evidence'
  | 'blocked'
  | 'pending_approval'
  | 'approved'
  | 'superseded'

export const MERGE_STATUSES: readonly MergeStatus[] = [
  'pending_evidence',
  'blocked',
  'pending_approval',
  'approved',
  'superseded',
]

export type VerdictConfidence = 'low' | 'medium' | 'high'

export interface VerdictDissent {
  branchId: string
  summary: string
  reasonNotMerged: string
}

export interface MergeVerdict {
  decision: string
  confidence: VerdictConfidence
  mergedBranchIds: string[]
  rejectedBranchIds: string[]
  supersededNodeIds: string[]
  evidenceRefs: string[]
  dissent: VerdictDissent[]
  conditions: string[]
  reopenTriggers: string[]
}

export interface MergeRecord {
  id: string
  workspace_id: string
  parent_branch_ids: string[]
  base_ref: string | null
  evidence_notebook_id: string | null
  evidence_hash: string | null
  verdict: MergeVerdict | null
  status: MergeStatus
  requested_by: string
  approved_by: string | null
  created_at: string
  decided_at: string | null
  superseded_by: string | null
}

// ---------------------------------------------------------------------------
// Defensive parsers — the routes are landing separately; never trust shape.
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function strArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string')
}

export function parseVerdict(value: unknown): MergeVerdict | null {
  if (!isRecord(value)) return null
  const confidence =
    value.confidence === 'low' ||
    value.confidence === 'medium' ||
    value.confidence === 'high'
      ? value.confidence
      : 'low' // contract: confidence is forced low absent passing evidence
  const dissent: VerdictDissent[] = Array.isArray(value.dissent)
    ? value.dissent.filter(isRecord).map((d) => ({
        branchId: str(d.branchId) ?? '',
        summary: str(d.summary) ?? '',
        reasonNotMerged: str(d.reasonNotMerged) ?? '',
      }))
    : []
  return {
    decision: str(value.decision) ?? '',
    confidence,
    mergedBranchIds: strArray(value.mergedBranchIds),
    rejectedBranchIds: strArray(value.rejectedBranchIds),
    supersededNodeIds: strArray(value.supersededNodeIds),
    evidenceRefs: strArray(value.evidenceRefs),
    dissent,
    conditions: strArray(value.conditions),
    reopenTriggers: strArray(value.reopenTriggers),
  }
}

export function parseMergeRecord(value: unknown): MergeRecord | null {
  if (!isRecord(value)) return null
  const id = str(value.id)
  const workspaceId = str(value.workspace_id)
  const status = MERGE_STATUSES.includes(value.status as MergeStatus)
    ? (value.status as MergeStatus)
    : null
  if (!id || !workspaceId || !status) return null
  return {
    id,
    workspace_id: workspaceId,
    parent_branch_ids: strArray(value.parent_branch_ids),
    base_ref: str(value.base_ref),
    evidence_notebook_id: str(value.evidence_notebook_id),
    evidence_hash: str(value.evidence_hash),
    verdict: parseVerdict(value.verdict),
    status,
    requested_by: str(value.requested_by) ?? 'unknown',
    approved_by: str(value.approved_by),
    created_at: str(value.created_at) ?? '',
    decided_at: str(value.decided_at),
    superseded_by: str(value.superseded_by),
  }
}

/** Accepts a bare array or `{ merges: [...] }` envelope. */
export function parseMergeList(payload: unknown): MergeRecord[] {
  const list = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.merges)
      ? payload.merges
      : []
  return list
    .map(parseMergeRecord)
    .filter((m): m is MergeRecord => m !== null)
}

// ---------------------------------------------------------------------------
// Fetch functions (browser-side; relative URLs so the session cookie rides)
// ---------------------------------------------------------------------------

export async function fetchMerges(
  workspaceId: string,
  status?: MergeStatus,
): Promise<MergeRecord[]> {
  const params = new URLSearchParams({ workspaceId })
  if (status) params.set('status', status)
  const res = await fetch(`/api/merge?${params.toString()}`, {
    headers: { accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`Merge list request failed (${res.status})`)
  }
  return parseMergeList(await res.json())
}

export type ApproveResult =
  | { ok: true }
  | { ok: false; error: string }

export async function approveMerge(mergeId: string): Promise<ApproveResult> {
  const res = await fetch(`/api/merge/${encodeURIComponent(mergeId)}/approve`, {
    method: 'POST',
    headers: { accept: 'application/json' },
  })
  if (res.ok) return { ok: true }
  let message = `Approval failed (${res.status})`
  try {
    const body: unknown = await res.json()
    if (isRecord(body) && typeof body.error === 'string') message = body.error
  } catch {
    // keep the status-based message
  }
  return { ok: false, error: message }
}
