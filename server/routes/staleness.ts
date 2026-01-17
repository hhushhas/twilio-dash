import { Hono } from "hono";
import {
	getAllAccountIds,
	getAllAccounts,
	getClient,
	getStaleAfterDays,
} from "../index";

export const stalenessRoutes = new Hono();

// GET /api/staleness - detect stale numbers and accounts
stalenessRoutes.get("/", async (c) => {
	try {
		const accountId = c.get("accountId") as string;
		const accountIds = accountId === "all" ? getAllAccountIds() : [accountId];
		const accountsInfo = getAllAccounts();

		const staleNumbers: Array<{
			sid: string;
			phoneNumber: string;
			accountId: string;
			lastActivity: string | null;
		}> = [];

		const accountNumberCounts: Record<string, { total: number; stale: number }> = {};

		for (const id of accountIds) {
			const client = getClient(id);
			const staleAfterDays = getStaleAfterDays(id);
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - staleAfterDays);

			// Fetch all numbers for this account
			const numbers = await client.incomingPhoneNumbers.list({ limit: 500 });

			// Fetch recent calls and messages (after cutoff)
			const [calls, messages] = await Promise.all([
				client.calls.list({ startTimeAfter: cutoffDate, limit: 500 }),
				client.messages.list({ dateSentAfter: cutoffDate, limit: 500 }),
			]);

			// Build set of active numbers from call/message from/to fields
			const activeNumbers = new Set<string>();
			for (const call of calls) {
				activeNumbers.add(call.from);
				activeNumbers.add(call.to);
			}
			for (const msg of messages) {
				activeNumbers.add(msg.from);
				activeNumbers.add(msg.to);
			}

			// Also build a map of last activity per number
			const lastActivityMap = new Map<string, Date>();
			for (const call of calls) {
				const callTime = new Date(call.startTime);
				for (const num of [call.from, call.to]) {
					const existing = lastActivityMap.get(num);
					if (!existing || callTime > existing) {
						lastActivityMap.set(num, callTime);
					}
				}
			}
			for (const msg of messages) {
				const msgTime = new Date(msg.dateSent);
				for (const num of [msg.from, msg.to]) {
					const existing = lastActivityMap.get(num);
					if (!existing || msgTime > existing) {
						lastActivityMap.set(num, msgTime);
					}
				}
			}

			accountNumberCounts[id] = { total: numbers.length, stale: 0 };

			// Check each number
			for (const num of numbers) {
				if (!activeNumbers.has(num.phoneNumber)) {
					const lastActivity = lastActivityMap.get(num.phoneNumber);
					staleNumbers.push({
						sid: num.sid,
						phoneNumber: num.phoneNumber,
						accountId: id,
						lastActivity: lastActivity?.toISOString() || null,
					});
					accountNumberCounts[id].stale++;
				}
			}
		}

		// Determine stale accounts (all numbers stale)
		const staleAccounts = accountIds
			.filter((id) => {
				const counts = accountNumberCounts[id];
				return counts && counts.total > 0 && counts.stale === counts.total;
			})
			.map((id) => {
				const info = accountsInfo.find((a) => a.id === id);
				return { accountId: id, name: info?.name || id };
			});

		const totalNumbers = Object.values(accountNumberCounts).reduce(
			(sum, c) => sum + c.total,
			0
		);

		return c.json({
			staleNumbers,
			staleAccounts,
			summary: {
				totalNumbers,
				staleNumberCount: staleNumbers.length,
				staleAccountCount: staleAccounts.length,
			},
		});
	} catch (error) {
		console.error("Error checking staleness:", error);
		return c.json({ error: "Failed to check staleness" }, 500);
	}
});
