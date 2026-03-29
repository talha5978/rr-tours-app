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

	const baseName = `sb-${process.env.VITE_PROJECT_ID}-auth-token`;
	const accessTokenBase = `sb-${process.env.VITE_PROJECT_ID}-access-token`;

	// Helper to find and join chunks (e.g. token.0, token.1)
	const getReassembledToken = (name: string) => {
		if (cookies[name]) return cookies[name];
		let fullToken = "";
		let i = 0;
		while (cookies[`${name}.${i}`]) {
			fullToken += cookies[`${name}.${i}`];
			i++;
		}
		return fullToken || null;
	};

	const rawToken = getReassembledToken(accessTokenBase) || getReassembledToken(baseName);

	// 3. Fallback to Authorization Header
	let finalToken = rawToken;
	if (!finalToken) {
		const authHeader = request.headers.get("authorization") ?? "";
		if (authHeader.toLowerCase().startsWith("bearer ")) {
			finalToken = authHeader.slice(7);
		}
	}

	if (finalToken) {
		try {
			const parts = finalToken.split(".");
			if (parts.length === 3) {
				const payloadJson = Buffer.from(
					parts[1].replace(/-/g, "+").replace(/_/g, "/"), // Convert Base64URL to Base64
					"base64",
				).toString("utf-8");
				const payload = JSON.parse(payloadJson);
				const userId = payload.sub ?? payload.user_id;
				if (userId) return `user:${userId}`;
			}
		} catch (e) {
			// If JWT parsing fails but we have a token, hash it as a fallback ID
			return `token:${sha256(finalToken).slice(0, 16)}`;
		}
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

		let anon = cookies["anon_session"];

		if (!anon) {
			anon = uuidv4();
			const maxAge = 60 * 60 * 24 * 30; // 30 days
			headers.append(
				"Set-Cookie",
				`anon_session=${anon}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`,
			);
		}

		authId = `guest:${anon}`;
	}

	return { authId, headers };
}
