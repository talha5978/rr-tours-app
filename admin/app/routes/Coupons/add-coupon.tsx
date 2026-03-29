import { zodResolver } from "@hookform/resolvers/zod";
import { addCouponSchema, type AddCouponSchemaType } from "@workspace/shared/schemas/coupon.schema";
import { cacheService } from "@workspace/shared/services/cache.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";
import { CouponsService } from "@workspace/shared/services/coupons.service";
import type { ActionResponse } from "@workspace/shared/types/action-data";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { Loader2, Search } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { type Control, useForm } from "react-hook-form";
import {
	Link,
	type LoaderFunctionArgs,
	useActionData,
	useLoaderData,
	useNavigate,
	useNavigation,
	useSubmit,
	useSearchParams,
	useLocation,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { tourOptionsListQuery } from "~/queries/tours.q";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";

export const action = async ({ request }: LoaderFunctionArgs) => {
	const formData = await request.formData();

	const data = {
		code: formData.get("code") as string,
		coupon_type: formData.get("coupon_type") as "MANUAL" | "AUTOMATIC",
		discount_type: formData.get("discount_type") as "PERCENTAGE" | "FIXED_AMOUNT",
		discount_value: Number(formData.get("discount_value")),
		valid_from: formData.get("valid_from") as string,
		valid_until: formData.get("valid_until") as string,
		min_subtotal: formData.get("min_subtotal") ? Number(formData.get("min_subtotal")) : null,
		total_usage_limit: formData.get("total_usage_limit")
			? Number(formData.get("total_usage_limit"))
			: null,
		per_user_limit: formData.get("per_user_limit") ? Number(formData.get("per_user_limit")) : null,
		is_active: formData.get("is_active") === "Y",
		tour_option_ids: formData.getAll("tour_option_ids[]").map(Number),
	};

	const parseResult = addCouponSchema.safeParse(data);

	if (!parseResult.success) {
		return {
			validationErrors: parseResult.error.flatten().fieldErrors,
		};
	}

	const svc = new CouponsService(request);

	try {
		await svc.addCoupon(parseResult.data);
		await cacheService.invalidatePattern(CACHE_KEYS.coupons.highLevelAD() + ":*");
		await cacheService.invalidatePattern(CACHE_KEYS.coupons.allFP() + ":*");

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error instanceof ApiError ? error.message : error.message || "Failed to add coupon",
		};
	}
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { q, pageIndex, pageSize } = getPaginationQueryPayload({ request });
	const tourOptions = await tourOptionsListQuery({ request, q, pageIndex, pageSize });

	return { tourOptions };
};

