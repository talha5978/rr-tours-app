import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Calendar, Tag, Users, MapPin, CircleDot, Clock3, Edit } from "lucide-react";
import type { AdminCoupon } from "@workspace/shared/types/coupons";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "~/components/ui/button";
import { Link } from "react-router";

function formatCurrency(value: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "PKR",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

function formatDateTime(dateString: string | null) {
	if (!dateString) return "N/A";
	return format(new Date(dateString), "PPPp");
}

export function CouponCard({ coupon }: { coupon: AdminCoupon }) {
	const now = new Date();
	const validFrom = new Date(coupon.valid_from);
	const validUntil = new Date(coupon.valid_until);

	const isExpired = validUntil < now;
	const isUpcoming = validFrom > now;
	const isActive = coupon.is_active === true;

	const discountDisplay =
		coupon.discount_type === "PERCENTAGE"
			? `${coupon.discount_value}% OFF`
			: `${formatCurrency(coupon.discount_value)} OFF`;

	const statusLabel = isExpired ? "Expired" : isUpcoming ? "Upcoming" : isActive ? "Active" : "Inactive";

	const statusVariant = isExpired
		? "destructive"
		: isUpcoming
			? "outline"
			: isActive
				? "success"
				: "secondary";

	const usageText = coupon.total_usage_limit
		? `${coupon.usage_count} / ${coupon.total_usage_limit}`
		: `${coupon.usage_count} / Unlimited`;

	const usagePercent = coupon.total_usage_limit
		? Math.min(Math.round((coupon.usage_count / coupon.total_usage_limit) * 100), 100)
		: null;

	return (
		<Card className="overflow-hidden border-border/70 shadow-none pb-0 transition-none">
			<CardHeader className="space-y-4 pb-4">
				<div className="flex items-start justify-between gap-4">
					<div className="min-w-0">
						<Badge
							variant="outline"
							onClick={() => {
								try {
									navigator.clipboard.writeText(coupon.code);
									toast.success("Coupon code copied to clipboard");
								} catch (error) {
									console.error(error);
								}
							}}
							className="mb-2 cursor-pointer font-mono text-[11px] tracking-[0.18em]"
						>
							{coupon.code}
						</Badge>

						<CardTitle className="text-xl font-semibold tracking-tight">
							{discountDisplay}
						</CardTitle>
					</div>

					<div className="flex shrink-0 flex-col items-end gap-2">
						<Badge variant={coupon.coupon_type === "AUTOMATIC" ? "success" : "secondary"}>
							{coupon.coupon_type}
						</Badge>
						<Badge variant={statusVariant as any}>{statusLabel}</Badge>
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-5 pt-0">
				<div className="flex items-start gap-3 [&>div]:space-y-1">
					<Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
					<div>
						<p className="text-xs uppercase tracking-wide text-muted-foreground">
							Validity period
						</p>

						<div className="space-y-1 text-sm">
							<div className="space-x-2">
								<span className="text-[11px] text-muted-foreground">From</span>
								<span className="font-medium">{formatDateTime(coupon.valid_from)}</span>
							</div>

							<div className="space-x-2">
								<span className="text-[11px] text-muted-foreground">Until</span>
								<span className="font-medium">{formatDateTime(coupon.valid_until)}</span>
							</div>
						</div>
					</div>
				</div>

				<div className="flex items-start gap-3 [&>div]:space-y-1">
					<Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
					<div className="min-w-0 flex-1">
						<div className="flex items-center justify-between gap-3">
							<p className="text-xs uppercase tracking-wide text-muted-foreground">Usage</p>
							<span className="text-xs text-muted-foreground">{usageText}</span>
						</div>

						{usagePercent !== null ? (
							<div className="mt-2 h-1.5 rounded-full dark:bg-gray-600 bg-slate-300">
								<div
									className="h-full rounded-full bg-foreground"
									style={{ width: `${usagePercent}%` }}
								/>
							</div>
						) : (
							<div className="mt-2 h-1.5 rounded-full overflow-hidden bg-slate-300 dark:bg-gray-600">
								<div
									className="h-full w-full opacity-60"
									style={{
										backgroundImage: `repeating-linear-gradient(
                                        45deg,
                                        currentColor,
                                        currentColor 4px,
                                        transparent 4px,
                                        transparent 12px
                                    )`,
									}}
								/>
							</div>
						)}
					</div>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<div className="flex items-start gap-3 [&>div]:space-y-1">
						<Tag className="mt-0.5 h-4 w-4 text-muted-foreground" />
						<div>
							<p className="text-xs uppercase tracking-wide text-muted-foreground">
								Minimum subtotal
							</p>
							<p className="text-sm font-medium">
								{coupon.min_subtotal !== null ? formatCurrency(coupon.min_subtotal) : "N/A"}
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3 [&>div]:space-y-1">
						<MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
						<div>
							<p className="text-xs uppercase tracking-wide text-muted-foreground">
								Applies to
							</p>
							<p className="text-sm font-medium">
								{coupon.restricted_tour_options_count === 0
									? "All tours"
									: `${coupon.restricted_tour_options_count} tour${
											coupon.restricted_tour_options_count > 1 ? "s" : ""
										}`}
							</p>
						</div>
					</div>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<div className="flex items-start gap-3 [&>div]:space-y-1">
						<CircleDot className="mt-0.5 h-4 w-4 text-muted-foreground" />
						<div>
							<p className="text-xs uppercase tracking-wide text-muted-foreground">
								Per user limit
							</p>
							<p className="text-sm font-medium">
								{coupon.per_user_limit !== null
									? `${coupon.per_user_limit} Use${coupon.per_user_limit > 1 ? "s" : ""}/Customer`
									: "Unlimited"}
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3 [&>div]:space-y-1">
						<Clock3 className="mt-0.5 h-4 w-4 text-muted-foreground" />
						<div>
							<p className="text-xs uppercase tracking-wide text-muted-foreground">
								Coupon state
							</p>
							<p className="text-sm font-medium">
								{isExpired
									? "Ended"
									: isUpcoming
										? "Not started yet"
										: isActive
											? "Currently active"
											: "Disabled"}
							</p>
						</div>
					</div>
				</div>
			</CardContent>

			<CardFooter className="flex items-center justify-between border-t bg-muted/40 pt-3 pb-5 text-xs text-muted-foreground">
				<div className="flex flex-col gap-1">
					<span>Created at {formatDateTime(coupon.created_at)}</span>
					<span>Last updated at {formatDateTime(coupon.updated_at)}</span>
				</div>
				<Link to={`/coupons/${coupon.id}/update`} viewTransition prefetch="intent">
					<Button
						size="icon"
						variant="outline"
						className="h-8 px-3 text-xs group hover:border-primary"
					>
						<Edit className="group-hover:text-primary transition ease-in-out duration-75" />
					</Button>
				</Link>
			</CardFooter>
		</Card>
	);
}
