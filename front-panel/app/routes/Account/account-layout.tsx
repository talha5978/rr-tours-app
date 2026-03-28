import { type LoaderFunctionArgs, Outlet, redirect } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Link } from "react-router";
import { User, Calendar, Star } from "lucide-react";
import { genAuthSecurity } from "@workspace/shared/utils/auth-utils.server";
import { getCurrentUser } from "@workspace/shared/queries/auth.q";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { authId } = genAuthSecurity(request);

	if (authId) {
		const resp = await getCurrentUser(request);
		if (!resp?.user?.id) return redirect("/");
	}

	return null;
};

export default function AccountLayout() {
	return (
		<div className="container py-8">
			<div className="grid gap-8 md:grid-cols-[220px_1fr]">
				{/* Sidebar Navigation */}
				<aside className="flex flex-col gap-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">My Account</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<nav className="flex flex-col">
								<Link
									to="/account/details"
									prefetch="intent"
									viewTransition
									className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent rounded-t-lg"
								>
									<User className="w-4 h-4" />
									Account Details
								</Link>
								<Link
									to="/account/bookings"
									prefetch="intent"
									viewTransition
									className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent"
								>
									<Calendar className="w-4 h-4" />
									My Bookings
								</Link>
								<Link
									to="/account/reviews"
									prefetch="intent"
									viewTransition
									className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent rounded-b-lg"
								>
									<Star className="w-4 h-4" />
									My Reviews
								</Link>
							</nav>
						</CardContent>
					</Card>
				</aside>

				{/* Main Content */}
				<main>
					<Outlet />
				</main>
			</div>
		</div>
	);
}