export default function AddCouponPage() {
	const navigate = useNavigate();
	const submit = useSubmit();
	const navigation = useNavigation();
	const actionData: ActionResponse = useActionData();

	const form = useForm<AddCouponSchemaType>({
		resolver: zodResolver(addCouponSchema) as any,
		mode: "onSubmit",
		defaultValues: {
			code: "TEST001",
			coupon_type: "MANUAL",
			discount_type: "PERCENTAGE",
			discount_value: 10,
			valid_from: new Date().toISOString().slice(0, 16),
			valid_until: new Date(Date.now() + 7776000000).toISOString().slice(0, 16),
			min_subtotal: null,
			total_usage_limit: null,
			per_user_limit: 1,
			is_active: true,
			tour_option_ids: [],
		},
	});

	const { handleSubmit, setError, control } = form;

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("New coupon added successfully");
				navigate("/coupons", { replace: true, viewTransition: true });
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					if (errors) {
						setError(field as keyof AddCouponSchemaType, { message: errors[0] });
					}
				});
			}
		}
	}, [actionData, navigate, setError]);

	async function onFormSubmit(values: AddCouponSchemaType) {
		const formData = new FormData();

		formData.append("code", values.code.trim().toUpperCase());
		formData.append("coupon_type", values.coupon_type);
		formData.append("discount_type", values.discount_type);
		formData.append("discount_value", values.discount_value.toString());

		const validFromDate = new Date(values.valid_from);
		const validUntilDate = new Date(values.valid_until);

		formData.append("valid_from", validFromDate.toISOString());
		formData.append("valid_until", validUntilDate.toISOString());

		if (values.min_subtotal !== null) {
			formData.append("min_subtotal", values.min_subtotal.toString());
		}
		if (values.total_usage_limit !== null) {
			formData.append("total_usage_limit", values.total_usage_limit.toString());
		}
		if (values.per_user_limit !== null) {
			formData.append("per_user_limit", values.per_user_limit.toString());
		}

		formData.append("is_active", values.is_active ? "Y" : "N");

		values.tour_option_ids.forEach((id) => {
			formData.append("tour_option_ids[]", id.toString());
		});

		submit(formData, {
			method: "POST",
			action: "/coupons/add",
		});
	}

	return (
		<>
			<MetaDetails metaTitle="Add Coupon | Admin Panel" metaDescription="Create new marketing coupon" />

			<section className="flex flex-col gap-4">
				<div className="flex gap-4 items-center">
					<BackButton href="/coupons" />
					<h1 className="text-2xl font-semibold">Add New Coupon</h1>
				</div>

				<form className="space-y-4" onSubmit={handleSubmit(onFormSubmit)}>
					<Form {...form}>
						{/* === BASIC DETAILS === */}
						<Card>
							<CardHeader>
								<CardTitle>Coupon Details</CardTitle>
							</CardHeader>
							<Separator />
							<CardContent className="space-y-6 pt-6">
								<FormField
									control={control}
									name="code"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Coupon Code</FormLabel>
											<FormControl>
												<Input placeholder="SUMMER25" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="grid sm:grid-cols-2 gap-6">
									<FormField
										control={control}
										name="coupon_type"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Coupon Type</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger className="w-full">
															<SelectValue />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="MANUAL">
															Manual (ustomer enters code)
														</SelectItem>
														<SelectItem value="AUTOMATIC">
															Automatic (auto-applied)
														</SelectItem>
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={control}
										name="is_active"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Status</FormLabel>
												<FormControl>
													<Label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50">
														<Checkbox
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
														<div className="flex flex-col gap-1">
															<span className="font-medium">Active</span>
															<span className="text-sm text-muted-foreground">
																Coupon will be available to customers if
																active
															</span>
														</div>
													</Label>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</CardContent>
						</Card>

						{/* === DISCOUNT SETTINGS === */}
						<Card>
							<CardHeader>
								<CardTitle>Discount Settings</CardTitle>
							</CardHeader>
							<Separator />
							<CardContent className="space-y-6 pt-6">
								<FormField
									control={control}
									name="discount_type"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Discount Type</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="PERCENTAGE">Percentage</SelectItem>
													<SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={control}
									name="discount_value"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{form.watch("discount_type") === "PERCENTAGE"
													? "Percentage"
													: "Amount"}
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													step={
														form.watch("discount_type") === "PERCENTAGE"
															? "1"
															: "0.01"
													}
													placeholder={
														form.watch("discount_type") === "PERCENTAGE"
															? "15"
															: "25.00"
													}
													{...field}
													onChange={(e) => field.onChange(Number(e.target.value))}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="grid sm:grid-cols-2 gap-6">
									<FormField
										control={control}
										name="valid_from"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Valid From</FormLabel>
												<FormControl>
													<Input type="datetime-local" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={control}
										name="valid_until"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Valid Until</FormLabel>
												<FormControl>
													<Input type="datetime-local" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</CardContent>
						</Card>

						{/* === USAGE LIMITS === */}
						<Card>
							<CardHeader>
								<CardTitle>Usage &amp; Limits</CardTitle>
							</CardHeader>
							<Separator />
							<CardContent className="grid sm:grid-cols-3 gap-6 pt-6">
								<FormField
									control={control}
									name="min_subtotal"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Min. Subtotal (optional)</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													placeholder="0.00"
													{...field}
													value={field.value ?? ""}
													onChange={(e) =>
														field.onChange(
															e.target.value ? Number(e.target.value) : null,
														)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={control}
									name="total_usage_limit"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Total Usage Limit (optional)</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="Unlimited"
													{...field}
													value={field.value ?? ""}
													onChange={(e) =>
														field.onChange(
															e.target.value ? Number(e.target.value) : null,
														)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={control}
									name="per_user_limit"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Per User Limit (optional)</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="1"
													{...field}
													value={field.value ?? ""}
													onChange={(e) =>
														field.onChange(
															e.target.value ? Number(e.target.value) : null,
														)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* === TOUR OPTIONS SELECTION (exact copy-paste adapted from your ToursSelection) === */}
						<TourOptionsSelection formControl={control} />

						{/* Submit */}
						<div className="flex gap-4 justify-end">
							<Link to="/coupons" viewTransition prefetch="intent">
								<Button variant="outline">Cancel</Button>
							</Link>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && <Loader2 className="animate-spin mr-2" />}
								<span>Create Coupon</span>
							</Button>
						</div>
					</Form>
				</form>
			</section>
		</>
	);
}

