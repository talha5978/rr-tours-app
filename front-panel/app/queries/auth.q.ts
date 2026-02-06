import { queryOptions } from "@tanstack/react-query";
import { AuthService } from "@workspace/shared/services/auth.service";
import type { GetFullCurrentUser } from "@workspace/shared/types/auth.d";

type currentUserQueryArgs = {
	request: Request;
	headers?: Headers;
	authId: string | null;
};

export const currentFullUserQuery = ({ request, authId, headers }: currentUserQueryArgs) => {
	const customStaleTime = 60 * 1000 * (process.env.VITE_ENV === "production" ? 10 : 25);
	// console.log("authId: ", authId);

	// console.log(
	// 	"Cookies available in getFullCurrentUser:",
	// 	request?.headers.get("Cookie")?.includes("sb-") ? "YES" : "NO",
	// );

	return queryOptions<GetFullCurrentUser>({
		queryKey: ["full_current_user", authId],
		queryFn: async () => {
			const authSvc = new AuthService(request, {
				headers: headers,
			});
			const result = await authSvc.getFullCurrentUser();
			return result;
		},
		staleTime: customStaleTime,
	});
};
