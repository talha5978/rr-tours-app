import { Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { PlusCircle } from "lucide-react";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Button } from "~/components/ui/button";
import { CouponCard } from "~/components/Coupons/CouponCard";
import { highLevelCouponsQuery } from "~/queries/coupons.q";

export async function loader({ request }: LoaderFunctionArgs) {
	const couponsResp = await highLevelCouponsQuery({ request });
	return { couponsResp };
}

export default function AdminCouponsPage() {
	const {
		couponsResp: { coupons },
	} = useLoaderData<typeof loader>();

	// const coupons: AdminCoupon[] = [
	// 	{
	// 		code: "TLH423",
	// 		id: 214,
	// 		coupon_type: "MANUAL",
	// 		created_at: "2026-03-22T09:15:00.000Z",
	// 		updated_at: "2026-03-22T09:15:00.000Z",
	// 		valid_from: "2026-03-22T09:15:00.000Z",
	// 		valid_until: "2026-04-22T09:15:00.000Z",
	// 		discount_type: "PERCENTAGE",
	// 		discount_value: 20,
	// 		is_active: true,
	// 		min_subtotal: null,
	// 		per_user_limit: 1,
	// 		restricted_tour_options_count: 0,
	// 		total_usage_limit: 20,
	// 		usage_count: 2,
	// 	},
	//     {
	// 		code: "EIDI26",
	// 		id: 123,
	// 		coupon_type: "AUTOMATIC",
	// 		created_at: "2026-03-28T09:15:00.000Z",
	// 		updated_at: "2026-03-28T09:15:00.000Z",
	// 		valid_from: "2026-04-15T09:15:00.000Z",
	// 		valid_until: "2026-04-22T09:15:00.000Z",
	// 		discount_type: "FIXED_AMOUNT",
	// 		discount_value: 150,
	// 		is_active: true,
	// 		min_subtotal: 250,
	// 		per_user_limit: null,
	// 		restricted_tour_options_count: 25,
	// 		total_usage_limit: null,
	// 		usage_count: 0,
	// 	},
	// ];

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
