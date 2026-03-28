import { type ServiceBase } from "@workspace/shared/services/service.base";
import { createServiceMiddleware } from "@workspace/shared/middlewares/utils";
// import { ApiError } from "@workspace/shared/utils/ApiError";
// import { getCurrentUser } from "@workspace/shared/queries/auth.q";
// import { UserRole } from "@workspace/shared/types/user";

export const verifyUser = createServiceMiddleware<ServiceBase>(async (_, next) => {
	// try {
	// 	const service = ctx.service;
	// 	if (service.currentUser != null && service.currentUser.id) {
	// 		return next();
	// 	}

	// 	const { user, error: noUserError } =
	// 		(await getCurrentUser(service.request)) ?? {};
	// 	// console.log("user in verify user middleware", user, noUserError);

	// 	if (user == null && noUserError) {
	// 		throw noUserError ?? new ApiError("User not found", 401, []);
	// 	}

	// 	service.currentUser = {
	// 		id: user?.id ?? "",
	// 		email: user?.email ?? "",
	// 		role: user?.role.role_name as UserRole,
	// 	};

	// 	return next();
	// } catch (error) {
	// 	throw error;
	// }
	return next();
});
