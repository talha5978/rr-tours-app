import { zodResolver } from "@hookform/resolvers/zod";
import { MAX_META_KEYWORDS } from "@workspace/shared/constants/constants";
import { AddTourActionSchema, type AddTourInput, AddTourSchema } from "@workspace/shared/schemas/tour.schema";
import { cacheService } from "@workspace/shared/services/cache.service";
import { ToursService } from "@workspace/shared/services/tours.service";
import type { ActionResponse } from "@workspace/shared/types/action-data";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { type Control, useForm, useWatch } from "react-hook-form";
import {
	type ActionFunctionArgs,
	Link,
	type LoaderFunctionArgs,
	useActionData,
	useLoaderData,
	useNavigate,
	useNavigation,
	useSubmit,
} from "react-router";
import { toast } from "sonner";
import BackButton from "~/components/Nav/BackButton";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { AddressCard } from "~/components/Tour/Mutations/AddressCard";
import { AttributesCard } from "~/components/Tour/Mutations/AttributesCard";
import { GeneralDetailsCard } from "~/components/Tour/Mutations/GeneralCard";
import { ImagesInputCard } from "~/components/Tour/Mutations/ImagesCard";
import { MainContentCard } from "~/components/Tour/Mutations/MainContentCard";
import { TagsCard } from "~/components/Tour/Mutations/TagsCard";
import { TourOptionsCard } from "~/components/Tour/Mutations/TourOptionsCard";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
	CustomTagsInputClear,
	TagsInput,
	TagsInputInput,
	TagsInputItem,
	TagsInputList,
} from "~/components/ui/tags-input";
import { Textarea } from "~/components/ui/textarea";
import { cancellationPoliciesQuery } from "~/queries/cancellation-policies.q";
import { categoryListQuery } from "~/queries/categories.q";
import { citiesListQuery } from "~/queries/cities.q";
import { participantTypesQuery } from "~/queries/participant-types.q";
import { allProvidersQuery } from "~/queries/providers.q";
import { allTagsQuery } from "~/queries/tags.q";

