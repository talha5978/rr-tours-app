import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	fpDefaultTourSortByFilter,
	fpDefaultTourSortTypeFilter,
} from "@workspace/shared/constants/constants";
import {
	type FPTourFilterFormData,
	FPTourFilterFormSchema,
} from "@workspace/shared/schemas/fp-tours-filter.schema";

import { FormControl, FormField, FormItem, Form as ShadcnForm } from "~/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

type Props = {
	url: string;
};

export function TourSort({ url }: Props) {
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();

	const initialSortBy = searchParams.get("sortBy") ?? fpDefaultTourSortByFilter;
	const initialSortType = searchParams.get("sortType") ?? fpDefaultTourSortTypeFilter;

	const combinedDefault =
		searchParams.has("sortBy") || searchParams.has("sortType")
			? `${initialSortBy}:${initialSortType}`
			: "recommended";

	const form = useForm<FPTourFilterFormData & { sortCombined: string }>({
		// @ts-ignore
		resolver: zodResolver(FPTourFilterFormSchema),
		defaultValues: {
			sortBy: initialSortBy as FPTourFilterFormData["sortBy"],
			sortType: initialSortType as FPTourFilterFormData["sortType"],
			sortCombined: combinedDefault,
		},
	});

	const { control, setValue } = form;

	const selected = useWatch({
		control,
		name: "sortCombined",
	});

	const options = useMemo(
		() => [
			{ label: "Recommended", value: "recommended" },
			{ label: "Price (High → Low)", value: "price:desc" },
			{ label: "Price (Low → High)", value: "price:asc" },
		],
		[],
	);

	// Apply sort immediately on change
	useEffect(() => {
		if (!selected) return;

		const params = new URLSearchParams(location.search);

		// Recommended → remove sort params entirely
		if (selected === "recommended") {
			params.delete("sortBy");
			params.delete("sortType");

			navigate(`${url}?${params.toString()}`);
			return;
		}

		const [sortBy, sortType] = selected.split(":");

		setValue("sortBy", sortBy as any);
		setValue("sortType", sortType as any);

		params.set("sortBy", sortBy);
		params.set("sortType", sortType);

		navigate(`${url}?${params.toString()}`);
	}, [selected]);

	return (
		<ShadcnForm {...form}>
			<FormField
				// @ts-ignore
				control={control}
				name="sortCombined"
				render={({ field }) => (
					<FormItem className="ml-auto">
						<FormControl>
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger className="w-55">
									<SelectValue placeholder="Sort" />
								</SelectTrigger>
								<SelectContent>
									{options.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FormControl>
					</FormItem>
				)}
			/>
		</ShadcnForm>
	);
}
