import { useToast } from '../context/ToastContext'

const typeStyles = {
  success: 'bg-hub-900 border-success text-success shadow-[0_0_15px_-3px_rgba(95,135,135,0.3)]',
  error: 'bg-hub-900 border-danger text-danger shadow-[0_0_15px_-3px_rgba(207,85,85,0.3)]',
  info: 'bg-hub-900 border-hub-accent text-hub-accent shadow-[0_0_15px_-3px_rgba(231,138,83,0.3)]',
}

const typeIcons = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
}

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-5 py-3 rounded-xl border text-sm animate-slide-in font-medium ${typeStyles[toast.type]}`}
        >
          <span className="font-bold text-lg">{typeIcons[toast.type]}</span>
          <span>{toast.message}</span>
          <button
            onClick={() => dismissToast(toast.id)}
            className="ml-3 opacity-60 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
