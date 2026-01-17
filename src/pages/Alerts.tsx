import { useState, useEffect, useCallback, useMemo } from 'react'
import LogTable from '../components/LogTable'
import Filters from '../components/Filters'
import AccountBadge from '../components/AccountBadge'
import { useAccount } from '../context/AccountContext'

type Alert = {
  sid: string
  alertText: string
  logLevel: string
  errorCode: string
  moreInfo: string
  requestMethod: string
  requestUrl: string
  resourceSid: string
  dateCreated: string
  accountId?: string
}

type AlertDetails = Alert & {
  requestVariables: string
  responseBody: string
  responseHeaders: string
}

const logLevelOptions = [
  { value: 'error', label: 'Error' },
  { value: 'warning', label: 'Warning' },
  { value: 'notice', label: 'Notice' },
  { value: 'debug', label: 'Debug' },
]

const filterConfig = [
  { type: 'select' as const, key: 'logLevel', label: 'Level', options: logLevelOptions },
  { type: 'date' as const, key: 'startDate', label: 'From Date' },
  { type: 'date' as const, key: 'endDate', label: 'To Date' },
]

export default function Alerts() {
  const { fetchWithAccount, refreshKey, currentAccount } = useAccount()
  const isAllAccounts = currentAccount?.id === 'all'
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [selectedAlert, setSelectedAlert] = useState<AlertDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v)
      })
      const res = await fetchWithAccount(`/api/alerts?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      setAlerts(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filters, fetchWithAccount])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts, refreshKey])

  const handleRowClick = async (alert: Alert) => {
    setDetailsLoading(true)
    try {
      const res = await fetchWithAccount(`/api/alerts/${alert.sid}`)
      if (!res.ok) throw new Error('Failed to fetch')
      setSelectedAlert(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setDetailsLoading(false)
    }
  }

  const columns = useMemo(() => {
    const cols = [
      {
        key: 'logLevel',
        label: 'Level',
        render: (a: Alert) => {
           let levelClass = 'bg-hub-800 text-hub-muted';
           if (a.logLevel === 'error') levelClass = 'bg-danger/10 text-danger border border-danger/20';
           if (a.logLevel === 'warning') levelClass = 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
           
          return (
            <span
              className={`px-2 py-0.5 rounded text-xs capitalize ${levelClass}`}
            >
              {a.logLevel}
            </span>
          )
        },
      },
      {
        key: 'errorCode',
        label: 'Code',
        render: (a: Alert) => <span className="font-mono text-hub-dim">{a.errorCode || '-'}</span>,
      },
      {
        key: 'alertText',
        label: 'Message',
        render: (a: Alert) => <span className="truncate max-w-md block text-hub-text">{a.alertText}</span>,
      },
      {
        key: 'dateCreated',
        label: 'Time',
        render: (a: Alert) => <span className="text-hub-dim text-xs">{new Date(a.dateCreated).toLocaleString()}</span>,
      },
    ]

    if (isAllAccounts) {
      cols.splice(1, 0, {
        key: 'accountId',
        label: 'Account',
        render: (a: Alert) => a.accountId ? <AccountBadge accountId={a.accountId} /> : null,
      })
    }

    return cols
  }, [isAllAccounts])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-hub-text">Error Logs</h2>
        <button
          onClick={fetchAlerts}
          className="px-3 py-1.5 bg-hub-800 hover:bg-hub-700 rounded text-sm font-medium transition-colors border border-hub-700"
        >
          Refresh
        </button>
      </div>

      <Filters
        filters={filterConfig}
        values={filters}
        onChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))}
        onApply={fetchAlerts}
      />

      <div className="bg-hub-900 border border-hub-700 rounded-xl overflow-hidden">
        <LogTable data={alerts} columns={columns} loading={loading} onRowClick={handleRowClick} />
      </div>

      {selectedAlert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-hub-900 border border-hub-700 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-hub-text">Alert Details</h3>
              <button
                onClick={() => setSelectedAlert(null)}
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
                  <div>
                    <span className="text-hub-muted">Level:</span>
                    <p className="text-hub-text capitalize">{selectedAlert.logLevel}</p>
                  </div>
                  <div>
                    <span className="text-hub-muted">Error Code:</span>
                    <p className="text-danger font-mono font-bold">{selectedAlert.errorCode || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-hub-muted">Request Method:</span>
                    <p className="text-hub-text font-mono">{selectedAlert.requestMethod}</p>
                  </div>
                  <div>
                    <span className="text-hub-muted">Resource SID:</span>
                    <p className="text-hub-dim font-mono text-xs">
                      {selectedAlert.resourceSid || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-hub-800">
                  <span className="text-hub-muted block mb-1">Alert Text:</span>
                  <p className="text-hub-text p-3 bg-hub-950 rounded-lg border border-hub-800 font-mono text-xs">{selectedAlert.alertText}</p>
                </div>

                {selectedAlert.requestUrl && (
                  <div className="pt-4 border-t border-hub-800">
                    <span className="text-hub-muted block mb-1">Request URL:</span>
                    <p className="text-hub-dim font-mono text-xs break-all">
                      {selectedAlert.requestUrl}
                    </p>
                  </div>
                )}

                {selectedAlert.requestVariables && (
                  <div className="pt-4 border-t border-hub-800">
                    <span className="text-hub-muted block mb-1">Request Variables:</span>
                    <pre className="text-hub-text text-xs bg-hub-950 border border-hub-800 p-3 rounded-lg overflow-x-auto">
                      {selectedAlert.requestVariables}
                    </pre>
                  </div>
                )}

                {selectedAlert.responseBody && (
                  <div className="pt-4 border-t border-hub-800">
                    <span className="text-hub-muted block mb-1">Response Body:</span>
                    <pre className="text-hub-text text-xs bg-hub-950 border border-hub-800 p-3 rounded-lg overflow-x-auto">
                      {selectedAlert.responseBody}
                    </pre>
                  </div>
                )}

                {selectedAlert.moreInfo && (
                  <div className="pt-4 border-t border-hub-800">
                    <a
                      href={selectedAlert.moreInfo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-hub-accent hover:underline flex items-center gap-1"
                    >
                      More Info &rarr;
                    </a>
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