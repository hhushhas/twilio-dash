import { existsSync, readFileSync } from "fs";
import { Hono } from "hono";
import { cors } from "hono/cors";
import Twilio from "twilio";
import { alertsRoutes } from "./routes/alerts";
import { callsRoutes } from "./routes/calls";
import { costsRoutes } from "./routes/costs";
import { messagesRoutes } from "./routes/messages";
import { numbersRoutes } from "./routes/numbers";
import { stalenessRoutes } from "./routes/staleness";
import { statsRoutes } from "./routes/stats";
import { webhooksRoutes } from "./routes/webhooks";

const app = new Hono();

// Middleware
app.use("/*", cors());

// Load accounts from file (supports both array and object formats)
const accountsPath = "./accounts.json";
const rawConfig = existsSync(accountsPath)
	? JSON.parse(readFileSync(accountsPath, "utf-8"))
	: { defaultStaleAfterDays: 30, accounts: [] };

// Migration: if array format detected, wrap with default config
const config = Array.isArray(rawConfig)
	? { defaultStaleAfterDays: 30, accounts: rawConfig }
	: rawConfig;

const accounts = config.accounts as Array<{
	id: string;
	name: string;
	sid: string;
	token: string;
	staleAfterDays?: number;
}>;
const defaultStaleAfterDays = config.defaultStaleAfterDays as number;

// Color palette for accounts
const ACCOUNT_COLORS = [
	"#3B82F6", // blue
	"#EF4444", // red
	"#10B981", // green
	"#F59E0B", // amber
	"#8B5CF6", // purple
	"#EC4899", // pink
	"#06B6D4", // cyan
	"#F97316", // orange
];

if (accounts.length === 0) {
	console.warn(
		"No accounts found in accounts.json - create the file with account credentials",
	);
}

// Cache for Twilio clients
const clientCache = new Map<string, ReturnType<typeof Twilio>>();

// Get or create Twilio client for an account
export function getClient(accountId: string) {
	const cached = clientCache.get(accountId);
	if (cached) return cached;

	const account = accounts.find((a) => a.id === accountId);
	if (!account) {
		throw new Error(`Account not found: ${accountId}`);
	}

	const client = Twilio(account.sid, account.token);
	clientCache.set(accountId, client);
	return client;
}

// Get account SID by ID (for URL construction)
export function getAccountSid(accountId: string) {
	const account = accounts.find((a) => a.id === accountId);
	if (!account) {
		throw new Error(`Account not found: ${accountId}`);
	}
	return account.sid;
}

// Get all account IDs (for aggregation)
export function getAllAccountIds(): string[] {
	return accounts.map((a) => a.id);
}

// Get staleness threshold for an account (in days)
export function getStaleAfterDays(accountId: string): number {
	const account = accounts.find((a) => a.id === accountId);
	return account?.staleAfterDays ?? defaultStaleAfterDays;
}

// Get all accounts with staleness config
export function getAllAccounts() {
	return accounts.map((a) => ({
		id: a.id,
		name: a.name,
		staleAfterDays: a.staleAfterDays ?? defaultStaleAfterDays,
	}));
}

// Middleware to extract account ID from header
app.use("/api/*", async (c, next) => {
	const accountId =
		c.req.header("X-Twilio-Account") || (accounts[0]?.id as string);
	c.set("accountId", accountId);
	await next();
});

// List accounts (safe - no tokens exposed)
app.get("/api/accounts", (c) => {
	const safe = accounts.map((a, index) => ({
		id: a.id,
		name: a.name,
		color: ACCOUNT_COLORS[index % ACCOUNT_COLORS.length],
	}));
	return c.json(safe);
});

// Mount routes
app.route("/api/numbers", numbersRoutes);
app.route("/api/calls", callsRoutes);
app.route("/api/messages", messagesRoutes);
app.route("/api/alerts", alertsRoutes);
app.route("/api/stats", statsRoutes);
app.route("/api/staleness", stalenessRoutes);
app.route("/api/costs", costsRoutes);
app.route("/api/webhooks", webhooksRoutes);

// Health check
app.get("/api/health", (c) => c.json({ status: "ok" }));

const port = 3001;
console.log(`Server running on http://localhost:${port}`);
console.log(`Loaded ${accounts.length} account(s)`);

export default {
	port,
	fetch: app.fetch,
};
