import { Links, Meta, Outlet, redirect, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import ErrorPage from "~/components/Error/ErrorPage";
import { TopLoadingBar } from "~/components/Loaders/TopLoadingBar";
import { Toaster } from "~/components/ui/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@workspace/shared/utils/query-client";
import { getCacheInvalidationEvents } from "@workspace/shared/queries/cache-events.q";
import { CacheInvalidationService } from "@workspace/shared/services/cache-events.service";
import { GetFullCurrentUser } from "@workspace/shared/types/auth";
import { currentFullUserQuery } from "~/queries/auth.q";

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
	const cacheEvents = await queryClient.fetchQuery(
		getCacheInvalidationEvents({ request, target: "front" }),
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
				// e.g., "fp_tour_details||459"
				const parts = serializedKey.split("||");
				queryClient.invalidateQueries({
					queryKey: parts, // ["fp_tour_details", "123"]
					exact: false,
				});
			} else {
				// simple key like "fp_tours"
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

	const url = new URL(request.url);
	const pathname = url.pathname;

	const { genAuthSecurity } = await import("@workspace/shared/utils/auth-utils.server");

	if (pathname.startsWith("/login")) {
		const { authId } = genAuthSecurity(request);

		if (authId) {
			const resp: GetFullCurrentUser = await queryClient.fetchQuery(
				currentFullUserQuery({ request, authId }),
			);
			if (resp?.user) return redirect("/");
		}

		return {
			headers: null,
			user: null,
			current_user_error: null,
		};
	}

	const { headers, authId } = genAuthSecurity(request);

	const resp: GetFullCurrentUser = await queryClient.fetchQuery(
		currentFullUserQuery({ request, authId, headers }),
	);

	const user = resp?.user ?? null;
	const current_user_error = resp?.error ?? null;

	if (!user || current_user_error) {
		console.warn("❌ No user found");
	}

	user && console.log(user?.email, " logged in");

	return {
		headers,
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
				<link rel="icon" href="/favicon-32x.png" type="image/png" />
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

// Add authentication dialog (signup/login through email + google)
// If logged in -> faster checkout (auto filled booking form)
// Otherwise guest
// show past bookings, reviews in the account section
// Show reviews in the tour details page + in the home page + in the admin panel + in the structured data of the tour details page
