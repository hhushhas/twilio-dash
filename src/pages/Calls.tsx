import { useState, useEffect, useCallback, useMemo } from 'react'
import LogTable from '../components/LogTable'
import Filters from '../components/Filters'
import AccountBadge from '../components/AccountBadge'
import { useAccount } from '../context/AccountContext'

type Call = {
  sid: string
  from: string
  to: string
  status: string
  direction: string
  duration: string
  startTime: string
  price: string | null
  priceUnit: string | null
  accountId?: string
}

type CallDetails = Call & {
  recordings: { sid: string; duration: string; url: string }[]
}

const statusOptions = [
  { value: 'queued', label: 'Queued' },
  { value: 'ringing', label: 'Ringing' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'busy', label: 'Busy' },
  { value: 'failed', label: 'Failed' },
  { value: 'no-answer', label: 'No Answer' },
  { value: 'canceled', label: 'Canceled' },
]

const filterConfig = [
  { type: 'select' as const, key: 'status', label: 'Status', options: statusOptions },
  { type: 'text' as const, key: 'from', label: 'From', placeholder: '+1...' },
  { type: 'text' as const, key: 'to', label: 'To', placeholder: '+1...' },
  { type: 'date' as const, key: 'startTime', label: 'From Date' },
  { type: 'date' as const, key: 'endTime', label: 'To Date' },
]

export default function Calls() {
  const { fetchWithAccount, refreshKey, currentAccount } = useAccount()
  const isAllAccounts = currentAccount?.id === 'all'
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [selectedCall, setSelectedCall] = useState<CallDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const fetchCalls = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v)
      })
      const res = await fetchWithAccount(`/api/calls?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      setCalls(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filters, fetchWithAccount])

  useEffect(() => {
    fetchCalls()
  }, [fetchCalls, refreshKey])

  const handleRowClick = async (call: Call) => {
    setDetailsLoading(true)
    try {
      const res = await fetchWithAccount(`/api/calls/${call.sid}`)
      if (!res.ok) throw new Error('Failed to fetch')
      setSelectedCall(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setDetailsLoading(false)
    }
  }

  const columns = useMemo(() => {
    const cols = [
      {
        key: 'direction',
        label: 'Dir',
        render: (c: Call) => (
          <span className={c.direction === 'inbound' ? 'text-success' : 'text-blue-400'}>
            {c.direction === 'inbound' ? '↓' : '↑'}
          </span>
        ),
      },
      { key: 'from', label: 'From' },
      { key: 'to', label: 'To' },
      {
        key: 'status',
        label: 'Status',
        render: (c: Call) => {
           let statusClass = 'bg-hub-800 text-hub-muted';
           if (c.status === 'completed') statusClass = 'bg-success/10 text-success border border-success/20';
           if (c.status === 'failed') statusClass = 'bg-danger/10 text-danger border border-danger/20';
           if (c.status === 'in-progress') statusClass = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
           
          return (
            <span className={`px-2 py-0.5 rounded text-xs capitalize ${statusClass}`}>
              {c.status}
            </span>
          )
        },
      },
      {
        key: 'duration',
        label: 'Duration',
        render: (c: Call) => <span className="text-hub-dim font-mono">{c.duration}s</span>,
      },
      {
        key: 'startTime',
        label: 'Time',
        render: (c: Call) => <span className="text-hub-dim text-xs">{new Date(c.startTime).toLocaleString()}</span>,
      },
    ]

    if (isAllAccounts) {
      cols.splice(1, 0, {
        key: 'accountId',
        label: 'Account',
        render: (c: Call) => c.accountId ? <AccountBadge accountId={c.accountId} /> : null,
      })
    }

    return cols
  }, [isAllAccounts])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-hub-text">Call Logs</h2>
        <button
          onClick={fetchCalls}
          className="px-3 py-1.5 bg-hub-800 hover:bg-hub-700 rounded text-sm font-medium transition-colors border border-hub-700"
        >
          Refresh
        </button>
      </div>

      <Filters
        filters={filterConfig}
        values={filters}
        onChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))}
        onApply={fetchCalls}
      />

      <div className="bg-hub-900 border border-hub-700 rounded-xl overflow-hidden">
        <LogTable data={calls} columns={columns} loading={loading} onRowClick={handleRowClick} />
      </div>

      {selectedCall && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-hub-900 border border-hub-700 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-hub-text">Call Details</h3>
              <button
                onClick={() => setSelectedCall(null)}
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
                    <p className="text-hub-text font-mono">{selectedCall.from}</p>
                  </div>
                  <div className="p-3 bg-hub-950 rounded-lg border border-hub-800">
                    <span className="text-hub-dim text-xs uppercase block mb-1">To</span>
                    <p className="text-hub-text font-mono">{selectedCall.to}</p>
                  </div>
                  <div>
                    <span className="text-hub-muted">Status:</span>
                    <p className="text-hub-text capitalize">{selectedCall.status}</p>
                  </div>
                  <div>
                    <span className="text-hub-muted">Direction:</span>
                    <p className="text-hub-text capitalize">{selectedCall.direction}</p>
                  </div>
                  <div>
                    <span className="text-hub-muted">Duration:</span>
                    <p className="text-hub-text">{selectedCall.duration}s</p>
                  </div>
                  <div>
                    <span className="text-hub-muted">Price:</span>
                    <p className="text-hub-text">
                      {selectedCall.price
                        ? `${selectedCall.price} ${selectedCall.priceUnit}`
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {selectedCall.recordings.length > 0 && (
                  <div className="pt-4 border-t border-hub-800">
                    <p className="text-hub-muted mb-2 font-medium">Recordings:</p>
                    {selectedCall.recordings.map((rec) => (
                      <div key={rec.sid} className="flex items-center gap-3 mb-2 p-2 bg-hub-950 rounded border border-hub-800">
                        <audio controls className="h-8 flex-1">
                          <source src={rec.url} type="audio/mpeg" />
                        </audio>
                        <span className="text-hub-dim text-xs font-mono">{rec.duration}s</span>
                      </div>
                    ))}
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