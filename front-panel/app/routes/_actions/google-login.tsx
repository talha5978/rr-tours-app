import { AuthService } from "@workspace/shared/services/auth.service";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { type ActionFunctionArgs, redirect } from "react-router";

export const action = async ({ request }: ActionFunctionArgs) => {
	try {
		const formData = await request.formData();
		const req_url = new URL(request.url);
		const intent = req_url.searchParams.get("intent");

		let redirectToOrigin = formData.get("redirectToOrigin") as string | null;

		if (!redirectToOrigin) {
			return redirect(`/login?error=${encodeURIComponent("No redirect origin")}`);
		}

		redirectToOrigin += `/auth/callback?intent=${intent}`;

		const authSvc = new AuthService(request);
		const { error, headers, url } = await authSvc.loginWithGoogle({ redirectToOrigin });

		if (error || !url) {
			return redirect(
				`/login?error=${encodeURIComponent(error?.message || "Failed to perform Google login")}`,
			);
		}

		return redirect(url, { headers });
	} catch (error: any) {
		console.error("Error in /login/google action:", error);
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to initiate Google login";
		return redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
	}
};

export default function GoogleLogin() {
	return null;
}
