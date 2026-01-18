# Twilio Dashboard

Multi-account Twilio dashboard with real-time monitoring, cost tracking, and activity feeds.

## Features

- Multi-account switching with color-coded badges
- Live call/message activity feed
- Phone number tracking + staleness detection
- Cost analytics (7d/30d/90d/all periods)
- Webhooks & alerts management
- Keyboard shortcuts (press `?`)

## Stack

| Layer    | Tech                              |
| -------- | --------------------------------- |
| Frontend | React 18, Vite, TypeScript, Tailwind |
| Backend  | Hono, Bun, Twilio SDK             |

## Setup

**Prerequisites:** [Bun](https://bun.sh) + Twilio account SID/token

```bash
bun install
```

**Create `accounts.json`:**
```json
{
  "defaultStaleAfterDays": 30,
  "accounts": [
    {
      "id": "prod",
      "name": "Production",
      "sid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "token": "your_auth_token_here",
      "staleAfterDays": 45
    }
  ]
}
```

| Field                | Description                          |
| -------------------- | ------------------------------------ |
| `defaultStaleAfterDays` | Global threshold for stale numbers (default: 30) |
| `staleAfterDays`     | Per-account override (optional)      |

**Run:**
```bash
bun start          # Both server + frontend
bun run server     # Backend only (:3001)
bun run dev        # Frontend only (:5173)
bun run build      # Production build
```

## Security

`.gitignore` protects:
- `accounts.json` (Twilio credentials)
- `.env` files
- `*.log` files

Never commit credentials.

## Structure

```
src/
├── components/     # UI components
├── context/        # Account, Toast contexts
├── hooks/          # useKeyboardShortcuts
└── pages/          # Dashboard, Calls, Messages, etc.

server/
├── routes/         # API endpoints
└── index.ts        # Hono app + Twilio client cache
```

## API

| Endpoint                         | Description             |
| -------------------------------- | ----------------------- |
| `GET /api/accounts`              | List accounts (no tokens) |
| `GET /api/stats`                 | Dashboard stats         |
| `GET /api/numbers`               | Phone numbers + filters |
| `GET /api/calls`                 | Call logs               |
| `GET /api/messages`              | Message logs            |
| `GET /api/alerts`                | System alerts           |
| `GET /api/costs?period=30d`      | Cost breakdown          |
| `GET /api/staleness`             | Stale number detection  |
| `GET /api/webhooks`              | Webhook configs         |
| `GET /api/health`                | Health check            |

Press `?` for keyboard shortcuts.

## License

MIT
