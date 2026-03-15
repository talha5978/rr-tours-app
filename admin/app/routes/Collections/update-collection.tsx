import { zodResolver } from "@hookform/resolvers/zod";
import {
	type UpdateCategoryActionData,
	UpdateCategoryActionSchema,
} from "@workspace/shared/schemas/category.schema";
import {
	type UpdateCollectionSchema,
	updateCollectionSchema,
} from "@workspace/shared/schemas/collection.schema";
import { CacheInvalidationService } from "@workspace/shared/services/cache-events.service";
import { CategoryService } from "@workspace/shared/services/categories.service";
import { ActionResponse } from "@workspace/shared/types/action-data";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { queryClient } from "@workspace/shared/utils/query-client";
import { Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Control, useForm } from "react-hook-form";
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	Link,
	useActionData,
	useLoaderData,
	useLocation,
	useNavigate,
	useNavigation,
	useSearchParams,
	useSubmit,
} from "react-router";
import { toast } from "sonner";
import BackButton from "~/components/Nav/BackButton";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { citiesListQuery } from "~/queries/cities.q";
import { collectionDetailsQuery } from "~/queries/collections.q";
import { toursListQuery } from "~/queries/tours.q";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";
import { getSanitizedMetaDetailsForAction } from "~/utils/getSanitizedMetaDetails";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const id = (params.id as string) || "";
	if (!id || id == "") {
		throw new Response("Category ID is required", { status: 400 });
	}

	const formData = await request.formData();
	// console.log("Form data: ", formData);

	const data: Partial<UpdateCategoryActionData> = {};

	if (formData.has("name")) {
		data.name = (formData.get("name") as string).trim();
	}

	if (formData.has("sort_order")) {
		data.sort_order = (formData.get("sort_order") as string).trim();
	}

	if (formData.has("image") && formData.has("removed_image")) {
		data.image = formData.get("image") as File;
		data.removed_image = formData.get("removed_image") as string;
	}

	// Parse meta_details fields
	getSanitizedMetaDetailsForAction({ formData, data });

	const parseResult = UpdateCategoryActionSchema.safeParse(data);
	// console.log("Parse result: ", parseResult?.error);

	if (!parseResult.success) {
		return new Response(JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const svc = new CategoryService(request);

	try {
		await svc.updateCategory(id, parseResult.data);
		await queryClient.invalidateQueries({ queryKey: ["highLvlCategories"] });
		await queryClient.invalidateQueries({ queryKey: ["categoryList"] });
		await queryClient.invalidateQueries({ queryKey: ["categoryDetailsForUpdate", Number(id)] });

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error instanceof ApiError ? error.message : error.message || "Failed to update category",
		};
	}
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const collection_id = params.id as string;
	if (!collection_id) {
		throw new ApiError("Collection id is required", 404);
	}

	const collection = await queryClient.fetchQuery(
		collectionDetailsQuery({ request, id: Number(collection_id) }),
	);
	const cities = await queryClient.fetchQuery(citiesListQuery({ request }));
	const { q, pageIndex, pageSize } = getPaginationQueryPayload({ request });
	const tours = await queryClient.fetchQuery(toursListQuery({ request, q, pageIndex, pageSize }));

	return { cities, tours, collection };
};

