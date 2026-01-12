import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";

const getTopAnalytics = (
	total_revenue: string,
	total_bookings: string,
	total_tours: string,
	total_categories: string,
) => {
	return [
		{
			title: "Total Revenue (AED)",
			value: formatCurrencyCompact(Number(total_revenue)),
			footer: "Using data of all bookings",
		},
		{
			title: "Total Bookings",
			value: total_bookings,
			footer: "Using data from all time",
		},
		{
			title: "Total Tours",
			value: total_tours,
			footer: "Using data from all time",
		},
		{
			title: "Total Categories",
			value: total_categories,
			footer: "From your current database state",
		},
	];
};

const AnalyticsCard = ({
	title,
	value,
	footer,
	...props
}: {
	title: string;
	value: string;
	footer?: string;
}) => {
	return (
		<Card className="@container/card" {...props}>
			<CardHeader>
				<CardDescription>{title}</CardDescription>
				<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-2xl">
					{value}
				</CardTitle>
			</CardHeader>
			{footer && (
				<CardFooter className="text-sm">
					<div className="text-muted-foreground">{footer}</div>
				</CardFooter>
			)}
		</Card>
	);
};

export const TopAnalyticsBar = ({
	total_revenue,
	total_bookings,
	total_tours,
	total_categories,
}: {
	total_revenue: string;
	total_bookings: string;
	total_tours: string;
	total_categories: string;
}) => {
	const data = getTopAnalytics(total_revenue, total_bookings, total_tours, total_categories);

	return (
		<div className="*:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid  shrink-0 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			{data.map((i, idx) => {
				return <AnalyticsCard title={i.title} value={i.value} footer={i.footer} key={idx} />;
			})}
		</div>
	);
};

/**
 * Formats a number into a compact, human-readable string (e.g., 1500 -> 1.5K, 1000000 -> 1M)
 * @param {number} num The number to format
 * @returns {string} The formatted string
 */
const formatCurrencyCompact = (num: number): string => {
	if (typeof num !== "number" || isNaN(num)) {
		return "0";
	}

	return new Intl.NumberFormat("en-US", {
		notation: "compact",
		compactDisplay: "short",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(num);
};
