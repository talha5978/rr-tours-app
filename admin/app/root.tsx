import { Links, Meta, Outlet, redirect, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import ErrorPage from "~/components/Error/ErrorPage";
import { ThemeProvider } from "~/components/Theme/theme-provder";
import { TopLoadingBar } from "~/components/Loaders/TopLoadingBar";
import { Toaster } from "~/components/ui/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@workspace/shared/utils/query-client";
import { GetCurrentUser } from "@workspace/shared/types/auth";
import { currentUserQuery } from "@workspace/shared/queries/auth.q";
import { getCacheInvalidationEvents } from "@workspace/shared/queries/cache-events.q";
import { CacheInvalidationService } from "@workspace/shared/services/cache-events.service";

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

async function handleCacheInvalidationEvents({ request }: { request: Request }) {
	const cacheEvents = await queryClient.fetchQuery(
		getCacheInvalidationEvents({ request, target: "admin" }),
	);

	if (cacheEvents.length > 0) {
		const uniqueSerializedKeys = new Set<string>();
		const eventIdsToMark: string[] = [];

		for (const event of cacheEvents) {
			eventIdsToMark.push(event.id);

			for (const serializedKey of event.keys) {
				uniqueSerializedKeys.add(serializedKey);
			}
		}

		for (const serializedKey of uniqueSerializedKeys) {
			if (serializedKey.includes("||")) {
				const parts = serializedKey.split("||");
				queryClient.invalidateQueries({
					queryKey: parts,
					exact: false,
				});
			} else {
				queryClient.invalidateQueries({
					queryKey: [serializedKey],
				});
			}
		}

		if (eventIdsToMark.length > 0) {
			const cacheSvc = new CacheInvalidationService(request);
			await cacheSvc.markEventsAsProcessed(eventIdsToMark);
		}
	}
}

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

			const resp: GetCurrentUser = await queryClient.fetchQuery(currentUserQuery({ request, authId }));
			if (resp?.user) return redirect("/");
		}

		return { user: null, error: null, headers };
	}

	const { genAuthSecurity } = await import("@workspace/shared/utils/auth-utils.server");
	const { authId, headers } = genAuthSecurity(request);
	console.log("Auth id in root: ", authId);

	const resp: GetCurrentUser = await queryClient.fetchQuery(currentUserQuery({ request, authId }));

	const user = resp?.user ?? null;
	const error = resp?.error ?? null;

	if (!user || error) {
		console.warn("❌ No admin, redirecting to /login");
		return redirect("/login", { headers });
	}

	console.log("✅ Admin found:", user?.email);
	handleCacheInvalidationEvents({ request });

	return { user, error, headers };
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
				<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
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
