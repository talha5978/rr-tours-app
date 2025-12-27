import { Link } from "react-router";
import { useRouteError, isRouteErrorResponse } from "react-router";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Badge } from "~/components/ui/badge";

export default function ErrorPage() {
	const error = useRouteError();
	// console.log(error);
	let errorText = "";
	const isProdEnv: boolean = import.meta!.env!.VITE_ENV === "production";

	if (isRouteErrorResponse(error)) {
		if (error.status === 404) {
			errorText = error?.statusText ?? "The requested page could not be found.";
		} else if (error.status === 400) {
			errorText = error?.data || "Something went wrong. Please try again.";
		}
	}

	return (
		<section className="bg-current grid h-screen place-items-center px-6 py-14 sm:py-24 lg:px-8">
			{isRouteErrorResponse(error) ? (
				<div className="text-center">
					<Badge variant="destructive">
						<p className="font-semibold">{error.status || "500"}</p>
					</Badge>
					<h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-5xl text-primary-foreground">
						{error.data || "Something went wrong"}
					</h1>
					<p className="mt-6 text-lg font-medium text-pretty text-muted-foreground sm:text-xl/8">
						{errorText}
					</p>
					e
					<div className="mt-10 flex items-center justify-center gap-x-6">
						<Link to="/">
							<Button>
								<ArrowLeft />
								<span>Go back home</span>
							</Button>
						</Link>
					</div>
				</div>
			) : error instanceof Error ? (
				<div className="text-center">
					<Badge variant="destructive">
						<p className="font-semibold">500</p>
					</Badge>
					<h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-5xl text-primary-foreground">
						{error.name}
					</h1>
					<p className="mt-6 text-lg font-medium text-pretty text-muted-foreground sm:text-xl/8">
						{error.message || "Something went wrong."}
					</p>
					{isProdEnv ? (
						<p className="mt-3 text-sm font-medium text-pretty text-muted-foreground break-all">
							{error?.stack}
						</p>
					) : null}
					<div className="mt-10 flex items-center justify-center gap-x-6">
						<Link to="/">
							<Button>
								<ArrowLeft />
								<span>Go back home</span>
							</Button>
						</Link>
					</div>
				</div>
			) : null}
		</section>
	);
}
