import { ReactNode } from 'react'

type Column<T> = {
  key: string
  label: string
  render?: (item: T) => ReactNode
}

type Props<T> = {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  onRowClick?: (item: T) => void
}

export default function LogTable<T extends { sid: string }>({
  data,
  columns,
  loading,
  onRowClick,
}: Props<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-hub-700 border-t-hub-text rounded-full" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-hub-muted">
        No records found
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-hub-950 text-hub-muted border-b border-hub-800">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="py-3 px-6 text-xs font-medium uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hub-800">
          {data.map((item) => (
            <tr
              key={item.sid}
              onClick={() => onRowClick?.(item)}
              className={`transition-colors ${
                onRowClick ? 'cursor-pointer hover:bg-hub-800/50' : ''
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className="py-4 px-6 text-hub-text">
                  {col.render
                    ? col.render(item)
                    : String((item as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}