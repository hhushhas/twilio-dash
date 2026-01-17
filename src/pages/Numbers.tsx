import { useState, useEffect } from 'react'
import NumberCard from '../components/NumberCard'
import ConfirmModal from '../components/ConfirmModal'
import { useAccount } from '../context/AccountContext'
import { useToast } from '../context/ToastContext'

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

type StalenessData = {
  staleNumbers: Array<{ sid: string }>
}

export default function Numbers() {
  const { fetchWithAccount, refreshKey, currentAccount } = useAccount()
  const { showToast } = useToast()
  const isAllAccounts = currentAccount?.id === 'all'
  const [numbers, setNumbers] = useState<PhoneNumber[]>([])
  const [staleSids, setStaleSids] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<PhoneNumber | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchNumbers = async () => {
    setLoading(true)
    setError(null)
    try {
      const [numbersRes, stalenessRes] = await Promise.all([
        fetchWithAccount('/api/numbers'),
        fetchWithAccount('/api/staleness'),
      ])
      if (!numbersRes.ok) throw new Error('Failed to fetch')
      const data = await numbersRes.json()
      setNumbers(data)

      if (stalenessRes.ok) {
        const stalenessData: StalenessData = await stalenessRes.json()
        setStaleSids(new Set(stalenessData.staleNumbers.map((n) => n.sid)))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load numbers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNumbers()
  }, [refreshKey])

  const handleUpdate = async (sid: string, data: Record<string, string>) => {
    const res = await fetchWithAccount(`/api/numbers/${sid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to update')
    const updated = await res.json()
    setNumbers((prev) =>
      prev.map((n) => (n.sid === sid ? { ...n, ...updated } : n))
    )
    showToast('Number updated successfully', 'success')
  }

  const handleDeleteClick = (sid: string) => {
    const num = numbers.find((n) => n.sid === sid)
    if (num) setDeleteTarget(num)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetchWithAccount(`/api/numbers/${deleteTarget.sid}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      setNumbers((prev) => prev.filter((n) => n.sid !== deleteTarget.sid))
      showToast(`${deleteTarget.phoneNumber} deleted`, 'success')
      setDeleteTarget(null)
    } catch (err) {
      showToast('Failed to delete number', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = numbers.filter(
    (n) =>
      n.phoneNumber.includes(search) ||
      n.friendlyName.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-hub-700 border-t-hub-text rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error}</p>
        <button
          onClick={fetchNumbers}
          className="px-4 py-2 bg-hub-800 hover:bg-hub-700 rounded text-sm font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-bold text-hub-text">Phone Numbers</h2>
            <p className="text-hub-muted text-sm mt-1">Manage your active Twilio numbers.</p>
         </div>
         <button className="bg-hub-accent text-hub-950 px-4 py-2 rounded-md text-sm font-bold hover:bg-white transition-colors">
            + Buy Number
         </button>
      </div>

       {/* Filter Bar */}
       <div className="flex gap-4 p-4 bg-hub-900 border border-hub-700 rounded-xl items-center">
         <div className="relative flex-1">
             <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-hub-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
             <input
                 type="text"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 placeholder="Search numbers..."
                 className="w-full bg-hub-950 border border-hub-800 rounded-lg pl-10 pr-4 py-2 text-sm text-hub-text focus:outline-none focus:border-hub-accent transition-colors"
             />
         </div>
         <button
            onClick={fetchNumbers}
             className="px-4 py-2 bg-hub-800 hover:bg-hub-700 rounded-lg text-sm font-medium transition-colors border border-hub-700"
         >
             Refresh
         </button>
       </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((number) => (
          <NumberCard
            key={number.sid}
            number={number}
            onUpdate={handleUpdate}
            onDelete={handleDeleteClick}
            showAccount={isAllAccounts}
            isStale={staleSids.has(number.sid)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-hub-muted py-8">No numbers found</p>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Phone Number"
          message={`Are you sure you want to delete ${deleteTarget.phoneNumber}? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          loading={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}