import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "~/components/ui/chart";
import { memo } from "react";
import type { MainBarChartData } from "@workspace/shared/types/admin-dashboard";
import ExportBookingsButton from "~/components/Dashboard/ExportBookingsData";

const chartConfig = {
	bookings: {
		label: "bookings",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

export const DashboardMainChart = memo(({ chartData }: { chartData: MainBarChartData["data"] }) => {
	return (
		<Card className="py-0">
			<CardHeader className="flex justify-between border-b sm:flex-row p-6">
				<div className="flex flex-1 flex-col justify-center gap-1">
					<CardTitle>
						<h2>Bookings</h2>
					</CardTitle>
					<CardDescription>Last 90 days confirmed bookings trend.</CardDescription>
				</div>
				<ExportBookingsButton />
			</CardHeader>
			<CardContent className="px-2 sm:[pl-2 pr-6 pb-6 pt-2]">
				<ChartContainer config={chartConfig} className="aspect-auto h-62.5 bg-red- w-full">
					<BarChart
						accessibilityLayer
						data={chartData}
						title={"Bookings"}
						margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
					>
						<CartesianGrid vertical={false} horizontal={true} />
						<XAxis
							dataKey="date"
							tickLine={true}
							axisLine={false}
							tickMargin={10}
							minTickGap={32}
							tickFormatter={(value) => {
								const date = new Date(value);
								return date.toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
								});
							}}
						/>
						<YAxis
							tickLine={true}
							axisLine={false}
							allowDecimals={false}
							tickMargin={12}
							minTickGap={4}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									className="w-37.5 bg-background py-2"
									nameKey={"bookings"}
									title={"Bookings"}
									labelFormatter={(value) => {
										return new Date(value).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
											year: "numeric",
										});
									}}
									formatter={(value) => {
										return (
											<div className="flex w-full justify-between gap-1">
												<p>Bookings</p>
												<p>{value}</p>
											</div>
										);
									}}
								/>
							}
						/>
						<Bar dataKey={"bookings"} fill={chartConfig.bookings.color} />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
});
