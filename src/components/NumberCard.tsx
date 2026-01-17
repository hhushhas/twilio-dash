import { useState } from 'react'
import AccountBadge from './AccountBadge'
import { useAccount } from '../context/AccountContext'

type PhoneNumber = {
  sid: string
  phoneNumber: string
  friendlyName: string
  voiceUrl: string | null
  smsUrl: string | null
  statusCallback: string | null
  capabilities: { voice: boolean; sms: boolean; mms: boolean }
  accountId?: string
}

type WebhookTestResult = {
  status: 'healthy' | 'unhealthy' | 'unreachable'
  httpStatus: number | null
  responseTime: number
  error?: string
}

type Props = {
  number: PhoneNumber
  onUpdate: (sid: string, data: Record<string, string>) => Promise<void>
  onDelete: (sid: string) => void
  showAccount?: boolean
  isStale?: boolean
}

export default function NumberCard({ number, onUpdate, onDelete, showAccount, isStale }: Props) {
  const { fetchWithAccount } = useAccount()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [voiceUrl, setVoiceUrl] = useState(number.voiceUrl || '')
  const [smsUrl, setSmsUrl] = useState(number.smsUrl || '')
  const [statusCallback, setStatusCallback] = useState(number.statusCallback || '')
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null)
  const [webhookResults, setWebhookResults] = useState<Record<string, WebhookTestResult>>({})

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate(number.sid, { voiceUrl, smsUrl, statusCallback })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const copyNumber = () => {
    navigator.clipboard.writeText(number.phoneNumber)
  }

  const testWebhook = async (url: string, type: 'voice' | 'sms') => {
    setTestingWebhook(url)
    try {
      const res = await fetchWithAccount('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type }),
      })
      const result: WebhookTestResult = await res.json()
      setWebhookResults((prev) => ({ ...prev, [url]: result }))
    } catch {
      setWebhookResults((prev) => ({
        ...prev,
        [url]: { status: 'unreachable', httpStatus: null, responseTime: 0, error: 'Request failed' },
      }))
    } finally {
      setTestingWebhook(null)
    }
  }

  const renderWebhookStatus = (url: string) => {
    const result = webhookResults[url]
    if (!result) return null

    if (result.status === 'healthy') {
      return (
        <span className="text-success text-xs" title={`${result.responseTime}ms`}>
          ✓
        </span>
      )
    }
    if (result.status === 'unhealthy') {
      return (
        <span className="text-danger text-xs" title={result.error}>
          ✗ {result.httpStatus}
        </span>
      )
    }
    return (
      <span className="text-yellow-400 text-xs" title={result.error}>
        ⚠
      </span>
    )
  }

  return (
    <div className="hub-card bg-hub-900 border border-hub-700 rounded-xl p-5 relative overflow-hidden group">
      {showAccount && number.accountId && (
        <div className="mb-2">
          <AccountBadge accountId={number.accountId} />
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div>
          <button
            onClick={copyNumber}
            className="text-lg font-mono font-bold text-hub-text hover:text-hub-accent transition-colors"
            title="Click to copy"
          >
            {number.phoneNumber}
          </button>
          <p className="text-sm text-hub-muted mt-0.5">{number.friendlyName}</p>
        </div>
        <div className="flex gap-1">
          {isStale ? (
            <span className="px-2 py-0.5 text-xs bg-hub-800 text-hub-muted rounded border border-hub-700">Inactive</span>
          ) : (
            <span className="px-2 py-0.5 text-xs bg-success/10 text-success rounded border border-success/20">Active</span>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {number.capabilities.voice && (
          <span className="text-xs bg-hub-950 border border-hub-800 px-2 py-1 rounded text-hub-muted flex items-center gap-1">Voice</span>
        )}
        {number.capabilities.sms && (
          <span className="text-xs bg-hub-950 border border-hub-800 px-2 py-1 rounded text-hub-muted flex items-center gap-1">SMS</span>
        )}
        {number.capabilities.mms && (
          <span className="text-xs bg-hub-950 border border-hub-800 px-2 py-1 rounded text-hub-muted flex items-center gap-1">MMS</span>
        )}
      </div>

      {editing ? (
        <div className="space-y-3 pt-4 border-t border-hub-800">
          <div>
            <label className="block text-xs text-hub-muted mb-1">Voice URL</label>
            <input
              type="url"
              value={voiceUrl}
              onChange={(e) => setVoiceUrl(e.target.value)}
              className="w-full bg-hub-950 border border-hub-800 rounded px-3 py-2 text-sm text-hub-text focus:outline-none focus:border-hub-accent transition-colors"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-xs text-hub-muted mb-1">SMS URL</label>
            <input
              type="url"
              value={smsUrl}
              onChange={(e) => setSmsUrl(e.target.value)}
              className="w-full bg-hub-950 border border-hub-800 rounded px-3 py-2 text-sm text-hub-text focus:outline-none focus:border-hub-accent transition-colors"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-xs text-hub-muted mb-1">Status Callback</label>
            <input
              type="url"
              value={statusCallback}
              onChange={(e) => setStatusCallback(e.target.value)}
              className="w-full bg-hub-950 border border-hub-800 rounded px-3 py-2 text-sm text-hub-text focus:outline-none focus:border-hub-accent transition-colors"
              placeholder="https://..."
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 bg-hub-accent text-hub-950 hover:bg-white disabled:opacity-50 rounded text-sm font-bold transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 bg-hub-800 hover:bg-hub-700 text-hub-text rounded text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-sm pt-4 border-t border-hub-800">
          {number.voiceUrl && (
            <div className="flex items-center gap-2 group/row">
              <span className="text-hub-muted w-12 shrink-0">Voice:</span>
              <span className="text-hub-dim truncate flex-1 font-mono text-xs">{number.voiceUrl}</span>
              <button
                onClick={() => testWebhook(number.voiceUrl!, 'voice')}
                disabled={testingWebhook === number.voiceUrl}
                className="opacity-0 group-hover/row:opacity-100 px-2 py-0.5 text-[10px] bg-hub-800 hover:bg-hub-700 disabled:opacity-50 rounded transition-all shrink-0"
              >
                Test
              </button>
              {renderWebhookStatus(number.voiceUrl)}
            </div>
          )}
          {number.smsUrl && (
            <div className="flex items-center gap-2 group/row">
              <span className="text-hub-muted w-12 shrink-0">SMS:</span>
              <span className="text-hub-dim truncate flex-1 font-mono text-xs">{number.smsUrl}</span>
              <button
                onClick={() => testWebhook(number.smsUrl!, 'sms')}
                disabled={testingWebhook === number.smsUrl}
                className="opacity-0 group-hover/row:opacity-100 px-2 py-0.5 text-[10px] bg-hub-800 hover:bg-hub-700 disabled:opacity-50 rounded transition-all shrink-0"
              >
                Test
              </button>
              {renderWebhookStatus(number.smsUrl)}
            </div>
          )}
          
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-[-5px] group-hover:translate-y-0">
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 bg-hub-800 rounded hover:bg-hub-accent hover:text-white transition-colors"
              title="Edit Webhooks"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button
              onClick={() => onDelete(number.sid)}
              className="p-1.5 bg-hub-800 hover:bg-red-900/80 text-hub-muted hover:text-red-200 rounded transition-colors"
              title="Delete number"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          
           {isStale && (
             <div className="mt-2 text-xs text-hub-accent flex items-center gap-1 pt-2 border-t border-hub-800/50">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Stale (90d+)
             </div>
           )}
        </div>
      )}
    </div>
  )
}