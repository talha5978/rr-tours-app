import { AuthService } from "@workspace/shared/services/auth.service";
import { cacheService } from "@workspace/shared/services/cache.service";
import type { AdminUser, FullCurrentUser } from "@workspace/shared/types/user";
import { genAuthSecurity } from "@workspace/shared/utils/auth-utils.server";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const getCurrentUser = async (request: Request, app: "AD" | "FP" = "FP") => {
	const { authId, headers: securityHeaders } = genAuthSecurity(request);

	const userSession = await cacheService.get(CACHE_KEYS.auth.session(app, authId), async () => {
		const authSvc = new AuthService(request, { headers: securityHeaders });
		if (app === "FP") {
			return await authSvc.getFullCurrentUser();
		} else {
			return await authSvc.getCurrentUser();
		}
	});

	return {
		user: (userSession?.user as FullCurrentUser | AdminUser) ?? null,
		error: userSession?.error ?? null,
		authId,
		headers: securityHeaders,
	};
};
