import { Hono } from "hono";
import { getClient, getAllAccountIds } from "../index";

export const statsRoutes = new Hono();

// Get aggregated stats
statsRoutes.get("/", async (c) => {
	try {
		const accountId = c.get("accountId") as string;

		// Handle "all" accounts aggregation
		const accountIds = accountId === "all" ? getAllAccountIds() : [accountId];

		let totalNumbers = 0;
		let totalCalls = 0;
		let totalMessages = 0;

		for (const id of accountIds) {
			const client = getClient(id);

			const [numbers, calls, messages] = await Promise.all([
				client.incomingPhoneNumbers.list({ limit: 100 }),
				client.calls.list({ limit: 100 }),
				client.messages.list({ limit: 100 }),
			]);

			totalNumbers += numbers.length;
			totalCalls += calls.length;
			totalMessages += messages.length;
		}

		return c.json({
			numbers: totalNumbers,
			calls: totalCalls,
			messages: totalMessages,
		});
	} catch (error) {
		console.error("Error fetching stats:", error);
		return c.json({ error: "Failed to fetch stats" }, 500);
	}
});

// Get recent activity (calls + messages combined)
statsRoutes.get("/activity", async (c) => {
	try {
		const accountId = c.get("accountId") as string;
		const accountIds = accountId === "all" ? getAllAccountIds() : [accountId];

		type Activity = {
			type: "call" | "message";
			sid: string;
			from: string;
			to: string;
			status: string;
			date: Date;
			accountId: string;
		};

		const activities: Activity[] = [];

		for (const id of accountIds) {
			const client = getClient(id);

			const [calls, messages] = await Promise.all([
				client.calls.list({ limit: 5 }),
				client.messages.list({ limit: 5 }),
			]);

			for (const call of calls) {
				activities.push({
					type: "call",
					sid: call.sid,
					from: call.from,
					to: call.to,
					status: call.status,
					date: call.dateCreated,
					accountId: id,
				});
			}

			for (const msg of messages) {
				activities.push({
					type: "message",
					sid: msg.sid,
					from: msg.from,
					to: msg.to,
					status: msg.status,
					date: msg.dateSent || msg.dateCreated,
					accountId: id,
				});
			}
		}

		// Sort by date descending, take top 10
		activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

		return c.json(activities.slice(0, 10));
	} catch (error) {
		console.error("Error fetching activity:", error);
		return c.json({ error: "Failed to fetch activity" }, 500);
	}
});
