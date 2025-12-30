import { zodResolver } from "@hookform/resolvers/zod";
import { MAX_META_KEYWORDS } from "@workspace/shared/constants/constants";
import { type AddTourInput, AddTourSchema } from "@workspace/shared/schemas/tour.schema";
import type { ActionResponse } from "@workspace/shared/types/action-data";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { type Control, useForm, useWatch } from "react-hook-form";
import { Link, useActionData, useLoaderData, useNavigate, useNavigation, useSubmit } from "react-router";
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

export const action = async ({ request }: { request: Request }) => {
	// const formData = await request.formData();
	// const data = {
	// 	name: formData.get("name") as string,
	// 	card_image: formData.get("card_image") as File,
	// 	full_image: formData.get("full_image") as File,
	// 	meta_details: {
	// 		meta_title: formData.get("meta_details.meta_title") as string,
	// 		meta_description: formData.get("meta_details.meta_description") as string,
	// 		url_key: formData.get("meta_details.url_key") as string,
	// 		meta_keywords: formData.get("meta_details.meta_keywords"),
	// 	},
	// };
	// const parseResult = AddCityActionSchema.safeParse(data);
	// if (!parseResult.success) {
	// 	return new Response(JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }), {
	// 		status: 400,
	// 		headers: { "Content-Type": "application/json" },
	// 	});
	// }
	// // console.log("Data in the action: ", parseResult.data);
	// const svc = new CityService(request);
	// // return;
	// try {
	// 	await svc.addCity(parseResult.data);
	// 	await queryClient.invalidateQueries({ queryKey: ["highLvlCities"] });
	// 	return { success: true };
	// } catch (error: any) {
	// 	return {
	// 		success: false,
	// 		error: error instanceof ApiError ? error.message : error.message || "Failed to add city",
	// 	};
	// }
};

export const loader = async () => {
	const cities = [
		{ id: 12, name: "Dubai" },
		{ id: 13, name: "Abu Dhabi" },
		{ id: 14, name: "Sharjah" },
	];

	const categories = [
		{ id: 142, name: "Sightseeing Tours" },
		{ id: 135, name: "Burj Khalifa Tour" },
		{ id: 114, name: "Cultural & Heritage Tours" },
		{ id: 154, name: "Water Parks Tours" },
		{ id: 194, name: "Theme Parks and Zoo Tours" },
	];

	const providers = [
		{ id: 1343, name: "Top Attractions Dubai Tours" },
		{ id: 1344, name: "Top Attractions Abu Dhabi Tours" },
		{ id: 1345, name: "Top Attractions Sharjah Tours" },
	];

	const tags = [
		{ id: 991, name: "Attractions" },
		{ id: 992, name: "Food and Drinks" },
		{ id: 993, name: "Families with Kids" },
		{ id: 9234, name: "Couple" },
		{ id: 9942, name: "Nature and Wildlife" },
		{ id: 995, name: "Culture and Heritage" },
		{ id: 996, name: "Day Trips" },
	];

	const cancellation_policies = [
		{ id: 333, policy: "Free cancellation available" },
		{ id: 334, policy: "Free cancellation not available" },
		{ id: 3242, policy: "Can be cancelled before 24 hours and arrival also." },
	];

	const participants = [
		{ id: 1, name: "Adult" },
		{ id: 2, name: "Child" },
		{ id: 3, name: "Infant" },
	];

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

	const actionData: ActionResponse = useActionData();

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
			cancellation_policy:
				cancellation_policies?.length > 0 ? (cancellation_policies[0].id.toString() as string) : "",
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
			tour_options: [],
			live_tour_guide: "false",
			live_tour_guide_langs: [],
		},
	});

	const { handleSubmit, setError, control } = form;

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("New tours added successfully");
				navigate(`/tours`);
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

	async function onFormSubmit(values: AddTourInput) {}

	useEffect(() => {
		if (form.formState.errors) {
			console.log(form.formState.errors);
		}
	}, [form.formState.errors]);

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
							<Link to={"/cities"} viewTransition prefetch="intent">
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

export type FormControlType = Control<AddTourInput>;
