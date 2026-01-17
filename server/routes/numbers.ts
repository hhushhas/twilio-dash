import { Hono } from "hono";
import { getClient, getAllAccountIds } from "../index";

export const numbersRoutes = new Hono();

// List all phone numbers
numbersRoutes.get("/", async (c) => {
	try {
		const accountId = c.get("accountId") as string;
		const accountIds = accountId === "all" ? getAllAccountIds() : [accountId];

		const results = await Promise.all(
			accountIds.map(async (id) => {
				const client = getClient(id);
				const numbers = await client.incomingPhoneNumbers.list({ limit: 100 });
				return numbers.map((n) => ({
					sid: n.sid,
					phoneNumber: n.phoneNumber,
					friendlyName: n.friendlyName,
					voiceUrl: n.voiceUrl,
					voiceMethod: n.voiceMethod,
					smsUrl: n.smsUrl,
					smsMethod: n.smsMethod,
					statusCallback: n.statusCallback,
					statusCallbackMethod: n.statusCallbackMethod,
					capabilities: n.capabilities,
					dateCreated: n.dateCreated,
					accountId: id,
				}));
			}),
		);

		return c.json(results.flat());
	} catch (error) {
		console.error("Error fetching numbers:", error);
		return c.json({ error: "Failed to fetch numbers" }, 500);
	}
});

// Get single number
numbersRoutes.get("/:sid", async (c) => {
	try {
		const accountId = c.get("accountId") as string;
		const sid = c.req.param("sid");

		// For "all" accounts, search across all
		const accountIds = accountId === "all" ? getAllAccountIds() : [accountId];

		for (const id of accountIds) {
			try {
				const client = getClient(id);
				const number = await client.incomingPhoneNumbers(sid).fetch();
				return c.json({
					sid: number.sid,
					phoneNumber: number.phoneNumber,
					friendlyName: number.friendlyName,
					voiceUrl: number.voiceUrl,
					voiceMethod: number.voiceMethod,
					smsUrl: number.smsUrl,
					smsMethod: number.smsMethod,
					statusCallback: number.statusCallback,
					statusCallbackMethod: number.statusCallbackMethod,
					capabilities: number.capabilities,
					dateCreated: number.dateCreated,
					accountId: id,
				});
			} catch {
				// Try next account
			}
		}
		return c.json({ error: "Number not found" }, 404);
	} catch (error) {
		console.error("Error fetching number:", error);
		return c.json({ error: "Failed to fetch number" }, 500);
	}
});

// Delete a phone number
numbersRoutes.delete("/:sid", async (c) => {
	try {
		const accountId = c.get("accountId") as string;
		const sid = c.req.param("sid");

		// For "all" accounts, search to find the right one
		const accountIds = accountId === "all" ? getAllAccountIds() : [accountId];

		for (const id of accountIds) {
			try {
				const client = getClient(id);
				await client.incomingPhoneNumbers(sid).remove();
				return c.json({ success: true });
			} catch {
				// Try next account
			}
		}
		return c.json({ error: "Number not found" }, 404);
	} catch (error) {
		console.error("Error deleting number:", error);
		return c.json({ error: "Failed to delete number" }, 500);
	}
});

// Update webhook URLs
numbersRoutes.patch("/:sid", async (c) => {
	try {
		const accountId = c.get("accountId") as string;
		const sid = c.req.param("sid");
		const body = await c.req.json();

		const updateData: Record<string, string> = {};
		if (body.voiceUrl !== undefined) updateData.voiceUrl = body.voiceUrl;
		if (body.voiceMethod !== undefined)
			updateData.voiceMethod = body.voiceMethod;
		if (body.smsUrl !== undefined) updateData.smsUrl = body.smsUrl;
		if (body.smsMethod !== undefined) updateData.smsMethod = body.smsMethod;
		if (body.statusCallback !== undefined)
			updateData.statusCallback = body.statusCallback;
		if (body.statusCallbackMethod !== undefined)
			updateData.statusCallbackMethod = body.statusCallbackMethod;
		if (body.friendlyName !== undefined)
			updateData.friendlyName = body.friendlyName;

		// For "all" accounts, search to find the right one
		const accountIds = accountId === "all" ? getAllAccountIds() : [accountId];

		for (const id of accountIds) {
			try {
				const client = getClient(id);
				const updated = await client
					.incomingPhoneNumbers(sid)
					.update(updateData);
				return c.json({
					sid: updated.sid,
					phoneNumber: updated.phoneNumber,
					friendlyName: updated.friendlyName,
					voiceUrl: updated.voiceUrl,
					smsUrl: updated.smsUrl,
					statusCallback: updated.statusCallback,
				});
			} catch {
				// Try next account
			}
		}
		return c.json({ error: "Number not found" }, 404);
	} catch (error) {
		console.error("Error updating number:", error);
		return c.json({ error: "Failed to update number" }, 500);
	}
});
