import { ApiError } from "@workspace/shared/utils/ApiError";
import { type ServiceBase } from "@workspace/shared/services/service.base";
import { currentUserQuery } from "@workspace/shared/queries/auth.q";
import { createServiceMiddleware } from "@workspace/shared/middlewares/utils";
import { extractAuthId } from "@workspace/shared/utils/auth-utils.server";
import { UserRole } from "@workspace/shared/types/user";
import { queryClient } from "@workspace/shared/utils/query-client";

export const verifyUser = createServiceMiddleware<ServiceBase>(async (ctx, next) => {
	try {
		const service = ctx.service;
		if (service.currentUser != null && service.currentUser.id) {
			return next();
		}

		const authId = extractAuthId(service.request);

		const { user, error: noUserError } =
			(await queryClient.fetchQuery(
				currentUserQuery({
					request: service.request,
					authId: authId,
				}),
			)) ?? {};
		// console.log("user in verify user middleware", user, noUserError);

		if (user == null && noUserError) {
			throw noUserError ?? new ApiError("User not found", 401, []);
		}

		service.currentUser = {
			id: user?.id ?? "",
			email: user?.email ?? "",
			role: user?.role.role_name as UserRole,
		};

		return next();
	} catch (error) {
		throw error;
	}
});
