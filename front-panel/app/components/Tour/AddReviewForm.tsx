import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { cn } from "@workspace/shared/utils/ui";
import type { Tables } from "@workspace/shared/types/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { format } from "date-fns";

const reviewSchema = z.object({
	rating: z.number().min(1, "Please select a rating").max(5),
	comment: z
		.string()
		.min(10, "Comment must be at least 10 characters")
		.max(500, "Comment cannot exceed 500 characters"),
	booking_id: z.string().min(1, "Please select a booking"),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface AddReviewFormProps {
	tour_id: string;
	bookings: Array<Pick<Tables<"bookings">, "id" | "booking_ref" | "created_at" | "tour_name">>; // your bookings for this tour
	className?: string;
}

export default function AddReviewForm({ tour_id, bookings, className }: AddReviewFormProps) {
	const [hoveredRating, setHoveredRating] = useState<number>(0);
	const [selectedRating, setSelectedRating] = useState<number>(0);

	const form = useForm<ReviewFormData>({
		resolver: zodResolver(reviewSchema),
		defaultValues: {
			rating: 0,
			comment: "",
			booking_id: bookings.length === 1 ? bookings[0].id : "",
		},
	});

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		setValue,
		control,
	} = form;

	const commentValue = useWatch({ control, name: "comment" });
	const charCount = commentValue?.length || 0;

	const onSubmit = async (data: ReviewFormData) => {};

	return (
		<Card className={cn("border shadow-sm", className)}>
			<CardHeader className="pb-4">
				<CardTitle className="text-2xl">Write a Review</CardTitle>
			</CardHeader>

			<CardContent>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					{/* Booking selection (if multiple) */}
					{bookings.length > 1 && (
						<div className="space-y-2">
							<Label htmlFor="booking_id">Select Booking</Label>
							<Select
								onValueChange={(val) => setValue("booking_id", val)}
								defaultValue={bookings[0]?.id}
							>
								<SelectTrigger id="booking_id">
									<SelectValue placeholder="Choose a booking" />
								</SelectTrigger>
								<SelectContent>
									{bookings.map((b) => (
										<SelectItem key={b.id} value={b.id}>
											{b.booking_ref} – {format(new Date(b.created_at), "PPP")}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.booking_id && (
								<p className="text-sm text-destructive">{errors.booking_id.message}</p>
							)}
						</div>
					)}

					{/* Rating stars */}
					<div className="space-y-2">
						<Label>Rating</Label>
						<div className="flex gap-1">
							{Array.from({ length: 5 }).map((_, i) => {
								const isActive = i < (hoveredRating || selectedRating);
								return (
									<button
										key={i}
										type="button"
										onClick={() => {
											setSelectedRating(i + 1);
											setValue("rating", i + 1, { shouldValidate: true });
										}}
										onMouseEnter={() => setHoveredRating(i + 1)}
										onMouseLeave={() => setHoveredRating(0)}
										className={cn(
											"focus:outline-none transition-transform hover:scale-110 cursor-pointer",
											isActive ? "text-yellow-400" : "text-muted-foreground",
										)}
									>
										<Star
											className={cn(
												"h-5 w-5",
												isActive ? "fill-yellow-400" : "text-yellow-400",
											)}
										/>
									</button>
								);
							})}
						</div>
						{errors.rating && <p className="text-sm text-destructive">{errors.rating.message}</p>}
					</div>

					{/* Comment */}
					<div className="space-y-2">
						<Label htmlFor="comment">Your Review</Label>
						<Textarea
							id="comment"
							placeholder="Share your experience with this tour..."
							className="resize-none min-h-30"
							{...register("comment")}
						/>
						<div className="flex justify-between text-xs text-muted-foreground">
							<span>{errors.comment ? errors.comment.message : " "}</span>
							<span>{charCount}/500</span>
						</div>
					</div>

					{/* Submit */}
					<div className="flex justify-end">
						<Button
							type="submit"
							size={"sm"}
							disabled={isSubmitting || !selectedRating}
							className="min-w-35"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Submitting...
								</>
							) : (
								"Submit Review"
							)}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
