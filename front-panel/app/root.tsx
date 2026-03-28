import { Links, Meta, Outlet, redirect, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import ErrorPage from "~/components/Error/ErrorPage";
import { TopLoadingBar } from "~/components/Loaders/TopLoadingBar";
import { Toaster } from "~/components/ui/sonner";
import { getCurrentUser } from "@workspace/shared/queries/auth.q";

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap",
	},
];

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url);
	const pathname = url.pathname;

	const { genAuthSecurity } = await import("@workspace/shared/utils/auth-utils.server");

	if (pathname.startsWith("/login")) {
		const { authId } = genAuthSecurity(request);

		if (authId) {
			const resp = await getCurrentUser(request);
			if (resp?.user) return redirect("/");
		}

		return {
			headers: null,
			user: null,
			current_user_error: null,
		};
	}

	const resp = await getCurrentUser(request);
	console.log(resp);

	const user = resp?.user ?? null;
	const current_user_error = resp?.error ?? null;

	if (!user || current_user_error) {
		console.warn("❌ No user found");
	}

	user && console.log(user?.email, " logged in");

	return {
		headers: resp.headers,
		user: user,
		current_user_error,
	};
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning={true}>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon-48x.png" type="image/png" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return (
		<>
			<TopLoadingBar />
			<Outlet />
			<Toaster />
		</>
	);
}

export function ErrorBoundary() {
	return <ErrorPage />;
}