export default function UpdateCollectionPage() {
	const { cities, collection } = useLoaderData<typeof loader>();
	const submit = useSubmit();
	const navigation = useNavigation();
	const navigate = useNavigate();

	const actionData: ActionResponse = useActionData();

	const form = useForm<UpdateCollectionSchema>({
		resolver: zodResolver(updateCollectionSchema),
		mode: "onSubmit",
		defaultValues: {
			name: collection.data?.name ?? "",
			description: collection.data?.description ?? "",
			isFeatured: collection.data != null ? (collection.data?.isFeatured ? "Y" : "N") : "N",
			cities: collection.data?.cities.map((city) => city.id) ?? [],
			tours: collection.data?.tours.map((tour) => tour.id) ?? [],
		},
	});

	const { handleSubmit, setError, control } = form;

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Collection updated successfully");
				navigate(`/collections`, {
					viewTransition: true,
					replace: true,
				});
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof UpdateCollectionSchema, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate, setError]);

	async function onFormSubmit(values: UpdateCollectionSchema) {}

	return (
		<>
			<MetaDetails
				metaTitle="Update Collection | Admin Panel"
				metaDescription="Update collection"
				metaKeywords="Update Collection, collection"
			/>
			<section className="flex flex-col gap-4">
				<div className="flex gap-4 items-center">
					<BackButton href="/collections" />
					<h1 className="text-2xl font-semibold">Update Collection</h1>
				</div>
				<form className="space-y-4" onSubmit={handleSubmit(onFormSubmit)}>
					<Form {...form}>
						<Card>
							<CardHeader>
								<CardTitle>Collection Details</CardTitle>
							</CardHeader>
							<Separator />
							<CardContent className="space-y-6">
								{/* Collection Name */}
								<FormField
									control={control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Collection Name</FormLabel>
											<FormControl>
												<Input placeholder="e.g. Best of Dubai" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Collection Description */}
								<FormField
									control={control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Collection Description</FormLabel>
											<FormControl>
												<Textarea
													placeholder="e.g. Book the best tours in Dubai..."
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Is Featured */}
								<FormField
									control={control}
									name="isFeatured"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-4 cursor-pointer">
													<Checkbox
														checked={field.value === "Y"}
														onCheckedChange={(checked) => {
															field.onChange(checked ? "Y" : "N");
														}}
													/>
													<div className="grid gap-1.5 font-normal">
														<p className="text-sm leading-none font-medium">
															Featured Collection
														</p>
														<p className="text-muted-foreground text-sm">
															Collection will be displayed on the home page.
														</p>
													</div>
												</Label>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Select Cities</CardTitle>
								<p className="text-sm text-muted-foreground">
									Optional: Select cities where this collection should be listed.
								</p>
							</CardHeader>
							<Separator />
							<CardContent>
								<FormField
									control={control}
									name="cities"
									render={({ field }) => (
										<FormItem>
											<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
												{cities.map((city) => (
													<Label
														htmlFor={`city-${city.id}`}
														className="cursor-pointer w-full *:w-full"
														key={city.id}
													>
														<div
															className={`border-2 flex items-center gap-2 bg-background px-4 py-3 rounded-md ${field.value.includes(city.id) ? "border-primary" : "border-background"}`}
														>
															<Checkbox
																id={`city-${city.id}`}
																checked={field.value.includes(city.id)}
																onCheckedChange={(checked) => {
																	if (checked) {
																		field.onChange([
																			...field.value,
																			city.id,
																		]);
																	} else {
																		field.onChange(
																			field.value.filter(
																				(id: number) =>
																					id !== city.id,
																			),
																		);
																	}
																}}
															/>
															{city.name}
														</div>
													</Label>
												))}
											</div>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						<ToursSelection formControl={control} />

						{/* Submit Button */}
						<div className="flex gap-4 justify-end">
							<Link to="/collections" viewTransition prefetch="intent">
								<Button variant="outline">Cancel</Button>
							</Link>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && <Loader2 className="animate-spin mr-2" />}
								<span>Update</span>
							</Button>
						</div>
					</Form>
				</form>
			</section>
		</>
	);
}

