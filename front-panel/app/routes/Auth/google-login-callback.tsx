import { type LoaderFunctionArgs, redirect } from "react-router";
import { AuthService } from "@workspace/shared/services/auth.service";
import { Loader2 } from "lucide-react";
import { genAuthSecurity } from "@workspace/shared/utils/auth-utils.server";
import { queryClient } from "@workspace/shared/utils/query-client";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const authSvc = new AuthService(request);
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");

	if (!code) {
		return redirect(`/login?error=${encodeURIComponent("Failed to exchange OAuth code")}`);
	}

	const { error: exchangeError, headers: exchangeHeaders } = await authSvc.exchangeCodeForSession({ code });

	if (exchangeError) {
		console.error("OAuth code exchange error:", exchangeError);
		return redirect(
			`/login?error=${encodeURIComponent(exchangeError.message || "Failed to exchange OAuth code")}`,
			{ headers: exchangeHeaders },
		);
	}

	let { authId } = genAuthSecurity(request);
	await queryClient.invalidateQueries({ queryKey: ["full_current_user", authId] });

	return redirect("/?from=login&success=true", { headers: exchangeHeaders });
};

export default function AuthCallback() {
	return (
		<div className="flex items-center justify-center min-h-screen">
			<Loader2 className="h-8 w-8 animate-spin" />
		</div>
	);
}
