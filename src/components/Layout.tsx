import { NavLink } from 'react-router-dom'
import { ReactNode, useState } from 'react'
import AccountSwitcher from './AccountSwitcher'
import ShortcutHelpModal from './ShortcutHelpModal'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

const tabs = [
  { path: '/', label: 'Dashboard' },
  { path: '/numbers', label: 'Numbers' },
  { path: '/calls', label: 'Calls' },
  { path: '/messages', label: 'Messages' },
  { path: '/alerts', label: 'Alerts' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const [showHelp, setShowHelp] = useState(false)

  useKeyboardShortcuts({ onShowHelp: () => setShowHelp(true) })

  return (
    <div className="min-h-screen flex flex-col bg-hub-950 text-hub-text font-mono">
      <header className="border-b border-hub-700 bg-hub-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-hub-accent shadow-glow"></div>
            <h1 className="text-lg font-bold text-hub-text tracking-tight">TWILIO DASH</h1>
          </div>
          
          <nav className="flex items-center gap-1 bg-hub-950/50 p-1 rounded-lg border border-hub-800">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                end={tab.path === '/'}
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-hub-accent/10 text-hub-accent'
                      : 'text-hub-muted hover:text-hub-text'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-hub-800 rounded-md border border-hub-700 text-sm hover:border-hub-accent cursor-pointer transition-colors group">
                <span className="w-2 h-2 rounded-full bg-blue-400 group-hover:shadow-[0_0_8px_rgba(96,165,250,0.6)] transition-shadow"></span>
                <span>Production</span>
            </div>
            <AccountSwitcher />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 animate-fade-in">{children}</main>
      {showHelp && <ShortcutHelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}
