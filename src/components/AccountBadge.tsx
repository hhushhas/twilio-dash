import { useAccount } from '../context/AccountContext'

type Props = {
  accountId: string
}

export default function AccountBadge({ accountId }: Props) {
  const { accounts } = useAccount()
  const account = accounts.find((a) => a.id === accountId)

  if (!account) return <span className="text-hub-dim">-</span>

  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: account.color }}
      />
      <span className="text-hub-muted truncate font-mono">{account.name}</span>
    </span>
  )
}
