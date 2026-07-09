import type { Metadata } from 'next'
import { listApiKeys } from './actions'
import { CreateKeyDialog } from './CreateKeyDialog'
import { ApiKeyTable } from './ApiKeyTable'

export const metadata: Metadata = { title: 'API Keys' }

type Props = { params: Promise<{ workspaceSlug: string }> }

export default async function ApiKeysPage({ params }: Props) {
  const { workspaceSlug } = await params
  const keys = await listApiKeys(workspaceSlug)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
          <p className="mt-1 text-sm text-foreground">
            Manage keys used to authenticate MCP and REST API requests.
          </p>
        </div>
        <CreateKeyDialog workspaceSlug={workspaceSlug} />
      </div>

      <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
        <p className="text-sm font-medium text-blue-900">Key format</p>
        <p className="mt-1 text-sm text-blue-700">
          Keys are prefixed <code className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs">tbx_</code> and
          shown only once at creation. Store them in your secrets manager immediately.
          Revoke compromised keys using the Revoke button in the table below.
        </p>
      </div>

      <ApiKeyTable keys={keys} workspaceSlug={workspaceSlug} />

      <p className="mt-4 text-xs text-foreground">
        Keys are stored as bcrypt hashes. The plaintext is shown only at creation time.
      </p>
    </div>
  )
}
