import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from '../context/AccountContext'

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

type ShortcutConfig = {
  onShowHelp: () => void
}

export function useKeyboardShortcuts({ onShowHelp }: ShortcutConfig) {
  const navigate = useNavigate()
  const { accounts, setCurrentAccount } = useAccount()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip when focused on form elements
      if (INPUT_TAGS.has((e.target as HTMLElement).tagName)) return
      if ((e.target as HTMLElement).isContentEditable) return

      const isMod = e.metaKey || e.ctrlKey

      // ? → Show help
      if (e.key === '?' && !isMod) {
        e.preventDefault()
        onShowHelp()
        return
      }

      // Cmd/Ctrl + number → Navigate tabs
      if (isMod && !e.shiftKey && e.key >= '1' && e.key <= '5') {
        e.preventDefault()
        const routes = ['/', '/numbers', '/calls', '/messages', '/alerts']
        const index = parseInt(e.key) - 1
        if (routes[index]) navigate(routes[index])
        return
      }

      // Cmd/Ctrl + Shift + number → Switch accounts
      if (isMod && e.shiftKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const index = parseInt(e.key) - 1
        // Filter out "all" pseudo-account for direct switching
        const realAccounts = accounts.filter((a) => a.id !== 'all')
        if (realAccounts[index]) {
          setCurrentAccount(realAccounts[index])
        }
        return
      }
    },
    [navigate, accounts, setCurrentAccount, onShowHelp]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
