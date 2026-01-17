import { useState, useEffect, useCallback, useMemo } from 'react'
import LogTable from '../components/LogTable'
import Filters from '../components/Filters'
import AccountBadge from '../components/AccountBadge'
import { useAccount } from '../context/AccountContext'

type Message = {
  sid: string
  from: string
  to: string
  body: string
  status: string
  direction: string
  dateSent: string
  price: string | null
  priceUnit: string | null
  numMedia: string
  errorCode: string | null
  errorMessage: string | null
  accountId?: string
}

type MessageDetails = Message & {
  media: { sid: string; contentType: string; url: string }[]
}

const filterConfig = [
  { type: 'text' as const, key: 'from', label: 'From', placeholder: '+1...' },
  { type: 'text' as const, key: 'to', label: 'To', placeholder: '+1...' },
  { type: 'date' as const, key: 'dateSent', label: 'From Date' },
  { type: 'date' as const, key: 'dateEnd', label: 'To Date' },
]

export default function Messages() {
  const { fetchWithAccount, refreshKey, currentAccount } = useAccount()
  const isAllAccounts = currentAccount?.id === 'all'
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [selectedMessage, setSelectedMessage] = useState<MessageDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v)
      })
      const res = await fetchWithAccount(`/api/messages?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      setMessages(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filters, fetchWithAccount])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages, refreshKey])

  const handleRowClick = async (msg: Message) => {
    if (parseInt(msg.numMedia) > 0) {
      setDetailsLoading(true)
      try {
        const res = await fetchWithAccount(`/api/messages/${msg.sid}`)
        if (!res.ok) throw new Error('Failed to fetch')
        setSelectedMessage(await res.json())
      } catch (err) {
        console.error(err)
      } finally {
        setDetailsLoading(false)
      }
    } else {
      setSelectedMessage({ ...msg, media: [] })
    }
  }

  const columns = useMemo(() => {
    const cols = [
      {
        key: 'direction',
        label: 'Dir',
        render: (m: Message) => (
          <span className={m.direction === 'inbound' ? 'text-success' : 'text-blue-400'}>
            {m.direction === 'inbound' ? '↓' : '↑'}
          </span>
        ),
      },
      { key: 'from', label: 'From' },
      { key: 'to', label: 'To' },
      {
        key: 'body',
        label: 'Message',
        render: (m: Message) => (
          <span className="truncate max-w-xs block text-hub-muted">{m.body || '(empty)'}</span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (m: Message) => {
            let statusClass = 'bg-hub-800 text-hub-muted';
            if (m.status === 'delivered') statusClass = 'bg-success/10 text-success border border-success/20';
            if (m.status === 'failed' || m.status === 'undelivered') statusClass = 'bg-danger/10 text-danger border border-danger/20';
            
            return (
            <span
                className={`px-2 py-0.5 rounded text-xs capitalize ${statusClass}`}
            >
                {m.status}
            </span>
            )
        },
      },
      {
        key: 'dateSent',
        label: 'Time',
        render: (m: Message) => (m.dateSent ? <span className="text-hub-dim text-xs">{new Date(m.dateSent).toLocaleString()}</span> : 'Pending'),
      },
    ]

    if (isAllAccounts) {
      cols.splice(1, 0, {
        key: 'accountId',
        label: 'Account',
        render: (m: Message) => m.accountId ? <AccountBadge accountId={m.accountId} /> : null,
      })
    }

    return cols
  }, [isAllAccounts])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-hub-text">SMS History</h2>
        <button
          onClick={fetchMessages}
          className="px-3 py-1.5 bg-hub-800 hover:bg-hub-700 rounded text-sm font-medium transition-colors border border-hub-700"
        >
          Refresh
        </button>
      </div>

      <Filters
        filters={filterConfig}
        values={filters}
        onChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))}
        onApply={fetchMessages}
      />

      <div className="bg-hub-900 border border-hub-700 rounded-xl overflow-hidden">
        <LogTable
          data={messages}
          columns={columns}
          loading={loading}
          onRowClick={handleRowClick}
        />
      </div>

      {selectedMessage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-hub-900 border border-hub-700 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-hub-text">Message Details</h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-hub-muted hover:text-hub-text transition-colors"
              >
                ✕
              </button>
            </div>

            {detailsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-hub-700 border-t-hub-text rounded-full" />
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                 <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-hub-950 rounded-lg border border-hub-800">
                    <span className="text-hub-dim text-xs uppercase block mb-1">From</span>
                    <p className="text-hub-text font-mono">{selectedMessage.from}</p>
                  </div>
                  <div className="p-3 bg-hub-950 rounded-lg border border-hub-800">
                    <span className="text-hub-dim text-xs uppercase block mb-1">To</span>
                    <p className="text-hub-text font-mono">{selectedMessage.to}</p>
                  </div>
                  <div>
                    <span className="text-hub-muted">Status:</span>
                    <p className="text-hub-text capitalize">{selectedMessage.status}</p>
                  </div>
                  <div>
                    <span className="text-hub-muted">Price:</span>
                    <p className="text-hub-text">
                      {selectedMessage.price
                        ? `${selectedMessage.price} ${selectedMessage.priceUnit}`
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-hub-800">
                  <span className="text-hub-muted block mb-2">Body:</span>
                  <p className="text-hub-text p-3 bg-hub-950 rounded-lg border border-hub-800 whitespace-pre-wrap font-mono text-xs">
                    {selectedMessage.body || '(empty)'}
                  </p>
                </div>

                {selectedMessage.errorCode && (
                  <div className="pt-4 border-t border-hub-800">
                    <span className="text-danger font-bold">Error {selectedMessage.errorCode}:</span>
                    <p className="text-danger/80 mt-1">{selectedMessage.errorMessage}</p>
                  </div>
                )}

                {selectedMessage.media.length > 0 && (
                  <div className="pt-4 border-t border-hub-800">
                    <p className="text-hub-muted mb-2">Media:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedMessage.media.map((m) => (
                        <a
                          key={m.sid}
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-2 bg-hub-950 rounded border border-hub-800 hover:border-hub-accent transition-colors"
                        >
                          {m.contentType.startsWith('image/') ? (
                            <img src={m.url} alt="MMS media" className="w-full rounded" />
                          ) : (
                            <span className="text-blue-400 text-xs">{m.contentType}</span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}