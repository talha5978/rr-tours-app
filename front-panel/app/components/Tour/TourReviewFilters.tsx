import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "react-router";
import { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Label } from "~/components/ui/label";
import { cn } from "@workspace/shared/utils/ui";

const SORT_PRESET = ["rating_desc", "rating_asc", "date_asc", "date_desc"] as const;

const filterSchema = z.object({
	sort_preset: z.enum(SORT_PRESET).optional(),
});

type FilterForm = z.infer<typeof filterSchema>;

interface TourReviewsFiltersProps {
	className?: string;
}

export default function TourReviewsFilters({ className }: TourReviewsFiltersProps) {
	const [searchParams, setSearchParams] = useSearchParams();

	const form = useForm<FilterForm>({
		resolver: zodResolver(filterSchema),
		defaultValues: {
			sort_preset: getSortPresetFromParams(searchParams) as any,
		},
	});

	const { watch, setValue, getValues } = form;

	// Sync form values when searchParams change externally
	useEffect(() => {
		const preset = getSortPresetFromParams(searchParams);
		const current = getValues("sort_preset");

		if (preset !== current) {
			setValue("sort_preset", preset as any, { shouldDirty: true });
		}
	}, [searchParams, setValue, getValues]);

	// Update URL when form value changes
	useEffect(() => {
		const subscription = watch((value, { name }) => {
			// Only react to sort_preset changes
			if (name !== "sort_preset") return;

			setSearchParams(
				(prev) => {
					prev.delete("page"); // reset pagination

					// Clear old params
					prev.delete("sort_by");
					prev.delete("sort_order");

					if (value.sort_preset) {
						const [by, order] = value.sort_preset.split("_");
						prev.set("sort_by", by);
						prev.set("sort_order", order);
					}

					return prev;
				},
				{ replace: true, preventScrollReset: true },
			);
		});

		return () => subscription.unsubscribe();
	}, [watch, setSearchParams]);

	return (
		<div className={cn("space-y-4 ml-auto w-fit flex", className)}>
			<div className="max-w-xs">
				<Label htmlFor="sort_preset" className="sr-only">
					Sort reviews
				</Label>
				<Select
					value={getValues("sort_preset") ?? ""}
					onValueChange={(val) => form.setValue("sort_preset", val as any, { shouldDirty: true })}
				>
					<SelectTrigger id="sort_preset" className="w-full border-2 border-muted-foreground/10">
						<SelectValue placeholder="Sort by..." />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="date_desc">Newest</SelectItem>
						<SelectItem value="date_asc">Oldest</SelectItem>
						<SelectItem value="rating_desc">Rating (High to Low)</SelectItem>
						<SelectItem value="rating_asc">Rating (Low to High)</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}

function getSortPresetFromParams(params: URLSearchParams): string | undefined {
	const sortBy = params.get("sort_by");
	const sortOrder = params.get("sort_order");

	if (!sortBy || !sortOrder) return undefined;

	const preset = `${sortBy}_${sortOrder}`;
	if (SORT_PRESET.includes(preset as any)) return preset;

	return undefined;
}
