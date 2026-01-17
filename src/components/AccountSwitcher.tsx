import { useState, useRef, useEffect } from 'react'
import { useAccount } from '../context/AccountContext'

export default function AccountSwitcher() {
  const { accounts, currentAccount, setCurrentAccount } = useAccount()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (accounts.length < 2) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm font-medium transition-colors"
      >
        {currentAccount && (
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: currentAccount.color }}
          />
        )}
        <span className="text-zinc-100">{currentAccount?.name || 'Select Account'}</span>
        <svg
          className={`w-4 h-4 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-50">
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => {
                setCurrentAccount(account)
                setOpen(false)
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-700 transition-colors first:rounded-t-md last:rounded-b-md flex items-center gap-2 ${
                account.id === currentAccount?.id ? 'text-blue-400' : 'text-zinc-100'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: account.color }}
              />
              <span className="flex-1">{account.name}</span>
              {account.id === currentAccount?.id && (
                <span className="text-blue-400">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
