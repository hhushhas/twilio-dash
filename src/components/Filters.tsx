import { ReactNode } from 'react'

type FilterConfig = {
  type: 'text' | 'select' | 'date'
  key: string
  label: string
  placeholder?: string
  options?: { value: string; label: string }[]
}

type Props = {
  filters: FilterConfig[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  onApply: () => void
}

export default function Filters({ filters, values, onChange, onApply }: Props) {
  return (
    <div className="flex flex-wrap gap-3 items-end mb-4 bg-hub-900/50 p-4 rounded-xl border border-hub-700/50">
      {filters.map((filter) => (
        <div key={filter.key} className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-hub-muted uppercase tracking-wider">{filter.label}</label>
          {filter.type === 'select' ? (
            <div className="relative">
              <select
                value={values[filter.key] || ''}
                onChange={(e) => onChange(filter.key, e.target.value)}
                className="appearance-none bg-hub-950 border border-hub-800 rounded-lg px-3 py-2 text-sm text-hub-text focus:outline-none focus:border-hub-accent transition-colors min-w-[140px] pr-8"
              >
                <option value="">All</option>
                {filter.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-hub-dim">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          ) : filter.type === 'date' ? (
            <input
              type="date"
              value={values[filter.key] || ''}
              onChange={(e) => onChange(filter.key, e.target.value)}
              className="bg-hub-950 border border-hub-800 rounded-lg px-3 py-2 text-sm text-hub-text focus:outline-none focus:border-hub-accent transition-colors"
            />
          ) : (
            <input
              type="text"
              value={values[filter.key] || ''}
              onChange={(e) => onChange(filter.key, e.target.value)}
              placeholder={filter.placeholder}
              className="bg-hub-950 border border-hub-800 rounded-lg px-3 py-2 text-sm text-hub-text focus:outline-none focus:border-hub-accent transition-colors w-48 placeholder-hub-dim"
            />
          )}
        </div>
      ))}
      <button
        onClick={onApply}
        className="px-4 py-2 bg-hub-800 hover:bg-hub-700 text-hub-text border border-hub-700 hover:border-hub-accent rounded-lg text-sm font-medium transition-all ml-auto"
      >
        Apply Filters
      </button>
    </div>
  )
}
