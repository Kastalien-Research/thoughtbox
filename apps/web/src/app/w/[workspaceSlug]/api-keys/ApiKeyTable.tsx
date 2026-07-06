'use client'

import { useActionState, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import type { ApiKeyRow } from '@/lib/types/api-keys'
import { revokeApiKeyAction, type RevokeKeyState } from './actions'

function RevokeButton({
  keyId,
  workspaceSlug,
}: {
  keyId: string
  workspaceSlug: string
}) {
  const [confirming, setConfirming] = useState(false)
  const [state, formAction, pending] = useActionState<RevokeKeyState, FormData>(
    revokeApiKeyAction,
    null,
  )

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs text-red-600 hover:text-red-800 transition-colors"
        title="Revoke this key"
      >
        Revoke
      </button>
    )
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="keyId" value={keyId} />
      <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
      <span className="text-xs text-red-600">Revoke?</span>
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-semibold text-red-700 hover:text-red-900 disabled:opacity-50 transition-colors"
      >
        {pending ? 'Revoking\u2026' : 'Confirm'}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className="text-xs text-foreground hover:text-foreground/70 disabled:opacity-50 transition-colors"
      >
        Cancel
      </button>
      {state?.error && (
        <p className="text-xs text-red-500 mt-1">{state.error}</p>
      )}
    </form>
  )
}

export function ApiKeyTable({
  keys,
  workspaceSlug,
}: {
  keys: ApiKeyRow[]
  workspaceSlug: string
}) {
  if (keys.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03] shadow-sm">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-background">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">Prefix</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">Created</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">Last used</th>
              <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="px-6 py-14 text-center">
                <p className="text-2xl">🔑</p>
                <p className="mt-2 font-medium text-foreground">No API keys yet</p>
                <p className="mt-1 text-sm text-foreground">
                  Create your first key to start authenticating MCP requests.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03] shadow-sm">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-background">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">Name</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">Prefix</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">Created</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">Last used</th>
            <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {keys.map((key) => {
            const isRevoked = key.status === 'revoked'
            return (
              <tr key={key.id} className={isRevoked ? 'opacity-50' : undefined}>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                  {key.name}
                  {isRevoked && (
                    <span className="ml-2 inline-flex items-center rounded-lg bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      Revoked
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-foreground">
                  {key.prefix}...
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                  {formatDistanceToNow(new Date(key.created_at), { addSuffix: true })}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                  {key.last_used_at
                    ? formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true })
                    : 'Never'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                  {!isRevoked && (
                    <RevokeButton keyId={key.id} workspaceSlug={workspaceSlug} />
                  )}
                  {isRevoked && key.revoked_at && (
                    <span className="text-xs text-foreground">
                      {formatDistanceToNow(new Date(key.revoked_at), { addSuffix: true })}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
