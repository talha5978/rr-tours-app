import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { AuthService } from "@workspace/shared/services/auth.service";
import { getCurrentUser } from "@workspace/shared/queries/auth.q";
import type { GetCurrentUser } from "@workspace/shared/types/auth";
import { genAuthSecurity } from "@workspace/shared/utils/auth-utils.server";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";
import { cacheService } from "@workspace/shared/services/cache.service";

export async function action({ request }: ActionFunctionArgs) {
	if (request.method.toUpperCase() !== "POST") {
		return new Response("Method Not Allowed", { status: 405 });
	}

	const { authId } = genAuthSecurity(request);
	let resp: GetCurrentUser | null = null;
	// console.log("AUth id before check in logout", authId);

	if (authId) {
		resp = await getCurrentUser(request, "AD");
		if (!resp?.user?.id) return redirect("/login");
	}

	const authService = new AuthService(request);
	const { error, headers } = await authService.logout();

	if (error) {
		throw new Response(error.message || "Failed to logout", { status: 400, headers });
	}
	console.log("Auth id while logging out: ", authId);

	if (authId) {
		await cacheService.invalidate(CACHE_KEYS.auth.session("AD", authId));
	}

	return redirect("/login", { headers });
}

export default function LogoutRoute() {
	return null;
}
