import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { AuthService } from "@workspace/shared/services/auth.service";
import { currentUserQuery } from "@workspace/shared/queries/auth.q";
import type { GetCurrentUser } from "@workspace/shared/types/auth";
import { extractAuthId } from "@workspace/shared/utils/auth-utils.server";
import { queryClient } from "@workspace/shared/utils/query-client";

export async function action({ request }: ActionFunctionArgs) {
	if (request.method.toUpperCase() !== "POST") {
		return new Response("Method Not Allowed", { status: 405 });
	}

	const authId = extractAuthId(request);
	let resp: GetCurrentUser | null = null;
	// console.log("AUth id before check in logout", authId);

	if (authId) {
		resp = await queryClient.fetchQuery(currentUserQuery({ request, authId }));
		if (!resp?.user?.id) return redirect("/login");
	}

	const authService = new AuthService(request);
	const { error, headers } = await authService.logout();

	if (error) {
		throw new Response(error.message || "Failed to logout", { status: 400, headers });
	}
	// console.log("Auth id while logging out: ", authId);

	await queryClient.invalidateQueries({ queryKey: ["current_user", authId] });

	return redirect("/login", { headers });
}

export default function LogoutRoute() {
	return null;
}
