import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { cn } from "@workspace/shared/utils/ui";

const reviewSchema = z.object({
	rating: z.number().min(1, "Please select a rating").max(5),
	comment: z
		.string()
		.min(10, "Comment must be at least 10 characters")
		.max(500, "Comment cannot exceed 500 characters"),
	tour_id: z.string().min(1, "Please select a tour"),
	booking_id: z.string().min(1, "Please select a booking"),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface AddReviewFormProps {
	tour_id: string;
	booking_id: string;
	setAddReviewDialog: () => void;
}

export default function AddReviewForm({ tour_id, booking_id, setAddReviewDialog }: AddReviewFormProps) {
	const [hoveredRating, setHoveredRating] = useState<number>(0);
	const [selectedRating, setSelectedRating] = useState<number>(0);
	const fetcher = useFetcher(); // ← Use fetcher for cross-route submission
	const actionData = fetcher.data;

	const form = useForm<ReviewFormData>({
		resolver: zodResolver(reviewSchema),
		defaultValues: {
			rating: 0,
			comment: "",
			booking_id: booking_id,
			tour_id: tour_id,
		},
	});

	const isSubmitting = fetcher.state === "submitting" && fetcher.formAction === "/add-review";

	const {
		register,
		handleSubmit,
		setValue,
		control,
		formState: { errors },
	} = form;

	const commentValue = useWatch({ control, name: "comment" });
	const charCount = commentValue?.length || 0;

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Review added successfully");
				setAddReviewDialog();
			} else if (actionData.error) {
				toast.error(actionData.error);
			}
		}
	}, [actionData]);

	const onSubmit = async (data: ReviewFormData) => {
		if (data.rating && data.comment && data.tour_id && data.booking_id) {
			const formData = new FormData();
			formData.set("rating", data.rating.toString());
			formData.set("comment", data.comment.trim());
			formData.set("tour_id", data.tour_id);
			formData.set("booking_id", data.booking_id);
			fetcher.submit(formData, { method: "post", action: "/add-review", preventScrollReset: true });
		} else {
			toast.error("Something went wrong.");
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
					<span className="text-destructive">{errors.comment ? errors.comment.message : " "}</span>
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
	);
}
