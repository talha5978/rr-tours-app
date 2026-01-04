import { zodResolver } from "@hookform/resolvers/zod";
import { MAX_META_KEYWORDS } from "@workspace/shared/constants/constants";
import {
	AddTourActionSchema,
	type AddTourInput,
	type UpdateTourInput,
	UpdateTourSchema,
} from "@workspace/shared/schemas/tour.schema";
import { ToursService } from "@workspace/shared/services/tours.service";
import type { ActionResponse } from "@workspace/shared/types/action-data";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { queryClient } from "@workspace/shared/utils/query-client";
import { format } from "date-fns";
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
import { tourDetailsForUpdateQuery } from "~/queries/tours.q";

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

		const parseResult = AddTourActionSchema.safeParse({
			...rawBody,
			cover_image,
			images: images.filter((i) => i != null && i instanceof File),
		});

		// console.log(rawBody.tour_options.map((i) => i.availabilities));

		if (!parseResult.success) {
			return new Response(
				JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const tours_svc = new ToursService(request);
		const tour_id = await tours_svc.addTour(parseResult.data);

		await queryClient.invalidateQueries({ queryKey: ["high_level_tours"] });
		await queryClient.invalidateQueries({ queryKey: ["highLvlCategories"] });

		return { success: true, tour_id };
	} catch (error: any) {
		return {
			success: false,
			tour_id: null,
			error: error instanceof ApiError ? error.message : error.message || "Failed to add tour",
		};
	}
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	if (params.id == null || params.id == "") {
		throw new ApiError("Tour ID is required", 400, []);
	}

	const tour = await queryClient.fetchQuery(tourDetailsForUpdateQuery({ request, tour_id: params.id }));
	const cancellation_policies = await queryClient.fetchQuery(cancellationPoliciesQuery({ request }));
	const participants = await queryClient.fetchQuery(participantTypesQuery({ request }));
	const cities = await queryClient.fetchQuery(citiesListQuery({ request }));
	const tags = await queryClient.fetchQuery(allTagsQuery({ request }));
	const categories = await queryClient.fetchQuery(categoryListQuery({ request }));
	const providers = await queryClient.fetchQuery(allProvidersQuery({ request }));

	return {
		cities,
		categories,
		providers,
		tags,
		cancellation_policies,
		participants,
		tour,
	};
};

