import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from '../context/AccountContext'

type Stats = {
  numbers: number
  calls: number
  messages: number
}

type Activity = {
  type: 'call' | 'message'
  sid: string
  from: string
  to: string
  status: string
  date: string
  accountId: string
}

type StalenessData = {
  summary: { staleNumberCount: number }
}

type CostsData = {
  period: string
  totalCost: number
  breakdown: { calls: number; messages: number }
}

export default function Dashboard() {
  const { fetchWithAccount, refreshKey, currentAccount, accounts } = useAccount()
  const [stats, setStats] = useState<Stats | null>(null)
  const [activity, setActivity] = useState<Activity[]>([])
  const [staleness, setStaleness] = useState<StalenessData | null>(null)
  const [costs, setCosts] = useState<CostsData | null>(null)
  const [costPeriod, setCostPeriod] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAllAccounts = currentAccount?.id === 'all'

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, activityRes, stalenessRes, costsRes] = await Promise.all([
        fetchWithAccount('/api/stats'),
        fetchWithAccount('/api/stats/activity'),
        fetchWithAccount('/api/staleness'),
        fetchWithAccount(`/api/costs?period=${costPeriod}`),
      ])

      if (!statsRes.ok || !activityRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [statsData, activityData] = await Promise.all([
        statsRes.json(),
        activityRes.json(),
      ])

      setStats(statsData)
      setActivity(activityData)

      if (stalenessRes.ok) {
        setStaleness(await stalenessRes.json())
      }
      if (costsRes.ok) {
        setCosts(await costsRes.json())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [fetchWithAccount, costPeriod])

  useEffect(() => {
    fetchData()
  }, [fetchData, refreshKey])

  const getAccountName = (accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId)
    return acc?.name || accountId
  }

  const getAccountColor = (accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId)
    return (acc as { color?: string })?.color || '#6B7280'
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-hub-800 hover:bg-hub-700 rounded text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-2xl font-bold text-hub-text mb-1">Overview</h2>
            <p className="text-hub-muted text-sm">Welcome back. System status is healthy.</p>
        </div>
        <div className="text-hub-dim text-xs border border-hub-700 rounded px-2 py-1">Press ? for shortcuts</div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Active Numbers"
          value={stats?.numbers}
          loading={loading}
          href="/numbers"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          }
        />
        <StatCard
          label="Total Calls"
          value={stats?.calls}
          loading={loading}
          href="/calls"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 3l-6 6m0 0V4m0 5h5M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          }
        />
        <StatCard
          label="Messages"
          value={stats?.messages}
          loading={loading}
          href="/messages"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          }
        />
        <StatCard
          label="Stale Numbers"
          value={staleness?.summary.staleNumberCount}
          loading={loading}
          href="/numbers"
          variant="warning"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Costs Section */}
        <div className="lg:col-span-2 bg-hub-900 border border-hub-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-hub-text">Estimated Costs</h3>
                
                {/* Inline Switcher UX */}
                <div className="bg-hub-950 p-1 rounded-lg border border-hub-800 flex items-center">
                     {(['7d', '30d', '90d', 'all'] as const).map((period) => (
                    <button
                        key={period}
                        onClick={() => setCostPeriod(period)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            costPeriod === period
                                ? 'bg-hub-800 text-hub-text shadow-sm border border-hub-700'
                                : 'text-hub-muted hover:text-hub-text'
                        }`}
                    >
                         {period === 'all' ? 'All' : period}
                    </button>
                     ))}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <CostCard label="Calls" value={costs?.breakdown.calls} loading={loading} />
                <CostCard label="Messages" value={costs?.breakdown.messages} loading={loading} />
                <CostCard label="Total" value={costs?.totalCost} loading={loading} highlight />
            </div>

            {/* Fake Chart Visual (keeping consistent with the preview/concept) */}
            <div className="mt-8 h-48 flex items-end gap-2 px-2">
                <div className="w-full bg-hub-800 rounded-t-sm h-[40%] hover:bg-hub-accent transition-colors"></div>
                <div className="w-full bg-hub-800 rounded-t-sm h-[60%] hover:bg-hub-accent transition-colors"></div>
                <div className="w-full bg-hub-800 rounded-t-sm h-[30%] hover:bg-hub-accent transition-colors"></div>
                <div className="w-full bg-hub-800 rounded-t-sm h-[70%] hover:bg-hub-accent transition-colors"></div>
                <div className="w-full bg-hub-800 rounded-t-sm h-[50%] hover:bg-hub-accent transition-colors"></div>
                <div className="w-full bg-hub-800 rounded-t-sm h-[80%] hover:bg-hub-accent transition-colors"></div>
                <div className="w-full bg-hub-800 rounded-t-sm h-[65%] hover:bg-hub-accent transition-colors"></div>
            </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-hub-900 border border-hub-700 rounded-2xl overflow-hidden flex flex-col h-[500px]">
             <div className="p-4 border-b border-hub-700 flex justify-between items-center bg-hub-900 sticky top-0">
                <h3 className="font-bold text-hub-text text-sm">Live Activity</h3>
                <Link to="/calls" className="text-xs text-hub-accent hover:underline">View All</Link>
            </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="px-4 py-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-hub-700 border-t-hub-text rounded-full animate-spin" />
              </div>
            ) : activity.length === 0 ? (
              <div className="px-4 py-8 text-center text-hub-dim">No recent activity</div>
            ) : (
              activity.map((item) => (
                <div key={item.sid} className="p-3 rounded-lg hover:bg-hub-800 transition-colors flex gap-3 group cursor-default">
                  <div className={`mt-1 w-6 h-6 rounded bg-hub-950 flex items-center justify-center border border-hub-800 ${item.type === 'call' ? 'text-hub-muted group-hover:text-hub-text' : 'text-hub-muted group-hover:text-hub-text'}`}>
                    {item.type === 'call' ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-hub-text truncate flex items-center gap-1">
                            {item.from} <span className="text-hub-dim text-[10px]">&rarr;</span> {item.to}
                        </span>
                      </div>
                      <span className="text-[10px] text-hub-dim whitespace-nowrap ml-2">{formatDate(item.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                         <StatusBadge status={item.status} size="xs" />
                         <span className="text-[10px] text-hub-dim capitalize">{item.type}</span>
                         {isAllAccounts && (
                            <>
                             <span className="text-hub-dim">·</span>
                              <span
                                className="flex items-center gap-1 text-[10px]"
                                style={{ color: getAccountColor(item.accountId) }}
                              >
                                {getAccountName(item.accountId)}
                              </span>
                            </>
                         )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  loading,
  href,
  icon,
  variant,
}: {
  label: string
  value: number | undefined
  loading: boolean
  href: string
  icon: React.ReactNode
  variant?: 'default' | 'warning'
}) {
  const isWarning = variant === 'warning'
  const borderClass = isWarning
    ? 'border-danger/30 hover:border-danger/50'
    : 'border-hub-700'
  const textClass = isWarning ? 'text-danger' : 'text-hub-text'
  const iconClass = isWarning
    ? 'text-danger'
    : 'text-hub-dim group-hover:text-hub-text'

  return (
    <Link
      to={href}
      className={`hub-card bg-hub-900 rounded-2xl border p-6 cursor-pointer block ${borderClass}`}
    >
      <div className="flex justify-between items-start mb-4">
          <span className={`text-sm font-medium ${isWarning ? 'text-danger' : 'text-hub-muted'}`}>{label}</span>
          <span className={iconClass}>{icon}</span>
      </div>
      
      {loading ? (
        <div className="h-8 w-16 bg-hub-800 rounded animate-pulse mt-1" />
      ) : (
        <div className={`text-3xl font-bold ${textClass}`}>{value?.toLocaleString() ?? '-'}</div>
      )}
      
      <div className="mt-2 text-xs text-hub-dim">
          {isWarning ? 'Requires attention' : 'Updated just now'}
      </div>
    </Link>
  )
}

function CostCard({
  label,
  value,
  loading,
  highlight,
}: {
  label: string
  value: number | undefined
  loading: boolean
  highlight?: boolean
}) {
  const formatted = value !== undefined
    ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    : '-'

  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'bg-hub-950 border-hub-accent/30 relative overflow-hidden' : 'bg-hub-950 border-hub-800'}`}>
      {highlight && <div className="absolute inset-0 bg-hub-accent/5"></div>}
      <div className="relative">
        <div className={`text-sm mb-1 ${highlight ? 'text-hub-accent' : 'text-hub-muted'}`}>{label}</div>
        {loading ? (
            <div className="h-7 w-20 bg-hub-800 rounded animate-pulse" />
        ) : (
            <div className={`text-xl font-bold ${highlight ? 'text-hub-accent' : 'text-hub-text'}`}>
            {formatted}
            </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status, size = 'sm' }: { status: string, size?: 'sm' | 'xs' }) {
  const colors: Record<string, string> = {
    completed: 'text-success bg-success/10 border-success/20',
    'in-progress': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    queued: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    failed: 'text-danger bg-danger/10 border-danger/20',
    busy: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    'no-answer': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    delivered: 'text-success bg-success/10 border-success/20',
    sent: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    received: 'text-success bg-success/10 border-success/20',
    undelivered: 'text-danger bg-danger/10 border-danger/20',
  }
  
  const baseClass = colors[status] || 'text-hub-muted bg-hub-800 border-hub-700'
  const sizeClass = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'

  return <span className={`${baseClass} ${sizeClass} rounded border capitalize inline-block`}>{status}</span>
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}