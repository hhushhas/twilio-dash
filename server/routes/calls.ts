import { Hono } from "hono";
import { getAccountSid, getClient, getAllAccountIds } from "../index";

export const callsRoutes = new Hono();

// List calls with filters
callsRoutes.get("/", async (c) => {
	try {
		const accountId = c.get("accountId") as string;
		const accountIds = accountId === "all" ? getAllAccountIds() : [accountId];
		const query = c.req.query();

		const results = await Promise.all(
			accountIds.map(async (id) => {
				const client = getClient(id);
				const filters: Record<string, unknown> = {
					limit: parseInt(query.limit || "50"),
				};

				if (query.status) filters.status = query.status;
				if (query.from) filters.from = query.from;
				if (query.to) filters.to = query.to;
				if (query.startTime) filters.startTimeAfter = new Date(query.startTime);
				if (query.endTime) filters.startTimeBefore = new Date(query.endTime);

				const calls = await client.calls.list(filters);
				return calls.map((call) => ({
					sid: call.sid,
					from: call.from,
					to: call.to,
					status: call.status,
					direction: call.direction,
					duration: call.duration,
					startTime: call.startTime,
					endTime: call.endTime,
					price: call.price,
					priceUnit: call.priceUnit,
					accountId: id,
				}));
			}),
		);

		// Merge and sort by startTime descending
		const merged = results.flat();
		merged.sort(
			(a, b) =>
				new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
		);

		return c.json(merged);
	} catch (error) {
		console.error("Error fetching calls:", error);
		return c.json({ error: "Failed to fetch calls" }, 500);
	}
});

// Get call details with recordings
callsRoutes.get("/:sid", async (c) => {
	try {
		const accountId = c.get("accountId") as string;
		const sid = c.req.param("sid");

		// For "all" accounts, search across all
		const accountIds = accountId === "all" ? getAllAccountIds() : [accountId];

		for (const id of accountIds) {
			try {
				const client = getClient(id);
				const accountSid = getAccountSid(id);
				const [call, recordings] = await Promise.all([
					client.calls(sid).fetch(),
					client.recordings.list({ callSid: sid }),
				]);

				return c.json({
					sid: call.sid,
					from: call.from,
					to: call.to,
					status: call.status,
					direction: call.direction,
					duration: call.duration,
					startTime: call.startTime,
					endTime: call.endTime,
					price: call.price,
					priceUnit: call.priceUnit,
					answeredBy: call.answeredBy,
					callerName: call.callerName,
					accountId: id,
					recordings: recordings.map((r) => ({
						sid: r.sid,
						duration: r.duration,
						dateCreated: r.dateCreated,
						url: `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${r.sid}.mp3`,
					})),
				});
			} catch {
				// Try next account
			}
		}
		return c.json({ error: "Call not found" }, 404);
	} catch (error) {
		console.error("Error fetching call:", error);
		return c.json({ error: "Failed to fetch call" }, 500);
	}
});