function TourOptionsSelection({ formControl }: { formControl: Control<AddCouponSchemaType> }) {
	const [searchParams, setSearchParams] = useSearchParams();
	const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
	const [page, setPage] = useState(() => {
		const p = Number(searchParams.get("page") ?? "1");
		return isNaN(p) || p < 1 ? 1 : p;
	});

	const navigation = useNavigation();
	const location = useLocation();

	const isFetchingThisRoute =
		navigation.state === "loading" &&
		navigation.location?.pathname === location.pathname &&
		navigation.location.search === location.search;

	const { tourOptions: data } = useLoaderData<typeof loader>();

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
			{
				replace: true,
				preventScrollReset: true,
				state: { scrollPosition: window.scrollY, suppressLoadingBar: true },
			},
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
			{
				replace: true,
				preventScrollReset: true,
				state: { scrollPosition: window.scrollY, suppressLoadingBar: true },
			},
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
					name="tour_option_ids"
					render={({ field }) => (
						<FormItem>
							{isFetchingThisRoute ? (
								<div className="flex items-center justify-center h-64">
									<Loader2 className="h-8 w-8 animate-spin text-primary" />
								</div>
							) : (
								<div className="rounded-md border overflow-hidden">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="w-12"></TableHead>
												<TableHead>Tours List</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{tours.length === 0 ? (
												<TableRow>
													<TableCell
														colSpan={3}
														className="h-32 text-center text-muted-foreground"
													>
														No tour options found
													</TableCell>
												</TableRow>
											) : (
												tours.map((tour) => (
													<Fragment key={tour.id}>
														{/* Tour Group Header */}
														{tour.tour_options &&
															tour.tour_options.length > 0 && (
																<TableRow className="bg-muted/50 hover:bg-muted/50">
																	<TableCell
																		colSpan={3}
																		className="font-semibold text-base py-3"
																	>
																		{tour.name}
																	</TableCell>
																</TableRow>
															)}

														{/* Tour Options under this tour */}
														{tour.tour_options?.map((option) => (
															<TableRow
																key={option.id}
																className="hover:bg-muted/50 text-wrap"
															>
																<TableCell className="text-center text-wrap">
																	<Checkbox
																		checked={field.value.includes(
																			option.id,
																		)}
																		onCheckedChange={(checked) => {
																			if (checked) {
																				field.onChange([
																					...field.value,
																					option.id,
																				]);
																			} else {
																				field.onChange(
																					field.value.filter(
																						(id: number) =>
																							id !== option.id,
																					),
																				);
																			}
																		}}
																		aria-label={`Select ${option.name}`}
																	/>
																</TableCell>
																<TableCell className="font-medium text-wrap">
																	{option.name}
																</TableCell>
															</TableRow>
														))}
													</Fragment>
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
