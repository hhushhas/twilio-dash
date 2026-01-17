type Props = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  loading = false,
}: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-hub-900 rounded-xl border border-hub-700 shadow-2xl w-full max-w-md animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-hub-700">
          <h2 className="text-lg font-bold text-hub-text">{title}</h2>
        </div>

        <div className="p-6">
          <p className="text-hub-muted leading-relaxed">{message}</p>
        </div>

        <div className="px-6 py-4 border-t border-hub-700 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-hub-800 hover:bg-hub-700 text-hub-text disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 ${
              variant === 'danger'
                ? 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20'
                : 'bg-hub-accent text-hub-950 hover:bg-white'
            }`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
