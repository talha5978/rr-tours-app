import { queryOptions } from "@tanstack/react-query";
import { AuthService } from "@workspace/shared/services/auth.service";
import type { GetCurrentUser } from "@workspace/shared/types/auth.d";

type currentUserQueryArgs = {
	request: Request;
	authId: string;
	isAdmin?: boolean;
	headers?: Headers;
};

export const currentUserQuery = ({ request, authId, isAdmin = true, headers }: currentUserQueryArgs) => {
	const customStaleTime = 60 * 1000 * (process.env.VITE_ENV === "production" ? 10 : 25);

	return queryOptions<GetCurrentUser>({
		queryKey: ["current_user", authId],
		queryFn: async () => {
			const authSvc = new AuthService(request, { headers });
			const result = await authSvc.getCurrentUser(isAdmin);
			return result;
		},
		staleTime: customStaleTime,
	});
};
