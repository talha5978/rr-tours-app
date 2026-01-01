import { v4 as uuidv4 } from "uuid";
import { sha256 } from "js-sha256";

export function parseCookies(cookieHeader = "") {
	return Object.fromEntries(
		cookieHeader
			.split(";")
			.map((s) => {
				const [k, ...v] = s.trim().split("=");
				return [k, decodeURIComponent((v || []).join("="))];
			})
			.filter(Boolean),
	);
}

/**
 * Returns a stable auth identifier for the request, or null if none found.
 */
export function extractAuthId(request: Request): string | null {
	const cookieHeader = request.headers.get("Cookie") ?? "";
	const cookies = parseCookies(cookieHeader);

	if (cookies.session) return `session:${cookies.session}`;

	const candidates = [
		"sb-access-token",
		"sb-refresh-token",
		"access_token",
		"refresh_token",
		`sb-${process.env.VITE_PROJECT_ID}-auth-token`,
		`sb-${process.env.VITE_PROJECT_ID}-access-token`,
		`sb-${process.env.VITE_PROJECT_ID}-refresh-token`,
	];

	let rawToken = null;
	for (const name of candidates) {
		if (cookies[name]) {
			rawToken = cookies[name];
			break;
		}
	}

	if (!rawToken) {
		const authHeader = request.headers.get("authorization") ?? "";
		if (authHeader.toLowerCase().startsWith("bearer ")) {
			rawToken = authHeader.slice(7);
		}
	}

	if (rawToken) {
		const parts = rawToken.split(".");
		if (parts.length === 3) {
			try {
				const payloadJson = Buffer.from(
					parts[1].replace(/-/g, "+").replace(/_/g, "/"),
					"base64",
				).toString("utf8");
				const payload = JSON.parse(payloadJson);
				const userId = payload.sub ?? payload.user_id ?? payload.uid ?? null;
				if (userId) return `user:${userId}`;
			} catch (e) {}
		}

		const tokenHash = sha256(rawToken);
		return `token:${tokenHash}`;
	}

	return null;
}

export function genAuthSecurity(request: Request): {
	authId: string;
	headers: Headers;
} {
	let authId = extractAuthId(request);

	const headers = new Headers();

	if (!authId) {
		const cookieHeader = request.headers.get("Cookie") ?? "";
		const cookies = parseCookies(cookieHeader);
		// console.log(cookies);

		let anon = cookies["anon_session"];
		// let anon = cookies[`sb-${process.env.VITE_PROJECT_ID}-auth-token.1`];

		if (!anon) {
			anon = uuidv4();
			const maxAge = 60 * 60 * 24 * 30; // 30 days
			headers.append(
				"Set-Cookie",
				`anon_session=${anon}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`,
			);
			// console.log("Settin anon_session cookie for guest:", anon);
		}

		authId = `guest:${anon}`;
	}

	return { authId, headers };
}
