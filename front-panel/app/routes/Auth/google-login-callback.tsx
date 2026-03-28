import { type LoaderFunctionArgs, redirect } from "react-router";
import { AuthService } from "@workspace/shared/services/auth.service";
import { Loader2 } from "lucide-react";
import { genAuthSecurity } from "@workspace/shared/utils/auth-utils.server";
import { emailService } from "@workspace/shared/services/emails.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";
import { cacheService } from "@workspace/shared/services/cache.service";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	let authSvc = new AuthService(request, {
		headers: request.headers,
	});

	const requestUrl = new URL(request.url);

	const code = requestUrl.searchParams.get("code");
	const intent = requestUrl.searchParams.get("intent");
	console.log("INTENT IN GOOGLE LOGIN CALLBACK: ", intent);

	if (!code) {
		return redirect(`/login?error=${encodeURIComponent("Failed to exchange OAuth code")}`);
	}

	const {
		error: exchangeError,
		headers: exchangeHeaders,
		data,
	} = await authSvc.exchangeCodeForSession({ code });
	let sessionData = data?.session;
	if (exchangeError) {
		console.error("OAuth code exchange error:", exchangeError);
		return redirect(
			`/login?error=${encodeURIComponent(exchangeError.message || "Failed to exchange OAuth code")}`,
			{ headers: exchangeHeaders },
		);
	}

	// let sessionData = await authSvc.getSession();
	console.log(sessionData == null ? "NO SESSION FOUND!!!" : "Session found");

	if (sessionData && intent === "signup") {
		const authUser = await authSvc.getAuthSchemaUser(sessionData.user.id);
		// console.log("authUser: ", authUser);

		if (authUser.data != null) {
			const user_profile = await authSvc.getUserById(sessionData.user.id);
			if (user_profile.user == null || user_profile.error != null) {
				const fullName = sessionData.user.user_metadata.full_name?.split(" ") ?? "";
				const firstName = fullName[0];
				const lastName = fullName[1];

				const resp = await authSvc.insertConsumerUser({
					user_id: sessionData.user.id,
					firstName,
					lastName,
					phone: sessionData.user.phone ?? null,
				});

				if (!resp?.success || resp.error) {
					await authSvc.deleteAuthUser(sessionData.user.id);
				} else {
					return redirect("/" + decodeURIComponent("?error=Could not create user"), {
						headers: exchangeHeaders,
					});
				}

				if (authUser.data.user?.email)
					await emailService.sendWelcomeEmail(fullName, authUser.data.user?.email);
			}
		}
	}

	let { authId } = genAuthSecurity(request);
	// console.log("Auth id being invalidated: ", authId);

	await cacheService.invalidate(CACHE_KEYS.auth.session("FP", authId));

	return redirect("/" + decodeURIComponent("?success=Logged in successfully"), {
		headers: exchangeHeaders,
	});
};

export default function AuthCallback() {
	return (
		<div className="flex items-center justify-center min-h-screen">
			<Loader2 className="h-8 w-8 animate-spin" />
		</div>
	);
}
