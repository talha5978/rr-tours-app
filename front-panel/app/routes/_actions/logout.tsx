import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { AuthService } from "@workspace/shared/services/auth.service";
import type { GetFullCurrentUser } from "@workspace/shared/types/auth";
import { extractAuthId, genAuthSecurity } from "@workspace/shared/utils/auth-utils.server";
import { currentFullUserQuery } from "~/queries/auth.q";
import { queryClient } from "@workspace/shared/utils/query-client";
import { ApiError } from "@workspace/shared/utils/ApiError";

export async function action({ request }: ActionFunctionArgs) {
	const authId = extractAuthId(request);
	console.log("Extracted authId in /logout:", authId);

	let resp: GetFullCurrentUser | null = null;
	if (authId) {
		resp = await queryClient.fetchQuery(currentFullUserQuery({ request, authId }));
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

	await queryClient.invalidateQueries({ queryKey: ["full_current_user", authId] });

	return redirect("/", { headers });
}

export default function LogoutRoute() {
	return null;
}
