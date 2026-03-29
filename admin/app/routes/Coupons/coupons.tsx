import { Form, Link, useLoaderData, useLocation, useNavigation, useSearchParams } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { PlusCircle, Search } from "lucide-react";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Button } from "~/components/ui/button";
import { CouponCard } from "~/components/Coupons/CouponCard";
import { highLevelCouponsQuery } from "~/queries/coupons.q";
import { Input } from "~/components/ui/input";

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const q = url.searchParams.get("q")?.trim() ?? "";
	const couponsResp = await highLevelCouponsQuery({ request, q });
	return { couponsResp };
}

export default function AdminCouponsPage() {
	const {
		couponsResp: { coupons },
	} = useLoaderData<typeof loader>();

	const [searchParams] = useSearchParams();
	const currentQuery = searchParams.get("q") ?? "";
	const navigation = useNavigation();
	const location = useLocation();

	const isFetchingThisRoute =
		navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	return (
		<>
			<MetaDetails
				metaTitle="Coupons & Discounts | Admin Panel"
				metaDescription="Offer discounts to your customers."
			/>
			<div className="space-y-8">
				<div className="flex items-center justify-between">
					<h1 className="text-4xl font-bold tracking-tight">Coupons</h1>
					<Link to="/coupons/add" viewTransition className="ml-auto" prefetch="intent">
						<Button size="sm" className="ml-auto">
							<PlusCircle width={18} />
							<span>Add Coupon</span>
						</Button>
					</Link>
				</div>

				<div>
					<Form method="get" action="/coupons">
						<div className="relative">
							<Search
								className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
								width={18}
							/>
							<Input
								placeholder="Search coupons by code"
								name="q"
								className="w-full pl-8 max-w-80"
								id="search"
								defaultValue={currentQuery}
								disabled={isFetchingThisRoute}
							/>
						</div>
						<button type="submit" className="hidden">
							Search
						</button>
					</Form>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
					{coupons.map((coupon) => (
						<CouponCard key={coupon.id} coupon={coupon} />
					))}
				</div>

				{coupons.length === 0 && (
					<div className="text-center py-12 text-muted-foreground">
						No coupons yet. Create your first coupon above.
					</div>
				)}
			</div>
		</>
	);
}
