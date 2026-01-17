# Changelog

## [0.3.0] - 2026-01-17

### Added

- **Staleness Detection**: Identify inactive phone numbers
  - Configurable threshold via `defaultStaleAfterDays` in accounts.json (default: 30 days)
  - Per-account override with `staleAfterDays` property
  - "Stale Numbers" card on Dashboard with count
  - Amber "Stale" badge on NumberCard for inactive numbers
  - New `/api/staleness` endpoint

- **Cost Tracking**: View usage costs over time
  - Period selector: 7d, 30d, 90d, or All time
  - Costs section on Dashboard showing calls, messages, and total
  - Breakdown by account when viewing "All Accounts"
  - New `/api/costs` endpoint with period filter

- **Webhook Health Check**: Test webhook endpoints on-demand
  - "Test" button next to each webhook URL on NumberCard
  - Sends Twilio-like POST payload to verify endpoint responds
  - Status indicators: green (healthy), red (unhealthy), orange (unreachable)
  - SSRF protection: only configured webhook URLs can be tested
  - New `/api/webhooks/test` endpoint

### Changed

- accounts.json now supports object format with global `defaultStaleAfterDays` config
- Backward compatible: array format auto-migrates at runtime

## [0.2.0] - 2026-01-17

### Added

- **Multi-Account Support**: Switch between Twilio sub-accounts without editing `.env`
  - Account switcher dropdown in header (shows when 2+ accounts configured)
  - Account credentials stored in `accounts.json` (gitignored)
  - Per-request Twilio client creation based on `X-Twilio-Account` header
  - Account selection persisted to localStorage
  - Auto-refresh data when switching accounts
  - New `/api/accounts` endpoint (returns id + name only, no tokens exposed)

## [0.1.0] - 2026-01-17

### Added

- Initial release of Twilio Dashboard
- **Backend** (Hono + Bun):
  - `/api/numbers` - List and update phone numbers with webhook URLs
  - `/api/calls` - List calls with filters, get call details with recordings
  - `/api/messages` - List SMS with filters, view media attachments
  - `/api/alerts` - List error/debug logs from Twilio Monitor
- **Frontend** (React + Vite + Tailwind):
  - Numbers page: List all phone numbers, inline edit webhook URLs, copy to clipboard
  - Calls page: Paginated call history with status/date/direction filters, recording playback
  - Messages page: SMS history with filters, MMS media viewing
  - Alerts page: Error log viewer with severity filters
- Dark mode UI by default
- Keyboard-friendly navigation
