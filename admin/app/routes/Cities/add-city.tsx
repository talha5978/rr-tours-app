import { zodResolver } from "@hookform/resolvers/zod";
import {
	CITY_CARD_IMG_DIMENSTIONS,
	CITY_FULL_IMG_DIMENSTIONS,
	MAX_META_KEYWORDS,
} from "@workspace/shared/constants/constants";
import { AddCityActionSchema, AddCityInput, AddCitySchema } from "@workspace/shared/schemas/city.schema";
import { cacheService } from "@workspace/shared/services/cache.service";
import { CityService } from "@workspace/shared/services/cities.service";
import type { ActionResponse } from "@workspace/shared/types/action-data";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";
import { Info, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useActionData, useNavigate, useNavigation, useSubmit } from "react-router";
import { toast } from "sonner";
import ImageInput from "~/components/Custom-Inputs/image-input";
import BackButton from "~/components/Nav/BackButton";
import { MetaDetails } from "~/components/SEO/MetaDetails";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";

export const action = async ({ request }: { request: Request }) => {
	const formData = await request.formData();

	const data = {
		name: formData.get("name") as string,
		card_image: formData.get("card_image") as File,
		full_image: formData.get("full_image") as File,
		meta_details: {
			meta_title: formData.get("meta_details.meta_title") as string,
			meta_description: formData.get("meta_details.meta_description") as string,
			url_key: formData.get("meta_details.url_key") as string,
			meta_keywords: formData.get("meta_details.meta_keywords"),
		},
	};

	const parseResult = AddCityActionSchema.safeParse(data);

	if (!parseResult.success) {
		return new Response(JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	// console.log("Data in the action: ", parseResult.data);

	const svc = new CityService(request);
	// return;
	try {
		await svc.addCity(parseResult.data);

		cacheService.invalidate(CACHE_KEYS.cities.highLevel("FP"));
		cacheService.invalidate(CACHE_KEYS.cities.list());
		await cacheService.invalidate(CACHE_KEYS.cities.highLevel("AD"));

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error instanceof ApiError ? error.message : error.message || "Failed to add city",
		};
	}
};

export const loader = async () => {
	return null;
};

export default function AddCityPage() {
	const navigate = useNavigate();

	const submit = useSubmit();
	const navigation = useNavigation();

	const actionData: ActionResponse = useActionData();

	const form = useForm<AddCityInput>({
		resolver: zodResolver(AddCitySchema),
		mode: "onSubmit",
		defaultValues: {
			name: "",
			card_image: undefined,
			full_image: undefined,
			meta_details: {
				meta_title: "",
				meta_description: "",
				url_key: "",
				meta_keywords: [],
			},
		},
	});

	const { handleSubmit, setError, control } = form;

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("New city added successfully");
				navigate(`/cities`);
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof AddCityInput, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate, setError]);

	async function onFormSubmit(values: AddCityInput) {
		if (!values.card_image) {
			toast.error("Please upload card image.");
			return;
		}

		if (!values.full_image) {
			toast.error("Please upload full image.");
			return;
		}

		const formData = new FormData();
		formData.set("name", values.name.trim());
		formData.set("card_image", values.card_image);
		formData.set("full_image", values.full_image);
		formData.set("meta_details.meta_title", values.meta_details.meta_title.trim());
		formData.set("meta_details.meta_description", values.meta_details.meta_description.trim());
		formData.set("meta_details.url_key", values.meta_details.url_key.trim().toLowerCase());
		if (values.meta_details.meta_keywords) {
			const stringifiedKeywords = values.meta_details.meta_keywords
				.map((keyword) => keyword.trim())
				.join(",");
			formData.set("meta_details.meta_keywords", stringifiedKeywords);
		}

		submit(formData, {
			method: "POST",
			action: "/cities/add",
			encType: "multipart/form-data",
		});
	}

	return (
		<>
			<MetaDetails
				metaTitle="Add City | Admin Panel"
				metaDescription="Add new city"
				metaKeywords="Add City, City"
			/>
			<section className="flex flex-col gap-4">
				<div className="flex gap-4 items-center">
					<BackButton href="/cities" />
					<h1 className="text-2xl font-semibold">Add City</h1>
				</div>
				<form className="space-y-4" onSubmit={handleSubmit(onFormSubmit)}>
					<Form {...form}>
						<div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
							{/* General Card */}
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">General</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* City Name */}
									<FormField
										control={control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>City Name</FormLabel>
												<FormControl>
													<Input placeholder="e.g. Dubai" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<div className="flex gap-4 w-full *:flex-1 lg:flex-row flex-col mt-4">
										{/* Card Image Upload */}

										<FormField
											control={control}
											name="card_image"
											render={() => (
												<FormItem>
													<FormLabel className="flex gap-2 items-center">
														<span>Card Image</span>
														<div className="md:inline hidden">
															<Tooltip>
																<TooltipTrigger asChild>
																	<Info className="size-4" />
																</TooltipTrigger>
																<TooltipContent>
																	<p>
																		This image will be shown in the city
																		card on the home page and categories
																		page.
																	</p>
																</TooltipContent>
															</Tooltip>
														</div>
													</FormLabel>
													<FormControl>
														<ImageInput
															name="card_image"
															dimensions={CITY_CARD_IMG_DIMENSTIONS}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										{/* Full Image Upload */}
										<FormField
											control={control}
											name="full_image"
											render={() => (
												<FormItem>
													<FormLabel className="flex gap-2 items-center">
														<span>Full Image</span>
														<div className="md:inline hidden">
															<Tooltip>
																<TooltipTrigger asChild>
																	<Info className="size-4" />
																</TooltipTrigger>
																<TooltipContent>
																	<p>
																		This image will be shown in the
																		hero-section of city page.
																	</p>
																</TooltipContent>
															</Tooltip>
														</div>
													</FormLabel>{" "}
													<FormControl>
														<ImageInput
															name="full_image"
															dimensions={CITY_FULL_IMG_DIMENSTIONS}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</CardContent>
							</Card>

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
													<Input placeholder="e.g. Dubai" {...field} />
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
													<Input placeholder="e.g. dubai" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>
						</div>

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
