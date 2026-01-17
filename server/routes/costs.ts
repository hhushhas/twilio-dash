import { Hono } from "hono";
import { getAllAccountIds, getAllAccounts, getClient } from "../index";

export const costsRoutes = new Hono();

// GET /api/costs?period=7d|30d|90d|all
costsRoutes.get("/", async (c) => {
	try {
		const accountId = c.get("accountId") as string;
		const accountIds = accountId === "all" ? getAllAccountIds() : [accountId];
		const accountsInfo = getAllAccounts();
		const period = c.req.query("period") || "30d";

		// Calculate date range
		const endDate = new Date();
		let startDate: Date | null = null;

		if (period !== "all") {
			const days = parseInt(period.replace("d", ""));
			startDate = new Date();
			startDate.setDate(startDate.getDate() - days);
		}

		const byAccount: Array<{
			accountId: string;
			name: string;
			callsCost: number;
			messagesCost: number;
			totalCost: number;
		}> = [];

		let totalCallsCost = 0;
		let totalMessagesCost = 0;

		for (const id of accountIds) {
			const client = getClient(id);
			const info = accountsInfo.find((a) => a.id === id);

			// Build filters
			const callFilters: Record<string, unknown> = { limit: 500 };
			const msgFilters: Record<string, unknown> = { limit: 500 };

			if (startDate) {
				callFilters.startTimeAfter = startDate;
				callFilters.startTimeBefore = endDate;
				msgFilters.dateSentAfter = startDate;
				msgFilters.dateSentBefore = endDate;
			}

			const [calls, messages] = await Promise.all([
				client.calls.list(callFilters),
				client.messages.list(msgFilters),
			]);

			// Sum costs (prices are negative strings like "-0.0150")
			let accountCallsCost = 0;
			for (const call of calls) {
				accountCallsCost += Math.abs(parseFloat(call.price || "0"));
			}

			let accountMessagesCost = 0;
			for (const msg of messages) {
				accountMessagesCost += Math.abs(parseFloat(msg.price || "0"));
			}

			byAccount.push({
				accountId: id,
				name: info?.name || id,
				callsCost: accountCallsCost,
				messagesCost: accountMessagesCost,
				totalCost: accountCallsCost + accountMessagesCost,
			});

			totalCallsCost += accountCallsCost;
			totalMessagesCost += accountMessagesCost;
		}

		return c.json({
			period,
			totalCost: totalCallsCost + totalMessagesCost,
			breakdown: {
				calls: totalCallsCost,
				messages: totalMessagesCost,
			},
			byAccount,
		});
	} catch (error) {
		console.error("Error fetching costs:", error);
		return c.json({ error: "Failed to fetch costs" }, 500);
	}
});
