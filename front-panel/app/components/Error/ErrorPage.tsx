import { useRouteError, isRouteErrorResponse, Link } from "react-router";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Button } from "~/components/ui/button";

export default function ErrorPage() {
	const error = useRouteError();
	// console.log(error);
	let errorText = "";

	if (isRouteErrorResponse(error)) {
		if (error.status === 404) {
			errorText = error?.statusText ?? "The requested page could not be found.";
		} else if (error.status === 400) {
			errorText = error?.data || "Something went wrong. Please try again.";
		}
	}

	return (
		<>
			<MetaDetails metaTitle="Error" metaDescription={errorText ?? "Error"} />
			<div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
				<div className="flex flex-col items-center justify-center px-4 py-8 text-center">
					<h2 className="mb-6 text-5xl font-semibold">Whoops!</h2>
					<h3 className="mb-1.5 text-3xl font-semibold">Something went wrong</h3>
					<p className="text-muted-foreground mb-6 max-w-sm">
						{errorText ??
							(error as any)?.message ??
							"The page you&apos;re looking for isn&apos;t found, we suggest you back to home."}
					</p>
					<Link to="/" viewTransition>
						<Button asChild className="rounded-lg text-base">
							<a href="#">Back to home page</a>
						</Button>
					</Link>
				</div>
				<div className="relative max-h-screen w-full p-2 max-lg:hidden">
					<div className="h-full w-full rounded-2xl bg-primary" />
					<img
						src="https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/error/image-1.png"
						alt="404 illustration"
						className="absolute top-1/2 left-1/2 h-[clamp(260px,25vw,406px)] -translate-x-1/2 -translate-y-1/2"
					/>
				</div>
			</div>
		</>
	);
}
