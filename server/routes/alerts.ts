import { Hono } from "hono";
import { getClient, getAllAccountIds } from "../index";

export const alertsRoutes = new Hono();

// List alerts/debug logs
alertsRoutes.get("/", async (c) => {
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

				if (query.logLevel) filters.logLevel = query.logLevel;
				if (query.startDate) filters.startDate = new Date(query.startDate);
				if (query.endDate) filters.endDate = new Date(query.endDate);

				const alerts = await client.monitor.v1.alerts.list(filters);
				return alerts.map((alert) => ({
					sid: alert.sid,
					alertText: alert.alertText,
					logLevel: alert.logLevel,
					errorCode: alert.errorCode,
					moreInfo: alert.moreInfo,
					requestMethod: alert.requestMethod,
					requestUrl: alert.requestUrl,
					resourceSid: alert.resourceSid,
					dateCreated: alert.dateCreated,
					dateGenerated: alert.dateGenerated,
					dateUpdated: alert.dateUpdated,
					accountId: id,
				}));
			}),
		);

		// Merge and sort by dateCreated descending
		const merged = results.flat();
		merged.sort(
			(a, b) =>
				new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime(),
		);

		return c.json(merged);
	} catch (error) {
		console.error("Error fetching alerts:", error);
		return c.json({ error: "Failed to fetch alerts" }, 500);
	}
});

// Get single alert details
alertsRoutes.get("/:sid", async (c) => {
	try {
		const accountId = c.get("accountId") as string;
		const sid = c.req.param("sid");

		// For "all" accounts, search across all
		const accountIds = accountId === "all" ? getAllAccountIds() : [accountId];

		for (const id of accountIds) {
			try {
				const client = getClient(id);
				const alert = await client.monitor.v1.alerts(sid).fetch();
				return c.json({
					sid: alert.sid,
					alertText: alert.alertText,
					logLevel: alert.logLevel,
					errorCode: alert.errorCode,
					moreInfo: alert.moreInfo,
					requestMethod: alert.requestMethod,
					requestUrl: alert.requestUrl,
					requestVariables: alert.requestVariables,
					responseBody: alert.responseBody,
					responseHeaders: alert.responseHeaders,
					resourceSid: alert.resourceSid,
					serviceSid: alert.serviceSid,
					dateCreated: alert.dateCreated,
					dateGenerated: alert.dateGenerated,
					dateUpdated: alert.dateUpdated,
					accountId: id,
				});
			} catch {
				// Try next account
			}
		}
		return c.json({ error: "Alert not found" }, 404);
	} catch (error) {
		console.error("Error fetching alert:", error);
		return c.json({ error: "Failed to fetch alert" }, 500);
	}
});
