type Props = {
  onClose: () => void
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)
const modKey = isMac ? '⌘' : 'Ctrl'

const shortcuts = [
  { keys: '?', description: 'Show this help' },
  { keys: `${modKey}+1`, description: 'Go to Dashboard' },
  { keys: `${modKey}+2`, description: 'Go to Numbers' },
  { keys: `${modKey}+3`, description: 'Go to Calls' },
  { keys: `${modKey}+4`, description: 'Go to SMS' },
  { keys: `${modKey}+5`, description: 'Go to Alerts' },
  { keys: `${modKey}+Shift+1-9`, description: 'Switch to account 1-9' },
]

export default function ShortcutHelpModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-hub-900 rounded-xl border border-hub-700 shadow-2xl w-full max-w-md animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-hub-700">
          <h2 className="text-lg font-bold text-hub-text">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-hub-muted hover:text-hub-text p-1 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <table className="w-full">
            <tbody>
              {shortcuts.map((shortcut) => (
                <tr key={shortcut.keys} className="border-b border-hub-800 last:border-0">
                  <td className="py-3 pr-4">
                    <kbd className="px-2 py-1 bg-hub-950 border border-hub-800 rounded-md text-xs font-mono text-hub-accent font-bold shadow-sm">
                      {shortcut.keys}
                    </kbd>
                  </td>
                  <td className="py-3 text-hub-muted text-sm">{shortcut.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-hub-700 text-center">
          <span className="text-hub-dim text-xs">Press Esc or click outside to close</span>
        </div>
      </div>
    </div>
  )
}