function ToursSelection({ formControl }: { formControl: Control<UpdateCollectionSchema> }) {
	const [searchParams, setSearchParams] = useSearchParams();
	const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
	const [page, setPage] = useState(() => {
		const p = Number(searchParams.get("page") ?? "1");
		return isNaN(p) || p < 1 ? 1 : p;
	});

	const navigation = useNavigation();
	const location = useLocation();

	const isFetchingThisRoute =
		navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	const { tours: data } = useLoaderData<typeof loader>();

	const tours = data?.tours ?? [];
	const total = data?.total ?? 0;
	const queryError = data?.error ?? null;

	const perPage = 10;
	const totalPages = Math.ceil(total / perPage) || 1;

	useEffect(() => {
		setSearchValue(searchParams.get("q") ?? "");
	}, [searchParams]);

	const performSearch = () => {
		setSearchParams(
			(prev) => {
				const next = new URLSearchParams(prev);
				if (searchValue.trim()) {
					next.set("q", searchValue.trim());
				} else {
					next.delete("q");
				}
				next.set("page", "1");
				return next;
			},
			{ replace: true, preventScrollReset: true, state: { scrollPosition: window.scrollY } },
		);
		setPage(1);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			performSearch();
		}
	};

	useEffect(() => {
		if (queryError) {
			toast.error(queryError.message || "Failed to load tours");
		}
	}, [queryError]);

	useEffect(() => {
		setSearchParams(
			(prev) => {
				const next = new URLSearchParams(prev);
				next.set("page", String(page));
				return next;
			},
			{ replace: true },
		);
	}, [page, setSearchParams]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Select Tours</CardTitle>
				<p className="text-sm text-muted-foreground">Select at least one tour for this collection</p>
			</CardHeader>
			<Separator />
			<CardContent className="space-y-5 pt-5">
				<div className="flex items-center gap-2 w-full">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search tours by name... (press Enter)"
							value={searchValue}
							onChange={(e) => setSearchValue(e.target.value)}
							onKeyDown={handleKeyDown}
							spellCheck={false}
							className="pl-10"
							disabled={isFetchingThisRoute}
						/>
					</div>
					<Button size="sm" type="button" onClick={performSearch} disabled={isFetchingThisRoute}>
						Search
					</Button>
				</div>

				<FormField
					control={formControl}
					name="tours"
					render={({ field }) => (
						<FormItem>
							{isFetchingThisRoute ? (
								<div className="flex items-center justify-center h-64">
									<Loader2 className="h-8 w-8 animate-spin text-primary" />
								</div>
							) : (
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="w-14"></TableHead>
												<TableHead>Tour Name</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{tours.length === 0 ? (
												<TableRow>
													<TableCell
														colSpan={2}
														className="h-32 text-center text-muted-foreground"
													>
														No tours found
													</TableCell>
												</TableRow>
											) : (
												tours.map((tour) => (
													<TableRow key={tour.id}>
														<TableCell className="text-center">
															<Checkbox
																checked={field.value.includes(tour.id)}
																onCheckedChange={(checked) => {
																	if (checked) {
																		field.onChange([
																			...field.value,
																			tour.id,
																		]);
																	} else {
																		field.onChange(
																			field.value.filter(
																				(id: string) =>
																					id !== tour.id,
																			),
																		);
																	}
																}}
																aria-label={`Select ${tour.name}`}
															/>
														</TableCell>
														<TableCell className="font-medium max-w-40 truncate">
															{tour.name}
														</TableCell>
													</TableRow>
												))
											)}
										</TableBody>
									</Table>
								</div>
							)}

							{/* Pagination controls */}
							{totalPages > 1 && !isFetchingThisRoute && (
								<div className="flex items-center justify-between mt-5">
									<Button
										variant="outline"
										size="sm"
										type="button"
										onClick={() => setPage((p) => Math.max(1, p - 1))}
										disabled={page === 1}
									>
										Previous
									</Button>

									<div className="text-sm text-muted-foreground">
										Page <strong>{page}</strong> of {totalPages}
										{total > 0 && ` • ${total} tours total`}
									</div>

									<Button
										variant="outline"
										size="sm"
										type="button"
										onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
										disabled={page === totalPages}
									>
										Next
									</Button>
								</div>
							)}

							<FormMessage className="mt-2" />
						</FormItem>
					)}
				/>

				<FormMessage className="mt-2" />
			</CardContent>
		</Card>
	);
}
