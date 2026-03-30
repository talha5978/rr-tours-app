import { zodResolver } from "@hookform/resolvers/zod";
import { updateCouponSchema, type UpdateCouponSchemaType } from "@workspace/shared/schemas/coupon.schema";
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
import { Separator } from "~/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { tourOptionsListQuery } from "~/queries/tours.q";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";
import { getCouponById } from "~/queries/coupons.q";

export const action = async ({ request, params }: LoaderFunctionArgs) => {
	const id = params.id as string;
	if (!id) throw new Response("Coupon ID is required", { status: 400 });

	const formData = await request.formData();

	try {
		const svc = new CouponsService(request);
		await svc.updateCoupon(Number(id), formData);

		await cacheService.invalidatePattern(CACHE_KEYS.coupons.highLevelAD() + ":*");
		await cacheService.invalidatePattern(CACHE_KEYS.coupons.allFP() + ":*");
		await cacheService.invalidate(CACHE_KEYS.coupons.details("AD", Number(id)));

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error instanceof ApiError ? error.message : error.message || "Failed to update coupon",
		};
	}
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const id = params.id as string;
	if (!id) throw new Response("Coupon ID is required", { status: 400 });

	const coupon = await getCouponById({ request, couponId: Number(id) });
	if (!coupon.data) {
		throw new Response("Coupon not found", { status: 404 });
	}

	const { q, pageIndex, pageSize } = getPaginationQueryPayload({ request });
	const tourOptions = await tourOptionsListQuery({ request, q, pageIndex, pageSize });

	return { coupon: coupon.data, tourOptions };
};

export default function UpdateCouponPage() {
	const navigate = useNavigate();
	const submit = useSubmit();
	const navigation = useNavigation();
	const actionData: ActionResponse = useActionData();
	const { coupon } = useLoaderData<typeof loader>();

	const form = useForm<UpdateCouponSchemaType>({
		resolver: zodResolver(updateCouponSchema) as any,
		mode: "onChange",
		defaultValues: {
			code: coupon.code,
			valid_from: new Date(coupon.valid_from).toISOString().slice(0, 16),
			valid_until: new Date(coupon.valid_until).toISOString().slice(0, 16),
			is_active: coupon.is_active ?? true,
			tour_option_ids: coupon.tours.flatMap((t) => t.tour_options.map((o) => o.id)),
		},
	});

	const { handleSubmit, setError, control } = form;
	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Coupon updated successfully");
				navigate("/coupons", { replace: true, viewTransition: true });
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					if (errors) {
						setError(field as keyof UpdateCouponSchemaType, { message: errors[0] });
					}
				});
			}
		}
	}, [actionData, navigate, setError]);

	async function onFormSubmit(values: UpdateCouponSchemaType) {
		const formData = new FormData();
		const original = coupon;

		if (!original) {
			toast.error("Coupon data is missing. Cannot submit form.");
			return;
		}

		// Code
		if (values.code.trim().toUpperCase() !== original.code) {
			formData.append("code", values.code.trim().toUpperCase());
		}

		// Valid From
		const newValidFrom = new Date(values.valid_from).toISOString();
		if (newValidFrom !== new Date(original.valid_from).toISOString()) {
			formData.append("valid_from", newValidFrom);
		}

		// Valid Until
		const newValidUntil = new Date(values.valid_until).toISOString();
		if (newValidUntil !== new Date(original.valid_until).toISOString()) {
			formData.append("valid_until", newValidUntil);
		}

		// Is Active
		if (values.is_active !== original.is_active) {
			formData.append("is_active", values.is_active ? "Y" : "N");
		}

		// === Tour Options: Send only added & removed IDs ===
		const originalTourOptionIds = new Set(original.tours.flatMap((t) => t.tour_options.map((o) => o.id)));

		const newTourOptionIds = new Set(values.tour_option_ids);

		const added = Array.from(newTourOptionIds).filter((id) => !originalTourOptionIds.has(id));
		const removed = Array.from(originalTourOptionIds).filter((id) => !newTourOptionIds.has(id));

		added.forEach((id) => formData.append("added_tour_option_ids[]", id.toString()));
		removed.forEach((id) => formData.append("removed_tour_option_ids[]", id.toString()));

		submit(formData, {
			method: "POST",
			action: `/coupons/${coupon.id}/update`,
		});
	}

	return (
		<>
			<MetaDetails
				metaTitle={`Update Coupon ${coupon.code} | Admin Panel`}
				metaDescription="Update existing coupon"
			/>

			<section className="flex flex-col gap-4">
				<div className="flex gap-4 items-center">
					<BackButton href="/coupons" />
					<h1 className="text-2xl font-semibold">Update Coupon - {coupon.code}</h1>
				</div>

				<form className="space-y-4" onSubmit={handleSubmit(onFormSubmit)}>
					<Form {...form}>
						{/* === BASIC DETAILS === */}
						<Card>
							<CardHeader>
								<CardTitle>Coupon Details</CardTitle>
							</CardHeader>
							<Separator />
							<CardContent className="space-y-6">
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

								<FormField
									control={control}
									name="is_active"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<Label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50">
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
													<div className="flex flex-col gap-1">
														<span className="font-medium">Active</span>
														<span className="text-sm text-muted-foreground">
															Coupon will be available to customers if active
														</span>
													</div>
												</Label>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						<TourOptionsSelection formControl={control} />

						{/* Submit */}
						<div className="flex gap-4 justify-end">
							<Link to="/coupons" viewTransition prefetch="intent">
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

function TourOptionsSelection({ formControl }: { formControl: Control<UpdateCouponSchemaType> }) {
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
		location.state?.suppressLoader === true;

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
				state: { scrollPosition: window.scrollY, suppressLoadingBar: true, suppressLoader: true },
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
			<CardContent className="space-y-5">
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
