import { Hono } from "hono";
import { getAccountSid, getClient, getAllAccountIds } from "../index";

export const messagesRoutes = new Hono();

// List messages with filters
messagesRoutes.get("/", async (c) => {
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

				if (query.from) filters.from = query.from;
				if (query.to) filters.to = query.to;
				if (query.dateSent) filters.dateSentAfter = new Date(query.dateSent);
				if (query.dateEnd) filters.dateSentBefore = new Date(query.dateEnd);

				const messages = await client.messages.list(filters);
				return messages.map((msg) => ({
					sid: msg.sid,
					from: msg.from,
					to: msg.to,
					body: msg.body,
					status: msg.status,
					direction: msg.direction,
					dateSent: msg.dateSent,
					dateCreated: msg.dateCreated,
					price: msg.price,
					priceUnit: msg.priceUnit,
					numMedia: msg.numMedia,
					numSegments: msg.numSegments,
					errorCode: msg.errorCode,
					errorMessage: msg.errorMessage,
					accountId: id,
				}));
			}),
		);

		// Merge and sort by dateSent descending
		const merged = results.flat();
		merged.sort(
			(a, b) =>
				new Date(b.dateSent || b.dateCreated).getTime() -
				new Date(a.dateSent || a.dateCreated).getTime(),
		);

		return c.json(merged);
	} catch (error) {
		console.error("Error fetching messages:", error);
		return c.json({ error: "Failed to fetch messages" }, 500);
	}
});

// Get message details with media
messagesRoutes.get("/:sid", async (c) => {
	try {
		const accountId = c.get("accountId") as string;
		const sid = c.req.param("sid");

		// For "all" accounts, search across all
		const accountIds = accountId === "all" ? getAllAccountIds() : [accountId];

		for (const id of accountIds) {
			try {
				const client = getClient(id);
				const accountSid = getAccountSid(id);
				const [message, media] = await Promise.all([
					client.messages(sid).fetch(),
					client.messages(sid).media.list(),
				]);

				return c.json({
					sid: message.sid,
					from: message.from,
					to: message.to,
					body: message.body,
					status: message.status,
					direction: message.direction,
					dateSent: message.dateSent,
					dateCreated: message.dateCreated,
					price: message.price,
					priceUnit: message.priceUnit,
					numMedia: message.numMedia,
					numSegments: message.numSegments,
					errorCode: message.errorCode,
					errorMessage: message.errorMessage,
					accountId: id,
					media: media.map((m) => ({
						sid: m.sid,
						contentType: m.contentType,
						url: `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${sid}/Media/${m.sid}`,
					})),
				});
			} catch {
				// Try next account
			}
		}
		return c.json({ error: "Message not found" }, 404);
	} catch (error) {
		console.error("Error fetching message:", error);
		return c.json({ error: "Failed to fetch message" }, 500);
	}
});
