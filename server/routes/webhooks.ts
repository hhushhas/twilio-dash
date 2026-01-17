import { Hono } from "hono";
import { getAllAccountIds, getClient } from "../index";

export const webhooksRoutes = new Hono();

// POST /api/webhooks/test - test webhook health
webhooksRoutes.post("/test", async (c) => {
	try {
		const accountId = c.get("accountId") as string;
		const body = await c.req.json();
		const { url, type } = body as { url: string; type: "voice" | "sms" };

		if (!url || !type) {
			return c.json({ error: "Missing url or type" }, 400);
		}

		// SSRF protection: validate URL is a configured webhook
		const accountIds = accountId === "all" ? getAllAccountIds() : [accountId];
		let isValidWebhook = false;

		for (const id of accountIds) {
			const client = getClient(id);
			const numbers = await client.incomingPhoneNumbers.list({ limit: 500 });
			for (const num of numbers) {
				if (
					num.voiceUrl === url ||
					num.smsUrl === url ||
					num.statusCallback === url
				) {
					isValidWebhook = true;
					break;
				}
			}
			if (isValidWebhook) break;
		}

		if (!isValidWebhook) {
			return c.json(
				{ error: "URL must match a configured webhook" },
				403
			);
		}

		// Build Twilio-like test payload
		const testPayload = new URLSearchParams({
			AccountSid: "ACTEST000000000000000000000000000",
			ApiVersion: "2010-04-01",
			...(type === "voice"
				? {
						CallSid: "CAtest" + Math.random().toString(36).substring(2, 15),
						CallStatus: "ringing",
						Called: "+15559876543",
						Caller: "+15551234567",
						Direction: "inbound",
						From: "+15551234567",
						To: "+15559876543",
					}
				: {
						MessageSid: "SMtest" + Math.random().toString(36).substring(2, 15),
						SmsStatus: "received",
						Body: "Test message from Twilio Dashboard",
						From: "+15551234567",
						To: "+15559876543",
						NumMedia: "0",
					}),
		});

		const startTime = Date.now();

		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 5000);

			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					"User-Agent": "TwilioProxy/1.1",
					"X-Twilio-Signature": "test-signature",
				},
				body: testPayload.toString(),
				signal: controller.signal,
			});

			clearTimeout(timeout);
			const responseTime = Date.now() - startTime;

			if (response.ok) {
				return c.json({
					status: "healthy",
					httpStatus: response.status,
					responseTime,
				});
			}

			return c.json({
				status: "unhealthy",
				httpStatus: response.status,
				responseTime,
				error: `HTTP ${response.status}`,
			});
		} catch (fetchError) {
			const responseTime = Date.now() - startTime;
			const errorMessage =
				fetchError instanceof Error ? fetchError.message : "Unknown error";

			return c.json({
				status: "unreachable",
				httpStatus: null,
				responseTime,
				error:
					errorMessage.includes("abort") || errorMessage.includes("timeout")
						? "Connection timeout"
						: errorMessage,
			});
		}
	} catch (error) {
		console.error("Error testing webhook:", error);
		return c.json({ error: "Failed to test webhook" }, 500);
	}
});
