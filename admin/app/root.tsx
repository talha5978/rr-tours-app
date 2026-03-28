import { Links, Meta, Outlet, redirect, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import ErrorPage from "~/components/Error/ErrorPage";
import { ThemeProvider } from "~/components/Theme/theme-provder";
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
	// console.log("⚡ Root loader ran for", pathname);

	if (pathname.startsWith("/login")) {
		// console.log("➡️ Public route, skipping user fetch");
		const { genAuthSecurity } = await import("@workspace/shared/utils/auth-utils.server");
		const { authId, headers } = genAuthSecurity(request);

		if (authId) {
			// console.log("authId in the root in first check::: " , authId);

			const resp = await getCurrentUser(request, "AD");
			if (resp?.user) return redirect("/");
		}

		return { user: null, error: null, headers };
	}

	const resp = await getCurrentUser(request, "AD");

	const user = resp?.user ?? null;
	const error = resp?.error ?? null;

	if (!user || error) {
		console.warn("❌ No admin, redirecting to /login");
		return redirect("/login", { headers: resp.headers });
	}

	console.log("✅ Admin found:", user?.email);

	return { user, error, headers: resp.headers };
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
		<ThemeProvider>
			<TopLoadingBar />
			<Outlet />
			<Toaster />
		</ThemeProvider>
	);
}

export function ErrorBoundary() {
	return <ErrorPage />;
}