export default function UpdateTourPage() {
	const { cities, categories, providers, tags, cancellation_policies, participants, tour } =
		useLoaderData<typeof loader>();
	const navigate = useNavigate();

	if (tour == null) {
		toast.error("Error fetching tour!");
		navigate("/tours");
	}

	const submit = useSubmit();
	const navigation = useNavigation();

	// @ts-ignore
	const actionData: ActionResponse & { tour_id: string | null } = useActionData();

	const form = useForm<UpdateTourInput>({
		resolver: zodResolver(UpdateTourSchema),
		mode: "onSubmit",
		defaultValues: {
			name: tour?.name ?? "",
			city_id: tour?.city?.id.toString() ?? "",
			tour_category_id: tour?.tour_category?.id.toString() ?? "",
			provider: tour?.provider?.id.toString() ?? "",
			duration_minutes: tour?.duration_minutes?.toString() ?? "",
			isFeatured: tour?.isFeatured ? "true" : "false",
			isActive: tour?.isActive ? "true" : "false",
			free_cancelation_avilable: tour?.free_cancelation_avilable ? "true" : "false",
			isWeelChairAccessible: tour?.isWeelChairAccessible ? "true" : "false",
			tags: tour?.tags.map((i) => i.id.toString()) ?? [],
			overview: tour?.overview ?? "",
			highlights: tour?.highlights ?? "",
			know_before_you_go: tour?.know_before_you_go ?? "",
			cancellation_policy: tour?.cancellation_policy?.toString() ?? "",
			age_health_restrictions: tour?.age_health_restrictions ?? "",
			cover_image: tour?.cover_image ?? undefined,
			images: tour?.images ?? (Array.from({ length: 4 }).fill(undefined) as undefined[]),
			address_name: tour?.address_name ?? "",
			address_link: tour?.address_link ?? "",
			meta_details: {
				meta_title: tour?.meta_details?.meta_title || "",
				meta_description: tour?.meta_details?.meta_description || "",
				url_key: tour?.meta_details?.url_key || "",
				meta_keywords:
					tour?.meta_details?.meta_keywords == ""
						? []
						: tour?.meta_details?.meta_keywords?.split(",") || [],
			},
			tour_options: tour?.tour_options.map((option) => ({
				name: option.name ?? "",
				note: option.note ?? "",
				exclusions: option.exclusions ?? "",
				inclusions: option.inclusions ?? "",
				prices: option.prices.map((price) => ({
					price: price.price.toString() ?? "",
					participant: price.participant_type_id.toString() ?? "",
				})),
				sort_order: option?.sort_order.toString() ?? "1",
				isOpenDated: (option.isOpenDated ? "true" : "false") as "true" | "false",
				seat_type: option.availabilities[0].slots[0].seat_type ?? "LIMITED",
				availabilities: option.availabilities.map((availability) => ({
					date: availability.date,
					isActive: availability.isActive ? "true" : "false",
					timeslots: availability.slots.map((slot) => ({
						available_seats: slot.available_seats?.toString() ?? "0",
						label: slot.time_slot.label ?? "",
						time: slot.time_slot.time ?? "",
						sort_order: slot.time_slot.sort_order?.toString() ?? "1",
					})),
				})),
			})),
			live_tour_guide:
				tour?.live_tour_guide_langs != null && tour?.live_tour_guide_langs != "" ? "true" : "false",
			live_tour_guide_langs: tour?.live_tour_guide_langs?.split(",") ?? [],
		},
	});

	const { handleSubmit, setError, control } = form;

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success(tour?.name + " tour updated successfully");
				if (actionData.tour_id) {
					navigate("/tours/tour/" + actionData.tour_id);
				}
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof UpdateTourInput, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate, setError]);

	const watchedTags = useWatch({ control, name: "tags" }) ?? [];

	async function onFormSubmit(values: UpdateTourInput) {
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
			if (option.availabilities == null || option.availabilities.length === 0) {
				toast.error(`Please add at least one availability for tour option "${option.name}".`);
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

		for (const option of values.tour_options) {
			const seat_type = option.seat_type;
			if (option.availabilities) {
				for (const availability of option.availabilities) {
					for (const timeslot of availability.timeslots) {
						if (
							seat_type === "LIMITED" &&
							(timeslot.available_seats == null || timeslot.available_seats === "")
						) {
							toast.error(
								`Please add available seats for ${format(availability.date, "PP")} ${timeslot.label} timeslot in the tour option "${option.name}".`,
							);
							return;
						}

						if (timeslot.label != null) {
							timeslot.label = timeslot.label.trim();
						}

						if (seat_type === "UNLIMITED" && timeslot.available_seats != null) {
							timeslot.available_seats = null;
						}
					}
				}
			}
		}

		toast.warning("Notice", {
			description: "Tour Updation functionality is under development.",
		});

		// const formData = new FormData();

		// for (let key in values) {
		// 	if (typeof values[key as keyof UpdateTourInput] === "string") {
		// 		// @ts-ignore
		// 		values[key as keyof UpdateTourInput] = values[key].trim();
		// 	}
		// }

		// formData.append(
		// 	"payload",
		// 	JSON.stringify({
		// 		...values,
		// 		cover_image: undefined,
		// 		images: undefined,
		// 	}),
		// );

		// if (values.cover_image) {
		// 	formData.append("cover_image", values.cover_image);
		// }

		// if (values.images) {
		// 	values.images.forEach((file, _) => {
		// 		if (file) formData.append(`images`, file);
		// 	});
		// }

		// submit(formData, {
		// 	method: "POST",
		// 	action: "/tours/add",
		// 	encType: "multipart/form-data",
		// });
	}

	// useEffect(() => {
	// 	if (form.formState.errors) {
	// 		console.log("Errors: ", form.formState.errors);
	// 	}
	// }, [form.formState.errors]);

	return (
		<>
			<MetaDetails
				metaTitle={"Update " + tour?.name + " Tour | Admin Panel"}
				metaDescription={"Update" + tour?.name + " Tour"}
				metaKeywords="Update Tour, New Tour"
			/>
			<section className="flex flex-col gap-4">
				<div className="flex gap-4 items-center">
					<BackButton href="/tours" />
					<h1 className="text-2xl font-semibold">Update Tour</h1>
				</div>
				<form className="space-y-4" onSubmit={handleSubmit(onFormSubmit)}>
					<Form {...form}>
						<div className="grid md:grid-cols-2 gap-4">
							{/* General Card */}
							<GeneralDetailsCard
								control={control as any}
								cities={cities}
								categories={categories}
								providers={providers}
							/>

							{/* Attributes Card */}
							<AttributesCard control={control as any} />
						</div>

						{/* Images Card */}
						<ImagesInputCard control={control as any} />

						{/* Tags Selection Card */}
						<TagsCard control={control as any} tags={tags} noTags={watchedTags.length === 0} />

						{/* MAIN Content Card */}
						<MainContentCard
							control={control as any}
							cancellation_policies={cancellation_policies}
						/>

						{/* Options Card */}
						<TourOptionsCard control={control as any} participants={participants} />

						{/* Address Card */}
						<AddressCard control={control as any} />

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
								<span>Update</span>
							</Button>
						</div>
					</Form>
				</form>
			</section>
		</>
	);
}

export type UpdateFormControlType = Control<UpdateTourInput>;
