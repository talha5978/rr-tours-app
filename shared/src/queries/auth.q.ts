import { queryOptions } from "@tanstack/react-query";
import { AuthService } from "@workspace/shared/services/auth.service";
import type { GetCurrentUser } from "@workspace/shared/types/auth.d";

type currentUserQueryArgs = {
	request: Request;
	authId: string | null;
};

export const currentUserQuery = ({ request, authId }: currentUserQueryArgs) => {
	const customStaleTime = 60 * 1000 * (process.env.VITE_ENV === "production" ? 10 : 25);

	return queryOptions<GetCurrentUser>({
		queryKey: ["current_user", authId ?? "NONE"],
		queryFn: async () => {
			// console.log("Fetching current user with auth id", authId);

			const authSvc = new AuthService(request);
			// await authSvc.getSession();
			const result = await authSvc.getCurrentUser();
			return result;
		},
		staleTime: customStaleTime,
	});
};
