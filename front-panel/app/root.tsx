import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import ErrorPage from "~/components/Error/ErrorPage";
import { TopLoadingBar } from "~/components/Loaders/TopLoadingBar";
import { Toaster } from "~/components/ui/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@workspace/shared/utils/query-client";
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

export async function loader({ request }: Route.LoaderArgs) {
	console.log("🌸 ROOT LOADER RUNNING!");
	const cacheEvents = await queryClient.fetchQuery(
		getCacheInvalidationEvents({ request, target: "front" }),
	);

	if (cacheEvents.length > 0) {
		const eventIdsToMark: string[] = [];

		for (const event of cacheEvents) {
			eventIdsToMark.push(event.id);

			for (const serializedKey of event.keys) {
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
		}

		if (eventIdsToMark.length > 0) {
			const cacheSvc = new CacheInvalidationService(request);
			cacheSvc.markEventsAsProcessed(eventIdsToMark);
		}
	}

	return null;
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning={true}>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
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
