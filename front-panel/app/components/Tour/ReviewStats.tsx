import { Star, StarHalf } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";

interface ReviewStatsProps {
	average: number;
	total: number;
	counts: Record<1 | 2 | 3 | 4 | 5, number>;
}

export default function ReviewStats({ average, total, counts }: ReviewStatsProps) {
	const maxCount = Math.max(...Object.values(counts), 1);
	const floorAvg = Math.floor(average);
	const hasHalfStar = average - floorAvg >= 0.5;

	return (
		<Card className="h-fit">
			<CardContent className="p-6">
				<div className="text-center mb-6">
					<div className="text-5xl font-bold">{average.toFixed(1)}</div>

					{/* Stars with half-star support */}
					<div className="flex justify-center my-2 relative">
						{Array.from({ length: 5 }).map((_, i) => {
							// Full star
							if (i < floorAvg) {
								return <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />;
							}

							// Half star case
							if (i === floorAvg && hasHalfStar) {
								return (
									<div key={i} className="relative h-6 w-6">
										{/* Bottom layer: full outline (yellow border only) */}
										<Star className="absolute inset-0 h-6 w-6 text-yellow-400" />

										{/* Top layer: left half filled */}
										<StarHalf
											className="absolute inset-0 h-6 w-6 fill-yellow-400 text-yellow-400"
											style={{ clipPath: "inset(0 50% 0 0)" }} // clip right half
										/>
									</div>
								);
							}

							// Empty star: outline only, muted
							return <Star key={i} className="h-6 w-6 text-yellow-400" />;
						})}
					</div>

					<p className="text-sm text-muted-foreground">
						Based on {total} review{total !== 1 ? "s" : ""}
					</p>
				</div>

				{/* Rating distribution bars */}
				<div className="space-y-3">
					{[5, 4, 3, 2, 1].map((stars) => {
						const count = counts[stars as 1 | 2 | 3 | 4 | 5];
						const percentage = (count / maxCount) * 100;

						return (
							<div key={stars} className="flex items-center gap-3">
								<div className="sm:w-12 w-10 text-sm font-medium flex items-center gap-1">
									{stars} <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
								</div>
								<Progress value={percentage} className="h-2 flex-1" />
								<div className="sm:w-10 w-8 text-right text-sm text-muted-foreground">
									{count}
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
