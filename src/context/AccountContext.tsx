import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

type Account = {
  id: string
  name: string
  color: string
}

type AccountContextValue = {
  accounts: Account[]
  currentAccount: Account | null
  setCurrentAccount: (account: Account) => void
  fetchWithAccount: (url: string, options?: RequestInit) => Promise<Response>
  refreshKey: number
}

const AccountContext = createContext<AccountContextValue | null>(null)

const STORAGE_KEY = 'twilio-dash-account'

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [currentAccount, setCurrentAccountState] = useState<Account | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetch('/api/accounts')
      .then((res) => res.json())
      .then((data: Account[]) => {
        // Add "All Accounts" pseudo-account at the top if multiple accounts exist
        const allAccounts =
          data.length > 1
            ? [{ id: 'all', name: 'All Accounts', color: '#6B7280' }, ...data]
            : data
        setAccounts(allAccounts)
        const savedId = localStorage.getItem(STORAGE_KEY)
        const saved = allAccounts.find((a) => a.id === savedId)
        setCurrentAccountState(saved || data[0] || null)
      })
      .catch(console.error)
  }, [])

  const setCurrentAccount = useCallback((account: Account) => {
    setCurrentAccountState(account)
    localStorage.setItem(STORAGE_KEY, account.id)
    setRefreshKey((k) => k + 1)
  }, [])

  const fetchWithAccount = useCallback(
    (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers)
      if (currentAccount) {
        headers.set('X-Twilio-Account', currentAccount.id)
      }
      return fetch(url, { ...options, headers })
    },
    [currentAccount]
  )

  return (
    <AccountContext.Provider
      value={{ accounts, currentAccount, setCurrentAccount, fetchWithAccount, refreshKey }}
    >
      {children}
    </AccountContext.Provider>
  )
}

export function useAccount() {
  const context = useContext(AccountContext)
  if (!context) {
    throw new Error('useAccount must be used within AccountProvider')
  }
  return context
}
