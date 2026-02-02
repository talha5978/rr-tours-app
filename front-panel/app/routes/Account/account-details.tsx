// routes/account.details.tsx
import { useRouteLoaderData } from "react-router";
import { loader as rootLoader } from "~/root"; // adjust path if needed
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { MetaDetails } from "~/components/SEO/MetaDetails";

export default function AccountDetailsPage() {
	const rootData = useRouteLoaderData<typeof rootLoader>("root");

	const user = rootData?.user;

	if (!user || user == null) return null;

	return (
		<>
			<MetaDetails
				metaTitle="Account Details | Top Attractions Dubai"
				metaDescription="My account information"
			/>

			<div className="space-y-6">
				<h1 className="text-3xl font-bold">Account Details</h1>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-4">
							<Avatar className="h-20 w-20">
								<AvatarFallback className="text-2xl">
									{user?.first_name}
									{user?.last_name}
								</AvatarFallback>
							</Avatar>
							<div>
								<CardTitle className="text-2xl">
									{user.first_name} {user.last_name}
								</CardTitle>
								<CardDescription>{user.email}</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<p className="text-sm text-muted-foreground">Phone</p>
							<p className="font-medium">{user.phone_number || "Not provided"}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Member since</p>
							<p className="font-medium">
								{user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