export const action = async ({ request }: ActionFunctionArgs) => {
	try {
		if (request.method !== "POST") {
			throw new ApiError("Invalid request method", 405, []);
		}

		const formData = await request.formData();
		let payload: string = formData.get("payload") as string;

		if (!payload || payload.trim() === "") {
			throw new ApiError("Empty request body", 400, []);
		}

		let rawBody: any = JSON.parse(payload);

		if (rawBody?.meta_details?.meta_keywords) {
			rawBody.meta_details.meta_keywords = (rawBody as AddTourInput)?.meta_details?.meta_keywords
				?.map((keyword) => keyword.trim())
				.join(",");
		}

		const cover_image = formData.get("cover_image") as File;
		const images = formData.getAll("images") as File[];
		// console.log("rawbody:\n",rawBody.tour_options[0].overrides);

		const parseResult = AddTourActionSchema.safeParse({
			...rawBody,
			cover_image,
			images: images.filter((i) => i != null && i instanceof File),
		});

		if (!parseResult.success) {
			return new Response(
				JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
		// console.log(parseResult.data.tour_options[0].rules[0].time_slots);
		// return;
		const tours_svc = new ToursService(request);
		const tour_id = await tours_svc.addTour(parseResult.data);

		await cacheService.invalidatePattern(CACHE_KEYS.categories.highLevelAD() + `:*`);
		await cacheService.invalidatePattern(CACHE_KEYS.tours.list("AD") + `:*`);
		await cacheService.invalidatePattern(CACHE_KEYS.tours.highLevel("AD") + `:*`);
		await cacheService.invalidate(CACHE_KEYS.dashboard.mainStats());
		await cacheService.invalidatePattern(CACHE_KEYS.tours.highLevel("FP") + `:*`);

		return { success: true, tour_id };
	} catch (error: any) {
		return {
			success: false,
			tour_id: null,
			error: error instanceof ApiError ? error.message : error.message || "Failed to add tour",
		};
	}
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const cancellation_policies = await cancellationPoliciesQuery({ request });
	const participants = await participantTypesQuery({ request });
	const cities = await citiesListQuery({ request });
	const tags = await allTagsQuery({ request });
	const categories = await categoryListQuery({ request });
	const providers = await allProvidersQuery({ request });

	return {
		cities,
		categories,
		providers,
		tags,
		cancellation_policies,
		participants,
	};
};

export default function AddTourPage() {
	const { cities, categories, providers, tags, cancellation_policies, participants } =
		useLoaderData<typeof loader>();
	const navigate = useNavigate();

	const submit = useSubmit();
	const navigation = useNavigation();

	// @ts-ignore
	const actionData: ActionResponse & { tour_id: string | null } = useActionData();

	const form = useForm<AddTourInput>({
		resolver: zodResolver(AddTourSchema),
		mode: "onSubmit",
		defaultValues: {
			name: "",
			city_id: "",
			tour_category_id: "",
			provider: "",
			duration_minutes: "",
			isFeatured: "false",
			isActive: "true",
			free_cancelation_avilable: "false",
			isWeelChairAccessible: "false",
			tags: [],
			overview: "",
			highlights: "",
			know_before_you_go: "",
			cancellation_policy: "",
			age_health_restrictions: "",
			cover_image: undefined,
			images: Array.from({ length: 4 }).fill(undefined) as undefined[],
			address_name: "",
			address_link: "",
			meta_details: {
				meta_title: "",
				meta_description: "",
				url_key: "",
				meta_keywords: [],
			},
			live_tour_guide: "false",
			live_tour_guide_langs: [],
			tour_options: [
				{
					name: "",
					inclusions: "",
					exclusions: "",
					note: "",
					sort_order: "1",
					prices: [
						{
							price: "",
							participant: participants.length > 0 ? participants[0].id.toString() : undefined,
						},
					],
					rules: [],
					overrides: [],
					isOpenDated: "true",
				},
			],
		},
	});

	const { handleSubmit, setError, control } = form;

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("New tour added successfully");
				navigate("/tours");
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof AddTourInput, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate, setError]);

	const watchedTags = useWatch({ control, name: "tags" }) ?? [];

	async function onFormSubmit(values: AddTourInput) {
		console.log(values);
		if (values.address_name != null && values.address_name != "") {
			if (values.address_link == null || values.address_link == "") {
				toast.error("Please add address link.");
				return;
			}
		} else if (values.address_name == null || values.address_name == "") {
			if (values.address_link != null && values.address_link != "") {
				toast.error("Please add address name.");
				return;
			}
		}

		if (values.tour_options.length === 0) {
			toast.error("Please add at least one tour option.");
			return;
		}

		for (const option of values.tour_options) {
			if (option.rules == null || option.rules.length === 0) {
				toast.error(`Please add at least one availability rule for tour option "${option.name}".`);
				return;
			}
		}

		for (const option of values.tour_options) {
			if (option.prices.length === 0) {
				toast.error("Please add at least one price for each tour option.");
				return;
			}

			const seenParticipants = new Set<string>();

			for (const price of option.prices) {
				if (seenParticipants.has(price.participant)) {
					toast.error(
						`Duplicate ${participants
							.find((i) => i.id === Number(price.participant))
							?.name.toLowerCase()} participant prices in the tour option "${option.name}" are not allowed.`,
					);
					return;
				}

				seenParticipants.add(price.participant);
			}
		}

		const formData = new FormData();

		for (let key in values) {
			if (typeof values[key as keyof AddTourInput] === "string") {
				// @ts-ignore
				values[key as keyof AddTourInput] = values[key].trim();
			}
		}

		formData.append(
			"payload",
			JSON.stringify({
				...values,
				cover_image: undefined,
				images: undefined,
			}),
		);

		if (values.cover_image) {
			formData.append("cover_image", values.cover_image);
		}

		if (values.images) {
			values.images.forEach((file, _) => {
				if (file) formData.append(`images`, file);
			});
		}

		submit(formData, {
			method: "POST",
			action: "/tours/add",
			encType: "multipart/form-data",
		});
	}

	// useEffect(() => {
	// 	if (form.formState.errors) {
	// 		console.log("Errors: ", form.formState.errors);
	// 	}
	// }, [form.formState.errors]);

	return (
		<>
			<MetaDetails
				metaTitle="Add Tour | Admin Panel"
				metaDescription="Add new Tour"
				metaKeywords="Add Tour, New Tour"
			/>
			<section className="flex flex-col gap-4">
				<div className="flex gap-4 items-center">
					<BackButton href="/tours" />
					<h1 className="text-2xl font-semibold">Add Tour</h1>
				</div>
				<form className="space-y-4" onSubmit={handleSubmit(onFormSubmit)}>
					<Form {...form}>
						<div className="grid md:grid-cols-2 gap-4">
							{/* General Card */}
							<GeneralDetailsCard
								control={control}
								cities={cities}
								categories={categories}
								providers={providers}
							/>

							{/* Attributes Card */}
							<AttributesCard control={control} />
						</div>

						{/* Images Card */}
						<ImagesInputCard control={control} />

						{/* Tags Selection Card */}
						<TagsCard control={control} tags={tags} noTags={watchedTags.length === 0} />

						{/* MAIN Content Card */}
						<MainContentCard control={control} cancellation_policies={cancellation_policies} />

						{/* Options Card */}
						<TourOptionsCard control={control} participants={participants} />

						{/* Address Card */}
						<AddressCard control={control} />

						{/* Meta Details Card */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">SEO & Meta Attributes</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Meta Title */}
								<FormField
									control={control}
									name="meta_details.meta_title"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Meta Title</FormLabel>
											<FormControl>
												<Input
													placeholder="e.g. Ferrari World, Abu Dhabi"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								{/* Meta Description */}
								<FormField
									control={control}
									name="meta_details.meta_description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Meta Description</FormLabel>
											<FormControl>
												<Textarea
													placeholder="A short description for SEO"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								{/* Meta Keywords */}
								<FormField
									control={control}
									name="meta_details.meta_keywords"
									render={({ field, fieldState }) => (
										<FormItem>
											<FormLabel>Meta Keywords</FormLabel>
											<FormControl>
												<TagsInput
													value={field.value}
													onValueChange={field.onChange}
													max={MAX_META_KEYWORDS}
													editable
													addOnPaste
													className="w-full"
													aria-invalid={!!fieldState.error}
												>
													<div className="flex sm:flex-row flex-col gap-2">
														<TagsInputList>
															{field.value && Array.isArray(field.value)
																? field.value.map((item) => (
																		<TagsInputItem
																			key={item}
																			value={item}
																		>
																			{item}
																		</TagsInputItem>
																	))
																: null}
															<TagsInputInput placeholder="Add meta keywords..." />
														</TagsInputList>
														<CustomTagsInputClear />
													</div>
													<div className="text-muted-foreground text-sm">
														You can add up to {MAX_META_KEYWORDS} keywords
													</div>
												</TagsInput>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								{/* URL Key */}
								<FormField
									control={control}
									name="meta_details.url_key"
									render={({ field }) => (
										<FormItem>
											<div className="flex gap-2">
												<FormLabel>URL Key</FormLabel>
												<span className="text-muted-foreground text-sm">
													(Without spaces)
												</span>
											</div>
											<FormControl>
												<Input
													placeholder="e.g. ferrari-world-abu-dhabi-tour"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* Submit Button */}
						<div className="flex gap-4 justify-end md:col-span-3">
							<Link to={"/tours"} viewTransition prefetch="intent">
								<Button variant={"outline"}>Back</Button>
							</Link>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && <Loader2 className="animate-spin mr-2" />}
								<span>Add</span>
							</Button>
						</div>
					</Form>
				</form>
			</section>
		</>
	);
}

export type AddFormControlType = Control<AddTourInput>;
