import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { AuthService } from "@workspace/shared/services/auth.service";
import type { GetFullCurrentUser } from "@workspace/shared/types/auth";
import { genAuthSecurity } from "@workspace/shared/utils/auth-utils.server";
import { getCurrentUser } from "@workspace/shared/queries/auth.q";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";
import { cacheService } from "@workspace/shared/services/cache.service";

export async function action({ request }: ActionFunctionArgs) {
	const { authId } = genAuthSecurity(request);
	// console.log("Extracted authId in /logout:", authId);

	let resp: GetFullCurrentUser | null = null;
	if (authId) {
		resp = (await getCurrentUser(request)) as GetFullCurrentUser | null;
		if (!resp?.user?.id) {
			console.error("User not found in /logout for authId:", authId);
			return redirect("/?error=" + encodeURIComponent("User not found"));
		}
	} else {
		console.error("No authId found in /logout");
		return redirect("/?error=" + encodeURIComponent("No user ID found"));
	}

	const authService = new AuthService(request);
	const { error, headers } = await authService.logout();

	if (error) {
		return { error: new ApiError(error.message || "Failed to logout", 404, [headers]) };
	}

	await cacheService.invalidate(CACHE_KEYS.auth.session("FP", authId));

	return redirect("/", { headers });
}

export default function ROUTECOMPONENT() {
	return null;
}
