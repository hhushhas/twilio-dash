# Twilio Dashboard

A modern, full-stack dashboard for managing multiple Twilio accounts with real-time monitoring, cost tracking, and activity feeds.

## Features

- **Multi-Account Management** - Seamlessly switch between multiple Twilio accounts
- **Real-Time Activity** - Live feed of calls and messages across all accounts
- **Phone Number Tracking** - Monitor active numbers and detect stale/unused numbers
- **Call & Message Logs** - Browse and filter communication history
- **Cost Analytics** - Track spending across configurable time periods (7d, 30d, 90d, all)
- **Alerts Monitoring** - View system alerts and notifications
- **Webhooks Management** - Configure and manage webhook endpoints
- **Keyboard Shortcuts** - Press `?` to view all shortcuts
- **Dark Theme** - Clean, modern UI built with Tailwind CSS

## Tech Stack

**Frontend:**
- React 18
- Vite
- React Router
- TypeScript
- Tailwind CSS

**Backend:**
- Hono (lightweight web framework)
- Bun runtime
- Twilio SDK

## Setup

### Prerequisites

- [Bun](https://bun.sh) installed
- Twilio account(s) with SID and Auth Token

### Installation

```bash
# Install dependencies
bun install
```

### Configuration

Create an `accounts.json` file in the root directory:

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
    },
    {
      "id": "dev",
      "name": "Development",
      "sid": "ACyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
      "token": "your_auth_token_here"
    }
  ]
}
```

**Configuration Options:**
- `defaultStaleAfterDays` - Global threshold for marking numbers as stale (default: 30)
- `staleAfterDays` - Per-account override for staleness detection (optional)

### Running

```bash
# Development (runs both server and frontend)
bun start

# Or run separately:
bun run server  # Backend on http://localhost:3001
bun run dev     # Frontend on http://localhost:5173
```

### Build

```bash
bun run build
```

## Security

Sensitive credentials are protected:
- `.env` files (if used)
- `accounts.json` (contains Twilio credentials)
- API tokens never exposed to frontend

**Never commit these files to version control.**

## Project Structure

```
twilio-dash/
├── src/                    # Frontend React app
│   ├── components/         # Reusable UI components
│   ├── context/           # React contexts (Account, Toast)
│   ├── hooks/             # Custom hooks
│   ├── pages/             # Route pages
│   └── main.tsx           # Entry point
├── server/                # Backend Hono server
│   ├── routes/            # API endpoints
│   └── index.ts           # Server entry point
├── accounts.json          # Twilio credentials (gitignored)
└── package.json
```

## API Endpoints

- `GET /api/accounts` - List configured accounts (safe, no tokens)
- `GET /api/stats` - Dashboard statistics
- `GET /api/numbers` - Phone numbers with filtering
- `GET /api/calls` - Call logs
- `GET /api/messages` - Message logs
- `GET /api/alerts` - System alerts
- `GET /api/costs?period={7d|30d|90d|all}` - Cost breakdown
- `GET /api/staleness` - Stale number detection
- `GET /api/webhooks` - Webhook configurations
- `GET /api/health` - Health check

## Keyboard Shortcuts

Press `?` in the app to view all available shortcuts.

## License

MIT
